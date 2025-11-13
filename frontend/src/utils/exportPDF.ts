import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const exportWeeklyReportToPDF = async (
  userName: string,
  startDate: string,
  endDate: string,
  stats: any
) => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.text("Weekly Productivity Report", 20, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.text(`${userName}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Period: ${startDate} - ${endDate}`, 20, yPosition);
  yPosition += 15;

  // Summary stats
  doc.setFontSize(14);
  doc.text("Summary", 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.text(`Tasks Completed: ${stats.tasksCompleted}`, 25, yPosition);
  yPosition += 7;
  doc.text(`Pomodoros Completed: ${stats.pomodoros}`, 25, yPosition);
  yPosition += 7;
  doc.text(
    `Focus Time: ${Math.floor(stats.focusMinutes / 60)}h ${stats.focusMinutes % 60}m`,
    25,
    yPosition
  );
  yPosition += 7;
  doc.text(`Productivity Score: ${stats.productivityScore}/100`, 25, yPosition);
  yPosition += 15;

  // Capture productivity trend chart
  doc.setFontSize(14);
  doc.text("Productivity Trend", 20, yPosition);
  yPosition += 10;

  const productivityChart = document.getElementById("productivity-chart");
  if (productivityChart) {
    const canvas = await html2canvas(productivityChart, {
      scale: 1.5, // Reduced from 2 for faster rendering
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    doc.addImage(imgData, "PNG", 20, yPosition, 170, 80);
  }

  // Add new page for more charts
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(14);
  doc.text("Focus Time Distribution", 20, yPosition);
  yPosition += 10;

  const focusChart = document.getElementById("focus-time-chart");
  if (focusChart) {
    const canvas = await html2canvas(focusChart, {
      scale: 1.5,
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    doc.addImage(imgData, "PNG", 20, yPosition, 170, 80);
  }

  yPosition += 90;

  doc.setFontSize(14);
  doc.text("Task Distribution", 20, yPosition);
  yPosition += 10;

  const taskChart = document.getElementById("task-distribution-chart");
  if (taskChart) {
    const canvas = await html2canvas(taskChart, {
      scale: 1.5,
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    doc.addImage(imgData, "PNG", 20, yPosition, 170, 80);
  }

  // Footer
  doc.setFontSize(8);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 285);

  doc.save(`weekly-report-${startDate}.pdf`);
};
