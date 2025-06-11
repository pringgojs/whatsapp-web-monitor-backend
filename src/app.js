const express = require("express");
const cors = require("cors");
const sessionRoutes = require("./routes/sessionRoutes");
const authRoutes = require("./routes/authRoutes");
const apiClientRoutes = require("./routes/apiClientRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const externalApiRoutes = require("./routes/externalApiRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/sessions", sessionRoutes);

app.use("/auth", authRoutes);

app.use("/clients", apiClientRoutes);

app.use("/messages", messageRoutes);

app.use("/users", userRoutes);

app.use("/api", externalApiRoutes);

module.exports = app;
