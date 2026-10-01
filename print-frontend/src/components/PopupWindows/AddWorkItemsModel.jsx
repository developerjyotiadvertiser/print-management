import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";
import AddPrinterMasterModel from "./AddPrinterMasterModel";

const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const AddWorkItemsModel = ({
  isItemOpen,
  onItemClose,
  getAllMediaMaster,
  onMediaTypeAdded,
  getAllMediaType,
  getAllWorkItems,
  mediaType,
  printerMaster,
  getAllPrinterMaster,
}) => {
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  // --------------------------------
  // FORM DATA
  // --------------------------------
  const [formData, setFormData] = useState({
    woi_jc_number: "",
    woi_work_allot_date: getTodayDate(),
    woi_printer_name: "",
    woi_media: "",
    woi_size_height: "",
    woi_size_width: "",
    woi_unit: "",
    woi_quantity: "",
    woi_area: "",
    woi_creative: "",
    woi_creative_image: null,
    woi_status: "Done",
  });

  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [addPrinter, setAddPrinter] = useState(false);

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
  // HANDLE IMAGE CHANGE
  // --------------------------------
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Make sure selected file is an image
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    // Maximum original image size = 20 MB
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image size should not exceed 20 MB.");
      e.target.value = "";
      return;
    }

    // Revoke previous preview if any
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setFormData((prev) => ({
      ...prev,
      woi_creative_image: file,
    }));

    setImagePreview(previewUrl);
  };

  // --------------------------------
  // REMOVE IMAGE
  // --------------------------------
  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setFormData((prev) => ({
      ...prev,
      woi_creative_image: null,
    }));

    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --------------------------------
  // CLOSE MODAL
  // --------------------------------
  const handleClose = () => {
    if (!loading) {
      onItemClose();
    }
  };

  // --------------------------------
  // CLOSE ON ESC
  // --------------------------------
  useEffect(() => {
    if (!isItemOpen) return;

    const handleEscKey = (e) => {
      if (e.key === "Escape" && !loading) {
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
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setFormData({
      woi_jc_number: "",
      woi_work_allot_date: getTodayDate(),
      woi_printer_name: "",
      woi_media: "",
      woi_size_height: "",
      woi_size_width: "",
      woi_unit: "",
      woi_quantity: "",
      woi_area: "",
      woi_creative: "",
      woi_creative_image: null,
      woi_status: "Done",
    });

    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --------------------------------
  // CLEANUP IMAGE PREVIEW
  // --------------------------------
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // --------------------------------
  // CALCULATE TOTAL AREA IN SQ.FT
  // --------------------------------
  useEffect(() => {
    const { woi_size_width, woi_size_height, woi_unit, woi_quantity } =
      formData;

    if (!woi_size_width || !woi_size_height || !woi_unit || !woi_quantity) {
      setFormData((prev) => ({
        ...prev,
        woi_area: "",
      }));

      return;
    }

    let widthInFeet = Number(woi_size_width);
    let heightInFeet = Number(woi_size_height);

    const quantity = Number(woi_quantity);

    // Convert inches to feet
    if (woi_unit === "Inch") {
      widthInFeet = widthInFeet / 12;
      heightInFeet = heightInFeet / 12;
    }

    // Width × Height × Quantity
    const area = widthInFeet * heightInFeet * quantity;

    setFormData((prev) => ({
      ...prev,
      woi_area: area.toFixed(2),
    }));
  }, [
    formData.woi_size_width,
    formData.woi_size_height,
    formData.woi_unit,
    formData.woi_quantity,
  ]);

  // --------------------------------
  // SUBMIT
  // --------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // --------------------------------
      // CREATE FORMDATA
      // --------------------------------
      const payload = new FormData();

      payload.append("woi_jc_number", `JC-${formData.woi_jc_number}`);

      payload.append("woi_work_allot_date", formData.woi_work_allot_date);

      payload.append("woi_printer_name", formData.woi_printer_name);

      payload.append("woi_media", formData.woi_media);

      payload.append("woi_size_height", formData.woi_size_height);

      payload.append("woi_size_width", formData.woi_size_width);

      payload.append("woi_unit", formData.woi_unit);

      payload.append("woi_quantity", formData.woi_quantity);

      payload.append("woi_area", formData.woi_area);

      payload.append("woi_creative", formData.woi_creative);

      payload.append("woi_status", formData.woi_status);

      // --------------------------------
      // ADD IMAGE
      // --------------------------------
      if (formData.woi_creative_image) {
        payload.append("woi_creative_image", formData.woi_creative_image);
      }

      // --------------------------------
      // API REQUEST
      // --------------------------------
      const response = await axios.post(
        `${apiUrl}/api/work-items/save-work-items`,
        payload,
      );

      // --------------------------------
      // SUCCESS
      // --------------------------------
      if (response.data.success) {
        toast.success(response.data.message || "Work item added successfully.");

        // Refresh media master
        if (getAllMediaMaster) {
          await getAllMediaMaster();
        }

        // Refresh media type
        if (getAllMediaType) {
          await getAllMediaType();
        }

        // Callback
        if (onMediaTypeAdded) {
          onMediaTypeAdded(response.data.data);
        }

        // Refresh work items
        if (getAllWorkItems) {
          await getAllWorkItems();
        }

        // Reset form
        resetForm();

        // Close modal
        onItemClose();
      }
    } catch (error) {
      console.error("Save Work Item Error:", error);

      toast.error(error.response?.data?.message || "Failed to add work item.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // HIDE MODAL
  // --------------------------------
  if (!isItemOpen) {
    return null;
  }

  return (
    <>
      {/* =========================================
          MODAL OVERLAY
      ========================================== */}
      <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        {/* =========================================
            MODAL
        ========================================== */}
        <div
          ref={modalRef}
          className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        >
          {/* =========================================
              HEADER
          ========================================== */}
          <div className="mb-5 flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold text-blue-800">
              Add Work Item
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

          {/* =========================================
              FORM
          ========================================== */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
              {/* =====================================
                  JC NUMBER
              ====================================== */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  JC Number *
                </label>

                <div className="flex">
                  <span className="flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 px-3 font-semibold text-gray-700">
                    JC-
                  </span>

                  <input
                    type="text"
                    name="woi_jc_number"
                    value={formData.woi_jc_number}
                    onChange={handleChange}
                    placeholder="Enter number"
                    required
                    className="w-full rounded-r-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* =====================================
                  WORK ALLOT DATE
              ====================================== */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Work Allot Date *
                </label>

                <input
                  type="date"
                  name="woi_work_allot_date"
                  value={formData.woi_work_allot_date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* =====================================
                  PRINTER NAME
              ====================================== */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Printer Name *
                </label>

                <select
                  name="woi_printer_name"
                  value={formData.woi_printer_name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">-select-</option>

                  {printerMaster?.map((item) => (
                    <option
                      key={item?.printer_id || item?.printer_name}
                      value={item?.printer_name}
                    >
                      {item?.printer_name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setAddPrinter(true)}
                  className="mt-1 flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-1 text-md font-bold text-white transition hover:bg-cyan-600"
                >
                  + New Printer
                </button>
              </div>

              {/* =====================================
                  MEDIA
              ====================================== */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Media *
                </label>

                <select
                  name="woi_media"
                  value={formData.woi_media}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">-select-</option>

                  {mediaType?.map((item) => (
                    <option
                      key={item?.mt_id || item?.mt_name}
                      value={item?.mt_name}
                    >
                      {item?.mt_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* =====================================
                  HEIGHT
              ====================================== */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Height *
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="woi_size_height"
                  value={formData.woi_size_height}
                  onChange={handleChange}
                  placeholder="Enter height"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* =====================================
                  WIDTH
              ====================================== */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Width *
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="woi_size_width"
                  value={formData.woi_size_width}
                  onChange={handleChange}
                  placeholder="Enter width"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* =====================================
                  SIZE UNIT
              ====================================== */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Size Unit *
                </label>

                <select
                  name="woi_unit"
                  value={formData.woi_unit}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Unit</option>

                  <option value="Feet">Feet</option>

                  <option value="Inch">Inch</option>
                </select>
              </div>

              {/* =====================================
                  QUANTITY
              ====================================== */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Quantity *
                </label>

                <input
                  type="number"
                  min="1"
                  name="woi_quantity"
                  value={formData.woi_quantity}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* =====================================
                  AREA
              ====================================== */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Total Area (SQFT) *
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="woi_area"
                  value={formData.woi_area}
                  onChange={handleChange}
                  placeholder="Enter area"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* =====================================
                  STATUS
              ====================================== */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Status *
                </label>

                <select
                  name="woi_status"
                  value={formData.woi_status}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="Done">Done</option>

                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* =====================================
                  CREATIVE
              ====================================== */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Creative
                </label>

                <input
                  type="text"
                  name="woi_creative"
                  value={formData.woi_creative}
                  onChange={handleChange}
                  placeholder="Enter creative details"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* =====================================
                  CREATIVE IMAGE
              ====================================== */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Creative Image
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative mt-3 w-fit">
                    <img
                      src={imagePreview}
                      alt="Creative Preview"
                      className="h-32 w-32 rounded-lg border border-gray-300 object-cover shadow-sm"
                    />

                    <button
                      type="button"
                      onClick={removeImage}
                      disabled={loading}
                      className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition hover:bg-red-600 disabled:opacity-50"
                    >
                      <IoClose className="text-lg" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* =========================================
                BUTTONS
            ========================================== */}
            <div className="mt-6 flex justify-end gap-3 border-t pt-5">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`rounded-lg px-6 py-2.5 text-white transition ${
                  loading
                    ? "cursor-not-allowed bg-gray-500"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Saving..." : "Add Work Item"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* =========================================
          ADD PRINTER MODAL
      ========================================== */}
      <AddPrinterMasterModel
        isItemOpen={addPrinter}
        onItemClose={() => setAddPrinter(false)}
        getAllPrinterMaster={getAllPrinterMaster}
      />
    </>
  );
};

export default AddWorkItemsModel;
