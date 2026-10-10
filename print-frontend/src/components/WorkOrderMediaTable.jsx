import { useEffect, useState } from "react";
import axios from "axios";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { useSelector } from "react-redux";

const WorkOrderMediaTable = ({ selectedPrinter }) => {
  const user = useSelector((state) => state?.user?.currentUser);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [updateModel, setUpdateModel] = useState(false);
  const [selected, setSelected] = useState();
  const [mediaType, setMediaType] = useState([]);
  const [isMediaTypeModalOpen, setIsMediaTypeModalOpen] = useState(false);

  const handleUpdate = (data) => {
    setUpdateModel(true);
    setSelected(data);
  };

  console.log("27 selectedPrinter", selectedPrinter);

  // Fetch all media master
  const getAllMediaMaster = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${apiUrl}/api/printer-master/get-printer-media/${selectedPrinter?.pm_id}`,
      );
      setEmployees(data?.data?.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllMediaMaster();
  }, []);

  // Delete employee
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this printer media?",
    );
    if (!confirmDelete) return;
    try {
      await axios.delete(
        `${apiUrl}/api/printer-master/delete-printer-media/${id}`,
      );
      getAllMediaMaster();
      alert("Printer media deleted successfully");
    } catch (error) {
      console.error("Error deleting printer media:", error);
      alert("Failed to delete printer media");
    }
  };

  return (
    <>
      <div className="p-1 bg-white rounded-xl shadow-sm w-full">
        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 font-semibold text-gray-600 text-left">
                  Sr. No.
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600 text-left">
                  Printer Media
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600 text-left">
                  Price
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600 text-left">
                  Created At
                </th>

                {user && user?.user?.emp_role !== "employee" && (
                  <th className="px-5 py-3 font-semibold text-gray-600 text-left">
                    Action
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    Loading media...
                  </td>
                </tr>
              ) : employees?.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No media found.
                  </td>
                </tr>
              ) : (
                employees?.map((media, index) => (
                  <tr
                    key={media?.pmm_id || index}
                    className="hover:bg-gray-50 transition"
                  >
                    {/* Sr. No. */}
                    <td className="px-5 py-4 text-gray-500 text-left">
                      {index + 1}
                    </td>

                    {/* Printer Media */}
                    <td className="px-5 py-4 text-left">
                      <div className="font-medium text-gray-800">
                        {media?.pmm_media || "-"}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-4 text-gray-600 text-left">
                      {media?.pmm_price || "-"}
                    </td>

                    {/* Created At */}
                    <td className="px-5 py-4 text-gray-600 text-left">
                      {media?.pmm_created_at || "-"}
                    </td>

                    {/* Action */}
                    {user && user?.user?.emp_role !== "employee" && (
                      <td className="px-5 py-4 text-left">
                        <div className="flex items-center justify-start gap-2">
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(media?.pmm_id)}
                            className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition"
                            title="Delete Media"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* <UpdateMediaTypeModel
        isOpen={updateModel}
        onClose={() => setUpdateModel(false)}
        getAllMediaMaster={getAllMediaMaster}
        getAllMediaType={getAllMediaType}
        selected={selected}
        mediaType={mediaType}
      />
      <AddMediaTypeModal
        isMediaOpen={isMediaTypeModalOpen}
        onMediaClose={() => setIsMediaTypeModalOpen(false)}
        getAllMediaMaster={getAllMediaMaster}
        mediaType={mediaType}
        getAllMediaType={getAllMediaType}
      /> */}
    </>
  );
};

export default WorkOrderMediaTable;
