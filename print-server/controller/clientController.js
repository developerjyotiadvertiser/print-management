const clientService = require("../services/clientService");

const saveClientController = async (req, res) => {
  try {
    const {
      client_name,
      client_contact,
      client_address,
      pan_number,
      gst_number,
      pincode,
    } = req.body;

    await clientService.saveClientService({
      client_name,
      client_contact,
      client_address,
      pan_number,
      gst_number,
      pincode,
    });

    res.status(201).json({
      success: true,
      message: "Client Record Saved Successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllClientController = async (req, res) => {
  try {
    const employees = await clientService.getAllClientService();
    res.status(201).json({
      success: true,
      message: "Fetched client details successfully.",
      data: employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateClientController = async (req, res) => {
  try {
    const { client_id } = req.params;
    const result = await clientService.updateClientService(client_id, req.body);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Client record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Client record updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteClientController = async (req, res) => {
  try {
    const { client_id } = req.params;
    const result = await clientService.deleteClientService(client_id, req.body);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Client not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Client deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const fetchGSTDetailsController = async (req, res) => {
  try {
    const { gst_number } = req.body;

    // 1. Check GST number
    if (!gst_number) {
      return res.status(400).json({
        success: false,
        message: "GST number is required",
      });
    }

    const gstNumber = gst_number.trim().toUpperCase();

    // 2. Validate GST number format
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

    if (!gstRegex.test(gstNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid GST number",
      });
    }

    // 3. Call GST service
    const gstDetails = await clientService.fetchGSTDetailsService(gstNumber);

    // 4. Verify GSTIN returned by APISetu
    if (
      !gstDetails?.gstIdentificationNumber ||
      gstDetails.gstIdentificationNumber.toUpperCase() !== gstNumber
    ) {
      return res.status(404).json({
        success: false,
        message: "GST details not found",
      });
    }

    // 5. Return GST details
    return res.status(200).json({
      success: true,
      message: "GST details fetched successfully",
      data: gstDetails,
    });
  } catch (error) {
    console.error(
      "Fetch GST Controller Error:",
      error.response?.data || error.message,
    );

    const statusCode = error.response?.status;

    // APISetu authentication error
    if (statusCode === 401 || statusCode === 403) {
      return res.status(statusCode).json({
        success: false,
        message: "APISetu authentication failed",
      });
    }

    // GST number not found
    if (statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: "GST details not found",
      });
    }

    // API rate limit
    if (statusCode === 429) {
      return res.status(429).json({
        success: false,
        message: "GST API request limit exceeded. Please try again later.",
      });
    }

    // APISetu server error
    if (statusCode >= 500) {
      return res.status(502).json({
        success: false,
        message: "GST service is temporarily unavailable",
      });
    }

    // Request timeout
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        success: false,
        message: "GST API request timed out",
      });
    }

    // Missing API credentials
    if (error.message === "APISetu credentials are not configured") {
      return res.status(500).json({
        success: false,
        message: "APISetu credentials are not configured",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch GST details",
    });
  }
};

module.exports = {
  saveClientController,
  getAllClientController,
  updateClientController,
  deleteClientController,
  fetchGSTDetailsController,
};
