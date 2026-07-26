import os
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def draw_background(canvas, doc):
    canvas.saveState()
    # Fill warm cream background (#FAF8F1)
    canvas.setFillColor(colors.HexColor('#FAF8F1'))
    canvas.rect(0, 0, 792, 612, fill=True, stroke=False)
    
    # Draw top forest green banner (#14532D)
    canvas.setFillColor(colors.HexColor('#14532D'))
    canvas.rect(0, 520, 792, 92, fill=True, stroke=False)
    
    # Draw bottom footer line and text
    canvas.setStrokeColor(colors.HexColor('#DCE5DD'))
    canvas.setLineWidth(1)
    canvas.line(36, 45, 756, 45)
    
    # Footer text
    canvas.setFillColor(colors.HexColor('#66736B'))
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(36, 30, "HarvestTrust Presentation - SIH 2026")
    canvas.drawRightString(756, 30, "JANARTHANAN V | Reg: 411723205021 | Department of IT, PSVPEC")
    canvas.restoreState()

def generate_pdf():
    pdf_path = "../presentation.pdf"
    print(f"Generating presentation PDF at {pdf_path}...")
    
    # Letter size landscape: 11 x 8.5 inches (792 x 612 points)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=landscape(letter),
        leftMargin=36,
        rightMargin=36,
        topMargin=110, # below green banner
        bottomMargin=60
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'SlideTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.white,
        leading=28,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'SlideSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#16A34A'), # action green
        leading=18,
        spaceAfter=25
    )
    
    body_style = ParagraphStyle(
        'SlideBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        textColor=colors.HexColor('#17211B'), # dark text
        leading=19,
        spaceAfter=12
    )

    bullet_style = ParagraphStyle(
        'SlideBullet',
        parent=body_style,
        leftIndent=20,
        firstLineIndent=-10,
        spaceAfter=8
    )

    story = []

    # ==================== SLIDE 1: TITLE SLIDE ====================
    # Since slide 1 needs special layout (e.g. big centered title), we can draw text.
    story.append(Spacer(1, 40))
    story.append(Paragraph("HarvestTrust", title_style))
    story.append(Paragraph("Every delivery recorded. Every payment explained.", subtitle_style))
    story.append(Spacer(1, 20))
    
    intro_text = """
    <b>A Transparent Produce Collection & Payment Register for Farmer Producer Groups</b><br/><br/>
    This digital system replaces traditional paper slips with an immutable SQLite-based collection register, 
    verifies pricing on the server, tracks outstanding dues in a bank-ledger format, and flags potential dispute cases 
    using a Random Forest machine learning classifier.
    """
    story.append(Paragraph(intro_text, body_style))
    story.append(Spacer(1, 40))
    
    student_details = """
    <b>Candidate Details:</b><br/>
    Student Name: JANARTHANAN V (Register Number: 411723205021)<br/>
    Institution/Department: PSVPEC - Department of Information Technology - Year IV<br/>
    Assessment Level: Easy (SIH 2026 Practical Assessment)
    """
    story.append(Paragraph(student_details, body_style))
    story.append(PageBreak())

    # ==================== SLIDE 2: THE TRUST PROBLEM ====================
    story.append(Paragraph("1. The Trust Problem in Farmer Groups", title_style))
    story.append(Paragraph("The inefficiencies of paper-slip collections", subtitle_style))
    
    story.append(Paragraph("• <b>Slow Transactions:</b> Recording delivery info on paper slips causes long queues during harvest times.", bullet_style))
    story.append(Paragraph("• <b>Calculation Inaccuracies:</b> Manual math on multiple slips leads to operator errors in weights and final totals.", bullet_style))
    story.append(Paragraph("• <b>Disputes & Lack of Transparency:</b> Farmers cannot easily verify their delivered history or clarify unpaid dues, leading to loss of trust.", bullet_style))
    story.append(Paragraph("• <b>Delayed Payments:</b> Secretaries spend days aggregating paper bundles to calculate pay registers, delaying farmer payments.", bullet_style))
    
    story.append(PageBreak())

    # ==================== SLIDE 3: WHO IS AFFECTED ====================
    story.append(Paragraph("2. Primary Stakeholders Affected", title_style))
    story.append(Paragraph("Who benefits from the digital transformation", subtitle_style))
    
    story.append(Paragraph("• <b>Collection Operator:</b> Needs a quick, clean interface to weigh produce, select farmers, and save records instantly without doing manual math.", bullet_style))
    story.append(Paragraph("• <b>Farmer / Member:</b> Deserves a transparent, print-ready transaction statement showing opening balance, deliveries, payments, and closing balances.", bullet_style))
    story.append(Paragraph("• <b>Group Secretary:</b> Requires a central dashboard to review attention-flagged anomalies, record payments, and audit material log changes.", bullet_style))
    
    story.append(PageBreak())

    # ==================== SLIDE 4: THE SOLUTION = : HARVESTTRUST ====================
    story.append(Paragraph("3. The Solution: HarvestTrust", title_style))
    story.append(Paragraph("A digital ledger and decision engine for agriculture", subtitle_style))
    
    story.append(Paragraph("• <b>Digital Capture:</b> Replaces paper with a simple React-Vite web app connected to a central Express/Prisma server.", bullet_style))
    story.append(Paragraph("• <b>Authoritative Pricing:</b> Final amount computed securely on the server to prevent operator tampering or error.", bullet_style))
    story.append(Paragraph("• <b>Account Statement:</b> Full bank-style ledger tracks outstanding balances for each farmer dynamically.", bullet_style))
    story.append(Paragraph("• <b>Risk Engine:</b> Machine learning predicts potential disputes or anomalous inputs at collection time.", bullet_style))
    
    story.append(PageBreak())

    # ==================== SLIDE 5: WORKING COLLECTION FLOW ====================
    story.append(Paragraph("4. End-to-End Collection Flow", title_style))
    story.append(Paragraph("Recording a new produce collection with server validation", subtitle_style))
    
    # Left column text, right column screenshot
    text_p = Paragraph("""
    The Operator enters the farmer code, selects the produce type, and inputs the scale weight.
    <br/><br/>
    <b>Authoritative server-side calculations:</b>
    - Auto-fills base rates according to effective rate history.
    - Gross & Net amounts are calculated on the backend using decimal-safe rounding.
    - Generates a unique, readable slip receipt number (e.g. <i>HT-20260724-0006</i>).
    """, body_style)
    
    # Image check
    img_path = "../docs/screenshots/receipt_success.png"
    if os.path.exists(img_path):
        img = Image(img_path, width=380, height=210)
    else:
        img = Paragraph("<i>Screenshot file missing (receipt_success.png)</i>", body_style)

    table_data = [[text_p, img]]
    t = Table(table_data, colWidths=[340, 380])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t)
    story.append(PageBreak())

    # ==================== SLIDE 6: TRANSPARENT CALCULATION ====================
    story.append(Paragraph("5. Server-Side Calculation Verification", title_style))
    story.append(Paragraph("Validating pricing math and SQLite constraint transactions", subtitle_style))
    
    story.append(Paragraph("<b>Authoritative Formula:</b>", body_style))
    story.append(Paragraph("$$\\text{grossAmount} = \\text{round}(\\text{quantity} \\times \\text{ratePerUnit}, 2)$$", body_style))
    story.append(Paragraph("<b>Verification Hand Math:</b>", body_style))
    story.append(Paragraph("Quantity: <b>125.50 kg</b> | Rate: <b>₹32.40 / kg</b>", bullet_style))
    story.append(Paragraph("Calculated: $125.50 \\times 32.40 = \\mathbf{₹4,066.20}$", bullet_style))
    
    story.append(Paragraph("<br/><b>Transaction Rollback & SQLite Security:</b>", body_style))
    story.append(Paragraph("- Reject zero/negative quantity or rate. Reject duplicate receipts.", bullet_style))
    story.append(Paragraph("- Rollback database if any related operation fails during multi-row insert.", bullet_style))
    story.append(PageBreak())

    # ==================== SLIDE 7: RISKY ITEMS FIRST ====================
    story.append(Paragraph("6. Prioritizing Attention Cases first", title_style))
    story.append(Paragraph("Machine learning decision assistance and threshold rules", subtitle_style))
    
    text_p_7 = Paragraph("""
    A Random Forest model classifier runs live before submission on pre-outcome inputs:
    - Flags high moisture (e.g. &gt;18%), odd hours, or quality/rate conflicts.
    - Confidence threshold rule set at <b>65%</b>.
    - Low-confidence predictions produce no class, indicating <i>Review Normally</i>.
    - High-risk cases are ordered first in the register and sent to the Secretary's review queue.
    """, body_style)
    
    img_path_7 = "../docs/screenshots/attention_queue.png"
    if os.path.exists(img_path_7):
        img_7 = Image(img_path_7, width=380, height=210)
    else:
        img_7 = Paragraph("<i>Screenshot file missing (attention_queue.png)</i>", body_style)

    table_data_7 = [[text_p_7, img_7]]
    t_7 = Table(table_data_7, colWidths=[340, 380])
    t_7.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_7)
    story.append(PageBreak())

    # ==================== SLIDE 8: SUMMARY & NEXT STEPS ====================
    story.append(Paragraph("7. HarvestTrust Outcomes & Next Improvements", title_style))
    story.append(Paragraph("Current implementation status and future enhancements", subtitle_style))
    
    story.append(Paragraph("<b>Working Today:</b>", body_style))
    story.append(Paragraph("✓ End-to-end receipt collection, validation, and storage.", bullet_style))
    story.append(Paragraph("✓ Chronological member statements calculating running balances.", bullet_style))
    story.append(Paragraph("✓ Random Forest risk classifier (Accuracy 79%).", bullet_style))
    story.append(Paragraph("✓ CSV summary exports, print stylesheet layouts, and automated test reports.", bullet_style))
    
    story.append(Paragraph("<br/><b>Next Improvements:</b>", body_style))
    story.append(Paragraph("1. <b>Farmer SMS/WhatsApp Integrations:</b> Send instant receipts/ledger statement updates.", bullet_style))
    story.append(Paragraph("2. <b>Offline-First Support:</b> Allow operators to record weights offline during network failures.", bullet_style))
    
    doc.build(story, onFirstPage=draw_background, onLaterPages=draw_background)
    print("Presentation PDF successfully generated.")

if __name__ == '__main__':
    generate_pdf()
