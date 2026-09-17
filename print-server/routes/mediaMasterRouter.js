const express = require("express");
const router = express.Router();
const mediaMasterController = require("../controller/mediaMasterController");

router.post(
  "/save-media-master",
  mediaMasterController.saveMediaMasterController,
);
router.get(
  "/get-all-media-master",
  mediaMasterController.getAllMediaMasterController,
);
router.put(
  "/update-media-master/:mm_id",
  mediaMasterController.updateMediaMasterController,
);
router.delete(
  "/delete-media-master/:mm_id",
  mediaMasterController.deleteMediaMasterController,
);

module.exports = router;
