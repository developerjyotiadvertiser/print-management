import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";
import { FiPlus, FiTrash2, FiImage } from "react-icons/fi";
import AddPrinterMasterModel from "./AddPrinterMasterModel";

const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// =====================================================
// CREATE EMPTY MEDIA ITEM
// =====================================================
const createEmptyMedia = () => ({
  woim_media: "",
  woim_size_height: "",
  woim_size_width: "",
  woim_unit: "",
  woim_quantity: "",
  woim_area: "",
  woim_creative: "",
  woim_creative_image: null,
  imagePreview: "",
});

// =====================================================
// CALCULATE AREA
// =====================================================
const calculateArea = (width, height, unit, quantity) => {
  if (!width || !height || !unit || !quantity) {
    return "";
  }

  let widthInFeet = Number(width);
  let heightInFeet = Number(height);
  const qty = Number(quantity);

  if (
    !Number.isFinite(widthInFeet) ||
    !Number.isFinite(heightInFeet) ||
    !Number.isFinite(qty) ||
    widthInFeet <= 0 ||
    heightInFeet <= 0 ||
    qty <= 0
  ) {
    return "";
  }

  // Convert Inch → Feet
  if (unit === "Inch") {
    widthInFeet = widthInFeet / 12;
    heightInFeet = heightInFeet / 12;
  }

  const area = widthInFeet * heightInFeet * qty;

  return area.toFixed(2);
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

  const apiUrl = import.meta.env.VITE_API_URL;

  // =====================================================
  // FORM DATA
  // =====================================================
  const [formData, setFormData] = useState({
    woi_jc_number: "",
    woi_work_allot_date: getTodayDate(),
    woi_printer_name: "",
    woi_status: "Done",
  });

  // =====================================================
  // MEDIA ITEMS
  // =====================================================
  const [mediaItems, setMediaItems] = useState([createEmptyMedia()]);

  const [loading, setLoading] = useState(false);
  const [addPrinter, setAddPrinter] = useState(false);

  // =====================================================
  // HANDLE MAIN FORM CHANGE
  // =====================================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // HANDLE MEDIA CHANGE
  // =====================================================
  const handleMediaChange = (index, e) => {
    const { name, value } = e.target;

    setMediaItems((prev) => {
      const updated = [...prev];

      updated[index] = {
        ...updated[index],
        [name]: value,
      };

      // Recalculate area when dimensions/unit/quantity change
      if (
        name === "woim_size_width" ||
        name === "woim_size_height" ||
        name === "woim_unit" ||
        name === "woim_quantity"
      ) {
        updated[index].woim_area = calculateArea(
          name === "woim_size_width" ? value : updated[index].woim_size_width,

          name === "woim_size_height" ? value : updated[index].woim_size_height,

          name === "woim_unit" ? value : updated[index].woim_unit,

          name === "woim_quantity" ? value : updated[index].woim_quantity,
        );
      }

      return updated;
    });
  };

  // =====================================================
  // ADD MEDIA ITEM
  // =====================================================
  const addMediaItem = () => {
    setMediaItems((prev) => [...prev, createEmptyMedia()]);
  };

  // =====================================================
  // REMOVE MEDIA ITEM
  // =====================================================
  const removeMediaItem = (index) => {
    if (mediaItems.length === 1) {
      toast.error("At least one media item is required.");
      return;
    }

    const item = mediaItems[index];

    if (item.imagePreview) {
      URL.revokeObjectURL(item.imagePreview);
    }

    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  };

  // =====================================================
  // IMAGE PROCESSOR
  // =====================================================
  const processImageUpload = (file) => {
    // -----------------------------------------
    // Check file exists
    // -----------------------------------------
    if (!file) {
      return null;
    }

    // -----------------------------------------
    // Check image type
    // -----------------------------------------
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return null;
    }

    // -----------------------------------------
    // Maximum original image size = 20 MB
    // -----------------------------------------
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image size should not exceed 20 MB.");
      return null;
    }

    // -----------------------------------------
    // Create preview
    // -----------------------------------------
    const previewUrl = URL.createObjectURL(file);

    return {
      file,
      previewUrl,
    };
  };

  // =====================================================
  // HANDLE MEDIA IMAGE
  // =====================================================
  const handleMediaImageChange = (index, e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const processedImage = processImageUpload(file);

    if (!processedImage) {
      e.target.value = "";
      return;
    }

    setMediaItems((prev) => {
      const updated = [...prev];

      // Revoke previous preview
      if (updated[index].imagePreview) {
        URL.revokeObjectURL(updated[index].imagePreview);
      }

      updated[index] = {
        ...updated[index],
        woim_creative_image: processedImage.file,
        imagePreview: processedImage.previewUrl,
      };

      return updated;
    });
  };

  // =====================================================
  // REMOVE MEDIA IMAGE
  // =====================================================
  const removeMediaImage = (index, inputRef) => {
    setMediaItems((prev) => {
      const updated = [...prev];

      if (updated[index].imagePreview) {
        URL.revokeObjectURL(updated[index].imagePreview);
      }

      updated[index] = {
        ...updated[index],
        woim_creative_image: null,
        imagePreview: "",
      };

      return updated;
    });

    if (inputRef?.current) {
      inputRef.current.value = "";
    }
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================
  const handleClose = () => {
    if (!loading) {
      onItemClose();
    }
  };

  // =====================================================
  // ESC KEY
  // =====================================================
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

  // =====================================================
  // RESET FORM
  // =====================================================
  const resetForm = () => {
    // Revoke all image previews
    mediaItems.forEach((item) => {
      if (item.imagePreview) {
        URL.revokeObjectURL(item.imagePreview);
      }
    });

    setFormData({
      woi_jc_number: "",
      woi_work_allot_date: getTodayDate(),
      woi_printer_name: "",
      woi_status: "Done",
    });

    setMediaItems([createEmptyMedia()]);
  };

  // =====================================================
  // CLEANUP PREVIEWS ON UNMOUNT
  // =====================================================
  useEffect(() => {
    return () => {
      mediaItems.forEach((item) => {
        if (item.imagePreview) {
          URL.revokeObjectURL(item.imagePreview);
        }
      });
    };
  }, []);

  // =====================================================
  // SUBMIT
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // -----------------------------------------
    // Validate media items
    // -----------------------------------------
    if (!mediaItems.length) {
      toast.error("Please add at least one media item.");
      return;
    }

    // -----------------------------------------
    // Validate each media item
    // -----------------------------------------
    for (let i = 0; i < mediaItems.length; i++) {
      const media = mediaItems[i];

      if (!media.woim_media) {
        toast.error(`Please select media for Media ${i + 1}.`);
        return;
      }

      if (!media.woim_size_height) {
        toast.error(`Please enter height for Media ${i + 1}.`);
        return;
      }

      if (!media.woim_size_width) {
        toast.error(`Please enter width for Media ${i + 1}.`);
        return;
      }

      if (!media.woim_unit) {
        toast.error(`Please select unit for Media ${i + 1}.`);
        return;
      }

      if (!media.woim_quantity) {
        toast.error(`Please enter quantity for Media ${i + 1}.`);
        return;
      }
    }

    try {
      setLoading(true);

      // =================================================
      // CREATE FORMDATA
      // =================================================
      const payload = new FormData();

      // -----------------------------------------
      // Parent Work Item Data
      // -----------------------------------------
      payload.append("woi_jc_number", `JC-${formData.woi_jc_number}`);

      payload.append("woi_work_allot_date", formData.woi_work_allot_date);

      payload.append("woi_printer_name", formData.woi_printer_name);

      payload.append("woi_status", formData.woi_status);

      // =================================================
      // MEDIA JSON
      // =================================================

      const mediaData = mediaItems.map((media) => ({
        woim_media: media.woim_media,
        woim_size_height: media.woim_size_height,
        woim_size_width: media.woim_size_width,
        woim_unit: media.woim_unit,
        woim_quantity: media.woim_quantity,
        woim_area: media.woim_area,
        woim_creative: media.woim_creative,
      }));

      payload.append("media_items", JSON.stringify(mediaData));

      // =================================================
      // ADD IMAGES
      // =================================================

      mediaItems.forEach((media) => {
        if (media.woim_creative_image) {
          payload.append("woi_creative_images", media.woim_creative_image);
        }
      });

      // =================================================
      // API REQUEST
      // =================================================

      const response = await axios.post(
        `${apiUrl}/api/work-items/save-work-items`,
        payload,
      );

      // =================================================
      // SUCCESS
      // =================================================

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

        // Reset
        resetForm();

        // Close
        onItemClose();
      }
    } catch (error) {
      console.error("Save Work Item Error:", error);

      toast.error(error.response?.data?.message || "Failed to add work item.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // HIDE MODAL
  // =====================================================
  if (!isItemOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div
          ref={modalRef}
          className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
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
            {/* =========================================
                PARENT WORK ITEM
            ========================================== */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
              {/* JC NUMBER */}

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

              {/* DATE */}

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

              {/* PRINTER */}

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

              {/* STATUS */}

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
            </div>

            {/* =========================================
                MEDIA SECTION
            ========================================== */}

            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Media Items
                  </h3>

                  <p className="text-sm text-gray-500">
                    Add one or more media items for this work order.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addMediaItem}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  <FiPlus />
                  Add Print
                </button>
              </div>

              {/* =========================================
                  MEDIA ITEMS
              ========================================== */}

              <div className="space-y-5">
                {mediaItems.map((media, index) => {
                  // Separate ref for every image input
                  // using a local callback approach
                  return (
                    <MediaItemCard
                      key={index}
                      index={index}
                      media={media}
                      mediaType={mediaType}
                      loading={loading}
                      onChange={handleMediaChange}
                      onImageChange={handleMediaImageChange}
                      onRemove={removeMediaItem}
                      onRemoveImage={removeMediaImage}
                      canRemove={mediaItems.length > 1}
                    />
                  );
                })}
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
          ADD PRINTER
      ========================================== */}

      <AddPrinterMasterModel
        isItemOpen={addPrinter}
        onItemClose={() => setAddPrinter(false)}
        getAllPrinterMaster={getAllPrinterMaster}
      />
    </>
  );
};

// =====================================================
// MEDIA ITEM CARD
// =====================================================

const MediaItemCard = ({
  index,
  media,
  mediaType,
  loading,
  onChange,
  onImageChange,
  onRemove,
  onRemoveImage,
  canRemove,
}) => {
  const fileInputRef = useRef(null);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
      {/* HEADER */}

      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-semibold text-blue-700">Media {index + 1}</h4>

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={loading}
            className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            <FiTrash2 />
            Remove
          </button>
        )}
      </div>

      {/* FIELDS */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* MEDIA */}

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Media *
          </label>

          <select
            name="woim_media"
            value={media.woim_media}
            onChange={(e) => onChange(index, e)}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">-select-</option>

            {mediaType?.map((item) => (
              <option key={item?.mt_id || item?.mt_name} value={item?.mt_name}>
                {item?.mt_name}
              </option>
            ))}
          </select>
        </div>

        {/* HEIGHT */}

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Height *
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            name="woim_size_height"
            value={media.woim_size_height}
            onChange={(e) => onChange(index, e)}
            placeholder="Height"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* WIDTH */}

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Width *
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            name="woim_size_width"
            value={media.woim_size_width}
            onChange={(e) => onChange(index, e)}
            placeholder="Width"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* UNIT */}

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Size Unit *
          </label>

          <select
            name="woim_unit"
            value={media.woim_unit}
            onChange={(e) => onChange(index, e)}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select Unit</option>

            <option value="Feet">Feet</option>

            <option value="Inch">Inch</option>
          </select>
        </div>

        {/* QUANTITY */}

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Quantity *
          </label>

          <input
            type="number"
            min="1"
            name="woim_quantity"
            value={media.woim_quantity}
            onChange={(e) => onChange(index, e)}
            placeholder="Quantity"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* AREA */}

        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Total Area (SQFT) *
          </label>

          <input
            type="number"
            step="0.01"
            min="0"
            name="woim_area"
            value={media.woim_area}
            readOnly
            className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-gray-700 focus:outline-none"
          />
        </div>

        {/* CREATIVE */}

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-gray-700">
            Creative
          </label>

          <input
            type="text"
            name="woim_creative"
            value={media.woim_creative}
            onChange={(e) => onChange(index, e)}
            placeholder="Enter creative details"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* IMAGE */}

        <div className="md:col-span-2">
          <label className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FiImage />
            Creative Image
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            disabled={loading}
            onChange={(e) => onImageChange(index, e)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />

          {/* IMAGE PREVIEW */}

          {media.imagePreview && (
            <div className="relative mt-3 w-fit">
              <img
                src={media.imagePreview}
                alt={`Creative ${index + 1}`}
                className="h-32 w-32 rounded-lg border border-gray-300 object-cover shadow-sm"
              />

              <button
                type="button"
                disabled={loading}
                onClick={() => onRemoveImage(index, fileInputRef)}
                className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 disabled:opacity-50"
              >
                <IoClose />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddWorkItemsModel;
