import { Toaster } from "react-hot-toast";
import { useSelector } from "react-redux";
import ScrollToTop from "./utils/ScrollToTop";
import Navbar from "./components/Navbar";
import { Route, Routes } from "react-router-dom";
import UserPrint from "./pages/UserPrint";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";

const App = () => {
  const user = useSelector((state) => state?.user?.currentUser);
  console.log(user);

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
      </Routes>
    </>
  );
};

export default App;
