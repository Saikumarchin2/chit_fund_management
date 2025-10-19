// db.js
import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

// ✅ Create connection pool
const db = mysql.createPool({ 
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
}).promise();

// =====================
// USER DETAILS FUNCTIONS
// =====================
async function show() {
  try {
    const [rows] = await db.query("SELECT * FROM users_details");
    return rows;
  } catch (error) {
    console.error("Error fetching user details:", error);
  }
}

async function getuser(id) {
  try {
    const [rows] = await db.query(
      `SELECT * FROM users_details WHERE id = ?`, [id]
    );
    return rows;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
  }
}

async function insertdata(name, phn, status, loan_amt, pending) {
  try {
    const [rows] = await db.query(
      `INSERT INTO users_details (name, phn, status, loan_amt, pending)
       VALUES (?, ?, ?, ?, ?)`, 
      [name, phn, status, loan_amt, pending]
    );
    const gets = await getuser(rows.insertId);
    return gets;
  } catch (error) {
    console.error("Error inserting user data:", error);
  }
}

async function updateuser(id, name, phn, status, loan_amt, pending) {
  try {
    await db.query(
      `UPDATE users_details 
       SET name=?, phn=?, status=?, loan_amt=?, pending=? 
       WHERE id=?`,
      [name, phn, status, loan_amt, pending, id]
    );
    const gets = await getuser(id);
    return gets;
  } catch (error) {
    console.error("Error updating user data:", error);
  }
}

async function updatename(id, name) {
  try {
    await db.query(`UPDATE users_details SET name=? WHERE id=?`, [name, id]);
    const gets = await getuser(id);
    return gets;
  } catch (error) {
    console.error("Error updating user name:", error);
  }
}

async function updatephn(id, phn) {
  try {
    await db.query(`UPDATE users_details SET phn=? WHERE id=?`, [phn, id]);
    const gets = await getuser(id);
    return gets;
  } catch (error) {
    console.error("Error updating user phone number:", error);
  }
}

async function deleteUser(id) {
  try {
    await db.query(`DELETE FROM users_details WHERE id=?`, [id]);
  } catch (error) {
    console.error("Error deleting user:", error);
  }
}

// =====================
// AUTH FUNCTIONS
// =====================
async function registerUser(username, email, password) {
  try {
    const sql = "INSERT INTO registered_users (username, email, password) VALUES (?, ?, ?)";
    const [result] = await db.query(sql, [username, email, password]);
    return { success: true, insertId: result.insertId };
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new Error("Email already exists");
    }
    console.error("Error registering user:", err);
    throw err;
  }
}

async function loginUser(email, password) {
  try {
    const sql = "SELECT * FROM registered_users WHERE email = ? AND password = ?";
    const [rows] = await db.query(sql, [email, password]);
    return rows;
  } catch (err) {
    console.error("Error logging in user:", err);
    throw err;
  }
}

// ========================
// Transaction Model
// ========================
async function transaction_details(
  user_id,
  user_name,
  amount_paid,
  payment_method,
  previous_pending,
  new_pending
) {
  try {
    const sql = `
      INSERT INTO transaction_details 
      (user_id, user_name, amount_paid, payment_method, previous_pending, new_pending) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      user_id,
      user_name,
      amount_paid,
      payment_method,
      previous_pending,
      new_pending
    ]);

    return { success: true, insertId: result.insertId };
  } catch (err) {
    console.error("Error inserting transaction details:", err);
    throw err;
  }
}

async function transaction_show() {
  try {
    const [rows] = await db.query(`
      SELECT 
        transaction_id,
        user_id,
        user_name,
        amount_paid,
        DATE_FORMAT(payment_date, '%Y-%m-%d %H:%i:%s') AS payment_date,
        payment_method,
        previous_pending,
        new_pending
      FROM transaction_details
      ORDER BY transaction_id DESC
    `);
    return rows;
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    throw error;
  }
}

// ✅ Single export statement (NO DUPLICATES)
export {
  show,
  getuser,
  insertdata,
  updateuser,
  deleteUser,
  updatename,
  updatephn,
  registerUser,
  loginUser,
  transaction_details,
  transaction_show
};
