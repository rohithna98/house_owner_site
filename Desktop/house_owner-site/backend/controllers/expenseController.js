const db = require("../config/db");

const getExpenses = async (req, res) => {
    try {
        const [expenses] = await db.query(
            `SELECT 
                expenses.*,
                users.name AS created_by_name
             FROM expenses
             LEFT JOIN users ON expenses.created_by = users.id
             ORDER BY expenses.expense_date DESC, expenses.id DESC`
        );

        res.json({
            success: true,
            expenses
        });
    } catch (error) {
        console.error("Get expenses error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching expenses"
        });
    }
};

const createExpense = async (req, res) => {
    try {
        const {
            expense_date,
            category,
            material_name,
            quantity,
            unit,
            rate,
            amount,
            vendor,
            payment_status,
            notes
        } = req.body;

        if (!expense_date || !category || !amount) {
            return res.status(400).json({
                success: false,
                message: "Date, category and amount are required"
            });
        }

        const [result] = await db.query(
            `INSERT INTO expenses 
            (
                expense_date,
                category,
                material_name,
                quantity,
                unit,
                rate,
                amount,
                vendor,
                payment_status,
                notes,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                expense_date,
                category,
                material_name || null,
                Number(quantity || 0),
                unit || null,
                Number(rate || 0),
                Number(amount || 0),
                vendor || null,
                payment_status || "Pending",
                notes || null,
                req.user.id
            ]
        );

        res.status(201).json({
            success: true,
            message: "Expense added successfully",
            expenseId: result.insertId
        });
    } catch (error) {
        console.error("Create expense error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while adding expense"
        });
    }
};

const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            expense_date,
            category,
            material_name,
            quantity,
            unit,
            rate,
            amount,
            vendor,
            payment_status,
            notes
        } = req.body;

        if (!expense_date || !category || !amount) {
            return res.status(400).json({
                success: false,
                message: "Date, category and amount are required"
            });
        }

        const [result] = await db.query(
            `UPDATE expenses SET
                expense_date = ?,
                category = ?,
                material_name = ?,
                quantity = ?,
                unit = ?,
                rate = ?,
                amount = ?,
                vendor = ?,
                payment_status = ?,
                notes = ?
             WHERE id = ?`,
            [
                expense_date,
                category,
                material_name || null,
                Number(quantity || 0),
                unit || null,
                Number(rate || 0),
                Number(amount || 0),
                vendor || null,
                payment_status || "Pending",
                notes || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        res.json({
            success: true,
            message: "Expense updated successfully"
        });
    } catch (error) {
        console.error("Update expense error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating expense"
        });
    }
};

const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM expenses WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        res.json({
            success: true,
            message: "Expense deleted successfully"
        });
    } catch (error) {
        console.error("Delete expense error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while deleting expense"
        });
    }
};

module.exports = {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense
};