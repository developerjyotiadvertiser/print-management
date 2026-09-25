import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";
import AddMediaTypeModal from "./AddMediaTypeModal";

const AddPrintModel = ({ isOpen, onClose, getAllPrintData }) => {
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
    remark_one: "",
    mm_id: null,
    stock: 0,
  });

  const [isMediaTypeModalOpen, setIsMediaTypeModalOpen] = useState(false);
  const [mediaTypes, setMediaTypes] = useState([]);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [loading, setLoading] = useState(false);

  const getAllMediaTypes = async () => {
    try {
      const { data } = await axios.get(
        `${apiUrl}/api/media-master/get-all-media-master`,
      );
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
    if (size_unit === "Inch") {
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
  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Width validation
    if (name === "width") {
      const selectedMedia = mediaTypes.find(
        (item) => Number(item.mm_id) === Number(formData.mm_id),
      );

      if (selectedMedia) {
        const availableWidth = Number(selectedMedia.mm_width);
        const enteredWidth = Number(value);

        if (enteredWidth > availableWidth) {
          toast.error(
            `Maximum available width is ${availableWidth}. You cannot enter ${enteredWidth}.`,
          );
          return;
        }
      }
    }

    if (name === "media_type") {
      const selectedMedia = mediaTypes.find(
        (item) => Number(item.mm_id) === Number(value),
      );

      if (!selectedMedia) return;

      setFormData((prev) => ({
        ...prev,

        // Actual media name
        media_type: selectedMedia.mm_media,

        // Unique selected media ID
        mm_id: selectedMedia.mm_id,

        // Auto-filled values
        remarks: selectedMedia.mm_brand || "",
        size_unit: selectedMedia.mm_unit || "",
        height: selectedMedia.mm_height || "",
        stock: selectedMedia.mm_size || 0,
      }));

      return;
    }

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
          quality_print: "",
          quantity: 1,
          total_area: "",
          remarks: "",
          remark_one: "",
        });
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

  // console.log("formdata", formData);

  const activeMedia = mediaTypes?.filter((item) => {
    return item?.mm_status === "Active";
  });

  console.log("activeMedia", activeMedia);

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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-gray-700 text-sm"
          >
            <div className="lg:col-span-4 md:col-span-2">
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
            <div className="lg:col-span-2 md:col-span-1">
              <label className="block mb-1 font-semibold">Media Type *</label>
              <select
                name="media_type"
                value={formData.mm_id || ""}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select Media Type</option>
                {activeMedia?.map((item) => (
                  <option key={item?.mm_id} value={item?.mm_id}>
                    {item?.mm_serial_number?.toUpperCase()}-{item?.mm_media}-
                    {item?.mm_brand}-{item?.mm_height}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-1 md:col-span-1">
              <label className="block mb-1 font-semibold">Size Unit *</label>
              {/* <select
                name="size_unit"
                value={formData.size_unit}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select Unit</option>
                <option value="feet">Feet</option>
                <option value="inch">Inch</option>
              </select> */}
              <input
                type="text"
                name="size_unit"
                value={formData.size_unit}
                onChange={handleChange}
                required
                readOnly
                placeholder="Enter unit"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-200"
              />
            </div>
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
                // readOnly
                placeholder="Enter height"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
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
            <div>
              <label className="block mb-1 font-semibold">
                Total Area (Sq.Ft)
              </label>
              <input
                type="number"
                name="total_area"
                value={formData.total_area}
                onChange={handleChange}
                className="w-full border border-gray-200 bg-gray-100 rounded-lg px-4 py-2.5 focus:outline-none"
              />
              <span>Available Stock: {formData?.stock}</span>
            </div>
            <div className="lg:col-span-4 md:col-span-4"></div>
            <div className="lg:col-span-2 md:col-span-2">
              <label className="block mb-1 font-semibold">Brand*</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={3}
                required
                readOnly
                maxLength={12}
                placeholder="Write remarks here..."
                className="w-full border border-gray-300 rounded-lg bg-gray-100 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </div>
            <div className="lg:col-span-2 md:col-span-2">
              <label className="block mb-1 font-semibold">Remark*</label>
              <textarea
                name="remark_one"
                value={formData.remark_one}
                onChange={handleChange}
                rows={3}
                maxLength={35}
                required
                placeholder="Write remark_one here..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </div>
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

export default AddPrintModel;
