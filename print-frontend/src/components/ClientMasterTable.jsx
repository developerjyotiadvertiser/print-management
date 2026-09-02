import { useEffect, useState } from "react";
import axios from "axios";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { useSelector } from "react-redux";
import AddClientModal from "./PopupWindows/AddClientModal";
import UpdateClientModel from "./PopupWindows/UpdateClientModel";

const ClientMasterTable = () => {
  const user = useSelector((state) => state?.user?.currentUser);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [updateModel, setUpdateModel] = useState(false);
  const [selected, setSelected] = useState();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const handleUpdate = (data) => {
    setUpdateModel(true);
    setSelected(data);
  };

  // Fetch all employees
  const getAllClientData = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(`${apiUrl}/api/client/get-all-client`);

      setEmployees(data?.data?.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  console.log("clients", employees);

  useEffect(() => {
    getAllClientData();
  }, []);

  console.log("media type", employees);

  // Delete employee
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete the client data?",
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${apiUrl}/api/client/delete-client/${id}`);

      getAllClientData();

      alert("Client data deleted successfully");
    } catch (error) {
      console.error("Error deleting client data:", error);
      alert("Failed to delete client data");
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
              onClick={() => setIsClientModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 rounded-lg text-white hover:bg-red-600 transition text-xs font-bold"
            >
              + Add New Client
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
                  Client Name
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Contact
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Address
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  PAN Number
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  GST Number
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Pincode
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
                    Loading media types...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No Media type found.
                  </td>
                </tr>
              ) : (
                employees?.map((employee, index) => (
                  <tr
                    key={employee?.mt_id || index}
                    className="hover:bg-gray-50 transition"
                  >
                    {/* Sr. No. */}
                    <td className="px-5 py-4 text-gray-500">{index + 1}</td>

                    {/* Client Name */}
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800">
                        {employee?.client_name || "-"}
                      </div>
                    </td>

                    {/* Client Contact */}
                    <td className="px-5 py-4 text-gray-600">
                      {employee?.client_contact || "-"}
                    </td>

                    {/* Client Address */}
                    <td className="px-5 py-4 text-gray-600 max-w-xs">
                      <div
                        className="truncate"
                        title={employee?.client_address}
                      >
                        {employee?.client_address || "-"}
                      </div>
                    </td>

                    {/* PAN */}
                    <td className="px-5 py-4 text-gray-600 uppercase">
                      {employee?.pan_number || "-"}
                    </td>

                    {/* GST */}
                    <td className="px-5 py-4 text-gray-600 uppercase">
                      {employee?.gst_number || "-"}
                    </td>

                    {/* Pincode */}
                    <td className="px-5 py-4 text-gray-600">
                      {employee?.pincode || "-"}
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
                            onClick={() => handleDelete(employee.client_id)}
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

      <UpdateClientModel
        isOpen={updateModel}
        onClose={() => setUpdateModel(false)}
        getAllClientData={getAllClientData}
        selected={selected}
      />

      <AddClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        getAllClientData={getAllClientData}
      />
    </>
  );
};

export default ClientMasterTable;
