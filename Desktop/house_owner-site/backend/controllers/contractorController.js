const db = require("../config/db");

const getContractors = async (req, res) => {
    try {
        const [contractors] = await db.query(
            `SELECT 
                contractors.*,
                users.name AS created_by_name
             FROM contractors
             LEFT JOIN users ON contractors.created_by = users.id
             ORDER BY contractors.id DESC`
        );

        res.json({
            success: true,
            contractors
        });
    } catch (error) {
        console.error("Get contractors error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching contractors"
        });
    }
};

const createContractor = async (req, res) => {
    try {
        const {
            contractor_name,
            contractor_phone,
            work_type,
            contract_amount,
            paid_amount,
            work_status,
            start_date,
            notes
        } = req.body;

        if (!contractor_name || !work_type || Number(contract_amount || 0) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Contractor name, work type and contract amount are required"
            });
        }

        if (Number(paid_amount || 0) > Number(contract_amount || 0)) {
            return res.status(400).json({
                success: false,
                message: "Paid amount cannot be greater than contract amount"
            });
        }

        const [result] = await db.query(
            `INSERT INTO contractors
            (
                contractor_name,
                contractor_phone,
                work_type,
                contract_amount,
                paid_amount,
                work_status,
                start_date,
                notes,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                contractor_name,
                contractor_phone || null,
                work_type,
                Number(contract_amount || 0),
                Number(paid_amount || 0),
                work_status || "Not Started",
                start_date || null,
                notes || null,
                req.user.id
            ]
        );

        res.status(201).json({
            success: true,
            message: "Contractor added successfully",
            contractorId: result.insertId
        });
    } catch (error) {
        console.error("Create contractor error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while adding contractor"
        });
    }
};

const updateContractor = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            contractor_name,
            contractor_phone,
            work_type,
            contract_amount,
            paid_amount,
            work_status,
            start_date,
            notes
        } = req.body;

        if (!contractor_name || !work_type || Number(contract_amount || 0) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Contractor name, work type and contract amount are required"
            });
        }

        if (Number(paid_amount || 0) > Number(contract_amount || 0)) {
            return res.status(400).json({
                success: false,
                message: "Paid amount cannot be greater than contract amount"
            });
        }

        const [result] = await db.query(
            `UPDATE contractors SET
                contractor_name = ?,
                contractor_phone = ?,
                work_type = ?,
                contract_amount = ?,
                paid_amount = ?,
                work_status = ?,
                start_date = ?,
                notes = ?
             WHERE id = ?`,
            [
                contractor_name,
                contractor_phone || null,
                work_type,
                Number(contract_amount || 0),
                Number(paid_amount || 0),
                work_status || "Not Started",
                start_date || null,
                notes || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Contractor not found"
            });
        }

        res.json({
            success: true,
            message: "Contractor updated successfully"
        });
    } catch (error) {
        console.error("Update contractor error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while updating contractor"
        });
    }
};

const deleteContractor = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM contractors WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Contractor not found"
            });
        }

        res.json({
            success: true,
            message: "Contractor deleted successfully"
        });
    } catch (error) {
        console.error("Delete contractor error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while deleting contractor"
        });
    }
};

module.exports = {
    getContractors,
    createContractor,
    updateContractor,
    deleteContractor
};