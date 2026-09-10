import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";
import AddMediaTypeModal from "./AddMediaTypeModal";

const UpdatePrintModel = ({ isOpen, onClose, getAllPrintData, selected }) => {
  const modalRef = useRef();
  const [formData, setFormData] = useState({
    creative: "",
    media_type: "",
    width: "",
    height: "",
    size_unit: "",
    quality_print: "",
    quantity: 1,
    total_area: "",
    remarks: "",
  });

  const [isMediaTypeModalOpen, setIsMediaTypeModalOpen] = useState(false);
  const [mediaTypes, setMediaTypes] = useState([]);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      creative: selected?.creative,
      media_type: selected?.media_type,
      width: selected?.width,
      height: selected?.height,
      size_unit: selected?.size_unit,
      quality_print: selected?.quality_print,
      quantity: selected?.quantity,
      total_area: selected?.total_area,
      remarks: selected?.remarks,
    });
  }, [selected]);

  const getAllMediaTypes = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/api/media/get-all-media`);
      setMediaTypes(data.data?.data);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch media types");
    }
  };

  useEffect(() => {
    if (isOpen) {
      getAllMediaTypes();
    }
  }, [isOpen]);

  // Calculate total area in Sq.Ft
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

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.put(
        `${apiUrl}/api/print/update-print/${selected?.print_id}`,
        formData,
      );

      if (response.data.success) {
        toast.success(response.data.message);
        onClose();
      }
      getAllPrintData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to add print record.",
      );
    } finally {
      setLoading(false);
    }
  };

  // CLOSE MODAL
  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, loading]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, loading]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div
          ref={modalRef}
          className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6"
        >
          {/* Header */}
          <div className="mb-6 border-b pb-4 flex items-center justify-between">
            <h2 className="text-3xl font-semibold text-blue-800 tracking-wide">
              Update Print Record
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-gray-700 text-sm"
          >
            {/* Creative */}
            <div className="lg:col-span-4 md:col-span-2">
              <label className="block mb-1 font-semibold">Creative*</label>
              <input
                type="text"
                name="creative"
                value={formData.creative}
                required
                onChange={handleChange}
                placeholder="Enter creative"
                className="w-full border border-gray-200 bg-white rounded-lg px-4 py-2.5 focus:outline-none"
              />
            </div>
            {/* Media Type */}
            <div className="lg:col-span-2 md:col-span-1">
              <label className="block mb-1 font-semibold">Media Type *</label>
              <select
                name="media_type"
                value={formData.media_type}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select Media Type</option>
                {mediaTypes?.map((item) => (
                  <option key={item?.mt_id} value={item?.mt_name}>
                    {item?.mt_name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsMediaTypeModalOpen(true)}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                + Add New Media Type
              </button>
            </div>

            {/* Size Unit */}
            <div className="lg:col-span-2 md:col-span-1">
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

            {/* Quality print */}
            <div className="lg:col-span-1 md:col-span-1">
              <label className="block mb-1 font-semibold">
                Printing Profile*
              </label>
              <input
                type="text"
                name="quality_print"
                value={formData.quality_print}
                onChange={handleChange}
                required
                placeholder="Pass/Density"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
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
            <div className="lg:col-span-4 md:col-span-2">
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
                {loading ? "Updating..." : "Update the Record"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <AddMediaTypeModal
        isOpen={isMediaTypeModalOpen}
        onClose={() => setIsMediaTypeModalOpen(false)}
        getAllMediaTypes={getAllMediaTypes}
        onMediaTypeAdded={(newMediaType) => {
          if (newMediaType?.mt_id) {
            setFormData((prev) => ({
              ...prev,
              media_type: newMediaType.mt_id,
            }));
          }
        }}
      />
    </>
  );
};

export default UpdatePrintModel;
