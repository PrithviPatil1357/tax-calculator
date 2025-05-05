package com.example.taxcalculator.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CtcResponseDto {
    private double requiredAnnualCtc;
    private String message; // Optional: For cases where exact match isn't found
} 