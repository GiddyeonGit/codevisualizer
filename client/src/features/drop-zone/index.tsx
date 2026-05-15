import { useCallback, useRef, useState } from "react";
import type { GraphData } from "@/shared/api/types";

interface DropZoneProps {
  onFileDrop: (data: GraphData) => void;
}

export function DropZone({ onFileDrop }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const items = Array.from(e.dataTransfer.items);
      // Handle folder drops via File System Access API
      for (const item of items) {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          // TODO: send to server for parsing
          // For now, placeholder
          console.log("Dropped:", entry.name);
        }
      }
    },
    [onFileDrop],
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    // TODO: send to server for parsing
    console.log("Selected:", files[0].name);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
        background: isDragging ? "rgba(59,130,246,0.1)" : "#0f0f13",
        border: isDragging ? "2px dashed #3b82f6" : "2px dashed #334155",
        borderRadius: "12px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        color: "#94a3b8",
        fontFamily: "system-ui, sans-serif",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: "none" }}
        {...({ webkitdirectory: "" } as any)}
      />
      <div style={{ fontSize: "48px", opacity: 0.5 }}>📂</div>
      <div style={{ fontSize: "18px", fontWeight: 600 }}>Drop your project here</div>
      <div style={{ fontSize: "14px", opacity: 0.6 }}>
        Drop a file or folder to visualize its dependencies
      </div>
    </div>
  );
}
