import React, { useState } from "react";

// Define types for the API response (matching TakeHomeResponse DTO)
interface TakeHomeDetails {
  yearlyTakeHome: number;
  monthlyTakeHome: number;
  yearlyTaxPayable: number;
  monthlyTaxPayable: number;
}

const TakeHomeCalculator: React.FC = () => {
  const [annualCtc, setAnnualCtc] = useState<string>("");
  const [isLakhsInput, setIsLakhsInput] = useState<boolean>(false);
  const [result, setResult] = useState<TakeHomeDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let ctcValueRaw = parseFloat(annualCtc);
      if (isNaN(ctcValueRaw) || ctcValueRaw < 0) {
        setError(
          `Please enter a valid positive number for Annual CTC${
            isLakhsInput ? " (Lakhs)" : ""
          }.`
        );
        setIsLoading(false);
        return;
      }

      const ctcValue = isLakhsInput ? ctcValueRaw * 100000 : ctcValueRaw;

      // Construct API URL using environment variable
      const apiUrl = `${
        import.meta.env.VITE_API_BASE_URL
      }/api/v1/tax/calculate-take-home`;

      const response = await fetch(
        apiUrl, // Use the constructed URL
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ annualCtc: ctcValue }),
        }
      );

      if (!response.ok) {
        // Attempt to read error details if possible, otherwise throw generic error
        let errorMsg = `Error: ${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.json();
          errorMsg = errorBody.message || errorMsg; // Use specific message if available
        } catch (e) {
          /* Ignore if body isn't JSON */
        }
        throw new Error(errorMsg);
      }

      const data: TakeHomeDetails = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch calculation results.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format numbers as currency (e.g., Indian Rupees)
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div
      style={{
        border: "1px solid var(--color-border)", // Use CSS variable
        padding: "20px",
        borderRadius: "5px",
        maxWidth: "500px",
        margin: "20px auto",
      }}
    >
      <h2>Take Home Pay Calculator</h2>
      <div style={{ marginBottom: "15px" }}>
        <label
          htmlFor="annualCtc"
          style={{ marginRight: "10px", display: "block", marginBottom: "5px" }}
        >
          Annual CTC (INR):
        </label>
        <input
          type="number"
          id="annualCtc"
          value={annualCtc}
          onChange={(e) => setAnnualCtc(e.target.value)}
          placeholder={isLakhsInput ? "e.g., 12" : "e.g., 1200000"}
          disabled={isLoading}
          style={{
            width: "calc(100% - 80px)",
            padding: "8px",
            boxSizing: "border-box",
            marginRight: "10px",
          }}
        />
        <label htmlFor="lakhsCheckbox" style={{ whiteSpace: "nowrap" }}>
          <input
            type="checkbox"
            id="lakhsCheckbox"
            checked={isLakhsInput}
            onChange={(e) => setIsLakhsInput(e.target.checked)}
            disabled={isLoading}
            style={{ marginRight: "5px" }}
          />
          Lakhs?
        </label>
      </div>
      <button
        onClick={handleCalculate}
        disabled={isLoading || !annualCtc}
        style={{ padding: "10px 15px", cursor: "pointer" }}
      >
        {isLoading ? "Calculating..." : "Calculate"}
      </button>

      {error && (
        <div style={{ color: "var(--color-error)", marginTop: "15px" }}>Error: {error}</div> // Use CSS variable
      )}

      {result && (
        <div
          style={{
            marginTop: "20px",
            borderTop: "1px solid var(--color-border)", // Use CSS variable
            paddingTop: "15px",
          }}
        >
          <h3>Results:</h3>
          <p>
            <strong>Yearly Take Home:</strong>{" "}
            {formatCurrency(result.yearlyTakeHome)}
          </p>
          <p>
            <strong>Monthly Take Home:</strong>{" "}
            {formatCurrency(result.monthlyTakeHome)}
          </p>
          <hr
            style={{
              border: "none",
              borderTop: "1px dashed var(--color-border)", // Use CSS variable
              margin: "10px 0",
            }}
          />
          <p>
            <strong>Yearly Tax Payable:</strong>{" "}
            {formatCurrency(result.yearlyTaxPayable)}
          </p>
          <p>
            <strong>Monthly Tax Payable:</strong>{" "}
            {formatCurrency(result.monthlyTaxPayable)}
          </p>
        </div>
      )}
    </div>
  );
};

export default TakeHomeCalculator;
