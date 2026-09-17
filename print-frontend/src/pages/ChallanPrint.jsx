import { FaPrint } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import ReactDOMServer from "react-dom/server";

const ChallanPrint = ({ isOpen, onClose, challan }) => {
  if (!isOpen) return null;

  console.log("8 print page", challan);

  const challanData = {
    challanNo: challan?.ch_id || challan?.ch_no || "",
    date: challan?.ch_date || challan?.ch_created_at || "",
    client:
      challan?.client_name ||
      challan?.party_name ||
      challan?.client_company ||
      "",
    address: challan?.client_address || "",
    contact: challan?.client_contact || challan?.contact || "",
    phone: challan?.ch_phone || challan?.client_phone || "",
    panNo: challan?.pan_number || challan?.pan_no || "",
    gstNo: challan?.gst_number || challan?.gst_no || "",
    deliveredTo: challan?.ch_delivered_to || "",
    deliveryPhone: challan?.ch_phone || "",
    remark: challan?.ch_remark || "",
    preparedBy: challan?.ch_pr_name || "",
    preparedByPhone: challan?.ch_pr_phone || "",
    items: Array.isArray(challan?.prints) ? challan.prints : [],
  };

  // DATE FORMAT
  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return date;
    }
    return d.toLocaleDateString("en-GB");
  };

  // PRINT WINDOW
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=1000,height=800");
    if (!printWindow) {
      alert("Please allow popups to print the challan.");
      return;
    }

    const printContent = ReactDOMServer.renderToStaticMarkup(
      <div className="w-full font-sans text-[8px] leading-tight text-black">
        <ChallanCopy copyName="Original Copy" />
        <div className="my-2 flex h-5 items-center justify-center border-y border-dashed border-gray-500 text-[7px] text-gray-500">
          <span className="bg-white px-3">✂ CUT HERE</span>
        </div>
        <ChallanCopy copyName="Client Copy" />
      </div>,
    );

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>
            Delivery Challan - ${challanData.challanNo}
          </title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            body {
              width: 210mm;
              min-height: 297mm;
              padding: 7mm;
              font-family: Arial, sans-serif;
            }
            #print-area {
              width: 100%;
            }
            @media print {
              body {
                width: 210mm;
                min-height: 297mm;
                padding: 7mm;
              }
            }
          </style>
        </head>
        <body>
          <div id="print-area">
            ${printContent}
          </div>
          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 500);
            };
            window.onafterprint = function () {
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // CHALLAN COPY
  const ChallanCopy = ({ copyName }) => (
    <div className="w-full font-sans text-[8px] leading-tight text-black">
      {/* HEADER */}
      <div className="grid grid-cols-[1.25fr_0.8fr_1fr] border border-gray-500">
        <div className="border-gray-500 p-1.5">
          <h2 className="font-custom text-3xl font-bold leading-none">
            JYOTI ADVERTISERS
          </h2>
          <p className="mt-1 text-[12px] leading-3.75">
            Sukheja Tower, Wright Town, Jabalpur, 482001 (M. P.),
            <br />
            <span className="font-semibold">Mob:</span> 9111100590,{" "}
            <span className="font-semibold">Website:</span>{" "}
            www.jyotiadvertiser.com
          </p>
        </div>

        {/* Copy */}
        <div className="flex flex-col items-center border-gray-500 p-1.5 text-center">
          <p className="text-[12px] font-semibold">{copyName}</p>
          {/* <p className="mt-2 text-[8px]">
            IC No (for office use) :{" "}
            <span className="font-semibold">{challanData.challanNo}</span>
          </p> */}
        </div>

        {/* Delivery Challan */}
        <div className="p-1.5 text-right">
          <h2 className="text-[20px] font-bold tracking-[2px]">
            DELIVERY CHALLAN
          </h2>
          <p className="mt-1 text-[12px]">
            <span className="font-semibold">PAN NO. : </span>
            {/* {challanData.panNo || "-"} */}
            AHBPK3171A
          </p>
          <p className="text-[12px]">
            <span className="font-semibold">GST NO. : </span>
            {/* {challanData.gstNo || "-"} */}
            23AHBPK3171A1Z4
          </p>
        </div>
      </div>

      {/* CLIENT INFO */}
      <div className="grid grid-cols-[1.3fr_1fr_0.65fr] border-x border-b border-gray-500">
        <div className="border-r border-gray-500 px-1.5 py-1">
          <div className="flex min-h-4 items-center">
            <span className="w-14 shrink-0 text-[12px] font-bold">Client</span>
            <span className="w-3 shrink-0 text-[12px] font-bold">:</span>
            <span className="text-[12px]">
              {challanData?.client?.toUpperCase() || "-"}
            </span>
          </div>

          <div className="flex min-h-4">
            <span className="w-14 shrink-0 text-[12px] font-bold">Address</span>
            <span className="w-3 shrink-0 text-[12px] font-bold">:</span>
            <span className="text-[12px]">
              {challanData?.address?.toUpperCase() || "-"}
            </span>
          </div>
        </div>

        {/* Address / Phone */}
        <div className="border-r border-gray-500 px-1.5 py-1">
          {/* <div className="flex min-h-4 items-center">
            <span className="w-12.5 text-[12px] font-bold">Address</span>
            <span className="text-[12px]">
              : {challanData.address?.toUpperCase() || "-"}
            </span>
          </div> */}
          <div className="flex min-h-4 items-center">
            <span className="w-12.5 text-[12px] font-bold">Mobile</span>
            <span className="text-[12px]">
              : {challanData.contact || challanData.phone || "-"}
            </span>
          </div>
          <div className="flex min-h-4 items-center">
            <span className="w-12.5 text-[12px] font-bold">GSTIN</span>
            <span className="text-[12px]">
              : {challanData?.gstNo?.toUpperCase() || ""}
            </span>
          </div>
        </div>
        <div>
          <div className="flex h-5.5 items-center justify-start border-b border-gray-500 px-1.5">
            <span className="text-[12px] font-bold">Challan No </span>
            <span className="text-[12px] font-bold">
              : {challanData.challanNo}
            </span>
          </div>
          <div className="flex h-5.5 items-center justify-start px-1.5">
            <span className="text-[12px] font-bold">Dated </span>
            <span className="font-semibold text-[12px]">
              : {formatDate(challanData.date)}
            </span>
          </div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            <th className="w-[5%] border border-gray-500 px-1 py-2 text-center font-semibold text-[12px]">
              S. No.
            </th>
            <th className="w-[24%] border border-gray-500 px-1 py-2 text-center font-semibold text-[12px]">
              Media
            </th>
            <th className="w-[18%] border border-gray-500 px-1 py-2 text-center font-semibold text-[12px]">
              Creative
            </th>
            <th className="w-[21%] border border-gray-500 px-1 py-2 text-center font-semibold text-[12px]">
              Location/Remark
            </th>
            <th className="w-[12%] border border-gray-500 px-1 py-2 text-center font-semibold text-[12px]">
              Size(W*H)
            </th>
            <th className="w-[7%] border border-gray-500 px-1 py-2 text-center font-semibold text-[12px]">
              Qty
            </th>
            <th className="w-[11%] border border-gray-500 px-1 py-2 text-center font-semibold text-[12px]">
              Area(Sq.ft)
            </th>
          </tr>
        </thead>
        <tbody>
          {challanData.items.map((item, index) => {
            const width = item?.pci_width ?? "";
            const height = item?.pci_height ?? "";
            const size =
              width !== "" || height !== ""
                ? `${width}${item?.pci_size_unit === "inch" ? '"' : "'"} x ${height}${item?.pci_size_unit === "inch" ? '"' : "'"}`
                : "";
            return (
              <tr key={item?.pci_id || index}>
                <td className="h-5 border border-gray-500 px-1 py-1 text-center text-[12px]">
                  {index + 1}
                </td>
                <td className="h-5 border border-gray-500 px-1 py-1 text-[12px]">
                  {item?.pci_description?.toUpperCase() || "-"}
                </td>
                <td className="h-5 border border-gray-500 px-1 py-1 text-[12px]">
                  {item?.pci_creative?.toUpperCase() || "-"}
                </td>
                <td className="h-5 border border-gray-500 px-1 py-1 text-[12px]">
                  {item?.pci_location?.toUpperCase() || "-"}
                </td>
                <td className="h-5 border border-gray-500 px-1 py-1 text-center text-[12px]">
                  {size}
                </td>
                <td className="h-5 border border-gray-500 px-1 py-1 text-center text-[12px]">
                  {item?.pci_quantity || 0}
                </td>
                <td className="h-5 border border-gray-500 px-1 py-1 text-center text-[12px]">
                  {item?.pci_area ? `${item.pci_area} sq.ft` : ""}
                </td>
              </tr>
            );
          })}

          {/* EMPTY ROWS */}
          {Array.from({
            length: Math.max(0, 7 - challanData.items.length),
          }).map((_, index) => (
            <tr key={`empty-${index}`}>
              <td className="h-5 border border-gray-500 py-1">&nbsp;</td>
              <td className="border border-gray-500 py-1">&nbsp;</td>
              <td className="border border-gray-500 py-1">&nbsp;</td>
              <td className="border border-gray-500 py-1">&nbsp;</td>
              <td className="border border-gray-500 py-1">&nbsp;</td>
              <td className="border border-gray-500 py-1">&nbsp;</td>
              <td className="border border-gray-500 py-1">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* DELIVERED TO */}
      <div className="border border-gray-500 px-1.5 py-2">
        <div className="flex min-h-5.5 items-center gap-2 text-[12px]">
          <span>Job Delivered to :</span>
          <span className="ml-1 font-semibold">
            {challanData.deliveredTo?.toUpperCase() || "-"}
          </span>
        </div>
        {/* <div className="flex min-h-5.5 items-center gap-2 text-[12px]">
          <span>Phone :</span>
          <span className="ml-2 font-semibold">
            {challanData.deliveryPhone || "-"}
          </span>
        </div> */}
      </div>

      {/* FOOTER */}
      <div className="grid grid-cols-[1fr_140px] border-x border-b border-gray-500 px-1.5 py-2">
        <div className="pr-5">
          <p className="mt-1 text-[12px] leading-3.5">
            Goods receive in proper condition. (return the duplicate copy duly
            signed with stamp)
            <br />
            If any problem inform immediately, otherwise no complaint will be
            entertained.
          </p>
          <div className="mt-12 grid grid-cols-[1.2fr_0.8fr_0.4fr] gap-4">
            <div>
              <span className="text-[12px]">Receiver's Signature</span>
              {/* <div className="mt-4 border-b border-dotted border-gray-500" /> */}
            </div>
            <div>
              <span className="text-[12px]">Mobile</span>
              {/* <div className="mt-4 border-b border-dotted border-gray-500" /> */}
            </div>
            <div className="flex items-end justify-center text-[12px]">
              E. &amp; O. E.
            </div>
          </div>
        </div>

        {/* Prepared By */}
        <div className="flex flex-col justify-end text-left mt-4">
          <span className="text-[12px]">Prepared By</span>
          <strong className="">
            {challanData?.preparedBy?.toUpperCase() || "-"}
          </strong>
          <strong>{challanData.preparedByPhone || ""}</strong>
        </div>
      </div>
    </div>
  );

  // MODAL
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 print:hidden">
      <div className="flex h-[95vh] w-full max-w-250 flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Challan Preview
            </h2>
            <p className="text-xs text-gray-500">
              Challan No: {challanData.challanNo}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <FaPrint size={14} />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <IoClose size={23} />
            </button>
          </div>
        </div>

        {/* PREVIEW */}
        <div className="flex-1 overflow-auto bg-gray-100 p-5">
          <div
            id="challan-print-area"
            className="mx-auto min-h-[297mm] w-[210mm] bg-white p-[7mm] shadow-md"
          >
            <ChallanCopy copyName="Original Copy" />
            <div className="my-2 flex h-5 items-center justify-center border-y border-dashed border-gray-500 text-[7px] text-gray-500">
              <span className="bg-white px-3">✂ CUT HERE</span>
            </div>
            <ChallanCopy copyName="Client Copy" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallanPrint;
