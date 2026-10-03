const {
  sendWorkOrderEmailService,
} = require("../services/workOrderEmailService");

const sendWorkOrderEmailController = async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    const workOrderImage = req.files?.workOrderImage?.[0];

    const creativeImages = req.files?.creativeImages || [];

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Recipient email is required.",
      });
    }

    if (!workOrderImage) {
      return res.status(400).json({
        success: false,
        message: "Work order image is required.",
      });
    }

    const result = await sendWorkOrderEmailService({
      to,
      subject,
      message,
      workOrderImage,
      creativeImages,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || result.error || "Failed to send email.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Work order email sent successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Work Order Email Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send work order email.",
    });
  }
};

module.exports = {
  sendWorkOrderEmailController,
};
