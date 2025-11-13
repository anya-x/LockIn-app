import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const exportWeeklyReportToPDF = async (
  userName: string,
  startDate: string,
  endDate: string,
  stats: any
) => {
  const doc = new jsPDF();

  // Add text header
  doc.setFontSize(20);
  doc.text("Weekly Productivity Report", 20, 20);
  doc.setFontSize(12);
  doc.text(`${userName} | ${startDate} - ${endDate}`, 20, 30);

  // Try to capture productivity chart
  const chartElement = document.getElementById("productivity-chart");
  if (chartElement) {
    const canvas = await html2canvas(chartElement);
    const imgData = canvas.toDataURL("image/png");
    doc.addImage(imgData, "PNG", 20, 50, 170, 80);
  }

  // TODO: This is slow... takes 3-4 seconds
  // TODO: Need to add IDs to all charts
  // TODO: Charts need to be visible (not in tabs/collapsed)

  doc.save(`weekly-report-${startDate}.pdf`);
};
