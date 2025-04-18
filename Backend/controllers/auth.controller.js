const User = require(`../model/user.model`);
const customErrors = require(`../errors/index`);
const { StatusCodes } = require(`http-status-codes`);
const { createTokenUser, attachCookiesToResponse } = require(`../utils`);
const crypto = require(`crypto`);
const {
  sendVerificationEmail,
  sendPartnerVerificationEmail,
  sendResetPasswordEmail,
  createHash,
} = require(`../utils`);
const Token = require("../model/token");
const cloudinary = require("cloudinary").v2;
const fs = require(`fs`);

const register = async (req, res) => {
  console.log("in register");
  const { name, email, password , role} = req.body;
  console.log(name, email, password, role);
  if (!name || !email || !password) {
    throw new customErrors.BadRequestError(
      "Please provide all the credentials"
    );
  }
  const tempRole=role || "user";
  const Role="user"; // just to check will chenge it to user

  const verificationToken = crypto.randomBytes(40).toString("hex");

  const existingUser = await User.findOne({ email: email });

  if (existingUser!==null && existingUser.isVerified==true) {
    throw new customErrors.BadRequestError("User already exists");
  }
  if (existingUser !== null && existingUser.isVerified == false)
    await User.deleteOne({ email: email });
  const user = await User.create({
    name,
    email,
    password,
    role:Role,
    verificationToken,
  });
  const origin = `http://localhost:5173`;
  await sendVerificationEmail({
    id: user._id,
    email: user.email,
    name: user.name,
    verificationToken: user.verificationToken,
    origin,
    role:tempRole,
  });
  res
    .status(StatusCodes.CREATED)
    .json({ msg: "Success!! Please verify your email account" });
};

const verifyEmail = async (req, res) => {
  console.log("in verifyEmail");
  const { token: verificationToken, email, id , role} = req.query;
  const user = await User.findOne({ _id: id });
  if (!user) {
    throw new customErrors.UnauthenticatedError("Verification Failed");
  }
  if (user.verificationToken !== verificationToken) {
    throw new customErrors.UnauthenticatedError(
      "Verification Failed -> user.verificationToken !== verificationToken"
    );
  }
  user.isVerified = true;
  user.email = email;
  user.verified = Date.now();
  user.verificationToken = "";
  
  if(role && role==="owner"){
    const origin = `http://localhost:5173`;
    await sendPartnerVerificationEmail({
      id: user._id,
      email: user.email,
      name: user.name,
      origin,
      role,
    });
  }
  await user.save();
  res.status(StatusCodes.OK).json({ msg: "Email Verified" });
};

const login = async (req, res) => {
  console.log("in login");
  const { email, password } = req.body;
  if (!email && !password) {
    throw new customErrors.BadRequestError(
      "Please provide all the credentials"
    );
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new customErrors.UnauthenticatedError(
      `No user registered with email ${email}`
    );
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new customErrors.UnauthenticatedError("Wrong password");
  }
  if (!user.isVerified) {
    throw new customErrors.UnauthenticatedError(
      "Your account has not been verified yet"
    );
  }

  const tokenUser = createTokenUser(user);
  let refreshToken = "";

  const existingToken = await Token.findOne({ user: user._id });
  if (existingToken) {
    console.log("existing token is present");
    const { isValid } = existingToken;
    if (!isValid) {
      throw new customErrors.UnauthenticatedError(
        "Your account has been banned"
      );
    }
    refreshToken = existingToken.refreshToken;
    attachCookiesToResponse({ res, user: tokenUser, refreshToken });
    res.status(StatusCodes.OK).json({ user: tokenUser, image: user.image ,success:true});
    return;
  }

  refreshToken = crypto.randomBytes(40).toString("hex");
  const userAgent = req.headers["user-agent"];
  const ip = req.ip;
  const userToken = { refreshToken, ip, userAgent, user: user._id };

  await Token.create(userToken);
  console.log(tokenUser);
  attachCookiesToResponse({ res, user: tokenUser, refreshToken });
  res.status(StatusCodes.OK).json({ user: tokenUser, image: user.image });
};

const logout = async (req, res) => {
  console.log("in logout");
  await Token.findOneAndDelete({ user: req.user.userId });

  res.cookie(`accessToken`, "AccessTokenLogout", {
    httpOnly: true,
    expiresIn: new Date(Date.now() /*+ 5*1000*/),
  });

  res.cookie(`refreshToken`, "RefreshTokenLogout", {
    httpOnly: true,
    expiresIn: new Date(Date.now() /*+ 5*1000*/),
  });

  res.status(StatusCodes.OK).json({ msg: "user logged out" });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new customErrors.BadRequestError("Please provide email ID");
  }
  const user = await User.findOne({ email });
  if (user) {
    const passwordToken = crypto.randomBytes(70).toString("hex");
    const origin = "http://localhost:5173";

    await sendResetPasswordEmail({
      name: user.name,
      email: user.email,
      token: passwordToken,
      origin,
    });

    const tenMinutes = 1000 * 60 * 10;
    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

    user.passwordToken = createHash(passwordToken);
    user.passwordTokenExpirationDate = passwordTokenExpirationDate;

    await user.save();
  }
  res
    .status(StatusCodes.OK)
    .json({ msg: `Please check your email for reset password link` });
};

const resetPassword = async (req, res) => {
  const { email, token } = req.query;
  const { password } = req.body;
  if (!email || !token || !password) {
    throw new customErrors.BadRequestError(`Please provide all the values`);
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new customErrors.BadRequestError("User not found");
  }
  const hashedToken = createHash(token);
  if (user.passwordToken !== hashedToken) {
    throw new customErrors.BadRequestError("Invalid token for this user");
  }
  const currentDate = new Date();
  if (user.passwordTokenExpirationDate <= currentDate) {
    throw new customErrors.BadRequestError("Link expired, please try again");
  }
  user.password = password;
  user.passwordToken = null;
  user.passwordTokenExpirationDate = null;
  await user.save();
  res.status(StatusCodes.OK).json({ msg: "Password changed successfully" });
};

const checkAuth = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user });
};

const updateUser = async (req, res) => {
  const { image, name, email , phone, location } = req.body;
  const user = await User.findOne({ _id: req.user.userId });
  if (!user) throw new customErrors.notFoundError("User not found");
  if(phone!==undefined && phone!=="")user.phone=phone
  if (name !== undefined && name !== "") user.name = name;
  if (image !== undefined && image !== "") user.image = image;
  if(location !== undefined && location !== "") user.location = location;

  let emailChanged = false;
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      throw new customErrors.BadRequestError("User already exists");

    const verificationToken = crypto.randomBytes(40).toString("hex");
    user.verificationToken = verificationToken;

    const origin = `http://localhost:5173`;
    await sendVerificationEmail({
      id: user._id,
      email,
      name: name || user.name,
      verificationToken,
      origin,
    });
    emailChanged = true;
  }

  await user.save();

  await Token.deleteMany({ user: user._id });

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const userAgent = req.headers["user-agent"];
  const ip = req.ip;

  const newToken = await Token.create({
    refreshToken,
    ip,
    userAgent,
    user: user._id,
  });

  const tokenUser = createTokenUser(user);
  console.log(tokenUser);
  attachCookiesToResponse({ res, user: tokenUser, refreshToken });

  if (emailChanged) {
    return res
      .status(StatusCodes.OK)
      .json({ user: req.user });
      
  } 
    return res
      .status(StatusCodes.OK)
      .json({ user: req.user });
  
};


const uploadImages = async (req, res) => {
    const user = await User.findOne({ _id: req.user.userId });
    if (!user) {
      throw new customErrors.notFoundError("User not found");
    }

    if (!req.files || !req.files.image) {
      throw new customErrors.BadRequestError("Invalid file upload request");
    }

    console.log("Valid file format received");

    const file = req.files.image;

    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      use_filename: true,
      folder: "SmartParkingUserProfile",
    });

    fs.unlinkSync(file.tempFilePath);
    user.image = result.secure_url;
    await user.save();

    res.status(StatusCodes.OK).json({ user });
};



module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  checkAuth,
  updateUser,
  uploadImages,
};
