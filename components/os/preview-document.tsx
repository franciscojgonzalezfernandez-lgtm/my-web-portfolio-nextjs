"use client";

import { useEffect, useRef, useState } from "react";
import { certifications } from "@/data/certifications.data";
import { trackCvDownload, trackExternalClick } from "@/lib/analytics";
import { useLanguageStore } from "@/stores/useLanguageStore";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const CV_PATH = `${BASE_PATH}/CV-Javi.pdf`;
export const CV_LABEL = "CV.pdf";

export type PreviewDoc = { kind: "cv" } | { kind: "certificate"; id: string };

const driveFileId = (url: string) => url.match(/\/file\/d\/([^/]+)/)?.[1] ?? null;

const documentDocs = certifications.map((certificate) => {
  const fileId = driveFileId(certificate.driveUrl);
  return {
    ...certificate,
    id: fileId ?? certificate.title,
    previewUrl: fileId
      ? `https://drive.google.com/file/d/${fileId}/preview`
      : certificate.driveUrl,
  };
});

export const certificateDocs = documentDocs.filter((doc) => doc.folder === "certifications");
export const referenceDocs = documentDocs.filter((doc) => doc.folder === "references");

export const findCertificate = (id: string) =>
  documentDocs.find((certificate) => certificate.id === id);

export const certificateLabel = (
  certificate: (typeof documentDocs)[number],
  isGerman: boolean,
) => `${isGerman ? certificate.titleGerman : certificate.title}.pdf`;

const LABELS = {
  english: { download: "Download", openDrive: "Open in Drive", loading: "Loading…", failed: "The preview could not load.", page: "Page" },
  german: { download: "Herunterladen", openDrive: "In Drive öffnen", loading: "Wird geladen…", failed: "Die Vorschau konnte nicht geladen werden.", page: "Seite" },
} as const;

// Renders every page of a PDF to canvases with pdf.js, so the CV looks the same in
// every browser (iOS Safari only shows the first page of an embedded PDF).
function PdfPages({ src, labels }: { src: string; labels: (typeof LABELS)[keyof typeof LABELS] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    const render = async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      const pdf = await pdfjs.getDocument(src).promise;
      const width = container.clientWidth || 800;
      const ratio = window.devicePixelRatio || 1;
      container.replaceChildren();
      for (let number = 1; number <= pdf.numPages; number += 1) {
        if (cancelled) return;
        const page = await pdf.getPage(number);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (width / base.width) * ratio });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = "preview-page";
        canvas.setAttribute("aria-label", `${labels.page} ${number}`);
        container.appendChild(canvas);
        const context = canvas.getContext("2d");
        if (!context) continue;
        await page.render({ canvasContext: context, viewport }).promise;
      }
      if (!cancelled) setStatus("ready");
    };

    render().catch(() => {
      if (!cancelled) setStatus("failed");
    });
    return () => {
      cancelled = true;
    };
  }, [src, labels.page]);

  return (
    <>
      {status !== "ready" && (
        <p className="preview-status">{status === "failed" ? labels.failed : labels.loading}</p>
      )}
      <div ref={containerRef} className="preview-pages" />
    </>
  );
}

export default function PreviewDocument({ doc }: { doc: PreviewDoc }) {
  const language = useLanguageStore((state) => state.language);
  const labels = LABELS[language];
  const isGerman = language === "german";

  if (doc.kind === "cv") {
    return (
      <div className="preview-doc">
        <div className="preview-toolbar">
          <span>{CV_LABEL}</span>
          <a
            href={CV_PATH}
            download="CV-Javi.pdf"
            onClick={() => trackCvDownload(language)}
          >
            {labels.download}
          </a>
        </div>
        <div className="preview-scroll">
          <PdfPages src={CV_PATH} labels={labels} />
        </div>
      </div>
    );
  }

  const certificate = findCertificate(doc.id);
  if (!certificate) return null;
  return (
    <div className="preview-doc">
      <div className="preview-toolbar">
        <span>
          {isGerman ? certificate.issuerGerman : certificate.issuer} · {certificate.date}
        </span>
        <a
          href={certificate.driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackExternalClick("Google Drive", "certifications")}
        >
          {labels.openDrive} ↗
        </a>
      </div>
      <iframe
        className="preview-frame"
        src={certificate.previewUrl}
        title={certificateLabel(certificate, isGerman)}
        allow="autoplay"
      />
    </div>
  );
}
