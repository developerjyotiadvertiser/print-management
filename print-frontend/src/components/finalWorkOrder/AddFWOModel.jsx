import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { FiX, FiSearch, FiSave } from "react-icons/fi";

const AddFWOModel = ({ isOpen, onClose, onSaved }) => {
  const modalRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  const [printers, setPrinters] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    fwo_date: new Date().toLocaleDateString("en-CA"),
    fwo_adjustment_amount: 0,
    fwo_paid_amount: 0,
    fwo_status: "Draft",
    fwo_payment_status: "Unpaid",
    fwo_remarks: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Fetch printer master
  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        setLoadingPrinters(true);
        const { data } = await axios.get(
          `${apiUrl}/api/printer-master/get-all-printer-master`,
        );

        console.log("55 FWO", data?.data?.data);

        const result = data?.data?.data || [];
        setPrinters(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error("Error fetching printers:", error);
        // alert("Unable to load printers.");
      } finally {
        setLoadingPrinters(false);
      }
    };

    fetchPrinters();
  }, [isOpen]);

  // Fetch work items whenever the selected printer changes
  useEffect(() => {
    if (!selectedPrinter) {
      setWorkItems([]);
      setSelectedIds([]);
      return;
    }

    const fetchWorkItems = async () => {
      try {
        setLoadingItems(true);
        setSelectedIds([]);

        // Replace with your existing combined work-items GET endpoint.
        const { data } = await axios.get(
          `${apiUrl}/api/work-items/get-work-items-by-printer/${selectedPrinter}`,
        );

        console.log("88 selectedPrinter", data?.data?.data);

        const result = data?.data?.data || [];
        const items = Array.isArray(result) ? result : [];

        console.log("93 items", items);

        setWorkItems(
          items.filter(
            (item) =>
              String(item.woi_printer_name) === String(selectedPrinter) &&
              item.woi_status !== "wo_created",
          ),
        );
      } catch (error) {
        console.error("Error fetching work items:", error);
        alert("Unable to load work order items.");
        setWorkItems([]);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchWorkItems();
  }, [apiUrl, selectedPrinter]);

  // Select / deselect an item
  const toggleItem = (woiId) => {
    setSelectedIds((previous) =>
      previous.includes(woiId)
        ? previous.filter((id) => id !== woiId)
        : [...previous, woiId],
    );
  };

  console.log("124 workItems", workItems);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return workItems;

    return workItems.filter((item) =>
      [item.woi_jc_number, item.woi_creative, item.woi_printer_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [workItems, search]);

  console.log("137 filteredItems", filteredItems);

  const selectedItems = useMemo(
    () => workItems.filter((item) => selectedIds.includes(item.woi_id)),
    [workItems, selectedIds],
  );

  // IMPORTANT:
  // Replace getItemArea() and getItemRate() with the actual fields
  // returned by your work-items/media API.
  const getItemArea = (item) => {
    const mediaItems = item.media_items ?? item.work_order_media ?? [];

    if (mediaItems.length > 0) {
      return mediaItems.reduce(
        (sum, media) =>
          sum + (Number(media.woim_area ?? media.woi_area ?? media.area) || 0),
        0,
      );
    }

    return Number(item.woi_area ?? item.total_area ?? 0);
  };

  const getItemRate = (item) => {
    console.log("162 item", item);

    const mediaItems = item.media_items || [];

    if (mediaItems.length > 0) {
      return mediaItems.reduce(
        (sum, media) =>
          sum +
          Number(media.pmm_price || 0) *
            (Number(media.woim_area ?? media.woi_area ?? media.area) || 0),
        0,
      );
    }

    // This fallback assumes the item contains a per-square-foot rate.
    return getItemArea(item) * Number(item.pmm_price || 0);
  };

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + getItemRate(item),
    0,
  );

  const adjustment = Number(formData.fwo_adjustment_amount) || 0;
  const grandTotal = Math.max(0, subtotal + adjustment);
  const paidAmount = Number(formData.fwo_paid_amount) || 0;
  const balanceAmount = grandTotal - paidAmount;

  const paymentStatus =
    paidAmount <= 0 ? "Unpaid" : paidAmount >= grandTotal ? "Paid" : "Partial";

  const formatAmount = (amount) =>
    (Number(amount) || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!selectedPrinter) {
      alert("Please select a printer.");
      return;
    }

    if (selectedIds.length === 0) {
      alert("Please select at least one work order item.");
      return;
    }

    if (paidAmount < 0 || paidAmount > grandTotal) {
      alert("Paid amount must be between 0 and the grand total.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        fwo_date: formData.fwo_date,
        fwo_pm_id: Number(selectedPrinter),
        fwo_subtotal: subtotal,
        fwo_adjustment_amount: adjustment,
        fwo_grand_total: grandTotal,
        fwo_paid_amount: paidAmount,
        fwo_balance_amount: balanceAmount,
        fwo_status: formData.fwo_status,
        fwo_payment_status: paymentStatus,
        fwo_remarks: formData.fwo_remarks,
        woi_ids: selectedIds,
      };

      // Replace with the route registered in your backend.
      const response = await axios.post(
        `${apiUrl}/api/final-work-order/save-final-work-order`,
        payload,
      );

      if (response.data?.success) {
        alert("Final work order created successfully.");
        onSaved?.(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error("Error saving final work order:", error);
      alert(
        error.response?.data?.message || "Failed to save final work order.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const renderMedia = (item) => {
    console.log("266 item render", item);

    const mediaItems = item.media_items || [];

    if (!mediaItems.length) {
      return (
        <div className="text-sm text-gray-600">
          {item.woi_media || item.woi_creative || "No media details"}
          <div className="mt-1">Area: {getItemArea(item).toFixed(2)} Sq.Ft</div>
        </div>
      );
    }

    return (
      <div className="space-y-2 min-w-[420px]">
        {mediaItems.map((media, index) => (
          <div
            key={media.woim_id ?? index}
            className="grid grid-cols-2 md:grid-cols-5 gap-3 rounded-lg border border-gray-200 p-3 text-sm"
          >
            <div>
              <span className="text-gray-400 block">Media</span>
              <span className="font-medium">{media.pmm_media || "-"}</span>
            </div>

            <div>
              <span className="text-gray-400 block">Size</span>
              {media.woim_size_width || "-"} × {media.woim_size_height || "-"}{" "}
              {media.woim_unit || "Feet"}
            </div>

            <div>
              <span className="text-gray-400 block">Quantity</span>
              {media.woim_quantity || 0}
            </div>

            <div>
              <span className="text-gray-400 block">Area</span>
              <span className="font-semibold">
                {Number(media.woim_area || 0).toFixed(2)} Sq.Ft
              </span>
            </div>

            <div>
              <span className="text-gray-400 block">Creative</span>
              {media.woim_creative ?? media.creative ?? "-"}
            </div>

            {(media.woim_creative_image ??
              media.creative_image ??
              media.image_url) && (
              <div className="col-span-full">
                <img
                  src={
                    (
                      media.woim_creative_image ??
                      media.creative_image ??
                      media.image_url
                    ).startsWith("http")
                      ? (media.woim_creative_image ??
                        media.creative_image ??
                        media.image_url)
                      : `${apiUrl}/${
                          media.woim_creative_image ??
                          media.creative_image ??
                          media.image_url
                        }`
                  }
                  alt="Creative"
                  className="h-14 w-16 rounded-md border object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
      <div
        ref={modalRef}
        className="flex max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Create Final Work Order
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Select a printer and choose the work items to include.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <FiX size={22} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {/* Printer and date */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Select Printer *
                </label>

                <select
                  value={selectedPrinter}
                  onChange={(event) => {
                    setSelectedPrinter(event.target.value);
                    setSearch("");
                  }}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                >
                  <option value="">
                    {loadingPrinters ? "Loading printers..." : "Choose printer"}
                  </option>

                  {printers.map((printer) => (
                    <option key={printer.pm_id} value={printer.pm_id}>
                      {printer.printer_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Work Order Date *
                </label>
                <input
                  type="date"
                  name="fwo_date"
                  value={formData.fwo_date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Work Order Status
                </label>
                <select
                  name="fwo_status"
                  value={formData.fwo_status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
                >
                  <option value="Draft">Draft</option>
                  <option value="Finalized">Finalized</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Items table */}
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-gray-50 p-4">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    Available Work Items
                  </h3>
                  <p className="text-xs text-gray-500">
                    Select only the items to include in this work order.
                  </p>
                </div>

                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search JC / creative"
                    className="rounded-lg border py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {!selectedPrinter ? (
                <div className="p-10 text-center text-gray-500">
                  Please select a printer first.
                </div>
              ) : loadingItems ? (
                <div className="p-10 text-center text-gray-500">
                  Loading work items...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  No available work items for this printer.
                </div>
              ) : (
                <div className="max-h-[360px] overflow-auto">
                  <table className="w-full min-w-[1000px] text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-gray-100 text-gray-600">
                      <tr>
                        <th className="w-12 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={
                              filteredItems.length > 0 &&
                              filteredItems.every((item) =>
                                selectedIds.includes(item.woi_id),
                              )
                            }
                            onChange={(event) => {
                              const visibleIds = filteredItems.map(
                                (item) => item.woi_id,
                              );

                              setSelectedIds((previous) =>
                                event.target.checked
                                  ? [...new Set([...previous, ...visibleIds])]
                                  : previous.filter(
                                      (id) => !visibleIds.includes(id),
                                    ),
                              );
                            }}
                          />
                        </th>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">JC Number</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Printer</th>
                        <th className="px-4 py-3">Media Details</th>
                        <th className="px-4 py-3">Area</th>
                        <th className="px-4 py-3">Amount</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {filteredItems.map((item) => (
                        <tr
                          key={item.woi_id}
                          className={
                            selectedIds.includes(item.woi_id)
                              ? "bg-blue-50/60"
                              : "hover:bg-gray-50"
                          }
                        >
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item.woi_id)}
                              onChange={() => toggleItem(item.woi_id)}
                            />
                          </td>
                          <td className="px-4 py-4">{item.woi_id}</td>
                          <td className="px-4 py-4 font-medium">
                            {item.woi_jc_number}
                          </td>
                          <td className="px-4 py-4">
                            {item.woi_work_allot_date}
                          </td>
                          <td className="px-4 py-4">
                            {item.printer_name || "-"}
                          </td>
                          <td className="px-4 py-4">{renderMedia(item)}</td>
                          <td className="whitespace-nowrap px-4 py-4 font-semibold">
                            {getItemArea(item).toFixed(2)} Sq.Ft
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 font-semibold">
                            ₹{formatAmount(getItemRate(item))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t bg-gray-50 px-4 py-3 text-sm text-gray-600">
                Selected: <strong>{selectedIds.length}</strong> work item(s)
              </div>
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Payment Details</h3>

                <div>
                  <label className="mb-1 block text-sm text-gray-600">
                    Adjustment Amount (+/-)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="fwo_adjustment_amount"
                    value={formData.fwo_adjustment_amount}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2.5"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-600">
                    Paid Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="fwo_paid_amount"
                    value={formData.fwo_paid_amount}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2.5"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-600">
                    Remarks
                  </label>
                  <textarea
                    name="fwo_remarks"
                    value={formData.fwo_remarks}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter remarks..."
                    className="w-full rounded-lg border px-3 py-2.5"
                  />
                </div>
              </div>

              <div className="h-fit rounded-xl border bg-gray-50 p-5">
                <h3 className="mb-4 font-semibold text-gray-800">
                  Work Order Summary
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{formatAmount(subtotal)}</span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Adjustment</span>
                    <span>₹{formatAmount(adjustment)}</span>
                  </div>

                  <div className="flex justify-between gap-4 border-t pt-3 text-base font-bold">
                    <span>Grand Total</span>
                    <span>₹{formatAmount(grandTotal)}</span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Paid Amount</span>
                    <span>₹{formatAmount(paidAmount)}</span>
                  </div>

                  <div className="flex justify-between gap-4 border-t pt-3 font-bold text-red-600">
                    <span>Balance Amount</span>
                    <span>₹{formatAmount(balanceAmount)}</span>
                  </div>

                  <div className="flex justify-between gap-4 pt-2">
                    <span className="text-gray-600">Payment Status</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        paymentStatus === "Paid"
                          ? "bg-green-100 text-green-700"
                          : paymentStatus === "Partial"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap justify-end gap-3 border-t bg-white px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || loadingItems || selectedIds.length === 0}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiSave />
              {saving ? "Saving..." : "Create Final Work Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFWOModel;
