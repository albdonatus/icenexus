"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download, QrCode } from "lucide-react";
import QRCode from "react-qr-code";

interface QRCodeModalProps {
  equipmentId: string;
  equipmentName: string;
  clientName: string;
  onClose: () => void;
}

export default function QRCodeModal({ equipmentId, equipmentName, clientName, onClose }: QRCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/equip/${equipmentId}`);
  }, [equipmentId]);

  function handleDownload() {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = 512;
    canvas.width = size;
    canvas.height = size + 80; // space for label below
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new window.Image();
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(blobUrl);

      // Label
      ctx.fillStyle = "#111827";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(equipmentName, size / 2, size + 32);
      ctx.fillStyle = "#6b7280";
      ctx.font = "16px sans-serif";
      ctx.fillText(clientName, size / 2, size + 58);

      const link = document.createElement("a");
      link.download = `qr-${equipmentName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = blobUrl;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-violet-600" />
            <span className="font-semibold text-gray-900 text-sm">QR Code do Equipamento</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR + info */}
        <div className="px-5 py-6 flex flex-col items-center">
          <div
            ref={qrRef}
            className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm mb-4"
          >
            {url && (
              <QRCode
                value={url}
                size={200}
                bgColor="#ffffff"
                fgColor="#1e1b4b"
                level="M"
              />
            )}
          </div>
          <p className="font-semibold text-gray-900 text-center">{equipmentName}</p>
          <p className="text-sm text-gray-500 text-center mt-0.5">{clientName}</p>
          <p className="text-xs text-gray-400 text-center mt-2 break-all px-2">{url}</p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar PNG
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
