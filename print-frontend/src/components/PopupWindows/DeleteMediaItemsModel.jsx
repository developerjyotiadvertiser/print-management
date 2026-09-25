import { useEffect, useRef, useState } from "react";
import { IoClose } from "react-icons/io5";
import MediaTypeTable from "../MediaTypeTable";
import MediaItemTable from "./MediaItemTable";

const DeleteMediaItemsModel = ({
  isItemOpen,
  onItemClose,
  getAllMediaType,
  mediaType,
}) => {
  const modalRef = useRef();
  const [loading, setLoading] = useState(false);

  // CLOSE MODAL
  const handleClose = () => {
    if (loading) return;
    onItemClose();
  };

  // Close when clicking outside
  useEffect(() => {
    if (!isItemOpen) return;

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isItemOpen, loading]);

  // Close on ESC
  useEffect(() => {
    if (!isItemOpen) return;

    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isItemOpen, loading]);

  if (!isItemOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-semibold text-blue-800">
            Media Item Table
          </h2>
          <button
            type="button"
            onClick={onItemClose}
            className="text-gray-500 transition hover:text-red-500"
          >
            <IoClose className="text-2xl" />
          </button>
        </div>
        <MediaItemTable
          getAllMediaType={getAllMediaType}
          mediaType={mediaType}
        />
      </div>
    </div>
  );
};

export default DeleteMediaItemsModel;
