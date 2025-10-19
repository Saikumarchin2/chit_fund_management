let transactions = [];

document.addEventListener("DOMContentLoaded", async () => {
  await loadTransactions();
  document.getElementById("exportPdfBtn").addEventListener("click", exportAllPDF);
  document.getElementById("exportExcelBtn").addEventListener("click", exportExcel);
  document.getElementById("filterBtn").addEventListener("click", filterByDate);
});

// Load transactions from server
async function loadTransactions() {
  const tableBody = document.getElementById("transactionTableBody");
  try {
    const res = await fetch("http://localhost:8000/transactions");
    transactions = await res.json();
    renderTable(transactions);
  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:red;">Error loading transactions ❌</td></tr>`;
  }
}

// Render transactions table
function renderTable(data) {
  const tableBody = document.getElementById("transactionTableBody");
  tableBody.innerHTML = "";
  if (!data || data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No transactions found 🧾</td></tr>`;
    return;
  }

  data.sort((a,b)=>a.transaction_id-b.transaction_id);

  data.forEach((tx, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${tx.user_id}</td>
      <td>${tx.user_name}</td>
      <td>₹${Number(tx.amount_paid).toLocaleString()}</td>
      <td>${formatDate(tx.payment_date)}</td>
      <td>${tx.payment_method}</td>
      <td>₹${Number(tx.previous_pending).toLocaleString()}</td>
      <td>₹${Number(tx.new_pending).toLocaleString()}</td>
      <td><button class="print-btn">Print</button></td>
    `;
    tableBody.appendChild(tr);

    // Add print event for this row
    tr.querySelector(".print-btn").addEventListener("click", () => printSingleTransaction(tx));
  });
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleString("en-IN", {
    year:"numeric", month:"short", day:"numeric",
    hour:"2-digit", minute:"2-digit"
  });
}

// Filter by date range
function filterByDate() {
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  if(!from || !to) return renderTable(transactions);

  const filtered = transactions.filter(tx => {
    const date = new Date(tx.payment_date);
    return date >= new Date(from) && date <= new Date(to+"T23:59:59");
  });
  renderTable(filtered);
}

// Get currently displayed transactions
function getDisplayedData() {
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  if(!from || !to) return transactions;
  return transactions.filter(tx => {
    const date = new Date(tx.payment_date);
    return date >= new Date(from) && date <= new Date(to+"T23:59:59");
  });
}

// ================= Single Transaction Print PDF =================
function printSingleTransaction(tx) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Transaction Details", 14, 20);
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 28);

  const details = [
    ["Transaction ID:", tx.transaction_id],
    ["User ID:", tx.user_id],
    ["Name:", tx.user_name],
    ["Amount Paid:", `₹${Number(tx.amount_paid).toLocaleString()}`],
    ["Previous Pending:", `₹${Number(tx.previous_pending).toLocaleString()}`],
    ["New Pending:", `₹${Number(tx.new_pending).toLocaleString()}`],
    ["Payment Method:", tx.payment_method],
    ["Payment Date:", formatDate(tx.payment_date)]
  ];

  let startY = 40;
  details.forEach(([label, value]) => {
    doc.text(`${label} ${value}`, 14, startY);
    startY += 10;
  });

  // Open in print mode
  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
}

// ================= Export All Transactions PDF =================
function exportAllPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const filteredData = getDisplayedData();

  doc.setFontSize(18);
  doc.text("Transaction History", 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 30);

  const headers = [["S.No","User ID","Name","Amount Paid","Payment Date","Method","Prev Pending","New Pending"]];
  const rows = filteredData.map((tx,i)=>[
    i+1, tx.user_id, tx.user_name, `₹${tx.amount_paid}`, formatDate(tx.payment_date),
    tx.payment_method, `₹${tx.previous_pending}`, `₹${tx.new_pending}`
  ]);

  doc.autoTable({
    startY: 35,
    head: headers,
    body: rows,
    headStyles: { fillColor: [22, 160, 133] },
    alternateRowStyles: { fillColor: [240, 240, 240] }
  });

  doc.save("transactions.pdf");
}

// ================= Export All Transactions Excel =================
function exportExcel() {
  const filteredData = getDisplayedData();
  const wsData = [
    ["S.No","User ID","Name","Amount Paid","Payment Date","Method","Prev Pending","New Pending"],
    ...filteredData.map((tx,i)=>[
      i+1, tx.user_id, tx.user_name, tx.amount_paid, tx.payment_date, tx.payment_method, tx.previous_pending, tx.new_pending
    ])
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  XLSX.writeFile(wb, "transactions.xlsx");
}
