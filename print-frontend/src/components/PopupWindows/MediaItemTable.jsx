import { useEffect, useState } from "react";
import axios from "axios";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const MediaItemTable = ({ getAllMediaType, mediaType }) => {
  const user = useSelector((state) => state?.user?.currentUser);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  // Delete employee
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this media type?",
    );
    if (!confirmDelete) return;
    try {
      await axios.delete(`${apiUrl}/api/media/delete-media/${id}`);
      getAllMediaType();
      toast.success("Media type deleted successfully");
    } catch (error) {
      console.error("Error deleting media type:", error);
      alert("Failed to delete media type");
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
                <th className="px-5 py-3 font-semibold text-gray-600">
                  Sr. No.
                </th>

                <th className="px-5 py-3 font-semibold text-gray-600">
                  Media Item
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
              ) : mediaType?.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No media found.
                  </td>
                </tr>
              ) : (
                mediaType?.map((media, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition">
                    {/* Sr. No. */}
                    <td className="px-5 py-4 text-gray-500">{index + 1}</td>

                    {/* Media */}
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-800">
                        {media?.mt_name || "-"}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Delete */}
                        {user?.user?.emp_role !== "employee" && (
                          <button
                            onClick={() => handleDelete(media.mt_id)}
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
    </>
  );
};

export default MediaItemTable;
