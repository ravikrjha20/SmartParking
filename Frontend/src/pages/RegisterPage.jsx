import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Car, Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthImagePattern from '../components/AuthImagePattern';  
import isEmail from 'validator/lib/isEmail';

const RegisterPage = () => {
    console.log("in register");
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: ""
    });
    const { signup, isSigningUp } = useAuthStore();

    const validateForm = () => {
        if (!formData.fullName.trim()) return toast.error("Full Name is required");
        if (!formData.email.trim()) return toast.error("Email is required");
        if (!isEmail(formData.email)) return toast.error("Invalid Email");
        if (!formData.password.trim()) return toast.error("Password is required");
        if (formData.password.length < 6) return toast.error("Password must be at least 6 characters");
        return true;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = validateForm();
        if(success) {
            await signup(formData);
            navigate('/send-email');
        }
    };
    return (
        <div className='min-h-screen grid lg:grid-cols-2'>
        {/* left side */}
        <div className="flex flex-col justify-center items-center p-6 sm:p-12">
            <div className="w-full max-w-md space-y-8">
            {/* LOGO */}
            <div className="text-center mb-8">
                <div className="flex flex-col items-center gap-2 group">
                <div className='size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors'>
                    <Car className='size-6 text-primary' />
                </div>
                <h1 className='text-2xl font-bond mt-2'>Create Account</h1>
                <p className="text-base-content/60">Welcome to our Smart Parking - create free account now</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="form-control">
                <label className="label">
                    <span className="label-text font-medium">Full Name</span>
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className='size-5 text-base-control/40' />
                    </div>
                    <input
                    type="text"
                    className="input input-bordered w-full pl-10"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                </div>
                </div>

                <div className="form-control">
                <label className="label">
                    <span className="label-text font-medium">Email</span>
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className='size-5 text-base-control/40' />
                    </div>
                    <input
                    type="email"
                    className="input input-bordered w-full pl-10"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                </div>

                <div className="form-control">
                <label className="label">
                    <span className="label-text font-medium">Password</span>
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="size-5 text-base-content/40" />
                    </div>
                    <input
                    type={showPassword ? "text" : "password"}
                    className={`input input-bordered w-full pl-10`}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    >
                    {showPassword ? (
                        <EyeOff className="size-5 text-base-content/40" />
                    ) : (
                        <Eye className="size-5 text-base-content/40" />
                    )}
                    </button>
                </div>
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={isSigningUp}>
                {isSigningUp ? (
                    <>
                    <Loader2 className="size-5 animate-spin" />
                    Loading...
                    </>
                ) : (
                    "Create Account"
                )}
                </button>
            </form>

            <div className="text-center">
                <p className="text-base-content/60">
                Already have an account?{" "}
                <Link to="/login" className="link link-primary">
                    Sign in
                </Link>
                </p>
            </div>
            </div>
        </div>

        {/* RIGHT SIDE */}
        <AuthImagePattern
            title="Be part of the family"
            subtitle="No more circling, no more stress—find your perfect parking spot in seconds!"
        />
        </div>
    )
}

export default RegisterPage