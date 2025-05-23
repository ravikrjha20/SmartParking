const express = require("express");
const router = express.Router();
const {
  createParking,
  getAllParkingGoogleMap,
  addFloor,
  bookParking,
  getMyParking,
  getSingleParking,
  deleteFloor,
  updateParking,
} = require("../controllers/parkingController");

const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authentication");

router.post(
  "/createParking",
  authenticateUser,
  authorizePermissions("owner", "admin"),
  createParking
);
router.get("/getAllParking", getAllParkingGoogleMap);
router.post("/bookParking", authenticateUser, bookParking);
router.get(
  "/getMyParking",
  authenticateUser,
  authorizePermissions("owner", "admin"),
  getMyParking
);
router.patch(
  "/updateParking",
  authenticateUser,
  authorizePermissions("owner", "admin"),
  updateParking,
);
router.post(
  "/addFloor",
  authenticateUser,
  authorizePermissions("owner", "admin"),
  addFloor
);
router.delete(
  "/deleteFloor",
  authenticateUser,
  authorizePermissions("owner", "admin"),
  deleteFloor
);
router.get("/getSingleParking", getSingleParking);
module.exports = router;
