import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App'; // Assuming App.tsx is the main app component

describe('App Theme Switching', () => {
  beforeEach(() => {
    // Mock matchMedia for consistent initial theme (light by default in tests)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)', // Start with light theme for predictability
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => null); // No theme initially in localStorage
    Storage.prototype.setItem = jest.fn();

    // Render the App component
    render(<App />);
  });

  afterEach(() => {
    // Clean up mocks
    jest.clearAllMocks();
  });

  test('should initialize with light theme by default (or based on mock)', () => {
    // Check if html element has 'light' class (set by ThemeProvider)
    expect(document.documentElement.classList.contains('light')).toBe(true);
    // Check button text
    const toggleButton = screen.getByRole('button', { name: /Toggle Theme/i });
    expect(toggleButton).toHaveTextContent('Toggle Theme (Dark Mode)');
  });

  test('should toggle to dark theme and back to light theme', () => {
    const toggleButton = screen.getByRole('button', { name: /Toggle Theme/i });

    // 1. Initial state (light)
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(toggleButton).toHaveTextContent('Toggle Theme (Dark Mode)');
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light'); // Initial setItem call

    // 2. Click to toggle to Dark Mode
    fireEvent.click(toggleButton);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(toggleButton).toHaveTextContent('Toggle Theme (Light Mode)');
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');

    // 3. Click to toggle back to Light Mode
    fireEvent.click(toggleButton);
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(toggleButton).toHaveTextContent('Toggle Theme (Dark Mode)');
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
  });

  test('should load theme from localStorage if available', () => {
    // Reset mocks and render with localStorage value
    Storage.prototype.getItem = jest.fn(() => 'dark'); // Simulate 'dark' theme in localStorage
    Storage.prototype.setItem = jest.fn(); // Reset setItem mock for this specific test

    render(<App />); // Re-render for this specific test case with new localStorage mock

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    const toggleButton = screen.getByRole('button', { name: /Toggle Theme/i });
    expect(toggleButton).toHaveTextContent('Toggle Theme (Light Mode)');
    // Check that setItem was called with the loaded theme during initialization
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });
});
