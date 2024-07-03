

const mongoose = require("mongoose");

const x = mongoose.connect("mongodb://127.0.0.1:27017/myBlogs");

module.exports = { x }; 