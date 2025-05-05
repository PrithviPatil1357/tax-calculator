import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Matches TimeToTargetResult DTO
interface TimeToTargetItem {
  annualCtc: number;
  timeToTargetMonths: number | null; // Can be null if unreachable
}

// Matches TimeToTargetResponse DTO
interface TimeToTargetResponse {
  results: TimeToTargetItem[];
}

// Helper to format numbers as currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0, // Use 0 for axes/tooltips for cleaner look
    maximumFractionDigits: 0,
  }).format(value);
};

const TimeToTargetChart: React.FC = () => {
  const [minCtc, setMinCtc] = useState<string>("1000000"); // Default values
  const [isMinCtcLakhs, setIsMinCtcLakhs] = useState<boolean>(false); // Lakhs state
  const [maxCtc, setMaxCtc] = useState<string>("3000000");
  const [isMaxCtcLakhs, setIsMaxCtcLakhs] = useState<boolean>(false); // Lakhs state
  const [monthlyExpense, setMonthlyExpense] = useState<string>("40000");
  const [isExpenseLakhs, setIsExpenseLakhs] = useState<boolean>(false); // Lakhs state
  const [targetAmount, setTargetAmount] = useState<string>("5000000");
  const [isTargetLakhs, setIsTargetLakhs] = useState<boolean>(false); // Lakhs state
  const [increment, setIncrement] = useState<string>("500000"); // Increment likely not in Lakhs

  const [chartData, setChartData] = useState<any>(null); // State to hold chart data
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchTrigger, setFetchTrigger] = useState<number>(0); // To trigger fetch

  // Fetch data when inputs change (debounced or triggered by button)
  useEffect(() => {
    const fetchData = async () => {
      if (
        !minCtc ||
        !maxCtc ||
        !monthlyExpense ||
        !targetAmount ||
        !increment
      ) {
        setChartData(null); // Clear chart if inputs are incomplete
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const minCtcValueRaw = parseFloat(minCtc);
        const maxCtcValueRaw = parseFloat(maxCtc);
        const expenseValueRaw = parseFloat(monthlyExpense);
        const targetValueRaw = parseFloat(targetAmount);
        const incrementValue = parseFloat(increment);

        // Apply Lakhs conversion before validation
        const minCtcValue = isMinCtcLakhs
          ? minCtcValueRaw * 100000
          : minCtcValueRaw;
        const maxCtcValue = isMaxCtcLakhs
          ? maxCtcValueRaw * 100000
          : maxCtcValueRaw;
        const expenseValue = isExpenseLakhs
          ? expenseValueRaw * 100000
          : expenseValueRaw;
        const targetValue = isTargetLakhs
          ? targetValueRaw * 100000
          : targetValueRaw;

        // Frontend validation (similar to backend)
        if (isNaN(minCtcValue) || minCtcValue < 0)
          throw new Error(`Invalid Min CTC${isMinCtcLakhs ? " (Lakhs)" : ""}`);
        if (isNaN(maxCtcValue) || maxCtcValue < 0)
          throw new Error(`Invalid Max CTC${isMaxCtcLakhs ? " (Lakhs)" : ""}`);
        if (isNaN(expenseValue) || expenseValue < 0)
          throw new Error(
            `Invalid Monthly Expense${isExpenseLakhs ? " (Lakhs)" : ""}`
          );
        if (isNaN(targetValue) || targetValue <= 0)
          throw new Error(
            `Invalid Target Amount${isTargetLakhs ? " (Lakhs)" : ""}`
          );
        if (isNaN(incrementValue) || incrementValue <= 0)
          throw new Error("Invalid Increment (must be positive)");
        if (minCtcValue > maxCtcValue) throw new Error("Min CTC > Max CTC");

        // Construct API URL using environment variable
        const apiUrl = `${
          import.meta.env.VITE_API_BASE_URL
        }/api/v1/tax/calculate-time-to-target`;

        const response = await fetch(
          apiUrl, // Use the constructed URL
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              minCtc: minCtcValue,
              maxCtc: maxCtcValue,
              monthlyExpense: expenseValue,
              targetAmount: targetValue,
              increment: incrementValue,
            }),
          }
        );

        if (!response.ok) {
          let errorMsg = `Error: ${response.status} ${response.statusText}`;
          try {
            const errorBody = await response.json();
            errorMsg = errorBody.detail || errorBody.message || errorMsg;
          } catch (e) {
            /* Ignore */
          }
          throw new Error(errorMsg);
        }

        const data: TimeToTargetResponse = await response.json();

        if (data.results && data.results.length > 0) {
          // Filter out null timeToTargetMonths (where target is unreachable)
          const validResults = data.results.filter(
            (item) => item.timeToTargetMonths !== null
          );

          if (validResults.length === 0) {
            setError(
              "Target amount is not reachable with the given expenses for any CTC in the range."
            );
            setChartData(null);
          } else {
            setChartData({
              labels: validResults.map((item) =>
                formatCurrency(item.annualCtc)
              ), // X-axis labels (CTC)
              datasets: [
                {
                  label: "Months to Reach Target",
                  data: validResults.map((item) => item.timeToTargetMonths),
                  borderColor: "rgb(75, 192, 192)",
                  backgroundColor: "rgba(75, 192, 192, 0.5)",
                  tension: 0.1,
                },
              ],
            });
          }
        } else {
          setChartData(null);
          setError("No results received from server.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch time to target data.");
        setChartData(null); // Clear chart on error
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    // Only run fetch when fetchTrigger changes (i.e., button is clicked)
    fetchData();
  }, [fetchTrigger]); // REMOVED dependencies: minCtc, maxCtc, monthlyExpense, targetAmount, increment

  const handleGenerateChart = () => {
    // Simply increment the trigger to cause the useEffect to run
    setFetchTrigger((prev) => prev + 1);
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Time to Reach Savings Target vs. Annual CTC",
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += `${Math.round(context.parsed.y)} months`;
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "Months to Reach Target",
        },
        beginAtZero: true,
      },
      x: {
        title: {
          display: true,
          text: "Annual CTC",
        },
      },
    },
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "20px",
        borderRadius: "5px",
        maxWidth: "800px",
        margin: "20px auto",
      }}
    >
      <h2>Time to Reach Savings Target</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "15px",
          marginBottom: "15px",
        }}
      >
        <div>
          <label htmlFor="minCtcTarget">Min CTC (INR):</label>
          <div
            style={{ display: "flex", alignItems: "center", marginTop: "5px" }}
          >
            <input
              type="number"
              id="minCtcTarget"
              value={minCtc}
              onChange={(e) => setMinCtc(e.target.value)}
              placeholder={isMinCtcLakhs ? "e.g., 10" : "e.g., 1000000"}
              style={{
                flexGrow: 1,
                padding: "8px",
                boxSizing: "border-box",
                marginRight: "10px", // Add margin for spacing
              }}
            />
            <label htmlFor="minCtcTargetLakhs" style={{ whiteSpace: "nowrap" }}>
              <input
                type="checkbox"
                id="minCtcTargetLakhs"
                checked={isMinCtcLakhs}
                onChange={(e) => setIsMinCtcLakhs(e.target.checked)}
                style={{ marginRight: "5px" }}
              />
              Lakhs?
            </label>
          </div>
        </div>
        <div>
          <label htmlFor="maxCtcTarget">Max CTC (INR):</label>
          <div
            style={{ display: "flex", alignItems: "center", marginTop: "5px" }}
          >
            <input
              type="number"
              id="maxCtcTarget"
              value={maxCtc}
              onChange={(e) => setMaxCtc(e.target.value)}
              placeholder={isMaxCtcLakhs ? "e.g., 30" : "e.g., 3000000"}
              style={{
                flexGrow: 1,
                padding: "8px",
                boxSizing: "border-box",
                marginRight: "10px",
              }}
            />
            <label htmlFor="maxCtcTargetLakhs" style={{ whiteSpace: "nowrap" }}>
              <input
                type="checkbox"
                id="maxCtcTargetLakhs"
                checked={isMaxCtcLakhs}
                onChange={(e) => setIsMaxCtcLakhs(e.target.checked)}
                style={{ marginRight: "5px" }}
              />
              Lakhs?
            </label>
          </div>
        </div>
        <div>
          <label htmlFor="monthlyExpenseTarget">Monthly Expense (INR):</label>
          <div
            style={{ display: "flex", alignItems: "center", marginTop: "5px" }}
          >
            <input
              type="number"
              id="monthlyExpenseTarget"
              value={monthlyExpense}
              onChange={(e) => setMonthlyExpense(e.target.value)}
              placeholder={isExpenseLakhs ? "e.g., 0.4" : "e.g., 40000"}
              style={{
                flexGrow: 1,
                padding: "8px",
                boxSizing: "border-box",
                marginRight: "10px",
              }}
            />
            <label
              htmlFor="monthlyExpenseTargetLakhs"
              style={{ whiteSpace: "nowrap" }}
            >
              <input
                type="checkbox"
                id="monthlyExpenseTargetLakhs"
                checked={isExpenseLakhs}
                onChange={(e) => setIsExpenseLakhs(e.target.checked)}
                style={{ marginRight: "5px" }}
              />
              Lakhs?
            </label>
          </div>
        </div>
        <div>
          <label htmlFor="targetAmount">Target Amount (INR):</label>
          <div
            style={{ display: "flex", alignItems: "center", marginTop: "5px" }}
          >
            <input
              type="number"
              id="targetAmount"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder={isTargetLakhs ? "e.g., 50" : "e.g., 5000000"}
              style={{
                flexGrow: 1,
                padding: "8px",
                boxSizing: "border-box",
                marginRight: "10px",
              }}
            />
            <label htmlFor="targetAmountLakhs" style={{ whiteSpace: "nowrap" }}>
              <input
                type="checkbox"
                id="targetAmountLakhs"
                checked={isTargetLakhs}
                onChange={(e) => setIsTargetLakhs(e.target.checked)}
                style={{ marginRight: "5px" }}
              />
              Lakhs?
            </label>
          </div>
        </div>
        <div>
          <label htmlFor="incrementTarget">Increment (INR):</label>
          <input
            type="number"
            id="incrementTarget"
            value={increment}
            onChange={(e) => setIncrement(e.target.value)}
            placeholder="e.g., 500000"
            min="1" // Ensure positive increment
            style={{
              width: "100%",
              padding: "8px",
              boxSizing: "border-box",
              marginTop: "5px",
            }}
          />
        </div>
      </div>

      <button
        onClick={handleGenerateChart}
        disabled={
          isLoading ||
          !minCtc ||
          !maxCtc ||
          !monthlyExpense ||
          !targetAmount ||
          !increment
        }
        style={{
          padding: "10px 15px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        {isLoading ? "Generating..." : "Generate Chart"}
      </button>

      {error && (
        <div style={{ color: "red", marginTop: "15px" }}>Error: {error}</div>
      )}

      {chartData && (
        <div
          style={{
            marginTop: "20px",
            borderTop: "1px solid #eee",
            paddingTop: "15px",
          }}
        >
          <Line options={chartOptions} data={chartData} />
        </div>
      )}
      {!chartData &&
        !isLoading &&
        !error &&
        minCtc &&
        maxCtc &&
        monthlyExpense &&
        targetAmount &&
        increment && (
          <div style={{ marginTop: "15px", color: "grey" }}>
            Enter values and click Generate Chart.
          </div>
        )}
    </div>
  );
};

export default TimeToTargetChart;
