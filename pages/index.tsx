import { useState, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie, Doughnut } from 'react-chartjs-2';
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
  id?: number; // Database ID for API operations
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
    baseline: "", // Fixed weekly needs (baseline)
    bufferGoalWeeks: "4", // Target number of weeks for buffer (default 4)
    goalTarget: "", // Add goal target field
    notes: "",
    tags: [] as string[],
    // Needs categories
    food: "",
    rent: "",
    utilities: "",
    transportation: "", // Moved from Wants
    health: "", // New: Health/Medication
    insurance: "", // New: Insurance
    // Wants categories
    clothes: "",
    entertainment: "",
    academic: "", // New: Academic/Career
    digitalSubs: "", // New: Digital Subs
    hobby: "", // New: Hobby/Gear
    // Savings categories
    invest: "",
    emergency: "",
    longTermInvest: "", // New: Long-term Investment
    bigPurchase: "", // New: Big Purchase Goal
  });

  const [result, setResult] = useState<null | {
    mode: 'survival' | 'stable' | 'growth';
    baseline: number;
    excess: number;
    bufferGoal: number;
    isBufferFilling: boolean;
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

  const [isReportVisible, setIsReportVisible] = useState(false);

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

  // Fetch budget history from API - reusable function
  const fetchBudgetHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/budgets');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch budget history: ${response.status} ${response.statusText}`);
      }
      
      const apiData = await response.json();
      
      // Transform API response to BudgetEntry format
      const transformedHistory: BudgetEntry[] = apiData.map((entry: any) => {
        // Ensure id is properly extracted and is a number
        const entryId = entry.id !== undefined && entry.id !== null ? Number(entry.id) : undefined;
        
        // Debug: Log each entry's id during transformation
        console.log('Transforming API entry:', { 
          rawId: entry.id, 
          entryId, 
          budgetDate: entry.budget_date 
        });
        
        return {
          id: entryId, // Preserve database ID for delete operations - EXPLICITLY SET
          date: entry.budget_date || entry.date || '',
          totalMoney: entry.total_money?.toString() || '0',
          paycheck: entry.income?.toString() || '0',
          needs: {
            total: (entry.needs_data?.food || 0) + (entry.needs_data?.rent || 0) + (entry.needs_data?.utilities || 0) +
                   (entry.needs_data?.transportation || 0) + (entry.needs_data?.health || 0) + (entry.needs_data?.insurance || 0),
            breakdown: {
              food: entry.needs_data?.food || 0,
              rent: entry.needs_data?.rent || 0,
              utilities: entry.needs_data?.utilities || 0,
              transportation: entry.needs_data?.transportation || 0,
              health: entry.needs_data?.health || 0,
              insurance: entry.needs_data?.insurance || 0
            }
          },
          wants: {
            // Backward compatible: check for old 'uber' field and map to transportation in needs if present
            total: (entry.wants_data?.clothes || 0) + (entry.wants_data?.entertainment || 0) +
                   (entry.wants_data?.academic || 0) + (entry.wants_data?.digitalSubs || 0) + (entry.wants_data?.hobby || 0) +
                   // Legacy support: include old 'uber' field if it exists
                   (entry.wants_data?.uber || 0),
            breakdown: {
              clothes: entry.wants_data?.clothes || 0,
              entertainment: entry.wants_data?.entertainment || 0,
              academic: entry.wants_data?.academic || 0,
              digitalSubs: entry.wants_data?.digitalSubs || 0,
              hobby: entry.wants_data?.hobby || 0
              // Note: Old 'uber' data will be included in total but not in breakdown (moved to needs)
            }
          },
          savings: {
            total: (entry.savings_data?.invest || 0) + (entry.savings_data?.emergency || 0) +
                   (entry.savings_data?.longTermInvest || 0) + (entry.savings_data?.bigPurchase || 0),
            breakdown: {
              invest: entry.savings_data?.invest || 0,
              emergency: entry.savings_data?.emergency || 0,
              longTermInvest: entry.savings_data?.longTermInvest || 0,
              bigPurchase: entry.savings_data?.bigPurchase || 0
            }
          },
          goalTarget: '',
          notes: entry.notes || undefined,
          tags: [],
          recurringExpenses: [],
          verse: undefined
        };
      });
      
      // CRITICAL: Log the transformed data to verify IDs are present
      console.log('TRANSFORMED DATA:', transformedHistory);
      console.log('TRANSFORMED DATA IDs:', transformedHistory.map(entry => ({ id: entry.id, date: entry.date })));
      
      // Update history state with fetched data
      setHistory(transformedHistory);
      
      // Also save to localStorage for offline access
      localStorage.setItem('budgetHistory', JSON.stringify(transformedHistory));
      
    } catch (error) {
      console.error('Error fetching budget history from API:', error);
      // Keep history as empty array on error (or keep existing localStorage data)
      // Don't overwrite existing history if API fetch fails
    }
  };

  // Fetch budget history from API on component mount
  useEffect(() => {
    fetchBudgetHistory();
  }, []); // Empty dependency array - runs only once on mount

  const saveToHistory = (entry: BudgetEntry) => {
    const newHistory = [entry, ...history];
    setHistory(newHistory);
    localStorage.setItem('budgetHistory', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('budgetHistory');
  };

  // Handle delete budget entry
  const handleDelete = async (id: number) => {
    // Validate ID
    if (!id || typeof id !== 'number' || isNaN(id)) {
      console.error('Invalid ID provided to handleDelete:', id);
      alert('Invalid entry ID. Cannot delete.');
      return;
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete this budget entry?`)) {
      return;
    }

    try {
      console.log(`Deleting budget entry with ID: ${id}`);
      const response = await fetch(`http://localhost:5000/api/budgets/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete budget entry: ${response.status} ${response.statusText}. ${errorText}`);
      }

      // Re-fetch history from API to update the list instantly
      await fetchBudgetHistory();
      
      console.log(`Budget entry with id ${id} deleted successfully`);
    } catch (error) {
      console.error('Error deleting budget entry:', error);
      alert(`Failed to delete budget entry: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    console.log('Button Clicked, Function Running');
    e.preventDefault();
    
    // ============================================
    // STEP 0: IMMEDIATE API REQUEST (FIRST PRIORITY)
    // ============================================
    // Send API request FIRST, before any other logic
    // Calculate minimal data needed for API call
    const amountMadeThisWeek = parseFloat(form.paycheck) || 0;
    
    // Calculate breakdowns for API payload
    const needsBreakdown = {
      food: parseFloat(form.food) || 0,
      rent: parseFloat(form.rent) || 0,
      utilities: parseFloat(form.utilities) || 0,
      transportation: parseFloat(form.transportation) || 0,
      health: parseFloat(form.health) || 0,
      insurance: parseFloat(form.insurance) || 0
    };
    
    const wantsBreakdown = {
      clothes: parseFloat(form.clothes) || 0,
      entertainment: parseFloat(form.entertainment) || 0,
      academic: parseFloat(form.academic) || 0,
      digitalSubs: parseFloat(form.digitalSubs) || 0,
      hobby: parseFloat(form.hobby) || 0
    };
    
    const savingsBreakdown = {
      invest: parseFloat(form.invest) || 0,
      emergency: parseFloat(form.emergency) || 0,
      longTermInvest: parseFloat(form.longTermInvest) || 0,
      bigPurchase: parseFloat(form.bigPurchase) || 0
    };
    
    // Create API payload
    const budgetEntry = {
      budget_date: form.date,
      totalMoney: parseFloat(form.totalMoney) || 0, // Starting balance (calculated inline)
      paycheck: amountMadeThisWeek,
      needs: needsBreakdown,
      wants: wantsBreakdown,
      savings: savingsBreakdown,
      notes: form.notes || null
    };
    
    // Send API request and wait for response to get the ID
    (async () => {
      try {
        console.log('SENDING API REQUEST:', budgetEntry);
        const apiResponse = await fetch("http://localhost:5000/api/budgets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(budgetEntry)
        });
        
        if (apiResponse.status === 201) {
          const apiData = await apiResponse.json();
          const newEntryId = apiData.id;
          console.log("Budget entry saved successfully with ID:", newEntryId);
          
          // CRITICAL: Refresh history from API to get the new entry with its ID
          // This ensures the history state has the correct ID from the database
          await fetchBudgetHistory();
          
          // Reset notes and tags after successful submission
          setForm(prev => ({
            ...prev,
            notes: "",
            tags: []
          }));
        } else {
          const errorData = await apiResponse.json();
          console.error("Failed to save budget entry:", errorData);
        }
      } catch (error) {
        console.error("Error saving budget entry to API:", error);
      }
    })();
    
    // ============================================
    // STEP 1: TIERED MODE BUDGETING CALCULATIONS
    // ============================================
    // All calculations happen immediately, after API request is sent
    
    // Safety checks: Convert all inputs to numbers with fallback to 0
    const startingBalance = parseFloat(form.totalMoney) || 0; // Buffer (protected, not part of spending pool)
    // amountMadeThisWeek already declared above in STEP 0
    const baseline = parseFloat(form.baseline) || 0; // Fixed weekly needs
    const bufferGoalWeeks = parseFloat(form.bufferGoalWeeks) || 4;
    
    // Mode Determination: Compare income vs baseline
    let mode: 'survival' | 'stable' | 'growth';
    if (amountMadeThisWeek < (baseline * 0.9)) {
      mode = 'survival';
    } else if (amountMadeThisWeek >= (baseline * 0.9) && amountMadeThisWeek <= (baseline * 1.1)) {
      mode = 'stable';
    } else {
      mode = 'growth';
    }
    
    // Calculate excess (income - baseline) - only positive in Growth mode
    const excess = Math.max(0, amountMadeThisWeek - baseline);
    
    // Buffer goal calculation
    const bufferGoal = baseline * bufferGoalWeeks;
    const isBufferFilling = startingBalance < bufferGoal;
    
    // Calculate totals for each category with safety checks
    const needsTotal = needsBreakdown.food + needsBreakdown.rent + needsBreakdown.utilities + 
                       needsBreakdown.transportation + needsBreakdown.health + needsBreakdown.insurance;
    const wantsTotal = wantsBreakdown.clothes + wantsBreakdown.entertainment + wantsBreakdown.academic + 
                       wantsBreakdown.digitalSubs + wantsBreakdown.hobby;
    const savingsTotal = savingsBreakdown.invest + savingsBreakdown.emergency + 
                         savingsBreakdown.longTermInvest + savingsBreakdown.bigPurchase;

    // Calculate suggested budget based on mode
    let suggested;
    
    if (mode === 'survival' || mode === 'stable') {
      // In Survival/Stable: All income goes to needs, wants = 0
      suggested = {
        needs: {
          total: amountMadeThisWeek, // All income to needs
          breakdown: {
            food: amountMadeThisWeek * 0.25,
            rent: amountMadeThisWeek * 0.40,
            utilities: amountMadeThisWeek * 0.15,
            transportation: amountMadeThisWeek * 0.10,
            health: amountMadeThisWeek * 0.05,
            insurance: amountMadeThisWeek * 0.05
          }
        },
        wants: {
          total: 0, // Locked in Survival/Stable
          breakdown: {
            clothes: 0,
            entertainment: 0,
            academic: 0,
            digitalSubs: 0,
            hobby: 0
          }
        },
        savings: {
          total: 0, // No savings in Survival/Stable (focus on baseline)
          breakdown: {
            invest: 0,
            emergency: 0,
            longTermInvest: 0,
            bigPurchase: 0
          }
        }
      };
    } else {
      // Growth mode: Baseline + 50/30/20 on excess
      const excessNeeds = excess * 0.5;
      const excessWants = excess * 0.3;
      const excessSavings = excess * 0.2;
      
      suggested = {
        needs: {
          total: baseline + excessNeeds, // Baseline + 50% of excess
          breakdown: {
            food: (baseline * 0.25) + (excessNeeds * 0.25),
            rent: (baseline * 0.40) + (excessNeeds * 0.40),
            utilities: (baseline * 0.15) + (excessNeeds * 0.15),
            transportation: (baseline * 0.10) + (excessNeeds * 0.10),
            health: (baseline * 0.05) + (excessNeeds * 0.05),
            insurance: (baseline * 0.05) + (excessNeeds * 0.05)
          }
        },
        wants: {
          total: excessWants, // 30% of excess only
          breakdown: {
            clothes: excessWants * 0.20,
            entertainment: excessWants * 0.20,
            academic: excessWants * 0.20,
            digitalSubs: excessWants * 0.20,
            hobby: excessWants * 0.20
          }
        },
        savings: {
          total: excessSavings, // 20% of excess (may be labeled as Buffer Fill)
          breakdown: {
            invest: isBufferFilling ? 0 : excessSavings * 0.25,
            emergency: isBufferFilling ? excessSavings * 0.50 : excessSavings * 0.25,
            longTermInvest: isBufferFilling ? 0 : excessSavings * 0.25,
            bigPurchase: isBufferFilling ? 0 : excessSavings * 0.25
          }
        }
      };
    }

    // Calculate actual values from form inputs (using already-calculated breakdowns)
    const actual = {
      needs: {
        total: needsTotal,
        breakdown: needsBreakdown
      },
      wants: {
        total: mode === 'survival' || mode === 'stable' ? 0 : wantsTotal, // Force 0 in Survival/Stable
        breakdown: mode === 'survival' || mode === 'stable' ? {
          clothes: 0,
          entertainment: 0,
          academic: 0,
          digitalSubs: 0,
          hobby: 0
        } : wantsBreakdown
      },
      savings: {
        total: savingsTotal,
        breakdown: savingsBreakdown
      }
    };

    // Calculate differences between actual and suggested (for Weekly Summary Report)
    const comparison = {
      needsDiff: actual.needs.total - suggested.needs.total,
      wantsDiff: actual.wants.total - suggested.wants.total,
      savingsDiff: actual.savings.total - suggested.savings.total
    };

    // ============================================
    // STEP 2: IMMEDIATE UI UPDATE (SYNCHRONOUS)
    // ============================================
    // Update UI state immediately with calculated results
    // This happens BEFORE any API calls, ensuring instant UI feedback
    const result = {
      mode,
      baseline,
      excess,
      bufferGoal,
      isBufferFilling,
      suggested,
      actual,
      comparison,
      projectedTotal: amountMadeThisWeek // Only weekly income, not including buffer
    };
    setResult(result);
    
    // ============================================
    // STEP 2.5: ADD CURRENT CALCULATION TO HISTORY
    // ============================================
    // NOTE: We no longer add to history here because the API POST will trigger
    // a refresh of history via fetchBudgetHistory(), which will include the ID.
    // This ensures the history state always has the correct database IDs.
    // The entry will appear in history after the API call completes.
    
    // ============================================
    // STEP 2.6: MAKE REPORT VISIBLE
    // ============================================
    setIsReportVisible(true);
    
    // ============================================
    // STEP 3: FUNCTION COMPLETION - STATE IS ALREADY SET
    // ============================================
    // The result state was set in STEP 2 (line 328: setResult(result))
    // This ensures the report is visible immediately after calculation
    // No early exits - function completes successfully
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
      { name: "utilities", label: "Utilities & Bills" },
      { name: "transportation", label: "Transportation/Gas" },
      { name: "health", label: "Health/Medication" },
      { name: "insurance", label: "Insurance" }
    ],
    wants: [
      { name: "clothes", label: "Clothing & Fashion" },
      { name: "entertainment", label: "Entertainment & Fun" },
      { name: "academic", label: "Academic/Career" },
      { name: "digitalSubs", label: "Digital Subs (Netflix/Spotify)" },
      { name: "hobby", label: "Hobby/Gear" }
    ],
    savings: [
      { name: "invest", label: "Robinhood Investment" },
      { name: "emergency", label: "Emergency Fund" },
      { name: "longTermInvest", label: "Long-term Investment" },
      { name: "bigPurchase", label: "Big Purchase Goal" }
    ]
  };

  const getChartData = () => {
    if (!result) return null;

    const data = {
      labels: [
        'Food & Groceries',
        'Rent/Mortgage',
        'Utilities & Bills',
        'Transportation/Gas',
        'Health/Medication',
        'Insurance',
        'Clothing',
        'Entertainment',
        'Academic/Career',
        'Digital Subs',
        'Hobby/Gear',
        'Robinhood Investment',
        'Emergency Fund',
        'Long-term Investment',
        'Big Purchase Goal'
      ],
      datasets: [
        {
          data: [
            result?.actual?.needs?.breakdown?.food || 0,
            result?.actual?.needs?.breakdown?.rent || 0,
            result?.actual?.needs?.breakdown?.utilities || 0,
            result?.actual?.needs?.breakdown?.transportation || 0,
            result?.actual?.needs?.breakdown?.health || 0,
            result?.actual?.needs?.breakdown?.insurance || 0,
            result?.actual?.wants?.breakdown?.clothes || 0,
            result?.actual?.wants?.breakdown?.entertainment || 0,
            result?.actual?.wants?.breakdown?.academic || 0,
            result?.actual?.wants?.breakdown?.digitalSubs || 0,
            result?.actual?.wants?.breakdown?.hobby || 0,
            result?.actual?.savings?.breakdown?.invest || 0,
            result?.actual?.savings?.breakdown?.emergency || 0,
            result?.actual?.savings?.breakdown?.longTermInvest || 0,
            result?.actual?.savings?.breakdown?.bigPurchase || 0
          ],
          backgroundColor: [
            '#60A5FA', // Food - Light Blue
            '#3B82F6', // Rent - Blue
            '#2563EB', // Utilities - Dark Blue
            '#34D399', // Transportation/Gas - Light Green
            '#10B981', // Health/Medication - Green
            '#059669', // Insurance - Dark Green
            '#F59E0B', // Clothing - Orange
            '#EF4444', // Entertainment - Red
            '#8B5CF6', // Academic/Career - Purple
            '#EC4899', // Digital Subs - Pink
            '#14B8A6', // Hobby/Gear - Teal
            '#A78BFA', // Robinhood Investment - Light Purple
            '#6366F1', // Emergency Fund - Indigo
            '#F97316', // Long-term Investment - Orange
            '#06B6D4'  // Big Purchase Goal - Cyan
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

  // Get Doughnut Chart Data for 50/30/20 Budget Breakdown
  const getDoughnutChartData = (needsTotal: number, wantsTotal: number, savingsTotal: number) => {
    const total = needsTotal + wantsTotal + savingsTotal;
    
    // Only return chart data if totals are greater than 0
    if (total <= 0) return null;

    const data = {
      labels: ['Needs (50%)', 'Wants (30%)', 'Savings (20%)'],
      datasets: [
        {
          data: [needsTotal, wantsTotal, savingsTotal],
          backgroundColor: [
            '#F59E0B', // Needs - Yellow/Orange
            '#3B82F6', // Wants - Blue
            '#10B981'  // Savings - Green
          ],
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            font: {
              size: 12
            },
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const value = context.raw;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
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
    "Honor the Lord with your wealth, with the first fruits of all your crops. - Proverbs 3:9",
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

  const getAICoachMessage = (data: BudgetEntry, mode?: 'survival' | 'stable' | 'growth', baseline?: number) => {
    const totalIncome = parseFloat(data.paycheck) || 0;
    const needsTotal = data.needs.total || 0;
    
    // Mode-specific coaching
    if (mode === 'survival') {
      return {
        message: `Survival Mode: Your income is below baseline. Focus on protecting your essential needs ($${baseline?.toFixed(2) || '0'}). Avoid all discretionary spending and prioritize building your buffer when possible.`,
        emoji: "🛡️",
        tone: "text-red-800"
      };
    }
    
    if (mode === 'stable') {
      return {
        message: `Stable Mode: Your income matches your baseline. Maintain strict discipline - all funds go to needs only. Focus on building your buffer to ${(baseline || 0) * 4} weeks before allowing any wants spending.`,
        emoji: "⚖️",
        tone: "text-blue-800"
      };
    }
    
    if (mode === 'growth') {
      const excess = totalIncome - (baseline || 0);
      const needsPercentage = baseline ? ((needsTotal / baseline) * 100) : 0;
      
      if (needsTotal > (baseline || 0) * 1.1) {
        return {
          message: `Growth Mode: You're spending ${needsPercentage.toFixed(0)}% of baseline on needs. Try to stay within baseline ($${(baseline || 0).toFixed(2)}) to maximize your excess for wants and savings.`,
          emoji: "📊",
          tone: "text-orange-800"
        };
      }
      
      return {
        message: `Growth Mode: Great! You have $${excess.toFixed(2)} excess after baseline. Apply 50/30/20 to this excess: $${(excess * 0.5).toFixed(2)} needs, $${(excess * 0.3).toFixed(2)} wants, $${(excess * 0.2).toFixed(2)} savings.`,
        emoji: "🚀",
        tone: "text-green-800"
      };
    }
    
    // Fallback to original logic if no mode provided
    const totalIncomeFallback = parseFloat(data.totalMoney) + parseFloat(data.paycheck);
    const needsPercentageFallback = (data.needs.total / totalIncomeFallback) * 100;
    const wantsPercentage = (data.wants.total / totalIncomeFallback) * 100;
    const savingsPercentage = (data.savings.total / totalIncomeFallback) * 100;

    let message = "";
    let emoji = "🎯";
    let tone = "text-blue-800";

    if (savingsPercentage > 25) {
      message = `Excellent work! You're saving ${savingsPercentage.toFixed(1)}% of your income, which exceeds your 20% target. This is a great foundation for your financial future!`;
      emoji = "🌟";
      tone = "text-green-800";
    } else if (savingsPercentage < 15) {
      message = `Your savings rate is ${savingsPercentage.toFixed(1)}%, which is below the recommended 20%. Consider setting aside a bit more for your future goals.`;
      emoji = "💡";
      tone = "text-yellow-800";
    } else if (wantsPercentage > 35) {
      message = `Your wants category (${wantsPercentage.toFixed(1)}%) is higher than the recommended 30%. Try to identify areas where you can reduce discretionary spending.`;
      emoji = "🎯";
      tone = "text-orange-800";
    } else if (needsPercentageFallback > 55) {
      message = `Your essential needs (${needsPercentageFallback.toFixed(1)}%) are taking up more than the recommended 50%. Consider reviewing your fixed expenses to find potential savings.`;
      emoji = "📊";
      tone = "text-red-800";
    } else {
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
  
  // Calculate Financial Health Status (for badges)
  const getFinancialHealthStatus = () => {
    if (!result || totalAvailable <= 0) {
      return { needs: 'gray', wants: 'gray', savings: 'gray' };
    }
    
    const needsTarget = totalAvailable * 0.5;
    const wantsTarget = totalAvailable * 0.3;
    const savingsTarget = totalAvailable * 0.2;
    
    const needsActual = result.actual.needs.total;
    const wantsActual = result.actual.wants.total;
    const savingsActual = result.actual.savings.total;
    
    return {
      needs: needsActual <= needsTarget ? 'green' : 'red',
      wants: wantsActual <= wantsTarget ? 'green' : 'red',
      savings: savingsActual >= savingsTarget ? 'green' : 'red' // For savings, >= is good
    };
  };
  
  const healthStatus = getFinancialHealthStatus();

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-3xl mb-4 shadow-lg">
            💸
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Personalized Budget Planner</h1>
          <p className="text-lg text-gray-600 mb-3">Take Control of Your Finances, One Week At a Time</p>
          
          {/* Verse of the Day - Moved from header card */}
          {isClient && (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <p className="text-sm text-gray-500">📖 Verse of the Day</p>
                <button
                  onClick={refreshVerse}
                  className="p-1 text-gray-500 hover:text-purple-600 transition-colors"
                  title="Get new verse"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 italic">"{dailyVerse}"</p>
            </div>
          )}
        </div>

        {/* Top Overview Panel */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Today's Date */}
            <div className="text-center md:text-left">
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

            {/* Total Available Money - Centered */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Available</p>
              <p className="text-2xl font-bold text-blue-600">${totalAvailable.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {form.totalMoney && form.paycheck ? (
                  <>Starting + Income</>
                ) : (
                  'Enter starting balance and income'
                )}
              </p>
            </div>

            {/* Weekly Surplus - Centered */}
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-600 mb-1">Weekly Surplus</p>
              <p className="text-2xl font-bold text-green-600">${remainingBalance.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {form.totalMoney && form.paycheck ? (
                  <>Available after expenses</>
                ) : (
                  'Enter budget to calculate'
                )}
              </p>
            </div>
          </div>
          
          {/* Financial Health Status Badges - Centered below */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-3 text-center">Financial Health Status</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <div className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                healthStatus.needs === 'green' 
                  ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                  : healthStatus.needs === 'red'
                  ? 'bg-red-100 text-red-800 border-2 border-red-300'
                  : 'bg-gray-100 text-gray-600 border-2 border-gray-300'
              }`}>
                Needs
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                healthStatus.wants === 'green' 
                  ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                  : healthStatus.wants === 'red'
                  ? 'bg-red-100 text-red-800 border-2 border-red-300'
                  : 'bg-gray-100 text-gray-600 border-2 border-gray-300'
              }`}>
                Wants
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                healthStatus.savings === 'green' 
                  ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                  : healthStatus.savings === 'red'
                  ? 'bg-red-100 text-red-800 border-2 border-red-300'
                  : 'bg-gray-100 text-gray-600 border-2 border-gray-300'
              }`}>
                Savings
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weekly Survival Minimum (Baseline)
                      <span className="text-xs text-gray-500 ml-1">*Required for tiered mode</span>
                    </label>
                    <input
                      type="number"
                      name="baseline"
                      value={form.baseline}
                      onChange={handleChange}
                      placeholder="Enter your weekly survival minimum"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Your absolute minimum weekly needs (rent, food, utilities, transportation, health, insurance)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buffer Goal (Weeks)</label>
                    <input
                      type="number"
                      name="bufferGoalWeeks"
                      value={form.bufferGoalWeeks}
                      onChange={handleChange}
                      placeholder="4"
                      min="1"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">Target number of weeks to build in your buffer (default: 4 weeks)</p>
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-green-800">Wants (30%)</h3>
                    {result && (result.mode === 'survival' || result.mode === 'stable') && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full border border-red-300">
                        🔒 LOCKED
                      </span>
                    )}
                  </div>
                  {result && (result.mode === 'survival' || result.mode === 'stable') && (
                    <p className="text-sm text-red-700 mt-2 italic">
                      Wants are disabled in {result.mode === 'survival' ? 'Survival' : 'Stable'} mode. All income must go to needs.
                    </p>
                  )}
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
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          result && (result.mode === 'survival' || result.mode === 'stable') 
                            ? 'bg-gray-100 cursor-not-allowed' 
                            : ''
                        }`}
                        disabled={result ? (result.mode === 'survival' || result.mode === 'stable') : false}
                        required={result ? (result.mode === 'growth') : true}
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

          {/* RIGHT COLUMN - Weekly Summary Report */}
          {isReportVisible && result && (
            <div className="space-y-6">
              {/* Weekly Summary Report */}
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
                    {/* Mode Badge */}
                    {result.mode && (
                      <div className="mt-3">
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                          result.mode === 'survival' 
                            ? 'bg-red-100 text-red-800 border-2 border-red-400' 
                            : result.mode === 'stable'
                            ? 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                            : 'bg-green-100 text-green-800 border-2 border-green-400'
                        }`}>
                          {result.mode === 'survival' ? '🛡️ SURVIVAL MODE' : 
                           result.mode === 'stable' ? '⚖️ STABLE MODE' : 
                           '🚀 GROWTH MODE'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {form.goalTarget && (
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                    <h3 className="font-medium text-purple-800 mb-2">Weekly Goal Progress</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Remaining Balance</p>
                        <p className="text-xl font-bold text-purple-900">
                          ${(((parseFloat(form.totalMoney) || 0) + (parseFloat(form.paycheck) || 0)) - ((result?.actual?.needs?.total || 0) + (result?.actual?.wants?.total || 0))).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Spent This Week</p>
                        <p className="text-xl font-bold text-purple-900">${((result?.actual?.needs?.total || 0) + (result?.actual?.wants?.total || 0)).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-800">
                      ${((result?.actual?.needs?.total || 0) + (result?.actual?.wants?.total || 0)).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Needs + Wants</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600 mb-1">Total Saved</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${(result?.actual?.savings?.total || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {result?.isBufferFilling ? 'Buffer Fill' : 'Savings + Investments'}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-600 mb-1">Remaining</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${(((parseFloat(form.totalMoney) || 0) + (parseFloat(form.paycheck) || 0)) - ((result?.actual?.needs?.total || 0) + (result?.actual?.wants?.total || 0) + (result?.actual?.savings?.total || 0))).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Available Balance</p>
                  </div>
                </div>

                {/* 50/30/20 Doughnut Chart */}
                {(() => {
                  const needsTotal = result?.actual?.needs?.total || 0;
                  const wantsTotal = result?.actual?.wants?.total || 0;
                  const savingsTotal = result?.actual?.savings?.total || 0;
                  const total = needsTotal + wantsTotal + savingsTotal;
                  
                  // Only render if totals are greater than 0
                  if (total <= 0) {
                    return null;
                  }
                  
                  // Create chart data inline to ensure reactivity
                  const chartData = {
                    labels: ['Needs (50%)', 'Wants (30%)', 'Savings (20%)'],
                    datasets: [
                      {
                        data: [needsTotal, wantsTotal, savingsTotal], // Use live values directly
                        backgroundColor: [
                          '#F59E0B', // Needs - Yellow/Orange
                          '#3B82F6', // Wants - Blue
                          '#10B981'  // Savings - Green
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 2,
                      },
                    ],
                  };

                  const chartOptions = {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                        labels: {
                          font: {
                            size: 12
                          },
                          padding: 15
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            const value = context.raw;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                          }
                        }
                      }
                    }
                  };
                  
                  return (
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                      <h5 className="text-lg font-semibold text-gray-800 mb-4 text-center">Budget Breakdown (50/30/20 Rule)</h5>
                      <div className="flex justify-center items-center">
                        <div className="w-full max-w-sm">
                          <Doughnut data={chartData} options={chartOptions} key={`main-chart-${needsTotal}-${wantsTotal}-${savingsTotal}`} />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Super-Size Health Bars - Actual vs Target (Mode-Aware) */}
                {result && result.projectedTotal > 0 && (() => {
                  const needsActual = result.actual.needs.total;
                  const wantsActual = result.actual.wants.total;
                  const savingsActual = result.actual.savings.total;
                  
                  // Mode-specific target calculations
                  let needsTarget, wantsTarget, savingsTarget;
                  let needsPercentage, wantsPercentage, savingsPercentage;
                  
                  if (result.mode === 'survival' || result.mode === 'stable') {
                    // In Survival/Stable: Show progress against total income (not percentage)
                    needsTarget = result.projectedTotal; // All income should go to needs
                    wantsTarget = 0; // No wants allowed
                    savingsTarget = 0; // No savings in Survival/Stable
                    
                    needsPercentage = (needsActual / needsTarget) * 100;
                    wantsPercentage = 0;
                    savingsPercentage = 0;
                  } else {
                    // Growth mode: Use baseline + excess calculations
                    needsTarget = result.baseline + (result.excess * 0.5);
                    wantsTarget = result.excess * 0.3;
                    savingsTarget = result.excess * 0.2;
                    
                    needsPercentage = needsTarget > 0 ? (needsActual / needsTarget) * 100 : 0;
                    wantsPercentage = wantsTarget > 0 ? (wantsActual / wantsTarget) * 100 : 0;
                    savingsPercentage = savingsTarget > 0 ? (savingsActual / savingsTarget) * 100 : 0;
                  }
                  
                  // Dynamic color logic: Green (<80%), Yellow (80-100%), Red (>100%)
                  const getBarColor = (percentage: number, isSavings: boolean = false) => {
                    if (isSavings) {
                      // For savings, higher is better
                      if (percentage >= 100) return 'bg-green-500';
                      if (percentage >= 80) return 'bg-yellow-500';
                      return 'bg-red-500';
                    } else {
                      // For needs/wants, lower is better
                      if (percentage <= 80) return 'bg-green-500';
                      if (percentage <= 100) return 'bg-yellow-500';
                      return 'bg-red-500';
                    }
                  };
                  
                  const needsColor = getBarColor(needsPercentage);
                  const wantsColor = result.mode === 'survival' || result.mode === 'stable' ? 'bg-gray-400' : getBarColor(wantsPercentage);
                  const savingsColor = result.mode === 'survival' || result.mode === 'stable' ? 'bg-gray-400' : getBarColor(savingsPercentage, true);
                  
                  return (
                    <div className="space-y-6">
                      <h5 className="text-lg font-semibold text-gray-800 mb-4">Financial Health Bars</h5>
                      
                      {/* Needs Bar */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Needs {result.mode === 'survival' || result.mode === 'stable' 
                              ? `(Target: $${needsTarget.toFixed(2)})` 
                              : `(Target: $${needsTarget.toFixed(2)})`}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            ${needsActual.toFixed(2)} / ${needsTarget.toFixed(2)}
                          </span>
                        </div>
                        <div className="relative w-full bg-gray-200 rounded-full h-8 overflow-hidden shadow-inner">
                          <div 
                            className={`h-full ${needsColor} transition-all duration-500 rounded-full flex items-center ${
                              needsPercentage > 20 ? 'justify-end pr-2' : 'justify-start pl-2'
                            }`}
                            style={{ width: `${Math.min(needsPercentage, 100)}%` }}
                          >
                            {needsPercentage > 20 && (
                              <span className="text-sm font-bold text-white drop-shadow">
                                {needsPercentage.toFixed(0)}%
                              </span>
                            )}
                          </div>
                          {needsPercentage <= 20 && (
                            <span className="absolute inset-0 flex items-center justify-start pl-2 text-sm font-bold text-gray-700">
                              {needsPercentage.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {needsActual > needsTarget && (
                          <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Over target by ${(needsActual - needsTarget).toFixed(2)}</p>
                        )}
                      </div>
                      
                      {/* Wants Bar */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Wants {result.mode === 'survival' || result.mode === 'stable' 
                              ? '(LOCKED)' 
                              : `(Target: $${wantsTarget.toFixed(2)})`}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            ${wantsActual.toFixed(2)} / ${wantsTarget.toFixed(2)}
                          </span>
                        </div>
                        <div className="relative w-full bg-gray-200 rounded-full h-8 overflow-hidden shadow-inner">
                          <div 
                            className={`h-full ${wantsColor} transition-all duration-500 rounded-full flex items-center ${
                              wantsPercentage > 20 ? 'justify-end pr-2' : 'justify-start pl-2'
                            }`}
                            style={{ width: `${Math.min(wantsPercentage, 100)}%` }}
                          >
                            {wantsPercentage > 20 && (
                              <span className="text-sm font-bold text-white drop-shadow">
                                {wantsPercentage.toFixed(0)}%
                              </span>
                            )}
                          </div>
                          {wantsPercentage <= 20 && (
                            <span className="absolute inset-0 flex items-center justify-start pl-2 text-sm font-bold text-gray-700">
                              {wantsPercentage.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {wantsActual > wantsTarget && (
                          <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Over target by ${(wantsActual - wantsTarget).toFixed(2)}</p>
                        )}
                      </div>
                      
                      {/* Savings Bar */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            {result.isBufferFilling ? 'Buffer Fill' : 'Savings'} 
                            {result.mode === 'survival' || result.mode === 'stable' 
                              ? '(LOCKED)' 
                              : `(Target: $${savingsTarget.toFixed(2)})`}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            ${savingsActual.toFixed(2)} / ${savingsTarget.toFixed(2)}
                          </span>
                        </div>
                        <div className="relative w-full bg-gray-200 rounded-full h-8 overflow-hidden shadow-inner">
                          <div 
                            className={`h-full ${savingsColor} transition-all duration-500 rounded-full flex items-center ${
                              savingsPercentage > 20 ? 'justify-end pr-2' : 'justify-start pl-2'
                            }`}
                            style={{ width: `${Math.min(savingsPercentage, 100)}%` }}
                          >
                            {savingsPercentage > 20 && (
                              <span className="text-sm font-bold text-white drop-shadow">
                                {savingsPercentage.toFixed(0)}%
                              </span>
                            )}
                          </div>
                          {savingsPercentage <= 20 && (
                            <span className="absolute inset-0 flex items-center justify-start pl-2 text-sm font-bold text-gray-700">
                              {savingsPercentage.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {savingsActual < savingsTarget && (
                          <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Under target by ${(savingsTarget - savingsActual).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* AI Budget Coach Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">🧠</span>
                  <h3 className="text-xl font-semibold text-gray-800">AI Budget Coach</h3>
                </div>
                {(Array.isArray(history) && history.length > 0) || result ? (
                  <div className="space-y-4">
                    {(() => {
                      // Use current result if available, otherwise use latest history entry
                      if (result) {
                        // Create a temporary entry from current result for AI coach
                        const tempEntry: BudgetEntry = {
                          date: form.date,
                          totalMoney: form.totalMoney || "0",
                          paycheck: form.paycheck || "0",
                          needs: result.actual.needs,
                          wants: result.actual.wants,
                          savings: result.actual.savings,
                          goalTarget: form.goalTarget || "",
                          notes: form.notes || undefined,
                          tags: form.tags || [],
                          recurringExpenses: [],
                          verse: undefined
                        };
                        const { message, emoji, tone } = getAICoachMessage(
                          tempEntry, 
                          result.mode, 
                          result.baseline
                        );
                        return (
                          <div className="flex items-start space-x-4">
                            <span className="text-3xl">{emoji}</span>
                            <p className={`text-base ${tone} leading-relaxed`}>{message}</p>
                          </div>
                        );
                      } else if (history && history.length > 0) {
                        const latestEntry = history[0];
                        if (!latestEntry) return null;
                        const { message, emoji, tone } = getAICoachMessage(latestEntry);
                        return (
                          <div className="flex items-start space-x-4">
                            <span className="text-3xl">{emoji}</span>
                            <p className={`text-base ${tone} leading-relaxed`}>{message}</p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Complete a budget calculation to get personalized coaching advice!</p>
                )}
                {(!history || history.length === 0) && (
                  <p className="text-gray-500 italic">Complete a budget calculation to get personalized coaching advice!</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* History Section */}
        {isReportVisible && result && (
          <div className="mt-12 max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📅 Past Budgets</h2>
                {Array.isArray(history) && history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Clear All History
                  </button>
                )}
              </div>

              {!Array.isArray(history) || !history || history.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No past budgets recorded yet.</p>
              ) : (
                <div className="space-y-6">
                  {history && history.length > 0 && history.map((entry, index) => {
                    // Enhanced logging to verify id is present
                    const entryId = entry?.id;
                    console.log('Rendering History Item', { 
                      index, 
                      entryId, 
                      entryIdType: typeof entryId,
                      entryIdIsNumber: typeof entryId === 'number',
                      hasEntry: !!entry,
                      entryDate: entry?.date
                    });
                    
                    // Safety check: ensure entry exists
                    if (!entry) {
                      console.warn('Invalid entry at index:', index);
                      return null;
                    }
                    
                    const totalAvailable = (parseFloat(entry.totalMoney) || 0) + (parseFloat(entry.paycheck) || 0);
                    const safeTotalAvailable = totalAvailable > 0 ? totalAvailable : 1; // Prevent division by zero
                    const needsPercentage = ((entry.needs?.total || 0) / safeTotalAvailable) * 100;
                    const wantsPercentage = ((entry.wants?.total || 0) / safeTotalAvailable) * 100;
                    const savingsPercentage = ((entry.savings?.total || 0) / safeTotalAvailable) * 100;

                    const needsStatus = getCategoryStatus(needsPercentage, 50, 'needs');
                    const wantsStatus = getCategoryStatus(wantsPercentage, 30, 'wants');
                    const savingsStatus = getCategoryStatus(savingsPercentage, 20, 'savings');

                    const totalSpent = (entry.needs?.total || 0) + (entry.wants?.total || 0);
                    const biggestCategory = getBiggestCategory(entry.needs?.total || 0, entry.wants?.total || 0);

                    // Use entry.id for key, fallback to index if id is missing
                    const keyValue = (entryId !== undefined && entryId !== null) ? entryId : `entry-${index}`;
                    
                    return (
                      <div key={keyValue} className="bg-slate-50 rounded-lg p-6 transform transition-all hover:scale-[1.01]">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">
                            Week of {entry.date ? new Date(entry.date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            }) : 'Unknown Date'}
                          </h3>
                          <div className="flex items-center gap-2">
                            {entry.goalTarget && (
                              <span className="text-sm text-purple-600">
                                Goal: ${(parseFloat(entry.goalTarget) || 0).toFixed(2)}
                              </span>
                            )}
                            {entryId !== undefined && entryId !== null && typeof entryId === 'number' && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Delete button clicked for entry:', { entryId, entryDate: entry.date });
                                  if (entryId !== undefined && entryId !== null && typeof entryId === 'number') {
                                    handleDelete(entryId);
                                  } else {
                                    console.error('Cannot delete: entryId is invalid', { entryId, type: typeof entryId });
                                  }
                                }}
                                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                                title={`Delete this budget entry (ID: ${entryId})`}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
  <p className="text-gray-600">Income (This Week)</p>
  <p className="font-medium">
    ${(parseFloat(entry.paycheck) || 0).toFixed(2)}
  </p>

  <p className="text-xs text-gray-500 mt-1">
    Starting Balance: ${(parseFloat(entry.totalMoney) || 0).toFixed(2)}
  </p>
</div>
                          <div>
                            <div className="flex items-center justify-between">
                              <p className="text-gray-600">Needs</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${needsStatus.color}`}>
                                {needsStatus.icon} {needsStatus.text}
                              </span>
                            </div>
                            <p className="font-medium">${(entry.needs?.total || 0).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">Target: 50% | Actual: {formatPercentage(needsPercentage)}</p>
                          </div>
                          <div>
                            <div className="flex items-center justify-between">
                              <p className="text-gray-600">Wants</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${wantsStatus.color}`}>
                                {wantsStatus.icon} {wantsStatus.text}
                              </span>
                            </div>
                            <p className="font-medium">${(entry.wants?.total || 0).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">Target: 30% | Actual: {formatPercentage(wantsPercentage)}</p>
                          </div>
                          <div>
                            <div className="flex items-center justify-between">
                              <p className="text-gray-600">Savings</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${savingsStatus.color}`}>
                                {savingsStatus.icon} {savingsStatus.text}
                              </span>
                            </div>
                            <p className="font-medium">${(entry.savings?.total || 0).toFixed(2)}</p>
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
                              <p className="text-xl font-bold text-green-600">${(entry.savings?.total || 0).toFixed(2)}</p>
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
                          
                          {/* 50/30/20 Doughnut Chart */}
                          {(() => {
                            // Use live state values directly - recalculate on every render
                            const needsTotal = entry.needs?.total || 0;
                            const wantsTotal = entry.wants?.total || 0;
                            const savingsTotal = entry.savings?.total || 0;
                            const total = needsTotal + wantsTotal + savingsTotal;
                            
                            // Only render if totals are greater than 0
                            if (total <= 0) {
                              return null;
                            }
                            
                            // Create chart data inline to ensure reactivity
                            const chartData = {
                              labels: ['Needs (50%)', 'Wants (30%)', 'Savings (20%)'],
                              datasets: [
                                {
                                  data: [needsTotal, wantsTotal, savingsTotal], // Use live values directly
                                  backgroundColor: [
                                    '#F59E0B', // Needs - Yellow/Orange
                                    '#3B82F6', // Wants - Blue
                                    '#10B981'  // Savings - Green
                                  ],
                                  borderColor: '#ffffff',
                                  borderWidth: 2,
                                },
                              ],
                            };

                            const chartOptions = {
                              responsive: true,
                              maintainAspectRatio: true,
                              plugins: {
                                legend: {
                                  position: 'bottom' as const,
                                  labels: {
                                    font: {
                                      size: 12
                                    },
                                    padding: 15
                                  }
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context: any) {
                                      const value = context.raw;
                                      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                      return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                                    }
                                  }
                                }
                              }
                            };
                            
                            return (
                              <div className="mb-4 bg-white p-4 rounded-lg shadow-sm">
                                <h5 className="text-md font-semibold text-gray-800 mb-3 text-center">Budget Breakdown (50/30/20 Rule)</h5>
                                <div className="flex justify-center items-center">
                                  <div className="w-full max-w-xs">
                                    <Doughnut data={chartData} options={chartOptions} key={`chart-${entry.id || entry.date}-${needsTotal}-${wantsTotal}-${savingsTotal}`} />
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                          
                          {entry.verse && (
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-700 italic">"{entry.verse}"</p>
                            </div>
                          )}
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
