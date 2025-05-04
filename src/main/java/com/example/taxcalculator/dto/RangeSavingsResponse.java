package com.example.taxcalculator.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class RangeSavingsResponse {
    private List<RangeSavingsResult> results;
} 