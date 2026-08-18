const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", require("./routes/auth"));
app.use("/api/params", require("./routes/params"));
app.use("/api/conditions", require("./routes/conditions"));
app.use("/api/environments", require("./routes/environments"));
app.use("/api/apps", require("./routes/apps"));
app.use("/api/experiments", require("./routes/experiments"));
app.use("/api/history", require("./routes/history"));
app.use("/api/audit-log", require("./routes/auditLog"));
app.use("/api/users", require("./routes/users"));
app.use("/config", require("./routes/config"));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));