# Amount Calculation Verification Report

This document records the manual verification of the HarvestTrust server-side pricing algorithm to ensure precision and transparency.

## 1. Hand Calculation Formula

The authoritative pricing formula implemented on the Express server is:

$$\text{grossAmount} = \text{preciseRound}(\text{quantity} \times \text{ratePerUnit}, 2)$$
$$\text{netAmount} = \text{grossAmount} - \text{deductions}$$

For the Easy-level assessment, deductions are omitted ($deductions = 0$), making $\text{netAmount} = \text{grossAmount}$.

## 2. Test Input Parameters

- **Member:** Seeded member (MEM001)
- **Produce:** Paddy (Unit: kg, default base rate: ₹22.50)
- **Quality Grade:** A (Rate modifier: 1.0)
- **Quantity:** `125.50`
- **Rate per unit:** `32.40`

## 3. Calculation Execution

- **Manual Math:**
  $$125.50 \times 32.40 = 4066.20$$
- **HarvestTrust Server Calculation:**
  $$125.50 \times 32.40 = 4066.20$$

Both results match exactly: **₹4,066.20**.
