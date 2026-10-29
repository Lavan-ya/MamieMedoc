"use client";

import { useRef, useState, type DragEvent, type Ref } from "react";
import { Camera, CirclePlus, FileUp, Lightbulb } from "lucide-react";

type PrescriptionUploadCardProps = {
  onFileSelected: (file: File) => void;
  browseRef?: Ref<HTMLButtonElement>;
};

export function PrescriptionUploadCard({ onFileSelected, browseRef }: PrescriptionUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onFileSelected(file);
  }

  return (
    <section className="card rx-upload-card" id="upload" aria-labelledby="upload-title">
      <div className="rx-card-heading">
        <div className="rx-card-title">
          <CirclePlus size={22} strokeWidth={1.8} aria-hidden="true" />
          <h2 id="upload-title">Add a New Prescription</h2>
        </div>
        <span className="rx-step-pill">Step 1 of 2</span>
      </div>

      <div
        className={`rx-dropzone${dragging ? " is-dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className="rx-dropzone-icon" aria-hidden="true">
          <Camera size={24} strokeWidth={1.8} />
        </span>
        <h3>Drag prescription photo here</h3>
        <p>or tap to upload camera capture from your tablet / PC</p>
        <button
          type="button"
          ref={browseRef}
          className="rx-browse-button"
          onClick={() => inputRef.current?.click()}
        >
          <FileUp size={16} strokeWidth={2} aria-hidden="true" />
          Browse scanned document or image
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFileSelected(file);
            event.target.value = "";
          }}
        />
      </div>

      <div className="rx-tip">
        <Lightbulb size={18} fill="currentColor" strokeWidth={1.6} aria-hidden="true" />
        <p>
          Supports printed pharmacy orders or handwritten doctor notes. Our medical-grade OCR
          automatically cross-references active molecules and safety thresholds.
        </p>
      </div>
    </section>
  );
}
