import React, { useState } from "react";

// Matches RangeSavingsResult DTO
interface SavingsRangeItem {
  annualCtc: number;
  monthlySavings: number;
}

// Matches RangeSavingsResponse DTO
interface SavingsRangeResponse {
  results: SavingsRangeItem[];
}

// Helper to format numbers as currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const SavingsRangeTable: React.FC = () => {
  const [minCtc, setMinCtc] = useState<string>("");
  const [maxCtc, setMaxCtc] = useState<string>("");
  const [monthlyExpense, setMonthlyExpense] = useState<string>("");
  const [isLakhsInput, setIsLakhsInput] = useState<boolean>(false);
  const [results, setResults] = useState<SavingsRangeItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFetchRange = async () => {
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const minCtcValueRaw = parseFloat(minCtc);
      const maxCtcValueRaw = parseFloat(maxCtc);
      const expenseValueRaw = parseFloat(monthlyExpense);

      if (isNaN(minCtcValueRaw) || minCtcValueRaw < 0) {
        throw new Error(
          `Please enter a valid positive number for Minimum CTC${
            isLakhsInput ? " (Lakhs)" : ""
          }.`
        );
      }
      if (isNaN(maxCtcValueRaw) || maxCtcValueRaw < 0) {
        throw new Error(
          `Please enter a valid positive number for Maximum CTC${
            isLakhsInput ? " (Lakhs)" : ""
          }.`
        );
      }
      if (isNaN(expenseValueRaw) || expenseValueRaw < 0) {
        throw new Error(
          `Please enter a valid positive number for Monthly Expense${
            isLakhsInput ? " (Lakhs)" : ""
          }.`
        );
      }

      // Apply lakhs conversion based on single state
      const minCtcValue = isLakhsInput
        ? minCtcValueRaw * 100000
        : minCtcValueRaw;
      const maxCtcValue = isLakhsInput
        ? maxCtcValueRaw * 100000
        : maxCtcValueRaw;
      const expenseValue = isLakhsInput
        ? expenseValueRaw * 100000
        : expenseValueRaw;

      if (minCtcValue > maxCtcValue) {
        throw new Error("Minimum CTC cannot be greater than Maximum CTC.");
      }

      // Construct API URL using environment variable
      const apiUrl = `${
        import.meta.env.VITE_API_BASE_URL
      }/api/v1/tax/calculate-savings-range`;

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
            // Note: Increment for this table is currently handled backend-side
            // If you want user to control increment here too, add state & pass it
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

      const data: SavingsRangeResponse = await response.json();
      setResults(data.results || []); // Ensure results is always an array
    } catch (err: any) {
      setError(err.message || "Failed to fetch range results.");
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
        maxWidth: "700px",
        margin: "20px auto",
      }}
    >
      <h2>Savings Across CTC Range (5L Increments)</h2>
      <div style={{ marginBottom: "15px", textAlign: "right" }}>
        <label
          htmlFor="componentLakhsCheckboxRange"
          style={{ whiteSpace: "nowrap" }}
        >
          <input
            type="checkbox"
            id="componentLakhsCheckboxRange"
            checked={isLakhsInput}
            onChange={(e) => setIsLakhsInput(e.target.checked)}
            disabled={isLoading}
            style={{ marginRight: "5px" }}
          />
          Input in Lakhs?
        </label>
      </div>

      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "15px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <label htmlFor="minCtcRange">Min CTC (INR):</label>
          <div
            style={{ display: "flex", alignItems: "center", marginTop: "5px" }}
          >
            <input
              type="number"
              id="minCtcRange"
              value={minCtc}
              onChange={(e) => setMinCtc(e.target.value)}
              placeholder={isLakhsInput ? "e.g., 10" : "e.g., 1000000"}
              disabled={isLoading}
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
          <label htmlFor="maxCtcRange">Max CTC (INR):</label>
          <div
            style={{ display: "flex", alignItems: "center", marginTop: "5px" }}
          >
            <input
              type="number"
              id="maxCtcRange"
              value={maxCtc}
              onChange={(e) => setMaxCtc(e.target.value)}
              placeholder={isLakhsInput ? "e.g., 30" : "e.g., 3000000"}
              disabled={isLoading}
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
          <label htmlFor="monthlyExpenseRange">Monthly Expense (INR):</label>
          <div
            style={{ display: "flex", alignItems: "center", marginTop: "5px" }}
          >
            <input
              type="number"
              id="monthlyExpenseRange"
              value={monthlyExpense}
              onChange={(e) => setMonthlyExpense(e.target.value)}
              placeholder={isLakhsInput ? "e.g., 0.4" : "e.g., 40000"}
              disabled={isLoading}
              style={{
                flexGrow: 1,
                padding: "8px",
                boxSizing: "border-box",
                marginRight: "10px",
              }}
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleFetchRange}
        disabled={isLoading || !minCtc || !maxCtc || !monthlyExpense}
        style={{ padding: "10px 15px", cursor: "pointer" }}
      >
        {isLoading ? "Fetching..." : "Show Savings Range"}
      </button>

      {error && (
        <div style={{ color: "red", marginTop: "15px" }}>Error: {error}</div>
      )}

      {results.length > 0 && (
        <div
          style={{
            marginTop: "20px",
            borderTop: "1px solid #eee",
            paddingTop: "15px",
          }}
        >
          <h3>Results:</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                  }}
                >
                  Annual CTC
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                  }}
                >
                  Monthly Savings
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {formatCurrency(item.annualCtc)}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {formatCurrency(item.monthlySavings)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SavingsRangeTable;
