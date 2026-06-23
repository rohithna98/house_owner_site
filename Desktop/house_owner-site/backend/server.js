const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const contractorRoutes = require("./routes/contractorRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/contractors", contractorRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "House Building Tracker API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});