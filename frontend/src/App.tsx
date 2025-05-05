import { useState } from "react";
import "./App.css";
import TakeHomeCalculator from "./components/TakeHomeCalculator";
import SavingsCalculator from "./components/SavingsCalculator";
import SavingsRangeTable from "./components/SavingsRangeTable";
import TimeToTargetChart from "./components/TimeToTargetChart";
import ReverseCalculator from "./components/ReverseCalculator";

type Tab = "takeHome" | "savings" | "savingsRange" | "timeToTarget" | "reverse";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("takeHome");

  const renderComponent = () => {
    switch (activeTab) {
      case "takeHome":
        return <TakeHomeCalculator />;
      case "savings":
        return <SavingsCalculator />;
      case "savingsRange":
        return <SavingsRangeTable />;
      case "timeToTarget":
        return <TimeToTargetChart />;
      case "reverse":
        return <ReverseCalculator />;
      default:
        const _exhaustiveCheck: never = activeTab;
        return <TakeHomeCalculator />;
    }
  };

  // Basic inline styles for tabs
  const tabButtonStyle = (tabName: Tab): React.CSSProperties => ({
    padding: "10px 15px",
    cursor: "pointer",
    border: "1px solid #ccc",
    borderBottom: activeTab === tabName ? "none" : "1px solid #ccc",
    backgroundColor: activeTab === tabName ? "#007BFF" : "#f0f0f0",
    color: activeTab === tabName ? "white" : "#333",
    marginRight: "5px",
    borderTopLeftRadius: "5px",
    borderTopRightRadius: "5px",
    fontWeight: activeTab === tabName ? "bold" : "normal",
  });

  return (
    <>
      <h1>Tax Calculator (New Regime FY 2025-26)</h1>

      {/* Tab Buttons */}
      <div
        style={{
          marginBottom: "0",
          borderBottom: "1px solid #ccc",
          paddingLeft: "20px",
        }}
      >
        <button
          style={tabButtonStyle("takeHome")}
          onClick={() => setActiveTab("takeHome")}
        >
          Take Home Pay
        </button>
        <button
          style={tabButtonStyle("savings")}
          onClick={() => setActiveTab("savings")}
        >
          Savings Calc
        </button>
        <button
          style={tabButtonStyle("savingsRange")}
          onClick={() => setActiveTab("savingsRange")}
        >
          Savings Range
        </button>
        <button
          style={tabButtonStyle("timeToTarget")}
          onClick={() => setActiveTab("timeToTarget")}
        >
          Time to Target
        </button>
        <button
          style={tabButtonStyle("reverse")}
          onClick={() => setActiveTab("reverse")}
        >
          Reverse Calculator
        </button>
      </div>

      {/* Render Active Component */}
      <div style={{ paddingTop: "20px" }}>{renderComponent()}</div>
    </>
  );
}

export default App;
