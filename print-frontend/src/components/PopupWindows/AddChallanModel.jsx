import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";

const AddChallanModel = ({ isOpen, onClose, getAllClientData }) => {
  const modalRef = useRef();

  const [formData, setFormData] = useState({
    ch_client_id: "",
    ch_print_id: "",
    ch_date: "",
    ch_description: "",
    ch_creative: "",
    ch_height: "",
    ch_width: "",
    ch_quantity: "",
    ch_area: "",
    ch_delivered_to: "",
    ch_phone: "",
    ch_remark: "",
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "ch_phone") {
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
      const response = await axios.post(
        `${apiUrl}/api/challan/save-challan`,
        formData,
      );

      if (response.data.success) {
        toast.success(response.data.message);

        // Refresh media type list
        await getAllClientData();

        setFormData({
          ch_client_id: "",
          ch_print_id: "",
          ch_date: "",
          ch_description: "",
          ch_creative: "",
          ch_height: "",
          ch_width: "",
          ch_quantity: "",
          ch_area: "",
          ch_delivered_to: "",
          ch_phone: "",
          ch_remark: "",
        });
        onClose();
      }
    } catch (error) {
      console.log(error);

      toast.error(error.response?.data?.message || "Failed to add challan");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="w-full max-w-5xl rounded-2xl bg-white p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-semibold text-blue-800">
            Add New Challan
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

        <div className="overflow-y-auto px-6 py-5">
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
              {/* Client ID */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Client ID *
                </label>

                <select
                  name="ch_client_id"
                  value={formData.ch_client_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Client</option>

                  {/* {clients?.map((client) => (
                  <option key={client.client_id} value={client.client_id}>
                    {client.client_name}
                  </option>
                ))} */}
                </select>
              </div>

              {/* Print ID */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Print ID *
                </label>

                <select
                  name="ch_print_id"
                  value={formData.ch_print_id}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Print ID</option>

                  {/* {printList?.map((print) => (
                  <option key={print.print_id} value={print.print_id}>
                    {print.print_name || print.print_id}
                  </option>
                ))} */}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Date *
                </label>

                <input
                  type="date"
                  name="ch_date"
                  value={formData.ch_date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Creative */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Creative
                </label>

                <input
                  type="text"
                  name="ch_creative"
                  value={formData.ch_creative}
                  onChange={handleChange}
                  placeholder="Enter creative details"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Height */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Height
                </label>

                <input
                  type="number"
                  name="ch_height"
                  value={formData.ch_height}
                  onChange={handleChange}
                  placeholder="Enter height"
                  min="0"
                  step="any"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Width */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Width
                </label>

                <input
                  type="number"
                  name="ch_width"
                  value={formData.ch_width}
                  onChange={handleChange}
                  placeholder="Enter width"
                  min="0"
                  step="any"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Quantity
                </label>

                <input
                  type="number"
                  name="ch_quantity"
                  value={formData.ch_quantity}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  min="1"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Area */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Area
                </label>

                <input
                  type="number"
                  name="ch_area"
                  value={formData.ch_area}
                  onChange={handleChange}
                  placeholder="Enter area"
                  min="0"
                  step="any"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Phone
                </label>

                <input
                  type="tel"
                  name="ch_phone"
                  value={formData.ch_phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* PAN */}
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

              {/* GST */}
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

              {/* Pincode */}
              <div>
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

              {/* Delivered To - Full Width */}
              <div className="md:col-span-4">
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Delivered To
                </label>

                <input
                  type="text"
                  name="ch_delivered_to"
                  value={formData.ch_delivered_to}
                  onChange={handleChange}
                  placeholder="Enter delivered person/place"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Description - Half Width */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Description *
                </label>

                <textarea
                  name="ch_description"
                  value={formData.ch_description}
                  onChange={handleChange}
                  placeholder="Enter description"
                  required
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Remark - Half Width */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Remark
                </label>

                <textarea
                  name="ch_remark"
                  value={formData.ch_remark}
                  onChange={handleChange}
                  placeholder="Enter remark"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
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
                {loading ? "Saving..." : "Add Client"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddChallanModel;
