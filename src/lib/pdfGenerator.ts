import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export async function generateInvoicePdfBuffer(invoice: any, verificationUrl: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fontSize(20).text('INVOICE', { align: 'right' });
      doc.moveDown();

      // Seller Info (Placeholder or from config)
      doc.fontSize(10).text('Manageo App', 50, 100);
      doc.text('123 Business Road', 50, 115);
      doc.text('Business City, 1000', 50, 130);

      // Invoice Info
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 400, 100, { align: 'right' });
      doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 400, 115, { align: 'right' });
      if (invoice.dueDate) {
        doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 130, { align: 'right' });
      }
      doc.text(`Status: ${invoice.status.toUpperCase()}`, 400, 145, { align: 'right' });

      // Client Info
      doc.moveDown(3);
      doc.fontSize(12).text('Billed To:', 50, 180);
      doc.fontSize(10).text(invoice.clientName, 50, 195);
      if (invoice.clientEmail) doc.text(invoice.clientEmail, 50, 210);
      if (invoice.clientAddress) doc.text(invoice.clientAddress, 50, 225);

      // Line Items Table Header
      let y = 300;
      doc.rect(50, y, 500, 20).fill('#f4f4f4').stroke();
      doc.fillColor('#000000');
      doc.fontSize(10).text('Description', 60, y + 5);
      doc.text('Qty', 350, y + 5, { width: 40, align: 'right' });
      doc.text('Unit Price', 400, y + 5, { width: 60, align: 'right' });
      doc.text('Amount', 470, y + 5, { width: 70, align: 'right' });
      
      y += 25;

      // Line Items
      invoice.items.forEach((item: any) => {
        const qty = item.quantity;
        const unitPrice = parseFloat(item.unitPrice.toString());
        const amount = parseFloat(item.amount.toString());
        
        doc.text(item.description, 60, y, { width: 280 });
        doc.text(qty.toString(), 350, y, { width: 40, align: 'right' });
        doc.text(`${unitPrice.toFixed(2)}`, 400, y, { width: 60, align: 'right' });
        doc.text(`${amount.toFixed(2)}`, 470, y, { width: 70, align: 'right' });
        
        y += 20;
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
      });

      // Totals
      doc.moveTo(350, y).lineTo(540, y).stroke();
      y += 10;
      doc.text('Subtotal:', 350, y, { width: 90, align: 'right' });
      doc.text(`${parseFloat(invoice.subtotal.toString()).toFixed(2)}`, 450, y, { width: 90, align: 'right' });
      y += 15;

      if (invoice.taxRate > 0) {
        doc.text(`Tax (${invoice.taxRate}%):`, 350, y, { width: 90, align: 'right' });
        doc.text(`${parseFloat(invoice.taxAmount.toString()).toFixed(2)}`, 450, y, { width: 90, align: 'right' });
        y += 15;
      }

      if (invoice.discountAmount && parseFloat(invoice.discountAmount.toString()) > 0) {
        doc.text('Discount:', 350, y, { width: 90, align: 'right' });
        doc.text(`-${parseFloat(invoice.discountAmount.toString()).toFixed(2)}`, 450, y, { width: 90, align: 'right' });
        y += 15;
      }

      doc.fontSize(12).text(`Total (${invoice.currency}):`, 350, y, { width: 90, align: 'right' });
      doc.text(`${parseFloat(invoice.totalAmount.toString()).toFixed(2)}`, 450, y, { width: 90, align: 'right' });

      // Notes
      if (invoice.notes) {
        y += 40;
        doc.fontSize(10).text('Notes:', 50, y);
        doc.text(invoice.notes, 50, y + 15, { width: 300 });
      }

      // QR Code
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);
        doc.image(qrCodeDataUrl, 50, 700, { width: 60 });
        doc.fontSize(8).text('Scan to verify invoice', 115, 725);
      } catch (err) {
        console.error("Failed to generate QR code", err);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
