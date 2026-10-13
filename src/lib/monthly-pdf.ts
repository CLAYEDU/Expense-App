import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CategoryBreakdownItem {
  category: string;
  budget: number;
  amount: number;
  previousMonthAmount?: number; // MoM support
  budgetUsedPercentage: number;
}

interface MonthlyReportPDFData {
  userName?: string;
  currency: string;
  monthLabel: string;
  monthKey: string;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  savingsRate: number;
  budgetTotal: number;
  budgetUsed: number;
  recurringCommitment: number;
  categoryBreakdown: CategoryBreakdownItem[];
  previousMonthTotalExpenses?: number; // Total MoM comparison
}

export function generateMonthlyExecutivePDF(data: MonthlyReportPDFData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;

  const fmt = (num: number) =>
    `${data.currency} ${Math.round(num).toLocaleString("en-IN")}`;

  // ================= 1. HEADER BANNER =================
  doc.setFillColor(23, 61, 50); // Finora Emerald #173D32
  doc.rect(0, 0, pageWidth, 32, "F");

  doc.setFillColor(16, 185, 129); // Mint accent
  doc.rect(0, 31, pageWidth, 1.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("FINORA GLOBAL CAPITAL", margin, 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(209, 250, 229);
  doc.text(`EXECUTIVE MONTHLY STATEMENT • ${data.monthLabel.toUpperCase()}`, margin, 20);

  doc.setFontSize(8);
  doc.setTextColor(167, 243, 208);
  const genDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  doc.text(`Generated: ${genDate} | Scope: Verified Workspace Inflow & Outflow`, margin, 26);

  // ================= 2. KPI PERFORMANCE GRID =================
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("1. FISCAL FLOW PERFORMANCE SUMMARY", margin, 42);

  // Calculate MoM overall delta
  let momOverallText = "Baseline Month";
  if (data.previousMonthTotalExpenses && data.previousMonthTotalExpenses > 0) {
    const diff = data.totalExpenses - data.previousMonthTotalExpenses;
    const pct = ((diff / data.previousMonthTotalExpenses) * 100).toFixed(1);
    momOverallText = diff > 0 ? `+${pct}% vs Last Month` : `-${pct}% vs Last Month`;
  }

  const kpiData = [
    [
      "Total Monthly Inflow",
      fmt(data.totalIncome),
      "Total Recorded Outflow",
      fmt(data.totalExpenses),
    ],
    [
      "Preserved Net Buffer",
      fmt(data.totalSavings),
      "Net Savings Rate",
      `${data.savingsRate.toFixed(1)}%`,
    ],
    [
      "Allocated Budget Cap",
      fmt(data.budgetTotal),
      "MoM Outflow Trend",
      momOverallText,
    ],
    [
      "Recurring Commitments",
      fmt(data.recurringCommitment),
      "Fiscal Health Index",
      data.totalSavings >= 0 ? "SURPLUS CAPITAL" : "DEFICIT CAPITAL",
    ],
  ];

  autoTable(doc, {
    startY: 46,
    body: kpiData,
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 2.8 },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [248, 250, 252], textColor: [71, 85, 105], cellWidth: 48 },
      1: { fontStyle: "bold", textColor: [15, 23, 42], cellWidth: 43 },
      2: { fontStyle: "bold", fillColor: [248, 250, 252], textColor: [71, 85, 105], cellWidth: 48 },
      3: { fontStyle: "bold", textColor: [15, 23, 42], cellWidth: 43 },
    },
  });

  // ================= 3. VECTOR PIE CHART =================
  let currentY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("2. EXPENSE DISTRIBUTION & ALLOCATION BREAKDOWN", margin, currentY);

  const totalExpenseVal = data.categoryBreakdown.reduce((acc, c) => acc + c.amount, 0);

  const colors: [number, number, number][] = [
    [23, 61, 50],
    [16, 185, 129],
    [14, 165, 233],
    [245, 158, 11],
    [168, 85, 247],
    [236, 72, 153],
    [100, 116, 139],
  ];

  if (totalExpenseVal > 0) {
    const chartCenterX = 45;
    const chartCenterY = currentY + 30;
    const radius = 20;
    let currentAngle = -Math.PI / 2;

    data.categoryBreakdown.forEach((item, index) => {
      const share = item.amount / totalExpenseVal;
      if (share <= 0) return;

      const sliceAngle = share * (2 * Math.PI);
      const color = colors[index % colors.length];

      doc.setFillColor(color[0], color[1], color[2]);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);

      const steps = Math.max(10, Math.floor(sliceAngle * 25));
      const points: [number, number][] = [[chartCenterX, chartCenterY]];

      for (let i = 0; i <= steps; i++) {
        const a = currentAngle + (sliceAngle * i) / steps;
        points.push([
          chartCenterX + radius * Math.cos(a),
          chartCenterY + radius * Math.sin(a),
        ]);
      }

      doc.lines(
        points.slice(1).map((pt, i) => [
          pt[0] - points[i][0],
          pt[1] - points[i][1],
        ]),
        points[0][0],
        points[0][1],
        [1, 1],
        "FD",
        true
      );

      currentAngle += sliceAngle;
    });

    let legendY = currentY + 14;
    const legendX = 85;

    data.categoryBreakdown.slice(0, 6).forEach((item, index) => {
      const share = ((item.amount / totalExpenseVal) * 100).toFixed(1);
      const color = colors[index % colors.length];

      doc.setFillColor(color[0], color[1], color[2]);
      doc.rect(legendX, legendY - 3, 4, 4, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(item.category, legendX + 7, legendY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`${fmt(item.amount)} (${share}%)`, legendX + 50, legendY);

      legendY += 6.5;
    });

    currentY += 58;
  } else {
    currentY += 8;
  }

  // ================= 4. CATEGORY VARIANCE TABLE WITH MoM DELTA =================
  autoTable(doc, {
    startY: currentY,
    head: [["Expenditure Stream", "Allocated Target", "Actual Spending", "MoM Trend", "Variance Status"]],
    body: data.categoryBreakdown.map((item) => {
      const variance = item.budget > 0 ? item.budget - item.amount : 0;
      const status =
        item.budget === 0
          ? "Uncapped"
          : variance >= 0
          ? `+${fmt(variance)} (Under)`
          : `-${fmt(Math.abs(variance))} (Over)`;

      // MoM calculation per category
      let momDelta = "—";
      if (typeof item.previousMonthAmount === "number" && item.previousMonthAmount > 0) {
        const change = item.amount - item.previousMonthAmount;
        const pct = ((change / item.previousMonthAmount) * 100).toFixed(1);
        momDelta = change > 0 ? `+${pct}%` : `${pct}%`;
      } else if (item.previousMonthAmount === 0 && item.amount > 0) {
        momDelta = "New (+100%)";
      }

      return [
        item.category,
        item.budget > 0 ? fmt(item.budget) : "Not set",
        fmt(item.amount),
        momDelta,
        status,
      ];
    }),
    theme: "striped",
    headStyles: {
      fillColor: [23, 61, 50],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    styles: { fontSize: 8, cellPadding: 2.2 },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [30, 41, 59], cellWidth: 45 },
      1: { cellWidth: 32 },
      2: { cellWidth: 32 },
      3: { fontStyle: "bold", cellWidth: 28 }, // MoM column
      4: { fontStyle: "bold", cellWidth: 45 },
    },
  });

  // ================= 5. EXECUTIVE ADVISORY NOTE =================
  let finalY = (doc as any).lastAutoTable.finalY + 8;
  if (finalY > pageHeight - 45) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, finalY, pageWidth - margin * 2, 34, 3, 3, "FD");

  doc.setTextColor(23, 61, 50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("EXECUTIVE ADVISORY & AUDIT SUMMARY", margin + 4, finalY + 6);

  let commentary = "";
  if (data.totalSavings < 0) {
    commentary = `CRITICAL DEFICIT DETECTED: Total expenditure exceeded monthly income by ${fmt(
      Math.abs(data.totalSavings)
    )}. Immediate capital rationalization is advised across flexible spending categories. Ensure recurring liabilities are capped below 40% of verified monthly inflow.`;
  } else if (data.savingsRate >= 30) {
    commentary = `HIGH CAPITAL EFFICIENCY: Strong fiscal discipline observed for ${data.monthLabel}. With a savings rate of ${data.savingsRate.toFixed(
      1
    )}%, surplus capital should be directed towards bolstering the 3-month liquid emergency reserve or structured investment allocations.`;
  } else {
    commentary = `BALANCED FLOW PROFILE: Operations remained within income thresholds with a net buffer of ${fmt(
      data.totalSavings
    )} (${data.savingsRate.toFixed(
      1
    )}% savings rate). Monitor discretionary category variances to prevent month-end creep.`;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);
  const splitCommentary = doc.splitTextToSize(commentary, pageWidth - margin * 2 - 8);
  doc.text(splitCommentary, margin + 4, finalY + 13);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Verified and compiled via Finora Analytics Engine. Institutional Ledger Confidential.",
    margin + 4,
    finalY + 30
  );

  doc.save(`Finora_Executive_Report_${data.monthKey}.pdf`);
}