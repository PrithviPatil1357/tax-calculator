package com.example.taxcalculator.dto;

import lombok.Data;

@Data
public class TimeToTargetRequest {
    private double minCtc;
    private double maxCtc;
    private double monthlyExpense;
    private double targetAmount;
    private Double increment;
    private Double currentInvestments;
    private Double lumpsumExpenses;
    private Double monthlySipAmount;
    private Double sipCagr;
} 