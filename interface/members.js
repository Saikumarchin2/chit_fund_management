// ================================
// DOM Elements
// ================================
const membersTableBody = document.querySelector(".members-details");
const searchInput = document.getElementById("searchInput");
const addMemberBtn = document.getElementById("addMemberBtn");
const dashBoardDiv = document.querySelector(".dashBoard-details");

const modal = document.getElementById("addMemberModal");
const modalClose = document.getElementById("modalClose");
const addMemberForm = document.getElementById("addMemberForm");

let users = [];
let filteredUsers = [];
let editUserId = null;
let editForm = {};

// ================================
// Fetch Users from API
// ================================
async function fetchUsers() {
  try {
    const response = await fetch("https://chit-fund-management.onrender.com/users");
    users = await response.json();
    filteredUsers = [...users];
    renderMembersTable();
    updateDashboardStats();
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

// ================================
// Render Members Table
// ================================
function renderMembersTable() {
  membersTableBody.innerHTML = "";

  if (filteredUsers.length === 0) {
    membersTableBody.innerHTML = `<tr><td colspan="8">No users found</td></tr>`;
    return;
  }

  filteredUsers.forEach(u => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${editUserId === u.id ? `<input type="text" name="name" value="${editForm.name}" />` : u.name}</td>
      <td>${editUserId === u.id ? `<input type="text" name="phn" value="${editForm.phn}" />` : u.phn}</td>
      <td>${editUserId === u.id ? `
        <select name="status">
          <option value="active" ${editForm.status === "active" ? "selected" : ""}>Active</option>
          <option value="inactive" ${editForm.status === "inactive" ? "selected" : ""}>Inactive</option>
        </select>
      ` : u.status}</td>
      <td>${editUserId === u.id ? `<input type="number" name="loan_amt" value="${editForm.loan_amt}" />` : u.loan_amt}</td>
      <td>${editUserId === u.id ? `<input type="number" name="pending" value="${editForm.pending}" />` : u.pending}</td>
      <td>${u.interest}</td>
      <td>
        ${editUserId === u.id ? `
          <button class="save-btn">💾 Save</button>
          <button class="cancel-btn">❌ Cancel</button>
        ` : `
          <button class="edit-btn">✏️ Edit</button>
          <button class="delete-btn">🗑️ Delete</button>
        `}
      </td>
    `;

    // ✅ Event Listeners
    if (editUserId === u.id) {
      tr.querySelector(".save-btn").addEventListener("click", () => handleSave(u.id));
      tr.querySelector(".cancel-btn").addEventListener("click", handleCancel);
      tr.querySelectorAll("input, select").forEach(el => {
        el.addEventListener("input", handleEditChange);
      });
    } else {
      tr.querySelector(".edit-btn").addEventListener("click", () => handleEditClick(u));
      tr.querySelector(".delete-btn").addEventListener("click", () => handleDelete(u.id));
    }

    membersTableBody.appendChild(tr);
  });
}

// ================================
// Search / Filter
// ================================
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  filteredUsers = users.filter(u => u.name.toLowerCase().includes(query));
  renderMembersTable();
});

// ================================
// Edit Functions
// ================================
function handleEditClick(user) {
  editUserId = user.id;
  editForm = { ...user };
  renderMembersTable();
}

function handleEditChange(e) {
  const { name, value } = e.target;
  editForm[name] = value;
}

async function handleSave(id) {
  try {
    const res = await fetch(`https://chit-fund-management.onrender.com/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm)
    });
    if (!res.ok) throw new Error("Failed to update user");
    editUserId = null;
    editForm = {};
    fetchUsers();
  } catch (error) {
    console.error(error);
  }
}

function handleCancel() {
  editUserId = null;
  editForm = {};
  renderMembersTable();
}

// ================================
// Delete User
// ================================
async function handleDelete(id) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  try {
    const res = await fetch(`https://chit-fund-management.onrender.com/users/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete user");
    fetchUsers();
  } catch (error) {
    console.error(error);
  }
}

// ================================
// Modal Add Member
// ================================
addMemberBtn.addEventListener("click", () => {
  modal.style.display = "flex";
});

modalClose.addEventListener("click", () => {
  modal.style.display = "none";
  addMemberForm.reset();
});

// ✅ Optional: prevent clicks inside modal from closing it accidentally
modal.addEventListener("click", (e) => {
  e.stopPropagation(); // Prevent background clicks from bubbling up
});

addMemberForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newMember = {
    name: addMemberForm.name.value.trim(),
    phn: addMemberForm.phn.value.trim(),
    status: addMemberForm.status.value,
    loan_amt: Number(addMemberForm.loan_amt.value),
    pending: Number(addMemberForm.pending.value),
    interest: Number(addMemberForm.interest.value)
  };

  try {
    const res = await fetch("https://chit-fund-management.onrender.com/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMember)
    });

    if (!res.ok) throw new Error("Failed to add member");

    modal.style.display = "none";
    addMemberForm.reset();
    fetchUsers();
  } catch (error) {
    console.error(error);
    alert("Failed to add member");
  }
});

// ================================
// Dashboard Stats
// ================================
function updateDashboardStats() {
  const totalMembers = users.length;
  const activeMembers = users.filter(u => u.status.toLowerCase() === "active").length;
  const totalLoan = users.reduce((sum, u) => sum + parseFloat(u.loan_amt), 0);
  const totalPending = users.reduce((sum, u) => sum + parseFloat(u.pending), 0);

  dashBoardDiv.innerHTML = `
    <div class="stat-card">
      <h2>${totalMembers}</h2>
      <p>Total Members</p>
    </div>
    <div class="stat-card">
      <h2>${activeMembers}</h2>
      <p>Active Members</p>
    </div>
    <div class="stat-card">
      <h2>${totalLoan.toLocaleString()}</h2>
      <p>Total Loan Amount</p>
    </div>
    <div class="stat-card">
      <h2>${(totalLoan - totalPending).toLocaleString()}</h2>
      <p>Total Amount</p>
    </div>
    <div class="stat-card">
      <h2>${totalPending.toLocaleString()}</h2>
      <p>Total Pending Amount</p>
    </div>
  `;
}

// ================================
// Initial Load
// ================================
fetchUsers();
