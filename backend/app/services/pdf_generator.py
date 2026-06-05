from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
import io


# Brand colors
BRAND_BLUE = colors.HexColor('#1e40af')
BRAND_ORANGE = colors.HexColor('#f97316')
LIGHT_GRAY = colors.HexColor('#f8fafc')
DARK_GRAY = colors.HexColor('#1e293b')
MID_GRAY = colors.HexColor('#64748b')


def generate_invoice_pdf(shipment) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Header ──────────────────────────────────────────────────────────────
    header_data = [
        [
            Paragraph('<font color="#1e40af"><b>CargoFlow</b></font>', ParagraphStyle(
                'brand', fontSize=24, textColor=BRAND_BLUE, fontName='Helvetica-Bold'
            )),
            Paragraph(
                f'<font color="#64748b">INVOICE</font><br/>'
                f'<font size="10" color="#1e293b"><b>#{shipment.tracking_number}</b></font>',
                ParagraphStyle('inv', fontSize=18, alignment=TA_RIGHT, textColor=MID_GRAY)
            ),
        ]
    ]
    header_table = Table(header_data, colWidths=[90 * mm, 80 * mm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width='100%', thickness=2, color=BRAND_BLUE))
    story.append(Spacer(1, 6 * mm))

    # ── Invoice Meta ────────────────────────────────────────────────────────
    meta_data = [
        ['Invoice Date:', datetime.utcnow().strftime('%B %d, %Y'),
         'Status:', shipment.payment_status.upper()],
        ['Shipment Date:', shipment.created_at.strftime('%B %d, %Y') if shipment.created_at else '-',
         'Priority:', shipment.priority.upper()],
        ['Est. Delivery:', shipment.estimated_delivery.strftime('%B %d, %Y') if shipment.estimated_delivery else '-',
         'Package Type:', (shipment.package_type or '-').upper()],
    ]
    meta_table = Table(meta_data, colWidths=[40 * mm, 55 * mm, 30 * mm, 45 * mm])
    meta_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (0, -1), MID_GRAY),
        ('TEXTCOLOR', (2, 0), (2, -1), MID_GRAY),
        ('TEXTCOLOR', (1, 0), (1, -1), DARK_GRAY),
        ('TEXTCOLOR', (3, 0), (3, -1), DARK_GRAY),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6 * mm))

    # ── From / To ───────────────────────────────────────────────────────────
    sender = shipment.sender
    from_lines = [
        '<b>FROM</b>',
        sender.name if sender else 'N/A',
        sender.email if sender else '',
        sender.phone if sender else '',
        shipment.pickup_address or '',
        f"{shipment.pickup_city or ''}, {shipment.pickup_state or ''} {shipment.pickup_zip or ''}",
        shipment.pickup_country or '',
    ]
    to_lines = [
        '<b>TO</b>',
        shipment.recipient_name or 'N/A',
        shipment.recipient_email or '',
        shipment.recipient_phone or '',
        shipment.delivery_address or '',
        f"{shipment.delivery_city or ''}, {shipment.delivery_state or ''} {shipment.delivery_zip or ''}",
        shipment.delivery_country or '',
    ]

    addr_style = ParagraphStyle('addr', fontSize=9, leading=14, textColor=DARK_GRAY)
    label_style = ParagraphStyle('label', fontSize=10, textColor=BRAND_BLUE, fontName='Helvetica-Bold')

    from_paras = [Paragraph(line, label_style if i == 0 else addr_style) for i, line in enumerate(from_lines)]
    to_paras = [Paragraph(line, label_style if i == 0 else addr_style) for i, line in enumerate(to_lines)]

    addr_data = [[from_paras, to_paras]]
    addr_table = Table(addr_data, colWidths=[85 * mm, 85 * mm])
    addr_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (0, 0), LIGHT_GRAY),
        ('BACKGROUND', (1, 0), (1, 0), LIGHT_GRAY),
        ('BOX', (0, 0), (0, 0), 0.5, colors.HexColor('#e2e8f0')),
        ('BOX', (1, 0), (1, 0), 0.5, colors.HexColor('#e2e8f0')),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(addr_table)
    story.append(Spacer(1, 6 * mm))

    # ── Package Details ──────────────────────────────────────────────────────
    story.append(Paragraph('<b>Package Details</b>', ParagraphStyle(
        'section', fontSize=11, textColor=BRAND_BLUE, fontName='Helvetica-Bold', spaceAfter=4
    )))

    pkg_data = [
        ['Description', 'Weight', 'Dimensions', 'Declared Value'],
        [
            shipment.description or 'General Cargo',
            f"{shipment.weight or 0} kg",
            shipment.dimensions or 'N/A',
            f"${shipment.declared_value or 0:.2f}",
        ]
    ]
    pkg_table = Table(pkg_data, colWidths=[70 * mm, 30 * mm, 40 * mm, 30 * mm])
    pkg_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_GRAY]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(pkg_table)
    story.append(Spacer(1, 6 * mm))

    # ── Cost Breakdown ───────────────────────────────────────────────────────
    story.append(Paragraph('<b>Cost Breakdown</b>', ParagraphStyle(
        'section', fontSize=11, textColor=BRAND_BLUE, fontName='Helvetica-Bold', spaceAfter=4
    )))

    cost_data = [
        ['Item', 'Amount'],
        ['Shipping Cost', f"${shipment.shipping_cost:.2f}"],
        ['Insurance', f"${shipment.insurance_cost:.2f}"],
        ['', ''],
        ['TOTAL', f"${shipment.total_cost:.2f}"],
    ]
    cost_table = Table(cost_data, colWidths=[120 * mm, 50 * mm])
    cost_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 4), (-1, 4), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BACKGROUND', (0, 4), (-1, 4), BRAND_ORANGE),
        ('TEXTCOLOR', (0, 4), (-1, 4), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(cost_table)
    story.append(Spacer(1, 10 * mm))

    # ── Footer ───────────────────────────────────────────────────────────────
    story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#e2e8f0')))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(
        'Thank you for choosing <b>CargoFlow</b>. For support: support@cargoflow.com | +1-800-CARGO-FL',
        ParagraphStyle('footer', fontSize=8, textColor=MID_GRAY, alignment=TA_CENTER)
    ))

    doc.build(story)
    return buffer.getvalue()
