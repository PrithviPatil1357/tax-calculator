import { useState } from "react";
import "./App.css";
import TakeHomeCalculator from "./components/TakeHomeCalculator";
import SavingsCalculator from "./components/SavingsCalculator";
import SavingsRangeTable from "./components/SavingsRangeTable";
import TimeToTargetChart from "./components/TimeToTargetChart";
import ReverseCalculator from "./components/ReverseCalculator";
import { ThemeProvider, useTheme } from './contexts/ThemeContext'; // Add this

// Existing App function becomes AppContent
function AppContent() {
  type Tab = "takeHome" | "savings" | "savingsRange" | "timeToTarget" | "reverse"; // Moved Tab type here
  const [activeTab, setActiveTab] = useState<Tab>("takeHome");
  const { theme, toggleTheme } = useTheme(); // Get theme and toggleTheme from context

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
        return <TakeHomeCalculator />;
    }
  };

  // Basic inline styles for tabs
  const tabButtonStyle = (tabName: Tab): React.CSSProperties => ({
    padding: "10px 15px",
    cursor: "pointer",
    border: "1px solid var(--color-border)", // Use CSS variable
    borderBottom: activeTab === tabName ? "none" : "1px solid var(--color-border)", // Use CSS variable
    backgroundColor: activeTab === tabName 
      ? "var(--color-tab-active-bg)" // Use CSS variable
      : "var(--color-tab-inactive-bg)", // Use CSS variable
    color: activeTab === tabName 
      ? "var(--color-tab-active-text)" // Use CSS variable
      : "var(--color-tab-inactive-text)", // Use CSS variable
    marginRight: "5px",
    borderTopLeftRadius: "5px",
    borderTopRightRadius: "5px",
    fontWeight: activeTab === tabName ? "bold" : "normal",
  });

  return (
    <>
      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme} 
        style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px',
          padding: '8px 12px',
          backgroundColor: "var(--color-button-background)", // Use CSS variable
          color: "var(--color-text)", // Use CSS variable
          border: "1px solid var(--color-border)", // Use CSS variable
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Toggle Theme ({theme === 'light' ? 'Dark' : 'Light'} Mode)
      </button>

      <h1>Tax Calculator (New Regime FY 2025-26)</h1>

      {/* Tab Buttons */}
      <div
        className="tab-container" // Added class for styling
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
      <div className="component-container">{renderComponent()}</div> 
    </>
  );
}

// New App component that wraps AppContent with ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
