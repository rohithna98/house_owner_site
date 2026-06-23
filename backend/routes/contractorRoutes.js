const express = require("express");

const {
    getContractors,
    createContractor,
    updateContractor,
    deleteContractor
} = require("../controllers/contractorController");

const {
    protect,
    allowRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getContractors);

router.post(
    "/",
    protect,
    allowRoles("owner", "staff"),
    createContractor
);

router.put(
    "/:id",
    protect,
    allowRoles("owner", "staff"),
    updateContractor
);

router.delete(
    "/:id",
    protect,
    allowRoles("owner"),
    deleteContractor
);

module.exports = router;