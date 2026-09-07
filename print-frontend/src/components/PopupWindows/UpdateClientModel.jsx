import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";

const UpdateClientModel = ({ isOpen, onClose, getAllClientData, selected }) => {
  const modalRef = useRef();
  const [formData, setFormData] = useState({
    client_name: "",
    client_contact: "",
    client_address: "",
    pan_number: "",
    gst_number: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    setFormData({
      ...formData,
      client_name: selected?.client_name,
      client_contact: selected?.client_contact,
      client_address: selected?.client_address,
      pan_number: selected?.pan_number,
      gst_number: selected?.gst_number,
      pincode: selected?.pincode,
    });
  }, [selected]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "client_contact") {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.put(
        `${apiUrl}/api/client/update-client/${selected?.client_id}`,
        formData,
      );

      if (response.data.success) {
        toast.success(response.data.message);
        await getAllClientData();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-semibold text-blue-800">
            Add New Client
          </h2>
          <button
            type="button"
            onClick={onClose}
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
              Client Name *
            </label>
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              placeholder="Enter client name"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Client Contact */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Client Contact *
            </label>
            <input
              type="tel"
              name="client_contact"
              value={formData.client_contact}
              onChange={handleChange}
              placeholder="Enter contact number"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Client Address */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Client Address *
            </label>
            <textarea
              name="client_address"
              value={formData.client_address}
              onChange={handleChange}
              placeholder="Enter client address"
              required
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* PAN + GST */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                PAN Number
              </label>
              <input
                type="text"
                name="pan_number"
                value={formData.pan_number}
                onChange={handleChange}
                placeholder="Enter PAN number"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                GST Number
              </label>
              <input
                type="text"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                placeholder="Enter GST number"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Pincode */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Pincode *
            </label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="Enter pincode"
              maxLength={6}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
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

export default UpdateClientModel;
