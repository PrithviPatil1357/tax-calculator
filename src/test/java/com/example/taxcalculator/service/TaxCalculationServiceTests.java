package com.example.taxcalculator.service;

import com.example.taxcalculator.dto.TimeToTargetRequest;
import com.example.taxcalculator.dto.TimeToTargetResponse;
import com.example.taxcalculator.dto.TimeToTargetResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TaxCalculationServiceTests {

    private TaxCalculationService taxCalculationService;

    @BeforeEach
    void setUp() {
        taxCalculationService = new TaxCalculationService();
    }

    private TimeToTargetRequest createBasicRequest(double ctc, double monthlyExpense, double targetAmount) {
        TimeToTargetRequest request = new TimeToTargetRequest();
        request.setMinCtc(ctc);
        request.setMaxCtc(ctc); // Test single CTC value
        request.setMonthlyExpense(monthlyExpense);
        request.setTargetAmount(targetAmount);
        request.setIncrement(100000.0); // Increment doesn't matter if minCtc = maxCtc
        // Defaults for new fields, can be overridden in specific tests
        request.setCurrentInvestments(0.0);
        request.setLumpsumExpenses(0.0);
        request.setMonthlySipAmount(0.0);
        request.setSipCagr(0.0);
        return request;
    }

    @Test
    void testTargetAlreadyMet() {
        TimeToTargetRequest request = createBasicRequest(1000000, 20000, 500000);
        request.setCurrentInvestments(600000.0); // Already above target

        TimeToTargetResponse response = taxCalculationService.calculateTimeToTargetForRange(request);
        assertNotNull(response);
        assertNotNull(response.getResults());
        assertFalse(response.getResults().isEmpty());
        TimeToTargetResult result = response.getResults().get(0);
        assertEquals(0.0, result.getTimeToTargetMonths(), "Target should be met in 0 months if current investments exceed target.");
    }

    @Test
    void testBasicTimeToTarget_NoInvestmentsOrSip() {
        TimeToTargetRequest request = createBasicRequest(1200000, 30000, 1000000);

        TimeToTargetResponse response = taxCalculationService.calculateTimeToTargetForRange(request);
        assertNotNull(response);
        assertNotNull(response.getResults());
        assertFalse(response.getResults().isEmpty());
        TimeToTargetResult result = response.getResults().get(0);
        assertEquals(15.0, result.getTimeToTargetMonths(), "Basic time to target calculation without investments/SIP.");
    }

    @Test
    void testTimeToTarget_WithCurrentInvestments() {
        TimeToTargetRequest request = createBasicRequest(1200000, 30000, 1000000);
        request.setCurrentInvestments(200000.0);

        TimeToTargetResponse response = taxCalculationService.calculateTimeToTargetForRange(request);
        TimeToTargetResult result = response.getResults().get(0);
        assertEquals(12.0, result.getTimeToTargetMonths(), "Time to target with current investments.");
    }

    @Test
    void testTimeToTarget_WithLumpsumExpense() {
        TimeToTargetRequest request = createBasicRequest(1200000, 30000, 1000000);
        request.setCurrentInvestments(200000.0);
        request.setLumpsumExpenses(50000.0);

        TimeToTargetResponse response = taxCalculationService.calculateTimeToTargetForRange(request);
        TimeToTargetResult result = response.getResults().get(0);
        assertEquals(13.0, result.getTimeToTargetMonths(), "Time to target with lumpsum expenses.");
    }

    @Test
    void testTimeToTarget_WithSipNoCagr() {
        TimeToTargetRequest request = createBasicRequest(1200000, 30000, 1000000);
        request.setMonthlySipAmount(10000.0);

        TimeToTargetResponse response = taxCalculationService.calculateTimeToTargetForRange(request);
        TimeToTargetResult result = response.getResults().get(0);
        assertEquals(13.0, result.getTimeToTargetMonths(), "Time to target with SIP but no CAGR.");
    }
    
    @Test
    void testTimeToTarget_WithSipAndCagr() {
        TimeToTargetRequest request = createBasicRequest(1200000, 50000, 500000);
        request.setCurrentInvestments(50000.0);
        request.setMonthlySipAmount(10000.0);
        request.setSipCagr(0.12);

        TimeToTargetResponse response = taxCalculationService.calculateTimeToTargetForRange(request);
        TimeToTargetResult result = response.getResults().get(0);
        assertEquals(8.0, result.getTimeToTargetMonths(), "Time to target with SIP and CAGR.");
    }

    @Test
    void testUnachievable_ExpensesExceedIncome() {
        TimeToTargetRequest request = createBasicRequest(1000000, 90000, 1000000);

        TimeToTargetResponse response = taxCalculationService.calculateTimeToTargetForRange(request);
        TimeToTargetResult result = response.getResults().get(0);
        assertEquals(Double.POSITIVE_INFINITY, result.getTimeToTargetMonths(), "Unachievable: Expenses exceed income.");
    }

    @Test
    void testUnachievable_SipPlusExpensesExceedIncome() {
        TimeToTargetRequest request = createBasicRequest(1000000, 70000, 1000000);
        request.setMonthlySipAmount(15000.0);

        TimeToTargetResponse response = taxCalculationService.calculateTimeToTargetForRange(request);
        TimeToTargetResult result = response.getResults().get(0);
        assertEquals(Double.POSITIVE_INFINITY, result.getTimeToTargetMonths(), "Unachievable: SIP + Expenses exceed income.");
    }
    
    @Test
    void testUnachievable_NetSavingsEffectivelyZero_NoGrowth() {
        TimeToTargetRequest request = createBasicRequest(1000000, 83333.0, 1000000);
        request.setCurrentInvestments(100000.0);

        TimeToTargetResponse response = taxCalculationService.calculateTimeToTargetForRange(request);
        TimeToTargetResult result = response.getResults().get(0);
        assertEquals(Double.POSITIVE_INFINITY, result.getTimeToTargetMonths(), "Unachievable: Net savings very close to zero, no growth, should hit max duration or stagnation.");
    }

     @Test
    void testUnachievable_NetSavingsZero_NoGrowth_StrictZeroSavings() {
        TimeToTargetRequest request = createBasicRequest(1200000, 100000, 1000000);
        request.setCurrentInvestments(100000.0);

        TimeToTargetResponse response = taxCalculationService.calculateTimeToTargetForRange(request);
        TimeToTargetResult result = response.getResults().get(0);
        assertEquals(Double.POSITIVE_INFINITY, result.getTimeToTargetMonths(), "Unachievable: Net savings strictly zero, no growth.");
    }
}
