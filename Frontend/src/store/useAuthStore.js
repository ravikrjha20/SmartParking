import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const BASE_URL = "http://localhost:5000"; // Fixed missing "//"

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isCheckingAuth: true,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            console.log("Auth check response:", res.data);
            set({ authUser: res.data });
        } catch (error) {
            console.error("Error in checkAuth:", error);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {
        console.log("Signup data:", data);
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post(`/auth/register`, {
                name: data.fullName,
                email: data.email,
                password: data.password,
            });
            console.log("Signup response:", res.data);
            toast.success("Account created successfully, verify your email");
        } catch (error) {
            console.error("Signup error:", error);
            toast.error(error.response?.data?.message || "Signup failed");
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        console.log("Login attempt with:", data);
        set({ isLoggingIn: true });
        try {
            const res = await axiosInstance.post(`/auth/login`, {
                email: data.email,
                password: data.password,
            });
            console.log("Login response:", res.data);

            // Ensure Zustand updates correctly
            set((state) => ({
                ...state,
                authUser: res.data.user,
            }));

            toast.success("Logged in successfully");

            // Debug if authUser is updated properly
            setTimeout(() => {
                console.log("Updated authUser in Zustand:", get().authUser);
            }, 100);
        } catch (error) {
            console.error("Login error:", error);
            toast.error(error.response?.data?.message || "Login failed");
            set({ authUser: null });
        } finally {
            set({ isLoggingIn: false });
        }
    },

    forgotPassword: async (data) => {
        console.log("Forgot password request:", data);
        try {
            const res = await axiosInstance.post(`/auth/forgotPassword`, {
                email: data.email,
            });
            console.log("Forgot password response:", res.data);
            toast.success("Reset password email sent successfully");
        } catch (error) {
            console.error("Forgot password error:", error);
            toast.error(error.response?.data?.message || "Request failed");
        }
    },
}));
