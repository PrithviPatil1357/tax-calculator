package com.example.taxcalculator.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class TimeToTargetResponse {
    private List<TimeToTargetResult> results;
} 