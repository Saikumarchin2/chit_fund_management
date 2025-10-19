let allPendingUsers = []; // store all users globally

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.querySelector(".loanRepayment-body");
  const searchInput = document.querySelector("#loanSearchInput");

  try {
    const res = await fetch("http://localhost:8000/users");
    const users = await res.json();

    // Filter only users with pending amount > 0
    allPendingUsers = users.filter(user => Number(user.pending) > 0);
    renderLoanRepaymentTable(allPendingUsers);

    // ✅ Search Filter
    searchInput.addEventListener("input", () => {
      const searchValue = searchInput.value.toLowerCase();
      const filtered = allPendingUsers.filter(user =>
        user.name.toLowerCase().includes(searchValue)
      );
      renderLoanRepaymentTable(filtered);
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Error loading data ❌</td></tr>`;
  }
});

// ===========================
// Render Table Function
// ===========================
function renderLoanRepaymentTable(users) {
  const tableBody = document.querySelector(".loanRepayment-body");
  tableBody.innerHTML = "";

  if (users.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;">No matching users 🕵️</td>
      </tr>
    `;
    return;
  }

  users.forEach(user => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.id}</td>
      <td>${user.name}</td>
      <td>₹${Number(user.pending).toLocaleString()}</td>
      <td>₹${Number(user.loan_amt).toLocaleString()}</td>
      <td>₹${Number(user.interest).toLocaleString()}</td>
      <td>
        <button class="payment-btn" data-id="${user.id}">Make Payment</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Re-attach event listeners for Payment buttons
  document.querySelectorAll(".payment-btn").forEach(button => {
    button.addEventListener("click", (e) => {
      const id = e.target.getAttribute("data-id");
      const user = allPendingUsers.find(u => u.id == id);
      openPaymentModal(user);
    });
  });
}

// ===========================
// Modal Logic
// ===========================
function openPaymentModal(user) {
  const modal = document.createElement("div");
  modal.classList.add("modal-overlay");
  modal.innerHTML = `
    <div class="modal-box">
      <h2>💰 Payment for ${user.name}</h2>
      <form id="paymentForm" autocomplete="off">
        <label>ID:</label>
        <input type="text" name="userId" value="${user.id}" readonly />

        <label>Name:</label>
        <input type="text" name="userName" value="${user.name}" readonly />

        <label>Pending Amount (₹):</label>
        <input type="text" name="pendingAmount" value="${user.pending}" readonly />

        <label>Amount to Pay (₹):</label>
        <input type="number" name="payAmount" min="1" max="${user.pending}" required />

        <label>Payment Method:</label>
        <select name="paymentMethod" required>
          <option value="">Select Method</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>

        <div class="modal-actions">
          <button type="submit" class="submit-btn">✅ Submit</button>
          <button type="button" class="cancel-btn">❌ Cancel</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector(".cancel-btn").addEventListener("click", () => modal.remove());

  modal.querySelector("#paymentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const amountToPay = parseFloat(e.target.payAmount.value);
    const paymentMethod = e.target.paymentMethod.value;

    if (isNaN(amountToPay) || amountToPay <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const newPending = Number(user.pending) - amountToPay;

    try {
      // Step 1️⃣: Update user's pending amount
      const updateRes = await fetch(`http://localhost:8000/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...user,
          pending: newPending < 0 ? 0 : newPending
        })
      });

      if (!updateRes.ok) {
        alert("❌ Failed to update user record.");
        return;
      }

      // Step 2️⃣: Add transaction record
      const transaction = {
        user_id: user.id,
        user_name: user.name,
        amount_paid: amountToPay,
        payment_method: paymentMethod,
        previous_pending: user.pending,
        new_pending: newPending < 0 ? 0 : newPending,
        payment_date: new Date().toLocaleString(),
      };

      const transactionRes = await fetch("http://localhost:8000/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction)
      });

      if (transactionRes.ok) {
        alert("✅ Payment Successful & Transaction Recorded!");
        modal.remove();

        // Refresh data
        user.pending = newPending < 0 ? 0 : newPending;
        allPendingUsers = allPendingUsers.filter(u => Number(u.pending) > 0);
        renderLoanRepaymentTable(allPendingUsers);
      } else {
        alert("⚠️ Payment updated but transaction not saved!");
      }

    } catch (err) {
      console.error("Payment error:", err);
      alert("Error occurred during payment.");
    }
  });
}
