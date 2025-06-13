import { useState } from "react";

export default function Home() {
  const [form, setForm] = useState({
    income: "",
    needs: "",
    wants: "",
    savings: "",
  });

  const [result, setResult] = useState<null | {
    suggested: { needs: number; wants: number; savings: number };
    actual: { needs: number; wants: number; savings: number };
    comparison: { needsDiff: number; wantsDiff: number; savingsDiff: number };
  }>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    setResult(data);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-6">📊 Personalized Budget Planner</h1>
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
        {["income", "needs", "wants", "savings"].map((field) => (
          <input
            key={field}
            type="number"
            name={field}
            value={form[field as keyof typeof form]}
            onChange={handleChange}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        ))}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Submit Budget
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 border rounded shadow w-full max-w-md bg-white">
          <h2 className="text-xl font-semibold mb-2">Suggested Budget (50/30/20 Rule)</h2>
          <ul className="space-y-1">
            <li>🧾 Needs: <strong>${result.suggested.needs.toFixed(2)}</strong></li>
            <li>🎈 Wants: <strong>${result.suggested.wants.toFixed(2)}</strong></li>
            <li>💰 Savings: <strong>${result.suggested.savings.toFixed(2)}</strong></li>
          </ul>

          <h3 className="mt-4 font-medium">Your Input vs. Suggestion</h3>
          <ul className="space-y-1">
            <li>Needs Difference: ${result.comparison.needsDiff.toFixed(2)}</li>
            <li>Wants Difference: ${result.comparison.wantsDiff.toFixed(2)}</li>
            <li>Savings Difference: ${result.comparison.savingsDiff.toFixed(2)}</li>
          </ul>
        </div>
      )}
    </main>
  );
}
