import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";

const initialFormData = {
  client_name: "",
  client_contact: "",
  client_address: "",
  pan_number: "",
  gst_number: null,
  pincode: "",
};

const AddClientWithGSTModal = ({ isOpen, onClose, getAllClientData }) => {
  const modalRef = useRef();

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [fetchingGST, setFetchingGST] = useState(false);
  const [gstFetched, setGstFetched] = useState(false);
  const [urv, setUrv] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  // --------------------------------------------------
  // Reset Form
  // --------------------------------------------------

  const resetForm = () => {
    setFormData({ ...initialFormData });
    setGstFetched(false);
  };

  // --------------------------------------------------
  // Close Modal
  // --------------------------------------------------

  const handleClose = () => {
    if (loading || fetchingGST) return;

    resetForm();
    onClose();
  };

  // --------------------------------------------------
  // Close Modal on Outside Click and Escape
  // --------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        handleClose();
      }
    };

    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);

      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, loading, fetchingGST]);

  // --------------------------------------------------
  // Handle Input Changes
  // --------------------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    let updatedValue = value;

    // GST Number
    if (name === "gst_number") {
      updatedValue = value.toUpperCase().slice(0, 15);

      if (updatedValue !== formData.gst_number) {
        setGstFetched(false);

        setFormData((prev) => ({
          ...prev,
          gst_number: updatedValue,
          client_name: "",
          client_address: "",
          pan_number: "",
          pincode: "",
        }));

        return;
      }
    }

    // Contact Number
    if (name === "client_contact") {
      updatedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    // Pincode
    if (name === "pincode") {
      updatedValue = value.replace(/\D/g, "").slice(0, 6);
    }

    // PAN Number
    if (name === "pan_number") {
      updatedValue = value.toUpperCase().slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));
  };

  // --------------------------------------------------
  // Map GST Response
  // --------------------------------------------------

  // --------------------------------------------------
  // Map GST Response
  // --------------------------------------------------

  const mapGSTDetails = (data) => {
    const address =
      data?.principalPlaceOfBusinessFields?.principalPlaceOfBusinessAddress;

    const clientAddress = [
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
      client_name: data?.tradeName || data?.legalNameOfBusiness || "",

      // PAN is available inside GSTIN
      pan_number: data?.gstIdentificationNumber?.slice(2, 12) || "",

      client_address: clientAddress,
      pincode: address?.pincode || "",
    };
  };

  // --------------------------------------------------
  // Fetch GST Details Through Backend API
  // --------------------------------------------------

  // --------------------------------------------------
  // Fetch GST Details Through Backend API
  // --------------------------------------------------

  const handleFetchGST = async () => {
    const gstNumber = formData.gst_number.trim().toUpperCase();

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

      // Verify returned GSTIN
      if (gstData?.gstIdentificationNumber?.toUpperCase() !== gstNumber) {
        toast.error("GST number does not match API response");
        return;
      }

      // Check GST registration status
      if (gstData?.gstnStatus?.toLowerCase() !== "active") {
        toast.error(
          `GST registration status: ${gstData?.gstnStatus || "Unknown"}`,
        );
        return;
      }

      const details = mapGSTDetails(gstData);

      setFormData((prev) => ({
        ...prev,
        ...details,
        gst_number: gstNumber,
      }));

      setGstFetched(true);

      toast.success("GST details fetched successfully");
    } catch (error) {
      console.error(
        "GST Details Error:",
        error.response?.data || error.message,
      );

      toast.error(
        error.response?.data?.message || "Failed to fetch GST details",
      );
    } finally {
      setFetchingGST(false);
    }
  };

  // --------------------------------------------------
  // Save Client
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    // if (!gstFetched) {
    //   toast.error("Please fetch GST details first");
    //   return;
    // }

    if (formData.client_contact.length !== 10) {
      toast.error("Please enter a valid 10-digit contact number");
      return;
    }

    if (formData.pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }

    if (!formData.client_name.trim()) {
      toast.error("Client name is required");
      return;
    }

    if (!formData.client_address.trim()) {
      toast.error("Client address is required");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${apiUrl}/api/client/save-client`,
        formData,
      );

      if (response.data.success) {
        toast.success(response.data.message);

        await getAllClientData();

        resetForm();
        onClose();
      } else {
        toast.error(response.data.message || "Failed to add client");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add client");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  console.log("formdata 294", formData);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-semibold text-blue-800">
            Add Client Using GST
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
          {/* GST Number */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              GST Number
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                placeholder="Enter GST number"
                maxLength={15}
                disabled={urv}
                className={`min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2.5 uppercase focus:outline-none focus:ring-2 focus:ring-blue-400 ${urv ? "bg-gray-300" : "bg-white"}`}
              />

              <button
                type="button"
                onClick={handleFetchGST}
                disabled={fetchingGST || loading}
                className={`shrink-0 rounded-lg  px-4 py-2.5 text-white  disabled:opacity-50 ${urv ? "bg-gray-300" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {fetchingGST ? "Fetching..." : "Fetch"}
              </button>
              <button
                type="button"
                onClick={() => setUrv(!urv)}
                className="shrink-0 rounded-lg bg-cyan-600 px-4 py-2.5 text-white hover:bg-cyan-700 disabled:opacity-50"
              >
                URD
              </button>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Enter the GST number and fetch registered details.
            </p>
          </div>

          {/* GST Fetch Status */}
          {gstFetched && (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              GST details fetched successfully
            </div>
          )}

          {/* Client Name */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Client Name *
            </label>

            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              placeholder="Enter client name"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Client Contact */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Client Contact *
            </label>

            <input
              type="tel"
              name="client_contact"
              value={formData.client_contact}
              onChange={handleChange}
              placeholder="Enter contact number"
              required
              minLength={10}
              maxLength={10}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Client Address */}
          <div className="mt-4">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Client Address *
            </label>

            <textarea
              name="client_address"
              value={formData.client_address}
              onChange={handleChange}
              placeholder="Enter client address"
              required
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* PAN and Pincode */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                PAN Number
              </label>

              <input
                type="text"
                name="pan_number"
                value={formData.pan_number}
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
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="Enter pincode"
                maxLength={6}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Buttons */}
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
              //   disabled={loading || fetchingGST || !gstFetched}
              disabled={loading || fetchingGST}
              className={`rounded-lg px-6 py-2.5 text-white ${
                loading || fetchingGST
                  ? "bg-gray-500"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Saving..." : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientWithGSTModal;
