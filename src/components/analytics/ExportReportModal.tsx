import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, FileJson, Printer, X, Check, Sparkles } from 'lucide-react';
import { GenerationJob } from '../../types';
import { exportToCSV, exportToJSON, formatBytes, getEstimatedFileSize } from '../../services/analyticsService';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  generations: GenerationJob[];
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ isOpen, onClose, generations }) => {
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    const csvContent = exportToCSV(generations);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PromptOps_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadedFormat('CSV');
    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  const handleDownloadJSON = () => {
    const jsonContent = exportToJSON(generations);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PromptOps_Analytics_Report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadedFormat('JSON');
    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  const handlePrintPDF = () => {
    window.print();
    setDownloadedFormat('PDF');
    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  const totalBytes = generations.reduce((acc, g) => acc + getEstimatedFileSize(g), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#111827] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-400" />
              Export Analytics Report
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Export {generations.length} records ({formatBytes(totalBytes)}) in your preferred format
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Download Format Options */}
        <div className="space-y-4 mb-6">
          {/* PDF Print Option */}
          <button
            onClick={handlePrintPDF}
            className="w-full p-4 bg-white/[0.03] border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 rounded-xl transition-all flex items-center justify-between text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 group-hover:scale-110 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">PDF Executive Summary</div>
                <div className="text-xs text-slate-400">Printable formatted report page for stakeholders</div>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-white/5 border border-white/10 text-slate-300 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              Print / PDF
            </span>
          </button>

          {/* CSV Download Option */}
          <button
            onClick={handleDownloadCSV}
            className="w-full p-4 bg-white/[0.03] border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 rounded-xl transition-all flex items-center justify-between text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">CSV Data Spreadsheet</div>
                <div className="text-xs text-slate-400">Structured raw records compatible with Excel or Sheets</div>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-white/5 border border-white/10 text-slate-300 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              Download .csv
            </span>
          </button>

          {/* JSON Snapshot Option */}
          <button
            onClick={handleDownloadJSON}
            className="w-full p-4 bg-white/[0.03] border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 rounded-xl transition-all flex items-center justify-between text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">JSON Payload Snapshot</div>
                <div className="text-xs text-slate-400">Full structured object tree with tokens and metadata</div>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-white/5 border border-white/10 text-slate-300 rounded-lg group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              Download .json
            </span>
          </button>
        </div>

        {/* Download feedback message */}
        {downloadedFormat && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-xs mb-4">
            <Check className="w-4 h-4 shrink-0" />
            <span>Successfully generated {downloadedFormat} export file!</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
