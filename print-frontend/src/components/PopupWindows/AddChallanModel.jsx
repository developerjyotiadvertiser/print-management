import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";
import { FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import ChallanPrint from "../../pages/ChallanPrint";

const AddChallanModel = ({
  isOpen,
  onClose,
  getAllChallanData,
  printRecords,
  employees,
  onPrintChallan,
}) => {
  const modalRef = useRef();
  const initialFormData = {
    ch_client_id: "",
    ch_delivered_to: "",
    ch_phone: "",
    ch_remark: "",
    pan_number: "",
    gst_number: "",
    pincode: "",
    prints: [],
  };

  const initialPrint = {
    pci_print_id: "",
    pci_description: "",
    pci_creative: "",
    pci_height: "",
    pci_width: "",
    pci_quantity: "",
    pci_size_unit: "",
    pci_area: "",
    pci_location: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [currentPrint, setCurrentPrint] = useState(initialPrint);
  const [editingIndex, setEditingIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  const [challanPrintModel, setChallanPrintModel] = useState(false);
  const [selectedPrint, setSelectedPrint] = useState(null);

  console.log("challan Print", challanPrintModel);
  console.log("selected  print", selectedPrint);

  const handlePrintModel = (challan) => {
    setSelectedPrint(challan);
    setChallanPrintModel(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        if (!loading) {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, loading]);

  useEffect(() => {
    const { pci_width, pci_height, pci_size_unit, pci_quantity } = currentPrint;

    if (
      pci_width === "" ||
      pci_height === "" ||
      pci_size_unit === "" ||
      pci_quantity === ""
    ) {
      setCurrentPrint((prev) => ({
        ...prev,
        pci_area: "",
      }));

      return;
    }

    let widthInFeet = Number(pci_width);
    let heightInFeet = Number(pci_height);
    const quantity = Number(pci_quantity);
    if (
      !Number.isFinite(widthInFeet) ||
      !Number.isFinite(heightInFeet) ||
      !Number.isFinite(quantity)
    ) {
      return;
    }

    if (pci_size_unit === "inch") {
      widthInFeet = widthInFeet / 12;
      heightInFeet = heightInFeet / 12;
    }

    const area = widthInFeet * heightInFeet * quantity;
    setCurrentPrint((prev) => ({
      ...prev,
      pci_area: area.toFixed(2),
    }));
  }, [
    currentPrint.pci_width,
    currentPrint.pci_height,
    currentPrint.pci_size_unit,
    currentPrint.pci_quantity,
  ]);

  // CLIENT CHANGE
  const handleClientChange = (e) => {
    const { value } = e.target;
    const selectedClient = employees?.find(
      (client) => String(client.client_id) === String(value),
    );

    console.log("client", selectedClient);

    if (selectedClient) {
      setFormData((prev) => ({
        ...prev,
        ch_client_id: value,
        ch_phone: selectedClient.client_contact || "",
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

  // CHALLAN FIELD CHANGE
  const handleChallanChange = (e) => {
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

  // PRINT FIELD CHANGE
  const handlePrintChange = (e) => {
    const { name, value } = e.target;
    if (name === "pci_print_id") {
      const selectedPrint = printRecords?.find(
        (print) => String(print.print_id) === String(value),
      );

      if (selectedPrint) {
        setCurrentPrint((prev) => ({
          ...prev,
          pci_print_id: value,
          pci_creative: selectedPrint.creative || "",
          pci_height: selectedPrint.height || "",
          pci_width: selectedPrint.width || "",
          pci_quantity: selectedPrint.quantity || "",
          pci_size_unit: selectedPrint.pci_size_unit || "",
          pci_area: selectedPrint.area || "",
          pci_location: selectedPrint.location || "",
        }));
      } else {
        setCurrentPrint((prev) => ({
          ...prev,
          pci_print_id: "",
          pci_creative: "",
          pci_height: "",
          pci_width: "",
          pci_quantity: "",
          pci_size_unit: "",
          pci_area: "",
          pci_location: "",
        }));
      }

      return;
    }
    setCurrentPrint((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ADD / UPDATE PRINT
  const handleAddPrint = () => {
    if (!currentPrint.pci_print_id) {
      toast.error("Please select Print ID");
      return;
    }
    if (!currentPrint.pci_size_unit) {
      toast.error("Please select Size Unit");
      return;
    }
    if (!currentPrint.pci_description.trim()) {
      toast.error("Please enter Description");
      return;
    }
    if (!currentPrint.pci_quantity || Number(currentPrint.pci_quantity) <= 0) {
      toast.error("Please enter valid Quantity");
      return;
    }
    if (editingIndex !== null) {
      setFormData((prev) => ({
        ...prev,
        prints: prev.prints.map((print, index) =>
          index === editingIndex ? { ...currentPrint } : print,
        ),
      }));

      setEditingIndex(null);
      setCurrentPrint(initialPrint);
      toast.success("Print updated");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      prints: [...prev.prints, { ...currentPrint }],
    }));

    setCurrentPrint(initialPrint);
    toast.success("Print added");
  };

  const handleEditPrint = (index) => {
    const selectedPrint = formData.prints[index];
    setCurrentPrint({
      ...selectedPrint,
    });
    setEditingIndex(index);
  };

  const handleRemovePrint = (index) => {
    setFormData((prev) => ({
      ...prev,
      prints: prev.prints.filter((_, i) => i !== index),
    }));

    if (editingIndex === index) {
      setEditingIndex(null);
      setCurrentPrint(initialPrint);
    }
  };

  // CANCEL EDIT
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setCurrentPrint(initialPrint);
  };

  // SUBMIT CHALLAN
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ch_client_id) {
      toast.error("Please select Client");
      return;
    }

    if (!Array.isArray(formData.prints) || formData.prints.length === 0) {
      toast.error("Please add at least one print");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${apiUrl}/api/challan/save-challan`,
        formData,
      );

      console.log("293", response.data?.data?.data);

      if (response.data.success) {
        toast.success(response.data.message);

        // Refresh challan list
        await getAllChallanData();

        // Get newly created challan from API response
        const newChallan = response.data?.data?.data;

        // Reset form
        setFormData(initialFormData);
        setCurrentPrint(initialPrint);
        setEditingIndex(null);

        // Close Add Challan modal
        onClose();

        // Open Print Challan modal
        if (newChallan && onPrintChallan) {
          onPrintChallan(newChallan);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add challan");
    } finally {
      setLoading(false);
    }
  };

  // RESET
  const handleClose = () => {
    if (loading) return;
    setFormData(initialFormData);
    setCurrentPrint(initialPrint);
    setEditingIndex(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (e) => {
      if (e.key === "Escape" && !loading) {
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
          className="w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col"
        >
          {/* HEADER */}
          <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
            <h2 className="text-xl font-semibold text-blue-800">
              Add New Challan
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

          {/* SCROLLABLE CONTENT */}
          <div className="overflow-y-auto px-6 py-5">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h3 className="mb-4 border-b pb-2 text-lg font-semibold text-gray-800">
                  Client Details
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Client ID *
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
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      value={formData.pan_number}
                      disabled
                      placeholder="PAN number"
                      className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 uppercase"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      GST Number
                    </label>
                    <input
                      type="text"
                      value={formData.gst_number}
                      disabled
                      placeholder="GST number"
                      className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 uppercase"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={formData.pincode}
                      disabled
                      placeholder="Pincode"
                      className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="ch_phone"
                      value={formData.ch_phone}
                      onChange={handleChallanChange}
                      maxLength={10}
                      required
                      placeholder="Phone number"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Delivered To *
                    </label>
                    <input
                      type="text"
                      name="ch_delivered_to"
                      value={formData.ch_delivered_to}
                      onChange={handleChallanChange}
                      required
                      placeholder="Enter Person/Place"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  {/* <div className="md:col-span-4">
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Location
                    </label>
                    <textarea
                      name="ch_remark"
                      value={formData.ch_remark}
                      onChange={handleChallanChange}
                      placeholder="Enter Location"
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div> */}
                </div>
              </div>
              <div className="mb-6">
                <div className="mb-4 flex items-center justify-between border-b pb-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Print Details
                  </h3>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                    {formData.prints.length} Print
                    {formData.prints.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Print ID *
                      </label>
                      <select
                        name="pci_print_id"
                        value={currentPrint.pci_print_id}
                        onChange={handlePrintChange}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="">Select Print ID</option>
                        {printRecords?.map((print) => (
                          <option key={print.print_id} value={print.print_id}>
                            {print.print_id} - {print.creative} -{" "}
                            {print.media_type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Media *
                      </label>
                      <textarea
                        name="pci_description"
                        value={currentPrint.pci_description}
                        onChange={handlePrintChange}
                        placeholder="Enter Media"
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Creative
                      </label>
                      <input
                        type="text"
                        name="pci_creative"
                        value={currentPrint.pci_creative}
                        onChange={handlePrintChange}
                        placeholder="Creative"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Height
                      </label>
                      <input
                        type="number"
                        name="pci_height"
                        value={currentPrint.pci_height}
                        onChange={handlePrintChange}
                        min="0"
                        step="any"
                        placeholder="Height"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Width
                      </label>
                      <input
                        type="number"
                        name="pci_width"
                        value={currentPrint.pci_width}
                        onChange={handlePrintChange}
                        min="0"
                        step="any"
                        placeholder="Width"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Quantity
                      </label>
                      <input
                        type="number"
                        name="pci_quantity"
                        value={currentPrint.pci_quantity}
                        onChange={handlePrintChange}
                        min="1"
                        placeholder="Quantity"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Size Unit *
                      </label>
                      <select
                        name="pci_size_unit"
                        value={currentPrint.pci_size_unit}
                        onChange={handlePrintChange}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="">Select Size Unit</option>
                        <option value="inch">Inch</option>
                        <option value="feet">Feet</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Area (Sq. Ft.)
                      </label>
                      <input
                        type="text"
                        name="pci_area"
                        value={currentPrint.pci_area}
                        onChange={handlePrintChange}
                        placeholder="Auto calculated"
                        className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="mb-1 block text-sm font-semibold text-gray-700">
                        Location *
                      </label>
                      <textarea
                        name="pci_location"
                        value={currentPrint.pci_location}
                        onChange={handlePrintChange}
                        placeholder="Enter Location"
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    {editingIndex !== null && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddPrint}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      {editingIndex !== null ? (
                        <>
                          <FaEdit />
                          Update Print
                        </>
                      ) : (
                        <>
                          <FaPlus />
                          Add Print
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {formData.prints.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold text-gray-800">
                    Added Prints
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full min-w-225 text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left">#</th>
                          <th className="px-4 py-3 text-left">Print ID</th>
                          <th className="px-4 py-3 text-left">Creative</th>
                          <th className="px-4 py-3 text-left">Size</th>
                          <th className="px-4 py-3 text-left">Qty</th>
                          <th className="px-4 py-3 text-left">Unit</th>
                          <th className="px-4 py-3 text-left">Area</th>
                          <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.prints.map((print, index) => (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3">{index + 1}</td>
                            <td className="px-4 py-3 font-semibold">
                              {print.pci_print_id}
                            </td>
                            <td className="px-4 py-3">
                              {print.pci_creative || "-"}
                            </td>
                            <td className="px-4 py-3">
                              {print.pci_width || "-"} ×{" "}
                              {print.pci_height || "-"}
                            </td>
                            <td className="px-4 py-3">
                              {print.pci_quantity || "-"}
                            </td>
                            <td className="px-4 py-3">
                              {print.pci_size_unit || "-"}
                            </td>
                            <td className="px-4 py-3">
                              {print.pci_area || "-"}sqft
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditPrint(index)}
                                  className="rounded-lg bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                                  title="Edit"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePrint(index)}
                                  className="rounded-lg bg-red-100 p-2 text-red-600 hover:bg-red-200"
                                  title="Remove"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* BUTTONS */}
              <div className="mt-6 flex justify-end gap-3 border-t pt-5">
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
                  disabled={loading || formData.prints.length === 0}
                  className={`rounded-lg px-6 py-2.5 text-white ${
                    loading || formData.prints.length === 0
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Saving..." : "Add Challan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* PRINT */}
      <ChallanPrint
        isOpen={challanPrintModel}
        onClose={() => setChallanPrintModel(false)}
        challan={selectedPrint}
      />
    </>
  );
};

export default AddChallanModel;
