package com.example.taxcalculator.service;

import com.example.taxcalculator.dto.*;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class TaxCalculationService {

    private static final double STANDARD_DEDUCTION = 50000.0;
    private static final double REBATE_LIMIT = 60000.0;
    // Rebate applies if *taxable income* is up to the threshold (corrected interpretation)
    private static final double REBATE_TAXABLE_INCOME_THRESHOLD = 1150000.0; // 12L Gross - 50k Deduction

    public TakeHomeResponse calculateTakeHome(CtcRequest request) {
        double annualCtc = request.getAnnualCtc();
        double taxableIncome = Math.max(0, annualCtc - STANDARD_DEDUCTION);
        double annualTax = calculateTax(taxableIncome);

        double yearlyTakeHome = annualCtc - annualTax;

        return TakeHomeResponse.builder()
                .yearlyTaxPayable(annualTax)
                .monthlyTaxPayable(annualTax / 12.0)
                .yearlyTakeHome(yearlyTakeHome)
                .monthlyTakeHome(yearlyTakeHome / 12.0)
                .build();
    }

    public SavingsResponse calculateSavings(SavingsRequest request) {
        double annualCtc = request.getAnnualCtc();
        double annualExpenses = 0.0; // Default to zero

        if (request.getAnnualExpenses() != null) {
            annualExpenses = request.getAnnualExpenses();
        } else if (request.getMonthlyExpense() != null) {
            annualExpenses = request.getMonthlyExpense() * 12.0;
        }

        // Reuse take-home calculation logic
        CtcRequest ctcRequest = new CtcRequest();
        ctcRequest.setAnnualCtc(annualCtc);
        TakeHomeResponse takeHomeDetails = calculateTakeHome(ctcRequest);

        double yearlySavings = takeHomeDetails.getYearlyTakeHome() - annualExpenses;

        return SavingsResponse.builder()
                .yearlyTakeHome(takeHomeDetails.getYearlyTakeHome())
                .monthlyTakeHome(takeHomeDetails.getMonthlyTakeHome())
                .yearlySavings(yearlySavings)
                .monthlySavings(yearlySavings / 12.0)
                .build();
    }

    public RangeSavingsResponse calculateSavingsForRange(CtcRangeRequest request) {
        List<RangeSavingsResult> results = new ArrayList<>();
        double minCtc = request.getMinCtc();
        double maxCtc = request.getMaxCtc();
        double monthlyExpense = request.getMonthlyExpense();
        // Use provided increment, default to 5L if null or invalid
        // Using a default increment here for the range calculation as well.
        // If you need separate increments for savings range vs time-to-target, adjust DTOs.
        double increment = (request.getIncrement() != null && request.getIncrement() > 0) ? request.getIncrement() : 500000.0;

        // Basic validation
        if (minCtc > maxCtc || monthlyExpense < 0 || minCtc < 0) {
            return RangeSavingsResponse.builder().results(results).build(); // Return empty for invalid input
        }

        double currentCtc = minCtc;
        while (true) {
            // Calculate take-home for the current CTC
            CtcRequest ctcRequest = new CtcRequest();
            ctcRequest.setAnnualCtc(currentCtc);
            TakeHomeResponse takeHomeDetails = calculateTakeHome(ctcRequest);

            // Calculate monthly savings
            double monthlySaving = takeHomeDetails.getMonthlyTakeHome() - monthlyExpense;

            // Add result to the list
            results.add(RangeSavingsResult.builder()
                    .annualCtc(currentCtc)
                    .monthlySavings(monthlySaving)
                    .build());

            // Check if we've reached or passed the max CTC
            if (currentCtc >= maxCtc) {
                break; // Exit loop
            }

            // Determine the next CTC
            double nextCtc = currentCtc + increment; // Use the increment variable

            // If the next step goes past maxCtc, use maxCtc for the final iteration
            if (nextCtc > maxCtc && currentCtc < maxCtc) {
                nextCtc = maxCtc;
            }
            currentCtc = nextCtc;
        }

        return RangeSavingsResponse.builder().results(results).build();
    }

    public TimeToTargetResponse calculateTimeToTargetForRange(TimeToTargetRequest request) {
        List<TimeToTargetResult> results = new ArrayList<>();
        double minCtc = request.getMinCtc();
        double maxCtc = request.getMaxCtc();
        double monthlyExpense = request.getMonthlyExpense();
        double targetAmount = request.getTargetAmount();
        double increment = (request.getIncrement() != null && request.getIncrement() > 0) ? request.getIncrement() : 500000.0;

        // Retrieve new fields with defaults
        double currentInvestments = Optional.ofNullable(request.getCurrentInvestments()).orElse(0.0);
        double lumpsumExpenses = Optional.ofNullable(request.getLumpsumExpenses()).orElse(0.0);
        double monthlySipAmount = Optional.ofNullable(request.getMonthlySipAmount()).orElse(0.0);
        double sipCagr = Optional.ofNullable(request.getSipCagr()).orElse(0.0); // Annual CAGR

        // Basic validation for core parameters
        if (minCtc > maxCtc || monthlyExpense < 0 || minCtc < 0 || targetAmount <= 0) {
            return TimeToTargetResponse.builder().results(results).build();
        }

        double currentCtc = minCtc;
        while (true) {
            CtcRequest ctcRequest = new CtcRequest();
            ctcRequest.setAnnualCtc(currentCtc);
            TakeHomeResponse takeHomeDetails = calculateTakeHome(ctcRequest);
            double monthlyTakeHome = takeHomeDetails.getMonthlyTakeHome();
            double monthlyNetSavings = monthlyTakeHome - monthlyExpense;

            // New Check: Income vs. Outgoings (Expenses + SIP vs TakeHome)
            if (monthlyExpense + monthlySipAmount > monthlyTakeHome) {
                results.add(TimeToTargetResult.builder()
                        .annualCtc(currentCtc)
                        .timeToTargetMonths(Double.POSITIVE_INFINITY)
                        .build());

                // Advance currentCtc and continue to the next iteration
                if (currentCtc >= maxCtc) {
                    break; // Exit loop if maxCtc is reached
                }
                double nextCtc = currentCtc + increment;
                if (nextCtc > maxCtc && currentCtc < maxCtc) {
                    nextCtc = maxCtc; // Ensure the last iteration is maxCtc
                }
                currentCtc = nextCtc;
                continue; // Skip simulation for this CTC
            }

            double iterationNetWorth = currentInvestments;
            if (lumpsumExpenses > 0) {
                iterationNetWorth -= lumpsumExpenses;
            }

            Double timeMonths;

            if (iterationNetWorth >= targetAmount) {
                timeMonths = 0.0;
            } else if (monthlyNetSavings + monthlySipAmount <= 0 && iterationNetWorth < targetAmount && sipCagr <= 0) {
                timeMonths = Double.POSITIVE_INFINITY;
            } else {
                double tempNetWorth = iterationNetWorth;
                int months = 0;
                double monthlySipGrowthRate = sipCagr / 12.0; // Monthly growth rate from annual CAGR
                Double previousIterationTempNetWorth; // For stagnation check

                while (tempNetWorth < targetAmount) {
                    months++;
                    previousIterationTempNetWorth = tempNetWorth;

                    if (sipCagr > 0) {
                        tempNetWorth += tempNetWorth * monthlySipGrowthRate;
                    }
                    tempNetWorth += monthlySipAmount;
                    tempNetWorth += monthlyNetSavings;

                    if (months > 12000) { // Safety break: 1000 years
                        timeMonths = Double.POSITIVE_INFINITY;
                        break;
                    }
                    if (tempNetWorth <= previousIterationTempNetWorth && tempNetWorth < targetAmount) { // Stagnation check
                        timeMonths = Double.POSITIVE_INFINITY;
                        break;
                    }
                }

                // If loop exited due to safety break, timeMonths is already set. Otherwise, set it now.
                if (tempNetWorth >= targetAmount) { // Check if target was reached
                   timeMonths = (double) months;
                } else { // If loop exited due to safety break before reaching target
                    // timeMonths should already be Double.POSITIVE_INFINITY from the checks within the loop
                    // This else branch handles the case where the loop finishes (e.g. due to stagnation)
                    // but timeMonths wasn't explicitly set within the loop for some reason (defensive coding)
                    if (months > 12000 || (tempNetWorth <= previousIterationTempNetWorth && tempNetWorth < targetAmount)) {
                         timeMonths = Double.POSITIVE_INFINITY;
                    } else {
                        // This case should ideally not be hit if logic is correct,
                        // but as a fallback if target not met and no other condition set it.
                        timeMonths = Double.POSITIVE_INFINITY;
                    }
                }
            }

            results.add(TimeToTargetResult.builder()
                    .annualCtc(currentCtc)
                    .timeToTargetMonths(timeMonths)
                    .build());

            if (currentCtc >= maxCtc) {
                break; // Exit loop
            }

            // Determine the next CTC
            double nextCtc = currentCtc + increment; // Use the increment variable
            // Ensure we don't overshoot the max CTC unnecessarily if the increment is large
            if (nextCtc > maxCtc && currentCtc < maxCtc) {
                nextCtc = maxCtc;
            }
            currentCtc = nextCtc;
        }

        return TimeToTargetResponse.builder().results(results).build();
    }

    // Calculates tax on the already reduced taxable income
    private double calculateTax(double taxableIncome) {
        double tax = 0;
        double incomeForSlabCalc = taxableIncome; // Use a copy for slab calculation

        // Slab calculations (applied on taxable income)
        if (incomeForSlabCalc > 2400000) {
            tax += (incomeForSlabCalc - 2400000) * 0.30;
            incomeForSlabCalc = 2400000;
        }
        if (incomeForSlabCalc > 2000000) {
            tax += (incomeForSlabCalc - 2000000) * 0.25;
            incomeForSlabCalc = 2000000;
        }
        if (incomeForSlabCalc > 1600000) {
            tax += (incomeForSlabCalc - 1600000) * 0.20;
            incomeForSlabCalc = 1600000;
        }
        if (incomeForSlabCalc > 1200000) {
            tax += (incomeForSlabCalc - 1200000) * 0.15;
            incomeForSlabCalc = 1200000;
        }
        if (incomeForSlabCalc > 800000) {
            tax += (incomeForSlabCalc - 800000) * 0.10;
            incomeForSlabCalc = 800000;
        }
        if (incomeForSlabCalc > 400000) {
            tax += (incomeForSlabCalc - 400000) * 0.05;
        }
        // Up-to 4 lakh is NIL tax

        // Apply Rebate u/s 87A if applicable
        // Rebate applies if *taxable income* (Gross - Standard Deduction) <= Threshold
        if (taxableIncome > 0 && taxableIncome <= REBATE_TAXABLE_INCOME_THRESHOLD) {
             double rebate = Math.min(tax, REBATE_LIMIT);
             // TODO: Implement Marginal Relief on Rebate if needed
             // Marginal relief might apply if income is slightly above the threshold (e.g., 11,60,000 taxable)
             // For now, we apply the simple rebate check.
             tax = Math.max(0, tax - rebate);
        }

        return tax;
    }

    // Method to calculate required Annual CTC for a desired Yearly Take Home
    public CtcResponseDto calculateCtcForTakeHome(TakeHomeRequestDto request) {
        double desiredYearlyTakeHome = request.getDesiredYearlyTakeHome();

        // Basic validation: desired take-home cannot be negative
        if (desiredYearlyTakeHome < 0) {
            return CtcResponseDto.builder()
                    .requiredAnnualCtc(0) // Or indicate error appropriately
                    .message("Desired take-home cannot be negative.")
                    .build();
        }

        // Binary search parameters
        double lowCtc = 0.0;
        // Set a high upper bound (e.g., 10 Cr or 100,000,000). Adjust if necessary.
        double highCtc = 100000000.0;
        double bestGuessCtc = 0.0;
        int maxIterations = 100; // Prevent infinite loops
        double tolerance = 1.0; // Stop when calculated take-home is within +/- 1 Rupee

        for (int i = 0; i < maxIterations; i++) {
            double midCtc = lowCtc + (highCtc - lowCtc) / 2.0;
            double taxableIncome = Math.max(0, midCtc - STANDARD_DEDUCTION);
            double annualTax = calculateTax(taxableIncome);
            double currentTakeHome = midCtc - annualTax;

            // Check if currentTakeHome is close enough
            if (Math.abs(currentTakeHome - desiredYearlyTakeHome) <= tolerance) {
                bestGuessCtc = midCtc;
                break; // Found a suitable CTC
            }

            // Adjust search range
            if (currentTakeHome < desiredYearlyTakeHome) {
                // Need higher CTC to get higher take-home
                lowCtc = midCtc;
            } else {
                // Need lower CTC to get lower take-home
                highCtc = midCtc;
            }

            // Store the last mid-point as the best guess if we exhaust iterations
            if (i == maxIterations - 1) {
                bestGuessCtc = midCtc;
            }
        }

        // Handle cases where the desired take-home might be unachievable
        // (e.g., desired take-home is higher than the max possible take-home within the search range)
        // Recalculate final take-home for the best guess to be precise
        double finalTaxable = Math.max(0, bestGuessCtc - STANDARD_DEDUCTION);
        double finalTax = calculateTax(finalTaxable);
        double finalTakeHome = bestGuessCtc - finalTax;

        String message = null;
        if (Math.abs(finalTakeHome - desiredYearlyTakeHome) > tolerance * 10) { // Use a larger tolerance for the message
            message = "Could not find an exact CTC match. This is the closest estimate.";
            // Optionally, you could return 0 or throw an exception if no reasonable CTC is found.
        }

        return CtcResponseDto.builder()
                .requiredAnnualCtc(bestGuessCtc)
                .message(message)
                .build();
    }

} 