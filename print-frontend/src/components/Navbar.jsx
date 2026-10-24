import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineMenuAlt3, HiOutlineX } from "react-icons/hi";
import logo from "../assets/logo.png";
import { clearUser } from "../../redux/admin/adminSlice";
import { useDispatch, useSelector } from "react-redux";
import MediaMasterModel from "./PopupWindows/MediaMasterModel";
import { FaPowerOff } from "react-icons/fa";

// const navItems = [
//   { name: "HOME", path: "/" },
//   { name: "CHALLAN", path: "/print-challan" },
// ];

const Navbar = () => {
  const user = useSelector((state) => state?.user?.currentUser);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [masterModel, setMasterModel] = useState(false);

  // const filteredNavItems = user?.user?.emp_role === "employee" ? [] : navItems;

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logoutHandler = () => {
    const isConfirmed = window.confirm("Are you sure you want to Logout?");
    if (isConfirmed) {
      dispatch(clearUser());
      navigate("/");
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "bg-transparent backdrop-blur-md shadow-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-8xl">
          <div
            className={`relative flex items-center justify-between px-5 md:px-8 lg:px-10 py-3 overflow-hidden transition-all duration-300 lg:rounded-none lg:bg-white lg:shadow-none`}
          >
            <div className="">
              {/* Logo */}
              <Link to="/">
                <img
                  src={logo}
                  alt="Jyoti Advertisers Logo"
                  className="h-11 md:h-14 w-auto object-contain"
                />
              </Link>
            </div>

            <div>
              <p className="text-blue-500 text-end py-2 font-semibold">
                {user?.user?.emp_name}
              </p>
              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-4">
                {user && user?.user?.emp_role !== "employee" && (
                  <>
                    <button
                      onClick={() => {
                        navigate("/work-order-jobs");
                      }}
                      className="rounded-lg bg-[#156a58] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#00b894] cursor-pointer"
                    >
                      Print + WO
                    </button>
                  </>
                )}

                {user?.user?.emp_role !== "accountant" && (
                  <>
                    <button
                      onClick={() => {
                        navigate("/dashboard");
                      }}
                      className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 cursor-pointer"
                    >
                      HP Latex
                    </button>
                    <button
                      onClick={() => {
                        navigate("/print-challan");
                      }}
                      className="rounded-lg bg-[#d35400] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#f39c12] cursor-pointer"
                    >
                      Challan
                    </button>
                  </>
                )}

                <button
                  onClick={logoutHandler}
                  className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  <FaPowerOff />
                </button>
              </nav>
            </div>

            {/* Mobile Button */}
            <button
              onClick={() => setMenuOpen(true)}
              className={`lg:hidden transition-colors duration-300 text-black`}
            >
              <HiOutlineMenuAlt3 className="text-3xl" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.35 }}
                className="fixed top-0 right-0 h-screen w-80 max-w-[90%] bg-white shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-black/60 p-6">
                  <img src={logo} alt="logo" className="h-12 object-contain" />

                  <button
                    onClick={() => setMenuOpen(false)}
                    className="text-black"
                  >
                    <HiOutlineX className="text-3xl" />
                  </button>
                </div>

                {/* <nav className="mt-6">
                {filteredNavItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.07 }}
                  >
                    <NavLink
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `block border-b border-white/10 px-8 py-5 text-sm font-semibold tracking-wider transition ${
                          isActive
                            ? "text-black bg-white/10"
                            : "text-gray-900 hover:bg-white/5 hover:text-black"
                        }`
                      }
                    >
                      {item.name}
                    </NavLink>
                  </motion.div>
                ))}
              </nav> */}

                <div className="px-6 mt-8">
                  <button
                    onClick={() => {
                      navigate("/work-order-jobs");
                    }}
                    className="rounded-lg bg-green-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700 cursor-pointer"
                  >
                    Print + WO
                  </button>
                </div>

                {user?.user?.emp_role !== "employee" &&
                  user?.user?.emp_role !== "accountant" && (
                    <>
                      <div className="px-6 mt-8">
                        <button
                          onClick={() => {
                            navigate("/print-challan");
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-white bg-yellow-600 hover:bg-yellow-700 transition cursor-pointer"
                        >
                          + Challan
                        </button>
                      </div>

                      <div className="px-6 mt-8">
                        <button
                          onClick={() => {
                            setMasterModel(true);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-white bg-[#1465ec] hover:bg-blue-600 transition cursor-pointer"
                        >
                          + Media
                        </button>
                      </div>
                    </>
                  )}

                <div className="px-6 mt-8">
                  <button
                    onClick={logoutHandler}
                    className="w-full rounded-lg bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
      <MediaMasterModel
        isOpen={masterModel}
        onClose={() => setMasterModel(false)}
      />
    </>
  );
};

export default Navbar;
