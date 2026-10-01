import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiDownload,
  FiSearch,
} from "react-icons/fi";
import toast from "react-hot-toast";
import AddWorkItemsModel from "../components/PopupWindows/AddWorkItemsModel";
import * as XLSX from "xlsx";
import UpdateWorkItemsModel from "../components/PopupWindows/UpdateWorkItemsModel";
import PrinterMasterModel from "../components/PopupWindows/PrinterMasterModel";
import { FaShareAltSquare } from "react-icons/fa";
import ImagePreviewModal from "../utils/ImagePreviewModal";

const WorkOrder = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [updateModel, setUpdateModel] = useState(false);
  const [selected, setSelected] = useState(null);
  const [addModel, setAddModel] = useState(false);

  const [search, setSearch] = useState("");
  const [printerFilter, setPrinterFilter] = useState("");
  const [mediaFilter, setMediaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [printerMaster, setPrinterMaster] = useState([]);

  const [mediaType, setMediaType] = useState([]);
  const [printerMasterTable, setPrinterMasterTable] = useState(false);

  const [imagePreview, setImagePreview] = useState({
    isOpen: false,
    imageUrl: "",
  });

  const handleImagePreview = (imagePath) => {
    if (!imagePath) return;

    setImagePreview({
      isOpen: true,
      imageUrl: `${apiUrl}/${imagePath}`,
    });
  };

  const closeImagePreview = () => {
    setImagePreview({
      isOpen: false,
      imageUrl: "",
    });
  };

  const handlePrintShare = (data) => {
    console.log("handle print share", data);
  };

  const getAllPrinterMaster = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        `${apiUrl}/api/printer-master/get-all-printer-master`,
      );

      setPrinterMaster(data?.data?.data || []);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to fetch printer master");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // GET ALL WORK ITEMS
  // =========================================================
  const getAllWorkItems = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${apiUrl}/api/work-items/get-all-work-items`,
      );

      console.log("Work Items Response:", response);

      setWorkItems(response?.data?.data?.data || []);
    } catch (error) {
      console.error("Error fetching work items:", error);

      toast.error(
        error?.response?.data?.message || "Failed to fetch work items",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // GET MEDIA
  // =========================================================
  const getAllMediaType = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/api/media/get-all-media`);

      setMediaType(data?.data?.data || []);
    } catch (error) {
      console.error("Error fetching media:", error);
    }
  };

  useEffect(() => {
    getAllWorkItems();
    getAllMediaType();
    getAllPrinterMaster();
  }, []);

  // =========================================================
  // FORMAT DATE
  // =========================================================
  const formatDate = (date) => {
    if (!date) return "";

    // DD-MM-YYYY HH:mm:ss
    if (/^\d{2}-\d{2}-\d{4}/.test(date)) {
      const [datePart, timePart] = date.split(" ");

      if (!timePart) return datePart;

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
  // CONVERT DATE TO YYYY-MM-DD
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
  // FILTER OPTIONS
  // =========================================================

  const printers = useMemo(() => {
    return [
      ...new Set(
        workItems.map((item) => item?.woi_printer_name).filter(Boolean),
      ),
    ];
  }, [workItems]);

  const medias = useMemo(() => {
    return [
      ...new Set(workItems.map((item) => item?.woi_media).filter(Boolean)),
    ];
  }, [workItems]);

  const statuses = useMemo(() => {
    return [
      ...new Set(workItems.map((item) => item?.woi_status).filter(Boolean)),
    ];
  }, [workItems]);

  // =========================================================
  // FILTER WORK ITEMS
  // =========================================================
  const filteredWorkItems = useMemo(() => {
    return workItems.filter((item) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !search ||
        String(item?.woi_serial_number || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(item?.woi_jc_number || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(item?.woi_printer_name || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(item?.woi_media || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(item?.woi_creative || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(item?.woi_status || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesPrinter =
        !printerFilter || item?.woi_printer_name === printerFilter;

      const matchesMedia = !mediaFilter || item?.woi_media === mediaFilter;

      const matchesStatus = !statusFilter || item?.woi_status === statusFilter;

      // Work allot date
      const workAllotDate = getDateOnly(item?.woi_work_allot_date);

      const matchesStartDate = !startDate || workAllotDate >= startDate;

      const matchesEndDate = !endDate || workAllotDate <= endDate;

      return (
        matchesSearch &&
        matchesPrinter &&
        matchesMedia &&
        matchesStatus &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [
    workItems,
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, printerFilter, mediaFilter, statusFilter, startDate, endDate]);

  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
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
      "Are you sure you want to delete this work item?",
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${apiUrl}/api/work-items/delete-work-items/${id}`);

      setWorkItems((prev) => prev.filter((item) => item?.woi_id !== id));

      toast.success("Work item deleted successfully");
    } catch (error) {
      console.error(error);

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
      toast.error("No work items available to download");
      return;
    }

    const excelData = filteredWorkItems.map((item) => ({
      "Work Item ID": item?.woi_id || "-",
      "Serial Number": item?.woi_serial_number || "-",
      "JC Number": item?.woi_jc_number || "-",
      "Work Allot Date": formatDate(item?.woi_work_allot_date) || "-",
      "Printer Name": item?.woi_printer_name || "-",
      Media: item?.woi_media || "-",
      Height: item?.woi_size_height || "-",
      Width: item?.woi_size_width || "-",
      Quantity: item?.woi_quantity || 0,
      Area: item?.woi_area || "-",
      Creative: item?.woi_creative || "-",
      Status: item?.woi_status || "-",
      "Created At": formatDate(item?.woi_created_at) || "-",
      "Updated At": formatDate(item?.woi_updated_at) || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 14 },
      { wch: 18 },
      { wch: 15 },
      { wch: 22 },
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 22 },
      { wch: 22 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Work Items");

    XLSX.writeFile(
      workbook,
      `Work_Items_${new Date().toISOString().split("T")[0]}.xlsx`,
    );

    toast.success("Excel file downloaded successfully");
  };

  return (
    <>
      <div className="p-6 bg-white rounded-xl shadow-sm sm:mt-18 mt-16">
        {/* =====================================================
            HEADER
        ====================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Work Items Details
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredWorkItems.length} of {workItems.length} records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPrinterMasterTable(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-white bg-yellow-600 hover:bg-yellow-700 transition cursor-pointer"
            >
              Printer Master
            </button>
            <button
              onClick={() => setAddModel(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer"
            >
              <FiPlus />
              New Work Item
            </button>
          </div>
        </div>

        {/* =====================================================
    FILTER SECTION
====================================================== */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Search
              </label>

              <div className="relative">
                <FiSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <input
                  type="text"
                  placeholder="Search serial, JC, printer, media..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 border border-gray-300 rounded-lg
                     text-sm outline-none
                     focus:ring-2 focus:ring-blue-100
                     focus:border-blue-400
                     transition"
                />
              </div>
            </div>

            {/* Printer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Printer
              </label>

              <select
                value={printerFilter}
                onChange={(e) => setPrinterFilter(e.target.value)}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg
                   text-sm outline-none bg-white
                   focus:ring-2 focus:ring-blue-100
                   focus:border-blue-400
                   transition"
              >
                <option value="">All Printers</option>

                {printers.map((printer) => (
                  <option key={printer} value={printer}>
                    {printer}
                  </option>
                ))}
              </select>
            </div>

            {/* Media */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Media
              </label>

              <select
                value={mediaFilter}
                onChange={(e) => setMediaFilter(e.target.value)}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg
                   text-sm outline-none bg-white
                   focus:ring-2 focus:ring-blue-100
                   focus:border-blue-400
                   transition"
              >
                <option value="">All Media</option>

                {medias.map((media) => (
                  <option key={media} value={media}>
                    {media}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg
                   text-sm outline-none bg-white
                   focus:ring-2 focus:ring-blue-100
                   focus:border-blue-400
                   transition"
              >
                <option value="">All Status</option>

                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg
                   text-sm outline-none
                   focus:ring-2 focus:ring-blue-100
                   focus:border-blue-400
                   transition"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-11 px-3 border border-gray-300 rounded-lg
                   text-sm outline-none
                   focus:ring-2 focus:ring-blue-100
                   focus:border-blue-400
                   transition"
              />
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              {/* Clear */}
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 flex-1 px-4
                   flex items-center justify-center gap-2
                   rounded-lg
                   border border-gray-300
                   bg-white
                   text-gray-700
                   text-sm font-medium
                   hover:bg-gray-50
                   hover:border-gray-400
                   transition"
              >
                <span>Clear</span>
              </button>

              {/* Refresh */}
              <button
                type="button"
                onClick={getAllWorkItems}
                disabled={loading}
                title="Refresh Data"
                className="h-11 w-11 flex-shrink-0
                   flex items-center justify-center
                   rounded-lg
                   bg-blue-600
                   text-white
                   hover:bg-blue-700
                   transition
                   disabled:opacity-50
                   disabled:cursor-not-allowed"
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
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 font-semibold text-gray-600">ID</th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  JC Number
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Work Allot Date
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Printer
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">Media</th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Height
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">Width</th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Quantity
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">Area</th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Creative
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Creative Image
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Status
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600 text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={13}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    Loading work items...
                  </td>
                </tr>
              ) : filteredWorkItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={13}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No work items found.
                  </td>
                </tr>
              ) : (
                paginatedWorkItems.map((item, index) => (
                  <tr
                    key={item?.woi_id || index}
                    className="hover:bg-gray-50 transition"
                  >
                    {/* ID */}
                    <td className="px-5 py-4 text-gray-500">
                      {item?.woi_id || "-"}
                    </td>

                    {/* JC Number */}
                    <td className="px-5 py-4 text-gray-700">
                      {item?.woi_jc_number || "-"}
                    </td>

                    {/* Work Allot Date */}
                    <td className="px-5 py-4 text-gray-700 whitespace-nowrap">
                      {formatDate(item?.woi_work_allot_date) || "-"}
                    </td>

                    {/* Printer */}
                    <td className="px-5 py-4 text-gray-700">
                      {item?.woi_printer_name || "-"}
                    </td>

                    {/* Media */}
                    <td className="px-5 py-4 text-gray-700">
                      {item?.woi_media || "-"}
                    </td>

                    {/* Height */}
                    <td className="px-5 py-4 text-gray-600">
                      {item?.woi_size_height || "-"}
                    </td>

                    {/* Width */}
                    <td className="px-5 py-4 text-gray-600">
                      {item?.woi_size_width || "-"}
                    </td>

                    {/* Quantity */}
                    <td className="px-5 py-4 text-gray-600">
                      {item?.woi_quantity || 0}
                    </td>

                    {/* Area */}
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {item?.woi_area ? `${item.woi_area} Sq.Ft` : "-"}
                    </td>

                    {/* Creative */}
                    <td className="px-5 py-4 text-gray-700 max-w-xs">
                      <p className="truncate" title={item?.woi_creative}>
                        {item?.woi_creative || "-"}
                      </p>
                    </td>

                    {/* Creative Image */}
                    <td className="px-5 py-4 text-gray-700">
                      {item?.woi_creative_image ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleImagePreview(item?.woi_creative_image)
                          }
                          className="group relative block cursor-pointer"
                          title="Click to view image"
                        >
                          <img
                            src={`${apiUrl}/${item?.woi_creative_image}`}
                            alt="Creative"
                            className="h-12 w-16 rounded-lg object-cover border border-gray-200
                   transition duration-200
                   group-hover:scale-105
                   group-hover:shadow-md"
                          />

                          {/* Zoom overlay */}
                          <div
                            className="absolute inset-0 flex items-center justify-center
                   rounded-lg bg-black/40 opacity-0
                   group-hover:opacity-100 transition"
                          >
                            <span className="text-white text-xs font-medium">
                              View
                            </span>
                          </div>
                        </button>
                      ) : (
                        <span className="text-gray-400">No Image</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          String(item?.woi_status || "").toLowerCase() ===
                          "completed"
                            ? "bg-green-50 text-green-700"
                            : String(item?.woi_status || "").toLowerCase() ===
                                "pending"
                              ? "bg-yellow-50 text-yellow-700"
                              : String(item?.woi_status || "").toLowerCase() ===
                                  "cancelled"
                                ? "bg-red-50 text-red-700"
                                : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {item?.woi_status || "-"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handlePrintShare(item)}
                          className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          title="Share as a file"
                        >
                          <FaShareAltSquare size={16} />
                        </button>
                        <button
                          onClick={() => handleUpdate(item)}
                          className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          title="Update Work Item"
                        >
                          <FiEdit size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(item?.woi_id)}
                          className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition"
                          title="Delete Work Item"
                        >
                          <FiTrash2 size={16} />
                        </button>
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 border-t border-gray-200">
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
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>

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
                      className={`min-w-[38px] px-3 py-2 text-sm rounded-lg border transition ${
                        currentPage === page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
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

        <div className="flex justify-end mt-3">
          <button
            onClick={downloadExcel}
            disabled={filteredWorkItems.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition"
          >
            <FiDownload />
            Excel
          </button>
        </div>
      </div>

      {/* =======================================================
          ADD WORK ITEM MODAL
      ======================================================== */}

      <AddWorkItemsModel
        isItemOpen={addModel}
        onItemClose={() => setAddModel(false)}
        getAllWorkItems={getAllWorkItems}
        mediaType={mediaType}
        printerMaster={printerMaster}
        getAllPrinterMaster={getAllPrinterMaster}
      />

      <UpdateWorkItemsModel
        isItemOpen={updateModel}
        onItemClose={() => {
          setUpdateModel(false);
        }}
        getAllWorkItems={getAllWorkItems}
        mediaType={mediaType}
        selectedWorkItem={selected}
      />

      <PrinterMasterModel
        isOpen={printerMasterTable}
        onClose={() => setPrinterMasterTable(false)}
        getAllPrinterMaster={getAllPrinterMaster}
        printerMaster={printerMaster}
      />

      <ImagePreviewModal
        isOpen={imagePreview.isOpen}
        imageUrl={imagePreview.imageUrl}
        onClose={closeImagePreview}
      />
    </>
  );
};

export default WorkOrder;
