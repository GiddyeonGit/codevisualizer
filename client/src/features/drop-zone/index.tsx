import { useCallback, useRef, useState } from "react";
import type { GraphData } from "@/shared/api/types";
import { parseProject } from "@/shared/api";

interface DropZoneProps {
  onFileDrop: (data: GraphData) => void;
}

async function readDirectoryEntry(
  entry: FileSystemDirectoryEntry,
  basePath: string = "",
): Promise<File[]> {
  const files: File[] = [];
  const reader = entry.createReader();

  const readBatch = (): Promise<void> => {
    return new Promise((resolve) => {
      reader.readEntries(async (entries) => {
        if (entries.length === 0) {
          resolve();
          return;
        }
        const promises = entries.map((childEntry) => {
          const childPath = basePath ? `${basePath}/${childEntry.name}` : childEntry.name;
          if (childEntry.isFile) {
            return new Promise<File[]>((resolveFile) => {
              (childEntry as FileSystemFileEntry).file((file) => {
                const enriched = new File([file], childPath, { type: file.type });
                resolveFile([enriched]);
              });
            });
          } else {
            return readDirectoryEntry(childEntry as FileSystemDirectoryEntry, childPath);
          }
        });
        const nestedFiles = await Promise.all(promises);
        for (const f of nestedFiles.flat()) {
          files.push(f);
        }
        await readBatch(); // Continue reading (max 100 per batch)
        resolve();
      });
    });
  };

  await readBatch();
  return files;
}

export function DropZone({ onFileDrop }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await parseProject(files);
        onFileDrop(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse project");
      } finally {
        setIsLoading(false);
      }
    },
    [onFileDrop],
  );

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
      const allFiles: File[] = [];

      for (const item of items) {
        const entry = item.webkitGetAsEntry();
        if (entry?.isDirectory) {
          const dirFiles = await readDirectoryEntry(entry as FileSystemDirectoryEntry);
          allFiles.push(...dirFiles);
        } else if (entry?.isFile) {
          const file = await new Promise<File>((resolve) => {
            (entry as FileSystemFileEntry).file(resolve);
          });
          allFiles.push(file);
        }
      }

      if (allFiles.length > 0) {
        await processFiles(allFiles);
      }
    },
    [processFiles],
  );

  const handleFolderPick = useCallback(async () => {
    try {
      if (!("showDirectoryPicker" in window)) {
        // Fallback to file input with webkitdirectory
        inputRef.current?.click();
        return;
      }
      const dirHandle = await (window as any).showDirectoryPicker();
      const files: File[] = [];
      const readDir = async (handle: FileSystemDirectoryHandle, path: string = "") => {
        for await (const [name, child] of (handle as any).entries()) {
          const childPath = path ? `${path}/${name}` : name;
          if (child.kind === "file") {
            const file = await (child as FileSystemFileHandle).getFile();
            const enriched = new File([file], childPath, { type: file.type });
            files.push(enriched);
          } else if (child.kind === "directory") {
            await readDir(child as FileSystemDirectoryHandle, childPath);
          }
        }
      };
      await readDir(dirHandle);
      await processFiles(files);
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to read folder");
    }
  }, [processFiles]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList?.length) return;
      const files = Array.from(fileList);
      await processFiles(files);
      e.target.value = "";
    },
    [processFiles],
  );

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
        background: isDragging ? "rgba(59,130,246,0.12)" : "#0f0f13",
        border: isDragging ? "2px dashed #3b82f6" : "2px dashed #334155",
        borderRadius: "16px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        color: "#94a3b8",
        fontFamily: "system-ui, sans-serif",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: "none" }}
        {...({ webkitdirectory: "" } as any)}
      />

      {isLoading ? (
        <>
          <div style={{ fontSize: "16px", color: "#3b82f6", fontWeight: 500 }}>
            Analyzing project...
          </div>
          <div style={{ fontSize: "13px", opacity: 0.6 }}>
            Reading files and building dependency graph
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: "48px", opacity: 0.5, lineHeight: 1 }}>📂</div>
          <div style={{ fontSize: "18px", fontWeight: 600, color: "#e2e8f0" }}>
            Drop your project here
          </div>
          <div style={{ fontSize: "14px", opacity: 0.6, textAlign: "center", maxWidth: "360px" }}>
            Drop a folder or file to visualize its dependency graph in 3D and 2D
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFolderPick();
            }}
            style={{
              marginTop: "8px",
              padding: "10px 24px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2563eb")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#3b82f6")}
          >
            Browse folders
          </button>
          {error && (
            <div style={{ color: "#ef4444", fontSize: "13px", marginTop: "4px" }}>
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}
