import { CircleCheck, ExternalLink, Eye, User } from "lucide-react";
import type { PrescriptionScan } from "@/lib/data";

type ScanResultCardProps = {
  scan: PrescriptionScan;
  medicationCount: number;
};

export function ScanResultCard({ scan, medicationCount }: ScanResultCardProps) {
  return (
    <section className="card rx-scan-card" aria-labelledby="scan-title">
      <div className="rx-scan-topline">
        <h2 id="scan-title" className="rx-scan-status">
          <CircleCheck size={20} fill="currentColor" stroke="#fff" strokeWidth={2.2} aria-hidden="true" />
          Scanned Successfully
        </h2>
        <span className="rx-scan-time">{scan.scannedAt}</span>
      </div>

      <p className="rx-scan-summary">
        {medicationCount} medicines detected from{" "}
        <strong>
          {scan.doctor}
          {scan.department ? ` (${scan.department})` : ""}
        </strong>
      </p>

      <figure className="rx-scan-preview">
        <img src={scan.previewUrl} alt={`Scanned prescription ${scan.fileName}`} />
        <figcaption>
          <span className="rx-scan-file">
            <Eye size={15} strokeWidth={2} aria-hidden="true" />
            <span>{scan.fileName}</span>
          </span>
          {scan.clarity !== null ? (
            <span className="rx-clarity-pill">
              Read Confidence
              <br />({scan.clarity}%)
            </span>
          ) : null}
        </figcaption>
      </figure>

      <div className="rx-scan-footer">
        <span>
          <User size={15} strokeWidth={2} aria-hidden="true" />
          Patient: Jeanne Dupont (Age 82)
        </span>
        <a href={scan.previewUrl} target="_blank" rel="noreferrer">
          View Full Image
          <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
