import jsPDF from "jspdf";
import type { Poll, PollResults } from "../types";

type HistoryItem = {
  poll: Poll;
  results: PollResults;
};

const addWrappedText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 6
) => {
  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach((line: string, idx: number) => {
    doc.text(line, x, y + idx * lineHeight);
  });
  return y + lines.length * lineHeight;
};

export const downloadPollHistoryPdf = (history: HistoryItem[]) => {
  const doc = new jsPDF();
  let y = 16;

  doc.setFontSize(16);
  doc.text("Poll History", 14, y);
  y += 8;

  history.forEach((item, index) => {
    if (y > 270) {
      doc.addPage();
      y = 16;
    }
    doc.setFontSize(12);
    y = addWrappedText(
      doc,
      `Question ${index + 1}: ${item.poll.question}`,
      14,
      y,
      180
    );
    y += 2;
    const resultMap = new Map(
      item.results.options.map((opt) => [opt.id, opt.percentage])
    );
    const hasCorrect = item.poll.options.some((opt) => opt.isCorrect === true);
    doc.setFontSize(11);
    item.poll.options.forEach((option) => {
      if (y > 280) {
        doc.addPage();
        y = 16;
      }
      const percentage = resultMap.get(option.id) ?? 0;
      const isCorrect = option.isCorrect === true;
      if (hasCorrect) {
        doc.setTextColor(
          isCorrect ? 46 : 211,
          isCorrect ? 125 : 47,
          isCorrect ? 50 : 47
        );
      }
      y = addWrappedText(
        doc,
        `${hasCorrect ? (isCorrect ? "✓" : "✗") + " " : ""}${option.text} (${percentage}%)`,
        18,
        y,
        176
      );
    });
    doc.setTextColor(0, 0, 0);
    y += 4;
  });

  doc.save("poll-history.pdf");
};
