import { useState, useRef, FC } from "react";
import {
  Printer,
  Download,
  FileImage,
  X,
  Loader,
  ChevronDown,
} from "lucide-react";

interface PrintButtonProps {
  canvasSelector?: string; // CSS selector untuk elemen pohon
  familyName?: string;
}

type ExportFormat = "print" | "pdf" | "png";

export const PrintButton: FC<PrintButtonProps> = (props) => {
  const { canvasSelector = ".react-flow", familyName = "Pohon Keluarga" } =
    props;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<ExportFormat | null>(null);

  const handlePrint = () => {
    setOpen(false);
    // Tambahkan class ke body agar CSS print bisa menyembunyikan sidebar dll
    document.body.classList.add("printing");
    window.print();
    setTimeout(() => document.body.classList.remove("printing"), 1000);
  };

  const captureCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const el = document.querySelector(canvasSelector) as HTMLElement;
    if (!el) return null;

    const { default: html2canvas } = await import("html2canvas");
    return html2canvas(el, {
      backgroundColor: "#FDF6E3",
      scale: 2,
      useCORS: true,
      logging: false,
      width: el.scrollWidth,
      height: el.scrollHeight,
    });
  };

  const handleExportPNG = async () => {
    setLoading("png");
    setOpen(false);
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `${familyName.replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Export PNG gagal:", e);
      alert("Gagal mengekspor gambar. Coba lagi.");
    } finally {
      setLoading(null);
    }
  };

  const handleExportPDF = async () => {
    setLoading("pdf");
    setOpen(false);
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;

      const { jsPDF } = await import("jspdf");

      const imgData = canvas.toDataURL("image/png");
      const imgW = canvas.width;
      const imgH = canvas.height;

      // Tentukan orientasi berdasarkan rasio
      const isLandscape = imgW > imgH;
      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;

      // Hitung skala agar muat di halaman
      const availW = pageW - margin * 2;
      const availH = pageH - margin * 2 - 20; // 20mm untuk header
      const scale = Math.min(availW / (imgW / 3.78), availH / (imgH / 3.78));
      const drawW = (imgW / 3.78) * scale;
      const drawH = (imgH / 3.78) * scale;
      const offsetX = (pageW - drawW) / 2;
      const offsetY = margin + 20;

      // Header
      pdf.setFillColor(92, 51, 23);
      pdf.rect(0, 0, pageW, 18, "F");
      pdf.setTextColor(253, 246, 227);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`🌳 ${familyName}`, pageW / 2, 10, { align: "center" });
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
        pageW / 2,
        15,
        { align: "center" },
      );

      // Pohon
      pdf.addImage(imgData, "PNG", offsetX, offsetY, drawW, drawH);

      // Footer
      pdf.setTextColor(160, 82, 45);
      pdf.setFontSize(7);
      pdf.text(
        "Minal Aidin Wal Faizin — Mohon Maaf Lahir dan Batin 🌙",
        pageW / 2,
        pageH - 5,
        { align: "center" },
      );

      pdf.save(`${familyName.replace(/\s+/g, "-")}.pdf`);
    } catch (e) {
      console.error("Export PDF gagal:", e);
      alert("Gagal mengekspor PDF. Coba lagi.");
    } finally {
      setLoading(null);
    }
  };

  const isLoading = loading !== null;

  return (
    <div className="relative">
      {/* Main button */}
      <div className="flex">
        <button
          onClick={handlePrint}
          disabled={isLoading}
          title="Cetak pohon keluarga"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-l-lg text-xs font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader size={14} className="animate-spin" />
          ) : (
            <Printer size={14} />
          )}
          <span className="hidden sm:inline">Cetak</span>
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={isLoading}
          className="px-1.5 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-r-lg border-l border-white/20 transition-colors disabled:opacity-50"
        >
          <ChevronDown
            size={12}
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-batik-light overflow-hidden w-44 fade-in">
            <div className="px-3 py-2 bg-batik-light/50 border-b border-batik-light">
              <p className="text-xs font-bold text-batik-brown">Export Pohon</p>
            </div>
            <button
              onClick={handlePrint}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-batik-dark hover:bg-amber-50 transition-colors"
            >
              <Printer size={15} className="text-batik-gold" />
              <span>Cetak / Print</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-batik-dark hover:bg-amber-50 transition-colors border-t border-batik-light"
            >
              <Download size={15} className="text-batik-gold" />
              <span>Simpan sebagai PDF</span>
            </button>
            <button
              onClick={handleExportPNG}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-batik-dark hover:bg-amber-50 transition-colors border-t border-batik-light"
            >
              <FileImage size={15} className="text-batik-gold" />
              <span>Simpan sebagai PNG</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
