import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";
import AddMediaItemsModel from "./AddMediaItemsModel";

const UpdateMediaTypeModel = ({
  isOpen,
  onClose,
  getAllMediaMaster,
  selected,
  mediaType,
  getAllMediaType,
}) => {
  const modalRef = useRef();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
    mm_media: "",
    mm_brand: "",
    mm_gsm: "",
    mm_width: "",
    mm_height: "",
    mm_unit: "",
    mm_size: "",
    mm_status: "Active",
  });

  const [loading, setLoading] = useState(false);
  const [isMediaItemModalOpen, setIsMediaItemModalOpen] = useState(false);

  useEffect(() => {
    if (!selected) return;

    setFormData({
      mm_media: selected?.mm_media || "",
      mm_brand: selected?.mm_brand || "",
      mm_gsm: selected?.mm_gsm || "",
      mm_width: selected?.mm_width,
      mm_height: selected?.mm_height,
      mm_unit: selected?.mm_unit,
      mm_size: selected?.mm_size || "",
      mm_status: selected?.mm_status || "Active",
    });
  }, [selected]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Calculate Size in SQFT
  useEffect(() => {
    const { mm_width, mm_height, mm_unit } = formData;

    if (!mm_width || !mm_height || !mm_unit) {
      setFormData((prev) => ({
        ...prev,
        mm_size: "",
      }));
      return;
    }

    let widthInFeet = Number(mm_width);
    let heightInFeet = Number(mm_height);

    // Convert inches to feet
    if (mm_unit === "Inch") {
      widthInFeet = widthInFeet / 12;
      heightInFeet = heightInFeet / 12;
    }

    const area = widthInFeet * heightInFeet;

    setFormData((prev) => ({
      ...prev,
      mm_size: area.toFixed(2),
    }));
  }, [formData.mm_width, formData.mm_height, formData.mm_unit]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.mm_size) {
      toast.error("Please enter valid width, height and size unit.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        mm_media: formData.mm_media,
        mm_brand: formData.mm_brand,
        mm_gsm: formData.mm_gsm,
        mm_width: formData?.mm_width,
        mm_height: formData?.mm_height,
        mm_unit: formData?.mm_unit,
        mm_size: formData.mm_size,
        mm_status: formData.mm_status,
      };

      const response = await axios.put(
        `${apiUrl}/api/media-master/update-media-master/${selected?.mm_id}`,
        payload,
      );

      if (response.data.success) {
        toast.success(response.data.message);
        await getAllMediaMaster();
        onClose();
      }
    } catch (error) {
      console.log(error);

      toast.error(
        error.response?.data?.message || "Failed to update media type.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

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
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div
          ref={modalRef}
          className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="mb-5 flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold text-blue-800">
              Update Media Type
            </h2>

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
            {/* Media */}
            <div>
              <div className="flex justify-between items-center">
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Media *
                </label>
                <button
                  type="button"
                  onClick={() => setIsMediaItemModalOpen(true)}
                  className="mb-1 flex items-center gap-2 px-2 py-1 bg-red-500 rounded-lg text-white hover:bg-red-600 transition text-md font-bold"
                >
                  +
                </button>
              </div>

              <select
                name="mm_media"
                value={formData.mm_media}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">-select-</option>
                {mediaType?.map((item) => (
                  <>
                    <option value={item?.mt_name}>{item?.mt_name}</option>
                  </>
                ))}
              </select>
            </div>

            {/* Grid */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Brand */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Brand *
                </label>

                <input
                  type="text"
                  name="mm_brand"
                  value={formData.mm_brand}
                  onChange={handleChange}
                  placeholder="Enter brand name"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* GSM */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  OZ/GSM *
                </label>

                <input
                  type="number"
                  name="mm_gsm"
                  value={formData.mm_gsm}
                  onChange={handleChange}
                  placeholder="Enter OZ/GSM"
                  required
                  min="1"
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Width */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Width *
                </label>

                <input
                  type="number"
                  name="mm_width"
                  value={formData.mm_width}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  placeholder="Enter width"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Height */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Height *
                </label>

                <input
                  type="number"
                  name="mm_height"
                  value={formData.mm_height}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  placeholder="Enter height"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Size Unit */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Size Unit *
                </label>

                <select
                  name="mm_unit"
                  value={formData.mm_unit}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Unit</option>
                  <option value="Feet">Feet</option>
                  <option value="Inch">Inch</option>
                </select>
              </div>

              {/* Calculated Size */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Size (SQFT)
                </label>

                <input
                  type="text"
                  value={formData.mm_size}
                  readOnly
                  placeholder="Calculated automatically"
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-gray-700 focus:outline-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Status *
                </label>

                <select
                  name="mm_status"
                  value={formData.mm_status}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
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
                {loading ? "Saving..." : "Update Media"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <AddMediaItemsModel
        isItemOpen={isMediaItemModalOpen}
        onItemClose={() => setIsMediaItemModalOpen(false)}
        getAllMediaMaster={getAllMediaMaster}
        mediaType={mediaType}
        getAllMediaType={getAllMediaType}
      />
    </>
  );
};

export default UpdateMediaTypeModel;
