# Test Report - HarvestTrust

This report lists the test suites executed for HarvestTrust and their outcomes.

| Test Case ID | Test Case Name | Description | Status | Actual Result / Log |
|---|---|---|---|---|
| T1_AMOUNT_CALCULATION | T1 AMOUNT CALCULATION | Verification check | **PASS** | 125.50 * 32.40 equals authoritative ₹4066.20 |
| T2.1_NEGATIVE_QUANTITY_REJECTED | T2.1 NEGATIVE QUANTITY REJECTED | Verification check | **PASS** | Negative quantity was rejected successfully. |
| T2.2_ZERO_RATE_REJECTED | T2.2 ZERO RATE REJECTED | Verification check | **PASS** | Zero rate per unit was rejected successfully. |
| T2.3_FUTURE_DATE_REJECTED | T2.3 FUTURE DATE REJECTED | Verification check | **PASS** | Future collection date was rejected successfully. |
| T3_DATABASE_CONSTRAINT | T3 DATABASE CONSTRAINT | Verification check | **PASS** | Database successfully rejected duplicate. Error:  |
| T4_VALID_INSERT_AFTER_ERROR | T4 VALID INSERT AFTER ERROR | Verification check | **PASS** | New record inserted and persisted successfully as HT-TEST-1784904116225 |
| T5_ML_PREDICTION_INTEGRATION | T5 ML PREDICTION INTEGRATION | Verification check | **PASS** | ML model responded. Predicted class: NORMAL, Probability: 0.7580576453823941 |

**All tests completed successfully. Zero failures detected.**
