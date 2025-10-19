// Backend/backend.js
const {show, getuser, insertdata, 
    deleteUser,updateuser, 
    transaction_show, transaction_details,
    updatename, updatephn,registerUser,loginUser} = require("./db.js");
const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve static files from the Public folder
app.use(express.static(path.join(__dirname, "public"))); // serve frontend
app.use('/interface', express.static(path.join(__dirname, 'interface')));


app.get('/users', async (req, res) => {
  const users = await show();
  res.send(users);
});

// ========================
// Transaction Routes
// ========================

// GET - Fetch all transactions
app.get('/transactions', async (req, res) => {
  try {
    const transactions = await transaction_show();
    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    res.status(500).json({ message: error.message });
  }
});

// POST - Create new transaction
app.post('/transactions', async (req, res) => {
  try {
    const {
      user_id,
      user_name,
      amount_paid,
      payment_method,
      previous_pending,
      new_pending
    } = req.body;

    // Validation
    if (!user_id || !user_name || !amount_paid || !payment_method) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newTransaction = await transaction_details(
      user_id,
      user_name,
      amount_paid,
      payment_method,
      previous_pending,
      new_pending
    );

    res.status(201).json({
      success: true,
      transaction_id: newTransaction.insertId,
      message: "Transaction recorded successfully"
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/users/:id', async (req, res) => {
    try{
 const user = await getuser(req.params.id);
  res.status(200).send(user);
    }
    catch(error){
        console.error("Error fetching user by ID:", error);
        res.status(500).send({ message: error.message });
    }
});

app.post('/users', async (req, res) => {
    try{
        const {name, phn, status, loan_amt, pending} = req.body;
        const newUser = await insertdata(name, phn, status, loan_amt, pending);
        res.status(201).send(newUser);
    }
    catch(error){
        console.error("Error creating user:", error);
        res.status(500).send({ message: error.message });
    }
});

app.put('/users/:id', async (req, res) => {
    try{
        const id = req.params.id;
        const {name, phn, status, loan_amt, pending} = req.body;
        const updatedUser = await updateuser(id, name, phn, status, loan_amt, pending);
        res.status(200).send(updatedUser);
    }
    catch(error){
        console.error("Error updating user:", error);
        res.status(500).send({ message: error.message });
    }
});

app.delete('/users/:id', async (req, res) => {
    try{
        const id = req.params.id;
        await deleteUser(id);
        res.status(204).send();
    }
    catch(error){
        console.error("Error deleting user:", error);
        res.status(500).send({ message: error.message });
    }
});


 app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const result = await registerUser(username, email, password);
    res.status(201).json({
      success: true,
      message: "Registered successfully!",
      userId: result.insertId,
    });
  } catch (error) {
    if (error.message === "Email already exists") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Registration error:", error);
    res.status(500).json({ message: "Database error" });
  }
});

// ==============================
// ✅ LOGIN USER
// ==============================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const users = await loginUser(email, password);

    if (users.length === 0)
      return res.status(401).json({ message: "Invalid credentials" });

    res.json({ success: true, message: "Login successful!" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Database error" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
