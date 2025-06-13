import { useState } from "react";

export default function Home() {
  const [form, setForm] = useState({
    totalMoney: "",
    paycheck: "",
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
    setForm({ ...form, [name]: value });
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

  const getDifferenceColor = (diff: number) => {
    if (diff > 0) return "text-green-600";
    if (diff < 0) return "text-red-600";
    return "text-gray-600";
  };

  const formatDifference = (diff: number) => {
    const prefix = diff > 0 ? "+" : "";
    return `${prefix}$${diff.toFixed(2)}`;
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-6">📊 Personalized Budget Planner</h1>
      <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm">
        <div className="space-y-4">
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
        <div className="mt-6 p-4 border rounded shadow w-full max-w-md bg-white">
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <h3 className="font-medium text-blue-800">Projected Total After Paycheck</h3>
            <p className="text-2xl font-bold text-blue-900">${result.projectedTotal.toFixed(2)}</p>
          </div>

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
              <span className={getDifferenceColor(result.comparison.needsDiff)}>
                {formatDifference(result.comparison.needsDiff)}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Wants Difference:</span>
              <span className={getDifferenceColor(result.comparison.wantsDiff)}>
                {formatDifference(result.comparison.wantsDiff)}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Savings Difference:</span>
              <span className={getDifferenceColor(result.comparison.savingsDiff)}>
                {formatDifference(result.comparison.savingsDiff)}
              </span>
            </li>
          </ul>
        </div>
      )}
    </main>
  );
}
