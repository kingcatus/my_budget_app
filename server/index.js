// --- 1. Load Dependencies ---
const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 5000;

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
    const { budget_date, income, needs_data, wants_data, savings_data, notes } = req.body;

    // Validate required fields
    if (!budget_date || income === undefined || !needs_data || !wants_data || !savings_data) {
      return res.status(400).json({ 
        error: 'Missing required fields: budget_date, income, needs_data, wants_data, and savings_data are required' 
      });
    }

    // Insert into budget_entries table using parameterized query
    const query = `
      INSERT INTO budget_entries (budget_date, income, needs_data, wants_data, savings_data, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const values = [
      budget_date,
      income,
      needs_data, // node-postgres automatically handles JSONB conversion
      wants_data,
      savings_data,
      notes || null
    ];

    const result = await pool.query(query, values);
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

// --- 4. Start the Server ---
app.listen(port, () => {
  console.log(`🚀 BudgetApp Server listening on http://localhost:${port}`);
});