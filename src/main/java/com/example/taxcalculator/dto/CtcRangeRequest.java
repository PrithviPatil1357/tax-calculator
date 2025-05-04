package com.example.taxcalculator.dto;

import lombok.Data;

@Data
public class CtcRangeRequest {
    private double minCtc;
    private double maxCtc;
    private double monthlyExpense;
    private Double increment;
} 