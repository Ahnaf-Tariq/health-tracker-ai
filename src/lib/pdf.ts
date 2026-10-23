import type { WellnessReport } from '../domain/types';
import { buildReportText } from './summary';

let jspdfModule: Promise<typeof import('jspdf')> | undefined;

function getJsPDF() {
  jspdfModule ??= import('jspdf');
  return jspdfModule;
}

export function preloadReportPDF(): Promise<void> {
  return getJsPDF().then(() => undefined);
}

export async function buildReportPDF(report: WellnessReport): Promise<import('jspdf').jsPDF> {
  const { jsPDF } = await getJsPDF();
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const margin = 19;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  const bottom = pdf.internal.pageSize.getHeight() - margin;
  const lines = buildReportText(report).split('\n');
  let y = 24;
  pdf.setProperties({ title: 'Health Tracker — Wellness check-in', subject: 'Private, browser-generated wellness summary' });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(25, 81, 68);
  pdf.text('Health Tracker', margin, y);
  y += 13;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(79, 94, 87);
  pdf.text('Your private wellness check-in', margin, y);
  y += 9;

  for (const sourceLine of lines.slice(1)) {
    const line = sourceLine.trimEnd();
    if (y > bottom - 9) {
      pdf.addPage();
      y = 22;
    }
    if (!line) {
      y += 4;
      continue;
    }
    const isHeading = /^[A-Z0-9 —&]+$/.test(line) && line.length > 2;
    pdf.setFont('helvetica', isHeading ? 'bold' : 'normal');
    pdf.setFontSize(isHeading ? 13 : 11);
    pdf.setTextColor(isHeading ? 25 : 53, isHeading ? 81 : 70, isHeading ? 68 : 67);
    const wrapped = pdf.splitTextToSize(line, width) as string[];
    for (const wrappedLine of wrapped) {
      if (y > bottom - 6) {
        pdf.addPage();
        y = 22;
      }
      pdf.text(wrappedLine, margin, y);
      y += isHeading ? 7 : 5.7;
    }
  }
  return pdf;
}

export interface DownloadEnvironment {
  document: Pick<Document, 'createElement' | 'body'>;
  createObjectURL: (blob: Blob) => string;
  revokeObjectURL: (url: string) => void;
  defer: (callback: () => void, delayMs: number) => unknown;
}

export function triggerBlobDownload(blob: Blob, filename: string, env?: DownloadEnvironment): void {
  const environment = env ?? {
    document,
    createObjectURL: (file: Blob) => URL.createObjectURL(file),
    revokeObjectURL: (url: string) => URL.revokeObjectURL(url),
    defer: (callback: () => void, delayMs: number) => window.setTimeout(callback, delayMs),
  };
  const objectUrl = environment.createObjectURL(blob);
  const link = environment.document.createElement('a') as HTMLAnchorElement;
  link.href = objectUrl;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  environment.document.body.appendChild(link);
  link.click();
  link.remove();
  environment.defer(() => environment.revokeObjectURL(objectUrl), 30_000);
}

export async function downloadReportPDF(report: WellnessReport): Promise<void> {
  const pdf = await buildReportPDF(report);
  const blob = pdf.output('blob') as Blob;
  if (blob.size < 5 || blob.type !== 'application/pdf') throw new Error('The PDF file could not be prepared.');
  triggerBlobDownload(blob, 'health-tracker-wellness-summary.pdf');
}
