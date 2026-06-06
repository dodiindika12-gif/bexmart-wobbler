import React, { useState, useRef, useEffect } from 'react';

// Ikon Lucide (Inline SVG)
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
);
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);
const PrinterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
);

const printStyles = `
  @media print {
    @page { size: 330mm 215mm; margin: 3mm; }
    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .no-print { display: none !important; }
    .print-container { margin: 0; padding: 0; width: 100%; }
    .print-page {
      page-break-after: always;
      display: flex !important;
      width: 324mm; height: 209mm;
      align-items: center; justify-content: center;
    }
  }
`;

export default function App() {
  const [data, setData] = useState([]);
  const [images, setImages] = useState({});
  const [templateImg, setTemplateImg] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const templateInputRef = useRef(null);

  // Memuat library SheetJS (xlsx) secara dinamis agar kompatibel dengan pratinjau browser
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const downloadTemplate = () => {
    if (!window.XLSX) {
      showToast("Library Excel masih memuat, silakan coba beberapa detik lagi.");
      return;
    }

    const templateData = [
      {
        "nama_produk": "CHUPA CHUPS BIGBABOL 3.8G ASSORTED",
        "harga_promo": "12.790",
        "satuan": "/ 1 PCS",
        "periode": "6 - 15 JUNI 2026",
        "nama_file_gambar": "chupa_babol.jpg",
        "keterangan_bawah": "Promo Khusus Member"
      },
      {
        "nama_produk": "HAPPYDENT COOL WHITE MINT BLISTER 10PCS",
        "harga_promo": "3.800",
        "satuan": "/ 1 PCS",
        "periode": "6 - 15 JUNI 2026",
        "nama_file_gambar": "happydent.jpg",
        "keterangan_bawah": "Promo Khusus Member"
      }
    ];

    const ws = window.XLSX.utils.json_to_sheet(templateData);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "DataPromo");

    window.XLSX.writeFile(wb, "template_wobbler.xlsx");
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.XLSX) {
      showToast("Library Excel masih memuat, silakan coba beberapa detik lagi.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileData = new Uint8Array(event.target.result);
        const workbook = window.XLSX.read(fileData, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawJsonData = window.XLSX.utils.sheet_to_json(worksheet, { 
          defval: "", 
          raw: false // Membaca apa adanya sebagai teks yang terlihat di layar Excel
        });
        
        // Normalisasi key untuk menghindari masalah spasi atau huruf kapital di Excel
        const jsonData = rawJsonData.map(row => {
          const newRow = {};
          for (const key in row) {
            const cleanKey = key.trim().toLowerCase();
            newRow[cleanKey] = String(row[key]);
          }
          return newRow;
        });
        
        setData(jsonData);
      } catch (error) {
        showToast("Gagal membaca file Excel. Pastikan formatnya sudah benar.");
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = { ...images };
    files.forEach(file => { newImages[file.name] = URL.createObjectURL(file); });
    setImages(newImages);
  };

  const handleTemplateUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTemplateImg(URL.createObjectURL(file));
    }
  };

  const chunkedData = [];
  for (let i = 0; i < data.length; i += 6) {
    chunkedData.push(data.slice(i, i + 6));
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <style>{printStyles}</style>

      {/* Pesan Notifikasi (Toast) */}
      {toastMsg && (
        <div className="fixed top-6 right-6 bg-red-600 text-white px-5 py-3 rounded-lg shadow-xl z-[100] transition-opacity font-medium text-sm">
          {toastMsg}
        </div>
      )}

      {/* Header & Controls */}
      <div className="no-print p-6 bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">BEXmart Wobbler Generator</h1>
              <p className="text-gray-500 text-sm">Versi Custom Background Template</p>
            </div>
            <div className="flex space-x-3">
              <button onClick={downloadTemplate} className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium border border-green-300">
                <DownloadIcon /> <span className="ml-2">Template Excel</span>
              </button>
              <button onClick={() => window.print()} disabled={data.length === 0} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                <PrinterIcon /> <span className="ml-2">Cetak ke PDF (F4)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
            {/* Step 1 */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-blue-900">1. Upload File Data</h3>
              <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleExcelUpload} ref={fileInputRef} className="hidden" />
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center cursor-pointer hover:bg-white bg-blue-50/50">
                <p className="text-xs text-gray-600">{data.length > 0 ? <span className="font-bold text-green-600">{data.length} baris dimuat</span> : "Pilih file .xlsx / .csv"}</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-blue-900">2. Upload Gambar Produk</h3>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} ref={imageInputRef} className="hidden" />
              <div onClick={() => imageInputRef.current?.click()} className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center cursor-pointer hover:bg-white bg-blue-50/50">
                <p className="text-xs text-gray-600">{Object.keys(images).length > 0 ? <span className="font-bold text-green-600">{Object.keys(images).length} gambar dimuat</span> : "Pilih gambar produk"}</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-blue-900">3. Template Background</h3>
              <input type="file" accept="image/*" onChange={handleTemplateUpload} ref={templateInputRef} className="hidden" />
              <div onClick={() => templateInputRef.current?.click()} className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center cursor-pointer hover:bg-white bg-blue-50/50">
                <p className="text-xs text-gray-600">{templateImg ? <span className="font-bold text-green-600">Template aktif</span> : "Upload template PNG"}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-500 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <strong className="text-yellow-800">⚠️ Penting saat mencetak:</strong> Pastikan settingan printer Anda pada browser: 
            <strong> Paper Size: F4 (atau 8.5 x 13 inch), Orientation: Landscape (Mendatar), Margins: None / Default, Scale: 100%, </strong> dan centang <strong>"Background graphics"</strong>.
          </div>
        </div>
      </div>

      {/* Main Print Area */}
      <div className="print-container max-w-6xl mx-auto py-8">
        {data.length === 0 ? (
          <div className="no-print text-center py-20 text-gray-400">Silakan upload data di atas.</div>
        ) : (
          <div className="flex flex-col items-center gap-10">
            {chunkedData.map((pageData, pageIndex) => (
              <div key={`page-${pageIndex}`} className="print-page bg-white shadow-lg border relative flex items-center justify-center" style={{ width: '330mm', minHeight: '215mm', padding: '3mm', boxSizing: 'border-box' }}>
                
                <div 
                  className="grid grid-flow-col gap-[1mm]" 
                  style={{ 
                    gridTemplateColumns: 'repeat(3, 104mm)', 
                    gridTemplateRows: 'repeat(2, 104mm)' 
                  }}
                >
                  {Array.from({ length: 6 }).map((_, itemIndex) => {
                    const item = pageData[itemIndex];
                    if (!item) return <div key={`empty-${itemIndex}`}></div>;
                    const imgSrc = images[item.nama_file_gambar] || '';

                    return (
                      <div key={`wobbler-${itemIndex}`} className="w-[104mm] h-[104mm] rounded-full relative overflow-hidden" 
                           style={{ 
                             backgroundImage: templateImg ? `url(${templateImg})` : 'radial-gradient(circle, #3b82f6 0%, #1e3a8a 100%)',
                             backgroundSize: '100% 100%', 
                             backgroundPosition: 'center',
                             backgroundRepeat: 'no-repeat',
                             border: templateImg ? 'none' : '3px solid white',
                           }}>
                        
                        {/* Fallback Jika Tidak Ada Template */}
                        {!templateImg && (
                           <div className="absolute top-[8%] w-full text-center text-white text-[13px] font-bold">BEXmart<br/>PROMO SUPER HEMAT<br/>(UPLOAD TEMPLATE PNG)</div>
                        )}

                        {/* Teks Periode (Pita Kuning Atas) */}
                        <div className="absolute top-[30%] w-full text-center text-[13px] font-extrabold text-black uppercase tracking-tight z-10">
                          {item.periode || ''}
                        </div>

                        {/* Nama Produk (Kiri Area Putih) */}
                        <div className="absolute top-[42%] left-[8%] w-[42%] text-[12px] font-bold text-black text-left leading-tight z-10">
                          {item.nama_produk || ''}
                        </div>

                        {/* Teks "KINI HANYA" (Kotak Kuning Kecil) */}
                        <div className="absolute top-[58%] left-[14%] text-[11px] font-black text-black z-10 tracking-wide">
                          KINI HANYA
                        </div>

                        {/* Area Harga (Blok Merah) */}
                        <div className="absolute top-[65.5%] left-[13.5%] flex items-baseline text-white z-10">
                          <span className="text-[16px] font-bold mr-[1px]">Rp</span>
                          <span className="text-[42px] font-black tracking-tighter leading-none">{item.harga_promo || ''}</span>
                          <span className="text-[10px] font-bold ml-[3px]">{item.satuan || ''}</span>
                        </div>

                        {/* Gambar Produk (Kanan Area Putih) */}
                        <div className="absolute top-[37%] right-[8%] w-[38%] h-[32%] flex justify-center items-center z-10">
                          {imgSrc ? (
                            <img src={imgSrc} className="max-w-full max-h-full object-contain drop-shadow-md" />
                          ) : (
                            <div className="text-[9px] text-gray-400 border border-gray-300 p-1">No Img</div>
                          )}
                        </div>

                        {/* Keterangan Bawah (Area Biru Paling Bawah) */}
                        <div className="absolute bottom-[3%] w-full text-center text-[9px] font-bold text-white z-10">
                          {item.keterangan_bawah || ''}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
