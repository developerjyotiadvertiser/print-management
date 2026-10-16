import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IoClose } from "react-icons/io5";
import AddMediaItemsModel from "./AddMediaItemsModel";

const AddPrinterMediaModel = ({
  isMediaOpen,
  onMediaClose,
  selected,
  mediaType,
  getAllMediaMaster,
}) => {
  const modalRef = useRef();
  const apiUrl = import.meta.env.VITE_API_URL;
  const [isMediaItemModalOpen, setIsMediaItemModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    printer_id: selected?.pm_id,
    pmm_media: "",
    pmm_price: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        printer_id: selected?.pm_id,
      }));
    }
  }, [selected]);

  // --------------------------------
  // HANDLE INPUT CHANGE
  // --------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --------------------------------
  // SUBMIT
  // --------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await axios.post(
        `${apiUrl}/api/printer-master/save-printer-media`,
        formData,
      );

      if (response.data.success) {
        toast.success(response.data.message);
        onMediaClose();
      } else {
        toast.error(response.data.message || "Failed to update printer media");
      }
      getAllMediaMaster();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update printer media",
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // CLOSE MODAL
  // --------------------------------
  const handlePrintMediaClose = () => {
    onMediaClose();
  };

  // --------------------------------
  // CLOSE OUTSIDE
  // --------------------------------
  // useEffect(() => {
  //   if (!isMediaOpen) return;

  //   const handleClickOutside = (e) => {
  //     if (modalRef.current && !modalRef.current.contains(e.target)) {
  //       handlePrintMediaClose();
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);

  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, [isMediaOpen, loading]);

  if (!isMediaOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div
          ref={modalRef}
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        >
          {/* HEADER */}
          <div className="mb-5 flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold text-blue-800">
              Add Printer Media
            </h2>

            <button
              type="button"
              onClick={handlePrintMediaClose}
              disabled={loading}
              className="text-gray-500 transition hover:text-red-500 disabled:opacity-50"
            >
              <IoClose className="text-2xl" />
            </button>
          </div>

          {/* <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsMediaItemModalOpen(true)}
              className="mb-1 flex items-center gap-2 px-3 py-1 bg-green-500 rounded-lg text-white hover:bg-green-600 transition text-md font-bold"
              title=""
            >
              +
            </button>
          </div> */}

          <form onSubmit={handleSubmit}>
            {/* PRINTER NAME */}
            <div className="mt-4">
              <div className="flex justify-between text-end">
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Media Name *
                </label>
                <button
                  type="button"
                  onClick={() => setIsMediaItemModalOpen(true)}
                  className="mb-1 flex items-center gap-2 px-2 bg-green-500 rounded-lg text-white hover:bg-green-600 transition text-md font-bold"
                  title="Add Media"
                >
                  +
                </button>
              </div>

              <select
                name="pmm_media"
                value={formData.pmm_media}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">-select-</option>
                {mediaType?.map((item) => (
                  <>
                    <option value={item?.mt_name}>{item?.mt_name}</option>
                  </>
                ))}
              </select>
            </div>

            {/* PAN + PINCODE */}
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Media Price (Per SQ FT)*
                </label>

                <input
                  type="text"
                  name="pmm_price"
                  value={formData.pmm_price}
                  onChange={handleChange}
                  placeholder="Enter Amount"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* BUTTONS */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handlePrintMediaClose}
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
                {loading ? "Saving..." : "Save Media"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AddMediaItemsModel
        isItemOpen={isMediaItemModalOpen}
        onItemClose={() => setIsMediaItemModalOpen(false)}
        getAllMediaMaster={getAllMediaMaster}
        mediaType={mediaType}
        // getAllMediaType={getAllMediaType}
      />
    </>
  );
};

export default AddPrinterMediaModel;
