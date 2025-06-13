import { useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

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
    goals: "",
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
    const savingsTotal = parseFloat(form.invest) + parseFloat(form.emergency) + parseFloat(form.goals);

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
    setResult({
      ...data,
      projectedTotal: totalIncome
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
      { name: "emergency", label: "Emergency Fund" },
      { name: "goals", label: "Financial Goals" }
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
        'Emergency Fund',
        'Financial Goals'
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
            result.actual.savings.breakdown.emergency,
            result.actual.savings.breakdown.goals
          ],
          backgroundColor: [
            '#60A5FA', // Food - Light Blue
            '#3B82F6', // Rent - Blue
            '#2563EB', // Utilities - Dark Blue
            '#34D399', // Transportation - Light Green
            '#10B981', // Clothing - Green
            '#059669', // Entertainment - Dark Green
            '#A78BFA', // Investments - Light Purple
            '#8B5CF6', // Emergency - Purple
            '#7C3AED'  // Goals - Dark Purple
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
              <h3 className="font-medium text-purple-800 mb-2">Weekly Savings Goal Progress</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Target Amount</p>
                  <p className="text-xl font-bold text-purple-900">${parseFloat(form.goalTarget).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Savings</p>
                  <p className="text-xl font-bold text-purple-900">${result.actual.savings.total.toFixed(2)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Amount Needed by Next Week</p>
                  <p className={`text-xl font-bold ${parseFloat(form.goalTarget) > result.actual.savings.total ? 'text-red-600' : 'text-green-600'}`}>
                    ${(parseFloat(form.goalTarget) - result.actual.savings.total).toFixed(2)}
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
        </div>
      )}
    </main>
  );
}
