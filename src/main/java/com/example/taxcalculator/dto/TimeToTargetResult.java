package com.example.taxcalculator.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TimeToTargetResult {
    private double annualCtc;
    // Using Double to allow null when target is unreachable
    private Double timeToTargetMonths; 
} 