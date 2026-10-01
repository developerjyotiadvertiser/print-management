import { useEffect, useState } from "react";
import axios from "axios";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import AddPrinterMasterModel from "./PopupWindows/AddPrinterMasterModel";
import UpdatePrinterMasterModel from "./PopupWindows/UpdatePrinterMasterModel";

const PrinterMasterTable = ({ getAllPrinterMaster, printerMaster }) => {
  const user = useSelector((state) => state?.user?.currentUser);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [updatePrintMasterModel, setUpdatePrintMasterModel] = useState(false);
  const [selected, setSelected] = useState();
  const [addPrinter, setAddPrinter] = useState(false);

  const handleUpdate = (data) => {
    console.log("clicked 18");

    setUpdatePrintMasterModel(true);
    setSelected(data);
  };

  // Delete employee
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete the printer master data?",
    );

    if (!confirmDelete) return;
    try {
      await axios.delete(
        `${apiUrl}/api/printer-master/delete-printer-master/${id}`,
      );
      getAllPrinterMaster();
      toast.success("Client data deleted successfully");
    } catch (error) {
      console.error("Error deleting printer master data:", error);
      toast.error("Failed to delete printer master data");
    }
  };

  return (
    <>
      <div className="p-1 bg-white rounded-xl shadow-sm w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={() => setAddPrinter(true)}
              className="mt-1 flex items-center gap-2 px-3 py-1 bg-cyan-500 rounded-lg text-white hover:bg-cyan-600 transition text-md font-bold"
            >
              + New Printer
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
                  Printer Name
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600 text-center">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    Loading Printer Master types...
                  </td>
                </tr>
              ) : printerMaster.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No Printer Master Found.
                  </td>
                </tr>
              ) : (
                printerMaster?.map((employee, index) => (
                  <tr
                    key={employee?.pm_id || index}
                    className="hover:bg-gray-50 transition"
                  >
                    {/* Sr. No. */}
                    <td className="px-5 py-4 text-gray-500">{index + 1}</td>

                    {/* Client Name */}
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800">
                        {employee?.printer_name || "-"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          String(employee?.pm_status || "").toLowerCase() ===
                          "active"
                            ? "bg-green-50 text-green-700"
                            : String(
                                  employee?.pm_status || "",
                                ).toLowerCase() === "pending"
                              ? "bg-yellow-50 text-yellow-700"
                              : String(
                                    employee?.pm_status || "",
                                  ).toLowerCase() === "inactive"
                                ? "bg-red-50 text-red-700"
                                : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {employee?.pm_status || "-"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Update */}
                        <button
                          onClick={() => handleUpdate(employee)}
                          className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          title="Update Media Type"
                        >
                          <FiEdit size={16} />
                        </button>

                        {/* Delete */}
                        {user?.user?.emp_role !== "employee" && (
                          <button
                            onClick={() => handleDelete(employee.pm_id)}
                            className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition"
                            title="Delete Media Type"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UpdatePrinterMasterModel
        isPrintMasterOpen={updatePrintMasterModel}
        onPrintMasterClose={() => setUpdatePrintMasterModel(false)}
        getAllPrinterMaster={getAllPrinterMaster}
        selected={selected}
      />

      <AddPrinterMasterModel
        isItemOpen={addPrinter}
        onItemClose={() => setAddPrinter(false)}
        getAllPrinterMaster={getAllPrinterMaster}
      />
    </>
  );
};

export default PrinterMasterTable;
