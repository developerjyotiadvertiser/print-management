const { sendEmail } = require("../utils/emailUtils");

const sendWorkOrderEmailService = async ({
  to,
  subject,
  message,
  workOrderImage,
  creativeImages = [],
}) => {
  try {
    if (!to) {
      return {
        success: false,
        message: "Recipient email is required.",
      };
    }

    if (!workOrderImage) {
      return {
        success: false,
        message: "Work order image is required.",
      };
    }

    // =====================================================
    // ATTACHMENTS
    // =====================================================

    const attachments = [];

    // -----------------------------------------------------
    // WORK ORDER IMAGE
    // -----------------------------------------------------

    attachments.push({
      filename: workOrderImage.originalname || "work-order.png",

      content: workOrderImage.buffer,

      contentType: workOrderImage.mimetype || "image/png",
    });

    // -----------------------------------------------------
    // CREATIVE IMAGES
    // -----------------------------------------------------

    creativeImages.forEach((file, index) => {
      attachments.push({
        filename: file.originalname || `creative-${index + 1}.jpg`,

        content: file.buffer,

        contentType: file.mimetype || "image/jpeg",
      });
    });

    // =====================================================
    // SEND EMAIL
    // =====================================================

    const result = await sendEmail({
      to,

      subject: subject || "Work Order",

      text:
        message || "Please find the work order and creative images attached.",

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          "
        >
          <p>
            ${
              message ||
              "Please find the work order and creative images attached."
            }
          </p>

          <p>
            Regards,<br />
            <strong>Jyoti Advertisers</strong>
          </p>
        </div>
      `,

      attachments,
    });

    return result;
  } catch (error) {
    console.error("Work Order Email Service Error:", error);

    return {
      success: false,
      message: error.message,
    };
  }
};

module.exports = {
  sendWorkOrderEmailService,
};
