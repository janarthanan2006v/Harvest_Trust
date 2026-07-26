# Screen Recording Demo Script - HarvestTrust

This script outlines the narrative and actions for a 3-5 minute demo video showing HarvestTrust's features.

---

## Part 1: Introduction (0:00 - 0:30)

- **Visual:** Show the login landing screen at `http://localhost:5173/login`.
- **Narrative:**
  > "Hello! Today we are demonstrating HarvestTrust, a transparent digital produce collection and payment register built for Farmer Producer Groups. HarvestTrust digitizes agricultural weighing, calculates payments securely on the server, tracks outstanding balances, and uses machine learning to flag collections needing attention."

---

## Part 2: Authentication & Dashboard (0:30 - 1:15)

- **Action:** Click the "Admin" quick login card. Click the green "Sign In" button.
- **Visual:** Show the Dashboard loading animation and subsequent charts/cards.
- **Narrative:**
  > "We are now logging in as an administrator. The dashboard provides a high-level overview of today's totals, outstanding balances due to farmers, active attention flags, a 7-day trend area chart, and produce intake share percentages."

---

## Part 3: Record Collection & Server Math (1:15 - 2:00)

- **Action:** Click "New Collection" in the left sidebar. Type `MEM001` in the farmer search, click the suggestion. Select Paddy as produce.
- **Action:** Enter quantity `125.50` and rate `32.40`. Enter moisture `12.5`. Type notes `Manual verification check`.
- **Visual:** Focus on the Live Risk Evaluator card showing risk calculations, and the Live Slip Calculator showing `₹4,066.20`.
- **Narrative:**
  > "Let's record a new collection. As we select member MEM001 and Paddy, the base rate is autofilled. We enter 125.50 kg and ₹32.40 per kg. Notice the live calculator estimate. If we change values, the system queries a live prediction risk. We hit Save..."
- **Action:** Click "Save Collection Slip".
- **Visual:** Show the success slip receipt overlay containing `HT-YYYYMMDD-XXXX` and authoritative net amount `₹4,066.20`.
- **Narrative:**
  > "The slip is created. The backend has computed exactly ₹4,066.20 and generated receipt HT-20260724-XXXX, matching our calculation verification sheet."

---

## Part 4: Register & Audit Timelines (2:00 - 2:45)

- **Action:** Click "Register" in the sidebar. Search for the generated receipt. Click the details eye icon.
- **Visual:** Show the slide-out details drawer containing the receipt print layout, ML decision metrics, and the audit timeline.
- **Narrative:**
  > "On the Register screen, we can search, sort, and paginate through records. If we open the details for our new delivery, we see the print slip view, the machine learning features snapshot, and an append-only timeline tracking status changes."

---

## Part 5: Member Statements & Ledger (2:45 - 3:30)

- **Action:** Click "Members" in the sidebar. Click "Ledger Statement" for member MEM001 (Arun K).
- **Visual:** Show the account statement table with opening balance, deliveries, payments, and closing balance.
- **Narrative:**
  > "Next, let's open the farmer profile. HarvestTrust calculates a dynamic ledger statement for each member. We see the opening balance, deliveries increasing the due balance, payments decreasing it, and a running closing balance. This table is clean, transparent, and completely printable."

---

## Part 6: ML Attention Alert & Wrap-Up (3:30 - 4:00)

- **Action:** Click "Attention Queue" in the sidebar. Show the review resolution panel.
- **Narrative:**
  > "Finally, the Attention Queue shows collections flagged by the ML model. Secretaries review them, record whether it was an actual anomaly, and resolve the alerts. This completes the loop of trust. Thank you for reviewing HarvestTrust!"
