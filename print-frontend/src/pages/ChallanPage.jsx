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
import * as XLSX from "xlsx";
import ClientMasterModel from "../components/PopupWindows/ClientMasterModel";
import AddChallanModel from "../components/PopupWindows/AddChallanModel";
import UpdateChallanModel from "../components/PopupWindows/UpdateChallanModel";
import { FaPrint } from "react-icons/fa";
import ChallanPrint from "./ChallanPrint";

const ChallanPage = () => {
  const user = useSelector((state) => state?.user?.currentUser);

  const [ChallanRecords, setChallanRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [updateModel, setUpdateModel] = useState(false);
  const [selected, setSelected] = useState(null);
  const [addModel, setAddModel] = useState(false);
  const [masterModel, setMasterModel] = useState(false);
  const [printRecords, setPrintRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [challanPrintModel, setChallanPrintModel] = useState(false);
  const [selectedPrint, setSelectedPrint] = useState(null);

  // PRINT CHALLAN
  const handlePrintModel = (challan) => {
    setSelectedPrint(challan);
    setChallanPrintModel(true);
  };

  // UPDATE
  const handleUpdate = (challan) => {
    setSelected(challan);
    setUpdateModel(true);
  };

  // GET ALL PRINT RECORDS
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
      console.error("Error fetching print records:", error);
    } finally {
      setLoading(false);
    }
  };

  // GET ALL CLIENTS
  const getAllClientData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${apiUrl}/api/client/get-all-client`);
      setEmployees(data?.data?.data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  // GET ALL CHALLANS
  const getAllChallanData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/api/Challan/get-all-Challan`);
      if (response.data?.data?.success) {
        setChallanRecords(response?.data?.data?.data || []);
      } else {
        setChallanRecords(response?.data?.data?.data || []);
      }
    } catch (error) {
      console.error("Error fetching challans:", error);
      toast.error("Failed to load challan records");
    } finally {
      setLoading(false);
    }
  };

  // INITIAL DATA
  useEffect(() => {
    getAllChallanData();
    getAllPrintData();
    getAllClientData();
  }, []);

  // FILTER CHALLANS
  const filteredChallanRecords = useMemo(() => {
    return ChallanRecords.filter((challan) => {
      const searchValue = search.toLowerCase().trim();
      const matchesSearch =
        !search ||
        challan?.client_name?.toLowerCase().includes(searchValue) ||
        challan?.ch_phone?.toLowerCase().includes(searchValue) ||
        challan?.ch_delivered_to?.toLowerCase().includes(searchValue) ||
        challan?.ch_remark?.toLowerCase().includes(searchValue) ||
        String(challan?.ch_id || "")
          .toLowerCase()
          .includes(searchValue);
      const challanDate = challan?.ch_date
        ? new Date(challan.ch_date).toISOString().split("T")[0]
        : "";

      const matchesStartDate = !startDate || challanDate >= startDate;
      const matchesEndDate = !endDate || challanDate <= endDate;
      return matchesSearch && matchesStartDate && matchesEndDate;
    });
  }, [ChallanRecords, search, startDate, endDate]);

  // MEDIA TYPES
  const mediaTypes = useMemo(() => {
    const types = [];
    ChallanRecords.forEach((challan) => {
      if (Array.isArray(challan?.prints)) {
        challan.prints.forEach((print) => {
          if (print?.media_type) {
            types.push(print.media_type);
          }
        });
      }
    });

    return [...new Set(types)];
  }, [ChallanRecords]);

  // DELETE
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this challan?",
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${apiUrl}/api/Challan/delete-Challan/${id}`);
      await getAllChallanData();
      toast.success("Challan deleted successfully");
    } catch (error) {
      console.error("Error deleting challan:", error);
      toast.error("Failed to delete challan");
    }
  };

  // EXCEL DOWNLOAD
  const downloadExcel = () => {
    if (filteredChallanRecords.length === 0) {
      toast.error("No records available to download");
      return;
    }

    const excelData = [];
    filteredChallanRecords.forEach((challan, challanIndex) => {
      const prints = Array.isArray(challan?.prints) ? challan.prints : [];

      // If challan has no prints
      if (prints.length === 0) {
        excelData.push({
          "Sr. No.": challanIndex + 1,
          "Challan ID": challan?.ch_id || "-",

          // Client details
          Client: challan?.client_name || "-",
          "Client Contact": challan?.client_contact || "-",
          Address: challan?.client_address || "-",
          "PAN Number": challan?.pan_number || "-",
          "GST Number": challan?.gst_number || "-",
          Pincode: challan?.pincode || "-",

          // Challan details
          Date: challan?.ch_date || "-",
          "Print ID": "-",
          Description: "-",
          Creative: "-",
          Width: 0,
          Height: 0,
          Unit: "-",
          Quantity: 0,
          "Total Area (Sq.Ft)": 0,

          "Delivered To": challan?.ch_delivered_to || "-",
          Phone: challan?.ch_phone || "-",
          Remarks: challan?.ch_remark || "-",
        });

        return;
      }

      // Multiple prints
      prints.forEach((print, printIndex) => {
        const width = parseFloat(
          String(print?.pci_width ?? 0).replace(/,/g, ""),
        );
        const height = parseFloat(
          String(print?.pci_height ?? 0).replace(/,/g, ""),
        );
        const totalArea = parseFloat(
          String(print?.pci_area ?? 0).replace(/,/g, ""),
        );

        excelData.push({
          // Show Sr No only on first print row of each challan
          "Sr. No.": printIndex === 0 ? challanIndex + 1 : "",
          "Challan ID": challan?.ch_id || "-",
          // Client details
          Client: challan?.client_name || "-",
          "Client Contact": challan?.client_contact || "-",
          Address: challan?.client_address || "-",
          "PAN Number": challan?.pan_number || "-",
          "GST Number": challan?.gst_number || "-",
          Pincode: challan?.pincode || "-",
          // Challan details
          Date: challan?.ch_date || "-",
          // Print details
          "Print ID": print?.pci_print_id || "-",
          Description: print?.pci_description || "-",
          Creative: print?.pci_creative || "-",
          Width: isNaN(width) ? 0 : width,
          Height: isNaN(height) ? 0 : height,
          Unit: print?.pci_size_unit || "-",
          Quantity: Number(print?.pci_quantity) || 0,
          "Total Area (Sq.Ft)": isNaN(totalArea) ? 0 : totalArea,
          // Delivery details
          "Delivered To": challan?.ch_delivered_to || "-",
          Phone: challan?.ch_phone || "-",
          Remarks: challan?.ch_remark || "-",
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Column widths
    worksheet["!cols"] = [
      { wch: 10 }, // Sr No
      { wch: 12 }, // Challan ID
      { wch: 25 }, // Client
      { wch: 18 }, // Client Contact
      { wch: 35 }, // Address
      { wch: 18 }, // PAN
      { wch: 22 }, // GST
      { wch: 12 }, // Pincode
      { wch: 20 }, // Date
      { wch: 12 }, // Print ID
      { wch: 30 }, // Description
      { wch: 30 }, // Creative
      { wch: 12 }, // Width
      { wch: 12 }, // Height
      { wch: 12 }, // Unit
      { wch: 12 }, // Quantity
      { wch: 20 }, // Total Area
      { wch: 25 }, // Delivered To
      { wch: 18 }, // Phone
      { wch: 40 }, // Remarks
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
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Challan Records
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredChallanRecords.length} of {ChallanRecords.length}{" "}
              challans
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMasterModel(true)}
              className="flex items-center gap-2 px-8 py-2 rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 transition cursor-pointer"
            >
              <FiPlus />
              Client Master
            </button>
            <button
              onClick={() => setAddModel(true)}
              className="flex items-center gap-2 px-8 py-2 rounded-lg text-gray-900 bg-yellow-200 hover:bg-yellow-300 transition cursor-pointer"
            >
              <FiPlus />
              Add Challan
            </button>
          </div>
        </div>

        {/* FILTERS */}
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
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearch("");
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

        {/* TABLE */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Sr. No.
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Challan ID
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Client
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">Date</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Phone</th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Delivered To
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Remarks
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600 text-center">
                  Actions
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600 text-center">
                  Print Challan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    Loading Challan records...
                  </td>
                </tr>
              ) : filteredChallanRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No Challan records found.
                  </td>
                </tr>
              ) : (
                filteredChallanRecords.map((challan, index) => (
                  <tr
                    key={challan?.ch_id || index}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-5 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-5 py-4 font-semibold text-blue-700">
                      {challan?.ch_id || "-"}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {challan?.client_name || "-"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {challan?.ch_date || "-"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {challan?.ch_phone || "-"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {challan?.ch_delivered_to || "-"}
                    </td>
                    <td className="px-5 py-4 text-gray-600 max-w-xs">
                      <p className="truncate" title={challan?.ch_remark || ""}>
                        {challan?.ch_remark || "-"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleUpdate(challan)}
                          className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          title="Update Challan"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(challan?.ch_id)}
                          className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition"
                          title="Delete Challan"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handlePrintModel(challan)}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                        title="Print Challan"
                      >
                        <FaPrint size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* EXCEL */}
        <div className="flex justify-end mt-2">
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

      {/* UPDATE */}
      <UpdateChallanModel
        isOpen={updateModel}
        onClose={() => setUpdateModel(false)}
        getAllChallanData={getAllChallanData}
        selected={selected}
        employees={employees}
        printRecords={printRecords}
      />

      {/*  ADD */}
      <AddChallanModel
        isOpen={addModel}
        onClose={() => setAddModel(false)}
        getAllChallanData={getAllChallanData}
        employees={employees}
        printRecords={printRecords}
      />

      {/* CLIENT MASTER */}
      <ClientMasterModel
        isOpen={masterModel}
        onClose={() => setMasterModel(false)}
      />

      {/* PRINT */}
      <ChallanPrint
        isOpen={challanPrintModel}
        onClose={() => setChallanPrintModel(false)}
        challan={selectedPrint}
      />
    </>
  );
};

export default ChallanPage;
