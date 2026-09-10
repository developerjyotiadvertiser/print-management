import { Toaster } from "react-hot-toast";
import { useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import ScrollToTop from "./utils/ScrollToTop";
import Navbar from "./components/Navbar";
import { Route, Routes, useNavigate } from "react-router-dom";
import UserPrint from "./pages/UserPrint";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import ChallanPage from "./pages/ChallanPage";

const App = () => {
  const user = useSelector((state) => state?.user?.currentUser);
  const navigate = useNavigate();

  const escCount = useRef(0);
  const escTimer = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;

      escCount.current += 1;

      // If Esc is pressed twice
      if (escCount.current === 2) {
        navigate("/");
        escCount.current = 0;

        clearTimeout(escTimer.current);
        return;
      }

      // Reset count if second Esc is not pressed quickly
      clearTimeout(escTimer.current);

      escTimer.current = setTimeout(() => {
        escCount.current = 0;
      }, 500);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(escTimer.current);
    };
  }, [navigate]);

  return (
    <>
      <Toaster />
      <ScrollToTop />

      {user && <Navbar />}

      <Routes>
        <Route
          path="/"
          element={
            user ? (
              user?.user?.emp_role === "employee" ? (
                <UserPrint />
              ) : (
                <AdminDashboard />
              )
            ) : (
              <LoginPage />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            user ? (
              user?.user?.emp_role === "employee" ? (
                <UserPrint />
              ) : (
                <AdminDashboard />
              )
            ) : (
              <LoginPage />
            )
          }
        />

        {user && user?.user?.emp_role !== "employee" && (
          <Route path="/print-challan" element={<ChallanPage />} />
        )}
      </Routes>
    </>
  );
};

export default App;
