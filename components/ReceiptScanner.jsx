"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, Check, AlertCircle, Trash2, ScanLine } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";

export default function ReceiptScanner() {
  const [loading, setLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);
    setOcrProgress(0);
    setPreview(URL.createObjectURL(file));

    try {
      // Step 1: OCR in the browser using Tesseract.js
      setOcrProgress(10);
      const Tesseract = (await import("tesseract.js")).default;
      
      setOcrProgress(30);
      const { data } = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress(30 + Math.round(m.progress * 50));
          }
        },
      });

      const ocrText = data.text;
      setOcrProgress(85);

      if (!ocrText || ocrText.trim().length < 5) {
        throw new Error("Could not read any text from the image. Try a clearer photo.");
      }

      // Step 2: Send extracted text to Groq for parsing
      setOcrProgress(90);
      const res = await fetch("/api/ai/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ocrText }),
      });
      const parsed = await res.json();

      setOcrProgress(100);

      if (parsed.data) {
        setResult(parsed.data);
      } else {
        throw new Error(parsed.error || "AI failed to parse receipt text");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "expense",
      amount: -Math.abs(result.amount),
      description: result.merchant || "Receipt Upload",
      category: result.category || "Other",
      date: result.date || new Date().toISOString().slice(0, 10),
      source: "receipt",
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setResult(null);
      setPreview(null);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  }

  return (
    <section className="space-y-4 rounded-[24px] border border-[#0D9488]/20 bg-white/40 p-6 backdrop-blur-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#134E4A]">Receipt Scanner</h3>
          <p className="text-xs text-[#6B7280]">Powered by Tesseract OCR</p>
        </div>
        <ScanLine className="text-[#0D9488]" size={20} />
      </div>

      {!preview ? (
        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#0D9488]/20 rounded-2xl cursor-pointer hover:bg-[#0D9488]/5 transition-all">
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          <div className="p-3 rounded-full bg-[#0D9488]/10 text-[#0D9488] mb-2">
            <Camera size={24} />
          </div>
          <span className="text-xs font-bold text-[#134E4A]">Take Photo or Upload</span>
        </label>
      ) : (
        <div className="space-y-4">
          <div className="relative aspect-video rounded-xl overflow-hidden border border-[#0D9488]/10 bg-black/5">
            <img src={preview} alt="Receipt Preview" className="w-full h-full object-contain" />
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-[#0D9488]" size={32} />
                <div className="w-3/4 space-y-1">
                  <div className="h-2 w-full bg-[#0D9488]/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#0D9488] transition-all duration-300 rounded-full"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-[#134E4A] text-center">
                    {ocrProgress < 30 ? "Loading OCR engine..." : 
                     ocrProgress < 85 ? "Reading text from image..." : 
                     ocrProgress < 95 ? "AI is parsing receipt..." : "Almost done!"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className="p-4 rounded-xl bg-[#0D9488]/5 border border-[#0D9488]/10 space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#6B7280]">Merchant</p>
                  <p className="font-bold text-[#134E4A]">{result.merchant}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-[#6B7280]">Amount</p>
                  <p className="text-lg font-black text-[#134E4A]">{formatCurrency(result.amount)}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#0D9488]/10">
                <div>
                  <p className="text-xs text-[#6B7280]">{result.date}</p>
                  <p className="text-[10px] font-bold text-[#0D9488]">{result.category}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setPreview(null); setResult(null); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={handleConfirm} className="flex items-center gap-1.5 px-4 py-2 bg-[#0D9488] text-white text-xs font-bold rounded-full shadow-md">
                    <Check size={14} /> Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-100">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs border border-emerald-100">
          <Check size={14} /> Receipt logged successfully!
        </div>
      )}
    </section>
  );
}
