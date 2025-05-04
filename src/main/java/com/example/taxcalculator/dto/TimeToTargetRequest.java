package com.example.taxcalculator.dto;

import lombok.Data;

@Data
public class TimeToTargetRequest {
    private double minCtc;
    private double maxCtc;
    private double monthlyExpense;
    private double targetAmount;
    private Double increment;
} 