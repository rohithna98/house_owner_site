const bcrypt = require("bcryptjs");
const db = require("./config/db");

const createOwner = async () => {
    try {
        const name = "Owner";
        const username = "owner";
        const plainPassword = "12345";
        const role = "owner";

        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        await db.query(
            `INSERT INTO users (name, username, password, role, active)
             VALUES (?, ?, ?, ?, TRUE)
             ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             password = VALUES(password),
             role = VALUES(role),
             active = TRUE`,
            [name, username, hashedPassword, role]
        );

        console.log("Owner user created successfully");
        console.log("Username: owner");
        console.log("Password: 12345");

        process.exit(0);
    } catch (error) {
        console.error("Error creating owner:", error);
        process.exit(1);
    }
};

createOwner();