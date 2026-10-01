import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";

const AddPrinterMasterModel = ({
  isItemOpen,
  onItemClose,
  getAllPrinterMaster,
}) => {
  const modalRef = useRef();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
    printer_name: "",
    pm_status: "Active",
  });

  const [loading, setLoading] = useState(false);

  // --------------------------------
  // HANDLE INPUT CHANGE
  // --------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --------------------------------
  // CLOSE MODAL
  // --------------------------------
  const handleClose = () => {
    onItemClose();
  };

  // --------------------------------
  // CLOSE ON ESC
  // --------------------------------
  useEffect(() => {
    if (!isItemOpen) return;

    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isItemOpen, loading]);

  // --------------------------------
  // RESET FORM
  // --------------------------------
  const resetForm = () => {
    setFormData({
      printer_name: "",
      printer_status: "Active",
    });
  };

  // --------------------------------
  // SUBMIT
  // --------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Only send fields required by media_master
      const payload = {
        printer_name: formData.printer_name?.toLocaleUpperCase(),
        pm_status: formData.pm_status,
      };

      const response = await axios.post(
        `${apiUrl}/api/printer-master/save-printer-master`,
        payload,
      );

      if (response.data.success) {
        toast.success(response.data.message);
        resetForm();
        onItemClose();
      }
      getAllPrinterMaster();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to add printer master.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isItemOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div
          ref={modalRef}
          className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="mb-5 flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold text-blue-800">Add Printer</h2>

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="text-gray-500 transition hover:text-red-500 disabled:opacity-50"
            >
              <IoClose className="text-2xl" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Media - Full Width */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Name *
              </label>

              <input
                type="text"
                name="printer_name"
                value={formData.printer_name}
                onChange={handleChange}
                placeholder="Enter name"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
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
                {loading ? "Saving..." : "Add Printer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddPrinterMasterModel;
