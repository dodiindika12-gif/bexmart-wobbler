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
const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
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

const REQUIRED_FIELDS = [
  { key: 'barcode', label: 'Barcode / SKU' },
  { key: 'nama_produk', label: 'Nama Produk' },
  { key: 'harga_promo', label: 'Harga Promo' },
  { key: 'satuan', label: 'Satuan (misal: / PCS)' },
  { key: 'periode', label: 'Periode Promo' },
  { key: 'nama_file_gambar', label: 'Nama File Gambar' },
  { key: 'keterangan_bawah', label: 'Keterangan Bawah' },
];

export default function App() {
  const [data, setData] = useState([]);
  const [images, setImages] = useState({});
  const [templateImg, setTemplateImg] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  
  // State untuk Spreadsheet
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetHeaders, setSheetHeaders] = useState([]);
  const [rawSheetData, setRawSheetData] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [isFetching, setIsFetching] = useState(false);

  const imageInputRef = useRef(null);
  const templateInputRef = useRef(null);

  // Memuat library PapaParse untuk parsing CSV dari Google Sheets
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Papa) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 5000);
  };

  // Logika Ekstraksi URL Spreadsheet
  const extractSheetInfo = (url) => {
    const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const gidMatch = url.match(/[#&]gid=([0-9]+)/);
    return {
      id: idMatch ? idMatch[1] : null,
      gid: gidMatch ? gidMatch[1] : '0'
    };
  };

  const handleFetchSpreadsheet = async () => {
    if (!sheetUrl) return showToast("Masukkan link Google Spreadsheet terlebih dahulu!");
    if (!window.Papa) return showToast("Library parser sedang dimuat, coba sesaat lagi.");

    const { id, gid } = extractSheetInfo(sheetUrl);
    if (!id) return showToast("URL tidak valid. Pastikan itu link Google Spreadsheet.");

    setIsFetching(true);
    const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;

    try {
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error("Gagal mengambil data");
      
      const csvText = await response.text();
      
      // Deteksi jika yang dikembalikan adalah halaman login HTML (karena tidak di-share publik)
      if (csvText.trim().startsWith('<!DOCTYPE html>')) {
         throw new Error("Akses ditolak");
      }

      window.Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
           if (results.meta.fields && results.meta.fields.length > 0) {
             setSheetHeaders(results.meta.fields);
             setRawSheetData(results.data);
             
             // Auto-mapping cerdas (menebak kolom berdasarkan nama)
             const initialMap = {};
             REQUIRED_FIELDS.forEach(field => {
                const matchedHeader = results.meta.fields.find(h => 
                   h.toLowerCase().replace(/[^a-z0-9]/g, '').includes(field.key.replace('_', '')) ||
                   field.label.toLowerCase().includes(h.toLowerCase())
                );
                if (matchedHeader) initialMap[field.key] = matchedHeader;
             });
             setColumnMapping(initialMap);
             showToast("Berhasil mengambil tajuk kolom! Silakan petakan datanya.");
           } else {
             showToast("Spreadsheet kosong atau format tidak dikenali.");
           }
           setIsFetching(false);
        },
        error: () => {
           throw new Error("Gagal mem-parsing data CSV");
        }
      });
    } catch (e) {
      setIsFetching(false);
      showToast("Gagal! Pastikan Spreadsheet di-setting: 'Siapa saja yang memiliki link dapat melihat' (Anyone with the link can view).");
    }
  };

  const handleApplyMapping = () => {
    const mappedData = rawSheetData.map(row => {
      const newRow = {};
      REQUIRED_FIELDS.forEach(field => {
        const mappedColName = columnMapping[field.key];
        // Tangkap nilai, pastikan string
        newRow[field.key] = mappedColName && row[mappedColName] ? String(row[mappedColName]) : '';
      });
      return newRow;
    });
    setData(mappedData);
    showToast(`${mappedData.length} baris data berhasil diproses!`);
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
              <p className="text-gray-500 text-sm">Mode Desain Vektor Editable + Google Sheets</p>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => window.print()} disabled={data.length === 0} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-all shadow-md">
                <PrinterIcon /> <span className="ml-2">Print (PDF)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100 items-start">
            
            {/* Step 1: Spreadsheet Data Source */}
            <div className="space-y-3 col-span-1 md:col-span-1 border-2 border-blue-200 bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-bold text-sm text-blue-900 flex items-center"><LinkIcon /><span className="ml-2">1. Link Google Spreadsheet</span></h3>
              <input 
                type="text" 
                placeholder="Paste link spreadsheet di sini..." 
                className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
              />
              <button 
                onClick={handleFetchSpreadsheet} 
                disabled={isFetching}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded transition-colors disabled:bg-gray-400"
              >
                {isFetching ? "Mengambil Data..." : "Tarik Data Spreadsheet"}
              </button>
            </div>

            {/* Step 2: Upload Gambar */}
            <div className="space-y-3 border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-white p-4 rounded-lg text-center cursor-pointer transition-colors" onClick={() => imageInputRef.current?.click()}>
              <h3 className="font-semibold text-sm text-blue-900">2. Upload Gambar Produk</h3>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} ref={imageInputRef} className="hidden" />
              <div className="py-2">
                <p className="text-xs text-gray-600">{Object.keys(images).length > 0 ? <span className="font-bold text-green-600">{Object.keys(images).length} gambar dimuat</span> : "Klik untuk pilih gambar"}</p>
              </div>
            </div>

            {/* Step 3: Upload Template */}
            <div className="space-y-3 border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-white p-4 rounded-lg text-center cursor-pointer transition-colors" onClick={() => templateInputRef.current?.click()}>
              <h3 className="font-semibold text-sm text-blue-900">3. Template Background</h3>
              <input type="file" accept="image/*" onChange={handleTemplateUpload} ref={templateInputRef} className="hidden" />
              <div className="py-2">
                <p className="text-xs text-gray-600">{templateImg ? <span className="font-bold text-green-600">Template aktif</span> : "Upload template PNG (opsional)"}</p>
              </div>
            </div>

            {/* Column Mapping UI (Akan muncul setelah fetch sukses) */}
            {sheetHeaders.length > 0 && (
              <div className="col-span-1 md:col-span-3 mt-2 bg-yellow-50 border border-yellow-300 p-4 rounded-lg shadow-sm animate-fade-in">
                <h3 className="font-bold text-sm text-yellow-800 mb-3">Peta Kolom (Column Mapping)</h3>
                <p className="text-xs text-yellow-700 mb-4">Cocokkan kolom dari Spreadsheet Anda dengan format sistem di bawah ini:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {REQUIRED_FIELDS.map(field => (
                    <div key={field.key} className="flex flex-col">
                      <label className="text-[11px] font-bold text-gray-700 mb-1">{field.label}</label>
                      <select 
                        className="text-xs p-1.5 border border-gray-300 rounded bg-white"
                        value={columnMapping[field.key] || ""}
                        onChange={(e) => setColumnMapping({...columnMapping, [field.key]: e.target.value})}
                      >
                        <option value="">-- Kosongkan / Abaikan --</option>
                        {sheetHeaders.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                   <button 
                     onClick={handleApplyMapping}
                     className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-6 rounded shadow"
                   >
                     Terapkan Data & Tampilkan Wobbler
                   </button>
                </div>
              </div>
            )}
            
          </div>
          
          <div className="mt-4 text-xs text-gray-700 bg-purple-50 border border-purple-200 p-3 rounded-lg flex items-center">
            <span className="text-xl mr-2">💡</span>
            <p><strong>Tips Spreadsheet & CorelDraw:</strong> Pastikan setelan Share Spreadsheet Anda adalah <strong>"Anyone with the link can view"</strong>. Jika ingin mengedit hasil akhirnya, klik <strong className="text-purple-700">"Download SVG"</strong> dan buka di CorelDraw lalu <strong>Ungroup All (Ctrl+U)</strong>.</p>
          </div>
        </div>
      </div>

      {/* Area Pratinjau & Rendering SVG */}
      <div className="print-container max-w-6xl mx-auto py-8 flex flex-col items-center">
        {data.length === 0 ? (
          <div className="no-print text-center py-20 text-gray-400">Belum ada data yang diproses. Silakan tarik data dan terapkan peta kolom.</div>
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

              {/* KANVAS SVG MURNI */}
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
                    
                    // Kalkulasi Koordinat Grid - Mengisi ke bawah terlebih dahulu
                    const col = Math.floor(itemIndex / 2);
                    const row = itemIndex % 2;
                    const x = 7.5 + (col * 105); 
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
                          
                          {/* 1. Template Background */}
                          {templateImg ? (
                            <image href={templateImg} xlinkHref={templateImg} width="104" height="104" preserveAspectRatio="none" />
                          ) : (
                            <circle cx="52" cy="52" r="52" fill="#3b82f6" />
                          )}

                          {/* 2. Teks Periode */}
                          <text x="52" y="34.5" fontSize="3.5" fontWeight="900" fill="#000" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle">
                            {item.periode || ''}
                          </text>

                          {/* 3. Teks Barcode Kecil (Tepat di atas Nama Produk) */}
                          <text x="8.5" y="41" fontSize="2.2" fontWeight="normal" fill="#555555" fontFamily="Arial, Helvetica, sans-serif">
                            {item.barcode || ''}
                          </text>

                          {/* 4. Teks Nama Produk (Di-bold menjadi Black/900 dan digeser sedikit ke bawah) */}
                          <text x="8.5" y="45.5" fontSize="3.3" fontWeight="900" fill="#000" fontFamily="Arial, Helvetica, sans-serif">
                            {productNameLines.map((line, lIdx) => (
                              <tspan x="8.5" dy={lIdx === 0 ? 0 : 3.8} key={lIdx}>{line}</tspan>
                            ))}
                          </text>

                          {/* 5. Teks KINI HANYA */}
                          <text x="14.5" y="62.5" fontSize="3" fontWeight="900" fill="#000" fontFamily="Arial, Helvetica, sans-serif">
                            KINI HANYA
                          </text>

                          {/* 6. Teks Harga Promo */}
                          <text x="14" y="78" fill="#ffffff" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900">
                            <tspan fontSize="4.5">Rp </tspan>
                            <tspan fontSize="11.5" letterSpacing="-0.5">{item.harga_promo || ''}</tspan>
                            <tspan fontSize="2.8" fontWeight="bold"> {item.satuan || ''}</tspan>
                          </text>

                          {/* 7. Gambar Produk */}
                          {imgSrc && (
                            <image href={imgSrc} xlinkHref={imgSrc} x="58" y="38" width="38" height="34" preserveAspectRatio="xMidYMid meet" />
                          )}

                          {/* 8. Keterangan Bawah */}
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
