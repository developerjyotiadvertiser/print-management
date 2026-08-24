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
import EmployeeTable from "../components/EmployeeTable";

const AdminDashboard = () => {
  const user = useSelector((state) => state?.user?.currentUser);
  const [printRecords, setPrintRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [updateModel, setUpdateModel] = useState(false);
  const [selected, setSelected] = useState();
  const [addModel, setAddModel] = useState(false);

  const [search, setSearch] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleUpdate = (data) => {
    setUpdateModel(true);
    setSelected(data);
  };

  const getAllPrintData = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${apiUrl}/api/print/get-all-print`);

      console.log(response?.data?.data?.data);

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

    const excelData = filteredPrintRecords.map((print, index) => ({
      "Sr. No.": index + 1,
      Creative: print?.creative || "-",
      "Print Date": print?.print_date || "-",
      "Media Type": print?.media_type || "-",
      Width: print?.width || "-",
      Height: print?.height || "-",
      Unit: print?.size_unit || "-",
      Quantity: print?.quantity || 0,
      "Total Area (Sq.Ft)": print?.total_area || 0,
      Remarks: print?.remarks || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 10 },
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

    const fileName = `Print_Records_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    XLSX.writeFile(workbook, fileName);

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
            {/* Refresh */}
            <button
              onClick={getAllPrintData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            {/* Download Excel */}
            <button
              onClick={downloadExcel}
              disabled={filteredPrintRecords.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition"
            >
              <FiDownload />
              Download Excel
            </button>

            {/* Add New Record */}
            <button
              onClick={() => {
                setAddModel(true);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-900 bg-yellow-200 hover:bg-yellow-300 transition cursor-pointer"
            >
              <FiPlus />
              Add New Record
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Search */}
          <div className="relative">
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
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All Media Types</option>

            {mediaTypes.map((media) => (
              <option key={media} value={media}>
                {media}
              </option>
            ))}
          </select>

          {/* Unit */}
          {/* <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All Units</option>
            <option value="feet">Feet</option>
            <option value="inch">Inch</option>
          </select> */}

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

          <button
            onClick={() => {
              setSearch("");
              setMediaTypeFilter("");
              setUnitFilter("");
              setStartDate("");
              setEndDate("");
            }}
            className="px-4 py-2.5 border border-red-200 text-white bg-red-500 rounded-lg hover:bg-red-600 transition cursor-pointer"
          >
            Clear Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Sr. No.
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
                filteredPrintRecords?.map((print, index) => (
                  <tr
                    key={print?.print_id || index}
                    className="hover:bg-gray-50 transition"
                  >
                    {/* Sr No */}
                    <td className="px-5 py-4 text-gray-500">{index + 1}</td>

                    {/* Media Type */}
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {print?.creative || "-"}
                    </td>

                    {/* Media Type */}
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {print?.print_date || "-"}
                    </td>

                    {/* Media Type */}
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {print?.media_type || "-"}
                    </td>

                    {/* Width */}
                    <td className="px-5 py-4 text-gray-600">
                      {print?.width || "-"}
                    </td>

                    {/* Height */}
                    <td className="px-5 py-4 text-gray-600">
                      {print?.height || "-"}
                    </td>

                    {/* Size Unit */}
                    <td className="px-5 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {print?.size_unit || "-"}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="px-5 py-4 text-gray-600">
                      {print?.quantity || 0}
                    </td>

                    {/* Total Area */}
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {print?.total_area ? `${print.total_area} Sq.Ft` : "-"}
                    </td>

                    {/* Remarks */}
                    <td className="px-5 py-4 text-gray-600 max-w-xs">
                      <p className="truncate" title={print?.remarks}>
                        {print?.remarks || "-"}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Update */}
                        <button
                          onClick={() => handleUpdate(print)}
                          className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          title="Update Print Record"
                        >
                          <FiEdit size={16} />
                        </button>

                        {/* Delete */}
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
        </div>
      </div>

      <br />
      {/* <EmployeeTable /> */}

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
    </>
  );
};

export default AdminDashboard;
