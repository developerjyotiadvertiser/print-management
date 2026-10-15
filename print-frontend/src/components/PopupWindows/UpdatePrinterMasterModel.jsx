import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";

const UpdatePrinterMasterModel = ({
  isPrintMasterOpen,
  onPrintMasterClose,
  getAllPrinterMaster,
  selected,
}) => {
  const modalRef = useRef();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
    printer_name: "",
    pm_gst_number: "",
    pm_address: "",
    pm_pan_number: "",
    pm_pincode: "",
    pm_status: "Active",
  });

  const [loading, setLoading] = useState(false);
  const [fetchingGST, setFetchingGST] = useState(false);
  const [gstFetched, setGstFetched] = useState(false);

  // --------------------------------
  // LOAD SELECTED PRINTER DATA
  // --------------------------------
  useEffect(() => {
    if (!selected) return;

    setFormData({
      printer_name: selected?.printer_name || "",
      pm_gst_number: selected?.pm_gst_number || "",
      pm_address: selected?.pm_address || "",
      pm_pan_number: selected?.pm_pan_number || "",
      pm_pincode: selected?.pm_pincode || "",
      pm_status: selected?.pm_status || "Active",
    });

    setGstFetched(!!selected?.pm_gst_number);
  }, [selected]);

  // --------------------------------
  // HANDLE INPUT CHANGE
  // --------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;

    // GST NUMBER
    if (name === "pm_gst_number") {
      updatedValue = value.toUpperCase().slice(0, 15);

      // GST changed -> clear old fetched details
      if (updatedValue !== formData.pm_gst_number) {
        setGstFetched(false);

        setFormData((prev) => ({
          ...prev,
          pm_gst_number: updatedValue,
          printer_name: "",
          pm_address: "",
          pm_pan_number: "",
          pm_pincode: "",
        }));

        return;
      }
    }

    // PINCODE
    if (name === "pm_pincode") {
      updatedValue = value.replace(/\D/g, "").slice(0, 6);
    }

    // PAN
    if (name === "pm_pan_number") {
      updatedValue = value.toUpperCase().slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));
  };

  // --------------------------------
  // MAP GST DETAILS
  // --------------------------------
  const mapGSTDetails = (data) => {
    const address =
      data?.principalPlaceOfBusinessFields?.principalPlaceOfBusinessAddress;

    const printerAddress = [
      address?.buildingNumber,
      address?.buildingName,
      address?.streetName,
      address?.location,
      address?.locality,
      address?.landMark,
      address?.districtName,
      address?.stateName,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      printer_name: data?.tradeName || data?.legalNameOfBusiness || "",
      pm_pan_number: data?.gstIdentificationNumber?.slice(2, 12) || "",
      pm_address: printerAddress,
      pm_pincode: address?.pincode || "",
    };
  };

  // --------------------------------
  // FETCH GST DETAILS
  // --------------------------------
  const handleFetchGST = async () => {
    const gstNumber = formData.pm_gst_number.trim().toUpperCase();

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

    if (!gstRegex.test(gstNumber)) {
      toast.error("Please enter a valid GST number");
      return;
    }

    try {
      setFetchingGST(true);
      const response = await axios.post(
        `${apiUrl}/api/client/fetch-gst-details`,
        {
          gst_number: gstNumber,
        },
      );

      if (!response.data.success) {
        toast.error(response.data.message || "GST details not found");
        return;
      }

      const gstData = response.data.data;

      // --------------------------------
      // VERIFY GST NUMBER
      // --------------------------------
      if (gstData?.gstIdentificationNumber?.toUpperCase() !== gstNumber) {
        toast.error("GST number does not match API response");
        return;
      }

      // --------------------------------
      // CHECK GST STATUS
      // --------------------------------
      if (gstData?.gstnStatus?.toLowerCase() !== "active") {
        toast.error(
          `GST registration status: ${gstData?.gstnStatus || "Unknown"}`,
        );
        return;
      }

      // --------------------------------
      // MAP DETAILS
      // --------------------------------
      const details = mapGSTDetails(gstData);
      setFormData((prev) => ({
        ...prev,
        ...details,
        pm_gst_number: gstNumber,
      }));

      setGstFetched(true);
      toast.success("GST details fetched successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch GST details",
      );
    } finally {
      setFetchingGST(false);
    }
  };

  // --------------------------------
  // SUBMIT
  // --------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.pm_pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }

    if (!formData.printer_name.trim()) {
      toast.error("Printer name is required");
      return;
    }

    if (!formData.pm_address.trim()) {
      toast.error("Printer address is required");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        printer_name: formData.printer_name?.toUpperCase(),
        pm_gst_number: formData.pm_gst_number?.toUpperCase(),
        pm_address: formData.pm_address,
        pm_pan_number: formData.pm_pan_number?.toUpperCase(),
        pm_pincode: formData.pm_pincode,
        pm_status: formData.pm_status,
      };

      const response = await axios.put(
        `${apiUrl}/api/printer-master/update-printer-master/${selected?.pm_id}`,
        payload,
      );

      if (response.data.success) {
        toast.success(response.data.message);
        await getAllPrinterMaster();
        onPrintMasterClose();
      } else {
        toast.error(response.data.message || "Failed to update printer master");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update printer master",
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // CLOSE MODAL
  // --------------------------------
  const handleClose = () => {
    if (loading || fetchingGST) return;
    onPrintMasterClose();
  };

  // --------------------------------
  // CLOSE OUTSIDE
  // --------------------------------
  useEffect(() => {
    if (!isPrintMasterOpen) return;
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPrintMasterOpen, loading, fetchingGST]);

  if (!isPrintMasterOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        {/* HEADER */}
        <div className="mb-5 flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-semibold text-blue-800">
            Update Printer Master
          </h2>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading || fetchingGST}
            className="text-gray-500 transition hover:text-red-500 disabled:opacity-50"
          >
            <IoClose className="text-2xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* GST NUMBER */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              GST Number
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                name="pm_gst_number"
                value={formData.pm_gst_number}
                onChange={handleChange}
                placeholder="Enter GST number"
                maxLength={15}
                disabled={loading || fetchingGST}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2.5 uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              <button
                type="button"
                onClick={handleFetchGST}
                disabled={loading || fetchingGST}
                className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {fetchingGST ? "Fetching..." : "Fetch"}
              </button>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Enter GST number and fetch registered printer details.
            </p>
          </div>

          {/* GST SUCCESS */}
          {gstFetched && (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              GST details fetched successfully
            </div>
          )}

          {/* PRINTER NAME */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Name *
            </label>

            <input
              type="text"
              name="printer_name"
              value={formData.printer_name}
              onChange={handleChange}
              placeholder="Enter printer name"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* ADDRESS */}
          <div className="mt-2">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Address *
            </label>

            <textarea
              name="pm_address"
              value={formData.pm_address}
              onChange={handleChange}
              placeholder="Enter printer address"
              required
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* PAN + PINCODE */}
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                PAN Number
              </label>

              <input
                type="text"
                name="pm_pan_number"
                value={formData.pm_pan_number}
                onChange={handleChange}
                placeholder="PAN number"
                maxLength={10}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Pincode *
              </label>

              <input
                type="text"
                name="pm_pincode"
                value={formData.pm_pincode}
                onChange={handleChange}
                placeholder="Enter pincode"
                maxLength={6}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* STATUS */}
          <div className="mt-2">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Status *
            </label>

            <select
              name="pm_status"
              value={formData.pm_status}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* BUTTONS */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading || fetchingGST}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || fetchingGST}
              className={`rounded-lg px-6 py-2.5 text-white ${
                loading || fetchingGST
                  ? "bg-gray-500"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Updating..." : "Update Printer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePrinterMasterModel;
