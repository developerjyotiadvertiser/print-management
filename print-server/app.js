const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const authRoutes = require("./routes/authRouter");
const printRoutes = require("./routes/printRouter");
const mediaRoutes = require("./routes/mediaRouter");
const clientRoutes = require("./routes/clientRouter");
const challanRoutes = require("./routes/challanRouter");
const mediaMasterRoutes = require("./routes/mediaMasterRouter");

const pool = require("./config/db");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Running...");
});

// Test Database Connection
app.get("/db-test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS currentTime");
    res.json({
      success: true,
      message: "Database Connected Successfully",
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/print", printRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/challan", challanRoutes);
app.use("/api/media-master", mediaMasterRoutes);

// const frontendPath = path.join(__dirname, "dist");
// app.use(express.static(frontendPath));

// app.use((req, res) => {
//     if (req.originalUrl.startsWith("/api")) {
//         return res.status(404).json({
//             success: false,
//             message: "API route not found",
//         });
//     }

//     res.sendFile(path.join(frontendPath, "index.html"));
// });

const port = process.env.PORT || 3500;

app.listen(port, () => {
  console.log(`server  running on ${port}`);
});
