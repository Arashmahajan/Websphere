package com.worksphere.hcm.payroll.service;

import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("WorkSphere Payroll Calculation Service Unit Test Suite")
class PayrollCalculationServiceTest {

    private PayrollCalculationService calculationService;

    @BeforeEach
    void setUp() {
        calculationService = new PayrollCalculationService();
    }

    @Test
    @DisplayName("Should compute correct gross earnings, statutory deductions, and net salary using Banker's Rounding")
    void testStandardPayrollCalculation() {
        BigDecimal base = new BigDecimal("100000.00");
        var result = calculationService.calculate(
            base,
            new BigDecimal("0.40"),
            new BigDecimal("12000.00"),
            0,
            BigDecimal.ZERO,
            0,
            30,
            false
        );

        assertNotNull(result);
        assertEquals(new BigDecimal("100000.00"), result.baseSalary());
        assertEquals(new BigDecimal("40000.00"), result.hra());
        assertEquals(new BigDecimal("12000.00"), result.transportAllowance());
        assertEquals(new BigDecimal("25000.00"), result.specialAllowance());
        assertEquals(new BigDecimal("177000.00"), result.grossEarnings());

        assertEquals(new BigDecimal("12000.00"), result.providentFund());
        assertEquals(new BigDecimal("200.00"), result.professionalTax());
        assertTrue(result.netPayable().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when base salary is zero or negative")
    void testInvalidBaseSalaryThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> {
            calculationService.calculate(
                BigDecimal.ZERO,
                new BigDecimal("0.40"),
                BigDecimal.ZERO,
                0,
                BigDecimal.ZERO,
                0,
                30,
                false
            );
        });
    }

    @Test
    @DisplayName("Should deduct Loss of Pay (LOP) proportionately for unrecorded absences")
    void testLopDeductionImpactOnGross() {
        BigDecimal base = new BigDecimal("90000.00");
        // 3 days LOP on a 30-day month = 90,000 / 30 * 3 = 9,000 LOP
        var result = calculationService.calculate(
            base,
            new BigDecimal("0.40"),
            new BigDecimal("12000.00"),
            0,
            BigDecimal.ZERO,
            3,
            30,
            false
        );

        // Standard Gross without LOP would be 90,000 + 36,000 + 12,000 + 22,500 = 160,500
        // With 9,000 LOP deduction = 151,500.00
        assertEquals(new BigDecimal("151500.00"), result.grossEarnings());
    }

    @Test
    @DisplayName("Should calculate 1.5x overtime multiplier on hourly rate")
    void testOvertimeCalculationAccuracy() {
        BigDecimal base = new BigDecimal("120000.00"); // 120,000 / 30 = 4,000 / 8 = 500 / hr
        var result = calculationService.calculate(
            base,
            new BigDecimal("0.40"),
            new BigDecimal("12000.00"),
            10, // 10 hrs OT * 500 * 1.5 = 7,500.00
            BigDecimal.ZERO,
            0,
            30,
            false
        );

        assertEquals(new BigDecimal("7500.00"), result.overtimePay());
    }
}
