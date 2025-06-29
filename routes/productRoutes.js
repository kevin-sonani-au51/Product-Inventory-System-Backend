const express = require("express");
const router = express.Router();
const controller = require("../controllers/productController");

router.post("/", controller.create);
router.post("/list", controller.list);
router.delete("/:id", controller.delete);

module.exports = router;
