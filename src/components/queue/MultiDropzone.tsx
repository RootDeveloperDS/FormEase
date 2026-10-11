import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';

interface MultiDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  title?: string;
  description?: string;
  className?: string;
}

export const MultiDropzone: React.FC<MultiDropzoneProps> = ({
  onFilesSelected,
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  multiple = true,
  title = 'Drop camera photos, signatures, or documents here',
  description = 'Supports JPG, PNG, WebP & PDF documents up to 50 MB',
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      tabIndex={0}
      role="button"
      aria-label="Upload files drop zone. Click or drag and drop files here."
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={`relative rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer select-none group focus-visible:ring-2 focus-visible:ring-emerald-400 ${
        isDragOver
          ? 'border-emerald-400 bg-emerald-950/20 scale-[1.01]'
          : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700'
      } ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center gap-3">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg ${
            isDragOver
              ? 'bg-emerald-500 text-slate-950'
              : 'bg-slate-800/80 text-emerald-400 border border-slate-700/80 group-hover:bg-emerald-500/20'
          }`}
        >
          <UploadCloud className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium pt-1">
          <span className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-blue-400" /> Auto-Righting EXIF
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Near-Ceiling Sizing
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-yellow-400" /> Grayscale PDF Support
          </span>
        </div>
      </div>
    </div>
  );
};
