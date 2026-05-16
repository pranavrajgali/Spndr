"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, Check, X, Loader2, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { formatCurrency, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";

export default function StatementImport() {
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function onDrop(acceptedFiles) {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setExtracted([]);

    try {
      let text = "";
      if (file.type === "application/pdf") {
        text = await extractTextFromPDF(file);
      } else if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        text = await extractTextFromCSV(file);
      } else {
        throw new Error("Only PDF or CSV files are supported");
      }

      const res = await fetch("/api/ai/statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.substring(0, 15000) }), // Send first 15k chars
      });
      const data = await res.json();

      if (data.transactions) {
        setExtracted(data.transactions);
      } else {
        throw new Error(data.error || "Failed to extract transactions");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "text/csv": [".csv"] },
    multiple: false,
  });

  async function extractTextFromPDF(file) {
    // Dynamic import to avoid SSR errors
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(" ") + "\n";
    }
    return fullText;
  }

  async function extractTextFromCSV(file) {
    return new Promise((resolve) => {
      Papa.parse(file, {
        complete: (results) => {
          resolve(JSON.stringify(results.data));
        },
      });
    });
  }

  async function handleConfirm() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const transactionsToInsert = extracted.map(t => ({
      user_id: user.id,
      type: t.type,
      amount: t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount),
      description: t.description,
      category: t.category,
      date: t.date,
      source: 'import'
    }));

    const { error } = await supabase.from("transactions").insert(transactionsToInsert);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setExtracted([]);
      setTimeout(() => setSuccess(false), 3000);
      window.location.reload(); // Refresh dashboard
    }
    setLoading(false);
  }

  return (
    <section className="space-y-4">
      <div 
        {...getRootProps()} 
        className={cn(
          "relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-[24px] transition-all cursor-pointer",
          isDragActive ? "border-[#0D9488] bg-[#0D9488]/5 scale-[0.98]" : "border-[#0D9488]/20 bg-white/40 hover:bg-white/60"
        )}
      >
        <input {...getInputProps()} />
        <div className="p-4 rounded-full bg-[#0D9488]/10 text-[#0D9488] mb-4">
          {loading ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-[#134E4A]">
            {loading ? "Reading statement..." : "Drop your UPI Statement here"}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">PDF or CSV from PhonePe, GPay, or Bank</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex gap-3 text-rose-700 text-sm">
          <AlertCircle size={18} />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex gap-3 text-emerald-700 text-sm">
          <Check size={18} />
          <p>Statement imported successfully!</p>
        </div>
      )}

      {extracted.length > 0 && (
        <div className="rounded-[24px] border border-[#0D9488]/20 bg-white/60 p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#134E4A]">Review Transactions ({extracted.length})</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setExtracted([])}
                className="px-4 py-2 text-xs font-bold text-[#6B7280] hover:bg-gray-100 rounded-full transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirm}
                className="px-6 py-2 text-xs font-bold bg-[#0D9488] text-white rounded-full hover:bg-[#0D9488]/90 shadow-md transition-all"
              >
                Confirm & Import
              </button>
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
            {extracted.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-[#0D9488]/10 text-sm">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    t.type === 'expense' ? "bg-rose-500" : "bg-emerald-500"
                  )} />
                  <div>
                    <p className="font-bold text-[#134E4A] line-clamp-1">{t.description}</p>
                    <p className="text-[10px] text-[#6B7280] uppercase font-bold">{t.category} • {t.date}</p>
                  </div>
                </div>
                <p className={cn(
                  "font-black tabular-nums",
                  t.type === 'expense' ? "text-rose-600" : "text-emerald-600"
                )}>
                  {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount).replace('₹', '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
