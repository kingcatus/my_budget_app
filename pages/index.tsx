import { useState, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface BudgetEntry {
  date: string;
  totalMoney: string;
  paycheck: string;
  needs: { total: number; breakdown: { [key: string]: number } };
  wants: { total: number; breakdown: { [key: string]: number } };
  savings: { total: number; breakdown: { [key: string]: number } };
  goalTarget: string;
}

export default function Home() {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    totalMoney: "",
    paycheck: "",
    goalTarget: "", // Add goal target field
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
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
      goalTarget: form.goalTarget
    });
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
