import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";

const UpdateEmployeeModel = ({ isOpen, onClose, getEmployees, selected }) => {
  if (!isOpen) return null;

  const modalRef = useRef();
  const [formData, setFormData] = useState({
    emp_name: "",
    emp_email: "",
    emp_phone: "",
    emp_role: "employee",
    emp_designation: "",
    emp_status: "active",
  });

  const apiUrl = import.meta.env.VITE_API_URL;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selected) {
      setFormData({ ...selected });
    }
  }, [selected]);

  console.log("selected", selected);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // -----------------------------------------
  // Handle form changes
  // -----------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "emp_phone") {
      const phone = value.replace(/\D/g, "").slice(0, 10);

      setFormData((prev) => ({
        ...prev,
        [name]: phone,
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // -----------------------------------------
  // Submit
  // -----------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await axios.put(
        `${apiUrl}/api/auth/update-employee/${selected?.emp_id}`,
        formData,
      );

      if (response.data.success) {
        toast.success(response.data.message);
        await getEmployees();
        onClose();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update attendance.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div
          ref={modalRef}
          className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6"
        >
          {/* Header */}
          <div className="mb-6 border-b pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-blue-800 tracking-wide">
                Add New Employee
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-red-500 transition"
            >
              <IoClose className="text-2xl" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700 text-sm"
          >
            {/* Check In */}
            <div>
              <label className="block mb-1 font-semibold">Name*</label>

              <input
                type="text"
                name="emp_name"
                value={formData.emp_name}
                onChange={handleChange}
                required
                placeholder="Enter Name"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Email*</label>

              <input
                type="email"
                name="emp_email"
                placeholder="Enter Email"
                value={formData.emp_email}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Phone*</label>

              <input
                type="text"
                name="emp_phone"
                value={formData.emp_phone}
                placeholder="Enter Phone"
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Role</label>

              <select
                name="emp_role"
                value={formData.emp_role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">--select--</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-semibold">Designation*</label>

              <input
                type="text"
                name="emp_designation"
                value={formData.emp_designation}
                onChange={handleChange}
                required
                placeholder="Enter Designation"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block mb-1 font-semibold">Status*</label>

              <select
                name="emp_status"
                value={formData.emp_status}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">--select--</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="col-span-full flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 rounded-lg ${
                  loading ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
                } text-white font-medium shadow transition`}
              >
                {loading ? "Save Changes...." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UpdateEmployeeModel;
