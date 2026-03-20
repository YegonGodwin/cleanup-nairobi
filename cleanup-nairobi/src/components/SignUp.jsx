import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Leaf,
  MapPin,
  Mail,
  Lock,
  User,
  Phone,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

// Import a background image for the hero section
import NairobiBg from "../../public/assets/four.jpeg"; // Make sure to have a suitable image in this path

const SignUp = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    confirmEmail: "",
    phone: "",
    password: "",
    confirmPassword: "",
    location: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState({});
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nairobiLocations = [
    "Westlands",
    "Kilimani",
    "Parklands",
    "Lavington",
    "Karen",
    "Runda",
    "Kileleshwa",
    "South B",
    "South C",
    "Langata",
    "Kasarani",
    "Embakasi",
    "Ruaraka",
    "Dagoretti",
    "Kibera",
    "Mathare",
    "Eastleigh",
    "Ngara",
    "Pangani",
    "Huruma",
  ];

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (formData.email !== formData.confirmEmail)
      newErrors.confirmEmail = "Emails do not match";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, "")))
      newErrors.phone = "Please enter a valid 10-digit phone number";
    if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.location) newErrors.location = "Please select your location";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        location: formData.location,
      };

      const result = await register(payload);

      if (result.success) {
        toast.success("Registration successful! Welcome to CleanUp Nairobi!");

        // Navigate to appropriate dashboard based on user role
        if (result.user && result.user.role === "Admin") {
          navigate("/admin/dashboard");
        } else if (result.user && result.user.role === "Driver") {
          navigate("/driver/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        toast.error(result.error || "Registration failed");
        setErrors({ form: result.error || "Registration failed" });
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Registration failed. Please try again.");
      setErrors({ form: "Registration failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Hero Section */}
      <div
        className="relative hidden lg:flex flex-col justify-between p-12 bg-cover bg-center text-white"
        style={{ backgroundImage: `url(${NairobiBg})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative z-10">
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Leaf className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-wider">
              Cleanup Nairobi
            </h1>
          </Link>
        </div>
        <div className="relative z-10">
          <h2 className="text-5xl font-bold leading-tight mb-4">
            Join the Movement to a Cleaner City.
          </h2>
          <p className="text-xl text-gray-200 max-w-lg">
            Become a part of our community dedicated to making Nairobi a
            greener, more sustainable home for everyone.
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex flex-col justify-center items-center w-full bg-gray-50 p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800">
              Create Your Account
            </h2>
            <p className="text-gray-600 mt-2">
              Already have an account?{" "}
              <Link
                to="/"
                className="font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Log in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Full Name"
                className={`w-full pl-12 pr-4 py-3 border ${
                  errors.fullName ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                className={`w-full pl-12 pr-4 py-3 border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Confirm Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="confirmEmail"
                type="email"
                value={formData.confirmEmail}
                onChange={handleChange}
                placeholder="Confirm Email Address"
                className={`w-full pl-12 pr-4 py-3 border ${
                  errors.confirmEmail ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              {errors.confirmEmail && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.confirmEmail}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                className={`w-full pl-12 pr-4 py-3 border ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="Create Password"
                className={`w-full pl-12 pr-12 py-3 border ${
                  errors.password ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.password && (
              <div className="flex items-center space-x-2">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                  <div
                    className={`h-full rounded-full ${getPasswordStrengthColor()}`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {passwordStrength <= 1
                    ? "Weak"
                    : passwordStrength <= 3
                    ? "Medium"
                    : "Strong"}
                </span>
              </div>
            )}
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className={`w-full pl-12 pr-12 py-3 border ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Location Dropdown */}
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <button
                type="button"
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className={`w-full pl-12 pr-10 py-3 text-left border ${
                  errors.location ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              >
                {formData.location || "Select your location"}
              </button>
              <ChevronDown
                className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform ${
                  isLocationOpen ? "rotate-180" : ""
                }`}
              />
              {isLocationOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {nairobiLocations.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, location: loc }));
                        setIsLocationOpen(false);
                        if (errors.location)
                          setErrors((prev) => ({ ...prev, location: "" }));
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-emerald-50"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
              {errors.location && (
                <p className="mt-1 text-xs text-red-500">{errors.location}</p>
              )}
            </div>

            {errors.form && (
              <p className="text-sm text-red-500 text-center">{errors.form}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
            >
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </button>

            <div className="relative flex items-center justify-center my-6">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-500">
                Or continue with
              </span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google icon"
                className="w-6 h-6 mr-3"
              />
              <span className="font-semibold text-gray-700">
                Sign Up with Google
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
