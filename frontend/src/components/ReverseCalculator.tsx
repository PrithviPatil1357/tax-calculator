import React, { useState } from "react";
// import "./ReverseCalculator.css"; // Remove CSS import

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"; // Use environment variable

interface CtcResponse {
  requiredAnnualCtc: number;
  message?: string; // Optional message from backend
}

// Type for input period
type Period = "monthly" | "yearly";

const ReverseCalculator: React.FC = () => {
  const [desiredTakeHomeInput, setDesiredTakeHomeInput] = useState<string>("");
  const [period, setPeriod] = useState<Period>("yearly"); // Default to yearly
  const [calculatedCtc, setCalculatedCtc] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [backendMessage, setBackendMessage] = useState<string | null>(null);

  const handleCalculate = async () => {
    setError(null);
    setCalculatedCtc(null);
    setBackendMessage(null);
    setIsLoading(true);

    const inputValue = parseFloat(desiredTakeHomeInput);
    if (isNaN(inputValue) || inputValue <= 0) {
      setError(
        `Please enter a valid positive desired ${period} take-home amount.`
      );
      setIsLoading(false);
      return;
    }

    // Convert to yearly if monthly input is given
    const yearlyTakeHome = period === "monthly" ? inputValue * 12 : inputValue;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tax/calculate-ctc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Send the calculated yearly value to the backend
        body: JSON.stringify({ desiredYearlyTakeHome: yearlyTakeHome }),
      });

      if (!response.ok) {
        let errorMsg = `Error: ${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.json();
          errorMsg = errorBody.message || errorMsg;
        } catch (e) {
          // Ignore if response body isn't JSON
        }
        throw new Error(errorMsg);
      }

      const data: CtcResponse = await response.json();
      setCalculatedCtc(data.requiredAnnualCtc);
      if (data.message) {
        setBackendMessage(data.message);
      }
    } catch (err: any) {
      console.error("Calculation failed:", err);
      setError(
        err.message || "Failed to calculate CTC. Check the console for details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper from TakeHomeCalculator
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0, // Keep 0 for CTC estimation
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    // Apply similar container styling as TakeHomeCalculator
    <div
      style={{
        border: "1px solid #ccc",
        padding: "20px",
        borderRadius: "5px",
        maxWidth: "500px",
        margin: "20px auto", // Centers the component
      }}
    >
      <h2>Calculate CTC from Desired Take-Home</h2>
      {/* Radio buttons for selecting period */}
      <div style={{ marginBottom: "15px" }}>
        <label style={{ marginRight: "15px" }}>
          <input
            type="radio"
            name="period"
            value="yearly"
            checked={period === "yearly"}
            onChange={() => setPeriod("yearly")}
            style={{ marginRight: "5px" }}
            disabled={isLoading}
          />
          Yearly
        </label>
        <label>
          <input
            type="radio"
            name="period"
            value="monthly"
            checked={period === "monthly"}
            onChange={() => setPeriod("monthly")}
            style={{ marginRight: "5px" }}
            disabled={isLoading}
          />
          Monthly
        </label>
      </div>
      {/* Input field */}
      <div style={{ marginBottom: "15px" }}>
        <label
          htmlFor="desiredTakeHomeInput"
          style={{ marginRight: "10px", display: "block", marginBottom: "5px" }}
        >
          {/* Dynamic label based on selected period */}
          Desired {period === "yearly" ? "Yearly" : "Monthly"} Take-Home:
        </label>
        <input
          type="number"
          id="desiredTakeHomeInput"
          value={desiredTakeHomeInput}
          onChange={(e) => setDesiredTakeHomeInput(e.target.value)}
          placeholder={period === "yearly" ? "e.g., 1500000" : "e.g., 125000"}
          disabled={isLoading}
          style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
        />
      </div>
      {/* Apply similar button styling */}
      <button
        onClick={handleCalculate}
        disabled={isLoading || !desiredTakeHomeInput}
        style={{ padding: "10px 15px", cursor: "pointer" }}
      >
        {isLoading ? "Calculating..." : "Calculate Required CTC"}
      </button>

      {/* Apply similar error styling */}
      {error && (
        <div style={{ color: "red", marginTop: "15px" }}>Error: {error}</div>
      )}
      {backendMessage && (
        // Use a different style for info messages if needed, or reuse error style with different color
        <div
          style={{ color: "#17a2b8", marginTop: "15px", fontStyle: "italic" }}
        >
          Info: {backendMessage}
        </div>
      )}

      {calculatedCtc !== null && (
        // Apply similar results section styling
        <div
          style={{
            marginTop: "20px",
            borderTop: "1px solid #eee",
            paddingTop: "15px",
          }}
        >
          <h3>Result:</h3>
          <p>
            Estimated Required Annual CTC:{" "}
            <strong>{formatCurrency(calculatedCtc)}</strong>
          </p>
          <p style={{ fontSize: "0.9em", fontStyle: "italic", color: "#666" }}>
            <em>
              (This is an estimate based on the current tax rules and may vary.)
            </em>
          </p>
        </div>
      )}
    </div>
  );
};

export default ReverseCalculator;
