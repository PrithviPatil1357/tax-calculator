package com.example.taxcalculator.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data // Generates getters, setters, toString, equals, hashCode
@NoArgsConstructor // Generates a no-args constructor
@AllArgsConstructor // Generates an all-args constructor
@Builder // Builder pattern
public class TakeHomeRequestDto {
    private double desiredYearlyTakeHome;
    // Add desiredMonthlyTakeHome if needed later, but yearly is simpler for calculation
} 