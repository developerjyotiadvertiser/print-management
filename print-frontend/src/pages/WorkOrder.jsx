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
import * as XLSX from "xlsx";
import { FaShareAltSquare } from "react-icons/fa";

import AddWorkItemsModel from "../components/PopupWindows/AddWorkItemsModel";
import UpdateWorkItemsModel from "../components/PopupWindows/UpdateWorkItemsModel";
import PrinterMasterModel from "../components/PopupWindows/PrinterMasterModel";
import ImagePreviewModal from "../utils/ImagePreviewModal";
import WorkOrderShareModal from "../components/PopupWindows/WorkOrderShareModal";

const WorkOrder = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  // =========================================================
  // STATE
  // =========================================================

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

  const [shareModel, setShareModel] = useState(false);
  const [shareWorkItem, setShareWorkItem] = useState(null);

  const [imagePreview, setImagePreview] = useState({
    isOpen: false,
    imageUrl: "",
  });

  // =========================================================
  // IMAGE PREVIEW
  // =========================================================

  const handleImagePreview = (imagePath) => {
    if (!imagePath) return;

    const cleanPath = String(imagePath).replace(/^\/+/, "");

    setImagePreview({
      isOpen: true,
      imageUrl: `${apiUrl}/${cleanPath}`,
    });
  };

  const closeImagePreview = () => {
    setImagePreview({
      isOpen: false,
      imageUrl: "",
    });
  };

  // =========================================================
  // PRINT / SHARE
  // =========================================================

  const handlePrintShare = (data) => {
    setShareWorkItem(data);
    setShareModel(true);
  };

  // =========================================================
  // GET ALL PRINTER MASTER
  // =========================================================

  const getAllPrinterMaster = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(
        `${apiUrl}/api/printer-master/get-all-printer-master`,
      );

      setPrinterMaster(data?.data?.data || []);
    } catch (error) {
      console.error("Error fetching printer master:", error);

      toast.error(
        error?.response?.data?.message || "Failed to fetch printer master",
      );
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

      const { data } = await axios.get(
        `${apiUrl}/api/work-items/get-all-work-items`,
      );

      console.log("Work Items Response:", data);

      setWorkItems(Array.isArray(data?.data?.data) ? data.data?.data : []);
    } catch (error) {
      console.error("Error fetching work items:", error);

      toast.error(error?.data?.message || "Failed to fetch work items");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // GET ALL MEDIA
  // =========================================================

  const getAllMediaType = async () => {
    try {
      const { data } = await axios.get(`${apiUrl}/api/media/get-all-media`);

      setMediaType(data?.data?.data || []);
    } catch (error) {
      console.error("Error fetching media:", error);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

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
      ...new Set(
        workItems.map((item) => item?.woi_printer_name).filter(Boolean),
      ),
    ];
  }, [workItems]);

  // =========================================================
  // FILTER OPTIONS - MEDIA
  // =========================================================

  const medias = useMemo(() => {
    return [
      ...new Set(
        workItems
          .flatMap((item) =>
            (item?.media_items || []).map((media) => media?.woim_media),
          )
          .filter(Boolean),
      ),
    ];
  }, [workItems]);

  // =========================================================
  // FILTER OPTIONS - STATUS
  // =========================================================

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

      const mediaItems = item?.media_items || [];

      // -----------------------------------------
      // Search inside media
      // -----------------------------------------

      const matchesMediaSearch = mediaItems.some((media) => {
        const values = [
          media?.woim_media,
          media?.woim_creative,
          media?.woim_size_height,
          media?.woim_size_width,
          media?.woim_unit,
          media?.woim_quantity,
          media?.woim_area,
        ];

        return values.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(searchValue),
        );
      });

      // -----------------------------------------
      // Search parent + media
      // -----------------------------------------

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
        String(item?.woi_status || "")
          .toLowerCase()
          .includes(searchValue) ||
        matchesMediaSearch;

      // -----------------------------------------
      // Printer
      // -----------------------------------------

      const matchesPrinter =
        !printerFilter || item?.woi_printer_name === printerFilter;

      // -----------------------------------------
      // Media
      // -----------------------------------------

      const matchesMedia =
        !mediaFilter ||
        mediaItems.some((media) => media?.woim_media === mediaFilter);

      // -----------------------------------------
      // Status
      // -----------------------------------------

      const matchesStatus = !statusFilter || item?.woi_status === statusFilter;

      // -----------------------------------------
      // Date
      // -----------------------------------------

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
      "Are you sure you want to delete this work item?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await axios.delete(`${apiUrl}/api/work-items/delete-work-items/${id}`);

      setWorkItems((prev) => prev.filter((item) => item?.woi_id !== id));

      toast.success("Work item deleted successfully");
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
      toast.error("No work items available to download");

      return;
    }

    const excelData = [];

    filteredWorkItems.forEach((item) => {
      const mediaItems = item?.media_items || [];

      // -----------------------------------------
      // No media
      // -----------------------------------------

      if (mediaItems.length === 0) {
        excelData.push({
          "Work Item ID": item?.woi_id || "-",

          "Serial Number": item?.woi_serial_number || "-",

          "JC Number": item?.woi_jc_number || "-",

          "Work Allot Date": formatDate(item?.woi_work_allot_date) || "-",

          "Printer Name": item?.woi_printer_name || "-",

          Media: "-",
          Height: "-",
          Width: "-",
          Unit: "-",
          Quantity: 0,
          Area: "-",
          Creative: "-",
          "Creative Image": "-",

          Status: item?.woi_status || "-",

          "Created At": formatDate(item?.woi_created_at) || "-",

          "Updated At": formatDate(item?.woi_updated_at) || "-",
        });

        return;
      }

      // -----------------------------------------
      // One Excel row per media
      // -----------------------------------------

      mediaItems.forEach((media) => {
        excelData.push({
          "Work Item ID": item?.woi_id || "-",

          "Serial Number": item?.woi_serial_number || "-",

          "JC Number": item?.woi_jc_number || "-",

          "Work Allot Date": formatDate(item?.woi_work_allot_date) || "-",

          "Printer Name": item?.woi_printer_name || "-",

          Media: media?.woim_media || "-",

          Height: media?.woim_size_height || "-",

          Width: media?.woim_size_width || "-",

          Unit: media?.woim_unit || "-",

          Quantity: media?.woim_quantity || 0,

          Area: media?.woim_area || "-",

          Creative: media?.woim_creative || "-",

          "Creative Image": media?.woim_creative_image || "-",

          Status: item?.woi_status || "-",

          "Created At": formatDate(item?.woi_created_at) || "-",

          "Updated At": formatDate(item?.woi_updated_at) || "-",
        });
      });
    });

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
      { wch: 12 },
      { wch: 15 },
      { wch: 25 },
      { wch: 45 },
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
              Work Items Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Showing {filteredWorkItems.length} of {workItems.length} work
              orders
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPrinterMasterTable(true)}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-yellow-600 px-5 py-2 text-white transition hover:bg-yellow-700"
            >
              Printer Master
            </button>

            <button
              onClick={() => setAddModel(true)}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700"
            >
              <FiPlus />
              New Work Item
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

            {/* MEDIA */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Media
              </label>

              <select
                value={mediaFilter}
                onChange={(e) => setMediaFilter(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Media</option>

                {medias.map((media) => (
                  <option key={media} value={media}>
                    {media}
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
                onClick={getAllWorkItems}
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
                <th className="px-5 py-3 font-semibold text-gray-600">ID</th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  JC Number
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">Date</th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Printer
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Media Details
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Status
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
                    key={item?.woi_id || index}
                    className="align-top transition hover:bg-gray-50"
                  >
                    {/* ID */}

                    <td className="px-5 py-4 text-gray-500">
                      {item?.woi_id || "-"}
                    </td>

                    {/* JC NUMBER */}

                    <td className="px-5 py-4 font-medium text-gray-700">
                      {item?.woi_jc_number || "-"}
                    </td>

                    {/* DATE */}

                    <td className="whitespace-nowrap px-5 py-4 text-gray-700">
                      {formatDate(item?.woi_work_allot_date) || "-"}
                    </td>

                    {/* PRINTER */}

                    <td className="px-5 py-4 text-gray-700">
                      {item?.woi_printer_name || "-"}
                    </td>

                    {/* =================================================
                          MEDIA DETAILS
                      ================================================== */}

                    <td className="min-w-[700px] px-5 py-4">
                      <div className="space-y-3">
                        {(item?.media_items || []).map((media, mediaIndex) => (
                          <div
                            key={media?.woim_id || mediaIndex}
                            className="rounded-lg border border-gray-200 bg-white p-3"
                          >
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                              {/* MEDIA */}

                              <div>
                                <p className="text-xs text-gray-400">Media</p>

                                <p className="font-semibold text-gray-700">
                                  {media?.woim_media || "-"}
                                </p>
                              </div>

                              {/* SIZE */}

                              <div>
                                <p className="text-xs text-gray-400">Size</p>

                                <p className="text-gray-700">
                                  {media?.woim_size_height || "-"} ×{" "}
                                  {media?.woim_size_width || "-"}{" "}
                                  {media?.woim_unit || ""}
                                </p>
                              </div>

                              {/* QUANTITY */}

                              <div>
                                <p className="text-xs text-gray-400">
                                  Quantity
                                </p>

                                <p className="text-gray-700">
                                  {media?.woim_quantity || 0}
                                </p>
                              </div>

                              {/* AREA */}

                              <div>
                                <p className="text-xs text-gray-400">Area</p>

                                <p className="font-medium text-gray-800">
                                  {media?.woim_area
                                    ? `${media.woim_area} Sq.Ft`
                                    : "-"}
                                </p>
                              </div>

                              {/* CREATIVE */}

                              <div>
                                <p className="text-xs text-gray-400">
                                  Creative
                                </p>

                                <p
                                  className="max-w-[150px] truncate text-gray-700"
                                  title={media?.woim_creative || ""}
                                >
                                  {media?.woim_creative || "-"}
                                </p>
                              </div>

                              {/* IMAGE */}

                              <div>
                                <p className="mb-1 text-xs text-gray-400">
                                  Image
                                </p>

                                {media?.woim_creative_image ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleImagePreview(
                                        media?.woim_creative_image,
                                      )
                                    }
                                    className="group relative block cursor-pointer"
                                    title="Click to view image"
                                  >
                                    <img
                                      src={`${apiUrl}/${String(
                                        media.woim_creative_image,
                                      ).replace(/^\/+/, "")}`}
                                      alt="Creative"
                                      className="h-12 w-16 rounded-lg border border-gray-200 object-cover transition duration-200 group-hover:scale-105 group-hover:shadow-md"
                                    />

                                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition group-hover:opacity-100">
                                      <span className="text-xs font-medium text-white">
                                        View
                                      </span>
                                    </div>
                                  </button>
                                ) : (
                                  <span className="text-gray-400">
                                    No Image
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* NO MEDIA */}

                        {(!item?.media_items ||
                          item.media_items.length === 0) && (
                          <span className="text-gray-400">No media added</span>
                        )}
                      </div>
                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
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

                    {/* ACTIONS */}

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* SHARE */}

                        <button
                          onClick={() => handlePrintShare(item)}
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                          title="Share as a file"
                        >
                          <FaShareAltSquare size={16} />
                        </button>

                        {/* UPDATE */}

                        <button
                          onClick={() => handleUpdate(item)}
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                          title="Update Work Item"
                        >
                          <FiEdit size={16} />
                        </button>

                        {/* DELETE */}

                        <button
                          onClick={() => handleDelete(item?.woi_id)}
                          className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
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

      {/* =======================================================
          ADD WORK ITEM
      ======================================================== */}

      <AddWorkItemsModel
        isItemOpen={addModel}
        onItemClose={() => setAddModel(false)}
        getAllWorkItems={getAllWorkItems}
        mediaType={mediaType}
        printerMaster={printerMaster}
        getAllPrinterMaster={getAllPrinterMaster}
      />

      {/* =======================================================
          UPDATE WORK ITEM
      ======================================================== */}

      <UpdateWorkItemsModel
        isItemOpen={updateModel}
        onItemClose={() => {
          setUpdateModel(false);
          setSelected(null);
        }}
        getAllWorkItems={getAllWorkItems}
        mediaType={mediaType}
        selectedWorkItem={selected}
      />

      {/* =======================================================
          PRINTER MASTER
      ======================================================== */}

      <PrinterMasterModel
        isOpen={printerMasterTable}
        onClose={() => setPrinterMasterTable(false)}
        getAllPrinterMaster={getAllPrinterMaster}
        printerMaster={printerMaster}
      />

      {/* =======================================================
          IMAGE PREVIEW
      ======================================================== */}

      <ImagePreviewModal
        isOpen={imagePreview.isOpen}
        imageUrl={imagePreview.imageUrl}
        onClose={closeImagePreview}
      />

      <WorkOrderShareModal
        isOpen={shareModel}
        onClose={() => {
          setShareModel(false);
          setShareWorkItem(null);
        }}
        workItem={shareWorkItem}
      />
    </>
  );
};

export default WorkOrder;
