import React, { useState } from "react";

// Matches SavingsResponse DTO
interface SavingsDetails {
  yearlySavings: number;
  monthlySavings: number;
  yearlyTakeHome: number;
  monthlyTakeHome: number;
}

// Helper to format numbers as currency (can be moved to a utils file later)
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const SavingsCalculator: React.FC = () => {
  const [annualCtc, setAnnualCtc] = useState<string>("");
  const [isCtcLakhs, setIsCtcLakhs] = useState<boolean>(false);
  const [expenseType, setExpenseType] = useState<"annual" | "monthly">(
    "monthly"
  );
  const [expenseValue, setExpenseValue] = useState<string>("");
  const [isExpenseLakhs, setIsExpenseLakhs] = useState<boolean>(false);
  const [result, setResult] = useState<SavingsDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const ctcValueRaw = parseFloat(annualCtc);
      const expValueRaw = expenseValue ? parseFloat(expenseValue) : 0; // Handle empty expense

      if (isNaN(ctcValueRaw) || ctcValueRaw < 0) {
        setError(
          `Please enter a valid positive number for Annual CTC${
            isCtcLakhs ? " (Lakhs)" : ""
          }.`
        );
        setIsLoading(false);
        return;
      }
      // Validate expense only if a value is entered
      if (expenseValue && (isNaN(expValueRaw) || expValueRaw < 0)) {
        setError(
          `Please enter a valid positive number for Expense${
            isExpenseLakhs ? " (Lakhs)" : ""
          }, or leave blank.`
        );
        setIsLoading(false);
        return;
      }

      // Apply lakhs conversion
      const ctcValue = isCtcLakhs ? ctcValueRaw * 100000 : ctcValueRaw;
      const expValue = isExpenseLakhs ? expValueRaw * 100000 : expValueRaw;

      const payload: {
        annualCtc: number;
        annualExpenses?: number;
        monthlyExpense?: number;
      } = {
        annualCtc: ctcValue,
      };

      if (expenseValue) {
        // Only include expense if a value is entered
        if (expenseType === "annual") {
          payload.annualExpenses = expValue;
        } else {
          payload.monthlyExpense = expValue;
        }
      }

      // Construct API URL using environment variable
      const apiUrl = `${
        import.meta.env.VITE_API_BASE_URL
      }/api/v1/tax/calculate-savings`;

      const response = await fetch(
        apiUrl, // Use the constructed URL
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        let errorMsg = `Error: ${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.json();
          // Check for specific backend validation message if possible
          errorMsg = errorBody.detail || errorBody.message || errorMsg;
        } catch (e) {
          /* Ignore */
        }
        throw new Error(errorMsg);
      }

      const data: SavingsDetails = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch calculation results.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "20px",
        borderRadius: "5px",
        maxWidth: "500px",
        margin: "20px auto",
      }}
    >
      <h2>Savings Calculator</h2>
      {/* Annual CTC Input */}
      <div style={{ marginBottom: "15px" }}>
        <label htmlFor="savingsAnnualCtc">Annual CTC (INR):</label>
        <div
          style={{ display: "flex", alignItems: "center", marginTop: "5px" }}
        >
          <input
            type="number"
            id="savingsAnnualCtc"
            value={annualCtc}
            onChange={(e) => setAnnualCtc(e.target.value)}
            placeholder={isCtcLakhs ? "e.g., 15" : "e.g., 1500000"}
            disabled={isLoading}
            style={{
              flexGrow: 1, // Use flexGrow instead of width
              padding: "8px",
              boxSizing: "border-box",
              marginRight: "10px", // Add margin for spacing
            }}
          />
          <label htmlFor="ctcLakhsCheckbox" style={{ whiteSpace: "nowrap" }}>
            <input
              type="checkbox"
              id="ctcLakhsCheckbox"
              checked={isCtcLakhs}
              onChange={(e) => setIsCtcLakhs(e.target.checked)}
              disabled={isLoading}
              style={{ marginRight: "5px" }}
            />
            Lakhs?
          </label>
        </div>
      </div>

      {/* Expense Input */}
      <div style={{ marginBottom: "15px" }}>
        <label>Expenses:</label>
        <div
          style={{ display: "flex", alignItems: "center", marginTop: "5px" }}
        >
          <select
            value={expenseType}
            onChange={(e) =>
              setExpenseType(e.target.value as "annual" | "monthly")
            }
            disabled={isLoading}
            style={{ padding: "8px", marginRight: "10px" }}
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
          <input
            type="number"
            value={expenseValue}
            onChange={(e) => setExpenseValue(e.target.value)}
            placeholder={`Enter ${expenseType} expense (optional)`}
            disabled={isLoading}
            style={{ flexGrow: 1, padding: "8px", boxSizing: "border-box" }}
          />
          <label
            htmlFor="expenseLakhsCheckbox"
            style={{ whiteSpace: "nowrap", marginLeft: "10px" }}
          >
            <input
              type="checkbox"
              id="expenseLakhsCheckbox"
              checked={isExpenseLakhs}
              onChange={(e) => setIsExpenseLakhs(e.target.checked)}
              disabled={isLoading}
              style={{ marginRight: "5px" }}
            />
            Lakhs?
          </label>
        </div>
      </div>

      <button
        onClick={handleCalculate}
        disabled={isLoading || !annualCtc}
        style={{ padding: "10px 15px", cursor: "pointer" }}
      >
        {isLoading ? "Calculating..." : "Calculate Savings"}
      </button>

      {error && (
        <div style={{ color: "red", marginTop: "15px" }}>Error: {error}</div>
      )}

      {result && (
        <div
          style={{
            marginTop: "20px",
            borderTop: "1px solid #eee",
            paddingTop: "15px",
          }}
        >
          <h3>Results:</h3>
          <p>
            <strong>Yearly Savings:</strong>{" "}
            {formatCurrency(result.yearlySavings)}
          </p>
          <p>
            <strong>Monthly Savings:</strong>{" "}
            {formatCurrency(result.monthlySavings)}
          </p>
          <hr
            style={{
              border: "none",
              borderTop: "1px dashed #ccc",
              margin: "10px 0",
            }}
          />
          <p>
            <i>
              (Based on Monthly Take Home:{" "}
              {formatCurrency(result.monthlyTakeHome)})
            </i>
          </p>
        </div>
      )}
    </div>
  );
};

export default SavingsCalculator;
