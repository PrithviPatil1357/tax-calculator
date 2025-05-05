import React, { useState } from "react";
import "./ReverseCalculator.css"; // We'll create this CSS file next

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"; // Use environment variable

interface CtcResponse {
  requiredAnnualCtc: number;
  message?: string; // Optional message from backend
}

const ReverseCalculator: React.FC = () => {
  const [desiredYearlyTakeHome, setDesiredYearlyTakeHome] =
    useState<string>("");
  const [calculatedCtc, setCalculatedCtc] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [backendMessage, setBackendMessage] = useState<string | null>(null);

  const handleCalculate = async () => {
    setError(null);
    setCalculatedCtc(null);
    setBackendMessage(null);
    setIsLoading(true);

    const yearlyTakeHome = parseFloat(desiredYearlyTakeHome);
    if (isNaN(yearlyTakeHome) || yearlyTakeHome <= 0) {
      setError(
        "Please enter a valid positive desired yearly take-home amount."
      );
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tax/calculate-ctc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

  return (
    <div className="reverse-calculator calculator-section">
      <h2>Calculate CTC from Desired Take-Home</h2>
      <div className="input-group">
        <label htmlFor="desiredYearlyTakeHome">Desired Yearly Take-Home:</label>
        <input
          type="number"
          id="desiredYearlyTakeHome"
          value={desiredYearlyTakeHome}
          onChange={(e) => setDesiredYearlyTakeHome(e.target.value)}
          placeholder="e.g., 1500000"
          disabled={isLoading}
        />
      </div>
      <button
        onClick={handleCalculate}
        disabled={isLoading || !desiredYearlyTakeHome}
      >
        {isLoading ? "Calculating..." : "Calculate Required CTC"}
      </button>

      {error && <p className="error-message">{error}</p>}
      {backendMessage && <p className="info-message">{backendMessage}</p>}

      {calculatedCtc !== null && (
        <div className="results-display">
          <h3>Result:</h3>
          <p>
            Estimated Required Annual CTC:{" "}
            <strong>
              {calculatedCtc.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              })}
            </strong>
          </p>
          <p>
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
