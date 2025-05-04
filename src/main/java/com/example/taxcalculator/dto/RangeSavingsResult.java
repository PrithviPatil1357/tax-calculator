package com.example.taxcalculator.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RangeSavingsResult {
    private double annualCtc;
    private double monthlySavings;
} 