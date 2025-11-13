import jsPDF from "jspdf";

export const exportWeeklyReportToPDF = (
  userName: string,
  startDate: string,
  endDate: string,
  stats: any
) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text("Weekly Productivity Report", 20, 20);

  doc.setFontSize(12);
  doc.text(`${userName}`, 20, 30);
  doc.text(`Period: ${startDate} - ${endDate}`, 20, 40);

  // Add stats
  doc.setFontSize(10);
  doc.text(`Tasks Completed: ${stats.tasksCompleted}`, 20, 60);
  doc.text(`Pomodoros: ${stats.pomodoros}`, 20, 70);
  doc.text(`Focus Time: ${stats.focusMinutes} minutes`, 20, 80);

  // TODO: How to add charts??? They're React components...
  // TODO: This looks really ugly
  // TODO: No formatting
  // TODO: Need images of charts somehow

  doc.save("weekly-report.pdf");
};
