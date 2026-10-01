import { IoClose } from "react-icons/io5";

const ImagePreviewModal = ({ isOpen, imageUrl, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-6xl w-full max-h-[95vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10
                     flex h-10 w-10 items-center justify-center
                     rounded-full bg-white text-gray-700
                     shadow-lg hover:bg-gray-100
                     transition"
          title="Close"
        >
          <IoClose size={24} />
        </button>

        {/* Image */}
        <img
          src={imageUrl}
          alt="Creative Preview"
          className="max-h-[90vh] max-w-full object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
};

export default ImagePreviewModal;
