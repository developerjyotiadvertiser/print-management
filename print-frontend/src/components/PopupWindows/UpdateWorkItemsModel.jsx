import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";
import { FiPlus, FiTrash2, FiImage } from "react-icons/fi";

const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// --------------------------------------------------
// CREATE EMPTY MEDIA ITEM
// --------------------------------------------------

const createEmptyMedia = () => ({
  woim_id: null,

  woim_media: "",
  woim_size_height: "",
  woim_size_width: "",
  woim_unit: "",
  woim_quantity: "",
  woim_area: "",
  woim_creative: "",

  // Existing image URL
  woim_creative_image: "",

  // New image File
  imageFile: null,

  // Preview URL
  imagePreview: "",
});

const UpdateWorkItemsModel = ({
  isItemOpen,
  onItemClose,
  getAllWorkItems,
  mediaType,
  selectedWorkItem,
}) => {
  const modalRef = useRef();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
    woi_jc_number: "",
    woi_work_allot_date: getTodayDate(),
    woi_printer_name: "",
    woi_status: "Done",
  });

  const [mediaItems, setMediaItems] = useState([createEmptyMedia()]);

  const [loading, setLoading] = useState(false);

  // =========================================================
  // LOAD SELECTED WORK ITEM
  // =========================================================

  useEffect(() => {
    if (!isItemOpen || !selectedWorkItem) return;

    let jcNumber = selectedWorkItem?.woi_jc_number || "";

    // Remove JC- prefix
    if (jcNumber.startsWith("JC-")) {
      jcNumber = jcNumber.substring(3);
    }

    setFormData({
      woi_jc_number: jcNumber,

      woi_work_allot_date:
        selectedWorkItem?.woi_work_allot_date?.split("T")[0] || getTodayDate(),

      woi_printer_name: selectedWorkItem?.woi_printer_name || "",

      woi_status: selectedWorkItem?.woi_status || "Done",
    });

    // --------------------------------------------------------
    // LOAD MEDIA ITEMS
    // --------------------------------------------------------

    let existingMedia = selectedWorkItem?.media_items || [];

    // In case API returns JSON string
    if (typeof existingMedia === "string") {
      try {
        existingMedia = JSON.parse(existingMedia);
      } catch (error) {
        existingMedia = [];
      }
    }

    if (!Array.isArray(existingMedia)) {
      existingMedia = [];
    }

    // Remove null values if JSON_ARRAYAGG produced null
    existingMedia = existingMedia.filter(Boolean);

    if (existingMedia.length === 0) {
      setMediaItems([createEmptyMedia()]);
      return;
    }

    const formattedMedia = existingMedia.map((media) => {
      const imagePath = media?.woim_creative_image || "";

      let imagePreview = "";

      if (imagePath) {
        const cleanPath = imagePath.replace(/^\/+/, "");
        imagePreview = `${apiUrl}/${cleanPath}`;
      }

      return {
        woim_id: media?.woim_id || null,

        woim_media: media?.woim_media || "",

        woim_size_height: media?.woim_size_height ?? "",

        woim_size_width: media?.woim_size_width ?? "",

        woim_unit: media?.woim_unit || "",

        woim_quantity: media?.woim_quantity ?? "",

        woim_area: media?.woim_area ?? "",

        woim_creative: media?.woim_creative || "",

        woim_creative_image: imagePath,

        imageFile: null,

        imagePreview,
      };
    });

    setMediaItems(formattedMedia);
  }, [isItemOpen, selectedWorkItem, apiUrl]);

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const handleClose = () => {
    if (!loading) {
      onItemClose();
    }
  };

  // =========================================================
  // ESC KEY
  // =========================================================

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

  // =========================================================
  // PARENT FIELD CHANGE
  // =========================================================

  const handleParentChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================================
  // MEDIA FIELD CHANGE
  // =========================================================

  const handleMediaChange = (index, e) => {
    const { name, value } = e.target;

    setMediaItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [name]: value,
            }
          : item,
      ),
    );
  };

  // =========================================================
  // CALCULATE MEDIA AREA
  // =========================================================

  useEffect(() => {
    setMediaItems((prev) =>
      prev.map((item) => {
        const { woim_size_width, woim_size_height, woim_unit, woim_quantity } =
          item;

        if (
          !woim_size_width ||
          !woim_size_height ||
          !woim_unit ||
          !woim_quantity
        ) {
          if (item.woim_area !== "") {
            return {
              ...item,
              woim_area: "",
            };
          }

          return item;
        }

        let widthInFeet = Number(woim_size_width);
        let heightInFeet = Number(woim_size_height);

        const quantity = Number(woim_quantity);

        if (
          !Number.isFinite(widthInFeet) ||
          !Number.isFinite(heightInFeet) ||
          !Number.isFinite(quantity)
        ) {
          return item;
        }

        // Convert Inch → Feet
        if (woim_unit === "Inch") {
          widthInFeet = widthInFeet / 12;
          heightInFeet = heightInFeet / 12;
        }

        const area = widthInFeet * heightInFeet * quantity;

        const calculatedArea = area.toFixed(2);

        if (item.woim_area === calculatedArea) {
          return item;
        }

        return {
          ...item,
          woim_area: calculatedArea,
        };
      }),
    );
  }, [
    JSON.stringify(
      mediaItems.map((item) => ({
        woim_size_width: item.woim_size_width,
        woim_size_height: item.woim_size_height,
        woim_unit: item.woim_unit,
        woim_quantity: item.woim_quantity,
      })),
    ),
  ]);

  // =========================================================
  // ADD MEDIA
  // =========================================================

  const handleAddMedia = () => {
    setMediaItems((prev) => [...prev, createEmptyMedia()]);
  };

  // =========================================================
  // REMOVE MEDIA
  // =========================================================

  const handleRemoveMedia = (index) => {
    if (mediaItems.length === 1) {
      toast.error("At least one media item is required.");
      return;
    }

    setMediaItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  // =========================================================
  // IMAGE CHANGE
  // =========================================================

  const handleImageChange = (index, e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // 20 MB
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image size must be less than 20 MB.");
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setMediaItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        // Revoke previous local preview
        if (item.imagePreview && item.imagePreview.startsWith("blob:")) {
          URL.revokeObjectURL(item.imagePreview);
        }

        return {
          ...item,

          imageFile: file,

          imagePreview: previewUrl,
        };
      }),
    );
  };

  // =========================================================
  // REMOVE / CLEAR IMAGE
  // =========================================================

  const handleRemoveImage = (index) => {
    setMediaItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        if (item.imagePreview && item.imagePreview.startsWith("blob:")) {
          URL.revokeObjectURL(item.imagePreview);
        }

        return {
          ...item,

          imageFile: null,

          imagePreview: "",

          woim_creative_image: "",
        };
      }),
    );
  };

  // =========================================================
  // SUBMIT UPDATE
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedWorkItem?.woi_id) {
      toast.error("Work item ID not found.");
      return;
    }

    // -------------------------------------------------------
    // VALIDATE MEDIA
    // -------------------------------------------------------

    if (!mediaItems.length) {
      toast.error("Please add at least one media item.");
      return;
    }

    for (let i = 0; i < mediaItems.length; i++) {
      const media = mediaItems[i];

      if (!media.woim_media) {
        toast.error(`Please select media for item ${i + 1}.`);
        return;
      }

      if (!media.woim_size_height) {
        toast.error(`Please enter height for item ${i + 1}.`);
        return;
      }

      if (!media.woim_size_width) {
        toast.error(`Please enter width for item ${i + 1}.`);
        return;
      }

      if (!media.woim_unit) {
        toast.error(`Please select unit for item ${i + 1}.`);
        return;
      }

      if (!media.woim_quantity) {
        toast.error(`Please enter quantity for item ${i + 1}.`);
        return;
      }
    }

    try {
      setLoading(true);

      // =====================================================
      // FORM DATA
      // =====================================================

      const formDataToSend = new FormData();

      // -----------------------------------------------------
      // PARENT DATA
      // -----------------------------------------------------

      formDataToSend.append("woi_jc_number", `JC-${formData.woi_jc_number}`);

      formDataToSend.append(
        "woi_work_allot_date",
        formData.woi_work_allot_date,
      );

      formDataToSend.append("woi_printer_name", formData.woi_printer_name);

      formDataToSend.append("woi_status", formData.woi_status);

      // =====================================================
      // MEDIA DATA
      // =====================================================

      const mediaPayload = mediaItems.map((media) => ({
        woim_id: media.woim_id || null,

        woim_media: media.woim_media,

        woim_size_height: media.woim_size_height,

        woim_size_width: media.woim_size_width,

        woim_unit: media.woim_unit,

        woim_quantity: media.woim_quantity,

        woim_area: media.woim_area,

        woim_creative: media.woim_creative,

        // Existing image path
        // If new image is selected, backend will replace it.
        woim_creative_image: media.imageFile
          ? undefined
          : media.woim_creative_image || null,
      }));

      formDataToSend.append("media_items", JSON.stringify(mediaPayload));

      // =====================================================
      // IMAGES
      // =====================================================

      mediaItems.forEach((media) => {
        if (media.imageFile) {
          formDataToSend.append("woi_creative_images", media.imageFile);
        }
      });

      // =====================================================
      // API REQUEST
      // =====================================================

      const response = await axios.put(
        `${apiUrl}/api/work-items/update-work-items/${selectedWorkItem.woi_id}`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        toast.success(
          response.data.message || "Work item updated successfully.",
        );

        await getAllWorkItems();

        onItemClose();
      }
    } catch (error) {
      console.error("Update Work Item Error:", error);

      toast.error(
        error.response?.data?.message || "Failed to update work item.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // CLEANUP OBJECT URLS
  // =========================================================

  useEffect(() => {
    return () => {
      mediaItems.forEach((item) => {
        if (item.imagePreview && item.imagePreview.startsWith("blob:")) {
          URL.revokeObjectURL(item.imagePreview);
        }
      });
    };
  }, [mediaItems]);

  // =========================================================
  // RENDER
  // =========================================================

  if (!isItemOpen) return null;

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-blue-800">
              Update Work Item
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update work order and media details
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-gray-500 transition hover:text-red-500 disabled:opacity-50"
          >
            <IoClose className="text-2xl" />
          </button>
        </div>

        {/* ================================================= */}
        {/* SCROLLABLE CONTENT */}
        {/* ================================================= */}

        <div className="overflow-y-auto px-6 py-5">
          <form onSubmit={handleSubmit}>
            {/* ================================================= */}
            {/* PARENT DETAILS */}
            {/* ================================================= */}

            <div className="rounded-xl border bg-gray-50 p-4">
              <h3 className="mb-4 text-base font-semibold text-gray-800">
                Work Order Details
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                {/* JC Number */}

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
                      onChange={handleParentChange}
                      placeholder="Enter number"
                      required
                      className="w-full rounded-r-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                {/* Date */}

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Work Allot Date *
                  </label>

                  <input
                    type="date"
                    name="woi_work_allot_date"
                    value={formData.woi_work_allot_date}
                    onChange={handleParentChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Printer */}

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Printer Name *
                  </label>

                  <input
                    type="text"
                    name="woi_printer_name"
                    value={formData.woi_printer_name}
                    onChange={handleParentChange}
                    placeholder="Enter printer name"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Status */}

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Status *
                  </label>

                  <select
                    name="woi_status"
                    value={formData.woi_status}
                    onChange={handleParentChange}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="Done">Done</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* MEDIA SECTION */}
            {/* ================================================= */}

            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Media Details
                  </h3>

                  <p className="text-sm text-gray-500">
                    Add or update media items for this work order.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddMedia}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  <FiPlus />
                  Add Print
                </button>
              </div>

              {/* ================================================= */}
              {/* MEDIA ITEMS */}
              {/* ================================================= */}

              <div className="space-y-5">
                {mediaItems.map((media, index) => (
                  <div
                    key={media.woim_id || `new-media-${index}`}
                    className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    {/* Header */}

                    <div className="mb-4 flex items-center justify-between border-b pb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          Media #{index + 1}
                        </h4>

                        {media.woim_id && (
                          <span className="text-xs text-gray-400">
                            ID: {media.woim_id}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(index)}
                        disabled={loading}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <FiTrash2 />
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                      {/* Media */}

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                          Media *
                        </label>

                        <select
                          name="woim_media"
                          value={media.woim_media}
                          onChange={(e) => handleMediaChange(index, e)}
                          required
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="">-select-</option>

                          {mediaType?.map((item) => (
                            <option key={item?.mt_id} value={item?.mt_name}>
                              {item?.mt_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Height */}

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
                          onChange={(e) => handleMediaChange(index, e)}
                          placeholder="Height"
                          required
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
                          step="0.01"
                          min="0"
                          name="woim_size_width"
                          value={media.woim_size_width}
                          onChange={(e) => handleMediaChange(index, e)}
                          placeholder="Width"
                          required
                          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>

                      {/* Unit */}

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                          Size Unit *
                        </label>

                        <select
                          name="woim_unit"
                          value={media.woim_unit}
                          onChange={(e) => handleMediaChange(index, e)}
                          required
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="">Select Unit</option>

                          <option value="Feet">Feet</option>

                          <option value="Inch">Inch</option>
                        </select>
                      </div>

                      {/* Quantity */}

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                          Quantity *
                        </label>

                        <input
                          type="number"
                          min="1"
                          name="woim_quantity"
                          value={media.woim_quantity}
                          onChange={(e) => handleMediaChange(index, e)}
                          placeholder="Quantity"
                          required
                          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>

                      {/* Area */}

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

                      {/* Creative */}

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                          Creative
                        </label>

                        <input
                          type="text"
                          name="woim_creative"
                          value={media.woim_creative}
                          onChange={(e) => handleMediaChange(index, e)}
                          placeholder="Creative details"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </div>

                    {/* ================================================= */}
                    {/* IMAGE */}
                    {/* ================================================= */}

                    <div className="mt-5 border-t pt-5">
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Creative Image
                      </label>

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        {/* Preview */}

                        {media.imagePreview ? (
                          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                            <img
                              src={media.imagePreview}
                              alt={`Media ${index + 1}`}
                              className="h-full w-full object-cover"
                            />

                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              disabled={loading}
                              className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white shadow hover:bg-red-700"
                            >
                              <IoClose />
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400">
                            <div className="text-center">
                              <FiImage className="mx-auto text-3xl" />

                              <p className="mt-1 text-xs">No Image</p>
                            </div>
                          </div>
                        )}

                        {/* File */}

                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(index, e)}
                            disabled={loading}
                            className="block w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-700 file:mr-4 file:border-0 file:bg-blue-600 file:px-4 file:py-2.5 file:text-white hover:file:bg-blue-700"
                          />

                          <p className="mt-2 text-xs text-gray-500">
                            Maximum file size: 20 MB. New image will replace the
                            existing image.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ================================================= */}
            {/* BUTTONS */}
            {/* ================================================= */}

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
                {loading ? "Updating..." : "Update Work Item"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateWorkItemsModel;
