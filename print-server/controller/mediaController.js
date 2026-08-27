const mediaService = require("../services/mediaService");

const saveMediaController = async (req, res) => {
  try {
    const { mt_name, mt_status } = req.body;

    await mediaService.saveMediaService({
      mt_name,
      mt_status,
    });

    res.status(201).json({
      success: true,
      message: "Media Record Saved Successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllMediaController = async (req, res) => {
  try {
    const employees = await mediaService.getAllMediaService();

    res.status(201).json({
      success: true,
      message: "Fetched Media details successfully.",
      data: employees,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateMediaController = async (req, res) => {
  try {
    const { mt_id } = req.params;

    const result = await mediaService.updateMediaService(mt_id, req.body);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Media record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Media record updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteMediaController = async (req, res) => {
  try {
    const { mt_id } = req.params;

    const result = await mediaService.deleteMediaService(mt_id, req.body);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Media not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Media deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  saveMediaController,
  getAllMediaController,
  updateMediaController,
  deleteMediaController,
};
