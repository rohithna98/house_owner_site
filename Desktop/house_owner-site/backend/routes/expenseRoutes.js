const express = require("express");

const {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense
} = require("../controllers/expenseController");

const {
    protect,
    allowRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getExpenses);

router.post(
    "/",
    protect,
    allowRoles("owner", "staff"),
    createExpense
);

router.put(
    "/:id",
    protect,
    allowRoles("owner", "staff"),
    updateExpense
);

router.delete(
    "/:id",
    protect,
    allowRoles("owner"),
    deleteExpense
);

module.exports = router;