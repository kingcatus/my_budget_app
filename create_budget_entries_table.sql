-- Create budget_entries table for storing weekly budget data
CREATE TABLE budget_entries (
    id SERIAL PRIMARY KEY,
    budget_date DATE NOT NULL,
    income NUMERIC(10, 2) NOT NULL,
    needs_data JSONB NOT NULL,
    wants_data JSONB NOT NULL,
    savings_data JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on budget_date for faster queries
CREATE INDEX idx_budget_entries_date ON budget_entries(budget_date);

-- Create an index on created_at for chronological queries
CREATE INDEX idx_budget_entries_created_at ON budget_entries(created_at);



