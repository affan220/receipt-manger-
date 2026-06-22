import jsPDF from "jspdf";
import QRCode from "qrcode";
import { Member, OrgSettings, MONTHS, nextReceiptNumber } from "./store";

const SMALL_NUMBERS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function wordsBelowThousand(value: number): string {
  const parts: string[] = [];
  const hundred = Math.floor(value / 100);
  const rest = value % 100;
  if (hundred) parts.push(`${SMALL_NUMBERS[hundred]} hundred`);
  if (rest) {
    if (rest < 20) parts.push(SMALL_NUMBERS[rest]);
    else {
      const ten = Math.floor(rest / 10);
      const one = rest % 10;
      parts.push(one ? `${TENS[ten]} ${SMALL_NUMBERS[one]}` : TENS[ten]);
    }
  }
  return parts.join(" ");
}

function amountToWords(amount: number, currency: string): string {
  const whole = Math.round(amount);
  if (!whole) return "Zero Only";
  const units = [
    { value: 10000000, label: "crore" },
    { value: 100000, label: "lakh" },
    { value: 1000, label: "thousand" },
    { value: 1, label: "" },
  ];
  let remaining = whole;
  const parts: string[] = [];
  for (const unit of units) {
    const count = Math.floor(remaining / unit.value);
    if (count) {
      parts.push(`${wordsBelowThousand(count)}${unit.label ? ` ${unit.label}` : ""}`);
      remaining %= unit.value;
    }
  }
  const currencyName = currency === "$" ? "dollars" : currency === "£" ? "pounds" : "rupees";
  const text = `${parts.join(" ")} ${currencyName} only`;
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pdfCurrencyLabel(currency: string): string {
  if (currency === "₹" || currency.toLowerCase().includes("rs")) return "Rs.";
  if (currency === "$") return "$";
  if (currency === "£") return "GBP";
  if (currency === "€") return "EUR";
  return currency.replace(/[^\x20-\x7E]/g, "").trim() || "Amount";
}

function formatPdfAmount(amount: number, currency: string): string {
  const formatted = amount.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${pdfCurrencyLabel(currency)} ${formatted}`;
}

export async function generateReceiptPDF(member: Member, settings: OrgSettings) {
  const doc = new jsPDF({ unit: "pt", format: "a5", orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const receiptNo = nextReceiptNumber(settings.receiptPrefix);
  const amountText = formatPdfAmount(member.amount, settings.currency);
  const amountWords = amountToWords(member.amount, settings.currency);

  // Border
  doc.setDrawColor(20, 120, 90);
  doc.setLineWidth(1.5);
  doc.rect(18, 18, pageW - 36, pageH - 36, "S");
  doc.setLineWidth(0.5);
  doc.rect(24, 24, pageW - 48, pageH - 48, "S");

  // Header band
  doc.setFillColor(20, 120, 90);
  doc.rect(24, 24, pageW - 48, 56, "F");

  // Logo
  if (settings.logoDataUrl) {
    try {
      doc.addImage(settings.logoDataUrl, "PNG", 34, 32, 40, 40);
    } catch {/* ignore */}
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(settings.name, settings.logoDataUrl ? 82 : 34, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(settings.tagline, settings.logoDataUrl ? 82 : 34, 66);

  doc.setFontSize(9);
  doc.text(settings.address, pageW - 34, 50, { align: "right" });
  doc.text(`${settings.phone}  |  ${settings.email}`, pageW - 34, 64, { align: "right" });

  // Title
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("DONATION RECEIPT", pageW / 2, 102, { align: "center" });

  // Meta box
  doc.setDrawColor(220);
  doc.setLineWidth(0.5);
  doc.line(40, 112, pageW - 40, 112);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Receipt No:", 40, 132);
  doc.text("Date:", 40, 150);
  doc.setFont("helvetica", "normal");
  doc.text(receiptNo, 110, 132);
  doc.text(new Date().toLocaleDateString(), 110, 150);

  doc.setFont("helvetica", "bold");
  doc.text("For Period:", pageW / 2, 132);
  doc.setFont("helvetica", "normal");
  doc.text(`${MONTHS[member.month - 1]} ${member.year}`, pageW / 2 + 70, 132);

  doc.setFont("helvetica", "bold");
  doc.text("Status:", pageW / 2, 150);
  doc.setFont("helvetica", "normal");
  doc.text(member.status.toUpperCase(), pageW / 2 + 70, 150);

  // Member details box
  doc.setDrawColor(220);
  doc.roundedRect(40, 170, pageW - 80, 70, 6, 6, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Received from:", 50, 188);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(member.name, 50, 208);
  doc.setFontSize(10);
  doc.text(member.phone || "-", 50, 224);

  // Amount
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Amount", pageW - 160, 188);
  doc.setFontSize(amountText.length > 16 ? 16 : 20);
  doc.setTextColor(20, 120, 90);
  doc.text(amountText, pageW - 50, 220, { align: "right" });
  doc.setTextColor(30, 30, 30);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Amount in words:", 50, 254);
  doc.setFont("helvetica", "normal");
  const amountWordLines = doc.splitTextToSize(amountWords, pageW - 230);
  doc.text(amountWordLines.slice(0, 2), 136, 254);

  // QR
  try {
    const qrData = JSON.stringify({ r: receiptNo, n: member.name, a: member.amount, p: `${member.month}/${member.year}` });
    const qrUrl = await QRCode.toDataURL(qrData, { width: 200, margin: 0 });
    doc.addImage(qrUrl, "PNG", 50, 256, 70, 70);
  } catch {/* ignore */}

  // Signature
  doc.setDrawColor(120);
  doc.setLineWidth(0.5);
  doc.line(pageW - 200, 310, pageW - 50, 310);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(settings.signatureLabel, pageW - 125, 324, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("Thank you for your generous contribution. May Allah accept it.", pageW / 2, pageH - 40, { align: "center" });

  doc.save(`Receipt-${receiptNo}-${member.name.replace(/\s+/g, "_")}.pdf`);
  return receiptNo;
}
