import { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from "../../redux/admin/adminSlice";
import toast from "react-hot-toast";

const LoginPage = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [loginData, setLoginData] = useState(null);

  // STEP 1:
  // Verify Employee ID + Password, then send OTP
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error("Please enter Employee ID and Password");
      return;
    }

    try {
      setLoading(true);
      const loginRes = await axios.post(`${apiUrl}/api/auth/login`, {
        emp_phone: phone,
        emp_password: password,
      });

      if (!loginRes.data?.success) {
        toast.error(loginRes.data?.message || "Invalid credentials");
        return;
      }

      const employeeEmail =
        loginRes.data?.user?.emp_email ||
        loginRes.data?.data?.emp_email ||
        loginRes.data?.emp_email;

      if (!employeeEmail) {
        toast.error("Employee email not found");
        return;
      }

      setLoginData(loginRes.data);
      const otpRes = await axios.post(`${apiUrl}/api/auth/send-otp`, {
        email: "sales@jyotiadvertiser.com",
      });

      if (!otpRes.data?.success) {
        toast.error(otpRes.data?.message || "Failed to send OTP");
        return;
      }

      setEmail(employeeEmail);
      setOtpSent(true);
      toast.success(otpRes.data?.message || "OTP sent successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2:
  // Verify OTP and complete login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error("Please enter OTP");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${apiUrl}/api/auth/verify-otp`, {
        email: "sales@jyotiadvertiser.com",
        otp,
      });

      if (!res.data?.success) {
        toast.error(res.data?.message || "Invalid OTP");
        return;
      }

      // OTP verified successfully
      dispatch(setUser(loginData));
      toast.success("Login successfully");
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "OTP verification failed",
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${apiUrl}/api/auth/send-otp`, {
        email,
      });

      if (res.data?.success) {
        toast.success(res.data?.message || "OTP sent successfully");
      } else {
        toast.error(res.data?.message || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // Go back to login screen
  const handleBack = () => {
    setOtpSent(false);
    setOtp("");
    setEmail("");
    setLoginData(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center">
          <img
            src="https://res.cloudinary.com/clyskac7/image/upload/v1784194896/logo_nnspfq.png"
            alt="Logo"
            className="w-40 mx-auto"
          />
          <h2 className="text-3xl font-bold text-red-900 mt-4">
            {otpSent ? "Verify OTP" : "Welcome Back"}
          </h2>
          <p className="text-gray-500 mt-2">
            {otpSent
              ? "Enter the OTP sent to your registered email"
              : "Sign into your account"}
          </p>
        </div>

        {/* LOGIN FORM */}
        {!otpSent && (
          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Employee ID
              </label>
              <input
                type="text"
                placeholder="Enter Employee ID"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="w-full h-12 border rounded-xl px-4 outline-none focus:border-yellow-600 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full h-12 border rounded-xl px-4 pr-20 outline-none focus:border-yellow-600 disabled:bg-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 font-medium"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-semibold transition disabled:opacity-50"
            >
              {loading ? "Please wait..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* OTP FORM */}
        {otpSent && (
          <form className="mt-8 space-y-5" onSubmit={handleVerifyOtp}>
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Enter OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter OTP"
                value={otp}
                maxLength={6}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setOtp(value);
                }}
                disabled={loading}
                className="w-full h-14 border rounded-xl px-4 text-center text-xl tracking-[0.4em] outline-none focus:border-yellow-600 disabled:bg-gray-100"
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full h-12 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-semibold transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}
        <p className="text-center text-gray-400 mt-8 text-sm">
          Print Management System
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
