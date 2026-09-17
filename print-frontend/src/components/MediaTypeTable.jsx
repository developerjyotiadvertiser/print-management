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
      const { data } = await axios.get(
        `${apiUrl}/api/media-master/get-all-media-master`,
      );
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
      await axios.delete(
        `${apiUrl}/api/media-master/delete-media-master/${id}`,
      );
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

                <th className="px-5 py-3 font-semibold text-gray-600">Media</th>

                <th className="px-5 py-3 font-semibold text-gray-600">Brand</th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  OZ/GSM
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Height
                </th>
                <th className="px-5 py-3 font-semibold text-gray-600">Width</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Unit</th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Size(SQFT)
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600 text-center">
                  Status
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600 text-center">
                  Created At
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
                    colSpan="7"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    Loading media...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No media found.
                  </td>
                </tr>
              ) : (
                employees?.map((media, index) => (
                  <tr
                    key={media?.mm_id || index}
                    className="hover:bg-gray-50 transition"
                  >
                    {/* Sr. No. */}
                    <td className="px-5 py-4 text-gray-500">
                      {media?.mm_serial_number}
                    </td>

                    {/* Media */}
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800">
                        {media?.mm_media || "-"}
                      </div>
                    </td>

                    {/* Brand */}
                    <td className="px-5 py-4 text-gray-600">
                      {media?.mm_brand || "-"}
                    </td>

                    {/* GSM */}
                    <td className="px-5 py-4 text-gray-600">
                      {media?.mm_gsm || "-"}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {media?.mm_height || "-"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {media?.mm_width || "-"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {media?.mm_unit || "-"}
                    </td>

                    {/* Size */}
                    <td className="px-5 py-4 text-gray-600">
                      {media?.mm_size || "-"}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          media?.mm_status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {media?.mm_status || "-"}
                      </span>
                    </td>

                    {/* created at */}
                    <td className="px-5 py-4 text-gray-600">
                      {media?.mm_created_at || "-"}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Update */}
                        <button
                          onClick={() => handleUpdate(media)}
                          className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition"
                          title="Update Media"
                        >
                          <FiEdit size={16} />
                        </button>

                        {/* Delete */}
                        {user?.user?.emp_role !== "employee" && (
                          <button
                            onClick={() => handleDelete(media.mm_id)}
                            className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition"
                            title="Delete Media"
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
