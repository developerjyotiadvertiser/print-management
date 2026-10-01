import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";

const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

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
    woi_media: "",
    woi_size_height: "",
    woi_size_width: "",
    woi_unit: "",
    woi_quantity: "",
    woi_area: "",
    woi_creative: "",
    woi_status: "Done",
  });

  const [loading, setLoading] = useState(false);

  // --------------------------------
  // LOAD SELECTED WORK ITEM
  // --------------------------------
  useEffect(() => {
    if (!isItemOpen || !selectedWorkItem) return;

    let jcNumber = selectedWorkItem?.woi_jc_number || "";

    // Remove JC- prefix while displaying in input
    if (jcNumber.startsWith("JC-")) {
      jcNumber = jcNumber.substring(3);
    }

    setFormData({
      woi_jc_number: jcNumber,
      woi_work_allot_date:
        selectedWorkItem?.woi_work_allot_date?.split("T")[0] || getTodayDate(),
      woi_printer_name: selectedWorkItem?.woi_printer_name || "",
      woi_media: selectedWorkItem?.woi_media || "",
      woi_size_height: selectedWorkItem?.woi_size_height || "",
      woi_size_width: selectedWorkItem?.woi_size_width || "",
      woi_unit: selectedWorkItem?.woi_unit || "",
      woi_quantity: selectedWorkItem?.woi_quantity || "",
      woi_area: selectedWorkItem?.woi_area || "",
      woi_creative: selectedWorkItem?.woi_creative || "",
      woi_status: selectedWorkItem?.woi_status || "Done",
    });
  }, [isItemOpen, selectedWorkItem]);

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
  // CALCULATE TOTAL SIZE IN SQ.FT
  // --------------------------------
  useEffect(() => {
    const { woi_size_width, woi_size_height, woi_unit, woi_quantity } =
      formData;

    if (!woi_size_width || !woi_size_height || !woi_unit || !woi_quantity) {
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

    // Total area = Width × Height × Quantity
    const area = widthInFeet * heightInFeet * quantity;

    setFormData((prev) => {
      const calculatedArea = area.toFixed(2);

      // Prevent unnecessary state update
      if (prev.woi_area === calculatedArea) {
        return prev;
      }

      return {
        ...prev,
        woi_area: calculatedArea,
      };
    });
  }, [
    formData.woi_size_width,
    formData.woi_size_height,
    formData.woi_unit,
    formData.woi_quantity,
  ]);

  // --------------------------------
  // SUBMIT UPDATE
  // --------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedWorkItem?.woi_id) {
      toast.error("Work item ID not found.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        woi_jc_number: `JC-${formData.woi_jc_number}`,
        woi_work_allot_date: formData.woi_work_allot_date,
        woi_printer_name: formData.woi_printer_name,
        woi_media: formData.woi_media,
        woi_size_height: formData.woi_size_height,
        woi_size_width: formData.woi_size_width,
        woi_unit: formData.woi_unit,
        woi_quantity: formData.woi_quantity,
        woi_area: formData.woi_area,
        woi_creative: formData.woi_creative,
        woi_status: formData.woi_status,
      };

      const response = await axios.put(
        `${apiUrl}/api/work-items/update-work-items/${selectedWorkItem.woi_id}`,
        payload,
      );

      if (response.data.success) {
        toast.success(
          response.data.message || "Work item updated successfully.",
        );

        await getAllWorkItems();

        onItemClose();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update work item.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isItemOpen) return null;

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-semibold text-blue-800">
            Update Work Item
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
                  onChange={handleChange}
                  placeholder="Enter number"
                  required
                  className="w-full rounded-r-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Work Allot Date */}
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

            {/* Printer Name */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Printer Name *
              </label>

              <input
                type="text"
                name="woi_printer_name"
                value={formData.woi_printer_name}
                onChange={handleChange}
                placeholder="Enter printer name"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Media */}
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
                name="woi_size_height"
                value={formData.woi_size_height}
                onChange={handleChange}
                placeholder="Enter height"
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
                name="woi_size_width"
                value={formData.woi_size_width}
                onChange={handleChange}
                placeholder="Enter width"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Size Unit */}
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

            {/* Quantity */}
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

            {/* Area */}
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

            {/* Status */}
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

            {/* Creative */}
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
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Buttons */}
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
  );
};

export default UpdateWorkItemsModel;
