import { useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from "../../redux/admin/adminSlice";
import toast from "react-hot-toast";

const LoginPage = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const user = useSelector((state) => state?.user?.currentUser);
  console.log(user);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!phone || !password) {
      toast.error("Please enter Employee Phone and Password");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${apiUrl}/api/auth/login`, {
        emp_phone: phone,
        emp_password: password,
      });

      dispatch(setUser(res.data));
      navigate("/dashboard");
      toast.success("Login successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Login Failed",
      );
    } finally {
      setLoading(false);
    }
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

          <h2 className="text-3xl font-bold text-red-900 mt-4">Welcome Back</h2>

          <p className="text-gray-500 mt-2">Sign into your account</p>
        </div>

        {/* Form */}
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
              className="w-full h-12 border rounded-xl px-4 outline-none focus:border-yellow-600"
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
                className="w-full h-12 border rounded-xl px-4 pr-20 outline-none focus:border-yellow-600"
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-8 text-sm">
          Print Management System
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
