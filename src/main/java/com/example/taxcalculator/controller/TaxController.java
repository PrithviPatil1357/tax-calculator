package com.example.taxcalculator.controller;

import com.example.taxcalculator.dto.CtcRequest;
import com.example.taxcalculator.dto.SavingsRequest;
import com.example.taxcalculator.dto.TakeHomeResponse;
import com.example.taxcalculator.dto.SavingsResponse;
import com.example.taxcalculator.dto.CtcRangeRequest;
import com.example.taxcalculator.dto.RangeSavingsResponse;
import com.example.taxcalculator.dto.TimeToTargetRequest;
import com.example.taxcalculator.dto.TimeToTargetResponse;
import com.example.taxcalculator.dto.TakeHomeRequestDto;
import com.example.taxcalculator.dto.CtcResponseDto;
import com.example.taxcalculator.service.TaxCalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tax")
// @CrossOrigin annotation removed, CORS will be handled globally
@RequiredArgsConstructor // Injects TaxCalculationService via constructor
public class TaxController {

    private final TaxCalculationService taxCalculationService;

    @PostMapping("/calculate-take-home")
    public ResponseEntity<TakeHomeResponse> calculateTakeHome(@RequestBody CtcRequest request) {
        if (request.getAnnualCtc() < 0) {
            return ResponseEntity.badRequest().build(); // Basic validation
        }
        TakeHomeResponse response = taxCalculationService.calculateTakeHome(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/calculate-savings")
    public ResponseEntity<SavingsResponse> calculateSavings(@RequestBody SavingsRequest request) {
        // Basic validation
        if (request.getAnnualCtc() < 0) {
             return ResponseEntity.badRequest().body(null); // Or return an error object
        }
        if (request.getAnnualExpenses() != null && request.getAnnualExpenses() < 0) {
            return ResponseEntity.badRequest().body(null);
        }
        if (request.getMonthlyExpense() != null && request.getMonthlyExpense() < 0) {
            return ResponseEntity.badRequest().body(null);
        }
        // Cannot provide both annual and monthly expenses simultaneously (optional constraint)
        if (request.getAnnualExpenses() != null && request.getMonthlyExpense() != null) {
             // Decide how to handle this - return error or prioritize one? Returning error for now.
             // Consider adding a custom error response body instead of null.
             return ResponseEntity.badRequest().body(null); 
        }

        SavingsResponse response = taxCalculationService.calculateSavings(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/calculate-savings-range")
    public ResponseEntity<RangeSavingsResponse> calculateSavingsRange(@RequestBody CtcRangeRequest request) {
        // Basic Validation (more specific validation done in service)
        if (request.getMinCtc() < 0 || request.getMaxCtc() < 0 || request.getMonthlyExpense() < 0 || request.getMinCtc() > request.getMaxCtc()) {
            // Consider returning a more informative error response object
            return ResponseEntity.badRequest().body(null);
        }

        RangeSavingsResponse response = taxCalculationService.calculateSavingsForRange(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/calculate-time-to-target")
    public ResponseEntity<TimeToTargetResponse> calculateTimeToTarget(@RequestBody TimeToTargetRequest request) {
        // Basic validation (more robust validation done in service)
        if (request.getMinCtc() < 0 || request.getMaxCtc() < 0 || request.getMonthlyExpense() < 0 
            || request.getMinCtc() > request.getMaxCtc() || request.getTargetAmount() <= 0) {
            return ResponseEntity.badRequest().body(null); // Consider more informative error
        }

        TimeToTargetResponse response = taxCalculationService.calculateTimeToTargetForRange(request);
        return ResponseEntity.ok(response);
    }

    // New endpoint to calculate CTC from desired take-home
    @PostMapping("/calculate-ctc")
    public ResponseEntity<CtcResponseDto> calculateCtcForTakeHome(@RequestBody TakeHomeRequestDto request) {
        // Basic validation (more can be added)
        if (request.getDesiredYearlyTakeHome() <= 0) {
            // Returning a specific DTO might be better than just badRequest()
             CtcResponseDto errorResponse = CtcResponseDto.builder()
                .requiredAnnualCtc(0) 
                .message("Desired yearly take-home must be positive.")
                .build();
            return ResponseEntity.badRequest().body(errorResponse);
        }

        CtcResponseDto response = taxCalculationService.calculateCtcForTakeHome(request);
        return ResponseEntity.ok(response);
    }
} 