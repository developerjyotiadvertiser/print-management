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

module.exports = {
  saveClientController,
  getAllClientController,
  updateClientController,
  deleteClientController,
};
