import { useEffect, useRef, useState } from "react";
import { FiX, FiDownload, FiFileText, FiImage } from "react-icons/fi";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const PreviewFinalWorkOrderModel = ({ isOpen, onClose, workOrder }) => {
  const previewRef = useRef(null);
  const [downloading, setDownloading] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleEscape);

    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !workOrder) return null;

  const formatAmount = (amount) =>
    (Number(amount) || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return date;

    return parsedDate.toLocaleDateString("en-IN");
  };

  const printer =
    workOrder.printer_name ||
    workOrder.pm_name ||
    workOrder.pm_printer_name ||
    workOrder.printer?.printer_name ||
    workOrder.pm_company_name ||
    "-";

  const orderNumber = workOrder.fwo_number || workOrder.fwo_id || "-";

  const subtotal = Number(workOrder.fwo_subtotal) || 0;
  const adjustment = Number(workOrder.fwo_adjustment_amount) || 0;

  const grandTotal =
    workOrder.fwo_grand_total != null
      ? Number(workOrder.fwo_grand_total)
      : Math.max(0, subtotal + adjustment);

  const paidAmount = Number(workOrder.fwo_paid_amount) || 0;

  const balanceAmount =
    workOrder.fwo_balance_amount != null
      ? Number(workOrder.fwo_balance_amount)
      : grandTotal - paidAmount;

  const workItems =
    workOrder.work_items || workOrder.woi_items || workOrder.items || [];

  const getMediaItems = (item) =>
    item.media_items || item.work_order_media || item.printer_media || [];

  const getImageUrl = (path) => {
    if (!path) return "";

    if (/^(https?:\/\/|data:)/i.test(path)) {
      return path;
    }

    return `${apiUrl?.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  };

  const getArea = (item) => {
    const media = getMediaItems(item);

    if (media.length) {
      return media.reduce(
        (sum, m) => sum + (Number(m.woim_area ?? m.woi_area ?? m.area) || 0),
        0,
      );
    }

    return Number(item.woi_area ?? item.total_area ?? 0);
  };

  const getAmount = (item) => {
    const media = getMediaItems(item);

    if (media.length) {
      return media.reduce((sum, m) => {
        const area = Number(m.woim_area ?? m.woi_area ?? m.area) || 0;

        const rate = Number(m.pmm_price ?? m.price ?? m.rate) || 0;

        return sum + area * rate;
      }, 0);
    }

    if (item.amount != null) {
      return Number(item.amount) || 0;
    }

    return getArea(item) * (Number(item.pmm_price ?? item.rate) || 0);
  };

  const capturePreview = async () => {
    if (!previewRef.current) {
      throw new Error("Preview not available");
    }

    const images = Array.from(previewRef.current.querySelectorAll("img"));

    await Promise.all(
      images.map(async (img) => {
        if (!img.complete) {
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }

        if (img.decode) {
          try {
            await img.decode();
          } catch (error) {
            console.warn("Image decode failed:", img.src);
          }
        }
      }),
    );

    return await html2canvas(previewRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: true,
      imageTimeout: 20000,
      scrollX: 0,
      scrollY: 0,
    });
  };

  const downloadImage = async () => {
    try {
      setDownloading("image");

      const canvas = await capturePreview();
      const imageData = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.download = `Work-Order-${orderNumber}.png`;
      link.href = imageData;

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Image download error:", error);
      alert(`Unable to download image: ${error.message}`);
    } finally {
      setDownloading("");
    }
  };

  const downloadPDF = async () => {
    try {
      setDownloading("pdf");

      const canvas = await capturePreview();
      const imageData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const margin = 10;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const contentWidth = pageWidth - margin * 2;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      const usableHeight = pageHeight - margin * 2;

      let remainingHeight = contentHeight;
      let position = margin;

      pdf.addImage(
        imageData,
        "PNG",
        margin,
        position,
        contentWidth,
        contentHeight,
      );

      remainingHeight -= usableHeight;

      while (remainingHeight > 0) {
        pdf.addPage();
        position = margin - (contentHeight - remainingHeight);

        pdf.addImage(
          imageData,
          "PNG",
          margin,
          position,
          contentWidth,
          contentHeight,
        );

        remainingHeight -= usableHeight;
      }

      pdf.save(`Work-Order-${orderNumber}.pdf`);
    } catch (error) {
      console.error("PDF download error:", error);
      alert(`Unable to download PDF: ${error.message}`);
    } finally {
      setDownloading("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="flex max-h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Work Order Preview
            </h2>
            <p className="text-sm text-gray-500">
              Preview and download the work order.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4 sm:p-6">
          <div
            ref={previewRef}
            className="mx-auto w-full max-w-[794px] bg-white p-6 text-gray-800 sm:p-10"
            style={{
              fontFamily: "Arial, sans-serif",
              minHeight: "600px",
            }}
          >
            {/* Company Header */}
            <div className="border-b-2 border-gray-800 pb-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-custom text-2xl font-bold">
                    JYOTI ADVERTISERS
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">Final Work Order</p>
                </div>

                <div className="text-right text-sm">
                  <p className="font-semibold">Work Order: {orderNumber}</p>
                  <p className="mt-1">Date: {formatDate(workOrder.fwo_date)}</p>
                  <p className="mt-1">Status: {workOrder.fwo_status || "-"}</p>
                </div>
              </div>
            </div>

            {/* Printer Details */}
            <div className="my-6 rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                Printer Details
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Printer Name</p>
                  <p className="mt-1 font-semibold">{printer}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <p className="mt-1 font-semibold">
                    {workOrder.fwo_payment_status || "Unpaid"}
                  </p>
                </div>
              </div>
            </div>

            {/* Work Items */}
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">
              Work Order Items
            </h3>

            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-gray-100">
                  {/* <th className="border border-gray-300 p-2">#</th> */}
                  <th className="border border-gray-300 p-2">JC / Media</th>
                  <th className="border border-gray-300 p-2">Size</th>
                  <th className="border border-gray-300 p-2">Qty</th>
                  <th className="border border-gray-300 p-2">Area</th>
                  <th className="border border-gray-300 p-2 text-right">
                    Amount (₹)
                  </th>
                </tr>
              </thead>

              <tbody>
                {workItems.length > 0 ? (
                  workItems.map((item, index) => {
                    const mediaItems = getMediaItems(item);
                    const rows = mediaItems.length ? mediaItems : [item];

                    return rows.map((media, mediaIndex) => {
                      const area =
                        Number(
                          media.woim_area ??
                            media.woi_area ??
                            media.area ??
                            (rows.length === 1 ? getArea(item) : 0),
                        ) || 0;

                      const rate =
                        Number(media.pmm_price ?? media.price ?? media.rate) ||
                        0;

                      const amount =
                        rows.length > 1 ? area * rate : getAmount(item);

                      const imagePath =
                        media.woim_creative_image ||
                        media.creative_image ||
                        media.image_url;

                      return (
                        <tr key={`${item.woi_id ?? index}-${mediaIndex}`}>
                          {/* <td className="border border-gray-300 p-2">
                            {index + 1}
                          </td> */}

                          <td className="border border-gray-300 p-2">
                            <p className="font-semibold">
                              {item.woi_jc_number ||
                                item.jc_number ||
                                item.woi_id ||
                                "-"}
                            </p>

                            <p className="mt-1">
                              {media.pmm_media ||
                                media.mm_media ||
                                item.woi_media ||
                                item.woi_creative ||
                                "-hhh"}
                            </p>

                            {(media.woim_creative || media.creative) && (
                              <p className="mt-1 text-gray-500">
                                Creative:{" "}
                                {media.woim_creative || media.creative}
                              </p>
                            )}

                            {/* {imagePath && (
                              <img
                                crossOrigin="anonymous"
                                src={getImageUrl(imagePath)}
                                alt="Creative"
                                className="mt-2 h-12 w-16 rounded border object-cover"
                              />
                            )} */}
                          </td>

                          <td className="border border-gray-300 p-2">
                            {media.woim_size_width ??
                              media.woi_size_width ??
                              item.woi_size_width ??
                              "-"}{" "}
                            ×{" "}
                            {media.woim_size_height ??
                              media.woi_size_height ??
                              item.woi_size_height ??
                              "-"}{" "}
                            {media.woim_unit ||
                              media.woi_unit ||
                              item.woi_unit ||
                              "Feet"}
                          </td>

                          <td className="border border-gray-300 p-2">
                            {media.woim_quantity ??
                              media.woi_quantity ??
                              item.woi_quantity ??
                              "-"}
                          </td>

                          <td className="border border-gray-300 p-2">
                            {area.toFixed(2)} Sq.Ft
                          </td>

                          <td className="border border-gray-300 p-2 text-right">
                            {formatAmount(amount)}
                          </td>
                        </tr>
                      );
                    });
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="border border-gray-300 p-6 text-center text-gray-500"
                    >
                      No work item details found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Amount Summary */}
            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-xs space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{formatAmount(subtotal)}</span>
                </div>

                {/* <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Adjustment</span>
                  <span>₹{formatAmount(adjustment)}</span>
                </div> */}

                <div className="flex justify-between gap-4 border-t-2 border-gray-800 pt-3 text-base font-bold">
                  <span>Grand Total</span>
                  <span>₹{formatAmount(grandTotal)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Paid Amount</span>
                  <span>₹{formatAmount(paidAmount)}</span>
                </div>

                <div className="flex justify-between gap-4 font-bold text-red-600">
                  <span>Balance Amount</span>
                  <span>₹{formatAmount(balanceAmount)}</span>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {workOrder.fwo_remarks && (
              <div className="mt-8 border-t border-gray-300 pt-4">
                <h3 className="text-sm font-bold">Remarks</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                  {workOrder.fwo_remarks}
                </p>
              </div>
            )}

            {/* Signatures */}
            <div className="mt-16 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border-t border-gray-400 pt-2">
                Authorized Signature
              </div>
              <div className="border-t border-gray-400 pt-2">
                Printer Signature
              </div>
            </div>

            <p className="mt-8 text-center text-[10px] text-gray-400">
              Generated by Jyoti Advertisers
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap justify-end gap-3 border-t bg-white px-5 py-4">
          <button
            type="button"
            onClick={downloadImage}
            disabled={Boolean(downloading)}
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <FiImage />
            {downloading === "image" ? "Generating Image..." : "Download Image"}
          </button>

          <button
            type="button"
            onClick={downloadPDF}
            disabled={Boolean(downloading)}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            <FiFileText />
            <FiDownload />
            {downloading === "pdf" ? "Generating PDF..." : "Download PDF"}
          </button>

          {/* <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2.5 text-sm hover:bg-gray-50"
          >
            Close
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default PreviewFinalWorkOrderModel;
