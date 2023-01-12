const config = require("./utils/config");
const express = require("express");
const app = express();
const blogsRouter = require("./controllers/blogs");
const logger = require("./utils/logger");
const mongoose = require("mongoose");

mongoose.connect(config.MONGODB_URI);

app.use(express.json());
app.use("/api/blogs", blogsRouter);

module.exports = app;
