const express = require('express');
const path = require('path');
const router = express.Router();

// Static Routes
// Set up "public" folder / subfolders for static files
const publicPath = path.join(__dirname, "..", "public");
router.use(express.static(publicPath));
router.use("/css", express.static(path.join(publicPath, "css")));
router.use("/js", express.static(path.join(publicPath, "js")));
router.use("/images", express.static(path.join(publicPath, "images")));

module.exports = router;



