package com.example.taxcalculator.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SavingsResponse {
    private double yearlySavings;
    private double monthlySavings;
    private double yearlyTakeHome; // Include take home for context
    private double monthlyTakeHome;
} 