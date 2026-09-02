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
// import AddChallanModel from "../components/PopupWindows/AddChallanModel";
// import UpdateChallanModel from "../components/PopupWindows/UpdateChallanModel";
import * as XLSX from "xlsx";
import ClientMasterModel from "../components/PopupWindows/ClientMasterModel";
import AddChallanModel from "../components/PopupWindows/AddChallanModel";
// import ChallanPartyMasterModel from "../components/PopupWindows/MediaMasterModel";

const ChallanPage = () => {
  const user = useSelector((state) => state?.user?.currentUser);
  const [ChallanRecords, setChallanRecords] = useState([]);
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

  const handleUpdate = (data) => {
    setUpdateModel(true);
    setSelected(data);
  };

  const getAllChallanData = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${apiUrl}/api/Challan/get-all-Challan`);

      console.log(response?.data?.data?.data);

      if (response.data?.data?.success) {
        setChallanRecords(response?.data?.data?.data || []);
      } else {
        setChallanRecords(response.data?.data?.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllChallanData();
  }, []);

  const filteredChallanRecords = useMemo(() => {
    return ChallanRecords.filter((Challan) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        !search ||
        Challan?.media_type?.toLowerCase().includes(searchValue) ||
        Challan?.remarks?.toLowerCase().includes(searchValue) ||
        Challan?.creative?.toLowerCase().includes(searchValue);

      const matchesMediaType =
        !mediaTypeFilter || Challan?.media_type === mediaTypeFilter;

      const matchesUnit = !unitFilter || Challan?.size_unit === unitFilter;

      const ChallanDate = Challan?.Challan_date
        ? new Date(Challan.Challan_date).toISOString().split("T")[0]
        : "";

      const matchesStartDate = !startDate || ChallanDate >= startDate;

      const matchesEndDate = !endDate || ChallanDate <= endDate;

      return (
        matchesSearch &&
        matchesMediaType &&
        matchesUnit &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }, [ChallanRecords, search, mediaTypeFilter, unitFilter, startDate, endDate]);

  console.log("filteredChallanRecords", filteredChallanRecords);

  const mediaTypes = [
    ...new Set(
      ChallanRecords.map((Challan) => Challan?.media_type).filter(Boolean),
    ),
  ];

  // Delete employee
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this record?",
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${apiUrl}/api/Challan/delete-Challan/${id}`);

      // Remove deleted employee from UI
      setChallanRecords((prev) =>
        prev.filter((employee) => employee.Challan_id !== id),
      );

      toast.success("Challan record deleted successfully");
    } catch (error) {
      console.error("Error deleting Challan record:", error);
      toast.error("Failed to delete Challan record");
    }
  };

  const downloadExcel = () => {
    if (filteredChallanRecords.length === 0) {
      toast.error("No records available to download");
      return;
    }

    const excelData = filteredChallanRecords.map((Challan, index) => {
      const totalArea = parseFloat(
        String(Challan?.total_area ?? 0).replace(/,/g, ""),
      );

      return {
        "Sr. No.": index + 1,
        Creative: Challan?.creative || "-",
        "Challan Date": Challan?.Challan_date || "-",
        "Media Type": Challan?.media_type || "-",
        Width: Challan?.width || "-",
        Height: Challan?.height || "-",
        Unit: Challan?.size_unit || "-",
        Quantity: Number(Challan?.quantity) || 0,

        // IMPORTANT: use converted number
        "Total Area (Sq.Ft)": isNaN(totalArea) ? 0 : totalArea,

        Remarks: Challan?.remarks || "-",
      };
    });

    console.log(
      "Excel Data:",
      excelData.map((item) => ({
        totalArea: item["Total Area (Sq.Ft)"],
        type: typeof item["Total Area (Sq.Ft)"],
      })),
    );

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

    XLSX.utils.book_append_sheet(workbook, worksheet, "Challan Records");

    XLSX.writeFile(
      workbook,
      `Challan_Records_${new Date().toISOString().split("T")[0]}.xlsx`,
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
              Challan Records
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredChallanRecords.length} of {ChallanRecords.length}{" "}
              records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Add New Record */}
            <button
              onClick={() => {
                setMasterModel(true);
              }}
              className="flex items-center gap-2 px-8 py-2 rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 transition cursor-pointer"
            >
              <FiPlus />
              Client Master
            </button>

            {/* Add New Record */}
            <button
              onClick={() => {
                setAddModel(true);
              }}
              className="flex items-center gap-2 px-8 py-2 rounded-lg text-gray-900 bg-yellow-200 hover:bg-yellow-300 transition cursor-pointer"
            >
              <FiPlus />
              Add Challan
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
              placeholder="Search challan..."
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
              onClick={getAllChallanData}
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
                    Loading Challan records...
                  </td>
                </tr>
              ) : filteredChallanRecords?.length === 0 ? (
                <tr>
                  <td
                    colSpan={user?.user?.emp_role === "admin" ? 9 : 8}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No Challan records found.
                  </td>
                </tr>
              ) : (
                filteredChallanRecords?.map((Challan, index) => (
                  <tr
                    key={Challan?.Challan_id || index}
                    className="hover:bg-gray-50 transition"
                  >
                    {/* Sr No */}
                    <td className="px-5 py-4 text-gray-500">{index + 1}</td>

                    {/* Media Type */}
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {Challan?.creative || "-"}
                    </td>

                    {/* Media Type */}
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {Challan?.Challan_date || "-"}
                    </td>

                    {/* Media Type */}
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {Challan?.media_type || "-"}
                    </td>

                    {/* Width */}
                    <td className="px-5 py-4 text-gray-600">
                      {Challan?.width || "-"}
                    </td>

                    {/* Height */}
                    <td className="px-5 py-4 text-gray-600">
                      {Challan?.height || "-"}
                    </td>

                    {/* Size Unit */}
                    <td className="px-5 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {Challan?.size_unit || "-"}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="px-5 py-4 text-gray-600">
                      {Challan?.quantity || 0}
                    </td>

                    {/* Total Area */}
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {Challan?.total_area
                        ? `${Challan.total_area} Sq.Ft`
                        : "-"}
                    </td>

                    {/* Remarks */}
                    <td className="px-5 py-4 text-gray-600 max-w-xs">
                      <p className="truncate" title={Challan?.remarks}>
                        {Challan?.remarks || "-"}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Update */}
                        <button
                          onClick={() => handleUpdate(Challan)}
                          className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          title="Update Challan Record"
                        >
                          <FiEdit size={16} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(Challan?.Challan_id)}
                          className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition"
                          title="Delete Challan Record"
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
        <div className="flex justify-end mt-2">
          {/* Download Excel */}
          <button
            onClick={downloadExcel}
            disabled={filteredChallanRecords.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition"
          >
            <FiDownload />
            Excel
          </button>
        </div>
      </div>

      {/* <UpdateChallanModel
        isOpen={updateModel}
        onClose={() => setUpdateModel(false)}
        getAllChallanData={getAllChallanData}
        selected={selected}
      /> */}
      <AddChallanModel
        isOpen={addModel}
        onClose={() => setAddModel(false)}
        getAllChallanData={getAllChallanData}
      />
      <ClientMasterModel
        isOpen={masterModel}
        onClose={() => setMasterModel(false)}
      />
    </>
  );
};

export default ChallanPage;
