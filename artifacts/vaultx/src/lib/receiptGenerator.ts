export interface ReceiptTx {
  txId?: string | null;
  id: number;
  type: string;
  amount: number;
  fee?: number;
  network?: string | null;
  address?: string | null;
  txHash?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
  note?: string | null;
  metadata?: any;
}

export interface ReceiptSettings {
  platformName: string;
  platformLogoUrl?: string;
  platformUrl?: string;
}

const INCOMING_TYPES = ["deposit", "earning", "referral", "reinvest", "admin_adjustment"];

const TYPE_LABELS: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  transfer: "Transfer",
  earning: "Investment Earnings",
  referral: "Referral Bonus",
  reinvest: "Reinvestment",
  investment: "Property Investment",
  admin_adjustment: "Adjustment",
};

function fmtAmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USDT";
}

function fmtDt(s: string): string {
  return new Date(s).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Shared receipt layout data ────────────────────────────────────────────────
function buildReceiptSections(tx: ReceiptTx, platformName: string) {
  const isIncoming = INCOMING_TYPES.includes(tx.type);
  const isCompleted = tx.status === "completed";
  const isFailed = tx.status === "failed";
  const statusLabel = isCompleted ? "COMPLETED" : isFailed ? "REJECTED" : "PENDING";

  const meta = tx.metadata && typeof tx.metadata === "object" ? tx.metadata : null;
  const propertyName = meta?.propertyName || meta?.planName || null;
  const propertyLocation = meta?.propertyLocation || meta?.location || null;
  const investmentDuration = meta?.durationDays || meta?.duration || null;
  const investmentEndDate = meta?.endDate || null;

  const isInvestmentRelated = tx.type === "investment" || tx.type === "earning";

  return {
    isIncoming,
    isCompleted,
    isFailed,
    statusLabel,
    propertyName,
    propertyLocation,
    investmentDuration,
    investmentEndDate,
    isInvestmentRelated,
    platformName,
  };
}

// ─── Canvas receipt PNG ────────────────────────────────────────────────────────
export async function generateReceiptImageUrl(tx: ReceiptTx, settings: ReceiptSettings): Promise<string> {
  const W = 480;
  const SCALE = 2;
  const PAD = 32;
  const ROW_H = 38;

  const platformName = settings.platformName || "EstateFund";
  const s = buildReceiptSections(tx, platformName);

  // Build detail rows
  const detailRows: [string, string, boolean?][] = [
    ["Transaction ID", tx.txId ?? `TX-${tx.id}`, true],
    ["Type", typeLabel(tx.type)],
    ["Status", s.statusLabel],
    ["Date", fmtDate(tx.createdAt)],
    ["Time", fmtDt(tx.createdAt)],
  ];

  if (tx.updatedAt && tx.updatedAt !== tx.createdAt && tx.status !== "pending") {
    detailRows.push(["Processed", fmtDt(tx.updatedAt)]);
  }
  if (tx.network) detailRows.push(["Network", tx.network]);
  if (tx.fee && tx.fee > 0) detailRows.push(["Fee", fmtAmt(tx.fee)]);
  if (tx.address) {
    const addr = tx.address.length > 28 ? tx.address.slice(0, 14) + "…" + tx.address.slice(-10) : tx.address;
    detailRows.push(["Address", addr]);
  }
  if (tx.txHash) detailRows.push(["TX Hash", tx.txHash.slice(0, 22) + "…"]);

  // Property section rows
  const propRows: [string, string][] = [];
  if (s.propertyName) propRows.push(["Property", s.propertyName]);
  if (s.propertyLocation) propRows.push(["Location", s.propertyLocation]);
  if (s.investmentDuration) propRows.push(["Duration", `${s.investmentDuration} days`]);
  if (s.investmentEndDate) propRows.push(["Maturity", fmtDate(s.investmentEndDate)]);

  // Amount section
  const amountSection: [string, string][] = [
    ["Amount", `${s.isIncoming ? "+" : "−"}${fmtAmt(tx.amount)}`],
  ];
  if (tx.fee && tx.fee > 0) {
    amountSection.push(["Fee", `−${fmtAmt(tx.fee)}`]);
    const net = tx.amount - tx.fee;
    amountSection.push(["Net Amount", `${s.isIncoming ? "+" : "−"}${fmtAmt(net)}`]);
  }

  // Calculate heights
  const HEADER_H = 140;
  const SECTION_GAP = 20;
  const SECTION_HEADER_H = 24;
  const DETAIL_H = detailRows.length * ROW_H + 12;
  const PROP_H = propRows.length > 0 ? propRows.length * ROW_H + 12 + SECTION_HEADER_H + SECTION_GAP : 0;
  const AMOUNT_H = amountSection.length * ROW_H + 12 + SECTION_HEADER_H + SECTION_GAP;
  const FOOTER_H = 52;
  const H = HEADER_H + DETAIL_H + PROP_H + AMOUNT_H + FOOTER_H + 16;

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  // ── White background ─────────────────────────────────────────────────────────
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // ── Subtle border ────────────────────────────────────────────────────────────
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  // ── Top emerald accent bar ──────────────────────────────────────────────────
  const barGrad = ctx.createLinearGradient(0, 0, W, 0);
  barGrad.addColorStop(0, "#059669");
  barGrad.addColorStop(0.5, "#10b981");
  barGrad.addColorStop(1, "#059669");
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, 0, W, 4);

  // ── Header ───────────────────────────────────────────────────────────────────
  // Brand wordmark
  ctx.fillStyle = "#065f46";
  ctx.font = `800 20px -apple-system, "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("ESTATEFUND", PAD, 32);

  // Subtitle
  ctx.fillStyle = "#6b7280";
  ctx.font = `500 9px -apple-system, "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText("Real Estate Investment Platform", PAD, 46);

  // "TRANSACTION RECEIPT" label
  ctx.fillStyle = "#9ca3af";
  ctx.font = `700 9px -apple-system, "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("TRANSACTION RECEIPT", W - PAD, 32);

  // ── Status badge ─────────────────────────────────────────────────────────────
  const badgeX = W / 2;
  const badgeY = 76;
  const badgeColor = s.isCompleted ? "#059669" : s.isFailed ? "#dc2626" : "#d97706";
  const badgeBg = s.isCompleted ? "#ecfdf5" : s.isFailed ? "#fef2f2" : "#fffbeb";
  const badgeText = s.isCompleted ? "#065f46" : s.isFailed ? "#991b1b" : "#92400e";

  const badgeW = ctx.measureText(s.statusLabel).width + 24;
  ctx.fillStyle = badgeBg;
  ctx.beginPath();
  ctx.roundRect(badgeX - badgeW / 2, badgeY - 10, badgeW, 20, 10);
  ctx.fill();
  ctx.strokeStyle = badgeColor + "40";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(badgeX - badgeW / 2, badgeY - 10, badgeW, 20, 10);
  ctx.stroke();

  ctx.fillStyle = badgeText;
  ctx.font = `700 9px -apple-system, "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(s.statusLabel, badgeX, badgeY);

  // ── Amount ───────────────────────────────────────────────────────────────────
  const amtColor = s.isIncoming ? "#059669" : "#dc2626";
  ctx.fillStyle = amtColor;
  ctx.font = `900 30px -apple-system, "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`${s.isIncoming ? "+" : "−"}${fmtAmt(tx.amount)}`, W / 2, 118);

  // Type label under amount
  ctx.fillStyle = "#6b7280";
  ctx.font = `600 10px -apple-system, "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText(typeLabel(tx.type).toUpperCase(), W / 2, 134);

  // ── Separator line ───────────────────────────────────────────────────────────
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, HEADER_H);
  ctx.lineTo(W - PAD, HEADER_H);
  ctx.stroke();

  // ── Detail rows ──────────────────────────────────────────────────────────────
  let y = HEADER_H + 12;
  detailRows.forEach(([label, value, highlight], i) => {
    if (i % 2 === 0) {
      ctx.fillStyle = "#f9fafb";
      ctx.fillRect(PAD, y - 2, W - PAD * 2, ROW_H);
    }

    ctx.fillStyle = "#6b7280";
    ctx.font = `400 10.5px -apple-system, "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, PAD + 8, y + ROW_H / 2 - 2);

    ctx.fillStyle = highlight ? "#059669" : label === "Status"
      ? (s.isCompleted ? "#059669" : s.isFailed ? "#dc2626" : "#d97706")
      : "#1f2937";
    ctx.font = `600 10.5px -apple-system, "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.fillText(String(value), W - PAD - 8, y + ROW_H / 2 - 2);

    y += ROW_H;
  });

  y += 8;

  // ── Property section ─────────────────────────────────────────────────────────
  if (propRows.length > 0) {
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();
    y += 8;

    ctx.fillStyle = "#065f46";
    ctx.font = `700 9px -apple-system, "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText("PROPERTY / INVESTMENT DETAILS", PAD + 4, y + 8);
    y += SECTION_HEADER_H;

    propRows.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        ctx.fillStyle = "#f0fdf4";
        ctx.fillRect(PAD, y - 2, W - PAD * 2, ROW_H);
      }

      ctx.fillStyle = "#6b7280";
      ctx.font = `400 10.5px -apple-system, "Helvetica Neue", Arial, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, PAD + 8, y + ROW_H / 2 - 2);

      ctx.fillStyle = "#1f2937";
      ctx.font = `600 10.5px -apple-system, "Helvetica Neue", Arial, sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText(String(value), W - PAD - 8, y + ROW_H / 2 - 2);

      y += ROW_H;
    });

    y += 8;
  }

  // ── Amount summary section ───────────────────────────────────────────────────
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  y += 8;

  ctx.fillStyle = "#065f46";
  ctx.font = `700 9px -apple-system, "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("AMOUNT SUMMARY", PAD + 4, y + 8);
  y += SECTION_HEADER_H;

  amountSection.forEach(([label, value], i) => {
    const isLast = i === amountSection.length - 1;

    if (i % 2 === 0) {
      ctx.fillStyle = "#f9fafb";
      ctx.fillRect(PAD, y - 2, W - PAD * 2, ROW_H);
    }

    ctx.fillStyle = isLast ? "#065f46" : "#6b7280";
    ctx.font = `${isLast ? "700" : "400"} 10.5px -apple-system, "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, PAD + 8, y + ROW_H / 2 - 2);

    ctx.fillStyle = isLast ? "#059669" : "#1f2937";
    ctx.font = `700 10.5px -apple-system, "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.fillText(String(value), W - PAD - 8, y + ROW_H / 2 - 2);

    y += ROW_H;
  });

  y += 16;

  // ── Dashed separator ─────────────────────────────────────────────────────────
  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 0.8;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Footer ───────────────────────────────────────────────────────────────────
  y += 14;

  ctx.fillStyle = "#6b7280";
  ctx.font = `600 9px -apple-system, "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ESTATEFUND", W / 2, y);
  y += 14;

  ctx.fillStyle = "#9ca3af";
  ctx.font = `400 8px -apple-system, "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText("Official Transaction Receipt", W / 2, y);
  y += 14;

  ctx.fillStyle = "#b0b8c4";
  ctx.font = `400 7.5px -apple-system, "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText(`Generated ${fmtDt(new Date().toISOString())}`, W / 2, y);

  return canvas.toDataURL("image/png");
}

// ─── Download PNG to device ───────────────────────────────────────────────────
export async function downloadReceiptImage(tx: ReceiptTx, settings: ReceiptSettings): Promise<void> {
  const dataUrl = await generateReceiptImageUrl(tx, settings);
  const fileName = `EstateFund-Receipt-${tx.txId ?? tx.id}.png`;

  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  } catch {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

// ─── Native share with image file, fallback to text ──────────────────────────
export async function shareReceiptImage(tx: ReceiptTx, settings: ReceiptSettings): Promise<boolean> {
  const platformName = settings.platformName || "EstateFund";

  const textLines = [
    `${platformName} Transaction Receipt`,
    `Transaction ID: ${tx.txId ?? `TX-${tx.id}`}`,
    `Type: ${typeLabel(tx.type)}`,
    `Amount: ${INCOMING_TYPES.includes(tx.type) ? "+" : "-"}${fmtAmt(tx.amount)}`,
    `Status: ${tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}`,
    `Date: ${fmtDt(tx.createdAt)}`,
    tx.network ? `Network: ${tx.network}` : "",
  ].filter(Boolean).join("\n");

  try {
    const dataUrl = await generateReceiptImageUrl(tx, settings);
    const fetchRes = await fetch(dataUrl);
    const blob = await fetchRes.blob();
    const file = new File([blob], `EstateFund-Receipt-${tx.txId ?? tx.id}.png`, { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: `${platformName} Receipt` });
      return true;
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return true;
  }

  if (navigator.share) {
    try {
      await navigator.share({ title: `${platformName} Receipt`, text: textLines });
      return true;
    } catch (e) {
      if ((e as Error).name === "AbortError") return true;
    }
  }

  return false;
}

// ─── PDF export ───────────────────────────────────────────────────────────────
export async function downloadReceiptPDF(tx: ReceiptTx, settings: ReceiptSettings): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const platformName = settings.platformName || "EstateFund";
  const s = buildReceiptSections(tx, platformName);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
  const W = 148;
  const PAD = 10;

  // ── White background ─────────────────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, 210, "F");

  // ── Top emerald accent bar ──────────────────────────────────────────────────
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, W, 1.5, "F");

  // ── Brand header ─────────────────────────────────────────────────────────────
  doc.setTextColor(6, 95, 70);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ESTATEFUND", PAD, 14);

  doc.setTextColor(107, 114, 128);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("Real Estate Investment Platform", PAD, 19);

  doc.setTextColor(156, 163, 175);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text("TRANSACTION RECEIPT", W - PAD, 14, { align: "right" });

  // ── Status badge ─────────────────────────────────────────────────────────────
  const badgeColor: [number, number, number] = s.isCompleted ? [5, 150, 105] : s.isFailed ? [220, 38, 38] : [217, 119, 6];
  const badgeBg: [number, number, number] = s.isCompleted ? [236, 253, 245] : s.isFailed ? [254, 242, 242] : [255, 251, 235];
  const badgeTextColor: [number, number, number] = s.isCompleted ? [6, 95, 70] : s.isFailed ? [153, 27, 27] : [146, 64, 14];

  const badgeTextW = Number(doc.getTextWidth(s.statusLabel)) + 8;
  doc.setFillColor(...badgeBg);
  doc.rect(W / 2 - badgeTextW / 2, 26, badgeTextW, 7, "F");
  doc.setTextColor(...badgeTextColor);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text(s.statusLabel, W / 2, 30.5, { align: "center" });

  // ── Amount ───────────────────────────────────────────────────────────────────
  const amtColor: [number, number, number] = s.isIncoming ? [5, 150, 105] : [220, 38, 38];
  doc.setTextColor(...amtColor);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(`${s.isIncoming ? "+" : "−"}${fmtAmt(tx.amount)}`, W / 2, 48, { align: "center" });

  doc.setTextColor(107, 114, 128);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(typeLabel(tx.type).toUpperCase(), W / 2, 55, { align: "center" });

  // ── Separator ────────────────────────────────────────────────────────────────
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(PAD, 60, W - PAD, 60);

  // ── Transaction Details ──────────────────────────────────────────────────────
  doc.setTextColor(6, 95, 70);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text("TRANSACTION DETAILS", PAD + 2, 66);

  const detailRows: [string, string][] = [
    ["Transaction ID", tx.txId ?? `TX-${tx.id}`],
    ["Type", typeLabel(tx.type)],
    ["Status", s.statusLabel],
    ["Date", fmtDate(tx.createdAt)],
    ["Time", fmtDt(tx.createdAt)],
  ];
  if (tx.updatedAt && tx.updatedAt !== tx.createdAt && tx.status !== "pending") {
    detailRows.push(["Processed", fmtDt(tx.updatedAt)]);
  }
  if (tx.network) detailRows.push(["Network", tx.network]);
  if (tx.fee && tx.fee > 0) detailRows.push(["Fee", fmtAmt(tx.fee)]);
  if (tx.address) {
    const addr = tx.address.length > 30 ? tx.address.slice(0, 14) + "…" + tx.address.slice(-10) : tx.address;
    detailRows.push(["Address", addr]);
  }
  if (tx.txHash) detailRows.push(["TX Hash", tx.txHash.slice(0, 24) + "…"]);

  let y = 72;
  for (const [label, value] of detailRows) {
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(label, PAD + 2, y);

    const isHighlight = label === "Transaction ID";
    doc.setTextColor(isHighlight ? [5, 150, 105] : label === "Status"
      ? (s.isCompleted ? [5, 150, 105] : s.isFailed ? [220, 38, 38] : [217, 119, 6])
      : [31, 41, 55] as any);
    if (isHighlight) doc.setTextColor(5, 150, 105);
    else if (label === "Status") {
      if (s.isCompleted) doc.setTextColor(5, 150, 105);
      else if (s.isFailed) doc.setTextColor(220, 38, 38);
      else doc.setTextColor(217, 119, 6);
    } else doc.setTextColor(31, 41, 55);

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(String(value), W - PAD - 2, y, { align: "right" });

    doc.setDrawColor(243, 244, 246);
    doc.setLineWidth(0.15);
    doc.line(PAD, y + 2.5, W - PAD, y + 2.5);
    y += 7;
  }

  y += 4;

  // ── Property section ─────────────────────────────────────────────────────────
  const propRows: [string, string][] = [];
  if (s.propertyName) propRows.push(["Property", s.propertyName]);
  if (s.propertyLocation) propRows.push(["Location", s.propertyLocation]);
  if (s.investmentDuration) propRows.push(["Duration", `${s.investmentDuration} days`]);
  if (s.investmentEndDate) propRows.push(["Maturity", fmtDate(s.investmentEndDate)]);

  if (propRows.length > 0) {
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(PAD, y, W - PAD, y);
    y += 5;

    doc.setTextColor(6, 95, 70);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text("PROPERTY / INVESTMENT DETAILS", PAD + 2, y);
    y += 6;

    for (const [label, value] of propRows) {
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(label, PAD + 2, y);

      doc.setTextColor(31, 41, 55);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(String(value), W - PAD - 2, y, { align: "right" });

      doc.setDrawColor(243, 244, 246);
      doc.setLineWidth(0.15);
      doc.line(PAD, y + 2.5, W - PAD, y + 2.5);
      y += 7;
    }
    y += 4;
  }

  // ── Amount Summary ───────────────────────────────────────────────────────────
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(PAD, y, W - PAD, y);
  y += 5;

  doc.setTextColor(6, 95, 70);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text("AMOUNT SUMMARY", PAD + 2, y);
  y += 6;

  const amountRows: [string, string][] = [
    ["Amount", `${s.isIncoming ? "+" : "−"}${fmtAmt(tx.amount)}`],
  ];
  if (tx.fee && tx.fee > 0) {
    amountRows.push(["Fee", `−${fmtAmt(tx.fee)}`]);
    amountRows.push(["Net Amount", `${s.isIncoming ? "+" : "−"}${fmtAmt(tx.amount - tx.fee)}`]);
  }

  for (let i = 0; i < amountRows.length; i++) {
    const [label, value] = amountRows[i];
    const isLast = i === amountRows.length - 1;

    doc.setTextColor(isLast ? 6 : 107, isLast ? 95 : 114, isLast ? 70 : 128);
    doc.setFontSize(isLast ? 7.5 : 7);
    doc.setFont(isLast ? "helvetica" : "helvetica", isLast ? "bold" : "normal");
    doc.text(label, PAD + 2, y);

    doc.setTextColor(isLast ? 5 : 31, isLast ? 150 : 41, isLast ? 105 : 55);
    doc.setFontSize(isLast ? 7.5 : 7);
    doc.setFont("helvetica", "bold");
    doc.text(String(value), W - PAD - 2, y, { align: "right" });

    doc.setDrawColor(243, 244, 246);
    doc.setLineWidth(0.15);
    doc.line(PAD, y + 2.5, W - PAD, y + 2.5);
    y += 7;
  }

  y += 8;

  // ── Dashed separator ─────────────────────────────────────────────────────────
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 1.5], 0);
  doc.line(PAD, y, W - PAD, y);
  doc.setLineDashPattern([], 0);

  // ── Footer ───────────────────────────────────────────────────────────────────
  y += 6;
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("ESTATEFUND", W / 2, y, { align: "center" });
  y += 5;

  doc.setTextColor(156, 163, 175);
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");
  doc.text("Official Transaction Receipt", W / 2, y, { align: "center" });
  y += 5;

  doc.setTextColor(176, 184, 196);
  doc.setFontSize(5);
  doc.text(`Generated ${fmtDt(new Date().toISOString())}`, W / 2, y, { align: "center" });

  doc.save(`EstateFund-Receipt-${tx.txId ?? tx.id}.pdf`);
}
