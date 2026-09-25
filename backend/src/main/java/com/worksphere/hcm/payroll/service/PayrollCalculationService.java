package com.worksphere.hcm.payroll.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;

/**
 * Enterprise Payroll Calculation Service
 * Enforces strict BigDecimal arithmetic, HALF_EVEN Banker's rounding,
 * and immutable payroll breakdown computation.
 */
@Service
public class PayrollCalculationService {

    private static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_EVEN;
    private static final int SCALE = 2;

    public record PayrollCalculationResult(
        BigDecimal baseSalary,
        BigDecimal hra,
        BigDecimal transportAllowance,
        BigDecimal specialAllowance,
        BigDecimal overtimePay,
        BigDecimal performanceBonus,
        BigDecimal grossEarnings,
        BigDecimal providentFund,
        BigDecimal professionalTax,
        BigDecimal incomeTaxTds,
        BigDecimal totalDeductions,
        BigDecimal netPayable
    ) {}

    public PayrollCalculationResult calculate(
        BigDecimal baseMonthly,
        BigDecimal hraPercentage,
        BigDecimal transportAllowance,
        int overtimeHours,
        BigDecimal performanceBonus,
        int unrecordedLopDays,
        int monthDays,
        boolean isOldRegime
    ) {
        if (baseMonthly == null || baseMonthly.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Base monthly salary must be strictly positive.");
        }

        BigDecimal perDayRate = baseMonthly.divide(BigDecimal.valueOf(monthDays), 4, ROUNDING_MODE);
        BigDecimal lopDeduction = perDayRate.multiply(BigDecimal.valueOf(unrecordedLopDays)).setScale(SCALE, ROUNDING_MODE);

        BigDecimal hra = baseMonthly.multiply(hraPercentage != null ? hraPercentage : new BigDecimal("0.40"))
                                    .setScale(SCALE, ROUNDING_MODE);
        BigDecimal transport = transportAllowance != null ? transportAllowance : new BigDecimal("12000.00");
        BigDecimal specialAllowance = baseMonthly.multiply(new BigDecimal("0.25")).setScale(SCALE, ROUNDING_MODE);

        // Overtime: 1.5x hourly rate (8 hour shift)
        BigDecimal hourlyRate = perDayRate.divide(BigDecimal.valueOf(8), 4, ROUNDING_MODE);
        BigDecimal overtimePay = hourlyRate.multiply(BigDecimal.valueOf(overtimeHours))
                                           .multiply(new BigDecimal("1.50"))
                                           .setScale(SCALE, ROUNDING_MODE);

        BigDecimal bonus = performanceBonus != null ? performanceBonus : BigDecimal.ZERO;

        BigDecimal grossEarnings = baseMonthly.add(hra)
                                              .add(transport)
                                              .add(specialAllowance)
                                              .add(overtimePay)
                                              .add(bonus)
                                              .subtract(lopDeduction)
                                              .setScale(SCALE, ROUNDING_MODE);

        // Deductions
        BigDecimal providentFund = baseMonthly.multiply(new BigDecimal("0.12")).setScale(SCALE, ROUNDING_MODE);
        BigDecimal professionalTax = new BigDecimal("200.00");
        BigDecimal taxRate = isOldRegime ? new BigDecimal("0.12") : new BigDecimal("0.10");
        BigDecimal incomeTaxTds = grossEarnings.multiply(taxRate).setScale(SCALE, ROUNDING_MODE);

        BigDecimal totalDeductions = providentFund.add(professionalTax).add(incomeTaxTds).setScale(SCALE, ROUNDING_MODE);
        BigDecimal netPayable = grossEarnings.subtract(totalDeductions).setScale(SCALE, ROUNDING_MODE);

        return new PayrollCalculationResult(
            baseMonthly,
            hra,
            transport,
            specialAllowance,
            overtimePay,
            bonus,
            grossEarnings,
            providentFund,
            professionalTax,
            incomeTaxTds,
            totalDeductions,
            netPayable
        );
    }
}
