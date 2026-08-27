import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";

const AddMediaTypeModal = ({
  isOpen,
  onClose,
  getAllMediaTypes,
  onMediaTypeAdded,
}) => {
  const modalRef = useRef();

  const [mtName, setMtName] = useState("");
  const [loading, setLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mtName.trim()) {
      toast.error("Please enter media type name");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${apiUrl}/api/media/save-media`, {
        mt_name: mtName,
        mt_status: "active",
      });

      if (response.data.success) {
        toast.success(response.data.message);

        // Refresh media type list
        await getAllMediaTypes();

        // Optional: automatically select newly created media type
        if (onMediaTypeAdded) {
          onMediaTypeAdded(response.data.data);
        }

        setMtName("");
        onClose();
      }
    } catch (error) {
      console.log(error);

      toast.error(error.response?.data?.message || "Failed to add media type.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-semibold text-blue-800">
            Add Media Type
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 transition hover:text-red-500"
          >
            <IoClose className="text-2xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Media Type Name *
            </label>

            <input
              type="text"
              value={mtName}
              onChange={(e) => setMtName(e.target.value)}
              placeholder="Enter media type"
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`rounded-lg px-6 py-2.5 text-white ${
                loading ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Saving..." : "Add Media Type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMediaTypeModal;
