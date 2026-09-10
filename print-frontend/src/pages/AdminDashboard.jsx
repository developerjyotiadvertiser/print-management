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
import { useSelector } from "react-redux";
import AddPrintModel from "../components/PopupWindows/AddPrintModel";
import UpdatePrintModel from "../components/PopupWindows/UpdatePrintModel";
import * as XLSX from "xlsx";
import MediaMasterModel from "../components/PopupWindows/MediaMasterModel";

const AdminDashboard = () => {
  const user = useSelector((state) => state?.user?.currentUser);
  const [printRecords, setPrintRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [updateModel, setUpdateModel] = useState(false);
  const [selected, setSelected] = useState();
  const [addModel, setAddModel] = useState(false);
  const [masterModel, setMasterModel] = useState(false);
  const [search, setSearch] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const handleUpdate = (data) => {
    setUpdateModel(true);
    setSelected(data);
  };

  const getAllPrintData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/print/get-all-print`);
      if (response.data?.data?.success) {
        setPrintRecords(response?.data?.data?.data || []);
      } else {
        setPrintRecords(response.data?.data?.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllPrintData();
  }, []);

  const filteredPrintRecords = useMemo(() => {
    return printRecords.filter((print) => {
      const searchValue = search.toLowerCase();
      const matchesSearch =
        !search ||
        print?.media_type?.toLowerCase().includes(searchValue) ||
        print?.remarks?.toLowerCase().includes(searchValue) ||
        print?.creative?.toLowerCase().includes(searchValue);
      const matchesMediaType =
        !mediaTypeFilter || print?.media_type === mediaTypeFilter;
      const matchesUnit = !unitFilter || print?.size_unit === unitFilter;
      const printDate = print?.print_date
        ? new Date(print.print_date).toISOString().split("T")[0]
        : "";

      const matchesStartDate = !startDate || printDate >= startDate;
      const matchesEndDate = !endDate || printDate <= endDate;

      return (
        matchesSearch &&
        matchesMediaType &&
        matchesUnit &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [printRecords, search, mediaTypeFilter, unitFilter, startDate, endDate]);

  const totalPages = Math.ceil(filteredPrintRecords.length / recordsPerPage);

  const paginatedPrintRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredPrintRecords.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredPrintRecords, currentPage]);

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, mediaTypeFilter, unitFilter, startDate, endDate]);

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

  const mediaTypes = [
    ...new Set(printRecords.map((print) => print?.media_type).filter(Boolean)),
  ];

  // Delete employee
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this record?",
    );

    if (!confirmDelete) return;
    try {
      await axios.delete(`${apiUrl}/api/print/delete-print/${id}`);

      // Remove deleted employee from UI
      setPrintRecords((prev) =>
        prev.filter((employee) => employee.print_id !== id),
      );
      toast.success("Print record deleted successfully");
    } catch (error) {
      console.error("Error deleting print record:", error);
      toast.error("Failed to delete print record");
    }
  };

  const downloadExcel = () => {
    if (filteredPrintRecords.length === 0) {
      toast.error("No records available to download");
      return;
    }

    const excelData = filteredPrintRecords.map((print, index) => {
      const totalArea = parseFloat(
        String(print?.total_area ?? 0).replace(/,/g, ""),
      );

      const width = parseFloat(String(print?.width ?? 0).replace(/,/g, ""));
      const height = parseFloat(String(print?.height ?? 0).replace(/,/g, ""));

      return {
        "Print ID": print?.print_id,
        Creative: print?.creative || "-",
        "Print Date": print?.print_date || "-",
        "Media Type": print?.media_type || "-",
        Width: isNaN(width) ? 0 : width,
        Height: isNaN(height) ? 0 : height,
        Unit: print?.size_unit || "-",
        quality_print: print?.quality_print || "-",
        Quantity: Number(print?.quantity) || 0,

        // IMPORTANT: use converted number
        "Total Area (Sq.Ft)": isNaN(totalArea) ? 0 : totalArea,

        Remarks: print?.remarks || "-",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 40 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Print Records");
    XLSX.writeFile(
      workbook,
      `Print_Records_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    toast.success("Excel file downloaded successfully");
  };

  return (
    <>
      <div className="p-6 bg-white rounded-xl shadow-sm sm:mt-18 mt-16">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Print Work Details
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredPrintRecords.length} of {printRecords.length}{" "}
              records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Add New Record */}
            <button
              onClick={() => {
                setAddModel(true);
              }}
              className="flex items-center gap-2 px-8 py-2 rounded-lg text-gray-900 bg-yellow-200 hover:bg-yellow-300 transition cursor-pointer"
            >
              <FiPlus />
              Add New Record
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <FiSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search creative, media or remarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
          </div>

          {/* Media Type */}
          <select
            value={mediaTypeFilter}
            onChange={(e) => setMediaTypeFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          >
            <option value="">All Media Types</option>
            {mediaTypes.map((media) => (
              <option key={media} value={media}>
                {media}
              </option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
          />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearch("");
                setMediaTypeFilter("");
                setUnitFilter("");
                setStartDate("");
                setEndDate("");
              }}
              className="flex-1 px-4 py-2.5 border border-red-200 text-white bg-red-500 rounded-lg hover:bg-red-600 transition whitespace-nowrap"
            >
              Clear
            </button>

            <button
              onClick={getAllPrintData}
              disabled={loading}
              title="Refresh Data"
              className="w-11 h-11 shrink-0 flex items-center justify-center border border-gray-300 rounded-lg text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50"
            >
              <FiRefreshCw
                size={19}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Print ID
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Creative
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">Date</th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Media Type
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">Width</th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Height
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">Unit</th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Quantity
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Quality Print
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Total Area
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Remarks
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
                    colSpan={user?.user?.emp_role === "admin" ? 9 : 8}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    Loading print records...
                  </td>
                </tr>
              ) : filteredPrintRecords?.length === 0 ? (
                <tr>
                  <td
                    colSpan={user?.user?.emp_role === "admin" ? 9 : 8}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No print records found.
                  </td>
                </tr>
              ) : (
                paginatedPrintRecords?.map((print, index) => (
                  <tr
                    key={print?.print_id || index}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-5 py-4 text-gray-500">
                      {/* {(currentPage - 1) * recordsPerPage + index + 1} */}
                      {print?.print_id}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {print?.creative || "-"}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {print?.print_date || "-"}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {print?.media_type || "-"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {print?.width || "-"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {print?.height || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {print?.size_unit || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {print?.quantity || 0}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {print?.quality_print || "-"}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {print?.total_area ? `${print.total_area} Sq.Ft` : "-"}
                    </td>
                    <td className="px-5 py-4 text-gray-600 max-w-xs">
                      <p className="truncate" title={print?.remarks}>
                        {print?.remarks || "-"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleUpdate(print)}
                          className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          title="Update Print Record"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(print?.print_id)}
                          className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition"
                          title="Delete Print Record"
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
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 border-t border-gray-200">
              {/* Showing records */}
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-700">
                  {(currentPage - 1) * recordsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-gray-700">
                  {Math.min(
                    currentPage * recordsPerPage,
                    filteredPrintRecords.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-700">
                  {filteredPrintRecords.length}
                </span>{" "}
                records
              </p>

              {/* Pagination */}
              <div className="flex items-center gap-1">
                {/* Previous */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg
                   hover:bg-gray-50 disabled:opacity-40
                   disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>

                {/* Page Numbers */}
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

                {/* Next */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg
                   hover:bg-gray-50 disabled:opacity-40
                   disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-2">
          <button
            onClick={downloadExcel}
            disabled={filteredPrintRecords.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition"
          >
            <FiDownload />
            Excel
          </button>
        </div>
      </div>

      <br />
      {/* <EmployeeTable /> */}
      {/* <MediaTypeTable /> */}

      <UpdatePrintModel
        isOpen={updateModel}
        onClose={() => setUpdateModel(false)}
        getAllPrintData={getAllPrintData}
        selected={selected}
      />
      <AddPrintModel
        isOpen={addModel}
        onClose={() => setAddModel(false)}
        getAllPrintData={getAllPrintData}
      />
      <MediaMasterModel
        isOpen={masterModel}
        onClose={() => setMasterModel(false)}
      />
    </>
  );
};

export default AdminDashboard;
