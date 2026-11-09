import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface BudgetItem {
  category: string;
  budgetAmount: number;
  sharePercentage: number;
}

export interface BudgetPDFData {
  userName?: string;
  userEmail?: string;
  currency: string;
  monthlyIncome: number;
  totalBudgetCapped: number;
  unallocatedBuffer: number;
  savingsTarget: number;
  emiAmount: number;
  budgets: BudgetItem[];
  advisorImageUrl?: string;
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
      canvas.height = img.naturalHeight || img.height;
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
  doc.text("PLANNED", cx, cy - 2, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("CAPS", cx, cy + 3.5, { align: "center" });
}

export async function generateBudgetPlanPDF(data: BudgetPDFData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;

  const imageSrc = data.advisorImageUrl || "/advisor.png";
  const base64Image = await loadImageAsBase64(imageSrc);

  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const refCode = `BGT-${Math.floor(100000 + Math.random() * 900000)}`;

  const fmt = (num: number) =>
    `${data.currency} ${Math.round(num).toLocaleString("en-IN")}`;

  // 1. Header Banner
  doc.setFillColor(15, 36, 30);
  doc.rect(0, 0, pageWidth, 36, "F");

  doc.setFillColor(45, 140, 110);
  doc.rect(0, 35.2, pageWidth, 0.8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("FINORA", margin, 16);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(110, 231, 183);
  doc.text("MONTHLY BUDGET ALLOCATION PLAN", margin, 22);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text("FORWARD-LOOKING EXPENDITURE CONTROLS", margin, 28);

  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`PLAN REF: ${refCode}`, pageWidth - margin, 15, { align: "right" });
  doc.text(`DATE SET: ${dateStr.toUpperCase()}`, pageWidth - margin, 20, { align: "right" });
  doc.text(`CURRENCY: ${data.currency}`, pageWidth - margin, 25, { align: "right" });

  // 2. Performance & Target KPI Cards
  let currentY = 44;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("1. TARGET ALLOCATION METRICS", margin, currentY);

  currentY += 4;
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 18;

  const kpis = [
    { title: "MONTHLY INFLOW", val: fmt(data.monthlyIncome), sub: "Base Income" },
    { title: "TOTAL BUDGET CAP", val: fmt(data.totalBudgetCapped), sub: "Total Limit" },
    { title: "TARGET SAVINGS", val: fmt(data.savingsTarget), sub: "Mandatory Target" },
    {
      title: "UNALLOCATED BUFFER",
      val: fmt(data.unallocatedBuffer),
      sub: data.unallocatedBuffer >= 0 ? "Safe Discretionary" : "Overallocated",
    },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, "FD");

    doc.setFontSize(5.8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, cardX + 3.5, currentY + 4.8);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, cardX + 3.5, currentY + 10.8);

    doc.setFontSize(5.8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, cardX + 3.5, currentY + 15);
  });

  currentY += cardHeight + 8;

  // 3. Vector Donut Allocation Chart
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("2. BUDGETED CATEGORY DISTRIBUTION", margin, currentY);

  currentY += 4;
  const chartBoxWidth = 86;
  const boxHeight = 58;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, chartBoxWidth, boxHeight, 3, 3, "FD");

  const colors: [number, number, number][] = [
    [23, 61, 50],
    [16, 185, 129],
    [14, 165, 233],
    [245, 158, 11],
    [168, 85, 247],
    [236, 72, 153],
  ];

  const slices = data.budgets.slice(0, 5).map((b, i) => ({
    label: b.category,
    value: b.budgetAmount,
    color: colors[i % colors.length],
  }));

  drawVectorDonutChart(doc, margin + 26, currentY + 29, 19, 12, slices);

  // Chart Legend
  let legendY = currentY + 14;
  data.budgets.slice(0, 5).forEach((item, idx) => {
    const color = colors[idx % colors.length];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(margin + 48, legendY - 2.5, 3, 3, "F");

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(item.category, margin + 53, legendY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`${fmt(item.budgetAmount)} (${item.sharePercentage.toFixed(1)}%)`, margin + 53, legendY + 3.5);

    legendY += 8.5;
  });

  // Summary Table on the right of the chart
  const summaryTableX = margin + chartBoxWidth + 4;
  const summaryTableWidth = pageWidth - margin - summaryTableX;

  autoTable(doc, {
    startY: currentY,
    margin: { left: summaryTableX, right: margin },
    tableWidth: summaryTableWidth,
    head: [["Budget Policy Target", "Cap Value"]],
    body: [
      ["Committed Fixed EMIs", fmt(data.emiAmount)],
      ["Mandatory Savings Target", fmt(data.savingsTarget)],
      ["Flexible Category Caps", fmt(data.totalBudgetCapped)],
      ["Total Monthly Income", fmt(data.monthlyIncome)],
      ["Remaining Free Cashflow", fmt(data.unallocatedBuffer)],
    ],
    theme: "plain",
    headStyles: {
      fillColor: [15, 36, 30],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 6.8,
      cellPadding: 2.1,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
  });

  currentY += boxHeight + 8;

  // 4. Detailed Category Budget Table
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("3. PLANNED CATEGORY ALLOCATIONS", margin, currentY);

  currentY += 3;

  const budgetRows = data.budgets.map((b) => [
    b.category,
    fmt(b.budgetAmount),
    `${b.sharePercentage.toFixed(1)}%`,
    b.sharePercentage > 30 ? "Heavy Allocation" : "Optimal Limit",
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [["Category Account", "Allocated Limit", "Share of Budget", "Allocation Policy"]],
    body: budgetRows,
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
      0: { fontStyle: "bold", cellWidth: 55 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { cellWidth: 47 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // 5. Motivational Note & Advisor Image Card
  let advisoryY = (doc as any).lastAutoTable.finalY + 6;
  const advisoryBoxHeight = 35;

  if (advisoryY + advisoryBoxHeight > pageHeight - 16) {
    doc.addPage();
    advisoryY = 20;
  }

  const boxWidth = pageWidth - margin * 2;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, advisoryY, boxWidth, advisoryBoxHeight, 3, 3, "FD");

  doc.setFillColor(16, 185, 129);
  doc.rect(margin, advisoryY, 2.5, advisoryBoxHeight, "F");

  // Right-side image bounds
  const imgWidth = 25;
  const imgHeight = 25;
  const imgX = pageWidth - margin - imgWidth - 5;
  const imgY = advisoryY + (advisoryBoxHeight - imgHeight) / 2;

  // Text bounds preventing any overlap
  const textLeftX = margin + 7;
  const maxTextWidth = imgX - textLeftX - 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 36, 30);
  doc.text("BUDGET STRATEGY & ADVISOR NOTE", textLeftX, advisoryY + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);

  const budgetQuote =
    '"A budget is not a restriction on your freedom; it is a declaration of your priorities. By assigning every unit of currency a clear purpose before the month begins, you take full control of your trajectory. Stay disciplined with these limits, and you will never wonder where your money went."';

  const splitQuote = doc.splitTextToSize(budgetQuote, maxTextWidth);
  doc.text(splitQuote, textLeftX, advisoryY + 11.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(16, 185, 129);
  doc.text("• Control your limits. Master your future.", textLeftX, advisoryY + 31);

  if (base64Image) {
    doc.setFillColor(255, 255, 255);
    doc.rect(imgX - 1, imgY - 1, imgWidth + 2, imgHeight + 2, "F");
    try {
      doc.addImage(base64Image, "PNG", imgX, imgY, imgWidth, imgHeight, undefined, "FAST");
    } catch (err) {
      console.error("Image render error:", err);
    }
  }

  // 6. Institutional Footer
  const footerY = pageHeight - 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("FINORA BUDGET CONTROLS // PLANNED ALLOCATION DOSSIER // CONFIDENTIAL", margin, footerY);
  doc.text("Page 1 of 1", pageWidth - margin, footerY, { align: "right" });

  doc.save(`Finora_Budget_Plan_${dateStr.replace(/\s+/g, "_")}.pdf`);
}