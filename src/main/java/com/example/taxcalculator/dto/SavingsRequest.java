package com.example.taxcalculator.dto;

import lombok.Data;

@Data
public class SavingsRequest {
    private double annualCtc;
    private Double annualExpenses;
    private Double monthlyExpense;
} 