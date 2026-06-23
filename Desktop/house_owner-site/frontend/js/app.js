
const API_BASE_URL = "http://localhost:5000/api";

const TOKEN_KEY = "buildTrackToken";
const USER_KEY = "buildTrackUser";

const EXPENSE_KEY = "houseExpenses";
const STOCK_KEY = "houseMaterialStock";
const CONTRACTOR_KEY = "houseContractors";

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

function saveLoginSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getLoginToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getLoggedInUser() {
    const user = localStorage.getItem(USER_KEY);

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch (error) {
        return null;
    }
}

function clearLoginSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

function isLoggedIn() {
    return Boolean(getLoginToken());
}

async function loginUser(username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username,
            password
        })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed");
    }

    return data;
}

async function apiRequest(endpoint, options = {}) {
    const token = getLoginToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers || {})
        }
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
        throw new Error(data.message || "Something went wrong");
    }

    return data;
}

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");

        const username = usernameInput ? usernameInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value.trim() : "";

        if (loginError) {
            loginError.textContent = "";
        }

        try {
            const data = await loginUser(username, password);

            saveLoginSession(data.token, data.user);

            window.location.href = "dashboard.html";
        } catch (error) {
            console.error("Login failed:", error);

            if (loginError) {
                loginError.textContent = error.message;
            } else {
                alert(error.message);
            }
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        clearLoginSession();
        window.location.href = "index.html";
    });
}

function protectPage() {
    const currentPage = window.location.pathname.split("/").pop();

    if (currentPage === "index.html" || currentPage === "") {
        return;
    }

    if (!isLoggedIn()) {
        window.location.href = "index.html";
    }
}

protectPage();

// MOBILE SIDEBAR
function setupMobileMenu() {
    if (!menuBtn || !sidebar) {
        return;
    }

    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("expanded");
        sidebar.classList.toggle("show");
    });

    sidebar.addEventListener("click", () => {
        sidebar.classList.add("expanded");
        sidebar.classList.add("show");
    });

    document.addEventListener("click", (event) => {
        const clickedInsideSidebar = sidebar.contains(event.target);
        const clickedMenuButton = menuBtn.contains(event.target);

        if (!clickedInsideSidebar && !clickedMenuButton) {
            sidebar.classList.remove("expanded");
            sidebar.classList.remove("show");
        }
    });
}

// STORAGE HELPERS
 function getExpenses() {
    return getStoredArray("houseExpenses");
}

async function getExpensesFromApi() {
    const data = await apiRequest("/expenses", {
        method: "GET"
    });

    return data.expenses || [];
}

async function getContractorsFromApi() {
    const data = await apiRequest("/contractors", {
        method: "GET"
    });

    return data.contractors || [];
}

function saveExpenses(expenses) {
    localStorage.setItem(EXPENSE_KEY, JSON.stringify(expenses));
}

function getStockItems() {
    return getStoredArray(STOCK_KEY);
}

function saveStockItems(items) {
    localStorage.setItem(STOCK_KEY, JSON.stringify(items));
}

function getContractors() {
    return getStoredArray(CONTRACTOR_KEY);
}

function saveContractors(contractors) {
    localStorage.setItem(CONTRACTOR_KEY, JSON.stringify(contractors));
}

function getStoredArray(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key));

        if (Array.isArray(data)) {
            return data;
        }

        return [];
    } catch (error) {
        console.error(`Invalid data found in localStorage for ${key}`, error);
        return [];
    }
}

// COMMON HELPERS
function generateUniqueId(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function formatCurrency(amount) {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function formatDate(dateValue) {
    if (!dateValue) {
        return "-";
    }

    const date = new Date(dateValue);

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// DASHBOARD SUMMARY
async function loadDashboardSummary() {
    let expenses = [];

    try {
        expenses = await getExpensesFromApi();
    } catch (error) {
        console.error("Dashboard expenses error:", error);
        return;
    }

    expenses = expenses.map(mapApiExpenseToFrontend);

    const total = expenses.reduce((sum, item) => {
        return sum + Number(item.amount || 0);
    }, 0);

    const paid = expenses
        .filter((item) => item.status === "Paid")
        .reduce((sum, item) => {
            return sum + Number(item.amount || 0);
        }, 0);

    const pending = expenses
        .filter((item) => item.status === "Pending")
        .reduce((sum, item) => {
            return sum + Number(item.amount || 0);
        }, 0);

    setText("dashboardTotalExpenses", formatCurrency(total));
    setText("dashboardPaidAmount", formatCurrency(paid));
    setText("dashboardPendingAmount", formatCurrency(pending));
    setText("dashboardTotalRecords", expenses.length);

    setText("expenseTotal", formatCurrency(total));
    setText("expensePaid", formatCurrency(paid));
    setText("expensePending", formatCurrency(pending));
    setText("expenseCount", expenses.length);
}

// ===============================
// EXPENSE MODULE
// ===============================

function setExpenseCategory(value) {
    const category = document.getElementById("category");
    const unit = document.getElementById("unit");

    if (category) {
        category.value = value;
    }

    if (!unit) {
        return;
    }

    const defaultUnits = {
        Cement: "Bags",
        Steel: "Tons",
        Bricks: "Pieces",
        Sand: "Loads",
        Aggregates: "Loads",
        Labour: "Days",
        Plumbing: "Lumpsum",
        Electrical: "Lumpsum",
        Tiles: "Sqft",
        Paint: "Lumpsum",
        "Wood Work": "Lumpsum",
        Contractor: "Lumpsum",
        Transport: "Loads",
        Other: "Lumpsum"
    };

    unit.value = defaultUnits[value] || "";

    autoFillLastRateByCategory(value);
    autoFillLastVendorByCategory(value);
}

function calculateExpenseAmount() {
    const quantity = Number(document.getElementById("quantity")?.value || 0);
    const rate = Number(document.getElementById("rate")?.value || 0);
    const amountInput = document.getElementById("amount");

    if (!amountInput) {
        return;
    }

    const amount = quantity * rate;

    amountInput.value = amount > 0 ? amount.toFixed(2) : "";
}

function autoFillLastRateByCategory(categoryValue) {
    const rateInput = document.getElementById("rate");

    if (!rateInput || !categoryValue) {
        return;
    }

    const expenses = getExpenses();

    const matchingExpenses = expenses
        .filter((expense) => {
            return expense.category === categoryValue && Number(expense.rate || 0) > 0;
        })
        .sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

    if (matchingExpenses.length === 0) {
        return;
    }

    rateInput.value = matchingExpenses[0].rate;
    calculateExpenseAmount();
}

function autoFillLastVendorByCategory(categoryValue) {
    const vendorInput = document.getElementById("vendor");

    if (!vendorInput || !categoryValue) {
        return;
    }

    const expenses = getExpenses();

    const matchingExpenses = expenses
        .filter((expense) => {
            return (
                expense.category === categoryValue &&
                expense.vendor &&
                expense.vendor.trim() !== ""
            );
        })
        .sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

    if (matchingExpenses.length === 0) {
        return;
    }

    vendorInput.value = matchingExpenses[0].vendor;
}

function setupExpenseForm() {
    const expenseForm = document.getElementById("expenseForm");

    if (!expenseForm) {
        return;
    }

    const today = new Date().toISOString().split("T")[0];
    const expenseDate = document.getElementById("expenseDate");

    if (expenseDate && !expenseDate.value) {
        expenseDate.value = today;
    }

    ["quantity", "rate"].forEach((id) => {
        const input = document.getElementById(id);

        if (input) {
            input.addEventListener("input", calculateExpenseAmount);
        }
    });

    expenseForm.addEventListener("submit", (event) => {
        event.preventDefault();
        saveExpenseFromForm();
    });
}

async function loadExpenseForEdit(id) {
    let expenses = [];

    try {
        expenses = await getExpensesFromApi();
    } catch (error) {
        alert(error.message);
        window.location.href = "expenses.html";
        return;
    }

    const expense = expenses
        .map(mapApiExpenseToFrontend)
        .find((item) => String(item.id) === String(id));

    if (!expense) {
        alert("Expense not found.");
        window.location.href = "expenses.html";
        return;
    }

    setText("pageTitle", "Update Expense");
    setText("pageSubtitle", "Update existing house building expense");
    setText("formTitle", "Update Expense");
    setText("saveExpenseBtn", "Update Expense");

    document.getElementById("expenseId").value = expense.id;
    document.getElementById("expenseDate").value = expense.date;
    document.getElementById("category").value = expense.category;
    document.getElementById("quantity").value = expense.quantity || "";
    document.getElementById("unit").value = expense.unit || "";
    document.getElementById("rate").value = expense.rate || "";
    document.getElementById("amount").value = expense.amount || "";
    document.getElementById("status").value = expense.status;
    document.getElementById("vendor").value = expense.vendor || "";
    document.getElementById("notes").value = expense.notes || "";
}

async function saveExpenseFromForm() {
    const expenseId = document.getElementById("expenseId")?.value || "";

    const expenseData = {
        expense_date: document.getElementById("expenseDate").value,
        category: document.getElementById("category").value,
        material_name: document.getElementById("materialName")?.value || "",
        quantity: Number(document.getElementById("quantity")?.value || 0),
        unit: document.getElementById("unit")?.value || "",
        rate: Number(document.getElementById("rate")?.value || 0),
        amount: Number(document.getElementById("amount").value || 0),
        vendor: document.getElementById("vendor")?.value || "",
        payment_status: document.getElementById("status")?.value || "Pending",
        notes: document.getElementById("notes")?.value || ""
    };

    if (!expenseData.expense_date || !expenseData.category || expenseData.amount <= 0) {
        alert("Please fill date, category and valid amount.");
        return;
    }

    try {
        if (expenseId) {
            await apiRequest(`/expenses/${expenseId}`, {
                method: "PUT",
                body: JSON.stringify(expenseData)
            });

            alert("Expense updated successfully.");
        } else {
            await apiRequest("/expenses", {
                method: "POST",
                body: JSON.stringify(expenseData)
            });

            alert("Expense saved successfully.");
        }

        window.location.href = "expenses.html";
    } catch (error) {
        alert(error.message);
    }
}

function normalizeText(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}

function getMaterialCategory(category) {
    const value = normalizeText(category);

    const materialMap = {
        cement: "Cement",
        steel: "Steel",
        bricks: "Bricks",
        brick: "Bricks",
        sand: "Sand",
        aggregates: "Aggregates",
        aggregate: "Aggregates",
        tiles: "Tiles",
        tile: "Tiles",
        paint: "Paint",
        "wood work": "Wood Work",
        woodwork: "Wood Work",
        electrical: "Electrical",
        plumbing: "Plumbing"
    };

    return materialMap[value] || "";
}

function findMatchingStockItem(stockItems, expense) {
    const materialName = getMaterialCategory(expense.category);
    const expenseUnit = normalizeText(expense.unit);

    return stockItems.find((item) => {
        const stockName = normalizeText(item.materialName);
        const stockUnit = normalizeText(item.materialUnit);

        return (
            stockUnit === expenseUnit &&
            (
                stockName === normalizeText(materialName) ||
                stockName.includes(normalizeText(materialName)) ||
                normalizeText(materialName).includes(stockName)
            )
        );
    });
}

function syncExpenseToMaterialStock(newExpense, oldExpense = null) {
    const stockCategories = [
        "Cement",
        "Steel",
        "Bricks",
        "Sand",
        "Aggregates",
        "Tiles",
        "Paint",
        "Wood Work",
        "Electrical",
        "Plumbing"
    ];

    if (!stockCategories.includes(newExpense.category)) {
        return;
    }

    const stockItems = getStockItems();

    const materialName = newExpense.category;
    const materialUnit = newExpense.unit;
    const newQuantity = Number(newExpense.quantity || 0);

    let oldQuantity = 0;

    if (
        oldExpense &&
        oldExpense.category === newExpense.category &&
        oldExpense.unit === newExpense.unit
    ) {
        oldQuantity = Number(oldExpense.quantity || 0);
    }

    const quantityToAdd = newQuantity - oldQuantity;

    let existingStock = findMatchingStockItem(stockItems, newExpense);

    if (existingStock) {
        existingStock.totalQuantity = Number(existingStock.totalQuantity || 0) + quantityToAdd;

        if (existingStock.totalQuantity < 0) {
            existingStock.totalQuantity = 0;
        }

        existingStock.supplierName = newExpense.vendor || existingStock.supplierName || "";
        existingStock.stockNotes = existingStock.stockNotes || "Updated from Add Expense";
        existingStock.updatedAt = new Date().toISOString();
    } else {
        stockItems.push({
            id: generateUniqueId("stock"),
            materialName: materialName,
            materialUnit: materialUnit,
            totalQuantity: newQuantity,
            usedQuantity: 0,
            lowStockLimit: 10,
            supplierName: newExpense.vendor || "",
            stockNotes: "Auto added from Add Expense",
            updatedAt: new Date().toISOString()
        });
    }

    saveStockItems(stockItems);
}

function removeExpenseFromMaterialStock(expense) {
    if (!expense) {
        return;
    }

    const stockCategories = [
        "Cement",
        "Steel",
        "Bricks",
        "Sand",
        "Aggregates",
        "Tiles",
        "Paint",
        "Wood Work",
        "Electrical",
        "Plumbing"
    ];

    if (!stockCategories.includes(expense.category)) {
        return;
    }

    const stockItems = getStockItems();

    const stockItem = stockItems.find((item) => {
        return (
            String(item.materialName || "").trim().toLowerCase() === String(expense.category || "").trim().toLowerCase() &&
            String(item.materialUnit || "").trim().toLowerCase() === String(expense.unit || "").trim().toLowerCase()
        );
    });

    if (!stockItem) {
        return;
    }

    stockItem.totalQuantity = Number(stockItem.totalQuantity || 0) - Number(expense.quantity || 0);

    if (stockItem.totalQuantity < 0) {
        stockItem.totalQuantity = 0;
    }

    stockItem.updatedAt = new Date().toISOString();

    saveStockItems(stockItems);
}

async function loadExpensesPage() {
    const expenseTableBody = document.getElementById("expenseTableBody");
    const mobileExpenseCards = document.getElementById("mobileExpenseCards");

    if (!expenseTableBody && !mobileExpenseCards) {
        return;
    }

    await renderExpenses();

    const searchExpense = document.getElementById("searchExpense");
    const sortExpenseDate = document.getElementById("sortExpenseDate");
    const filterCategory = document.getElementById("filterCategory");
    const filterStatus = document.getElementById("filterStatus");

    if (searchExpense) {
        searchExpense.addEventListener("input", renderExpenses);
    }

    if (sortExpenseDate) {
        sortExpenseDate.addEventListener("change", renderExpenses);
    }

    if (filterCategory) {
        filterCategory.addEventListener("change", renderExpenses);
    }

    if (filterStatus) {
        filterStatus.addEventListener("change", renderExpenses);
    }
}

async function renderExpenses() {
    const expenseTableBody = document.getElementById("expenseTableBody");
    const mobileExpenseCards = document.getElementById("mobileExpenseCards");
    const expenseEmptyState = document.getElementById("expenseEmptyState");

    if (!expenseTableBody && !mobileExpenseCards) {
        return;
    }

    if (expenseTableBody) {
        expenseTableBody.innerHTML = "";
    }

    if (mobileExpenseCards) {
        mobileExpenseCards.innerHTML = "";
    }

    let expenses = [];

    try {
        expenses = await getExpensesFromApi();
    } catch (error) {
        alert(error.message);
        return;
    }

    expenses = expenses.map(mapApiExpenseToFrontend);

    const searchText = (document.getElementById("searchExpense")?.value || "").toLowerCase().trim();
    const sortOrder = document.getElementById("sortExpenseDate")?.value || "newest";
    const selectedCategory = document.getElementById("filterCategory")?.value || "All";
    const selectedStatus = document.getElementById("filterStatus")?.value || "All";

    expenses = expenses.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        if (sortOrder === "oldest") {
            return dateA - dateB;
        }

        return dateB - dateA;
    });

    if (selectedCategory !== "All") {
        expenses = expenses.filter((item) => item.category === selectedCategory);
    }

    if (selectedStatus !== "All") {
        expenses = expenses.filter((item) => item.status === selectedStatus);
    }

    if (searchText) {
        expenses = expenses.filter((item) => {
            return (
                String(item.category || "").toLowerCase().includes(searchText) ||
                String(item.quantity || "").toLowerCase().includes(searchText) ||
                String(item.unit || "").toLowerCase().includes(searchText) ||
                String(item.rate || "").toLowerCase().includes(searchText) ||
                String(item.vendor || "").toLowerCase().includes(searchText) ||
                String(item.status || "").toLowerCase().includes(searchText)
            );
        });
    }

    if (expenseEmptyState) {
        expenseEmptyState.style.display = expenses.length === 0 ? "block" : "none";
    }

    expenses.forEach((expense) => {
        if (expenseTableBody) {
            renderExpenseTableRow(expense);
        }

        if (mobileExpenseCards) {
            renderExpenseMobileCard(expense);
        }
    });

    updateExpensePageSummary(expenses);
}

function updateExpensePageSummary(expenses) {
    const total = expenses.reduce((sum, item) => {
        return sum + Number(item.amount || 0);
    }, 0);

    const paid = expenses
        .filter((item) => item.status === "Paid")
        .reduce((sum, item) => {
            return sum + Number(item.amount || 0);
        }, 0);

    const pending = expenses
        .filter((item) => item.status === "Pending")
        .reduce((sum, item) => {
            return sum + Number(item.amount || 0);
        }, 0);

    setText("expenseTotal", formatCurrency(total));
    setText("expensePaid", formatCurrency(paid));
    setText("expensePending", formatCurrency(pending));
    setText("expenseCount", expenses.length);
}

function mapApiExpenseToFrontend(expense) {
    return {
        id: String(expense.id),
        date: expense.expense_date ? String(expense.expense_date).split("T")[0] : "",
        category: expense.category,
        materialName: expense.material_name || "",
        quantity: Number(expense.quantity || 0),
        unit: expense.unit || "",
        rate: Number(expense.rate || 0),
        amount: Number(expense.amount || 0),
        vendor: expense.vendor || "",
        status: expense.payment_status || "Pending",
        notes: expense.notes || "",
        createdBy: expense.created_by_name || ""
    };
}

function renderExpenseTableRow(expense) {
    const expenseTableBody = document.getElementById("expenseTableBody");

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${formatDate(expense.date)}</td>
        <td>${expense.category}</td>
        <td>
            ${expense.quantity || "-"} ${expense.unit || ""}<br>
            <small>@ ${formatCurrency(expense.rate || 0)}</small>
        </td>
        <td>${formatCurrency(expense.amount)}</td>
        <td>
            <span class="status-badge ${expense.status === "Paid" ? "status-paid" : "status-pending"}">
                ${expense.status}
            </span>
        </td>
        <td>${expense.vendor || "-"}</td>
        <td>${expense.paymentMode || "-"}</td>
        <td>
            <div class="action-group">
                <button class="action-btn edit-btn" onclick="editExpense('${expense.id}')">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteExpense('${expense.id}')">Delete</button>
            </div>
        </td>
    `;

    expenseTableBody.appendChild(row);
}

function renderExpenseMobileCard(expense) {
    const mobileExpenseCards = document.getElementById("mobileExpenseCards");

    const card = document.createElement("div");
    card.className = "mobile-expense-card";

    card.innerHTML = `
        <div class="mobile-expense-top">
            <div>
                <h3>${expense.category}</h3>
                <small>${formatDate(expense.date)}</small>
            </div>

            <strong>${formatCurrency(expense.amount)}</strong>
        </div>

        <p><b>Quantity:</b> ${expense.quantity || "-"} ${expense.unit || ""}</p>
        <p><b>Rate:</b> ${formatCurrency(expense.rate || 0)}</p>
        <p><b>Vendor:</b> ${expense.vendor || "-"}</p>
        <p><b>Mode:</b> ${expense.paymentMode || "-"}</p>
        <p>
            <b>Status:</b>
            <span class="status-badge ${expense.status === "Paid" ? "status-paid" : "status-pending"}">
                ${expense.status}
            </span>
        </p>

        <div class="mobile-actions">
            <button class="action-btn edit-btn" onclick="editExpense('${expense.id}')">Edit</button>
            <button class="action-btn delete-btn" onclick="deleteExpense('${expense.id}')">Delete</button>
        </div>
    `;

    mobileExpenseCards.appendChild(card);
}

function editExpense(id) {
    window.location.href = `add-expense.html?edit=${id}`;
}

async function deleteExpense(id) {
    const confirmDelete = confirm("Are you sure you want to delete this expense?");

    if (!confirmDelete) {
        return;
    }

    try {
        await apiRequest(`/expenses/${id}`, {
            method: "DELETE"
        });

        alert("Expense deleted successfully.");
        await renderExpenses();
    } catch (error) {
        alert(error.message);
    }
}
// ===============================
// MATERIAL STOCK MODULE
// ===============================

function quickMaterial(name, unit) {
    const materialName = document.getElementById("materialName");
    const materialUnit = document.getElementById("materialUnit");

    if (materialName) {
        materialName.value = name;
    }

    if (materialUnit) {
        materialUnit.value = unit;
    }
}

function setupStockForm() {
    const stockForm = document.getElementById("stockForm");

    if (!stockForm) {
        return;
    }

    stockForm.addEventListener("submit", (event) => {
        event.preventDefault();
        saveStockFromForm();
    });

    const cancelStockEditBtn = document.getElementById("cancelStockEditBtn");

    if (cancelStockEditBtn) {
        cancelStockEditBtn.addEventListener("click", resetStockForm);
    }
}

function saveStockFromForm() {
    const id = document.getElementById("stockId").value;
    const materialName = document.getElementById("materialName").value.trim();
    const materialUnit = document.getElementById("materialUnit").value;
    const totalQuantity = Number(document.getElementById("totalQuantity").value);
    const usedQuantity = Number(document.getElementById("usedQuantity").value);
    const lowStockLimit = Number(document.getElementById("lowStockLimit").value);
    const supplierName = document.getElementById("supplierName").value.trim();
    const stockNotes = document.getElementById("stockNotes").value.trim();

    if (!materialName || !materialUnit || totalQuantity <= 0 || usedQuantity < 0 || lowStockLimit < 0) {
        alert("Please fill all required stock details correctly.");
        return;
    }

    if (usedQuantity > totalQuantity) {
        alert("Used quantity cannot be greater than total quantity.");
        return;
    }

    const stockItems = getStockItems();

    const stockData = {
        id: id || generateUniqueId("stock"),
        materialName: materialName,
        materialUnit: materialUnit,
        totalQuantity: totalQuantity,
        usedQuantity: usedQuantity,
        lowStockLimit: lowStockLimit,
        supplierName: supplierName,
        stockNotes: stockNotes,
        updatedAt: new Date().toISOString()
    };

    if (id) {
        const updatedItems = stockItems.map((item) => {
            return item.id === id ? stockData : item;
        });

        saveStockItems(updatedItems);
        alert("Stock updated successfully.");
    } else {
        const existingStock = stockItems.find((item) => {
            return (
                String(item.materialName || "").trim().toLowerCase() === materialName.toLowerCase() &&
                String(item.materialUnit || "").trim().toLowerCase() === materialUnit.toLowerCase()
            );
        });

        if (existingStock) {
            existingStock.totalQuantity = Number(existingStock.totalQuantity || 0) + totalQuantity;
            existingStock.usedQuantity = Number(existingStock.usedQuantity || 0) + usedQuantity;
            existingStock.lowStockLimit = lowStockLimit;

            if (supplierName) {
                existingStock.supplierName = supplierName;
            }

            if (stockNotes) {
                existingStock.stockNotes = stockNotes;
            }

            existingStock.updatedAt = new Date().toISOString();

            saveStockItems(stockItems);
            alert("Same material already exists. Quantity added to existing stock.");
        } else {
            stockItems.push(stockData);
            saveStockItems(stockItems);
            alert("Stock saved successfully.");
        }
    }

    resetStockForm();
    renderStockItems();
}

function loadStockPage() {
    const stockTableBody = document.getElementById("stockTableBody");
    const mobileStockCards = document.getElementById("mobileStockCards");

    if (!stockTableBody && !mobileStockCards) {
        return;
    }

    renderStockItems();

    const searchStock = document.getElementById("searchStock");

    if (searchStock) {
        searchStock.addEventListener("input", renderStockItems);
    }
}

function renderStockItems() {
    const stockTableBody = document.getElementById("stockTableBody");
    const mobileStockCards = document.getElementById("mobileStockCards");
    const stockEmptyState = document.getElementById("stockEmptyState");

    if (!stockTableBody && !mobileStockCards) {
    return;
}

if (stockTableBody) {
    stockTableBody.innerHTML = "";
}

if (mobileStockCards) {
    mobileStockCards.innerHTML = "";
}

    const searchText = (document.getElementById("searchStock")?.value || "").toLowerCase().trim();

    let stockItems = getStockItems();

    if (searchText) {
        stockItems = stockItems.filter((item) => {
            return (
                String(item.materialName || "").toLowerCase().includes(searchText) ||
                String(item.materialUnit || "").toLowerCase().includes(searchText) ||
                String(item.supplierName || "").toLowerCase().includes(searchText)
            );
        });
    }

    if (stockEmptyState) {
        stockEmptyState.style.display = stockItems.length === 0 ? "block" : "none";
    }

    stockItems.forEach((item) => {
        if (stockTableBody) {
    renderStockTableRow(item);
}

if (mobileStockCards) {
    renderStockMobileCard(item);
}
    });

    updateStockSummary();
}

function renderStockTableRow(item) {
    const stockTableBody = document.getElementById("stockTableBody");

    if (!stockTableBody) {
        return;
    }

    const available = getAvailableQuantity(item);
    const status = getStockStatus(item);

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${item.materialName}</td>
        <td>${item.totalQuantity} ${item.materialUnit}</td>
        <td>${item.usedQuantity} ${item.materialUnit}</td>
        <td>${available} ${item.materialUnit}</td>
        <td>
            <span class="stock-status ${status.className}">
                ${status.label}
            </span>
        </td>
        <td>${item.supplierName || "-"}</td>
        <td>
            <div class="action-group">
                <button type="button" class="action-btn edit-btn" onclick="editStock('${item.id}')">Edit</button>
                <button type="button" class="action-btn delete-btn" onclick="deleteStock('${item.id}')">Delete</button>
            </div>
        </td>
    `;

    stockTableBody.appendChild(row);
}

function renderStockMobileCard(item) {
    const mobileStockCards = document.getElementById("mobileStockCards");

    if (!mobileStockCards) {
        return;
    }

    const available = getAvailableQuantity(item);
    const status = getStockStatus(item);

    const card = document.createElement("div");
    card.className = "mobile-stock-card";

    card.innerHTML = `
        <div class="mobile-stock-top">
            <div>
                <h3>${item.materialName}</h3>
                <small>${item.supplierName || "No supplier"}</small>
            </div>

            <strong>${available} ${item.materialUnit}</strong>
        </div>

        <p><b>Total:</b> ${item.totalQuantity} ${item.materialUnit}</p>
        <p><b>Used:</b> ${item.usedQuantity} ${item.materialUnit}</p>
        <p><b>Available:</b> ${available} ${item.materialUnit}</p>
        <p>
            <b>Status:</b>
            <span class="stock-status ${status.className}">
                ${status.label}
            </span>
        </p>

        <div class="mobile-actions">
            <button type="button" class="action-btn edit-btn" onclick="editStock('${item.id}')">Edit</button>
            <button type="button" class="action-btn delete-btn" onclick="deleteStock('${item.id}')">Delete</button>
        </div>
    `;

    mobileStockCards.appendChild(card);
}

function getAvailableQuantity(item) {
    return Number(item.totalQuantity || 0) - Number(item.usedQuantity || 0);
}

function getStockStatus(item) {
    const available = getAvailableQuantity(item);
    const lowLimit = Number(item.lowStockLimit || 0);

    if (available <= 0) {
        return {
            label: "Finished",
            className: "stock-finished"
        };
    }

    if (available <= lowLimit) {
        return {
            label: "Low Stock",
            className: "stock-low"
        };
    }

    return {
        label: "Available",
        className: "stock-ok"
    };
}

function updateStockSummary() {
    const stockItems = getStockItems();

    const totalItems = stockItems.length;

    const availableItems = stockItems.filter((item) => {
        return getAvailableQuantity(item) > 0;
    }).length;

    const lowItems = stockItems.filter((item) => {
        return getStockStatus(item).label === "Low Stock" || getStockStatus(item).label === "Finished";
    }).length;

    const usedItems = stockItems.filter((item) => {
        return Number(item.usedQuantity || 0) > 0;
    }).length;

    setText("stockTotalItems", totalItems);
    setText("stockAvailableItems", availableItems);
    setText("stockLowItems", lowItems);
    setText("stockUsedItems", usedItems);
}

function getFixedMaterialName(value) {
    const name = String(value || "").trim().toLowerCase();

    const materialNames = {
        cement: "Cement",
        steel: "Steel",
        bricks: "Bricks",
        brick: "Bricks",
        sand: "Sand",
        aggregates: "Aggregates",
        aggregate: "Aggregates",
        plumbing: "Plumbing",
        electrical: "Electrical",
        tiles: "Tiles",
        tile: "Tiles",
        paint: "Paint",
        "wood work": "Wood Work",
        woodwork: "Wood Work",
        other: "Other"
    };

    return materialNames[name] || value || "";
}

function getFixedMaterialUnit(value) {
    const unit = String(value || "").trim().toLowerCase();

    const materialUnits = {
        bags: "Bags",
        bag: "Bags",
        tons: "Tons",
        ton: "Tons",
        kg: "Kg",
        kgs: "Kg",
        loads: "Loads",
        load: "Loads",
        pieces: "Pieces",
        piece: "Pieces",
        boxes: "Boxes",
        box: "Boxes",
        litres: "Litres",
        litre: "Litres",
        "sq.ft": "Sq.ft",
        sqft: "Sq.ft",
        "sq ft": "Sq.ft",
        bundles: "Bundles",
        bundle: "Bundles"
    };

    return materialUnits[unit] || value || "";
}

function editStock(id) {
    const stockItems = getStockItems();
    const item = stockItems.find((stock) => String(stock.id) === String(id));

    if (!item) {
        alert("Stock item not found.");
        return;
    }

    const stockId = document.getElementById("stockId");
    const materialName = document.getElementById("materialName");
    const materialUnit = document.getElementById("materialUnit");
    const totalQuantity = document.getElementById("totalQuantity");
    const usedQuantity = document.getElementById("usedQuantity");
    const lowStockLimit = document.getElementById("lowStockLimit");
    const supplierName = document.getElementById("supplierName");
    const stockNotes = document.getElementById("stockNotes");

    if (
        !stockId ||
        !materialName ||
        !materialUnit ||
        !totalQuantity ||
        !usedQuantity ||
        !lowStockLimit ||
        !supplierName ||
        !stockNotes
    ) {
        alert("Stock form fields are missing. Please check stock.html input IDs.");
        return;
    }

    const fixedMaterialName = getFixedMaterialName(item.materialName);
    const fixedMaterialUnit = getFixedMaterialUnit(item.materialUnit);

    stockId.value = item.id;
    materialName.value = fixedMaterialName;
    materialUnit.value = fixedMaterialUnit;
    totalQuantity.value = item.totalQuantity || 0;
    usedQuantity.value = item.usedQuantity || 0;
    lowStockLimit.value = item.lowStockLimit || 0;
    supplierName.value = item.supplierName || "";
    stockNotes.value = item.stockNotes || "";

    setText("stockFormTitle", `Update ${fixedMaterialName} Stock`);
    setText("saveStockBtn", "Update Stock");

    const cancelStockEditBtn = document.getElementById("cancelStockEditBtn");

    if (cancelStockEditBtn) {
        cancelStockEditBtn.style.display = "block";
    }

    const stockForm = document.getElementById("stockForm");

    if (stockForm) {
        stockForm.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

function deleteStock(id) {
    const confirmDelete = confirm("Are you sure you want to delete this stock item?");

    if (!confirmDelete) {
        return;
    }

    const stockItems = getStockItems();
    const updatedItems = stockItems.filter((item) => item.id !== id);

    saveStockItems(updatedItems);
    renderStockItems();
}

function resetStockForm() {
    const stockForm = document.getElementById("stockForm");

    if (!stockForm) {
        return;
    }

    stockForm.reset();

    document.getElementById("stockId").value = "";
    document.getElementById("usedQuantity").value = 0;
    document.getElementById("lowStockLimit").value = 10;

    setText("stockFormTitle", "Add Material Stock");
    setText("saveStockBtn", "Save Stock");

    const cancelStockEditBtn = document.getElementById("cancelStockEditBtn");

    if (cancelStockEditBtn) {
        cancelStockEditBtn.style.display = "none";
    }
}

// ===============================
// CONTRACTOR MODULE
// ===============================

function quickContractorWork(workTypeValue) {
    const workType = document.getElementById("workType");

    if (workType) {
        workType.value = workTypeValue;
    }
}

function setupContractorForm() {
    const contractorForm = document.getElementById("contractorForm");

    if (!contractorForm) {
        return;
    }

    const contractStartDate = document.getElementById("contractStartDate");

    if (contractStartDate && !contractStartDate.value) {
        contractStartDate.valueAsDate = new Date();
    }

    contractorForm.addEventListener("submit", (event) => {
        event.preventDefault();
        saveContractorFromForm();
    });

    const cancelContractorEditBtn = document.getElementById("cancelContractorEditBtn");

    if (cancelContractorEditBtn) {
        cancelContractorEditBtn.addEventListener("click", resetContractorForm);
    }
}

async function saveContractorFromForm() {
    const id = document.getElementById("contractorId").value;
    const contractorName = document.getElementById("contractorName").value.trim();
    const contractorPhone = document.getElementById("contractorPhone").value.trim();
    const workType = document.getElementById("workType").value;
    const contractAmount = Number(document.getElementById("contractAmount").value);
    const contractPaidAmount = Number(document.getElementById("contractPaidAmount").value);
    const contractWorkStatus = document.getElementById("contractWorkStatus").value;
    const contractStartDate = document.getElementById("contractStartDate").value;
    const contractNotes = document.getElementById("contractNotes").value.trim();

    if (!contractorName || !workType || contractAmount <= 0 || contractPaidAmount < 0 || !contractWorkStatus) {
        alert("Please fill all required contractor details correctly.");
        return;
    }

    if (contractPaidAmount > contractAmount) {
        alert("Paid amount cannot be greater than total contract amount.");
        return;
    }

    const contractorData = {
        contractor_name: contractorName,
        contractor_phone: contractorPhone,
        work_type: workType,
        contract_amount: contractAmount,
        paid_amount: contractPaidAmount,
        work_status: contractWorkStatus,
        start_date: contractStartDate || null,
        notes: contractNotes
    };

    try {
        if (id) {
            await apiRequest(`/contractors/${id}`, {
                method: "PUT",
                body: JSON.stringify(contractorData)
            });

            alert("Contractor updated successfully.");
        } else {
            await apiRequest("/contractors", {
                method: "POST",
                body: JSON.stringify(contractorData)
            });

            alert("Contractor saved successfully.");
        }

        resetContractorForm();
        await renderContractors();
    } catch (error) {
        alert(error.message);
    }
}

async function loadContractorPage() {
    const contractorTableBody = document.getElementById("contractorTableBody");
    const mobileContractorCards = document.getElementById("mobileContractorCards");

    if (!contractorTableBody && !mobileContractorCards) {
        return;
    }

    await renderContractors();

    const searchContractor = document.getElementById("searchContractor");
    const filterContractStatus = document.getElementById("filterContractStatus");

    if (searchContractor) {
        searchContractor.addEventListener("input", renderContractors);
    }

    if (filterContractStatus) {
        filterContractStatus.addEventListener("change", renderContractors);
    }
}

async function renderContractors() {
    const contractorTableBody = document.getElementById("contractorTableBody");
    const mobileContractorCards = document.getElementById("mobileContractorCards");
    const contractorEmptyState = document.getElementById("contractorEmptyState");

    if (!contractorTableBody && !mobileContractorCards) {
        return;
    }

    if (contractorTableBody) {
        contractorTableBody.innerHTML = "";
    }

    if (mobileContractorCards) {
        mobileContractorCards.innerHTML = "";
    }

    let contractors = [];

    try {
        contractors = await getContractorsFromApi();
    } catch (error) {
        alert(error.message);
        return;
    }

    contractors = contractors.map(mapApiContractorToFrontend);

    const searchText = (document.getElementById("searchContractor")?.value || "").toLowerCase().trim();
    const selectedStatus = document.getElementById("filterContractStatus")?.value || "All";

    if (selectedStatus !== "All") {
        contractors = contractors.filter((item) => item.contractWorkStatus === selectedStatus);
    }

    if (searchText) {
        contractors = contractors.filter((item) => {
            return (
                String(item.contractorName || "").toLowerCase().includes(searchText) ||
                String(item.contractorPhone || "").toLowerCase().includes(searchText) ||
                String(item.workType || "").toLowerCase().includes(searchText) ||
                String(item.contractWorkStatus || "").toLowerCase().includes(searchText)
            );
        });
    }

    if (contractorEmptyState) {
        contractorEmptyState.style.display = contractors.length === 0 ? "block" : "none";
    }

    contractors.forEach((contractor) => {
        if (contractorTableBody) {
            renderContractorTableRow(contractor);
        }

        if (mobileContractorCards) {
            renderContractorMobileCard(contractor);
        }
    });

    updateContractorSummary(contractors);
}

function renderContractorTableRow(contractor) {
    const contractorTableBody = document.getElementById("contractorTableBody");

    const balance = getContractBalance(contractor);
    const status = getContractorStatus(contractor.contractWorkStatus);

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${contractor.contractorName}</td>
        <td>${contractor.workType}</td>
        <td>${formatCurrency(contractor.contractAmount)}</td>
        <td>${formatCurrency(contractor.contractPaidAmount)}</td>
        <td>${formatCurrency(balance)}</td>
        <td>
            <span class="contract-status ${status.className}">
                ${status.label}
            </span>
        </td>
        <td>${contractor.contractorPhone || "-"}</td>
        <td>
            <div class="action-group">
                <button class="action-btn edit-btn" onclick="editContractor('${contractor.id}')">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteContractor('${contractor.id}')">Delete</button>
            </div>
        </td>
    `;

    contractorTableBody.appendChild(row);
}

function renderContractorMobileCard(contractor) {
    const mobileContractorCards = document.getElementById("mobileContractorCards");

    const balance = getContractBalance(contractor);
    const status = getContractorStatus(contractor.contractWorkStatus);

    const card = document.createElement("div");
    card.className = "mobile-contractor-card";

    card.innerHTML = `
        <div class="mobile-contractor-top">
            <div>
                <h3>${contractor.contractorName}</h3>
                <small>${contractor.workType}</small>
            </div>

            <strong>${formatCurrency(balance)}</strong>
        </div>

        <p><b>Phone:</b> ${contractor.contractorPhone || "-"}</p>
        <p><b>Total:</b> ${formatCurrency(contractor.contractAmount)}</p>
        <p><b>Paid:</b> ${formatCurrency(contractor.contractPaidAmount)}</p>
        <p><b>Balance:</b> ${formatCurrency(balance)}</p>
        <p><b>Start Date:</b> ${formatDate(contractor.contractStartDate)}</p>
        <p>
            <b>Status:</b>
            <span class="contract-status ${status.className}">
                ${status.label}
            </span>
        </p>

        <div class="mobile-actions">
            <button class="action-btn edit-btn" onclick="editContractor('${contractor.id}')">Edit</button>
            <button class="action-btn delete-btn" onclick="deleteContractor('${contractor.id}')">Delete</button>
        </div>
    `;

    mobileContractorCards.appendChild(card);
}

function getContractBalance(contractor) {
    return Number(contractor.contractAmount || 0) - Number(contractor.contractPaidAmount || 0);
}

function getContractorStatus(statusValue) {
    if (statusValue === "Completed") {
        return {
            label: "Completed",
            className: "contract-completed"
        };
    }

    if (statusValue === "In Progress") {
        return {
            label: "In Progress",
            className: "contract-progress"
        };
    }

    return {
        label: "Not Started",
        className: "contract-not-started"
    };
}

function mapApiContractorToFrontend(contractor) {
    return {
        id: String(contractor.id),
        contractorName: contractor.contractor_name || "",
        contractorPhone: contractor.contractor_phone || "",
        workType: contractor.work_type || "",
        contractAmount: Number(contractor.contract_amount || 0),
        contractPaidAmount: Number(contractor.paid_amount || 0),
        contractWorkStatus: contractor.work_status || "Not Started",
        contractStartDate: contractor.start_date
            ? String(contractor.start_date).split("T")[0]
            : "",
        contractNotes: contractor.notes || "",
        createdBy: contractor.created_by_name || ""
    };
}

function updateContractorSummary(contractors = []) {
    const totalValue = contractors.reduce((sum, item) => {
        return sum + Number(item.contractAmount || 0);
    }, 0);

    const paidValue = contractors.reduce((sum, item) => {
        return sum + Number(item.contractPaidAmount || 0);
    }, 0);

    const balanceValue = totalValue - paidValue;

    setText("contractTotalValue", formatCurrency(totalValue));
    setText("contractPaidValue", formatCurrency(paidValue));
    setText("contractBalanceValue", formatCurrency(balanceValue));
    setText("contractTotalCount", contractors.length);
}

async function editContractor(id) {
    let contractors = [];

    try {
        contractors = await getContractorsFromApi();
    } catch (error) {
        alert(error.message);
        return;
    }

    contractors = contractors.map(mapApiContractorToFrontend);

    const contractor = contractors.find((item) => String(item.id) === String(id));

    if (!contractor) {
        alert("Contractor not found.");
        return;
    }

    document.getElementById("contractorId").value = contractor.id;
    document.getElementById("contractorName").value = contractor.contractorName;
    document.getElementById("contractorPhone").value = contractor.contractorPhone || "";
    document.getElementById("workType").value = contractor.workType;
    document.getElementById("contractAmount").value = contractor.contractAmount;
    document.getElementById("contractPaidAmount").value = contractor.contractPaidAmount;
    document.getElementById("contractWorkStatus").value = contractor.contractWorkStatus;
    document.getElementById("contractStartDate").value = contractor.contractStartDate || "";
    document.getElementById("contractNotes").value = contractor.contractNotes || "";

    setText("contractorFormTitle", "Update Contractor");
    setText("saveContractorBtn", "Update Contractor");

    const cancelContractorEditBtn = document.getElementById("cancelContractorEditBtn");

    if (cancelContractorEditBtn) {
        cancelContractorEditBtn.style.display = "block";
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

async function deleteContractor(id) {
    const confirmDelete = confirm("Are you sure you want to delete this contractor?");

    if (!confirmDelete) {
        return;
    }

    try {
        await apiRequest(`/contractors/${id}`, {
            method: "DELETE"
        });

        alert("Contractor deleted successfully.");
        await renderContractors();
    } catch (error) {
        alert(error.message);
    }
}

function resetContractorForm() {
    const contractorForm = document.getElementById("contractorForm");

    if (!contractorForm) {
        return;
    }

    contractorForm.reset();

    document.getElementById("contractorId").value = "";
    document.getElementById("contractPaidAmount").value = 0;

    const contractStartDate = document.getElementById("contractStartDate");

    if (contractStartDate) {
        contractStartDate.valueAsDate = new Date();
    }

    setText("contractorFormTitle", "Add Contractor");
    setText("saveContractorBtn", "Save Contractor");

    const cancelContractorEditBtn = document.getElementById("cancelContractorEditBtn");

    if (cancelContractorEditBtn) {
        cancelContractorEditBtn.style.display = "none";
    }
}

// ===============================
// REPORTS MODULE
// ===============================

async function loadReportsPage() {
    const categoryReportList = document.getElementById("categoryReportList");

    if (!categoryReportList) {
        return;
    }

    await updateReportDate();
    await updateMainReportSummary();
    await renderCategoryReport();
    await renderMonthlyExpenseReport();
    await renderPaymentReport();
    await renderVendorReport();
    await renderContractorReport();

    renderLowStockReport();
}

async function getReportExpensesFromApi() {
    const apiExpenses = await getExpensesFromApi();

    return apiExpenses.map(mapApiExpenseToFrontend);
}

async function renderMonthlyExpenseReport() {
    const monthlyReportList = document.getElementById("monthlyReportList");
    const monthlyReportEmpty = document.getElementById("monthlyReportEmpty");

    if (!monthlyReportList) {
        return;
    }

    monthlyReportList.innerHTML = "";

    const expenses = await getReportFilteredExpenses();

    const monthlyTotals = {};

    expenses.forEach((expense) => {
        if (!expense.date) {
            return;
        }

        const date = new Date(expense.date);

        if (Number.isNaN(date.getTime())) {
            return;
        }

        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        const monthLabel = date.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric"
        });

        if (!monthlyTotals[monthKey]) {
            monthlyTotals[monthKey] = {
                label: monthLabel,
                amount: 0,
                count: 0
            };
        }

        monthlyTotals[monthKey].amount += Number(expense.amount || 0);
        monthlyTotals[monthKey].count += 1;
    });

    const sortedMonths = Object.entries(monthlyTotals).sort((a, b) => {
        return a[0].localeCompare(b[0]);
    });

    if (monthlyReportEmpty) {
        monthlyReportEmpty.style.display = sortedMonths.length === 0 ? "block" : "none";
    }

    sortedMonths.forEach(([, data]) => {
        const item = document.createElement("div");
        item.className = "mini-list-item";

        item.innerHTML = `
            <div>
                <h4>${data.label}</h4>
                <p>${data.count} expense record${data.count === 1 ? "" : "s"}</p>
            </div>

            <strong>${formatCurrency(data.amount)}</strong>
        `;

        monthlyReportList.appendChild(item);
    });
}

async function renderVendorReport() {
    const vendorReportList = document.getElementById("vendorReportList");
    const vendorReportEmpty = document.getElementById("vendorReportEmpty");

    if (!vendorReportList) {
        return;
    }

    vendorReportList.innerHTML = "";

    const expenses = await getReportFilteredExpenses();

    const vendorTotals = {};

    expenses.forEach((expense) => {
        const vendor = expense.vendor && expense.vendor.trim()
            ? expense.vendor.trim()
            : "No Vendor";

        if (!vendorTotals[vendor]) {
            vendorTotals[vendor] = 0;
        }

        vendorTotals[vendor] += Number(expense.amount || 0);
    });

    const sortedVendors = Object.entries(vendorTotals)
        .filter(([vendor]) => vendor !== "No Vendor")
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    if (vendorReportEmpty) {
        vendorReportEmpty.style.display = sortedVendors.length === 0 ? "block" : "none";
    }

    sortedVendors.forEach(([vendor, amount]) => {
        const item = document.createElement("div");
        item.className = "mini-list-item";

        item.innerHTML = `
            <div>
                <h4>${vendor}</h4>
                <p>Total paid/spent to this vendor</p>
            </div>

            <strong>${formatCurrency(amount)}</strong>
        `;

        vendorReportList.appendChild(item);
    });
}

function updateReportDate() {
    const today = new Date();

    const fromDate = document.getElementById("reportFromDate")?.value;
    const toDate = document.getElementById("reportToDate")?.value;

    let filterText = "";

    if (fromDate || toDate) {
        filterText = ` | Filter: ${fromDate || "Start"} to ${toDate || "Today"}`;
    }

    setText("reportDate", `Generated on ${today.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    })}${filterText}`);
}

async function updateMainReportSummary() {
    const expenses = await getReportFilteredExpenses();
    const contractors = getContractors();

    const vendorSupplierPaid = expenses
        .filter((item) => item.status === "Paid")
        .reduce((sum, item) => {
            return sum + Number(item.amount || 0);
        }, 0);

    const vendorSupplierPending = expenses
        .filter((item) => item.status === "Pending")
        .reduce((sum, item) => {
            return sum + Number(item.amount || 0);
        }, 0);

    const contractorPaid = contractors.reduce((sum, item) => {
        return sum + Number(item.contractPaidAmount || 0);
    }, 0);

    const contractorPending = contractors.reduce((sum, item) => {
        return sum + getContractBalance(item);
    }, 0);

    const totalPaid = vendorSupplierPaid + contractorPaid;
    const totalPending = vendorSupplierPending + contractorPending;
    const totalProjectValue = totalPaid + totalPending;

    setText("reportTotalExpenses", formatCurrency(totalProjectValue));
    setText("reportPaidExpenses", formatCurrency(totalPaid));
    setText("reportPendingExpenses", formatCurrency(totalPending));
    setText("reportExpenseCount", expenses.length + contractors.length);
}

async function getReportFilteredExpenses() {
    let expenses = [];

    try {
        expenses = await getReportExpensesFromApi();
    } catch (error) {
        console.error("Report expenses error:", error);
        return [];
    }

    const fromDate = document.getElementById("reportFromDate")?.value;
    const toDate = document.getElementById("reportToDate")?.value;

    if (!fromDate && !toDate) {
        return expenses;
    }

    return expenses.filter((expense) => {
        if (!expense.date) {
            return false;
        }

        const expenseDate = new Date(expense.date);

        if (fromDate) {
            const from = new Date(fromDate);

            if (expenseDate < from) {
                return false;
            }
        }

        if (toDate) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);

            if (expenseDate > to) {
                return false;
            }
        }

        return true;
    });
}

async function applyReportDateFilter() {
    await loadReportsPage();
}

async function clearReportDateFilter() {
    const fromDate = document.getElementById("reportFromDate");
    const toDate = document.getElementById("reportToDate");

    if (fromDate) {
        fromDate.value = "";
    }

    if (toDate) {
        toDate.value = "";
    }

    await loadReportsPage();
}

async function renderCategoryReport() {
    const categoryReportList = document.getElementById("categoryReportList");
    const categoryReportEmpty = document.getElementById("categoryReportEmpty");

    if (!categoryReportList) {
        return;
    }

    categoryReportList.innerHTML = "";

    const expenses = await getReportFilteredExpenses();

    if (expenses.length === 0) {
        if (categoryReportEmpty) {
            categoryReportEmpty.style.display = "block";
        }

        return;
    }

    if (categoryReportEmpty) {
        categoryReportEmpty.style.display = "none";
    }

    const totalExpenseAmount = expenses.reduce((sum, item) => {
        return sum + Number(item.amount || 0);
    }, 0);

    const categoryTotals = {};

    expenses.forEach((item) => {
        const category = item.category || "Other";

        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }

        categoryTotals[category] += Number(item.amount || 0);
    });

    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => {
        return b[1] - a[1];
    });

    sortedCategories.forEach(([category, amount]) => {
        const percentage = totalExpenseAmount > 0
            ? Math.round((amount / totalExpenseAmount) * 100)
            : 0;

        const item = document.createElement("div");
        item.className = "report-item";

        item.innerHTML = `
            <div class="report-item-top">
                <h3>${category}</h3>
                <strong>${formatCurrency(amount)} (${percentage}%)</strong>
            </div>

            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        `;

        categoryReportList.appendChild(item);
    });
}

async function renderPaymentReport() {
    const expenses = await getReportFilteredExpenses();
    const contractors = getContractors();

    const vendorSupplierPaid = expenses
        .filter((item) => item.status === "Paid")
        .reduce((sum, item) => {
            return sum + Number(item.amount || 0);
        }, 0);

    const vendorSupplierPending = expenses
        .filter((item) => item.status === "Pending")
        .reduce((sum, item) => {
            return sum + Number(item.amount || 0);
        }, 0);

    const contractorPaid = contractors.reduce((sum, item) => {
        return sum + Number(item.contractPaidAmount || 0);
    }, 0);

    const contractorPending = contractors.reduce((sum, item) => {
        return sum + getContractBalance(item);
    }, 0);

    const totalPaid = vendorSupplierPaid + contractorPaid;
    const totalPending = vendorSupplierPending + contractorPending;
    const totalProjectValue = totalPaid + totalPending;

    setText("paymentPaidAmount", formatCurrency(totalPaid));
    setText("paymentPendingAmount", formatCurrency(totalPending));
    setText("paymentTotalAmount", formatCurrency(totalProjectValue));
}

async function renderContractorReport() {
    const contractorBalanceList = document.getElementById("contractorBalanceList");

    let contractors = [];

    try {
        contractors = await getContractorsFromApi();
    } catch (error) {
        console.error("Report contractors error:", error);
        contractors = [];
    }

    contractors = contractors.map(mapApiContractorToFrontend);

    const totalContract = contractors.reduce((sum, item) => {
        return sum + Number(item.contractAmount || 0);
    }, 0);

    const totalPaid = contractors.reduce((sum, item) => {
        return sum + Number(item.contractPaidAmount || 0);
    }, 0);

    const totalBalance = totalContract - totalPaid;

    setText("reportContractTotal", formatCurrency(totalContract));
    setText("reportContractPaid", formatCurrency(totalPaid));
    setText("reportContractBalance", formatCurrency(totalBalance));

    if (!contractorBalanceList) {
        return;
    }

    contractorBalanceList.innerHTML = "";

    const pendingContractors = contractors.filter((item) => {
        return getContractBalance(item) > 0;
    });

    pendingContractors.slice(0, 5).forEach((contractor) => {
        const balance = getContractBalance(contractor);

        const item = document.createElement("div");
        item.className = "mini-list-item";

        item.innerHTML = `
            <div>
                <h4>${contractor.contractorName}</h4>
                <p>${contractor.workType} | ${contractor.contractWorkStatus}</p>
            </div>

            <strong>${formatCurrency(balance)}</strong>
        `;

        contractorBalanceList.appendChild(item);
    });
}

function renderLowStockReport() {
    const lowStockReportList = document.getElementById("lowStockReportList");
    const lowStockReportEmpty = document.getElementById("lowStockReportEmpty");

    if (!lowStockReportList) {
        return;
    }

    lowStockReportList.innerHTML = "";

    const stockItems = getStockItems();

    const lowStockItems = stockItems.filter((item) => {
        const status = getStockStatus(item);
        return status.label === "Low Stock" || status.label === "Finished";
    });

    if (lowStockItems.length === 0) {
        if (lowStockReportEmpty) {
            lowStockReportEmpty.style.display = "block";
        }

        return;
    }

    if (lowStockReportEmpty) {
        lowStockReportEmpty.style.display = "none";
    }

    lowStockItems.forEach((item) => {
        const available = getAvailableQuantity(item);
        const status = getStockStatus(item);

        const listItem = document.createElement("div");
        listItem.className = "mini-list-item";

        listItem.innerHTML = `
            <div>
                <h4>${item.materialName}</h4>
                <p>Status: ${status.label}</p>
            </div>

            <strong>${available} ${item.materialUnit}</strong>
        `;

        lowStockReportList.appendChild(listItem);
    });
}

function printReport() {
    window.print();
}

// ===============================
// IMPROVED DASHBOARD MODULE
// ===============================

async function loadImprovedDashboard() {
    const recentExpensesBox = document.getElementById("dashboardRecentExpenses");

    if (!recentExpensesBox) {
        return;
    }

    await updateDashboardModuleSummary();
    await renderDashboardRecentExpenses();
    renderDashboardLowStock();
    renderDashboardContractorBalances();
    await updateDashboardProjectHealth();
}

async function updateDashboardModuleSummary() {
    let expenses = [];

    try {
        expenses = await getExpensesFromApi();
    } catch (error) {
        console.error("Dashboard module expenses error:", error);
        return;
    }

    expenses = expenses.map(mapApiExpenseToFrontend);

    const stockItems = getStockItems();
    const contractors = getContractors();

    const lowStockItems = stockItems.filter((item) => {
        const status = getStockStatus(item);
        return status.label === "Low Stock" || status.label === "Finished";
    });

    const totalContractorBalance = contractors.reduce((sum, contractor) => {
        return sum + getContractBalance(contractor);
    }, 0);

    const categoryTotals = {};

    expenses.forEach((expense) => {
        const category = expense.category || "Other";

        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }

        categoryTotals[category] += Number(expense.amount || 0);
    });

    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => {
        return b[1] - a[1];
    });

    const topCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : "-";
    const topCategoryAmount = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;

    setText("dashboardStockItems", stockItems.length);
    setText("dashboardLowStockText", `${lowStockItems.length} low stock items`);

    setText("dashboardContractors", contractors.length);
    setText("dashboardContractBalance", `${formatCurrency(totalContractorBalance)} balance pending`);

    setText("dashboardTopCategory", topCategory);
    setText("dashboardTopCategoryAmount", formatCurrency(topCategoryAmount));
}

async function renderDashboardRecentExpenses() {
    const recentExpensesBox = document.getElementById("dashboardRecentExpenses");
    const recentEmpty = document.getElementById("dashboardRecentEmpty");

    if (!recentExpensesBox) {
        return;
    }

    recentExpensesBox.innerHTML = "";

    let expenses = [];

    try {
        expenses = await getExpensesFromApi();
    } catch (error) {
        console.error("Recent expenses error:", error);
        return;
    }

    expenses = expenses
        .map(mapApiExpenseToFrontend)
        .sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

    const recentExpenses = expenses.slice(0, 5);

    if (recentEmpty) {
        recentEmpty.style.display = recentExpenses.length === 0 ? "block" : "none";
    }

    recentExpenses.forEach((expense) => {
        const item = document.createElement("div");
        item.className = "dashboard-list-item";

        item.innerHTML = `
            <div>
                <h4>${expense.category}</h4>
                <p>Qty: ${expense.quantity || "-"} ${expense.unit || ""} @ ${formatCurrency(expense.rate || 0)}</p>
                <p>${formatDate(expense.date)} | ${expense.vendor || "No vendor"}</p>
            </div>

            <strong>${formatCurrency(expense.amount)}</strong>
        `;

        recentExpensesBox.appendChild(item);
    });
}

function renderDashboardLowStock() {
    const lowStockBox = document.getElementById("dashboardLowStockList");
    const lowStockEmpty = document.getElementById("dashboardLowStockEmpty");

    if (!lowStockBox) {
        return;
    }

    lowStockBox.innerHTML = "";

    const stockItems = getStockItems();

    const lowStockItems = stockItems.filter((item) => {
        const status = getStockStatus(item);
        return status.label === "Low Stock" || status.label === "Finished";
    });

    if (lowStockEmpty) {
        lowStockEmpty.style.display = lowStockItems.length === 0 ? "block" : "none";
    }

    lowStockItems.slice(0, 5).forEach((stock) => {
        const available = getAvailableQuantity(stock);
        const status = getStockStatus(stock);

        const item = document.createElement("div");
        item.className = "dashboard-list-item";

        item.innerHTML = `
            <div>
                <h4>${stock.materialName}</h4>
                <p>${stock.supplierName || "No supplier"}</p>
                <p class="alert-text">${status.label}</p>
            </div>

            <strong>${available} ${stock.materialUnit}</strong>
        `;

        lowStockBox.appendChild(item);
    });
}

function renderDashboardContractorBalances() {
    const contractorBox = document.getElementById("dashboardContractorBalanceList");
    const contractorEmpty = document.getElementById("dashboardContractorEmpty");

    if (!contractorBox) {
        return;
    }

    contractorBox.innerHTML = "";

    const contractors = getContractors();

    const pendingContractors = contractors
        .filter((contractor) => {
            return getContractBalance(contractor) > 0;
        })
        .sort((a, b) => {
            return getContractBalance(b) - getContractBalance(a);
        });

    if (contractorEmpty) {
        contractorEmpty.style.display = pendingContractors.length === 0 ? "block" : "none";
    }

    pendingContractors.slice(0, 5).forEach((contractor) => {
        const balance = getContractBalance(contractor);

        const item = document.createElement("div");
        item.className = "dashboard-list-item";

        item.innerHTML = `
            <div>
                <h4>${contractor.contractorName}</h4>
                <p>${contractor.workType}</p>
                <p>${contractor.contractWorkStatus}</p>
            </div>

            <strong>${formatCurrency(balance)}</strong>
        `;

        contractorBox.appendChild(item);
    });
}

async function updateDashboardProjectHealth() {
    let expenses = [];

    try {
        expenses = await getExpensesFromApi();
    } catch (error) {
        console.error("Project health expenses error:", error);
        return;
    }

    expenses = expenses.map(mapApiExpenseToFrontend);

    const stockItems = getStockItems();
    const contractors = getContractors();

    const pendingExpenses = expenses
        .filter((expense) => expense.status === "Pending")
        .reduce((sum, expense) => {
            return sum + Number(expense.amount || 0);
        }, 0);

    const lowStockCount = stockItems.filter((item) => {
        const status = getStockStatus(item);
        return status.label === "Low Stock" || status.label === "Finished";
    }).length;

    const contractorBalance = contractors.reduce((sum, contractor) => {
        return sum + getContractBalance(contractor);
    }, 0);

    setText("healthPendingExpenses", `${formatCurrency(pendingExpenses)} pending`);
    setText("healthLowStock", `${lowStockCount} items need attention`);
    setText("healthContractorBalance", `${formatCurrency(contractorBalance)} balance pending`);
}

// ===============================
// VENDOR / SUPPLIER SUGGESTIONS
// ===============================

function loadVendorSuggestions() {
    const vendorList = document.getElementById("vendorList");

    if (!vendorList) {
        return;
    }

    vendorList.innerHTML = "";

    const expenses = getExpenses();
    const stockItems = getStockItems();
    const contractors = getContractors();

    const names = [
        ...expenses.map((expense) => expense.vendor),
        ...stockItems.map((stock) => stock.supplierName),
        ...contractors.map((contractor) => contractor.contractorName)
    ];

    const uniqueNames = getUniqueCleanNames(names);

    uniqueNames.forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        vendorList.appendChild(option);
    });
}

function getUniqueCleanNames(names) {
    const nameMap = new Map();

    names.forEach((name) => {
        if (!name || typeof name !== "string") {
            return;
        }

        const cleanName = name.trim().replace(/\s+/g, " ");

        if (!cleanName) {
            return;
        }

        const key = cleanName.toLowerCase();

        if (!nameMap.has(key)) {
            nameMap.set(key, cleanName);
        }
    });

    return Array.from(nameMap.values()).sort((a, b) => {
        return a.localeCompare(b);
    });
}

function mergeDuplicateStockItems() {
    const stockItems = getStockItems();
    const mergedMap = new Map();

    stockItems.forEach((item) => {
        const key = `${String(item.materialName || "").trim().toLowerCase()}_${String(item.materialUnit || "").trim().toLowerCase()}`;

        if (!mergedMap.has(key)) {
            mergedMap.set(key, {
                ...item,
                totalQuantity: Number(item.totalQuantity || 0),
                usedQuantity: Number(item.usedQuantity || 0),
                lowStockLimit: Number(item.lowStockLimit || 10)
            });
        } else {
            const existing = mergedMap.get(key);

            existing.totalQuantity += Number(item.totalQuantity || 0);
            existing.usedQuantity += Number(item.usedQuantity || 0);

            if (!existing.supplierName && item.supplierName) {
                existing.supplierName = item.supplierName;
            }

            if (item.stockNotes) {
                existing.stockNotes = existing.stockNotes
                    ? `${existing.stockNotes}; ${item.stockNotes}`
                    : item.stockNotes;
            }

            existing.updatedAt = new Date().toISOString();
        }
    });

    saveStockItems(Array.from(mergedMap.values()));

    if (typeof renderStockItems === "function") {
        renderStockItems();
    }

    alert("Duplicate stock items merged successfully.");
}

function syncAllMaterialExpensesToStock() {
    const expenses = getExpenses();

    expenses.forEach((expense) => {
        syncExpenseToMaterialStock(expense);
    });

    alert("All material expenses synced to stock successfully.");
}

function mergeDuplicateStockItems() {
    const stockItems = getStockItems();
    const mergedMap = new Map();

    stockItems.forEach((item) => {
        const key = `${String(item.materialName || "").trim().toLowerCase()}_${String(item.materialUnit || "").trim().toLowerCase()}`;

        if (!mergedMap.has(key)) {
            mergedMap.set(key, {
                ...item,
                totalQuantity: Number(item.totalQuantity || 0),
                usedQuantity: Number(item.usedQuantity || 0),
                lowStockLimit: Number(item.lowStockLimit || 10)
            });
        } else {
            const existing = mergedMap.get(key);

            existing.totalQuantity += Number(item.totalQuantity || 0);
            existing.usedQuantity += Number(item.usedQuantity || 0);

            if (!existing.supplierName && item.supplierName) {
                existing.supplierName = item.supplierName;
            }

            if (item.stockNotes) {
                existing.stockNotes = existing.stockNotes
                    ? `${existing.stockNotes}; ${item.stockNotes}`
                    : item.stockNotes;
            }

            existing.updatedAt = new Date().toISOString();
        }
    });

    const mergedStockItems = Array.from(mergedMap.values());

    saveStockItems(mergedStockItems);
    renderStockItems();

    alert("Duplicate stock items merged successfully.");
}

function fixOldStockMaterialNames() {
    const stockItems = getStockItems();

    const fixedItems = stockItems.map((item) => {
        return {
            ...item,
            materialName: getFixedMaterialName(item.materialName),
            materialUnit: getFixedMaterialUnit(item.materialUnit),
            updatedAt: new Date().toISOString()
        };
    });

    saveStockItems(fixedItems);

    if (typeof renderStockItems === "function") {
        renderStockItems();
    }

    alert("Old stock material names fixed successfully.");
}

function fixDuplicateStockIds() {
    const stockItems = getStockItems();

    const fixedItems = stockItems.map((item, index) => {
        return {
            ...item,
            id: `stock_${Date.now()}_${index}_${Math.floor(Math.random() * 100000)}`,
            materialName: getFixedMaterialName ? getFixedMaterialName(item.materialName) : item.materialName,
            materialUnit: getFixedMaterialUnit ? getFixedMaterialUnit(item.materialUnit) : item.materialUnit,
            updatedAt: new Date().toISOString()
        };
    });

    saveStockItems(fixedItems);

    if (typeof renderStockItems === "function") {
        renderStockItems();
    }

    alert("Stock IDs fixed successfully. Edit buttons should work now.");
}

// ===============================
// PAGE INITIALIZATION
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    setupMobileMenu();

    setupExpenseForm();
    loadExpensesPage();

    setupStockForm();
    loadStockPage();

    setupContractorForm();
    loadContractorPage();

    loadReportsPage();
    loadDashboardSummary();
    loadImprovedDashboard();

    loadVendorSuggestions();

    const editExpenseId = getQueryParam("edit");

    if (editExpenseId) {
        loadExpenseForEdit(editExpenseId);
    }
});