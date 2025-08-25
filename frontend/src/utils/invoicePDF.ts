import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './currency';
import { formatDate } from './date';

interface InvoicePDFData {
  invoice: any;
  tenant: any;
  customer: any;
}

export const generateInvoicePDF = ({ invoice, tenant, customer }: InvoicePDFData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Modern color palette
  const colors = {
    primary: [25, 118, 210] as [number, number, number], // #1976d2
    secondary: [117, 117, 117] as [number, number, number], // #757575
    accent: [76, 175, 80] as [number, number, number], // #4caf50
    warning: [255, 152, 0] as [number, number, number], // #ff9800
    error: [244, 67, 54] as [number, number, number], // #f44336
    light: [245, 245, 245] as [number, number, number], // #f5f5f5
    white: [255, 255, 255] as [number, number, number],
    dark: [33, 33, 33] as [number, number, number], // #212121
    text: [66, 66, 66] as [number, number, number] // #424242
  };

  // Helper function to add a colored rectangle
  const addRect = (x: number, y: number, w: number, h: number, color: [number, number, number], radius = 0) => {
    doc.setFillColor(color[0], color[1], color[2]);
    if (radius > 0) {
      doc.roundedRect(x, y, w, h, radius, radius, 'F');
    } else {
      doc.rect(x, y, w, h, 'F');
    }
  };

  // Helper function to add text with proper alignment
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    const { 
      fontSize = 10, 
      color = colors.text, 
      fontStyle = 'normal', 
      align = 'left',
      maxWidth = null
    } = options;
    
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', fontStyle);
    
    if (maxWidth && doc.getStringUnitWidth(text) * fontSize > maxWidth) {
      const splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, x, y, { align });
      return splitText.length * (fontSize * 0.35); // Approximate line height
    } else {
      doc.text(text, x, y, { align });
      return fontSize * 0.35; // Single line height
    }
  };

  // Header background with gradient effect (simulated with multiple rectangles)
  const headerHeight = 80;
  for (let i = 0; i < headerHeight; i += 2) {
    const opacity = 1 - (i / headerHeight) * 0.3;
    const color = colors.primary.map(c => Math.round(c + (255 - c) * (1 - opacity))) as [number, number, number];
    addRect(0, i, pageWidth, 2, color);
  }

  // Company logo placeholder (you can add actual logo here)
  addRect(margin, 25, 40, 40, colors.white, 5);
  addText('LOGO', margin + 20, 48, { fontSize: 12, color: colors.primary, align: 'center' });

  // Company information
  let yPos = 25;
  addText(tenant?.name || 'Your Company', margin + 50, yPos, { 
    fontSize: 24, 
    color: colors.white, 
    fontStyle: 'bold' 
  });
  
  yPos += 12;
  addText(tenant?.legal_name || 'Legal Company Name', margin + 50, yPos, { 
    fontSize: 11, 
    color: [240, 240, 240] as [number, number, number]
  });

  // Company contact details in right column
  yPos = 25;
  const rightX = pageWidth - margin - 80;
  
  if (tenant?.address) {
    addText(tenant.address, rightX, yPos, { fontSize: 9, color: colors.white });
    yPos += 6;
  }
  
  if (tenant?.city || tenant?.country) {
    const location = [tenant?.city, tenant?.country].filter(Boolean).join(', ');
    addText(location, rightX, yPos, { fontSize: 9, color: colors.white });
    yPos += 6;
  }
  
  if (tenant?.phone) {
    addText(`📞 ${tenant.phone}`, rightX, yPos, { fontSize: 9, color: colors.white });
    yPos += 6;
  }
  
  if (tenant?.email) {
    addText(`✉️ ${tenant.email}`, rightX, yPos, { fontSize: 9, color: colors.white });
    yPos += 6;
  }

  if (tenant?.website) {
    addText(`🌐 ${tenant.website}`, rightX, yPos, { fontSize: 9, color: colors.white });
  }

  // Invoice title and details box
  yPos = headerHeight + 20;
  
  // Invoice title with background
  addRect(margin, yPos, pageWidth - 2 * margin, 35, colors.light, 5);
  
  // INVOICE text
  addText('INVOICE', margin + 10, yPos + 15, { 
    fontSize: 32, 
    color: colors.primary, 
    fontStyle: 'bold' 
  });

  // Invoice details on the right
  const detailsX = pageWidth - margin - 120;
  
  // Invoice number with background highlight
  addRect(detailsX, yPos + 5, 110, 8, colors.primary);
  addText(`INVOICE #${invoice.invoice_number}`, detailsX + 5, yPos + 11, { 
    fontSize: 10, 
    color: colors.white, 
    fontStyle: 'bold' 
  });

  addText(`Issue Date: ${formatDate(invoice.invoice_date)}`, detailsX, yPos + 22, { 
    fontSize: 10, 
    color: colors.text 
  });
  
  addText(`Due Date: ${formatDate(invoice.due_date)}`, detailsX, yPos + 30, { 
    fontSize: 10, 
    color: colors.text 
  });

  // Status badge with proper styling
  const getStatusColor = (status: string): [number, number, number] => {
    const statusColors: Record<string, [number, number, number]> = {
      draft: colors.secondary,
      sent: colors.primary,
      paid: colors.accent,
      partially_paid: colors.warning,
      overdue: colors.error,
      cancelled: colors.secondary
    };
    return statusColors[status] || colors.secondary;
  };

  const statusColor = getStatusColor(invoice.status);
  const statusY = yPos + 40;
  addRect(detailsX, statusY, 50, 12, statusColor, 6);
  addText(invoice.status.replace('_', ' ').toUpperCase(), detailsX + 25, statusY + 8, { 
    fontSize: 9, 
    color: colors.white, 
    fontStyle: 'bold',
    align: 'center' 
  });

  // Bill To section with modern styling
  yPos += 70;
  
  // Section header
  addRect(margin, yPos, pageWidth - 2 * margin, 20, colors.light);
  addText('BILL TO', margin + 10, yPos + 12, { 
    fontSize: 12, 
    color: colors.primary, 
    fontStyle: 'bold' 
  });

  yPos += 30;
  
  // Customer details in a clean box
  const customerBoxHeight = 50;
  addRect(margin, yPos, (pageWidth - 2 * margin) / 2 - 5, customerBoxHeight, colors.white);
  doc.setDrawColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.rect(margin, yPos, (pageWidth - 2 * margin) / 2 - 5, customerBoxHeight);

  let customerY = yPos + 12;
  addText(customer?.name || 'Customer Name', margin + 10, customerY, { 
    fontSize: 14, 
    color: colors.dark, 
    fontStyle: 'bold' 
  });
  
  customerY += 8;
  if (customer?.email) {
    addText(`✉️ ${customer.email}`, margin + 10, customerY, { fontSize: 10, color: colors.text });
    customerY += 6;
  }
  
  if (customer?.phone) {
    addText(`📞 ${customer.phone}`, margin + 10, customerY, { fontSize: 10, color: colors.text });
    customerY += 6;
  }

  // Payment terms and other details on the right
  const paymentBoxX = margin + (pageWidth - 2 * margin) / 2 + 5;
  addRect(paymentBoxX, yPos, (pageWidth - 2 * margin) / 2 - 5, customerBoxHeight, colors.white);
  doc.setDrawColor(colors.light[0], colors.light[1], colors.light[2]);
  doc.rect(paymentBoxX, yPos, (pageWidth - 2 * margin) / 2 - 5, customerBoxHeight);

  let paymentY = yPos + 12;
  addText('PAYMENT TERMS', paymentBoxX + 10, paymentY, { 
    fontSize: 11, 
    color: colors.primary, 
    fontStyle: 'bold' 
  });
  
  paymentY += 8;
  addText(invoice.payment_terms?.replace('_', ' ').toUpperCase() || 'NET 30', paymentBoxX + 10, paymentY, { 
    fontSize: 10, 
    color: colors.text 
  });

  // Items table with modern styling
  yPos += customerBoxHeight + 30;

  const tableHeaders = ['DESCRIPTION', 'QTY', 'UNIT PRICE', 'DISCOUNT', 'AMOUNT'];
  const tableRows = invoice.items.map((item: any) => {
    const subtotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
    const discountAmount = subtotal * (parseFloat(item.discount_percent || 0) / 100);
    const lineTotal = subtotal - discountAmount;

    return [
      `${item.product_name}\n${item.product_sku ? `SKU: ${item.product_sku}` : ''}`,
      parseFloat(item.quantity).toLocaleString(),
      formatCurrency(item.unit_price, tenant?.currency),
      item.discount_percent ? `${parseFloat(item.discount_percent)}%` : '—',
      formatCurrency(lineTotal, tenant?.currency)
    ];
  });

  // Enhanced table with better styling
  autoTable(doc, {
    head: [tableHeaders],
    body: tableRows,
    startY: yPos,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 10,
      cellPadding: { top: 8, right: 5, bottom: 8, left: 5 },
      lineColor: colors.light,
      lineWidth: 0.5,
      textColor: colors.text,
    },
    headStyles: {
      fillColor: colors.primary,
      textColor: colors.white,
      fontStyle: 'bold',
      fontSize: 11,
      cellPadding: { top: 12, right: 5, bottom: 12, left: 5 },
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250], // Very light gray
    },
    columnStyles: {
      0: { cellWidth: 90 }, // Description
      1: { cellWidth: 25, halign: 'center' }, // Quantity
      2: { cellWidth: 35, halign: 'right' }, // Unit Price
      3: { cellWidth: 25, halign: 'center' }, // Discount
      4: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }, // Amount
    },
    didDrawCell: (data) => {
      // Add subtle borders
      if (data.section === 'body') {
        doc.setDrawColor(colors.light[0], colors.light[1], colors.light[2]);
        doc.line(data.cell.x, data.cell.y + data.cell.height, 
                data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    }
  });

  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 20;

  // Totals section with professional styling
  const totalsBoxWidth = 120;
  const totalsX = pageWidth - margin - totalsBoxWidth;
  let totalsY = finalY;

  // Calculate all totals
  const subtotal = invoice.items.reduce((sum: number, item: any) => {
    return sum + (parseFloat(item.quantity) * parseFloat(item.unit_price));
  }, 0);

  const totalItemDiscounts = invoice.items.reduce((sum: number, item: any) => {
    const itemSubtotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
    return sum + (itemSubtotal * (parseFloat(item.discount_percent || 0) / 100));
  }, 0);

  // Totals background
  const totalsHeight = 120;
  addRect(totalsX - 10, totalsY - 10, totalsBoxWidth + 20, totalsHeight, colors.light, 5);

  // Subtotal
  addText('Subtotal:', totalsX, totalsY, { fontSize: 11, color: colors.text });
  addText(formatCurrency(subtotal, tenant?.currency), totalsX + 90, totalsY, { 
    fontSize: 11, 
    color: colors.text, 
    align: 'right' 
  });
  totalsY += 12;

  // Item discounts
  if (totalItemDiscounts > 0) {
    addText('Item Discounts:', totalsX, totalsY, { fontSize: 11, color: colors.text });
    addText(`-${formatCurrency(totalItemDiscounts, tenant?.currency)}`, totalsX + 90, totalsY, { 
      fontSize: 11, 
      color: colors.error, 
      align: 'right' 
    });
    totalsY += 12;
  }

  // Additional discount
  if (invoice.discount_amount > 0) {
    addText('Additional Discount:', totalsX, totalsY, { fontSize: 11, color: colors.text });
    addText(`-${formatCurrency(invoice.discount_amount, tenant?.currency)}`, totalsX + 90, totalsY, { 
      fontSize: 11, 
      color: colors.error, 
      align: 'right' 
    });
    totalsY += 12;
  }

  // Tax
  if (invoice.tax_amount > 0) {
    addText('Tax:', totalsX, totalsY, { fontSize: 11, color: colors.text });
    addText(formatCurrency(invoice.tax_amount, tenant?.currency), totalsX + 90, totalsY, { 
      fontSize: 11, 
      color: colors.text, 
      align: 'right' 
    });
    totalsY += 12;
  }

  // Separator line
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(1);
  doc.line(totalsX, totalsY + 5, totalsX + 90, totalsY + 5);
  totalsY += 18;

  // Total with highlight
  addRect(totalsX - 5, totalsY - 8, 100, 16, colors.primary, 3);
  addText('TOTAL:', totalsX, totalsY, { 
    fontSize: 14, 
    color: colors.white, 
    fontStyle: 'bold' 
  });
  addText(formatCurrency(invoice.total_amount, tenant?.currency), totalsX + 85, totalsY, { 
    fontSize: 14, 
    color: colors.white, 
    fontStyle: 'bold',
    align: 'right' 
  });

  // Payment status section
  if (invoice.paid_amount > 0) {
    totalsY += 25;
    
    addText('Amount Paid:', totalsX, totalsY, { 
      fontSize: 11, 
      color: colors.accent, 
      fontStyle: 'bold' 
    });
    addText(formatCurrency(invoice.paid_amount, tenant?.currency), totalsX + 90, totalsY, { 
      fontSize: 11, 
      color: colors.accent, 
      fontStyle: 'bold',
      align: 'right' 
    });
    
    totalsY += 12;
    addText('Balance Due:', totalsX, totalsY, { 
      fontSize: 12, 
      color: colors.error, 
      fontStyle: 'bold' 
    });
    addText(formatCurrency(invoice.balance_due || (invoice.total_amount - invoice.paid_amount), tenant?.currency), totalsX + 90, totalsY, { 
      fontSize: 12, 
      color: colors.error, 
      fontStyle: 'bold',
      align: 'right' 
    });
  }

  // Notes section with styling
  if (invoice.notes && invoice.notes.trim()) {
    const notesY = Math.max(totalsY + 40, pageHeight - 100);
    
    addRect(margin, notesY - 10, pageWidth - 2 * margin, 35, colors.light, 3);
    addText('NOTES', margin + 10, notesY, { 
      fontSize: 12, 
      color: colors.primary, 
      fontStyle: 'bold' 
    });
    
    const notesText = invoice.notes.trim();
    const maxWidth = pageWidth - 2 * margin - 20;
    addText(notesText, margin + 10, notesY + 12, { 
      fontSize: 10, 
      color: colors.text,
      maxWidth: maxWidth
    });
  }

  // Terms & Conditions
  if (invoice.terms_conditions && invoice.terms_conditions.trim()) {
    const termsY = Math.max(totalsY + 80, pageHeight - 60);
    
    addText('Terms & Conditions:', margin, termsY, { 
      fontSize: 11, 
      color: colors.secondary, 
      fontStyle: 'bold' 
    });
    
    const termsText = invoice.terms_conditions.trim();
    const maxWidth = pageWidth - 2 * margin;
    addText(termsText, margin, termsY + 8, { 
      fontSize: 9, 
      color: colors.secondary,
      maxWidth: maxWidth
    });
  }

  // Professional footer with gradient background
  const footerY = pageHeight - 25;
  addRect(0, footerY - 5, pageWidth, 30, colors.primary);
  
  addText('Thank you for your business! 🙏', pageWidth / 2, footerY + 5, { 
    fontSize: 12, 
    color: colors.white, 
    fontStyle: 'bold',
    align: 'center' 
  });
  
  if (tenant?.website) {
    addText(`Visit us: ${tenant.website}`, pageWidth / 2, footerY + 12, { 
      fontSize: 10, 
      color: colors.white,
      align: 'center' 
    });
  }

  return doc;
};

export const downloadInvoicePDF = (invoiceData: InvoicePDFData) => {
  const doc = generateInvoicePDF(invoiceData);
  const filename = `Invoice-${invoiceData.invoice.invoice_number}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};

export const previewInvoicePDF = (invoiceData: InvoicePDFData) => {
  const doc = generateInvoicePDF(invoiceData);
  const pdfDataUri = doc.output('datauristring');
  const newWindow = window.open();
  if (newWindow) {
    newWindow.document.write(`
      <html>
        <head>
          <title>Invoice Preview - ${invoiceData.invoice.invoice_number}</title>
          <style>
            body { margin: 0; padding: 0; }
            iframe { border: none; }
          </style>
        </head>
        <body>
          <iframe width='100%' height='100%' src='${pdfDataUri}'></iframe>
        </body>
      </html>
    `);
  }
};