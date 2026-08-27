const express = require("express");
const router = express.Router();
const mediaController = require("../controller/mediaController");

router.post("/save-media", mediaController.saveMediaController);
router.get("/get-all-media", mediaController.getAllMediaController);
router.put("/update-media/:mt_id", mediaController.updateMediaController);
router.delete("/delete-media/:mt_id", mediaController.deleteMediaController);

module.exports = router;
