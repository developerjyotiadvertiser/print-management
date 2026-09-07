import { useEffect, useState } from "react";
import axios from "axios";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { useSelector } from "react-redux";
import UpdateMediaTypeModel from "./PopupWindows/UpdateMediaTypeModel";
import AddMediaTypeModal from "./PopupWindows/AddMediaTypeModal";

const MediaTypeTable = () => {
  const user = useSelector((state) => state?.user?.currentUser);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [updateModel, setUpdateModel] = useState(false);
  const [selected, setSelected] = useState();
  const [isMediaTypeModalOpen, setIsMediaTypeModalOpen] = useState(false);

  const handleUpdate = (data) => {
    setUpdateModel(true);
    setSelected(data);
  };

  // Fetch all employees
  const getAllMediaTypes = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${apiUrl}/api/media/get-all-media`);
      setEmployees(data?.data?.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllMediaTypes();
  }, []);

  // Delete employee
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this media type?",
    );
    if (!confirmDelete) return;
    try {
      await axios.delete(`${apiUrl}/api/media/delete-media/${id}`);
      getAllMediaTypes();
      alert("Media type deleted successfully");
    } catch (error) {
      console.error("Error deleting media type:", error);
      alert("Failed to delete media type");
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
              onClick={() => setIsMediaTypeModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 rounded-lg text-white hover:bg-red-600 transition text-xs font-bold"
            >
              + Add New Media Type
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
                  Media Type
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
                    colSpan="8"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No Media type found.
                  </td>
                </tr>
              ) : (
                employees?.map((employee, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800">
                        {employee?.mt_name || "-"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Update */}
                        <button
                          onClick={() => handleUpdate(employee)}
                          className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          title="Update Employee"
                        >
                          <FiEdit size={16} />
                        </button>
                        {user?.user?.emp_role !== "employee" && (
                          <>
                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(employee.mt_id)}
                              className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition"
                              title="Delete Employee"
                            >
                              <FiTrash2 size={16} />
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
        </div>
      </div>

      <UpdateMediaTypeModel
        isOpen={updateModel}
        onClose={() => setUpdateModel(false)}
        getAllMediaTypes={getAllMediaTypes}
        selected={selected}
      />
      <AddMediaTypeModal
        isOpen={isMediaTypeModalOpen}
        onClose={() => setIsMediaTypeModalOpen(false)}
        getAllMediaTypes={getAllMediaTypes}
      />
    </>
  );
};

export default MediaTypeTable;
