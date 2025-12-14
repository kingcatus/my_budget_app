// --- 1. Load Dependencies ---
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
const port = 5000;

// --- Configure CORS to allow frontend requests ---
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// --- Middleware for parsing JSON requests ---
app.use(express.json());

// --- 2. Database Connection Pool ---
// This assumes you have PostgreSQL running and created the database named 'budget_app'
const pool = new Pool({
  user: process.env.DB_USER || 'jon', // Replace 'jon' with your actual PG user if different
  host: 'localhost',
  database: 'budget_app', // The database you created
  password: process.env.DB_PASSWORD, // It's best practice to use environment variables for passwords
  port: 5432,
});

// Test the database connection pool
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    // You might need to change the 'user' or run the server again after fixing the DB connection
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

// --- 3. API Endpoints (Routes) ---

// Root Route
app.get('/', (req, res) => {
  res.json({ message: "Welcome to the BudgetApp API. Access API endpoints starting with /api/" });
});

// Status Route (Test Route)
app.get('/api/status', (req, res) => {
  res.json({ status: "ok", message: "BudgetApp API is running!" });
});

// POST /api/budgets - Create a new budget entry
app.post('/api/budgets', async (req, res) => {
  try {
    // Destructure using frontend's object names
    const { paycheck, needs, wants, savings, budget_date, notes, totalMoney } = req.body;
    
    // Set default value for totalMoney if missing
    const totalMoneyValue = totalMoney !== undefined ? totalMoney : 0;
    
    // Debug: Log received request body
    console.log('RECEIVED BODY:', req.body);

    // Validate required fields
    if (!budget_date || paycheck === undefined || !needs || !wants || !savings) {
      return res.status(400).json({ 
        error: 'Missing required fields: budget_date, paycheck, needs, wants, and savings are required' 
      });
    }

    // Insert into budget_entries table using parameterized query
    // Map frontend keys to database column names:
    // totalMoney -> total_money (or totalMoney if column name matches)
    // paycheck -> income
    // needs -> needs_data
    // wants -> wants_data
    // savings -> savings_data
    const query = `
      INSERT INTO budget_entries (budget_date, total_money, income, needs_data, wants_data, savings_data, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const values = [
      budget_date,
      totalMoneyValue, // Starting balance (totalMoney)
      paycheck,        // Map frontend 'paycheck' to database 'income' column
      needs,           // Map frontend 'needs' to database 'needs_data' JSONB column
      wants,           // Map frontend 'wants' to database 'wants_data' JSONB column
      savings,         // Map frontend 'savings' to database 'savings_data' JSONB column
      notes || null
    ];

    // Debug: Log SQL values before execution
    console.log('SQL VALUES:', values);

    const result = await pool.query(query, values)
      .catch(err => {
        console.error('DATABASE INSERT ERROR:', err.message);
        throw err; // Re-throw to be caught by outer try-catch
      });
    const newEntryId = result.rows[0].id;

    // Return 201 Created with the new entry ID
    res.status(201).json({
      success: true,
      id: newEntryId,
      message: 'Budget entry created successfully'
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// GET /api/budgets - Retrieve all budget entries
app.get('/api/budgets', async (req, res) => {
  try {
    // Query all budget entries ordered by budget_date descending (newest first)
    const query = 'SELECT * FROM budget_entries ORDER BY budget_date DESC';
    
    const result = await pool.query(query);
    
    // Return the array of budget entries as JSON
    res.status(200).json(result.rows);
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// --- 4. Start the Server ---
app.listen(port, () => {
  console.log(`🚀 BudgetApp Server listening on http://localhost:${port}`);
});