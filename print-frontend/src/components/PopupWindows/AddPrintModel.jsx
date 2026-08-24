import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";

const AddPrintModel = ({ isOpen, onClose, getAllPrintData }) => {
  const modalRef = useRef();
  const [formData, setFormData] = useState({
    creative: "",
    media_type: "",
    width: "",
    height: "",
    size_unit: "",
    quantity: 1,
    total_area: "",
    remarks: "",
  });

  const apiUrl = import.meta.env.VITE_API_URL;
  const [loading, setLoading] = useState(false);

  // -----------------------------------------
  // Close modal when clicking outside
  // -----------------------------------------
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

  // -----------------------------------------
  // Calculate total area in Sq.Ft
  // -----------------------------------------
  useEffect(() => {
    const { width, height, size_unit, quantity } = formData;

    if (!width || !height || !size_unit || !quantity) {
      setFormData((prev) => ({
        ...prev,
        total_area: "",
      }));
      return;
    }

    let widthInFeet = Number(width);
    let heightInFeet = Number(height);

    // Convert inches to feet
    if (size_unit === "inch") {
      widthInFeet = widthInFeet / 12;
      heightInFeet = heightInFeet / 12;
    }

    const area = widthInFeet * heightInFeet * Number(quantity);

    setFormData((prev) => ({
      ...prev,
      total_area: area.toFixed(2),
    }));
  }, [formData.width, formData.height, formData.size_unit, formData.quantity]);

  // -----------------------------------------
  // Handle form changes
  // -----------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

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

      const response = await axios.post(
        `${apiUrl}/api/print/save-print`,
        formData,
      );

      if (response.data.success) {
        toast.success(response.data.message);

        setFormData({
          creative: "",
          media_type: "",
          width: "",
          height: "",
          size_unit: "",
          quantity: 1,
          total_area: "",
          remarks: "",
        });

        onClose();
      }
      getAllPrintData();
    } catch (error) {
      console.log(error);

      toast.error(
        error.response?.data?.message || "Failed to add print record.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6"
      >
        {/* Header */}
        <div className="mb-6 border-b pb-4 flex items-center justify-between">
          <h2 className="text-3xl font-semibold text-blue-800 tracking-wide">
            Save Print Record
          </h2>

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
          className="grid grid-cols-1 md:grid-cols-2 gap-5 text-gray-700 text-sm"
        >
          {/* Creative */}
          <div>
            <label className="block mb-1 font-semibold">Creative*</label>

            <input
              type="text"
              name="creative"
              required
              placeholder="Enter creative"
              value={formData.creative}
              onChange={handleChange}
              className="w-full border border-gray-200 bg-white rounded-lg px-4 py-2.5 focus:outline-none"
            />
          </div>

          {/* Media Type */}
          <div>
            <label className="block mb-1 font-semibold">Media Type *</label>

            <select
              name="media_type"
              value={formData.media_type}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Media Type</option>
              <option value="vinyl-g">Vinyl-G</option>
              <option value="vinyl-m">Vinyl-M</option>
              <option value="owv">OWV</option>
              <option value="bb-flex">BB-Flex</option>
              <option value="normal-flex">Normal-Flex</option>
              <option value="retro-flex">Retro-Flex</option>
              <option value="retro-vinyl">Retro-Vinyl</option>
              <option value="lamination">Lamination</option>
              <option value="translit">translit</option>
            </select>
          </div>

          {/* Size Unit */}
          <div>
            <label className="block mb-1 font-semibold">Size Unit *</label>

            <select
              name="size_unit"
              value={formData.size_unit}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Unit</option>
              <option value="feet">Feet</option>
              <option value="inch">Inch</option>
            </select>
          </div>

          {/* Width */}
          <div>
            <label className="block mb-1 font-semibold">Width *</label>

            <input
              type="number"
              name="width"
              value={formData.width}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              placeholder="Enter width"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Height */}
          <div>
            <label className="block mb-1 font-semibold">Height *</label>

            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              placeholder="Enter height"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block mb-1 font-semibold">Quantity *</label>

            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Total Area */}
          <div>
            <label className="block mb-1 font-semibold">
              Total Area (Sq.Ft)
            </label>

            <input
              type="number"
              name="total_area"
              value={formData.total_area}
              readOnly
              className="w-full border border-gray-200 bg-gray-100 rounded-lg px-4 py-2.5 focus:outline-none"
            />
          </div>

          {/* Remarks */}
          <div className="md:col-span-2">
            <label className="block mb-1 font-semibold">Remarks</label>

            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              placeholder="Write remarks here..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="col-span-full flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 transition disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-lg ${
                loading ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
              } text-white font-medium shadow transition disabled:cursor-not-allowed`}
            >
              {loading ? "Saving..." : "Save Print Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPrintModel;
