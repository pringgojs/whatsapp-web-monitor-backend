const express = require("express");
const cors = require("cors");
const sessionRoutes = require("./routes/sessionRoutes");
const authRoutes = require("./routes/authRoutes");
const apiClientRoutes = require("./routes/apiClientRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/sessions", sessionRoutes);

app.use("/auth", authRoutes);

app.use("/clients", apiClientRoutes);

app.use("/messages", messageRoutes);

module.exports = app;
