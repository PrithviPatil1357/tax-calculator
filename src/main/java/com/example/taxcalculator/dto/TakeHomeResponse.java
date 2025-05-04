package com.example.taxcalculator.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TakeHomeResponse {
    private double yearlyTakeHome;
    private double monthlyTakeHome;
    private double yearlyTaxPayable;
    private double monthlyTaxPayable;
} 