import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext"; // Import useTheme
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
  const [minCtc, setMinCtc] = useState<string>(""); // Default values
  const [maxCtc, setMaxCtc] = useState<string>("");
  const [monthlyExpense, setMonthlyExpense] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [isLakhsInput, setIsLakhsInput] = useState<boolean>(false); // Add single state
  const [increment, setIncrement] = useState<string>("");
  const [currentInvestments, setCurrentInvestments] = useState<string>("");
  const [lumpsumExpenses, setLumpsumExpenses] = useState<string>("");
  const [monthlySipAmount, setMonthlySipAmount] = useState<string>("");
  const [sipCagr, setSipCagr] = useState<string>("");

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
        !increment ||
        !currentInvestments // Added currentInvestments as mandatory
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
        const incrementValueRaw = parseFloat(increment);
        const currentInvestmentsRaw = parseFloat(currentInvestments);
        const lumpsumExpensesRaw = lumpsumExpenses ? parseFloat(lumpsumExpenses) : 0;
        const monthlySipAmountRaw = monthlySipAmount ? parseFloat(monthlySipAmount) : 0;
        const sipCagrRaw = sipCagr ? parseFloat(sipCagr) : 0;


        // Apply Lakhs conversion before validation, based on single state
        const minCtcValue = isLakhsInput
          ? minCtcValueRaw * 100000
          : minCtcValueRaw;
        const maxCtcValue = isLakhsInput
          ? maxCtcValueRaw * 100000
          : maxCtcValueRaw;
        const expenseValue = isLakhsInput
          ? expenseValueRaw * 100000
          : expenseValueRaw;
        const targetValue = isLakhsInput
          ? targetValueRaw * 100000
          : targetValueRaw;
        const incrementValue = isLakhsInput
          ? incrementValueRaw * 100000
          : incrementValueRaw;
        const currentInvestmentsValue = isLakhsInput
          ? currentInvestmentsRaw * 100000
          : currentInvestmentsRaw;
        const lumpsumExpensesValue = isLakhsInput
          ? lumpsumExpensesRaw * 100000
          : lumpsumExpensesRaw;
        const monthlySipAmountValue = isLakhsInput
          ? monthlySipAmountRaw * 100000
          : monthlySipAmountRaw;
        // No lakhs conversion for sipCagrRaw

        // Frontend validation (similar to backend)
        if (isNaN(minCtcValue) || minCtcValue < 0)
          throw new Error(`Invalid Min CTC${isLakhsInput ? " (Lakhs)" : ""}`);
        if (isNaN(maxCtcValue) || maxCtcValue < 0)
          throw new Error(`Invalid Max CTC${isLakhsInput ? " (Lakhs)" : ""}`);
        if (isNaN(expenseValue) || expenseValue < 0)
          throw new Error(
            `Invalid Monthly Expense${isLakhsInput ? " (Lakhs)" : ""}`
          );
        if (isNaN(targetValue) || targetValue <= 0)
          throw new Error(
            `Invalid Target Amount${isLakhsInput ? " (Lakhs)" : ""}`
          );
        if (isNaN(incrementValue) || incrementValue <= 0)
          throw new Error("Invalid Increment (must be positive)");
        if (minCtcValue > maxCtcValue) throw new Error("Min CTC > Max CTC");
        if (isNaN(currentInvestmentsValue) || currentInvestmentsValue < 0)
          throw new Error(`Invalid Current Investments${isLakhsInput ? " (Lakhs)" : ""}`);
        if (isNaN(lumpsumExpensesValue) || lumpsumExpensesValue < 0)
            throw new Error(`Invalid Lumpsum Expenses${isLakhsInput ? " (Lakhs)" : ""}`);
        if (isNaN(monthlySipAmountValue) || monthlySipAmountValue < 0)
            throw new Error(`Invalid Monthly SIP Amount${isLakhsInput ? " (Lakhs)" : ""}`);
        if (isNaN(sipCagrRaw) || sipCagrRaw < 0 || sipCagrRaw > 200) // Assuming 200% is a generous upper limit
            throw new Error("Invalid SIP CAGR (%). Please enter a value between 0 and 200.");


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
              currentInvestments: currentInvestmentsValue,
              lumpsumExpenses: lumpsumExpensesValue,
              monthlySipAmount: monthlySipAmountValue,
              sipCagr: sipCagrRaw / 100, // Convert percentage to decimal
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
            // Get computed styles for chart colors
            const rootStyle = getComputedStyle(document.documentElement);
            const chartLineColorInitial = rootStyle.getPropertyValue('--color-chart-primary-line').trim() || 'rgb(75, 192, 192)';
            const chartBgColorInitial = rootStyle.getPropertyValue('--color-chart-primary-bg').trim() || 'rgba(75, 192, 192, 0.5)';

            setChartData({
              labels: validResults.map((item) =>
                formatCurrency(item.annualCtc)
              ), // X-axis labels (CTC)
              datasets: [
                {
                  label: "Months to Reach Target",
                  data: validResults.map((item) => item.timeToTargetMonths),
                  borderColor: chartLineColorInitial, // Use computed value
                  backgroundColor: chartBgColorInitial, // Use computed value
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
  }, [fetchTrigger]);

  const { theme } = useTheme();
  const [currentChartOptions, setCurrentChartOptions] = useState<any>({});

  // This useEffect hook handles:
  // 1. Setting chart options based on the current theme.
  // Tooltip theming is also handled here within currentChartOptions.
  useEffect(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const textColor = rootStyle.getPropertyValue('--color-text').trim();
    const textSecondaryColor = rootStyle.getPropertyValue('--color-text-secondary').trim();
    const borderColor = rootStyle.getPropertyValue('--color-border').trim();
    // chartLineColor and chartBgColor are removed from here, will be handled in the new hook

    setCurrentChartOptions({
      responsive: true,
      maintainAspectRatio: false, // Added for better responsiveness in some cases
      plugins: {
        legend: {
          position: "top" as const,
          labels: { color: textColor },
        },
        title: {
          display: true,
          text: "Time to Reach Savings Target vs. Annual CTC",
          color: textColor,
        },
        tooltip: {
          titleColor: textColor,
          bodyColor: textSecondaryColor,
          backgroundColor: rootStyle.getPropertyValue('--color-background').trim(),
          borderColor: borderColor,
          borderWidth: 1,
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
          title: { display: true, text: "Months to Reach Target", color: textSecondaryColor },
          ticks: {
            color: textSecondaryColor,
            autoSkip: false, // Prevent automatic skipping of ticks
            maxTicksLimit: 10, // Suggest up to 10 ticks
          },
          grid: { color: borderColor },
          beginAtZero: true,
        },
        x: {
          title: { display: true, text: "Annual CTC", color: textSecondaryColor },
          ticks: { color: textSecondaryColor },
          grid: { color: borderColor },
        },
      },
    });
    // Logic to update chartData dataset colors has been moved to a new useEffect
  }, [theme]); // Rerun only when theme changes

  // New useEffect hook to update dataset colors when chartData or theme changes
  useEffect(() => {
    if (chartData && chartData.datasets && chartData.datasets.length > 0) {
      const rootStyle = getComputedStyle(document.documentElement);
      const chartLineColor = rootStyle.getPropertyValue('--color-chart-primary-line').trim() || 'rgb(75, 192, 192)';
      const chartBgColor = rootStyle.getPropertyValue('--color-chart-primary-bg').trim() || 'rgba(75, 192, 192, 0.5)';

      // Check if colors actually changed to prevent unnecessary re-renders
      const firstDataset = chartData.datasets[0];
      if (firstDataset.borderColor !== chartLineColor || firstDataset.backgroundColor !== chartBgColor) {
        setChartData((prevChartData: any) => ({
          ...prevChartData,
          datasets: prevChartData.datasets.map((dataset: any) => ({
            ...dataset,
            borderColor: chartLineColor,
            backgroundColor: chartBgColor,
          })),
        }));
      }
    }
  }, [chartData, theme]); // Runs when chartData or theme changes

  const handleGenerateChart = () => {
    setFetchTrigger((prev) => prev + 1);
  };

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        padding: "20px",
        borderRadius: "5px",
        maxWidth: "800px",
        margin: "20px auto",
      }}
    >
      <h2>Time to Reach Savings Target</h2>
      {/* Single Lakhs Checkbox */}
      <div
        style={{
          marginBottom: "15px",
          textAlign: "right",
          gridColumn: "1 / -1",
        }}
      >
        {" "}
        {/* Span across grid */}
        <label
          htmlFor="componentLakhsCheckboxTarget"
          style={{ whiteSpace: "nowrap" }}
        >
          <input
            type="checkbox"
            id="componentLakhsCheckboxTarget"
            checked={isLakhsInput}
            onChange={(e) => setIsLakhsInput(e.target.checked)}
            style={{ marginRight: "5px" }}
          />
          Input in Lakhs?
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "15px",
          marginBottom: "15px",
        }}
      >
        {/* Row 1 */}
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
              placeholder={isLakhsInput ? "e.g., 10" : "e.g., 1000000"}
              style={{
                flexGrow: 1,
                padding: "8px",
                boxSizing: "border-box",
                marginRight: "10px", // Add margin for spacing
              }}
            />
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
              placeholder={isLakhsInput ? "e.g., 30" : "e.g., 3000000"}
              style={{
                flexGrow: 1,
                padding: "8px",
                boxSizing: "border-box",
                marginRight: "10px",
              }}
            />
          </div>
        </div>
        {/* Row 2 */}
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
              placeholder={isLakhsInput ? "e.g., 0.4" : "e.g., 40000"}
              style={{
                flexGrow: 1,
                padding: "8px",
                boxSizing: "border-box",
                marginRight: "10px",
              }}
            />
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
              placeholder={isLakhsInput ? "e.g., 50" : "e.g., 5000000"}
              style={{
                flexGrow: 1,
                padding: "8px",
                boxSizing: "border-box",
                marginRight: "10px",
              }}
            />
          </div>
        </div>
        {/* Row 3 */}
        <div>
          <label htmlFor="currentInvestments">Current Investments (INR):</label>
          <input
            type="number"
            id="currentInvestments"
            value={currentInvestments}
            onChange={(e) => setCurrentInvestments(e.target.value)}
            placeholder={isLakhsInput ? "e.g., 20" : "e.g., 2000000"}
            style={{ width: "100%", padding: "8px", boxSizing: "border-box", marginTop: "5px" }}
          />
        </div>
        <div>
          <label htmlFor="lumpsumExpenses">Lumpsum Expenses (INR) (Optional):</label>
          <input
            type="number"
            id="lumpsumExpenses"
            value={lumpsumExpenses}
            onChange={(e) => setLumpsumExpenses(e.target.value)}
            placeholder={isLakhsInput ? "e.g., 1" : "e.g., 100000"}
            style={{ width: "100%", padding: "8px", boxSizing: "border-box", marginTop: "5px" }}
          />
        </div>
        {/* Row 4 */}
        <div>
          <label htmlFor="monthlySipAmount">Monthly SIP (INR) (Optional):</label>
          <input
            type="number"
            id="monthlySipAmount"
            value={monthlySipAmount}
            onChange={(e) => setMonthlySipAmount(e.target.value)}
            placeholder={isLakhsInput ? "e.g., 0.1" : "e.g., 10000"}
            style={{ width: "100%", padding: "8px", boxSizing: "border-box", marginTop: "5px" }}
          />
        </div>
        <div>
          <label htmlFor="sipCagr">Expected SIP CAGR (%) (Optional):</label>
          <input
            type="number"
            id="sipCagr"
            value={sipCagr}
            onChange={(e) => setSipCagr(e.target.value)}
            placeholder="e.g., 12 (for 12%)"
            style={{ width: "100%", padding: "8px", boxSizing: "border-box", marginTop: "5px" }}
          />
        </div>
        {/* Row 5 - Increment can be here or in Row 3 if preferred */}
        <div>
          <label htmlFor="incrementTarget">Increment (INR):</label>
          <input
            type="number"
            id="incrementTarget"
            value={increment}
            onChange={(e) => setIncrement(e.target.value)}
            placeholder={isLakhsInput ? "e.g., 5" : "e.g., 500000"}
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
          !increment ||
          !currentInvestments // Added currentInvestments as mandatory
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
        <div style={{ color: "var(--color-error)", marginTop: "15px" }}>Error: {error}</div>
      )}

      {chartData && Object.keys(currentChartOptions).length > 0 && (
        <div
          style={{
            marginTop: "20px",
            borderTop: "1px solid var(--color-border)",
            paddingTop: "15px",
            minHeight: '400px', // Make the chart taller
          }}
        >
          <Line options={currentChartOptions} data={chartData} />
        </div>
      )}
      {!chartData &&
        !isLoading &&
        !error &&
        minCtc &&
        maxCtc &&
        monthlyExpense &&
        targetAmount &&
        increment &&
        currentInvestments && ( // Added currentInvestments
          <div style={{ marginTop: "15px", color: "var(--color-text-secondary)" }}>
            Enter values and click Generate Chart.
          </div>
        )}
    </div>
  );
};

export default TimeToTargetChart;
