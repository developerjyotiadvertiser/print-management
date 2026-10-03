import { useEffect, useState } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";
import { FiDownload, FiMail, FiShare2, FiX, FiImage } from "react-icons/fi";

const WorkOrderShareModal = ({ isOpen, onClose, workItem }) => {
  const apiUrl = import.meta.env.VITE_API_URL;

  console.log("10 workitem", workItem);

  // =========================================================
  // STATE
  // =========================================================

  const [imageUrl, setImageUrl] = useState("");
  const [imageBlob, setImageBlob] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Email modal
  const [emailModal, setEmailModal] = useState(false);

  const [emailData, setEmailData] = useState({
    to: "developerjyotiadvertiser@gmail.com",
    subject: "",
    message: "",
  });

  const [emailAttachments, setEmailAttachments] = useState([]);

  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const [sendingEmail, setSendingEmail] = useState(false);

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const currentDate = new Date().toLocaleDateString();

  const formatDate = (date) => {
    if (!date) return "";

    // DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}/.test(date)) {
      return date.split(" ")[0];
    }

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
      const [datePart] = date.split(" ");

      const [year, month, day] = datePart.split("-");

      return `${day}-${month}-${year}`;
    }

    return date;
  };

  // =========================================================
  // MEDIA ITEMS
  // =========================================================

  const mediaItems = workItem?.media_items || [];

  // =========================================================
  // TOTAL QUANTITY
  // =========================================================

  const totalQuantity = mediaItems.reduce(
    (total, media) => total + Number(media?.woim_quantity || 0),
    0,
  );

  // =========================================================
  // TOTAL AREA
  // =========================================================

  const totalArea = mediaItems.reduce(
    (total, media) => total + Number(media?.woim_area || 0),
    0,
  );

  // =========================================================
  // GET CREATIVE IMAGE URL
  // =========================================================

  const getCreativeImageUrl = (media) => {
    const image = media?.woim_creative_image;

    if (!image) {
      return null;
    }

    // Full URL
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    // Root-relative path
    if (image.startsWith("/")) {
      return `${apiUrl}${image}`;
    }

    console.log("relative path 106", `${apiUrl}/${image}`);

    // Relative path
    return `${apiUrl}/${image}`;
  };

  // =========================================================
  // GENERATE IMAGE
  // =========================================================

  const generateImage = async () => {
    if (!workItem) {
      return;
    }

    try {
      setGenerating(true);

      const element = document.getElementById("work-order-share-content");

      if (!element) {
        toast.error("Unable to generate work order image.");

        return;
      }

      // Give browser time to render
      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/png", 1);
      });

      if (!blob) {
        toast.error("Failed to generate work order image.");

        return;
      }

      const url = URL.createObjectURL(blob);

      setImageBlob(blob);
      setImageUrl(url);
    } catch (error) {
      console.error("Generate work order image error:", error);

      toast.error("Failed to generate work order image.");
    } finally {
      setGenerating(false);
    }
  };

  // =========================================================
  // GENERATE IMAGE WHEN MODAL OPENS
  // =========================================================

  useEffect(() => {
    if (!isOpen || !workItem) {
      return;
    }

    setImageUrl("");
    setImageBlob(null);

    setEmailModal(false);

    setEmailAttachments([]);

    setEmailData({
      to: "developerjyotiadvertiser@gmail.com",
      subject: `Work Order - JC ${workItem?.woi_jc_number || ""}`,
      message: "Please find the work order and creative images attached.",
    });

    generateImage();

    return () => {
      setImageUrl((oldUrl) => {
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl);
        }

        return "";
      });
    };
  }, [isOpen, workItem]);

  // =========================================================
  // CLOSE MAIN MODAL
  // =========================================================

  const handleClose = () => {
    if (sendingEmail) {
      return;
    }

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    emailAttachments.forEach((attachment) => {
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    });

    setImageUrl("");
    setImageBlob(null);

    setEmailAttachments([]);

    setEmailModal(false);

    setEmailData({
      to: "developerjyotiadvertiser@gmail.com",
      subject: "",
      message: "",
    });

    onClose();
  };

  // =========================================================
  // DOWNLOAD IMAGE
  // =========================================================

  const handleDownload = () => {
    if (!imageUrl) {
      toast.error("Work order image is not ready.");

      return;
    }

    const link = document.createElement("a");

    link.href = imageUrl;

    link.download = `${workItem?.woi_jc_number || "NA"}-${currentDate}.png`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  // =========================================================
  // SHARE IMAGE
  // =========================================================

  const handleShare = async () => {
    if (!imageBlob) {
      toast.error("Image is still generating.");

      return;
    }

    try {
      setSharing(true);

      const file = new File(
        [imageBlob],
        `Work_Order_JC_${workItem?.woi_jc_number || "NA"}.png`,
        {
          type: "image/png",
        },
      );

      // =====================================================
      // WEB SHARE API
      // =====================================================

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
          files: [file],
        })
      ) {
        await navigator.share({
          title: `Work Order - JC ${workItem?.woi_jc_number || ""}`,

          text: `Work Order - JC ${workItem?.woi_jc_number || ""}`,

          files: [file],
        });

        return;
      }

      // =====================================================
      // FALLBACK
      // =====================================================

      toast.error(
        "File sharing is not supported in this browser. Please download the image.",
      );
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Share error:", error);

        toast.error("Unable to share image.");
      }
    } finally {
      setSharing(false);
    }
  };

  // =========================================================
  // PREPARE EMAIL ATTACHMENTS
  // =========================================================

  const prepareEmailAttachments = async () => {
    if (!imageBlob) {
      toast.error("Work order image is not ready.");

      return;
    }

    try {
      setLoadingAttachments(true);

      // Clean old preview URLs
      emailAttachments.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });

      const attachments = [];

      // ===================================================
      // WORK ORDER IMAGE
      // ===================================================

      const workOrderFileName = `Work_Order_JC_${
        workItem?.woi_jc_number || "NA"
      }.png`;

      attachments.push({
        name: workOrderFileName,

        blob: imageBlob,

        previewUrl: URL.createObjectURL(imageBlob),

        type: "work-order",
      });

      // ===================================================
      // CREATIVE IMAGES
      // ===================================================

      for (let index = 0; index < mediaItems.length; index++) {
        const media = mediaItems[index];

        const creativeImageUrl = getCreativeImageUrl(media);

        if (!creativeImageUrl) {
          continue;
        }

        try {
          const response = await fetch(creativeImageUrl);

          if (!response.ok) {
            console.error("Unable to fetch creative image:", creativeImageUrl);

            continue;
          }

          const blob = await response.blob();

          if (!blob || blob.size === 0) {
            continue;
          }

          const extension = blob.type?.split("/")?.pop() || "jpg";

          let creativeName =
            media?.woim_creative_image || `Creative_${index + 1}`;

          // Remove unsafe filename characters
          creativeName = String(creativeName).replace(/[<>:"/\\|?*]/g, "_");

          attachments.push({
            name: `${creativeName}.${extension}`,

            blob,

            previewUrl: URL.createObjectURL(blob),

            type: "creative",
          });
        } catch (error) {
          console.error("Creative image fetch error:", creativeImageUrl, error);
        }
      }

      setEmailAttachments(attachments);

      if (
        attachments.length === 1 &&
        mediaItems.some((media) => media?.woim_creative_image)
      ) {
        toast.error("Creative images could not be loaded.");
      }
    } catch (error) {
      console.error("Prepare email attachments error:", error);

      toast.error("Unable to prepare email attachments.");
    } finally {
      setLoadingAttachments(false);
    }
  };

  // =========================================================
  // OPEN EMAIL MODAL
  // =========================================================

  const handleEmail = async () => {
    if (!imageBlob) {
      toast.error("Image is still generating.");

      return;
    }

    setEmailData({
      to: "developerjyotiadvertiser@gmail.com",

      subject: `Work Order - JC ${workItem?.woi_jc_number || ""}`,

      message: "Please find the work order and creative images attached.",
    });

    setEmailModal(true);

    await prepareEmailAttachments();
  };

  // =========================================================
  // HANDLE EMAIL FIELD CHANGE
  // =========================================================

  const handleEmailChange = (field, value) => {
    setEmailData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =========================================================
  // SEND EMAIL
  // =========================================================

  const handleSendEmail = async () => {
    if (!imageBlob) {
      toast.error("Work order image is not ready.");

      return;
    }

    const recipientEmail = emailData.to.trim();

    if (!recipientEmail) {
      toast.error("Please enter recipient email.");

      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(recipientEmail)) {
      toast.error("Please enter a valid email address.");

      return;
    }

    if (loadingAttachments) {
      toast.error("Please wait while attachments are prepared.");

      return;
    }

    if (!emailAttachments.length) {
      toast.error("No attachments available.");

      return;
    }

    try {
      setSendingEmail(true);

      const formData = new FormData();

      // ===================================================
      // RECIPIENT
      // ===================================================

      formData.append("to", recipientEmail);

      // ===================================================
      // SUBJECT
      // ===================================================

      formData.append(
        "subject",
        emailData.subject.trim() ||
          `Work Order - JC ${workItem?.woi_jc_number || ""}`,
      );

      // ===================================================
      // MESSAGE
      // ===================================================

      formData.append(
        "message",
        emailData.message.trim() ||
          "Please find the work order and creative images attached.",
      );

      // ===================================================
      // WORK ORDER IMAGE
      // ===================================================

      const workOrderAttachment = emailAttachments.find(
        (item) => item.type === "work-order",
      );

      if (workOrderAttachment) {
        formData.append(
          "workOrderImage",
          workOrderAttachment.blob,
          workOrderAttachment.name,
        );
      }

      // ===================================================
      // CREATIVE IMAGES
      // ===================================================

      const creativeAttachments = emailAttachments.filter(
        (item) => item.type === "creative",
      );

      creativeAttachments.forEach((attachment) => {
        formData.append("creativeImages", attachment.blob, attachment.name);
      });

      // ===================================================
      // API REQUEST
      // ===================================================

      const { data } = await axios.post(
        `${apiUrl}/api/work-items/send-work-order-email`,
        formData,
      );

      // ===================================================
      // SUCCESS
      // ===================================================

      if (data?.success) {
        toast.success("Work order email sent successfully.");

        setEmailModal(false);

        // Revoke preview URLs
        emailAttachments.forEach((attachment) => {
          if (attachment.previewUrl) {
            URL.revokeObjectURL(attachment.previewUrl);
          }
        });

        setEmailAttachments([]);

        setEmailData({
          to: "developerjyotiadvertiser@gmail.com",
          subject: "",
          message: "",
        });
      } else {
        toast.error(data?.message || "Failed to send work order email.");
      }
    } catch (error) {
      console.error("Send work order email error:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to send work order email.",
      );
    } finally {
      setSendingEmail(false);
    }
  };

  // =========================================================
  // CLOSE EMAIL MODAL
  // =========================================================

  const handleCloseEmailModal = () => {
    if (sendingEmail) {
      return;
    }

    emailAttachments.forEach((attachment) => {
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    });

    setEmailAttachments([]);

    setEmailModal(false);
  };

  // =========================================================
  // MAIN MODAL
  // =========================================================

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* =====================================================
          MAIN SHARE MODAL
      ====================================================== */}

      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
        <div className="flex max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* =================================================
              HEADER
          ================================================== */}

          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Share Work Order
              </h2>

              <p className="text-sm text-gray-500">
                JC No. {workItem?.woi_jc_number || "-"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={sendingEmail}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiX size={22} />
            </button>
          </div>

          {/* =================================================
              PREVIEW
          ================================================== */}

          <div className="flex-1 overflow-auto bg-gray-100 p-5">
            {generating ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />

                  <p className="text-sm text-gray-600">
                    Preparing work order image...
                  </p>
                </div>
              </div>
            ) : imageUrl ? (
              <div className="flex justify-center">
                <div className="rounded-lg bg-white p-3 shadow">
                  <img src={imageUrl} alt="Work Order" className="max-w-full" />
                </div>
              </div>
            ) : (
              <div className="flex min-h-[300px] items-center justify-center">
                <p className="text-sm text-gray-500">
                  Unable to generate preview.
                </p>
              </div>
            )}
          </div>

          {/* =================================================
              ACTIONS
          ================================================== */}

          <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 px-5 py-4">
            {/* DOWNLOAD */}

            <button
              type="button"
              onClick={handleDownload}
              disabled={!imageUrl || generating}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiDownload size={17} />
              Download
            </button>

            {/* SEND EMAIL */}

            {/* <button
              type="button"
              onClick={handleEmail}
              disabled={
                !imageBlob || generating || sendingEmail || loadingAttachments
              }
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiMail size={17} />

              {loadingAttachments ? "Preparing..." : "Send Email"}
            </button> */}

            {/* SHARE */}

            <button
              type="button"
              onClick={handleShare}
              disabled={!imageBlob || generating || sharing}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiShare2 size={17} />

              {sharing ? "Sharing..." : "Share"}
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          EMAIL MODAL
      ====================================================== */}

      {emailModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4">
          <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* =================================================
                EMAIL HEADER
            ================================================== */}

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Send Work Order
                </h3>

                <p className="text-sm text-gray-500">
                  JC No. {workItem?.woi_jc_number || "-"}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseEmailModal}
                disabled={sendingEmail}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiX size={21} />
              </button>
            </div>

            {/* =================================================
                EMAIL BODY
            ================================================== */}

            <div className="flex-1 overflow-y-auto space-y-4 p-5">
              {/* =================================================
                  TO
              ================================================== */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  To <span className="text-red-500">*</span>
                </label>

                <input
                  type="email"
                  value={emailData.to}
                  onChange={(e) => handleEmailChange("to", e.target.value)}
                  placeholder="customer@example.com"
                  disabled={sendingEmail}
                  autoFocus
                  readOnly
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              {/* =================================================
                  SUBJECT
              ================================================== */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Subject
                </label>

                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => handleEmailChange("subject", e.target.value)}
                  disabled={sendingEmail}
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              {/* =================================================
                  MESSAGE
              ================================================== */}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Message
                </label>

                <textarea
                  rows={4}
                  value={emailData.message}
                  onChange={(e) => handleEmailChange("message", e.target.value)}
                  disabled={sendingEmail}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              {/* =================================================
                  ATTACHMENTS
              ================================================== */}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Attachments
                  </label>

                  {loadingAttachments && (
                    <span className="text-xs text-gray-500">
                      Loading images...
                    </span>
                  )}
                </div>

                {loadingAttachments ? (
                  <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-8">
                    <div className="text-center">
                      <div className="mx-auto mb-2 h-7 w-7 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />

                      <p className="text-xs text-gray-500">
                        Preparing attachments...
                      </p>
                    </div>
                  </div>
                ) : emailAttachments.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {emailAttachments.map((attachment, index) => (
                      <div
                        key={`${attachment.name}-${index}`}
                        className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                      >
                        {/* IMAGE */}

                        <div className="flex h-32 items-center justify-center bg-white">
                          <img
                            src={attachment.previewUrl}
                            alt={attachment.name}
                            className="h-full w-full object-contain"
                          />
                        </div>

                        {/* FILE INFO */}

                        <div className="border-t border-gray-200 p-2">
                          <p
                            className="truncate text-xs font-medium text-gray-700"
                            title={attachment.name}
                          >
                            {attachment.name}
                          </p>

                          <p className="mt-0.5 text-[11px] text-gray-500">
                            {attachment.type === "work-order"
                              ? "Work Order"
                              : "Creative Image"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                    <FiImage size={24} className="mx-auto mb-2 text-gray-400" />

                    <p className="text-xs text-gray-500">
                      No attachments found.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* =================================================
                EMAIL FOOTER
            ================================================== */}

            <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={handleCloseEmailModal}
                disabled={sendingEmail}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendEmail}
                disabled={
                  sendingEmail ||
                  loadingAttachments ||
                  !imageBlob ||
                  !emailData.to.trim() ||
                  !emailAttachments.length
                }
                className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiMail size={17} />

                {sendingEmail
                  ? "Sending..."
                  : loadingAttachments
                    ? "Preparing..."
                    : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          HIDDEN IMAGE GENERATION TABLE
      ====================================================== */}

      <div
        id="work-order-share-content"
        style={{
          position: "fixed",
          left: "-100000px",
          top: 0,
          width: "1200px",
          background: "#ffffff",
          padding: "10px",
          fontFamily: "Arial, sans-serif",
          color: "#000000",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontSize: "15px",
          }}
        >
          <thead>
            <tr>
              <th rowSpan="2" style={headerStyle}>
                S.No.
              </th>

              <th rowSpan="2" style={headerStyle}>
                JC No.
              </th>

              <th rowSpan="2" style={headerStyle}>
                Date of Work Allot
              </th>

              <th rowSpan="2" style={headerStyle}>
                Printer Name
              </th>

              <th rowSpan="2" style={headerStyle}>
                Media
              </th>

              <th colSpan="2" style={headerStyle}>
                Size
              </th>

              <th rowSpan="2" style={headerStyle}>
                Qty
              </th>

              <th rowSpan="2" style={headerStyle}>
                Area
              </th>

              <th rowSpan="2" style={headerStyle}>
                Creative
              </th>
            </tr>

            <tr>
              <th style={headerStyle}>Width</th>

              <th style={headerStyle}>Height</th>
            </tr>
          </thead>

          <tbody>
            {mediaItems.length > 0 ? (
              mediaItems.map((media, index) => {
                const firstRow = index === 0;

                return (
                  <tr key={media?.woim_id || index}>
                    {/* =====================================
                          PARENT DATA
                      ====================================== */}

                    {firstRow && (
                      <>
                        <td rowSpan={mediaItems.length} style={bodyStyleCenter}>
                          1
                        </td>

                        <td rowSpan={mediaItems.length} style={bodyStyleCenter}>
                          {workItem?.woi_jc_number || "-"}
                        </td>

                        <td rowSpan={mediaItems.length} style={bodyStyleCenter}>
                          {formatDate(workItem?.woi_work_allot_date)}
                        </td>

                        <td rowSpan={mediaItems.length} style={bodyStyleCenter}>
                          {workItem?.woi_printer_name || "-"}
                        </td>
                      </>
                    )}

                    {/* =====================================
                          MEDIA
                      ====================================== */}

                    <td style={bodyStyleCenter}>{media?.woim_media || "-"}</td>

                    {/* =====================================
                          WIDTH
                      ====================================== */}

                    <td style={bodyStyleCenter}>
                      {media?.woim_size_width || "-"}

                      {media?.woim_unit || ""}
                    </td>

                    {/* =====================================
                          HEIGHT
                      ====================================== */}

                    <td style={bodyStyleCenter}>
                      {media?.woim_size_height || "-"}

                      {media?.woim_unit || ""}
                    </td>

                    {/* =====================================
                          QUANTITY
                      ====================================== */}

                    <td style={bodyStyleCenter}>{media?.woim_quantity || 0}</td>

                    {/* =====================================
                          AREA
                      ====================================== */}

                    <td style={bodyStyleCenter}>
                      {media?.woim_area ? media.woim_area : ""}
                    </td>

                    {/* =====================================
                          CREATIVE
                      ====================================== */}

                    {firstRow && (
                      <td rowSpan={mediaItems.length} style={bodyStyleCenter}>
                        {media?.woim_creative || "-"}
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="10" style={bodyStyleCenter}>
                  No media added
                </td>
              </tr>
            )}

            {/* =============================================
                TOTAL
            ============================================== */}

            <tr>
              <td
                colSpan="7"
                style={{
                  ...bodyStyle,

                  textAlign: "right",

                  fontWeight: "bold",

                  fontSize: "18px",
                }}
              >
                Total
              </td>

              <td
                style={{
                  ...bodyStyleCenter,

                  fontWeight: "bold",
                }}
              >
                {totalQuantity}
              </td>

              <td
                style={{
                  ...bodyStyleCenter,

                  fontWeight: "bold",
                }}
              >
                {totalArea || ""}
              </td>

              <td style={bodyStyleCenter}></td>
            </tr>
          </tbody>
        </table>
        {/* =====================================================
    CREATIVE IMAGES
====================================================== */}

        {mediaItems.some((media) => media?.woim_creative_image) && (
          <div
            style={{
              marginTop: "20px",
              width: "100%",
              background: "#ffffff",
              padding: "10px 0 0 0",
            }}
          >
            {/* TITLE */}

            <div
              style={{
                textAlign: "center",
                fontSize: "18px",
                fontWeight: "700",
                marginBottom: "15px",
                color: "#000000",
              }}
            >
              Creative Images
            </div>

            {/* IMAGE GRID */}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "flex-start",
                gap: "15px",
              }}
            >
              {mediaItems.map((media, index) => {
                const creativeImageUrl = getCreativeImageUrl(media);

                if (!creativeImageUrl) {
                  return null;
                }

                return (
                  <div
                    key={`creative-image-${media?.woim_id || index}`}
                    style={{
                      width: "280px",
                      minHeight: "190px",
                      border: "1px solid #cccccc",
                      background: "#ffffff",
                      padding: "8px",
                      boxSizing: "border-box",
                    }}
                  >
                    <img
                      src={creativeImageUrl}
                      alt={media?.woim_creative || `Creative ${index + 1}`}
                      crossOrigin="anonymous"
                      style={{
                        width: "100%",
                        height: "170px",
                        objectFit: "contain",
                        display: "block",
                        background: "#ffffff",
                      }}
                    />

                    {/* CREATIVE NAME */}

                    {media?.woim_creative && (
                      <div
                        style={{
                          marginTop: "6px",
                          textAlign: "center",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#000000",
                        }}
                      >
                        {media.woim_creative}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// =========================================================
// TABLE STYLES
// =========================================================

const headerStyle = {
  border: "1px solid #000000",

  backgroundColor: "#8BCF45",

  padding: "8px 6px",

  textAlign: "center",

  fontWeight: "700",

  verticalAlign: "middle",
};

const bodyStyle = {
  border: "1px solid #000000",

  padding: "7px 6px",

  verticalAlign: "middle",
};

const bodyStyleCenter = {
  ...bodyStyle,

  textAlign: "center",

  fontWeight: "600",
};

export default WorkOrderShareModal;
