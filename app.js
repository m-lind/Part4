const config = require("./utils/config");
const express = require("express");
require("express-async-errors");
const app = express();
const blogsRouter = require("./controllers/blogs");
const usersRouter = require("./controllers/users");
const loginRouter = require("./controllers/login");
const mongoose = require("mongoose");
const middleware = require("./utils/middleware");

mongoose.connect(config.MONGODB_URI);

app.use(express.json());
app.use("/api/blogs", blogsRouter);
app.use("/api/users", usersRouter);
app.use("/api/login", loginRouter);
app.use(middleware.errorHandler);

module.exports = app;
