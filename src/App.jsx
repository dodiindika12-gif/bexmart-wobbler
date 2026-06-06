import React, { useState, useRef, useEffect } from 'react';

// Ikon Lucide (Inline SVG)
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);
const VectorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="16 3 21 8 8 21 3 16 16 3"/><line x1="18" x2="21" y1="6" y2="9"/><line x1="15" x2="18" y1="9" y2="12"/><line x1="12" x2="15" y1="12" y2="15"/><line x1="9" x2="12" y1="15" y2="18"/></svg>
);
const PrinterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
);

const printStyles = `
  @media print {
    @page { size: 330mm 215.9mm; margin: 0; }
    html, body { background-color: transparent !important; }
    .no-print { display: none !important; }
    .print-page {
      page-break-after: always;
      display: flex !important;
      justify-content: center;
      align-items: center;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
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

  // Memuat library SheetJS
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
    setTimeout(() => setToastMsg(""), 5000);
  };

  const downloadTemplate = () => {
    if (!window.XLSX) return;
    const templateData = [
      { "nama_produk": "CHUPA CHUPS BIGBABOL 3.8G ASSORTED", "harga_promo": "12.790", "satuan": "/ 1 PCS", "periode": "6 - 15 JUNI 2026", "nama_file_gambar": "chupa_babol.jpg", "keterangan_bawah": "Promo Khusus Member" }
    ];
    const ws = window.XLSX.utils.json_to_sheet(templateData);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "DataPromo");
    window.XLSX.writeFile(wb, "template_wobbler.xlsx");
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !window.XLSX) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = window.XLSX.read(new Uint8Array(event.target.result), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJsonData = window.XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
        
        setData(rawJsonData.map(row => {
          const newRow = {};
          for (const key in row) newRow[key.trim().toLowerCase()] = String(row[key]);
          return newRow;
        }));
      } catch (error) {
        showToast("Gagal membaca file Excel.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Convert File ke Base64 (Syarat wajib agar gambar bisa dibaca CorelDraw di dalam SVG)
  const fileToBase64 = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

  const handleImageUpload = async (e) => {
    const newImages = { ...images };
    for (const file of Array.from(e.target.files)) {
      newImages[file.name] = await fileToBase64(file);
    }
    setImages(newImages);
  };

  const handleTemplateUpload = async (e) => {
    if (e.target.files[0]) setTemplateImg(await fileToBase64(e.target.files[0]));
  };

  // Fitur Pemecah Teks Otomatis (Agar nama produk yang panjang tidak menabrak batas di SVG)
  const wrapText = (text, maxLength) => {
    if (!text) return [];
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    words.forEach(word => {
      if ((currentLine + word).length > maxLength) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    });
    lines.push(currentLine.trim());
    return lines.slice(0, 3); // Maksimal 3 baris
  };

  // Fungsi Mengekspor SVG
  const handleDownloadSVG = (pageIndex) => {
    const svgElement = document.getElementById(`svg-page-${pageIndex}`);
    if (!svgElement) return;
    
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    
    // Pastikan header XML valid
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Wobbler_BEXmart_Editable_Hal_${pageIndex + 1}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Halaman ${pageIndex + 1} berhasil diunduh format SVG.`);
  };

  const chunkedData = [];
  for (let i = 0; i < data.length; i += 6) {
    chunkedData.push(data.slice(i, i + 6));
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      <style>{printStyles}</style>

      {toastMsg && (
        <div className="fixed top-6 right-6 bg-blue-600 text-white px-5 py-3 rounded-lg shadow-xl z-[100] transition-opacity font-bold">
          {toastMsg}
        </div>
      )}

      {/* Header & Controls */}
      <div className="no-print p-6 bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">BEXmart Wobbler Generator</h1>
              <p className="text-gray-500 text-sm">Mode Desain Vektor Editable (CorelDraw / Illustrator)</p>
            </div>
            <div className="flex space-x-3">
              <button onClick={downloadTemplate} className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium border border-green-300">
                <DownloadIcon /> <span className="ml-2">Template Excel</span>
              </button>
              <button onClick={() => window.print()} disabled={data.length === 0} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                <PrinterIcon /> <span className="ml-2">Print (PDF)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-blue-900">1. Upload File Data</h3>
              <input type="file" accept=".csv, .xlsx, .xls" onChange={handleExcelUpload} ref={fileInputRef} className="hidden" />
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center cursor-pointer hover:bg-white bg-blue-50/50">
                <p className="text-xs text-gray-600">{data.length > 0 ? <span className="font-bold text-green-600">{data.length} baris dimuat</span> : "Pilih file .xlsx"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-blue-900">2. Upload Gambar Produk</h3>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} ref={imageInputRef} className="hidden" />
              <div onClick={() => imageInputRef.current?.click()} className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center cursor-pointer hover:bg-white bg-blue-50/50">
                <p className="text-xs text-gray-600">{Object.keys(images).length > 0 ? <span className="font-bold text-green-600">{Object.keys(images).length} gambar dimuat</span> : "Pilih gambar produk"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-blue-900">3. Template Background</h3>
              <input type="file" accept="image/*" onChange={handleTemplateUpload} ref={templateInputRef} className="hidden" />
              <div onClick={() => templateInputRef.current?.click()} className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center cursor-pointer hover:bg-white bg-blue-50/50">
                <p className="text-xs text-gray-600">{templateImg ? <span className="font-bold text-green-600">Template aktif</span> : "Upload template PNG"}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-700 bg-purple-50 border border-purple-200 p-3 rounded-lg flex items-center">
            <span className="text-xl mr-2">💡</span>
            <p><strong>Tips CorelDraw:</strong> Klik tombol <strong className="text-purple-700">"Download SVG"</strong> di bawah pratinjau. Setelah SVG dibuka di CorelDraw, klik kanan pada area desain lalu pilih <strong>"Ungroup All (Ctrl+U)"</strong>. Kini teks dan gambar bisa Anda geser sesuka hati!</p>
          </div>
        </div>
      </div>

      {/* Area Pratinjau & Rendering SVG */}
      <div className="print-container max-w-6xl mx-auto py-8 flex flex-col items-center">
        {data.length === 0 ? (
          <div className="no-print text-center py-20 text-gray-400">Silakan upload data Excel Anda di atas.</div>
        ) : (
          chunkedData.map((pageData, pageIndex) => (
            <div key={`page-${pageIndex}`} className="mb-14 flex flex-col items-center print-page">
              
              <div className="no-print flex w-[330mm] justify-between items-center mb-3">
                <span className="text-sm font-bold text-gray-500 bg-white px-4 py-2 rounded-full shadow border border-gray-200">
                  Pratinjau Kertas F4 - Ke {pageIndex + 1}
                </span>
                <button onClick={() => handleDownloadSVG(pageIndex)} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-full font-bold shadow-md transition">
                  <VectorIcon /> <span className="ml-2">Download SVG (Editable)</span>
                </button>
              </div>

              {/* KANVAS SVG MURNI - PERBAIKAN: Penambahan xmlns:xlink agar gambar terbaca CorelDraw */}
              <div className="bg-white shadow-xl flex justify-center items-center" style={{ width: '330mm', height: '215.9mm' }}>
                <svg 
                  id={`svg-page-${pageIndex}`} 
                  xmlns="http://www.w3.org/2000/svg" 
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  viewBox="0 0 330 215.9" 
                  width="100%" 
                  height="100%"
                >
                  {/* Background Pemandu Kertas (Hanya visual) */}
                  <rect width="330" height="215.9" fill="#ffffff" />
                  
                  {Array.from({ length: 6 }).map((_, itemIndex) => {
                    const item = pageData[itemIndex];
                    if (!item) return null;
                    
                    // Kalkulasi Koordinat Grid - Mengisi ke bawah terlebih dahulu (Atas -> Bawah, Kiri -> Kanan)
                    const col = Math.floor(itemIndex / 2);
                    const row = itemIndex % 2;
                    const x = 7.5 + (col * 105); // 104mm width + 1mm gap + 7.5mm margin keliling
                    const y = 3.5 + (row * 105); 
                    
                    const imgSrc = images[item.nama_file_gambar] || '';
                    const productNameLines = wrapText(item.nama_produk || '', 18);

                    return (
                      <g key={itemIndex} transform={`translate(${x}, ${y})`}>
                        {/* Kliping Lingkaran agar Rapi */}
                        <clipPath id={`clip-circle-${pageIndex}-${itemIndex}`}>
                          <circle cx="52" cy="52" r="52" />
                        </clipPath>
                        
                        {/* Konten Dalam Wobbler */}
                        <g clipPath={`url(#clip-circle-${pageIndex}-${itemIndex})`}>
                          
                          {/* 1. Template Background - Menggunakan href dan xlinkHref untuk kompatibilitas CorelDraw maksimal */}
                          {templateImg ? (
                            <image href={templateImg} xlinkHref={templateImg} width="104" height="104" preserveAspectRatio="none" />
                          ) : (
                            <circle cx="52" cy="52" r="52" fill="#3b82f6" />
                          )}

                          {/* 2. Teks Periode */}
                          <text x="52" y="34.5" fontSize="3.5" fontWeight="900" fill="#000" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle">
                            {item.periode || ''}
                          </text>

                          {/* 3. Teks Nama Produk (Auto-wrap) */}
                          <text x="8.5" y="46.5" fontSize="3.2" fontWeight="bold" fill="#000" fontFamily="Arial, Helvetica, sans-serif">
                            {productNameLines.map((line, lIdx) => (
                              <tspan x="8.5" dy={lIdx === 0 ? 0 : 3.8} key={lIdx}>{line}</tspan>
                            ))}
                          </text>

                          {/* 4. Teks KINI HANYA */}
                          <text x="14.5" y="62.5" fontSize="3" fontWeight="900" fill="#000" fontFamily="Arial, Helvetica, sans-serif">
                            KINI HANYA
                          </text>

                          {/* 5. Teks Harga Promo */}
                          <text x="14" y="78" fill="#ffffff" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900">
                            <tspan fontSize="4.5">Rp </tspan>
                            <tspan fontSize="11.5" letterSpacing="-0.5">{item.harga_promo || ''}</tspan>
                            <tspan fontSize="2.8" fontWeight="bold"> {item.satuan || ''}</tspan>
                          </text>

                          {/* 6. Gambar Produk */}
                          {imgSrc && (
                            <image href={imgSrc} xlinkHref={imgSrc} x="58" y="38" width="38" height="34" preserveAspectRatio="xMidYMid meet" />
                          )}

                          {/* 7. Keterangan Bawah */}
                          <text x="52" y="100.5" fontSize="2.5" fontWeight="bold" fill="#ffffff" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle">
                            {item.keterangan_bawah || ''}
                          </text>

                        </g>

                        {/* Garis Potong Tipis (Outlines) */}
                        <circle cx="52" cy="52" r="52" fill="none" stroke="#cccccc" strokeWidth="0.3" />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
