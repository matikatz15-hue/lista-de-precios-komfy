"use client";

import { useRef, useState } from "react";

type Props = {
  name: string;
  currentImageUrl?: string | null;
  accept?: string;
  helperText?: string;
  recommendedSize?: string;
};

export function FileUpload({
  name,
  currentImageUrl,
  accept = "image/*",
  helperText,
  recommendedSize = "200 × 200 px (cuadrada)",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [removed, setRemoved] = useState(false);

  const hasNewFile = !!fileName;
  const hasExistingPhoto = !!currentImageUrl && !removed && !hasNewFile;

  function handleFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setRemoved(false);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function clearFile() {
    setFileName(null);
    setPreview(currentImageUrl ?? null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    // Manually set the file on the input so the form submits it
    if (inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
    }
    handleFile(file);
  }

  function handleDrag(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }

  return (
    <div>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          dragActive
            ? "border-[#0047BB] bg-blue-50"
            : preview
            ? "border-zinc-200 bg-white hover:border-zinc-300"
            : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="sr-only"
        />

        {preview ? (
          <div className="flex items-center gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Vista previa"
              className="w-20 h-20 rounded-lg object-cover bg-zinc-100 border border-zinc-200 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-zinc-900 truncate">
                {hasNewFile ? fileName : "Foto actual del grupo"}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {hasNewFile
                  ? "Lista para guardar"
                  : "Click o arrastrá otra para reemplazar"}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 uppercase tracking-wider font-semibold">
                Recomendado: {recommendedSize}
              </div>
            </div>
            {hasNewFile ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-red-600 text-lg"
                aria-label="Quitar archivo seleccionado"
              >
                ×
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-[#0047BB] bg-blue-50 hover:bg-blue-100 rounded-md"
              >
                Cambiar
              </button>
            )}
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-200 flex items-center justify-center text-2xl">
              📷
            </div>
            <div className="font-semibold text-sm text-zinc-900 mb-1">
              Seleccionar foto o arrastrarla aquí
            </div>
            <div className="text-xs text-zinc-500 mb-1">JPG, PNG, WebP — máx 1 MB</div>
            <div className="text-[10px] text-[#0047BB] uppercase tracking-wider font-bold">
              Tamaño recomendado: {recommendedSize}
            </div>
            <div className="inline-block mt-4 px-4 py-2 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-sm rounded-md">
              Elegir archivo
            </div>
          </div>
        )}
      </div>
      {helperText && <p className="text-xs text-zinc-500 mt-2">{helperText}</p>}

      {/* Status indicator below the dropzone */}
      {hasExistingPhoto && (
        <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
          <span>✓</span> Foto cargada
        </p>
      )}
      {hasNewFile && (
        <p className="text-xs text-blue-700 mt-2 flex items-center gap-1">
          <span>↑</span> Nueva foto seleccionada — apretá &quot;Guardar cambios&quot; para subirla
        </p>
      )}
    </div>
  );
}
