import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";

const UpdatePrinterMasterModel = ({
  isPrintMasterOpen,
  onPrintMasterClose,
  getAllPrinterMaster,
  selected,
}) => {
  const modalRef = useRef();
  const [formData, setFormData] = useState({
    printer_name: "",
    pm_status: "",
  });
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    setFormData({
      ...formData,
      printer_name: selected?.printer_name,
      pm_status: selected?.pm_status,
    });
  }, [selected]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.put(
        `${apiUrl}/api/printer-master/update-printer-master/${selected?.pm_id}`,
        formData,
      );

      if (response.data.success) {
        toast.success(response.data.message);
        await getAllPrinterMaster();
        onPrintMasterClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  // CLOSE MODAL
  const handleClose = () => {
    if (loading) return;
    onPrintMasterClose();
  };

  // Close when clicking outside
  useEffect(() => {
    if (!isPrintMasterOpen) return;

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPrintMasterOpen, loading]);

  // Close on ESC
  useEffect(() => {
    if (!isPrintMasterOpen) return;

    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isPrintMasterOpen, loading]);

  if (!isPrintMasterOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-semibold text-blue-800">
            Update Printer Master
          </h2>
          <button
            type="button"
            onClick={onPrintMasterClose}
            disabled={loading}
            className="text-gray-500 transition hover:text-red-500"
          >
            <IoClose className="text-2xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Client Name */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Printer Name
            </label>
            <input
              type="text"
              name="printer_name"
              value={formData.printer_name}
              onChange={handleChange}
              placeholder="Enter printer name"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Pincode */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Status
            </label>
            <select
              name="pm_status"
              value={formData.pm_status}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">-select-</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onPrintMasterClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`rounded-lg px-6 py-2.5 text-white ${
                loading ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Saving..." : "Updating Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePrinterMasterModel;
