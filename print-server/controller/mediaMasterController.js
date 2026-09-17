const mediaMasterService = require("../services/mediaMasterService");

const saveMediaMasterController = async (req, res) => {
  try {
    const { mm_media, mm_brand, mm_gsm, mm_size, mm_status } = req.body;
    await mediaMasterService.saveMediaMasterService({
      mm_media,
      mm_brand,
      mm_gsm,
      mm_size,
      mm_status,
    });

    res.status(201).json({
      success: true,
      message: "Media Master Record Saved Successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllMediaMasterController = async (req, res) => {
  try {
    const employees = await mediaMasterService.getAllMediaMasterService();
    res.status(201).json({
      success: true,
      message: "Fetched media master details successfully.",
      data: employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateMediaMasterController = async (req, res) => {
  try {
    const { mm_id } = req.params;
    const result = await mediaMasterService.updateMediaMasterService(
      mm_id,
      req.body,
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Media master record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Media master record updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteMediaMasterController = async (req, res) => {
  try {
    const { mm_id } = req.params;
    const result = await mediaMasterService.deleteMediaMasterService(
      mm_id,
      req.body,
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Media not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Media master record deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  saveMediaMasterController,
  getAllMediaMasterController,
  deleteMediaMasterController,
  updateMediaMasterController,
};
