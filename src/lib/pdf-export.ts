import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExpenseCategoryItem {
  name: string;
  amount: number;
  percentage: number;
  previousAmount?: number;
}

export interface CorporateReportData {
  userName?: string;
  userEmail?: string;
  accountReferenceId?: string;
  currency: string;
  monthlyIncome: number;
  totalExpenses: number;
  netBuffer: number;
  savingsRate: number;
  currentSavings: number;
  currentInvestments: number;
  currentEmergencyFund: number;
  emergencyTarget: number;
  emiAmount: number;
  categories: ExpenseCategoryItem[];
  previousMonthExpenses?: number;
  advisorImageUrl?: string; // Optional custom path (defaults to "/advisor.png")
}

function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve("");
      return;
    }
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalWidth || img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        resolve(url);
      }
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
}

function drawVectorDonutChart(
  doc: jsPDF,
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  slices: { label: string; value: number; color: [number, number, number] }[]
) {
  const total = slices.reduce((acc, s) => acc + s.value, 0);
  if (total <= 0) return;

  let currentAngle = -Math.PI / 2;

  slices.forEach((slice) => {
    if (slice.value <= 0) return;
    const sliceAngle = (slice.value / total) * (2 * Math.PI);
    const endAngle = currentAngle + sliceAngle;
    const step = 0.04;

    doc.setFillColor(slice.color[0], slice.color[1], slice.color[2]);

    for (let a = currentAngle; a < endAngle; a += step) {
      const nextA = Math.min(a + step, endAngle);
      const x1 = cx + outerRadius * Math.cos(a);
      const y1 = cy + outerRadius * Math.sin(a);
      const x2 = cx + outerRadius * Math.cos(nextA);
      const y2 = cy + outerRadius * Math.sin(nextA);
      const x3 = cx + innerRadius * Math.cos(nextA);
      const y3 = cy + innerRadius * Math.sin(nextA);
      const x4 = cx + innerRadius * Math.cos(a);
      const y4 = cy + innerRadius * Math.sin(a);

      doc.triangle(x1, y1, x2, y2, x3, y3, "F");
      doc.triangle(x1, y1, x3, y3, x4, y4, "F");
    }

    currentAngle = endAngle;
  });

  doc.setFillColor(255, 255, 255);
  doc.circle(cx, cy, innerRadius, "F");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("CAPITAL", cx, cy - 2, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("ALLOCATION", cx, cy + 3.5, { align: "center" });
}

export async function generateCorporateFinancialReport(data: CorporateReportData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;

  // Pre-load advisor image as base64
  const imageSrc = data.advisorImageUrl || "/advisor.png";
  const base64Image = await loadImageAsBase64(imageSrc);

  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const refCode =
    data.accountReferenceId ||
    `FIN-${Math.floor(100000 + Math.random() * 900000)}`;

  // ================= 1. EXECUTIVE HEADER BANNER =================
  doc.setFillColor(15, 36, 30);
  doc.rect(0, 0, pageWidth, 38, "F");

  doc.setFillColor(45, 140, 110);
  doc.rect(0, 37.2, pageWidth, 0.8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("FINORA", margin, 17);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(110, 231, 183);
  doc.text("WEALTH ADVISORY & AUDIT STATEMENT", margin, 23);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text("PRIVATE & CONFIDENTIAL // FOR ACCOUNT HOLDER ONLY", margin, 29);

  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`STATEMENT REF: ${refCode}`, pageWidth - margin, 15, { align: "right" });
  doc.text(`ISSUED: ${dateStr.toUpperCase()}`, pageWidth - margin, 20, { align: "right" });
  doc.text(`BASE CURRENCY: ${data.currency}`, pageWidth - margin, 25, { align: "right" });

  if (data.userEmail) {
    doc.setTextColor(148, 163, 184);
    doc.text(`ACCOUNT: ${data.userEmail}`, pageWidth - margin, 30, { align: "right" });
  }

  // ================= 2. EXECUTIVE SUMMARY & AUDIT CARDS =================
  let currentY = 46;

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("1. EXECUTIVE SUMMARY & PERFORMANCE INDICATORS", margin, currentY);

  currentY += 4;
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 19;

  let outflowSub = `${data.categories.length} Tracked Streams`;
  if (
    typeof data.previousMonthExpenses === "number" &&
    data.previousMonthExpenses > 0
  ) {
    const diff = data.totalExpenses - data.previousMonthExpenses;
    const pct = ((diff / data.previousMonthExpenses) * 100).toFixed(1);
    outflowSub = diff >= 0 ? `+${pct}% vs Last Mo.` : `-${pct}% vs Last Mo.`;
  }

  const kpis = [
    {
      title: "MONTHLY INFLOW",
      val: `${data.currency} ${Math.round(data.monthlyIncome).toLocaleString()}`,
      sub: "Verified Baseline",
      bg: [248, 250, 252],
    },
    {
      title: "RECORDED OUTFLOW",
      val: `${data.currency} ${Math.round(data.totalExpenses).toLocaleString()}`,
      sub: outflowSub,
      bg: [248, 250, 252],
    },
    {
      title: "NET MONTHLY BUFFER",
      val: `${data.currency} ${Math.round(data.netBuffer).toLocaleString()}`,
      sub: data.netBuffer >= 0 ? "Surplus Position" : "Deficit Warning",
      bg: data.netBuffer >= 0 ? [240, 253, 244] : [254, 242, 242],
    },
    {
      title: "SAVINGS EFFICIENCY",
      val: `${data.savingsRate.toFixed(1)}%`,
      sub: data.savingsRate >= 20 ? "Target Achieved" : "Under Baseline",
      bg: [240, 253, 250],
    },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 3);

    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, "FD");

    doc.setFontSize(5.8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, cardX + 3.5, currentY + 4.8);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, cardX + 3.5, currentY + 11.2);

    doc.setFontSize(5.8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, cardX + 3.5, currentY + 15.6);
  });

  currentY += cardHeight + 8;

  // ================= 3. ALLOCATION CHART & RESERVES =================
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("2. CAPITAL FLOW ALLOCATION & RESERVE ASSET STRUCTURE", margin, currentY);

  currentY += 4;
  const chartBoxWidth = 86;
  const boxHeight = 62;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, chartBoxWidth, boxHeight, 3, 3, "FD");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Cashflow Inflow Utilization", margin + 5, currentY + 6.5);

  const fixedCommitments = Math.max(data.emiAmount, 0);
  const livingSpends = Math.max(data.totalExpenses, 0);
  const liquidBuffer = Math.max(data.netBuffer, 0);

  const slices: { label: string; value: number; color: [number, number, number] }[] = [
    { label: "Fixed EMIs / Loans", value: fixedCommitments, color: [245, 158, 11] },
    { label: "Living Spends", value: livingSpends, color: [236, 72, 153] },
    { label: "Free Buffer / Surplus", value: liquidBuffer, color: [16, 185, 129] },
  ];

  const totalInflowBase = fixedCommitments + livingSpends + liquidBuffer;

  drawVectorDonutChart(doc, margin + 26, currentY + 34, 21, 13, slices);

  let legendY = currentY + 19;
  slices.forEach((s) => {
    const pct = totalInflowBase > 0 ? Math.round((s.value / totalInflowBase) * 100) : 0;

    doc.setFillColor(s.color[0], s.color[1], s.color[2]);
    doc.rect(margin + 50, legendY - 2.5, 3, 3, "F");

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(s.label, margin + 55, legendY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${data.currency} ${Math.round(s.value).toLocaleString()} (${pct}%)`,
      margin + 55,
      legendY + 3.8
    );

    legendY += 10;
  });

  const reservesTableX = margin + chartBoxWidth + 4;
  const reservesTableWidth = pageWidth - margin - reservesTableX;

  const totalLiquidNetWorth =
    data.currentSavings + data.currentInvestments + data.currentEmergencyFund;
  const runwayPct =
    data.emergencyTarget > 0
      ? Math.min(Math.round((data.currentEmergencyFund / data.emergencyTarget) * 100), 100)
      : 0;

  autoTable(doc, {
    startY: currentY,
    margin: { left: reservesTableX, right: margin },
    tableWidth: reservesTableWidth,
    head: [["Reserve Portfolio Segment", "Audited Balance"]],
    body: [
      ["Liquid Savings (Instant Cash)", `${data.currency} ${data.currentSavings.toLocaleString()}`],
      ["Investment Portfolio", `${data.currency} ${data.currentInvestments.toLocaleString()}`],
      [
        "Emergency Runway Fund",
        `${data.currency} ${data.currentEmergencyFund.toLocaleString()} (${runwayPct}% Target)`,
      ],
      ["Monthly EMI Liabilities", `${data.currency} ${data.emiAmount.toLocaleString()}/mo`],
      [
        "NET ACCUMULATED RESERVES",
        `${data.currency} ${totalLiquidNetWorth.toLocaleString()}`,
      ],
    ],
    theme: "plain",
    headStyles: {
      fillColor: [15, 36, 30],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
      cellPadding: 2.2,
    },
    bodyStyles: {
      fontSize: 6.8,
      cellPadding: 2.3,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    didParseCell: (hookData) => {
      if (hookData.row.index === 4) {
        hookData.cell.styles.fontStyle = "bold";
        hookData.cell.styles.fillColor = [240, 253, 244];
        hookData.cell.styles.textColor = [6, 95, 70];
      }
    },
  });

  currentY += boxHeight + 8;

  // ================= 4. ITEMISED EXPENSE DISCLOSURE =================
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("3. VERIFIED ITEMISED EXPENSE DISCLOSURE", margin, currentY);

  currentY += 3;

  const expenseRows =
    data.categories.length > 0
      ? data.categories.map((c) => {
          let momDelta = "-";
          if (typeof c.previousAmount === "number" && c.previousAmount > 0) {
            const diff = c.amount - c.previousAmount;
            const pct = Math.abs((diff / c.previousAmount) * 100).toFixed(1);
            momDelta = diff > 0 ? `+${pct}%` : diff < 0 ? `-${pct}%` : "0.0%";
          } else if (c.previousAmount === 0 && c.amount > 0) {
            momDelta = "New Stream";
          }

          const auditAssessment =
            c.percentage > 35 ? "Elevated Concentration" : "Nominal";

          return [
            c.name,
            `${data.currency} ${Math.round(c.amount).toLocaleString()}`,
            `${c.percentage}%`,
            momDelta,
            auditAssessment,
          ];
        })
      : [["No verified expenses recorded for this billing cycle", "-", "-", "-", "-"]];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [
      [
        "Spending Category",
        "Recorded Outflow",
        "Share of Total",
        "MoM Trend",
        "Audit Assessment",
      ],
    ],
    body: expenseRows,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.2,
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 6.8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 48 },
      1: { cellWidth: 32 },
      2: { cellWidth: 26 },
      3: { fontStyle: "bold", cellWidth: 28 },
      4: { cellWidth: 48 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // ================= 5. MOTIVATIONAL MESSAGE & ADVISOR CARD =================
  let advisoryY = (doc as any).lastAutoTable.finalY + 6;
  const advisoryBoxHeight = 36;

  // Page break check if near bottom margin
  if (advisoryY + advisoryBoxHeight > pageHeight - 16) {
    doc.addPage();
    advisoryY = 20;
  }

  const boxWidth = pageWidth - margin * 2;

  // 1. Outer Container Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, advisoryY, boxWidth, advisoryBoxHeight, 3, 3, "FD");

  // 2. Left Emerald Accent Border
  doc.setFillColor(16, 185, 129);
  doc.rect(margin, advisoryY, 2.5, advisoryBoxHeight, "F");

  // 3. Define Right-Side Image Bounds First
  const imgWidth = 26;
  const imgHeight = 26;
  const imgX = pageWidth - margin - imgWidth - 5;
  const imgY = advisoryY + (advisoryBoxHeight - imgHeight) / 2;

  // 4. Define Left Text Boundary (Guarantees zero overlap with image)
  const textLeftX = margin + 7;
  // Available width leaves a 6mm buffer before the image start
  const maxTextWidth = imgX - textLeftX - 6;

  // 5. Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 36, 30);
  doc.text("A NOTE FROM YOUR WEALTH ADVISOR", textLeftX, advisoryY + 6.5);

  // 6. Motivational Body Copy (Wrapped to maxTextWidth)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);

  const motivationalQuote =
    '"True wealth is not merely what you earn, but what you preserve. Every unit of currency saved today is a seed for tomorrow\'s independence, providing security against market shocks and freedom of choice. Stay disciplined with your runway, honor your commitments, and let consistency compound your future."';

  const splitQuote = doc.splitTextToSize(motivationalQuote, maxTextWidth);
  doc.text(splitQuote, textLeftX, advisoryY + 11.5);

  // 7. Footer Tagline
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(16, 185, 129);
  doc.text("• Plan with clarity. Build with confidence.", textLeftX, advisoryY + 31.5);

  // 8. Render Advisor Image on the Right
  if (base64Image) {
    // Pure white backdrop tile behind image
    doc.setFillColor(255, 255, 255);
    doc.rect(imgX - 1, imgY - 1, imgWidth + 2, imgHeight + 2, "F");

    try {
      doc.addImage(base64Image, "PNG", imgX, imgY, imgWidth, imgHeight, undefined, "FAST");
    } catch (err) {
      console.error("Failed to render advisor image into PDF:", err);
    }
  }

  // ================= 6. INSTITUTIONAL FOOTER & COMPLIANCE =================
  const footerY = pageHeight - 14;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(
    "CONFIDENTIALITY NOTICE: This document contains proprietary analysis generated by Finora. Figures are compiled from client inputs and verified records.",
    margin,
    footerY
  );
  doc.text(
    "Finora Financial Technologies Inc. // Automated Advisory Engine v3.4 // Institutional Standard",
    margin,
    footerY + 3.5
  );

  doc.text("Page 1 of 1", pageWidth - margin, footerY, { align: "right" });

  const fileDate = new Date().toISOString().split("T")[0];
  doc.save(`Finora_Executive_Statement_${fileDate}.pdf`);
}