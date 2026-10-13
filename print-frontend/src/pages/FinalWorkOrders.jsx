import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiDownload,
  FiSearch,
} from "react-icons/fi";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { FaDownload, FaRupeeSign, FaShareAltSquare } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { LiaFirstOrderAlt } from "react-icons/lia";
import AddFWOModel from "../components/finalWorkOrder/AddFWOModel";
import UpdateWorkOrder from "../components/finalWorkOrder/UpdateWorkOrder";
import PreviewFinalWorkOrderModel from "../components/finalWorkOrder/PreviewFinalWorkOrderModel";
import { useSelector } from "react-redux";

const FinalWorkOrders = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  // =========================================================
  // STATE
  // =========================================================

  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = useSelector((state) => state?.user?.currentUser);

  const [search, setSearch] = useState("");
  const [printerFilter, setPrinterFilter] = useState("");
  const [mediaFilter, setMediaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const recordsPerPage = 10;

  const [isFwoOpen, setIsFwoOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updateModel, setUpdateModel] = useState(false);

  const [downloadWorkOrder, setDownloadWorkOrder] = useState([]);
  const [downloadOrderModel, setDownloadOrderModel] = useState(false);

  const handlePrintOrder = (data) => {
    setDownloadWorkOrder(data);
    setDownloadOrderModel(true);
  };

  // =========================================================
  // GET ALL WORK ORDERS
  // =========================================================

  const getAllWorkOrders = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${apiUrl}/api/final-work-order/get-final-work-orders`,
      );

      console.log("54 data", data);

      setWorkOrders(data?.data?.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching media:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllWorkOrders();
  }, []);

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "";

    // DD-MM-YYYY HH:mm:ss
    if (/^\d{2}-\d{2}-\d{4}/.test(date)) {
      const [datePart, timePart] = date.split(" ");

      if (!timePart) {
        return datePart;
      }

      return `${datePart} ${timePart}`;
    }

    // YYYY-MM-DD HH:mm:ss
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
      const [datePart, timePart] = date.split(" ");

      const [year, month, day] = datePart.split("-");

      return timePart
        ? `${day}-${month}-${year} ${timePart}`
        : `${day}-${month}-${year}`;
    }

    return date;
  };

  // =========================================================
  // GET DATE ONLY
  // =========================================================

  const getDateOnly = (date) => {
    if (!date) return "";

    // DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}/.test(date)) {
      const [datePart] = date.split(" ");

      const [day, month, year] = datePart.split("-");

      return `${year}-${month}-${day}`;
    }

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
      return date.split(" ")[0];
    }

    return "";
  };

  // =========================================================
  // FILTER OPTIONS - PRINTER
  // =========================================================

  const printers = useMemo(() => {
    return [
      ...new Set(workOrders.map((item) => item?.printer_name).filter(Boolean)),
    ];
  }, [workOrders]);

  // =========================================================
  // FILTER OPTIONS - STATUS
  // =========================================================

  const statuses = useMemo(() => {
    return [
      ...new Set(workOrders.map((item) => item?.fwo_status).filter(Boolean)),
    ];
  }, [workOrders]);

  // =========================================================
  // FILTER WORK ITEMS
  // =========================================================

  const filteredWorkItems = useMemo(() => {
    return workOrders.filter((item) => {
      const searchValue = search.toLowerCase().trim();

      // -----------------------------------------
      // Search parent + media
      // -----------------------------------------

      const matchesSearch =
        !search ||
        String(item?.fwo_number || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(item?.printer_name || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(item?.fwo_status || "")
          .toLowerCase()
          .includes(searchValue);

      // -----------------------------------------
      // Printer
      // -----------------------------------------

      const matchesPrinter =
        !printerFilter || item?.printer_name === printerFilter;

      // -----------------------------------------
      // Status
      // -----------------------------------------

      const matchesStatus = !statusFilter || item?.fwo_status === statusFilter;

      // -----------------------------------------
      // Date
      // -----------------------------------------

      const workAllotDate = getDateOnly(item?.fwo_date);

      const matchesStartDate = !startDate || workAllotDate >= startDate;

      const matchesEndDate = !endDate || workAllotDate <= endDate;

      return (
        matchesSearch &&
        matchesPrinter &&
        matchesStatus &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    workOrders,
    search,
    printerFilter,
    mediaFilter,
    statusFilter,
    startDate,
    endDate,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.ceil(filteredWorkItems.length / recordsPerPage);

  const paginatedWorkItems = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;

    return filteredWorkItems.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredWorkItems, currentPage]);

  // =========================================================
  // RESET PAGE WHEN FILTER CHANGES
  // =========================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [search, printerFilter, mediaFilter, statusFilter, startDate, endDate]);

  // =========================================================
  // PAGE NUMBERS
  // =========================================================

  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      );
    } else {
      pages.push(
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages,
      );
    }

    return pages;
  };

  // =========================================================
  // UPDATE
  // =========================================================

  const handleUpdate = (data) => {
    setSelected(data);
    setUpdateModel(true);
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this work order?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await axios.delete(
        `${apiUrl}/api/final-work-order/delete-final-work-order/${id}`,
      );

      setWorkOrders((prev) => prev.filter((item) => item?.woi_id !== id));

      toast.success("Work item deleted successfully");
      getAllWorkOrders();
    } catch (error) {
      console.error("Delete work item error:", error);

      toast.error(
        error?.response?.data?.message || "Failed to delete work item",
      );
    }
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setSearch("");
    setPrinterFilter("");
    setMediaFilter("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
  };

  // =========================================================
  // DOWNLOAD EXCEL
  // =========================================================

  const downloadExcel = () => {
    if (filteredWorkItems.length === 0) {
      toast.error("No final work orders available to download");
      return;
    }

    const excelData = filteredWorkItems.map((item) => {
      let workOrderItemIds = [];

      try {
        workOrderItemIds = Array.isArray(item?.fwo_woi_ids)
          ? item.fwo_woi_ids
          : JSON.parse(item?.fwo_woi_ids || "[]");
      } catch (error) {
        workOrderItemIds = item?.woi_ids || [];
      }

      return {
        "Final Work Order ID": item?.fwo_id ?? "-",
        "Work Order Number": item?.fwo_number || "-",
        "Work Order Date": formatDate(item?.fwo_date) || "-",

        "Printer ID": item?.fwo_pm_id ?? "-",
        "Printer Name": item?.printer_name || "-",
        "Printer Address": item?.pm_address || "-",
        "GST Number": item?.pm_gst_number || "-",
        "PAN Number": item?.pm_pan_number || "-",
        Pincode: item?.pm_pincode || "-",

        "Work Item IDs": workOrderItemIds.join(", ") || "-",

        Subtotal: Number(item?.fwo_subtotal || 0),
        // "Adjustment Amount": Number(item?.fwo_adjustment_amount || 0),
        "Grand Total": Number(item?.fwo_grand_total || 0),
        "Paid Amount": Number(item?.fwo_paid_amount || 0),
        "Balance Amount": Number(item?.fwo_balance_amount || 0),

        "Payment Status": item?.fwo_payment_status || "-",
        "Work Order Status": item?.fwo_status || "-",
        Remarks: item?.fwo_remarks || "-",

        "Printer Status": item?.pm_status || "-",
        "Created At": formatDate(item?.fwo_created_at) || "-",
        "Updated At": item?.fwo_updated_at || "-",
        "Printer Created At": formatDate(item?.pm_created_at) || "-",
        "Printer Updated At": formatDate(item?.pm_updated_at) || "-",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 12 },
      { wch: 25 },
      { wch: 55 },
      { wch: 22 },
      { wch: 18 },
      { wch: 12 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 35 },
      { wch: 15 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Final Work Orders");

    XLSX.writeFile(
      workbook,
      `Final_Work_Orders_${new Date().toISOString().split("T")[0]}.xlsx`,
    );

    toast.success("Excel file downloaded successfully");
  };

  //   console.log("592 employee", workItems);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <div className="mt-16 rounded-xl bg-white p-6 shadow-sm sm:mt-18">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Work Order Jobs
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Showing {filteredWorkItems.length} of {workOrders.length} work
              order jobs
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsFwoOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#43c09c] px-5 py-2 text-white transition hover:bg-[#35b08d]"
            >
              <LiaFirstOrderAlt /> Add Order
            </button>
          </div>
        </div>

        {/* =====================================================
            FILTER SECTION
        ====================================================== */}

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-7">
            {/* SEARCH */}

            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Search
              </label>

              <div className="relative">
                <FiSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <input
                  type="text"
                  placeholder="Search JC, printer, media, creative..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* PRINTER */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Printer
              </label>

              <select
                value={printerFilter}
                onChange={(e) => setPrinterFilter(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Printers</option>

                {printers.map((printer) => (
                  <option key={printer} value={printer}>
                    {printer}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUS */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Status</option>

                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* START DATE */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* END DATE */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* ACTIONS */}

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 flex-1 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={getAllWorkOrders}
                disabled={loading}
                title="Refresh Data"
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiRefreshCw
                  size={18}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            TABLE
        ====================================================== */}

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-300 text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {/* <th className="px-5 py-3 font-semibold text-gray-600">ID</th> */}

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Order Number
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">Date</th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Printer
                </th>

                {/* <th className="px-5 py-3 font-semibold text-gray-600">
                  Sub-total
                </th> */}

                {/* <th className="px-5 py-3 font-semibold text-gray-600">
                  Adjusted Amount
                </th> */}

                <th className="px-5 py-3 font-semibold text-gray-600">Total</th>
                {/* <th className="px-5 py-3 font-semibold text-gray-600">
                  Paid Amount
                </th> */}

                {/* <th className="px-5 py-3 font-semibold text-gray-600">
                  Balance Amount
                </th> */}

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Order Status
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Bill Received
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Remark
                </th>

                <th className="px-5 py-3 text-center font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {/* LOADING */}

              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    Loading work items...
                  </td>
                </tr>
              ) : filteredWorkItems.length === 0 ? (
                /* NO DATA */

                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No work items found.
                  </td>
                </tr>
              ) : (
                /* DATA */

                paginatedWorkItems.map((item, index) => (
                  <tr
                    key={item?.fwo_id || index}
                    className="align-top transition hover:bg-gray-50"
                  >
                    {/* ID */}

                    {/* <td className="px-5 py-4 text-gray-500">
                      {item?.fwo_id || "-"}
                    </td> */}

                    {/* JC NUMBER */}

                    <td className="px-5 py-4 font-medium text-gray-700">
                      {String(item?.fwo_number ?? "-").toUpperCase()}
                    </td>

                    {/* DATE */}

                    <td className="whitespace-nowrap px-5 py-4 text-gray-700">
                      {formatDate(item?.fwo_date) || "-"}
                    </td>

                    {/* PRINTER */}

                    <td className="px-5 py-4 text-gray-700">
                      {item?.printer_name || "-"}
                    </td>

                    {/* <td className="px-5 py-4 text-gray-700">
                      {item?.fwo_subtotal || "-"}
                    </td> */}

                    {/* <td className="px-5 py-4 text-gray-700">
                      {item?.fwo_adjustment_amount || "-"}
                    </td> */}

                    <td className="px-5 py-4 text-gray-700">
                      {item?.fwo_grand_total || "-"}
                    </td>

                    {/* <td className="px-5 py-4 text-gray-700">
                      {item?.fwo_paid_amount || "-"}
                    </td> */}

                    {/* <td className="px-5 py-4 text-gray-700">
                      {item?.fwo_balance_amount || "-"}
                    </td> */}

                    {/* STATUS */}

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          String(item?.fwo_status || "").toLowerCase() ===
                          "Finalized"
                            ? "bg-green-50 text-green-700"
                            : String(item?.fwo_status || "").toLowerCase() ===
                                "Draft"
                              ? "bg-yellow-50 text-yellow-700"
                              : String(item?.woi_status || "").toLowerCase() ===
                                  "Cancelled"
                                ? "bg-red-50 text-red-700"
                                : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {item?.fwo_status || "-"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {item?.fwo_bill_received || "-"}
                      <br /> <small>({item?.fwo_br_date})</small>
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {item?.fwo_remarks || "-"}
                    </td>

                    {/* ACTIONS */}

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* SHARE */}

                        <button
                          onClick={() => handlePrintOrder(item)}
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                          title="Download as a file"
                        >
                          <FaDownload size={16} />
                        </button>

                        {item?.fwo_status === "Draft" && (
                          <>
                            {/* UPDATE */}

                            <button
                              onClick={() => handleUpdate(item)}
                              className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                              title="Update Work Item"
                            >
                              <FiEdit size={16} />
                            </button>

                            {/* DELETE */}

                            {user?.user?.emp_role === "admin" && (
                              <>
                                <button
                                  onClick={() => handleDelete(item?.fwo_id)}
                                  className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                                  title="Delete Work Item"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </>
                            )}
                          </>
                        )}

                        {item?.fwo_status === "Finalized" && (
                          <>
                            <button
                              onClick={() => handleUpdate(item)}
                              className="rounded-lg bg-green-50 p-2 text-green-600 transition hover:bg-blue-100"
                              title="Download as a file"
                            >
                              <FaRupeeSign size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* =================================================
              PAGINATION
          ================================================== */}

          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-700">
                  {(currentPage - 1) * recordsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-gray-700">
                  {Math.min(
                    currentPage * recordsPerPage,
                    filteredWorkItems.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-700">
                  {filteredWorkItems.length}
                </span>{" "}
                records
              </p>

              <div className="flex items-center gap-1">
                {/* PREVIOUS */}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {/* PAGE NUMBERS */}

                {getPageNumbers().map((page, index) =>
                  page === "..." ? (
                    <span
                      key={`dots-${index}`}
                      className="px-2 py-2 text-gray-500"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[38px] rounded-lg border px-3 py-2 text-sm transition ${
                        currentPage === page
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                {/* NEXT */}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* =====================================================
            EXCEL
        ====================================================== */}

        <div className="mt-3 flex justify-end">
          <button
            onClick={downloadExcel}
            disabled={filteredWorkItems.length === 0}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            <FiDownload />
            Excel
          </button>
        </div>
      </div>

      <UpdateWorkOrder
        isOrderOpen={updateModel}
        onOrderClose={() => {
          setUpdateModel(false);
          setSelected(null);
        }}
        selectedOrder={selected}
        onSaved={() => {
          setUpdateModel(false);
          setSelected(null);
          getAllWorkOrders();
        }}
      />

      <AddFWOModel
        isOpen={isFwoOpen}
        onClose={() => setIsFwoOpen(false)}
        onSaved={() => {
          setIsFwoOpen(false);
        }}
      />

      <PreviewFinalWorkOrderModel
        isOpen={downloadOrderModel}
        onClose={() => setDownloadOrderModel(false)}
        workOrder={downloadWorkOrder}
      />
    </>
  );
};

export default FinalWorkOrders;
