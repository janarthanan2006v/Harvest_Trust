# Complete Master Prompt - HarvestTrust

Copy everything in this file into your preferred AI coding assistant. The assistant must build the complete application, not merely a mock-up or a collection of disconnected screens.

---

## MASTER PROMPT START

You are a senior full-stack engineer, product designer, database architect, QA engineer, and applied machine-learning engineer. Build a complete, professional, responsive, animated web application named **HarvestTrust** for the following SIH 2026 practical assessment.

Do not return only an explanation or sample snippets. Create the actual working repository, implement every required feature, run the application, test it, fix errors, and produce all required documentation and presentation assets. Make reasonable decisions without repeatedly asking questions. Prefer a simple, reliable, well-finished implementation over unnecessary complexity.

## 1. Project context

### Assessment identity

- Assessment: **SIH 2026 - Internal Practical Assessment**
- Student: **JANARTHANAN V**
- Register number: **411723205021**
- Institution/department: **PSVPEC - Information Technology - Year IV**
- Level: **Easy**
- Suggested duration: **2 days**
- Marks: **70**
- Final submission: one public GitHub repository containing the application, source code, model, documentation, screenshots, demo-video guidance, and `presentation.pdf`.

### Problem

A Farmer Producer Group collects agricultural produce from its members and sells it in bulk. Currently, each member's contribution is recorded on a paper slip at the collection point. Payments are calculated later from a bundle of slips. This process is slow, can cause calculation mistakes, and creates disputes because members cannot easily verify how much they delivered or how much they are owed.

### Objective

Build a digital produce collection and payment register that:

- Records every delivery against the correct farmer/member.
- Captures produce, quantity, unit, rate, date, collection point, and operator.
- Calculates the delivery amount on the server.
- Preserves a trustworthy history of important changes.
- Gives each member a clear statement of deliveries, payments, and outstanding balance.
- Helps the group secretary identify records that may require attention.
- Supports search, filtering, useful ordering, and record counts.
- Includes a small machine-learning classifier for a genuinely uncertain prediction.
- Handles loading, empty, success, validation, and failure states clearly.

### Primary users

- **Collection Operator:** records deliveries at the collection point.
- **Group Secretary:** reviews records, resolves attention cases, records payments, and views member statements.
- **Administrator:** manages members, produce types, collection points, rates, and users.

For the assessment, a simple seeded demo login or lightweight local authentication is acceptable. Do not let authentication complexity prevent the required business flow from working.

## 2. Required technology

Use this practical, local-first stack unless the existing repository already has an equivalent working stack:

- **Frontend:** React 19, TypeScript, Vite, React Router, Tailwind CSS, shadcn/ui or an equivalent accessible component library, Lucide icons, Recharts, and Framer Motion.
- **Backend:** Node.js, Express, TypeScript, Zod validation, and Prisma ORM.
- **Database:** SQLite by default so evaluators can run the project immediately. Keep the Prisma schema portable enough to move to PostgreSQL later.
- **Machine learning:** Python 3 with pandas, scikit-learn, and joblib. Use a standard classifier such as Logistic Regression or Random Forest; do not build an algorithm from scratch.
- **Testing:** Vitest and React Testing Library for frontend tests; Vitest or Jest plus Supertest for API integration tests; a Python test or verification script for the model.
- **Documentation and diagrams:** Markdown, Mermaid or dbdiagram-compatible schema, and a generated `presentation.pdf`.

If a package version causes compatibility problems, use the newest mutually compatible stable version and document the decision.

## 3. Product identity and design direction

### Product name and message

- Product name: **HarvestTrust**
- Tagline: **Every delivery recorded. Every payment explained.**
- Supporting message: **A transparent produce collection and payment register for farmer groups.**

### Visual theme

Create a polished agricultural-finance dashboard, not a generic admin template.

- Primary forest green: `#14532D`
- Action green: `#16A34A`
- Fresh leaf: `#22C55E`
- Harvest amber: `#F59E0B`
- Warm cream background: `#FAF8F1`
- Surface white: `#FFFFFF`
- Dark text: `#17211B`
- Muted text: `#66736B`
- Border: `#DCE5DD`
- Error red: `#DC2626`
- Info blue: `#2563EB`

Use a clean sans-serif such as Inter for UI text and a restrained display font such as Manrope for major headings. Maintain excellent contrast, consistent 8-point spacing, medium-radius cards, soft natural shadows, and generous whitespace.

### Project-related visual language

Use subtle, purposeful visuals related to farming, produce collection, weighing, statements, and trust:

- Abstract field rows, leaf curves, grain patterns, baskets, weighing scales, receipts, and payment/status motifs.
- Use lightweight SVG/CSS illustrations or locally stored open-license assets.
- Do not use decorative stock photos that make the dashboard harder to read.
- Do not use excessive gradients, glassmorphism, neon colors, or unrelated technology imagery.

### Animation and interaction

Use animation to make the application feel alive while remaining professional:

- A subtle field-line or leaf-growth animation in the login/landing hero.
- Smooth page transitions of approximately 180-260 ms.
- Staggered dashboard-card entrance on first load.
- Animated count-up for summary figures.
- Gentle chart transitions.
- A small weighing-scale animation while quantity and rate are being calculated.
- A checkmark/receipt success animation after a collection is saved.
- Smooth table-row highlight when a record is updated.
- Animated drawer/modal entry and skeleton loaders.
- Respect `prefers-reduced-motion` and disable nonessential movement.

Never use distracting continuous motion in data-heavy screens. Animation must not delay data entry or block keyboard users.

### Responsive behavior

- Desktop: collapsible left navigation, top bar, main content grid.
- Tablet: compact sidebar or drawer with two-column forms where space permits.
- Mobile: drawer navigation, single-column forms, sticky bottom submit action on the collection form, card-style record list where a full table is impractical.
- Support at least 360 px width without horizontal page scrolling.

## 4. Navigation and application pages

Implement the following routes and pages.

### 4.1 Login/demo access

- Branded HarvestTrust welcome panel.
- Demo credentials clearly available in the README, not permanently exposed in production UI.
- Email/username and password fields with show/hide password, validation, loading state, and clear error state.
- Optional “Continue in demo mode” button if it speeds evaluation.

### 4.2 Dashboard

Show:

- Today’s collected quantity.
- Today’s collection value.
- Pending payment amount.
- Records requiring attention.
- Active members.
- Seven-day quantity/value trend.
- Produce distribution chart.
- Recent collections.
- Attention queue with the highest-risk items first.
- Quick actions: Record Collection, Add Member, Record Payment, View Statements.

All dashboard values must come from APIs or documented seeded data. Do not leave placeholder figures.

### 4.3 New collection - the required end-to-end vertical slice

This is the highest-priority feature and must work completely from browser to stored database record.

Fields:

- Member: searchable select showing member code and name.
- Collection date and time: default to current local date/time but editable within allowed rules.
- Collection point.
- Produce type.
- Quantity.
- Unit, derived from or constrained by produce type (`kg`, `quintal`, `tonne`, `litre`, `crate`, or another configured unit).
- Rate per unit.
- Optional quality grade.
- Optional moisture percentage where relevant.
- Optional notes.

Show a live preview for convenience, but treat it only as an estimate. The backend must independently validate the fields and calculate the authoritative amount.

Authoritative formula:

```text
grossAmount = round(quantity × ratePerUnit, 2)
```

If deductions are implemented, they must be explicit and transparent:

```text
netAmount = round(grossAmount - totalDeductions, 2)
```

For the Easy-level assessment, deductions may be omitted. If omitted, `netAmount = grossAmount`.

Before final submission, optionally call the prediction endpoint using only pre-outcome inputs and display:

- “Low attention risk,” “Medium attention risk,” or “High attention risk,” plus confidence when the model is confident.
- “No confident prediction - review normally” when confidence is below the configured threshold.
- A short human-readable explanation based on input feature contribution or clearly described heuristics. Do not claim causal certainty.

On save:

1. Validate every field on the server.
2. Verify all referenced member, produce, collection point, operator, and rate data exist and are active.
3. Calculate the amount on the server using decimal-safe logic.
4. Generate a unique, readable receipt/slip number such as `HT-20260724-0001`.
5. Save the delivery, its initial status history, prediction snapshot if available, and audit entry in one database transaction.
6. Return the saved authoritative record.
7. Show a success state with receipt number, amount, and buttons to View Receipt, Record Another, or Open Member Statement.
8. Ensure a refresh proves that the record was stored.

### 4.4 Collection register

Display the most important information:

- Receipt number.
- Date/time.
- Member code and name.
- Produce type.
- Quantity and unit.
- Rate.
- Amount.
- Payment status.
- Attention status/risk.
- Collection point.
- Operator.
- Row actions.

Required behavior:

- Default ordering: unresolved attention cases first, then higher risk/confidence, then newest collection.
- Debounced search by receipt number, member name, member code, or produce name.
- Filters for date range, produce, payment status, attention status, collection point, and member.
- Clear-all filters.
- Display “Showing X of Y records.”
- Server-side pagination, search, ordering, and filtering.
- Useful empty state when no data exists and a different no-results state when filters return nothing.
- Loading skeleton, retryable error state, and accessible table semantics.
- View details; edit only fields allowed by business rules.
- Do not silently overwrite old values. Record changes in the appropriate history/audit table.
- Export the currently filtered list to CSV if time permits.

### 4.5 Collection detail and receipt

Show:

- All delivery fields.
- Transparent amount calculation: `quantity × rate = amount`.
- Member and collection point details.
- Status timeline from the history table.
- Prediction made at collection time, confidence, model version, and whether the user acted on it.
- Audit trail for material changes.
- Payment allocation/status.
- Print-friendly receipt view.

### 4.6 Members

Member list:

- Member code, name, village, phone, status, total delivered, total due, and outstanding balance.
- Search, active/inactive filter, pagination, add/edit member.

Member detail:

- Contact and identity details.
- Delivery summary and recent deliveries.
- Total value, total paid, and outstanding balance.
- Date-filterable statement.
- Print/download-friendly statement containing opening balance if used, each delivery, each payment, and closing balance.

Never expose more personally identifiable information than needed.

### 4.7 Payments

- Record a payment for a member.
- Fields: member, payment date, amount, method, reference number, optional notes.
- Server-side validation and decimal-safe amount handling.
- Prevent zero/negative amounts and prevent accidental overpayment unless an explicit credit-balance design is documented.
- Show member’s amount due before submission and new balance after submission.
- Save payment and audit entry transactionally.
- Payment history with search and filters.

For a simple implementation, payments may reduce the member’s aggregate outstanding balance without allocating to individual deliveries. If allocations are implemented, use a separate `PaymentAllocation` table; do not store comma-separated delivery IDs.

### 4.8 Attention queue

- Show unresolved cases ordered by priority.
- Risk label, confidence, reason/explanation, member, receipt, amount, and age.
- Actions: Review, Mark Resolved, Flag for Follow-up.
- Resolving a case must append status history with actor, timestamp, old status, new status, and note.

### 4.9 Reports/statements

- Group summary for selected date range.
- Member delivery and payment statement.
- Produce-wise quantity and value.
- Outstanding payments.
- Attention-case summary.
- CSV export and print styles.

### 4.10 Settings/master data

Keep this simple:

- Produce types and valid units.
- Collection points.
- Rate history by produce and effective date.
- Users/operators if authentication is implemented.

Changing a rate must add a new `RateHistory` row with effective dates. Do not overwrite the only stored rate because historical delivery calculations must remain explainable. A saved delivery must retain the exact rate used at that time.

## 5. Database design

Use normalized tables. Do not place the entire application in one table. Use UUIDs or another consistent primary-key strategy. Add `createdAt` and `updatedAt` where appropriate.

Implement at least the following entities:

### `User`

- `id` primary key
- `name`
- `email` unique
- `passwordHash` if authentication is enabled
- `role` enum: `OPERATOR`, `SECRETARY`, `ADMIN`
- `isActive`
- timestamps

### `Member`

- `id` primary key
- `memberCode` unique, required
- `fullName` required
- `phone` optional
- `village` optional
- `joinedOn`
- `isActive`
- timestamps

### `ProduceType`

- `id` primary key
- `code` unique
- `name` unique
- `defaultUnit`
- `isActive`
- timestamps

### `CollectionPoint`

- `id` primary key
- `code` unique
- `name`
- `location` optional
- `isActive`
- timestamps

### `RateHistory`

- `id` primary key
- `produceTypeId` foreign key
- `collectionPointId` optional foreign key if rates differ by location
- `ratePerUnit` decimal
- `unit`
- `effectiveFrom`
- `effectiveTo` nullable
- `createdById` foreign key
- `reason` optional
- timestamps

Add logic or a constraint strategy to prevent ambiguous overlapping active rates for the same produce/location/unit combination.

### `Delivery`

- `id` primary key
- `receiptNumber` unique
- `memberId` foreign key
- `produceTypeId` foreign key
- `collectionPointId` foreign key
- `operatorId` foreign key to User
- `rateHistoryId` nullable foreign key when a configured rate was used
- `collectedAt`
- `quantity` decimal greater than zero
- `unit`
- `ratePerUnit` decimal greater than zero
- `grossAmount` decimal greater than or equal to zero
- `netAmount` decimal greater than or equal to zero
- `qualityGrade` optional
- `moisturePercent` optional with valid range
- `notes` optional
- `paymentStatus` enum: `UNPAID`, `PARTIALLY_PAID`, `PAID`
- `attentionStatus` enum: `NONE`, `OPEN`, `FOLLOW_UP`, `RESOLVED`
- timestamps

The stored amount is a server-calculated snapshot, not a client-controlled field.

### `DeliveryStatusHistory`

- `id` primary key
- `deliveryId` foreign key
- `statusType` such as `ATTENTION` or `PAYMENT`
- `oldValue` nullable
- `newValue`
- `note` optional
- `changedById` foreign key
- `changedAt`

This table preserves the timeline rather than overwriting all evidence in `Delivery`.

### `Payment`

- `id` primary key
- `paymentNumber` unique
- `memberId` foreign key
- `amount` decimal greater than zero
- `paidAt`
- `method` enum: `CASH`, `BANK_TRANSFER`, `UPI`, `CHEQUE`, `OTHER`
- `referenceNumber` optional
- `notes` optional
- `recordedById` foreign key
- timestamps

### `PaymentAllocation` - optional but recommended

- `id` primary key
- `paymentId` foreign key
- `deliveryId` foreign key
- `allocatedAmount` decimal greater than zero
- unique compound key as appropriate

### `Prediction`

- `id` primary key
- `deliveryId` nullable foreign key
- `targetName`
- `predictedClass` nullable when confidence is too low
- `probability`
- `confidenceThreshold`
- `modelVersion`
- `featuresJson` containing only the feature snapshot available at prediction time
- `explanationJson` optional
- `createdAt`

### `AttentionOutcome`

- `id` primary key
- `deliveryId` unique foreign key
- `neededAttention` boolean
- `reasonCategory` optional
- `resolvedAt` optional
- `recordedById`
- timestamps

Use this historical outcome as the model target. It must be recorded after review and must not be used as an input feature for that same prediction.

### `AuditLog`

- `id` primary key
- `userId` optional foreign key
- `entityType`
- `entityId`
- `action`
- `beforeJson` optional
- `afterJson` optional
- `createdAt`

### Database rules

- Use foreign keys.
- Use unique constraints for member code, receipt number, payment number, produce code, collection-point code, and user email.
- Use database-supported checks where Prisma/SQLite permits; otherwise enforce the same invariant in a transaction and include direct SQL constraint tests where appropriate.
- Store money and quantity using fixed precision/decimal types, never floating-point arithmetic alone.
- Add indexes for dates, member, produce, payment status, attention status, and fields used in ordering/search.
- Use transactions for a delivery plus its history/prediction/audit records and for payment-related balance changes.
- Use migrations committed to the repository.

Create an ER diagram at `docs/er-diagram.md` using Mermaid and optionally export an image. Beneath it, include this design justification in natural language:

1. Members, produce types, collection points, deliveries, and payments are separate entities so each fact is stored once and relationships stay verifiable.
2. Delivery values keep the exact quantity and rate used at collection time so later rate changes cannot alter old statements.
3. Rate and status changes are append-only history records, allowing the group to answer what changed, when, and by whom.
4. Predictions store their original feature snapshot and model version, allowing results to be audited without using future information.

## 6. API contract

Use a consistent JSON envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "requestId": "..."
}
```

Error envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fieldErrors": {
      "quantity": "Quantity must be greater than zero."
    }
  },
  "requestId": "..."
}
```

Implement at least:

- `POST /api/auth/login`
- `GET /api/dashboard`
- `GET /api/members`
- `POST /api/members`
- `GET /api/members/:id`
- `PATCH /api/members/:id`
- `GET /api/members/:id/statement`
- `GET /api/produce-types`
- `GET /api/collection-points`
- `GET /api/rates/current`
- `GET /api/deliveries`
- `POST /api/deliveries`
- `GET /api/deliveries/:id`
- `PATCH /api/deliveries/:id`
- `POST /api/deliveries/:id/attention-status`
- `POST /api/predictions/attention`
- `GET /api/attention`
- `POST /api/payments`
- `GET /api/payments`
- `GET /api/reports/summary`
- `GET /api/reports/outstanding`
- `GET /api/health`

The delivery list endpoint must accept validated query parameters for:

```text
page, pageSize, search, fromDate, toDate, memberId, produceTypeId,
collectionPointId, paymentStatus, attentionStatus, sortBy, sortDirection
```

Return pagination metadata with total records, page, page size, and displayed count.

## 7. Server-side validation and business rules

Implement server-side validation even if the UI already validates.

- Required IDs must be valid and refer to active records.
- Quantity must be positive and within a documented sensible maximum.
- Rate must be positive and within a documented sensible maximum.
- Date cannot be unreasonably far in the future.
- Moisture percentage, when supplied, must be between 0 and 100.
- Unit must be allowed for the selected produce type.
- Do not accept `grossAmount`, `netAmount`, receipt number, status, prediction class, or operator identity as trusted client-controlled values.
- Normalize search and text fields safely.
- Use parameterized ORM/database queries.
- Return actionable but non-sensitive errors.
- Add centralized error middleware, 404 handling, request IDs, and structured development logging.
- Never fail silently.

Demonstrate at least these rejected inserts:

1. Quantity equal to zero or negative.
2. Rate equal to zero or negative.
3. Missing member.
4. Invalid/nonexistent produce type foreign key.
5. Duplicate receipt number through a direct database constraint test.

Record the exact error returned by the database for constraint-focused tests in `docs/database-constraint-tests.md`. After invalid attempts, prove that a valid record still inserts.

## 8. Machine-learning requirement

### Target

Predict whether a newly entered delivery is likely to **need manual attention** based on historical reviewed cases.

The label is `neededAttention`, recorded only after a secretary reviews a historical delivery. Examples of real outcomes include member dispute, unusual quantity requiring verification, rate disagreement, repeated correction, or missing supporting detail.

Do not train the model to reproduce a fixed rule such as “amount above X.” Do not use future or leaked fields such as:

- `neededAttention`
- final attention status
- resolution reason
- resolved time
- post-delivery edits
- final payment status
- payment delay known only later
- any field created after the prediction moment

### Allowed pre-outcome features

Use only values available at collection time, for example:

- Produce type, encoded safely.
- Collection point, encoded safely.
- Hour of day and day of week.
- Quantity.
- Rate per unit.
- Amount calculated at collection time.
- Quality grade or moisture if already captured.
- Difference between current quantity and that member’s previous average for the same produce, computed only from earlier deliveries.
- Difference between the rate and the prior historical median rate for the produce/location.
- Number of the member’s prior reviewed attention cases.
- Number of prior deliveries by that member.
- Whether optional notes/supporting fields were supplied.

Time-aware feature computation must never include the current outcome or future rows.

### Dataset and training

- Seed enough realistic historical rows to train and test a small model. Aim for 250-500 synthetic historical deliveries with a documented generation method.
- Synthetic records must be clearly labeled as demo data.
- Split into train and test sets before training.
- Use `random_state=42`.
- Use a stratified split when class distribution allows.
- Use a scikit-learn `Pipeline` and `ColumnTransformer`.
- Apply one-hot encoding to categorical variables and suitable imputation/scaling where needed.
- Start with Logistic Regression for explainability. Compare with one simple alternative only if it remains easy to explain.
- Report precision, recall, F1 score, confusion matrix, class distribution, feature list, leakage checks, and limitations.
- Do not present accuracy alone when classes are imbalanced.
- Save the trained pipeline with joblib and store model metadata/version.
- Make training reproducible with `python ml/train.py`.

### Prediction integration

Choose one robust local integration:

1. A small Python prediction service called by the Node API; or
2. A Node child-process adapter with strict timeout/error handling; or
3. Precomputed predictions for seeded demo records plus a clear live prediction adapter.

Prefer a small Python service if it can be started reliably by the documented development command.

Use a configurable confidence threshold, default `0.65`:

- If the highest class probability is at least `0.65`, return the predicted class, probability, risk band, and explanation.
- If it is below `0.65`, set `predictedClass` to `null` and return `NO_CONFIDENT_PREDICTION`.
- The UI must not force a prediction for low-confidence cases.
- If the model is unavailable, collection saving must still be possible. Clearly show “Risk prediction unavailable” and log the technical error without exposing it to the user.

Create:

- `ml/train.py`
- `ml/predict.py` or a small service
- `ml/generate_demo_history.py`
- `ml/requirements.txt`
- `ml/model/` with the generated artifact or instructions to generate it
- `docs/model-card.md`
- tests proving allowed input fields and low-confidence behavior

The model card must explain intended use, target, training data, features, excluded leakage fields, threshold, metrics, limitations, fairness/privacy considerations, and retraining instructions.

## 9. State, accessibility, and usability

Every page and async component must handle:

- Initial loading with skeletons.
- Empty data with a useful action.
- No search/filter results with a clear reset option.
- Success confirmation.
- Inline validation.
- API error with retry where appropriate.
- Offline/network failure message.
- Unauthorized state if authentication exists.

Accessibility:

- Semantic headings and landmarks.
- Proper labels and descriptions for inputs.
- Keyboard-accessible navigation, dialogs, selects, menus, and tables.
- Visible focus indicators.
- ARIA live region for saved/error messages.
- Do not communicate status by color alone; include text and/or icon.
- Sufficient color contrast.
- Reduced-motion support.
- Meaningful titles and alt text; decorative SVGs must be hidden from assistive technology.

Use Indian formatting where relevant:

- Currency: `₹` with `en-IN` formatting.
- Dates: clear human-readable format such as `24 Jul 2026`, while APIs use ISO 8601.
- Quantities always display their unit.

## 10. Suggested repository structure

Use a maintainable structure similar to:

```text
harvesttrust/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── layouts/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── routes/
│   │   │   ├── styles/
│   │   │   └── tests/
│   │   └── ...
│   └── api/
│       ├── src/
│       │   ├── controllers/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── repositories/
│       │   ├── validators/
│       │   ├── middleware/
│       │   ├── utils/
│       │   └── tests/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       └── ...
├── ml/
│   ├── data/
│   ├── model/
│   ├── generate_demo_history.py
│   ├── train.py
│   ├── predict.py
│   ├── requirements.txt
│   └── tests/
├── docs/
│   ├── er-diagram.md
│   ├── architecture.md
│   ├── calculation-verification.md
│   ├── database-constraint-tests.md
│   ├── model-card.md
│   ├── test-report.md
│   ├── screenshots/
│   └── demo-script.md
├── scripts/
├── presentation/
├── presentation.pdf
├── README.md
├── .env.example
├── package.json
└── LICENSE
```

A simpler layout is acceptable if it remains clear and all deliverables are easy to find.

## 11. Seed/demo data

Provide deterministic seed data:

- 2-3 users covering the main roles.
- 25-40 farmer members.
- 6-10 produce types relevant to the region, such as paddy, groundnut, maize, tomato, banana, cotton, milk, or pulses.
- 2-4 collection points.
- Historical rates with different effective dates.
- At least 100 UI-visible delivery records.
- At least 30 payment records.
- A mixture of unpaid, partially paid, and paid deliveries.
- A mixture of no-attention, open, follow-up, and resolved attention cases.
- Sufficient separate historical training rows for the classifier.

Use believable but fictional names and phone numbers. Clearly mark the dataset as synthetic/demo data. Use the same fixed random seed so screenshots and tests remain reproducible.

## 12. Testing requirements

### Main end-to-end flow

Automate or clearly document this exact test:

1. Start with a seeded active member, produce type, collection point, operator, and rate.
2. Open New Collection.
3. Select the member and produce.
4. Enter quantity `125.50 kg` and rate `₹32.40/kg`.
5. Confirm the server-calculated amount is:

```text
125.50 × 32.40 = ₹4,066.20
```

6. Save the record.
7. Confirm the API returns the authoritative amount and receipt number.
8. Refresh or reopen the register and confirm the record exists.
9. Open its detail/receipt and confirm the formula is visible.
10. Open the member statement and confirm the delivery and balance appear.

Record this hand calculation in `docs/calculation-verification.md`.

### Required test coverage

- Unit tests for amount calculation and formatting boundaries.
- API validation tests.
- Integration test from POST delivery to database persistence.
- Transaction rollback test where possible.
- Search, filter, ordering, count, and pagination tests.
- Default attention-first ordering test.
- Member statement balance test.
- Payment validation test.
- Database constraint tests with exact errors.
- Prediction input leakage test.
- Model-unavailable graceful-degradation test.
- Low-confidence prediction test with no forced class.
- Frontend loading, empty, error, and success states.
- Basic accessibility check.

Create `docs/test-report.md` summarizing commands, environment, cases, expected result, actual result, and pass/fail status. Do not claim a test passed unless it was actually run.

## 13. Security and reliability

- Keep secrets in environment variables and provide `.env.example`.
- Hash passwords using bcrypt or Argon2 if login is implemented.
- Validate and sanitize every API input.
- Configure CORS only for expected local origins.
- Use Helmet or equivalent secure HTTP headers.
- Add rate limiting to login and sensitive write endpoints if practical.
- Avoid logging passwords, tokens, phone numbers, or full request bodies containing personal data.
- Never trust role, user ID, amount, or status supplied by the client.
- Use database transactions for multi-record changes.
- Include a health endpoint that checks API and database readiness.

## 14. README and documentation

Create a professional root `README.md` that includes:

1. Project name, tagline, and one-sentence nontechnical solution.
2. Problem and affected users.
3. Features.
4. Screenshots from the actual running application.
5. Architecture overview.
6. Technology stack.
7. Prerequisites.
8. Exact installation and run commands.
9. Environment variables.
10. Database migration and seed commands.
11. ML data generation, training, and serving commands.
12. Demo credentials.
13. Field glossary explaining every collection field.
14. Amount and balance formulas.
15. Search, filter, and ordering behavior.
16. Test commands and known results.
17. What is complete.
18. What remains unfinished, stated honestly in one line if applicable.
19. Limitations and the next improvement.
20. Repository deliverables checklist.

Also create:

- `docs/architecture.md` with a compact system diagram and request flow.
- `docs/er-diagram.md`.
- `docs/model-card.md`.
- `docs/database-constraint-tests.md`.
- `docs/calculation-verification.md`.
- `docs/test-report.md`.
- `docs/demo-script.md` for a 3-5 minute screen recording.

## 15. Presentation requirement

Create an attractive, nontechnical **6-8 slide presentation** and save the final file as `presentation.pdf` in the repository root. Use the HarvestTrust colors and actual screenshots from the running application.

Use this 8-slide structure:

1. **The trust problem** - paper slips delay payments and make member disputes difficult to verify.
2. **Who is affected** - farmers, collection operators, and the group secretary.
3. **The solution** - “HarvestTrust records each delivery immediately, calculates what is owed, and gives every member a clear statement.”
4. **Working collection flow** - actual screenshot of the entry form and saved receipt.
5. **Transparent calculation** - show `125.50 kg × ₹32.40 = ₹4,066.20` in plain language.
6. **Records that need attention first** - screenshot of the ordered register/attention queue and a simple explanation of the classifier, including low-confidence behavior.
7. **What works today** - end-to-end flow, database/history, list/search/filter, statements, prediction integration, and testing; disclose unfinished work honestly.
8. **Next improvement** - member SMS/WhatsApp receipt and offline-first collection-point support.

Presentation rules:

- Lead with the consequence of the problem, not technology.
- Use the application’s own screenshots, not generic mock-ups.
- Keep text brief, large, and readable.
- Include no code screenshots.
- Include a final footer with project name and student details if provided.
- Verify the generated PDF has no clipped, overlapping, or unreadable content.

## 16. Demo video script

Prepare `docs/demo-script.md` for a short recording:

1. Introduce the paper-slip problem in 15-20 seconds.
2. Log in and show the dashboard.
3. Record a new collection using the hand-verification values.
4. Show the saved receipt and server-calculated amount.
5. Refresh the register to prove persistence.
6. Search/filter the list and show attention-first ordering.
7. Open the member statement and show outstanding balance.
8. Show a confident prediction and a low-confidence “no prediction” case.
9. Briefly show the ER diagram and test report.
10. Close with what works and the next improvement.

## 17. Required implementation sequence

Complete work in this order:

### Phase 1 - Foundation

- Initialize repository and scripts.
- Define design tokens and responsive application shell.
- Create database schema, migrations, and seed.
- Add health endpoint and shared error envelope.

### Phase 2 - End-to-end vertical slice

- Build New Collection UI.
- Build server validation and amount calculation.
- Save delivery/history/audit transaction.
- Display saved result and prove persistence.

Do not spend time polishing secondary pages until this flow works.

### Phase 3 - Core register and statements

- Implement list/search/filter/order/count/pagination.
- Implement details/receipt.
- Implement members and member statement.
- Implement payment recording.

### Phase 4 - Prediction

- Generate deterministic historical data.
- Train and evaluate classifier without leakage.
- Integrate prediction at the decision point.
- Implement confidence threshold and graceful failure.

### Phase 5 - Quality and design

- Complete dashboard and attention queue.
- Add project-related animations and responsive polish.
- Implement all loading/empty/error/success states.
- Complete accessibility checks.

### Phase 6 - Test and submit

- Run invalid constraint tests and record exact errors.
- Run valid insert after invalid attempts.
- Complete integration and frontend tests.
- Verify the hand-calculated amount.
- Capture screenshots.
- Create and verify `presentation.pdf`.
- Complete README and demo script.

## 18. Definition of done

The project is complete only when all of the following are true:

- The repository installs from documented commands on a clean machine.
- The database migrates and seeds deterministically.
- The frontend, Node API, database, and Python model can be started using clearly documented commands.
- At least one collection can be created through the UI and found in the database after refresh.
- All delivery fields are validated on the server.
- The authoritative amount is calculated on the server.
- The database is normalized and includes separate rate/status history.
- The ER diagram and design justification exist.
- The classifier predicts a genuinely uncertain attention outcome without future-data leakage.
- Train/test split happens before training and uses a fixed random seed.
- A low-confidence case produces no forced prediction.
- The model result appears on the collection/review workflow.
- The register supports search, at least one filter, attention-first ordering, and displayed record count.
- Loading, empty, no-results, success, and error states are implemented.
- Invalid database inserts are attempted and exact errors documented.
- A valid insert succeeds afterward.
- The manual amount verification matches application data.
- The member statement clearly shows delivered value, payments, and balance.
- Tests are run and results documented honestly.
- The UI is professional, responsive, attractive, agriculture-related, and animated without being distracting.
- Reduced-motion and keyboard accessibility work.
- Actual application screenshots are stored in `docs/screenshots/`.
- `presentation.pdf` contains 6-8 verified slides.
- README explains running, fields, calculations, tests, completion status, and limitations.
- A short demo script exists.
- No page is blank, no important failure is silent, and no placeholder data is presented as live data.

## 19. Final response expected from the coding assistant

After building and verifying the project, provide:

1. A concise statement of what was completed.
2. The repository path.
3. Exact commands to install, migrate, seed, train the model, run the system, and run tests.
4. Demo credentials.
5. A table mapping each assessment task to the implemented files/features.
6. Actual test results, including failures if any.
7. Paths to `README.md`, ER diagram, model card, test report, screenshots, demo script, and `presentation.pdf`.
8. One honest line describing anything unfinished.

Do not mark the project complete if the core collection action, database persistence, list/search/filter, member statement, prediction threshold behavior, tests, or presentation PDF are missing.

## MASTER PROMPT END
