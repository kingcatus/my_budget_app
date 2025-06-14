import { useState, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer } from 'recharts';

ChartJS.register(ArcElement, Tooltip, Legend);

interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  type: 'needs' | 'wants';
}

interface BudgetEntry {
  date: string;
  totalMoney: string;
  paycheck: string;
  needs: { total: number; breakdown: { [key: string]: number } };
  wants: { total: number; breakdown: { [key: string]: number } };
  savings: { total: number; breakdown: { [key: string]: number } };
  goalTarget: string;
  notes?: string;
  tags?: string[];
  recurringExpenses: RecurringExpense[];
}

export default function Home() {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    totalMoney: "",
    paycheck: "",
    goalTarget: "", // Add goal target field
    notes: "",
    tags: [] as string[],
    // Needs categories
    food: "",
    rent: "",
    utilities: "",
    // Wants categories
    uber: "",
    clothes: "",
    entertainment: "",
    // Savings categories
    invest: "",
    emergency: "",
  });

  const [result, setResult] = useState<null | {
    suggested: {
      needs: { total: number; breakdown: { [key: string]: number } };
      wants: { total: number; breakdown: { [key: string]: number } };
      savings: { total: number; breakdown: { [key: string]: number } };
    };
    actual: {
      needs: { total: number; breakdown: { [key: string]: number } };
      wants: { total: number; breakdown: { [key: string]: number } };
      savings: { total: number; breakdown: { [key: string]: number } };
    };
    comparison: {
      needsDiff: number;
      wantsDiff: number;
      savingsDiff: number;
    };
    projectedTotal: number;
  }>(null);

  const [history, setHistory] = useState<BudgetEntry[]>([]);

  const dailyQuotes = [
    "The only way to do great work is to love what you do.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "Your time is limited, don't waste it living someone else's life.",
    "The best way to predict the future is to create it.",
    "Don't watch the clock; do what it does. Keep going.",
    "The only limit to our realization of tomorrow is our doubts of today.",
    "Believe you can and you're halfway there.",
    "Everything you've ever wanted is on the other side of fear.",
    "The harder you work for something, the greater you'll feel when you achieve it."
  ];

  const [isClient, setIsClient] = useState(false);
  const [dailyQuote, setDailyQuote] = useState("");
  const [currentMotivationalQuote, setCurrentMotivationalQuote] = useState("");

  const categoryTags = [
    { id: 'rent', label: 'Rent', color: 'bg-blue-100 text-blue-800' },
    { id: 'groceries', label: 'Groceries', color: 'bg-green-100 text-green-800' },
    { id: 'transportation', label: 'Transportation', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'entertainment', label: 'Entertainment', color: 'bg-purple-100 text-purple-800' },
    { id: 'subscriptions', label: 'Subscriptions', color: 'bg-pink-100 text-pink-800' },
    { id: 'medical', label: 'Medical', color: 'bg-red-100 text-red-800' },
    { id: 'travel', label: 'Travel', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'miscellaneous', label: 'Miscellaneous', color: 'bg-gray-100 text-gray-800' },
  ];

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [newExpense, setNewExpense] = useState<Omit<RecurringExpense, 'id'>>({
    name: '',
    amount: 0,
    type: 'needs'
  });
  const [isRecurringExpensesOpen, setIsRecurringExpensesOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setDailyQuote(dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)]);
    setCurrentMotivationalQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, []);

  const refreshQuote = () => {
    const newQuote = dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)];
    setDailyQuote(newQuote);
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('budgetHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (entry: BudgetEntry) => {
    const newHistory = [entry, ...history];
    setHistory(newHistory);
    localStorage.setItem('budgetHistory', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('budgetHistory');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagChange = (tagId: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const handleNewExpenseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const addRecurringExpense = () => {
    if (newExpense.name && newExpense.amount > 0) {
      setRecurringExpenses(prev => [...prev, {
        ...newExpense,
        id: Date.now().toString()
      }]);
      setNewExpense({
        name: '',
        amount: 0,
        type: 'needs'
      });
    }
  };

  const removeRecurringExpense = (id: string) => {
    setRecurringExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const updateRecurringExpense = (id: string, updates: Partial<RecurringExpense>) => {
    setRecurringExpenses(prev => prev.map(expense => 
      expense.id === id ? { ...expense, ...updates } : expense
    ));
  };

  const getTotalRecurringExpenses = () => {
    return recurringExpenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalIncome = parseFloat(form.totalMoney) + parseFloat(form.paycheck);
    
    // Calculate totals for each category
    const needsTotal = parseFloat(form.food) + parseFloat(form.rent) + parseFloat(form.utilities);
    const wantsTotal = parseFloat(form.uber) + parseFloat(form.clothes) + parseFloat(form.entertainment);
    const savingsTotal = parseFloat(form.invest) + parseFloat(form.emergency);

    // Calculate suggested budget based on total income
    const suggested = {
      needs: {
        total: totalIncome * 0.5,
        breakdown: {
          food: totalIncome * 0.15,      // 15% of income
          rent: totalIncome * 0.25,      // 25% of income
          utilities: totalIncome * 0.10   // 10% of income
        }
      },
      wants: {
        total: totalIncome * 0.3,
        breakdown: {
          uber: totalIncome * 0.10,      // 10% of income
          clothes: totalIncome * 0.10,    // 10% of income
          entertainment: totalIncome * 0.10 // 10% of income
        }
      },
      savings: {
        total: totalIncome * 0.2,
        breakdown: {
          invest: totalIncome * 0.10,     // 10% of income
          emergency: totalIncome * 0.10,  // 10% of income
        }
      }
    };

    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        income: totalIncome.toString(),
        needs: needsTotal.toString(),
        wants: wantsTotal.toString(),
        savings: savingsTotal.toString()
      }),
    });

    const data = await response.json();
    const result = {
      ...data,
      suggested,
      projectedTotal: totalIncome
    };
    setResult(result);

    // Save to history
    saveToHistory({
      date: form.date,
      totalMoney: form.totalMoney,
      paycheck: form.paycheck,
      needs: result.actual.needs,
      wants: result.actual.wants,
      savings: result.actual.savings,
      goalTarget: form.goalTarget,
      notes: form.notes,
      tags: form.tags,
      recurringExpenses: recurringExpenses
    });

    // Reset notes and tags after submission
    setForm(prev => ({
      ...prev,
      notes: "",
      tags: []
    }));
  };

  const getDifferenceColor = (diff: number, category: 'needs' | 'wants' | 'savings') => {
    if (category === 'savings') {
      // For savings, positive is good (saving more than suggested)
      return diff > 0 ? "text-green-600" : "text-red-600";
    } else {
      // For needs and wants, negative is good (spending less than suggested)
      return diff < 0 ? "text-green-600" : "text-red-600";
    }
  };

  const formatDifference = (diff: number, category: 'needs' | 'wants' | 'savings') => {
    const prefix = category === 'savings' 
      ? (diff > 0 ? "+" : "")
      : (diff < 0 ? "+" : "");
    return `${prefix}$${Math.abs(diff).toFixed(2)}`;
  };

  const categories = {
    needs: [
      { name: "food", label: "Food & Groceries" },
      { name: "rent", label: "Rent/Mortgage" },
      { name: "utilities", label: "Utilities & Bills" }
    ],
    wants: [
      { name: "uber", label: "Transportation (Uber/Taxi)" },
      { name: "clothes", label: "Clothing & Fashion" },
      { name: "entertainment", label: "Entertainment & Fun" }
    ],
    savings: [
      { name: "invest", label: "Investments" },
      { name: "emergency", label: "Emergency Fund" }
    ]
  };

  const getChartData = () => {
    if (!result) return null;

    const data = {
      labels: [
        'Food & Groceries',
        'Rent/Mortgage',
        'Utilities & Bills',
        'Transportation',
        'Clothing',
        'Entertainment',
        'Investments',
        'Emergency Fund'
      ],
      datasets: [
        {
          data: [
            result.actual.needs.breakdown.food,
            result.actual.needs.breakdown.rent,
            result.actual.needs.breakdown.utilities,
            result.actual.wants.breakdown.uber,
            result.actual.wants.breakdown.clothes,
            result.actual.wants.breakdown.entertainment,
            result.actual.savings.breakdown.invest,
            result.actual.savings.breakdown.emergency
          ],
          backgroundColor: [
            '#60A5FA', // Food - Light Blue
            '#3B82F6', // Rent - Blue
            '#2563EB', // Utilities - Dark Blue
            '#34D399', // Transportation - Light Green
            '#10B981', // Clothing - Green
            '#059669', // Entertainment - Dark Green
            '#A78BFA', // Investments - Light Purple
            '#8B5CF6'  // Emergency - Purple
          ],
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };

    const options = {
      plugins: {
        legend: {
          position: 'right' as const,
          labels: {
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const value = context.raw;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
            }
          }
        }
      }
    };

    return { data, options };
  };

  const getCategoryStatus = (actual: number, target: number): { text: string; color: string; icon: string } => {
    const difference = actual - target;
    if (Math.abs(difference) <= 5) {
      return { text: "On Target", color: "text-yellow-600 bg-yellow-50", icon: "✅" };
    } else if (difference > 5) {
      return { text: "Over", color: "text-red-600 bg-red-50", icon: "⚠️" };
    } else {
      return { text: "Under", color: "text-green-600 bg-green-50", icon: "💸" };
    }
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const motivationalQuotes = [
    "Every dollar saved is a step closer to your dreams.",
    "Small steps in saving lead to giant leaps in financial freedom.",
    "Your future self will thank you for your smart choices today.",
    "Budgeting isn't about restriction, it's about making your money work for you.",
    "Financial success is built one budget at a time.",
    "The best time to start saving was yesterday. The second best time is now.",
    "Your budget is your financial roadmap to success.",
    "Smart spending today creates wealth for tomorrow.",
    "Every budget is a chance to build a better financial future.",
    "Your financial goals are within reach, one budget at a time."
  ];

  const getRandomQuote = () => {
    return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
  };

  const getBiggestCategory = (needs: number, wants: number): string => {
    if (needs > wants) return "Needs";
    if (wants > needs) return "Wants";
    return "Equal";
  };

  const formatChartData = (history: BudgetEntry[]) => {
    return history.map(entry => ({
      date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      spent: entry.needs.total + entry.wants.total,
      saved: entry.savings.total
    })).reverse(); // Reverse to show oldest to newest
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          <div className="space-y-1">
            <p className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
              <span className="text-red-600 font-medium">Spent: ${payload[0].value.toFixed(2)}</span>
            </p>
            <p className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              <span className="text-green-600 font-medium">Saved: ${payload[1].value.toFixed(2)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Load recurring expenses from localStorage
  useEffect(() => {
    const savedExpenses = localStorage.getItem('recurringExpenses');
    if (savedExpenses) {
      setRecurringExpenses(JSON.parse(savedExpenses));
    }
  }, []);

  // Save recurring expenses to localStorage when they change
  useEffect(() => {
    localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses));
  }, [recurringExpenses]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Quote of the Day Section */}
      {isClient && (
        <div className="w-full max-w-4xl mb-8">
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-lg shadow-sm relative">
            <button
              onClick={refreshQuote}
              className="absolute top-2 right-2 p-2 text-gray-600 hover:text-purple-600 transition-colors"
              title="Get new quote"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">💫 Quote of the Day</h2>
              <p className="text-gray-700 italic">"{dailyQuote}"</p>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6">📊 Personalized Budget Planner</h1>
      <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Total Money</label>
            <input
              type="number"
              name="totalMoney"
              value={form.totalMoney}
              onChange={handleChange}
              placeholder="Enter your current total money"
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paycheck Amount</label>
            <input
              type="number"
              name="paycheck"
              value={form.paycheck}
              onChange={handleChange}
              placeholder="Enter your paycheck amount"
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-blue-50 rounded">
            <h3 className="text-lg font-medium text-blue-800 mb-3">Essential Needs (50%)</h3>
            {categories.needs.map(({ name, label }) => (
              <div key={name} className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                <input
                  type="number"
                  name={name}
                  value={form[name as keyof typeof form]}
                  onChange={handleChange}
                  placeholder={`Enter ${label.toLowerCase()} amount`}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
            ))}
          </div>

          <div className="p-4 bg-green-50 rounded">
            <h3 className="text-lg font-medium text-green-800 mb-3">Wants (30%)</h3>
            {categories.wants.map(({ name, label }) => (
              <div key={name} className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                <input
                  type="number"
                  name={name}
                  value={form[name as keyof typeof form]}
                  onChange={handleChange}
                  placeholder={`Enter ${label.toLowerCase()} amount`}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
            ))}
          </div>

          <div className="p-4 bg-purple-50 rounded">
            <h3 className="text-lg font-medium text-purple-800 mb-3">Savings & Investments (20%)</h3>
            {categories.savings.map(({ name, label }) => (
              <div key={name} className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                <input
                  type="number"
                  name={name}
                  value={form[name as keyof typeof form]}
                  onChange={handleChange}
                  placeholder={`Enter ${label.toLowerCase()} amount`}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
            ))}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weekly Savings Goal
              </label>
              <input
                type="number"
                name="goalTarget"
                value={form.goalTarget}
                onChange={handleChange}
                placeholder="Enter your target amount for next week"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add notes about this week's budget (optional)"
              className="w-full p-2 border border-gray-300 rounded min-h-[80px] resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spending Categories
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categoryTags.map(tag => (
                <label
                  key={tag.id}
                  className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                    form.tags.includes(tag.id) ? tag.color : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.tags.includes(tag.id)}
                    onChange={() => handleTagChange(tag.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{tag.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-gray-50">
          <button
            type="button"
            onClick={() => setIsRecurringExpensesOpen(!isRecurringExpensesOpen)}
            className="w-full flex items-center justify-between text-left font-medium text-gray-700"
          >
            <span>🔄 Recurring Expenses</span>
            <span className="text-sm text-gray-500">
              Total: ${getTotalRecurringExpenses().toFixed(2)}
            </span>
          </button>

          {isRecurringExpensesOpen && (
            <div className="mt-4 space-y-4">
              {recurringExpenses.length > 0 && (
                <div className="space-y-2">
                  {recurringExpenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={expense.name}
                          onChange={(e) => updateRecurringExpense(expense.id, { name: e.target.value })}
                          className="w-full p-1 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                        />
                        <div className="flex items-center space-x-2 mt-1">
                          <input
                            type="number"
                            value={expense.amount}
                            onChange={(e) => updateRecurringExpense(expense.id, { amount: parseFloat(e.target.value) || 0 })}
                            className="w-24 p-1 border rounded"
                          />
                          <select
                            value={expense.type}
                            onChange={(e) => updateRecurringExpense(expense.id, { type: e.target.value as 'needs' | 'wants' })}
                            className="p-1 border rounded"
                          >
                            <option value="needs">Needs</option>
                            <option value="wants">Wants</option>
                          </select>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRecurringExpense(expense.id)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 bg-white rounded border">
                <div className="space-y-3">
                  <input
                    type="text"
                    name="name"
                    value={newExpense.name}
                    onChange={handleNewExpenseChange}
                    placeholder="Expense name"
                    className="w-full p-2 border rounded"
                  />
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      name="amount"
                      value={newExpense.amount || ''}
                      onChange={handleNewExpenseChange}
                      placeholder="Amount"
                      className="flex-1 p-2 border rounded"
                    />
                    <select
                      name="type"
                      value={newExpense.type}
                      onChange={handleNewExpenseChange}
                      className="p-2 border rounded"
                    >
                      <option value="needs">Needs</option>
                      <option value="wants">Wants</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={addRecurringExpense}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                  >
                    Add Recurring Expense
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Calculate Budget
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 border rounded shadow w-full max-w-4xl bg-white">
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-blue-800">Projected Total After Paycheck</h3>
                <p className="text-2xl font-bold text-blue-900">${result.projectedTotal.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Budget Date</p>
                <p className="font-medium text-blue-800">
                  {new Date(form.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {form.goalTarget && (
            <div className="mb-4 p-3 bg-purple-50 rounded">
              <h3 className="font-medium text-purple-800 mb-2">Weekly Goal Progress</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Desired Amount for Next Week</p>
                  <p className="text-xl font-bold text-purple-900">${parseFloat(form.goalTarget).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining Balance</p>
                  <p className="text-xl font-bold text-purple-900">
                    ${((parseFloat(form.totalMoney) + parseFloat(form.paycheck)) - (result.actual.needs.total + result.actual.wants.total)).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Spent This Week</p>
                  <p className="text-xl font-bold text-purple-900">${(result.actual.needs.total + result.actual.wants.total).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hours Needed to Work</p>
                  <p className={`text-xl font-bold ${parseFloat(form.goalTarget) > ((parseFloat(form.totalMoney) + parseFloat(form.paycheck)) - (result.actual.needs.total + result.actual.wants.total)) ? 'text-red-600' : 'text-green-600'}`}>
                    {Math.ceil(Math.max(0, parseFloat(form.goalTarget) - ((parseFloat(form.totalMoney) + parseFloat(form.paycheck)) - (result.actual.needs.total + result.actual.wants.total))) / 14)} hours
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Suggested Budget (50/30/20 Rule)</h2>
              <ul className="space-y-1">
                <li>🧾 Needs: <strong>${result.suggested.needs.total.toFixed(2)}</strong></li>
                <li>🎈 Wants: <strong>${result.suggested.wants.total.toFixed(2)}</strong></li>
                <li>💰 Savings: <strong>${result.suggested.savings.total.toFixed(2)}</strong></li>
              </ul>

              <h3 className="mt-4 font-medium">Your Input vs. Suggestion</h3>
              <ul className="space-y-1">
                <li className="flex justify-between">
                  <span>Needs Difference:</span>
                  <span className={getDifferenceColor(result.comparison.needsDiff, 'needs')}>
                    {formatDifference(result.comparison.needsDiff, 'needs')}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Wants Difference:</span>
                  <span className={getDifferenceColor(result.comparison.wantsDiff, 'wants')}>
                    {formatDifference(result.comparison.wantsDiff, 'wants')}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Savings Difference:</span>
                  <span className={getDifferenceColor(result.comparison.savingsDiff, 'savings')}>
                    {formatDifference(result.comparison.savingsDiff, 'savings')}
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-center">
              {getChartData() && (
                <div className="w-full max-w-md">
                  <Pie data={getChartData()!.data} options={getChartData()!.options} />
                </div>
              )}
            </div>
          </div>

          {/* History Section */}
          <div className="mt-8 border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">📅 Past Budgets</h2>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                >
                  Clear All History
                </button>
              )}
            </div>
            
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No past budgets recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {history.map((entry, index) => {
                  const totalIncome = parseFloat(entry.totalMoney) + parseFloat(entry.paycheck);
                  const needsPercentage = (entry.needs.total / totalIncome) * 100;
                  const wantsPercentage = (entry.wants.total / totalIncome) * 100;
                  const savingsPercentage = (entry.savings.total / totalIncome) * 100;

                  const needsStatus = getCategoryStatus(needsPercentage, 50);
                  const wantsStatus = getCategoryStatus(wantsPercentage, 30);
                  const savingsStatus = getCategoryStatus(savingsPercentage, 20);

                  const totalSpent = entry.needs.total + entry.wants.total;
                  const biggestCategory = getBiggestCategory(entry.needs.total, entry.wants.total);

                  return (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">
                          Week of {new Date(entry.date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </h3>
                        {entry.goalTarget && (
                          <span className="text-sm text-purple-600">
                            Goal: ${parseFloat(entry.goalTarget).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Income</p>
                          <p className="font-medium">${totalIncome.toFixed(2)}</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-gray-600">Needs</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${needsStatus.color}`}>
                              {needsStatus.icon} {needsStatus.text}
                            </span>
                          </div>
                          <p className="font-medium">${entry.needs.total.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Target: 50% | Actual: {formatPercentage(needsPercentage)}</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-gray-600">Wants</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${wantsStatus.color}`}>
                              {wantsStatus.icon} {wantsStatus.text}
                            </span>
                          </div>
                          <p className="font-medium">${entry.wants.total.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Target: 30% | Actual: {formatPercentage(wantsPercentage)}</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-gray-600">Savings</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${savingsStatus.color}`}>
                              {savingsStatus.icon} {savingsStatus.text}
                            </span>
                          </div>
                          <p className="font-medium">${entry.savings.total.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Target: 20% | Actual: {formatPercentage(savingsPercentage)}</p>
                        </div>
                      </div>

                      {/* Weekly Summary Report */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h4 className="text-lg font-semibold mb-3">💡 Weekly Summary Report</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-600">Total Spent</p>
                            <p className="text-xl font-bold text-gray-800">${totalSpent.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">Needs + Wants</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-600">Total Saved</p>
                            <p className="text-xl font-bold text-green-600">${entry.savings.total.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">Savings + Investments</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-600">Biggest Category</p>
                            <p className="text-xl font-bold text-purple-600">{biggestCategory}</p>
                            <p className="text-xs text-gray-500">
                              {biggestCategory === "Equal" 
                                ? "Equal spending in both categories"
                                : `Highest spending in ${biggestCategory.toLowerCase()}`
                              }
                            </p>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-700 italic">"{currentMotivationalQuote}"</p>
                        </div>
                      </div>

                      {/* Add Recurring Expenses display */}
                      {entry.recurringExpenses && entry.recurringExpenses.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Recurring Expenses</h4>
                          <div className="space-y-2">
                            {entry.recurringExpenses.map(expense => (
                              <div key={expense.id} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">{expense.name}</span>
                                <span className="font-medium">${expense.amount.toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                              <span className="font-medium text-gray-700">Total Recurring</span>
                              <span className="font-bold text-gray-900">
                                ${entry.recurringExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Add Notes and Tags display */}
                      {(entry.notes || entry.tags?.length) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          {entry.notes && (
                            <p className="text-gray-600 italic mb-2">"{entry.notes}"</p>
                          )}
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {entry.tags.map(tagId => {
                                const tag = categoryTags.find(t => t.id === tagId);
                                return tag ? (
                                  <span
                                    key={tagId}
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${tag.color}`}
                                  >
                                    {tag.label}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly Budget Comparison Chart */}
          <div className="mt-8 border-t pt-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">📊 Weekly Budget Trends</h2>
              <p className="text-gray-600 mt-1">Track your spending and saving patterns over time</p>
            </div>
            
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Add budgets to see your spending and saving trends.</p>
            ) : (
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={formatChartData(history)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        label={{ value: 'Week', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                        label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', offset: 10 }}
                      />
                      <RechartsTooltip 
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                      />
                      <RechartsLegend 
                        verticalAlign="top" 
                        height={36}
                        wrapperStyle={{
                          paddingTop: '20px'
                        }}
                      />
                      <Bar 
                        dataKey="spent" 
                        name="Spent" 
                        fill="#EF4444" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                      <Bar 
                        dataKey="saved" 
                        name="Saved" 
                        fill="#10B981" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
