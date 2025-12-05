import { useState, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, addDays } from 'date-fns';

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
  verse?: string;
}

interface DailyExpense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  type: 'needs' | 'wants' | 'savings';
}

interface WeeklyBudget {
  id: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  dailyExpenses: DailyExpense[];
  notes?: string;
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

  useEffect(() => {
    const savedForm = localStorage.getItem("form");
    const savedResult = localStorage.getItem("result");
    const savedHistory = localStorage.getItem("history");
  
    if (savedForm) setForm(JSON.parse(savedForm));
    if (savedResult) setResult(JSON.parse(savedResult));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);
  
  useEffect(() => {
    localStorage.setItem("form", JSON.stringify(form));
  }, [form]);
  
  useEffect(() => {
    localStorage.setItem("result", JSON.stringify(result));
  }, [result]);
  
  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  const dailyVerses = [
    "Trust in the Lord with all your heart and lean not on your own understanding. - Proverbs 3:5",
    "I can do all this through him who gives me strength. - Philippians 4:13",
    "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you. - Jeremiah 29:11",
    "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you. - Joshua 1:9",
    "Cast all your anxiety on him because he cares for you. - 1 Peter 5:7",
    "The Lord will fight for you; you need only to be still. - Exodus 14:14",
    "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. - Philippians 4:6",
    "Commit to the Lord whatever you do, and he will establish your plans. - Proverbs 16:3",
    "And my God will meet all your needs according to the riches of his glory in Christ Jesus. - Philippians 4:19",
    "The Lord is my shepherd, I lack nothing. - Psalm 23:1"
  ];

  const [isClient, setIsClient] = useState(false);
  const [dailyVerse, setDailyVerse] = useState("");
  const [currentVerse, setCurrentVerse] = useState("");

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
  const [newRecurringExpense, setNewRecurringExpense] = useState<Omit<RecurringExpense, 'id'>>({
    name: '',
    amount: 0,
    type: 'needs'
  });
  const [isRecurringExpensesOpen, setIsRecurringExpensesOpen] = useState(false);

  const [weeklyBudgets, setWeeklyBudgets] = useState<WeeklyBudget[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeeklyBudget | null>(null);
  const [newExpense, setNewExpense] = useState<Omit<DailyExpense, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: '',
    description: '',
    type: 'needs'
  });

  useEffect(() => {
    setIsClient(true);
    setDailyVerse(dailyVerses[Math.floor(Math.random() * dailyVerses.length)]);
    setCurrentVerse(dailyVerses[Math.floor(Math.random() * dailyVerses.length)]);
  }, []);

  const refreshVerse = () => {
    const newVerse = dailyVerses[Math.floor(Math.random() * dailyVerses.length)];
    setDailyVerse(newVerse);
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


  const handleNewRecurringExpenseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewRecurringExpense(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const addRecurringExpense = () => {
    if (newRecurringExpense.name && newRecurringExpense.amount > 0) {
      setRecurringExpenses(prev => [...prev, {
        ...newRecurringExpense,
        id: Date.now().toString()
      }]);
      setNewRecurringExpense({
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
      recurringExpenses: recurringExpenses,
      verse: currentVerse
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
      { name: "invest", label: "Robinhood Investment" },
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
        'Robinhood Investment',
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
          position: 'bottom' as const,
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

  const getCategoryStatus = (
    actual: number,
    target: number,
    category: 'needs' | 'wants' | 'savings'
  ): { text: string; color: string; icon: string } => {
    const difference = actual - target;

    if (category === 'savings') {
      if (actual >= target * 0.9) {
        return { text: "On Target", color: "text-green-600 bg-green-50", icon: "✅" };
      } else {
        return { text: "Under", color: "text-yellow-600 bg-yellow-50", icon: "⚠️" };
      }
    }

    if (actual <= target * 1.1 && actual >= target * 0.9) {
      return { text: "On Target", color: "text-yellow-600 bg-yellow-50", icon: "⚠️" };
    } else if (actual < target * 0.9) {
      return { text: "Under", color: "text-green-600 bg-green-50", icon: "💸" };
    } else {
      return { text: "Over", color: "text-red-600 bg-red-50", icon: "⚠️" };
    }
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const weeklyVerses = [
    "Honor the Lord with your wealth, with the firstfruits of all your crops. - Proverbs 3:9",
    "Whoever can be trusted with very little can also be trusted with much. - Luke 16:10",
    "The plans of the diligent lead to profit as surely as haste leads to poverty. - Proverbs 21:5",
    "Do not store up for yourselves treasures on earth, but store up for yourselves treasures in heaven. - Matthew 6:19-20",
    "Give, and it will be given to you. A good measure, pressed down, shaken together and running over. - Luke 6:38",
    "The wise store up choice food and olive oil, but fools gulp theirs down. - Proverbs 21:20",
    "Better a little with the fear of the Lord than great wealth with turmoil. - Proverbs 15:16",
    "Keep your lives free from the love of money and be content with what you have. - Hebrews 13:5",
    "One person gives freely, yet gains even more; another withholds unduly, but comes to poverty. - Proverbs 11:24",
    "Remember this: Whoever sows sparingly will also reap sparingly, and whoever sows generously will also reap generously. - 2 Corinthians 9:6"
  ];

  const getRandomVerse = () => {
    return weeklyVerses[Math.floor(Math.random() * weeklyVerses.length)];
  };

  const getBiggestCategory = (needs: number, wants: number): string => {
    if (needs > wants) return "Needs";
    if (wants > needs) return "Wants";
    return "Equal";
  };

  const formatChartData = (history: BudgetEntry[]) => {
    const weeklyData = history.reduce((acc, entry) => {
      const weekStart = startOfWeek(new Date(entry.date), { weekStartsOn: 1 });
      const weekKey = weekStart.toISOString();
      
      if (!acc[weekKey]) {
        acc[weekKey] = {
          date: format(weekStart, 'MMM dd'),
          spent: 0,
          saved: 0
        };
      }
      
      acc[weekKey].spent += entry.needs.total + entry.wants.total;
      acc[weekKey].saved += entry.savings.total;
      
      return acc;
    }, {} as { [key: string]: { date: string; spent: number; saved: number } });

    return Object.values(weeklyData).reverse();
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

  const getAICoachMessage = (data: BudgetEntry) => {
    const totalIncome = parseFloat(data.totalMoney) + parseFloat(data.paycheck);
    const needsPercentage = (data.needs.total / totalIncome) * 100;
    const wantsPercentage = (data.wants.total / totalIncome) * 100;
    const savingsPercentage = (data.savings.total / totalIncome) * 100;

    // Analyze spending patterns
    const isNeedsOver = needsPercentage > 55;
    const isNeedsUnder = needsPercentage < 45;
    const isWantsOver = wantsPercentage > 35;
    const isWantsUnder = wantsPercentage < 25;
    const isSavingsOver = savingsPercentage > 25;
    const isSavingsUnder = savingsPercentage < 15;

    // Generate personalized message
    let message = "";
    let emoji = "🎯";
    let tone = "text-blue-800";

    if (isSavingsOver) {
      message = `Excellent work! You're saving ${savingsPercentage.toFixed(1)}% of your income, which exceeds your 20% target. This is a great foundation for your financial future!`;
      emoji = "🌟";
      tone = "text-green-800";
    } else if (isSavingsUnder) {
      message = `Your savings rate is ${savingsPercentage.toFixed(1)}%, which is below the recommended 20%. Consider setting aside a bit more for your future goals.`;
      emoji = "💡";
      tone = "text-yellow-800";
    }

    if (isWantsOver) {
      message = `Your wants category (${wantsPercentage.toFixed(1)}%) is higher than the recommended 30%. Try to identify areas where you can reduce discretionary spending.`;
      emoji = "🎯";
      tone = "text-orange-800";
    }

    if (isNeedsOver) {
      message = `Your essential needs (${needsPercentage.toFixed(1)}%) are taking up more than the recommended 50%. Consider reviewing your fixed expenses to find potential savings.`;
      emoji = "📊";
      tone = "text-red-800";
    }

    if (!isNeedsOver && !isWantsOver && !isSavingsUnder) {
      message = `Perfect balance! You're following the 50/30/20 rule closely. Keep up the great work!`;
      emoji = "🎉";
      tone = "text-green-800";
    }

    return { message, emoji, tone };
  };

  // Load weekly budgets from localStorage
  useEffect(() => {
    const savedBudgets = localStorage.getItem('weeklyBudgets');
    if (savedBudgets) {
      setWeeklyBudgets(JSON.parse(savedBudgets));
    }
  }, []);

  // Save weekly budgets to localStorage when they change
  useEffect(() => {
    localStorage.setItem('weeklyBudgets', JSON.stringify(weeklyBudgets));
  }, [weeklyBudgets]);

  const getCurrentWeek = () => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
    const end = endOfWeek(today, { weekStartsOn: 1 });
    return { start, end };
  };

  const createNewWeek = () => {
    const { start, end } = getCurrentWeek();
    const newWeek: WeeklyBudget = {
      id: Date.now().toString(),
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalBudget: 0,
      dailyExpenses: []
    };
    setWeeklyBudgets(prev => [...prev, newWeek]);
    setSelectedWeek(newWeek);
  };

  const calculateRemainingBudget = (week: WeeklyBudget) => {
    const totals = getWeeklyTotals(week);
    const totalSpent = Object.values(totals).reduce((sum, amount) => sum + amount, 0);
    return week.totalBudget - totalSpent;
  };

  const calculateCategoryPercentages = (week: WeeklyBudget) => {
    const totals = getWeeklyTotals(week);
    const totalSpent = Object.values(totals).reduce((sum, amount) => sum + amount, 0);
    
    return {
      needs: ((totals.needs || 0) / totalSpent) * 100,
      wants: ((totals.wants || 0) / totalSpent) * 100,
      savings: ((totals.savings || 0) / totalSpent) * 100
    };
  };

  const addExpense = (weekId: string) => {
    if (newExpense.amount <= 0 || !newExpense.category || !newExpense.description) return;

    const expense: DailyExpense = {
      ...newExpense,
      id: Date.now().toString()
    };

    setWeeklyBudgets(prev => prev.map(week => {
      if (week.id === weekId) {
        const updatedWeek = {
          ...week,
          dailyExpenses: [...week.dailyExpenses, expense]
        };
        
        // Update the selected week if it's the current week
        if (selectedWeek?.id === weekId) {
          setSelectedWeek(updatedWeek);
        }
        
        return updatedWeek;
      }
      return week;
    }));

    // Reset form
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      category: '',
      description: '',
      type: 'needs'
    });
  };

  const removeExpense = (weekId: string, expenseId: string) => {
    setWeeklyBudgets(prev => prev.map(week => {
      if (week.id === weekId) {
        const updatedWeek = {
          ...week,
          dailyExpenses: week.dailyExpenses.filter(expense => expense.id !== expenseId)
        };
        
        // Update the selected week if it's the current week
        if (selectedWeek?.id === weekId) {
          setSelectedWeek(updatedWeek);
        }
        
        return updatedWeek;
      }
      return week;
    }));
  };

  const getWeeklyTotals = (week: WeeklyBudget) => {
    return week.dailyExpenses.reduce((acc, expense) => {
      acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
      return acc;
    }, {} as { [key: string]: number });
  };

  // Update the renderWeeklyCalendar function
  const renderWeeklyCalendar = () => (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">📅 Daily Expense Tracker</h2>
        <button
          onClick={createNewWeek}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start New Week
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Week Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Select Week</h3>
          <div className="space-y-2">
            {weeklyBudgets.map(week => (
              <button
                key={week.id}
                onClick={() => setSelectedWeek(week)}
                className={`w-full p-4 text-left rounded-lg transition-colors ${
                  selectedWeek?.id === week.id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    Week of {format(new Date(week.startDate), 'MMM dd')} - {format(new Date(week.endDate), 'MMM dd')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {week.dailyExpenses.length} expenses
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Expense Form and List */}
        {selectedWeek && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Budget Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Budget</p>
                  <p className="text-xl font-bold text-blue-900">${selectedWeek.totalBudget.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className="text-xl font-bold text-blue-900">${calculateRemainingBudget(selectedWeek).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800">Add Daily Expense</h3>
            <div className="space-y-3">
              <input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                className="w-full p-2 border rounded"
                min={selectedWeek.startDate}
                max={selectedWeek.endDate}
              />
              <input
                type="number"
                value={newExpense.amount || ''}
                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="Amount"
                className="w-full p-2 border rounded"
                step="0.01"
                min="0"
              />
              <input
                type="text"
                value={newExpense.category}
                onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Category"
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                value={newExpense.description}
                onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
                className="w-full p-2 border rounded"
              />
              <select
                value={newExpense.type}
                onChange={(e) => setNewExpense(prev => ({ ...prev, type: e.target.value as 'needs' | 'wants' | 'savings' }))}
                className="w-full p-2 border rounded"
              >
                <option value="needs">Needs</option>
                <option value="wants">Wants</option>
                <option value="savings">Savings</option>
              </select>
              <button
                onClick={() => addExpense(selectedWeek.id)}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Add Expense
              </button>
            </div>

            {/* Daily Expense List */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-800 mb-3">Daily Expenses</h4>
              <div className="space-y-4">
                {Array.from({ length: 7 }).map((_, index) => {
                  const day = addDays(new Date(selectedWeek.startDate), index);
                  const dayExpenses = selectedWeek.dailyExpenses.filter(
                    expense => expense.date === format(day, 'yyyy-MM-dd')
                  );

                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <h5 className="font-medium text-gray-700 mb-2">
                        {format(day, 'EEEE, MMMM d')}
                      </h5>
                      {dayExpenses.length > 0 ? (
                        <div className="space-y-2">
                          {dayExpenses.map(expense => (
                            <div key={expense.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div>
                                <p className="font-medium">{expense.category}</p>
                                <p className="text-sm text-gray-600">{expense.description}</p>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className="font-medium">${expense.amount.toFixed(2)}</span>
                                <button
                                  onClick={() => removeExpense(selectedWeek.id, expense.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No expenses recorded for this day</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Weekly Summary */}
              {selectedWeek.dailyExpenses.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-4">Weekly Summary</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-xl font-bold text-blue-900">
                        ${Object.values(getWeeklyTotals(selectedWeek)).reduce((sum, amount) => sum + amount, 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Saved</p>
                      <p className="text-xl font-bold text-green-600">
                        ${(selectedWeek.totalBudget - Object.values(getWeeklyTotals(selectedWeek)).reduce((sum, amount) => sum + amount, 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(getWeeklyTotals(selectedWeek)).map(([type, amount]) => {
                      const percentages = calculateCategoryPercentages(selectedWeek);
                      return (
                        <div key={type} className="text-center">
                          <p className="text-sm text-gray-600 capitalize">{type}</p>
                          <p className="font-bold text-blue-900">${amount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            {percentages[type as keyof typeof percentages]?.toFixed(1)}% of total
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Calculate stats for overview panel
  const totalAvailable = parseFloat(form.totalMoney || '0') + parseFloat(form.paycheck || '0');
  const totalSpent = result ? (result.actual.needs.total + result.actual.wants.total) : 0;
  const totalSaved = result ? result.actual.savings.total : 0;
  const remainingBalance = totalAvailable - totalSpent;

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-3xl mb-4 shadow-lg">
            💸
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Personalized Budget Planner</h1>
          <p className="text-lg text-gray-600">Take Control of Your Finances, One Week At a Time</p>
        </div>

        {/* Top Overview Panel */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Today's Date */}
            <div className="lg:col-span-1">
              <p className="text-sm text-gray-600 mb-1">Today's Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>

            {/* Verse of the Day */}
            {isClient && (
              <div className="lg:col-span-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">📖 Verse of the Day</p>
                  <button
                    onClick={refreshVerse}
                    className="p-1 text-gray-600 hover:text-purple-600 transition-colors"
                    title="Get new verse"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-700 italic line-clamp-2">"{dailyVerse}"</p>
              </div>
            )}

            {/* Total Available Money */}
            <div className="lg:col-span-1">
              <p className="text-sm text-gray-600 mb-1">Total Available Money</p>
              <p className="text-2xl font-bold text-blue-600">${totalAvailable.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {form.totalMoney && form.paycheck ? (
                  <>${parseFloat(form.totalMoney).toFixed(2)} + ${parseFloat(form.paycheck).toFixed(2)}</>
                ) : (
                  'Enter starting balance and income'
                )}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="lg:col-span-1 grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Spent</p>
                <p className="text-lg font-semibold text-red-600">${totalSpent.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Saved</p>
                <p className="text-lg font-semibold text-green-600">${totalSaved.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Remaining</p>
                <p className="text-lg font-semibold text-purple-600">${remainingBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Calendar Section (temporarily disabled)
        {renderWeeklyCalendar()}
        */}

        {/* Main Two-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Tag Selector */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {categoryTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagChange(tag.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      form.tags.includes(tag.id)
                        ? `${tag.color} ring-2 ring-offset-2 ring-blue-500`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info Cards */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Date</label>
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Starting Balance</label>
                    <input
                      type="number"
                      name="totalMoney"
                      value={form.totalMoney}
                      onChange={handleChange}
                      placeholder="Enter your current total money"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Income (This Week)</label>
                    <input
                      type="number"
                      name="paycheck"
                      value={form.paycheck}
                      onChange={handleChange}
                      placeholder="Enter the amount you made this week"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Needs Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="p-4 bg-blue-50 rounded-lg mb-4">
                  <h3 className="text-lg font-medium text-blue-800">Essential Needs (50%)</h3>
                </div>
                <div className="space-y-4">
                  {categories.needs.map(({ name, label }) => (
                    <div key={name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                      </label>
                      <input
                        type="number"
                        name={name}
                        value={form[name as keyof typeof form]}
                        onChange={handleChange}
                        placeholder={`Enter ${label.toLowerCase()} amount`}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Wants Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="p-4 bg-green-50 rounded-lg mb-4">
                  <h3 className="text-lg font-medium text-green-800">Wants (30%)</h3>
                </div>
                <div className="space-y-4">
                  {categories.wants.map(({ name, label }) => (
                    <div key={name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                      </label>
                      <input
                        type="number"
                        name={name}
                        value={form[name as keyof typeof form]}
                        onChange={handleChange}
                        placeholder={`Enter ${label.toLowerCase()} amount`}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Savings Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="p-4 bg-purple-50 rounded-lg mb-4">
                  <h3 className="text-lg font-medium text-purple-800">Savings & Investments (20%)</h3>
                </div>
                <div className="space-y-4">
                  {categories.savings.map(({ name, label }) => (
                    <div key={name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                      </label>
                      <input
                        type="number"
                        name={name}
                        value={form[name as keyof typeof form]}
                        onChange={handleChange}
                        placeholder={`Enter ${label.toLowerCase()} amount`}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes and Submit */}
              <div className="bg-white rounded-xl shadow-md p-6">
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[80px] resize-y"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transform transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Calculate Budget
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN */}
          {result && (
            <div className="space-y-6">
              {/* Results Section */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-blue-800">
                      {new Date(form.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

              {form.goalTarget && (
                <div className="mb-4 p-3 bg-purple-50 rounded">
                  <h3 className="font-medium text-purple-800 mb-2">Weekly Goal Progress</h3>
                  <div className="grid grid-cols-2 gap-4">
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

                <div className="flex flex-col items-center justify-center">
                  {getChartData() && (
                    <div className="flex flex-col items-center w-full">
                      <div className="w-[250px] md:w-[300px] mx-auto">
                        <Pie data={getChartData()!.data} options={{
                          ...getChartData()!.options,
                          plugins: {
                            ...getChartData()!.options.plugins,
                            legend: {
                              ...getChartData()!.options.plugins.legend,
                              position: 'bottom' as const,
                              labels: {
                                ...getChartData()!.options.plugins.legend.labels,
                                boxWidth: 15,
                                padding: 15,
                                font: {
                                  size: 11
                                }
                              }
                            }
                          }
                        }} />
                      </div>
                    </div>
                  )}

                  {/* AI Budget Coach Section */}
                  <div className="w-full mt-6 -ml-4">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 shadow-sm min-h-[200px]">
                      <div className="flex items-center mb-4">
                        <span className="text-3xl mr-3">🧠</span>
                        <h3 className="text-xl font-semibold text-gray-800">AI Budget Coach</h3>
                      </div>
                      {history.length > 0 && (
                        <div className="space-y-4">
                          {(() => {
                            const latestEntry = history[0];
                            const { message, emoji, tone } = getAICoachMessage(latestEntry);
                            return (
                              <div className="flex items-start space-x-4">
                                <span className="text-3xl">{emoji}</span>
                                <p className={`text-base ${tone} leading-relaxed`}>{message}</p>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          )}
        </div>

        {/* History Section */}
        {result && (
          <div className="mt-12 max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📅 Past Budgets</h2>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Clear All History
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No past budgets recorded yet.</p>
              ) : (
                <div className="space-y-6">
                  {history.map((entry, index) => {
                    const totalAvailable = parseFloat(entry.totalMoney) + parseFloat(entry.paycheck);
                    const needsPercentage = (entry.needs.total / totalAvailable) * 100;
                    const wantsPercentage = (entry.wants.total / totalAvailable) * 100;
                    const savingsPercentage = (entry.savings.total / totalAvailable) * 100;

                    const needsStatus = getCategoryStatus(needsPercentage, 50, 'needs');
                    const wantsStatus = getCategoryStatus(wantsPercentage, 30, 'wants');
                    const savingsStatus = getCategoryStatus(savingsPercentage, 20, 'savings');

                    const totalSpent = entry.needs.total + entry.wants.total;
                    const biggestCategory = getBiggestCategory(entry.needs.total, entry.wants.total);

                    return (
                      <div key={index} className="bg-slate-50 rounded-lg p-6 transform transition-all hover:scale-[1.01]">
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
  <p className="text-gray-600">Income (This Week)</p>
  <p className="font-medium">
    ${parseFloat(entry.paycheck).toFixed(2)}
  </p>

  <p className="text-xs text-gray-500 mt-1">
    Starting Balance: ${parseFloat(entry.totalMoney).toFixed(2)}
  </p>
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
                            <p className="text-sm text-gray-700 italic">"{entry.verse || ''}"</p>
                          </div>
                        </div>

                        {/* Add Notes and Tags display */}
                        {(entry.notes || (entry.tags && entry.tags.length > 0)) && (
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
          </div>
        )}
      </div>
    </main>
  );
}
