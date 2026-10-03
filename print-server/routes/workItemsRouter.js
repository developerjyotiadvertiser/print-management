const express = require("express");
const router = express.Router();
const workItemsController = require("../controller/workItemsController");
const {
  uploadWorkItem,
  processWorkItemImage,
} = require("../middleware/uploadWorkItems");
const {
  sendWorkOrderEmailController,
} = require("../controller/workOrderEmailController");

router.post(
  "/save-work-items",
  uploadWorkItem.array("woi_creative_images", 20),
  processWorkItemImage,
  workItemsController.saveWorkItemsController,
);

router.get(
  "/get-all-work-items",
  workItemsController.getAllWorkItemsController,
);

router.put(
  "/update-work-items/:woi_id",
  uploadWorkItem.array("woi_creative_images", 20),
  processWorkItemImage,
  workItemsController.updateWorkItemsController,
);

router.delete(
  "/delete-work-items/:woi_id",
  workItemsController.deleteWorkItemsController,
);

router.post(
  "/send-work-order-email",
  uploadWorkItem.fields([
    {
      name: "workOrderImage",
      maxCount: 1,
    },
    {
      name: "creativeImages",
      maxCount: 20,
    },
  ]),
  sendWorkOrderEmailController,
);

module.exports = router;
