import { useEffect, useRef, useState } from "react";
import { IoClose } from "react-icons/io5";
import PrinterMasterTable from "../PrinterMasterTable";
import { RiAddCircleFill } from "react-icons/ri";

const PrinterMasterModel = ({
  isOpen,
  onClose,
  getAllPrinterMaster,
  printerMaster,
  mediaType,
}) => {
  const modalRef = useRef();
  const [loading, setLoading] = useState(false);

  // CLOSE MODAL
  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, loading]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, loading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="w-full max-w-7xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b pb-4">
          <h2 className="flex items-center gap-1 whitespace-nowrap text-xl font-semibold text-blue-800">
            Printer Master (<span className="text-cyan-500">New Printer</span>+
            <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-purple-600">
              Printing Rates
              <RiAddCircleFill className="shrink-0" size={16} />
            </span>
            )
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-gray-500 transition hover:text-red-500"
          >
            <IoClose className="text-2xl" />
          </button>
        </div>
        <PrinterMasterTable
          getAllPrinterMaster={getAllPrinterMaster}
          printerMaster={printerMaster}
          mediaType={mediaType}
        />
      </div>
    </div>
  );
};

export default PrinterMasterModel;
