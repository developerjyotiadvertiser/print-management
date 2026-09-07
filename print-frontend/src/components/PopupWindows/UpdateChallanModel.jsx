import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";

const UpdateChallanModel = ({
  isOpen,
  onClose,
  getAllChallanData,
  printRecords,
  employees,
  selected,
}) => {
  const modalRef = useRef();
  const initialFormData = {
    ch_id: "",
    ch_client_id: "",
    ch_date: "",
    ch_delivered_to: "",
    ch_phone: "",
    ch_remark: "",
    pan_number: "",
    gst_number: "",
    pincode: "",
    prints: [],
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  // Populate form when selected challan changes
  useEffect(() => {
    if (!isOpen || !selected) return;
    const selectedPrints = Array.isArray(selected.prints)
      ? selected.prints
      : [];

    setFormData({
      ch_id: selected.ch_id || "",
      ch_client_id: selected.ch_client_id || "",
      ch_date: selected.ch_date ? String(selected.ch_date).split("T")[0] : "",
      ch_delivered_to: selected.ch_delivered_to || "",
      ch_phone: selected.ch_phone || "",
      ch_remark: selected.ch_remark || "",
      pan_number: selected.pan_number || "",
      gst_number: selected.gst_number || "",
      pincode: selected.pincode || "",
      prints: selectedPrints.map((print) => ({
        pci_id: print.pci_id || "",
        pci_ch_id: print.pci_ch_id || selected.ch_id || "",
        pci_print_id: print.pci_print_id || "",
        pci_description: print.pci_description || "",
        pci_creative: print.pci_creative || "",
        pci_height: print.pci_height || "",
        pci_width: print.pci_width || "",
        pci_quantity: print.pci_quantity || "",
        pci_size_unit: print.pci_size_unit || "",
        pci_area: print.pci_area || "",
      })),
    });
  }, [isOpen, selected]);

  // Close when clicking outside
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

  // Client selection
  const handleClientChange = (e) => {
    const value = e.target.value;
    const selectedClient = employees?.find(
      (client) => String(client.client_id) === String(value),
    );

    if (selectedClient) {
      setFormData((prev) => ({
        ...prev,
        ch_client_id: value,
        ch_phone: selectedClient.client_phone || "",
        pan_number: selectedClient.pan_number || "",
        gst_number: selectedClient.gst_number || "",
        pincode: selectedClient.pincode || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        ch_client_id: value,
        ch_phone: "",
        pan_number: "",
        gst_number: "",
        pincode: "",
      }));
    }
  };

  // Challan-level input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "ch_phone") {
      const phone = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        ch_phone: phone,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Print input change
  const handlePrintChange = (index, e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updatedPrints = [...prev.prints];
      updatedPrints[index] = {
        ...updatedPrints[index],
        [name]: value,
      };

      return {
        ...prev,
        prints: updatedPrints,
      };
    });
  };

  // Print selection
  const handlePrintSelection = (index, e) => {
    const value = e.target.value;
    const selectedPrint = printRecords?.find(
      (print) => String(print.print_id) === String(value),
    );

    setFormData((prev) => {
      const updatedPrints = [...prev.prints];
      if (selectedPrint) {
        updatedPrints[index] = {
          ...updatedPrints[index],
          pci_print_id: value,
          pci_creative: selectedPrint.creative || "",
          pci_height: selectedPrint.height || "",
          pci_width: selectedPrint.width || "",
          pci_quantity: selectedPrint.quantity || "",
          pci_size_unit: selectedPrint.ch_size_unit || "",
          pci_area: selectedPrint.area || "",
        };
      } else {
        updatedPrints[index] = {
          ...updatedPrints[index],
          pci_print_id: value,
          pci_creative: "",
          pci_height: "",
          pci_width: "",
          pci_quantity: "",
          pci_size_unit: "",
          pci_area: "",
        };
      }

      return {
        ...prev,
        prints: updatedPrints,
      };
    });
  };

  // Calculate print area
  const calculateArea = (print) => {
    const { pci_width, pci_height, pci_size_unit, pci_quantity } = print;

    if (
      pci_width === "" ||
      pci_height === "" ||
      pci_size_unit === "" ||
      pci_quantity === ""
    ) {
      return "";
    }

    let width = Number(pci_width);
    let height = Number(pci_height);
    const quantity = Number(pci_quantity);

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      !Number.isFinite(quantity)
    ) {
      return "";
    }

    if (pci_size_unit === "inch") {
      width = width / 12;
      height = height / 12;
    }

    return (width * height * quantity).toFixed(2);
  };

  // Automatically update areas
  useEffect(() => {
    if (!formData.prints.length) return;
    setFormData((prev) => {
      let changed = false;
      const updatedPrints = prev.prints.map((print) => {
        const calculatedArea = calculateArea(print);
        if (calculatedArea !== "" && calculatedArea !== print.pci_area) {
          changed = true;
          return {
            ...print,
            pci_area: calculatedArea,
          };
        }

        return print;
      });

      if (!changed) {
        return prev;
      }

      return {
        ...prev,
        prints: updatedPrints,
      };
    });
  }, [
    formData.prints
      .map(
        (print) =>
          `${print.pci_width}-${print.pci_height}-${print.pci_size_unit}-${print.pci_quantity}`,
      )
      .join("|"),
  ]);

  // Add new print
  const handleAddPrint = () => {
    setFormData((prev) => ({
      ...prev,
      prints: [
        ...prev.prints,
        {
          pci_id: "",
          pci_ch_id: prev.ch_id,
          pci_print_id: "",
          pci_description: "",
          pci_creative: "",
          pci_height: "",
          pci_width: "",
          pci_quantity: "",
          pci_size_unit: "",
          pci_area: "",
        },
      ],
    }));
  };

  // Remove print
  const handleRemovePrint = (index) => {
    setFormData((prev) => ({
      ...prev,
      prints: prev.prints.filter((_, i) => i !== index),
    }));
  };

  // Update Challan
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.ch_id) {
      toast.error("Challan ID is missing");
      return;
    }
    if (!formData.ch_client_id) {
      toast.error("Please select client");
      return;
    }
    if (!formData.prints.length) {
      toast.error("At least one print is required");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ch_client_id: formData.ch_client_id,
        ch_date: formData.ch_date,
        ch_delivered_to: formData.ch_delivered_to,
        ch_phone: formData.ch_phone,
        ch_remark: formData.ch_remark,

        prints: formData.prints.map((print) => ({
          pci_id: print.pci_id || "",
          pci_print_id: print.pci_print_id || null,
          pci_description: print.pci_description || null,
          pci_creative: print.pci_creative || null,
          pci_height: print.pci_height || null,
          pci_width: print.pci_width || null,
          pci_quantity: print.pci_quantity || null,
          pci_size_unit: print.pci_size_unit || null,
          pci_area: print.pci_area || null,
        })),
      };

      const response = await axios.put(
        `${apiUrl}/api/challan/update-challan/${formData.ch_id}`,
        payload,
      );

      if (response.data.success) {
        toast.success(response.data.message || "Challan updated successfully");
        await getAllChallanData();
        setFormData(initialFormData);
        onClose();
      } else {
        toast.error(response.data.message || "Failed to update challan");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update challan");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col"
      >
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-blue-800">
            Update Challan
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 transition hover:text-red-500"
          >
            <IoClose className="text-2xl" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto px-6 py-5">
          <form onSubmit={handleSubmit}>
            {/* CHALLAN DETAILS */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {/* Client */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Client *
                </label>
                <select
                  name="ch_client_id"
                  value={formData.ch_client_id}
                  onChange={handleClientChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Client</option>
                  {employees?.map((client) => (
                    <option key={client.client_id} value={client.client_id}>
                      {client.client_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* PAN */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  PAN Number
                </label>
                <input
                  type="text"
                  value={formData.pan_number}
                  disabled
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5"
                />
              </div>

              {/* GST */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  GST Number
                </label>
                <input
                  type="text"
                  value={formData.gst_number}
                  disabled
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5"
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Pincode
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  disabled
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  name="ch_phone"
                  value={formData.ch_phone}
                  onChange={handleChange}
                  maxLength={10}
                  placeholder="Enter phone number"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Delivered To */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Delivered To
                </label>
                <input
                  type="text"
                  name="ch_delivered_to"
                  value={formData.ch_delivered_to}
                  onChange={handleChange}
                  placeholder="Enter delivered person/place"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Remark */}
              <div className="md:col-span-4">
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Remark
                </label>
                <textarea
                  name="ch_remark"
                  value={formData.ch_remark}
                  onChange={handleChange}
                  placeholder="Enter remark"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* PRINTS */}
            <div className="mt-6 border-t pt-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Print Details
                </h3>
                <button
                  type="button"
                  onClick={handleAddPrint}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  + Add Print
                </button>
              </div>

              {formData.prints.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
                  No prints added.
                </div>
              ) : (
                <div className="space-y-5">
                  {formData.prints.map((print, index) => (
                    <div
                      key={print.pci_id || `new-${index}`}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                    >
                      {/* Print header */}
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-semibold text-gray-700">
                          Print #{index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleRemovePrint(index)}
                          className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        {/* Print ID */}
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-gray-700">
                            Print ID *
                          </label>
                          <select
                            name="pci_print_id"
                            value={print.pci_print_id}
                            onChange={(e) => handlePrintSelection(index, e)}
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          >
                            <option value="">Select Print ID</option>
                            {printRecords?.map((item) => (
                              <option key={item.print_id} value={item.print_id}>
                                {item.print_id} - {item.creative} -{" "}
                                {item.media_type}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Creative */}
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-gray-700">
                            Creative
                          </label>
                          <input
                            type="text"
                            name="pci_creative"
                            value={print.pci_creative}
                            onChange={(e) => handlePrintChange(index, e)}
                            placeholder="Enter creative"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>

                        {/* Height */}
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-gray-700">
                            Height
                          </label>
                          <input
                            type="number"
                            name="pci_height"
                            value={print.pci_height}
                            onChange={(e) => handlePrintChange(index, e)}
                            min="0"
                            step="any"
                            placeholder="Height"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>

                        {/* Width */}
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-gray-700">
                            Width
                          </label>
                          <input
                            type="number"
                            name="pci_width"
                            value={print.pci_width}
                            onChange={(e) => handlePrintChange(index, e)}
                            min="0"
                            step="any"
                            placeholder="Width"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-gray-700">
                            Quantity
                          </label>
                          <input
                            type="number"
                            name="pci_quantity"
                            value={print.pci_quantity}
                            onChange={(e) => handlePrintChange(index, e)}
                            min="1"
                            placeholder="Quantity"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>

                        {/* Size Unit */}
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-gray-700">
                            Size Unit *
                          </label>
                          <select
                            name="pci_size_unit"
                            value={print.pci_size_unit}
                            onChange={(e) => handlePrintChange(index, e)}
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          >
                            <option value="">Select Size Unit</option>
                            <option value="inch">Inch</option>
                            <option value="feet">Feet</option>
                          </select>
                        </div>

                        {/* Area */}
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-gray-700">
                            Area (Sq. Ft.)
                          </label>
                          <input
                            type="number"
                            value={print.pci_area}
                            readOnly
                            placeholder="Auto calculated"
                            className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5"
                          />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-4">
                          <label className="mb-1 block text-sm font-semibold text-gray-700">
                            Description *
                          </label>
                          <textarea
                            name="pci_description"
                            value={print.pci_description}
                            onChange={(e) => handlePrintChange(index, e)}
                            required
                            rows={2}
                            placeholder="Enter description"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BUTTONS */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
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
                {loading ? "Updating..." : "Update Challan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateChallanModel;
