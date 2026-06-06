import React, { useState, useRef, useEffect } from 'react';

// Ikon Lucide (diganti dengan SVG inline karena tidak bisa import eksternal langsung)
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
);
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);
const PrinterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
);

// CSS Khusus untuk Print Ukuran F4
const printStyles = `
  @media print {
    @page {
      size: 215mm 330mm; /* Ukuran F4 (Folio) */
      margin: 10mm; /* Margin keliling 1cm */
    }
    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print {
      display: none !important;
    }
    .print-container {
      margin: 0;
      padding: 0;
      width: 100%;
    }
    .print-page {
      page-break-after: always;
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      grid-template-rows: repeat(2, 1fr) !important;
      gap: 10mm 5mm !important;
      width: 195mm; /* 215 - 20 (margin) */
      height: 310mm; /* 330 - 20 (margin) */
      align-items: start;
      justify-items: center;
    }
    .print-page:last-child {
      page-break-after: auto;
    }
  }
`;

export default function App() {
  const [data, setData] = useState([]);
  const [images, setImages] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Template CSV Kosong untuk diunduh
  const downloadTemplate = () => {
    const csvContent = "nama_produk,harga_promo,satuan,periode,nama_file_gambar,keterangan_bawah\nCHUPA CHUPS BIGBABOL 3.8G ASSORTED,12.790,/ 1 PCS,6 - 15 JUNI 2026,chupa_babol.jpg,Promo Khusus Member\nHAPPYDENT COOL WHITE MINT BLISTER 10PCS,3.800,/ 1 PCS,6 - 15 JUNI 2026,happydent.jpg,Promo Khusus Member";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_wobbler.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Upload CSV menggunakan fungsi bawaan (tanpa library eksternal)
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        // Parsing CSV sederhana
        try {
            // Pisahkan baris dengan menghapus whitespace di ujung
            const lines = text.trim().split('\n');
            if (lines.length < 2) {
                alert("File CSV kosong atau tidak memiliki data.");
                return;
            }

            // Ambil header dan bersihkan (trim) setiap nama kolom
            // Gunakan regex untuk menangani koma di dalam tanda kutip (jika ada) walau sederhana
            const headers = lines[0].split(',').map(header => header.trim());
            
            const parsedData = [];
            
            // Loop untuk setiap baris data
            for (let i = 1; i < lines.length; i++) {
                // Skip baris kosong
                if (!lines[i].trim()) continue;

                // Split by comma, tapi ini cara sederhana (tidak menangani koma di dalam string bertanda kutip)
                // Untuk format template kita yang sederhana, ini cukup
                const currentLine = lines[i].split(',');
                const rowObj = {};
                
                headers.forEach((header, index) => {
                    // Gunakan index untuk memetakan nilai, tambahkan fallback string kosong jika undefined
                    let value = currentLine[index] !== undefined ? currentLine[index].trim() : '';
                    
                    // Bersihkan tanda kutip jika ada di awal dan akhir string
                    if (value.startsWith('"') && value.endsWith('"')) {
                         value = value.substring(1, value.length - 1);
                    }
                    
                    rowObj[header] = value;
                });
                parsedData.push(rowObj);
            }
            
            setData(parsedData);
        } catch (error) {
             alert('Gagal membaca CSV: ' + error.message);
        }
      };
      
      reader.onerror = () => {
         alert('Terjadi kesalahan saat membaca file.');
      };
      
      reader.readAsText(file);
    }
  };

  // Handle Upload Banyak Gambar Sekaligus
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = { ...images };
    
    files.forEach(file => {
      // Simpan URL Blob untuk setiap nama file gambar
      newImages[file.name] = URL.createObjectURL(file);
    });
    
    setImages(newImages);
  };

  const handlePrint = () => {
    window.print();
  };

  // Membagi data ke dalam grup berisi 6 item (untuk 1 halaman F4)
  const chunkedData = [];
  for (let i = 0; i < data.length; i += 6) {
    chunkedData.push(data.slice(i, i + 6));
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <style>{printStyles}</style>

      {/* Header & Controls (Hidden when printing) */}
      <div className="no-print p-6 bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">BEXmart Wobbler Generator</h1>
              <p className="text-gray-500 text-sm">Automatisasi pembuatan desain wobbler siap cetak (F4)</p>
            </div>
            
            <div className="flex space-x-3 mt-4 md:mt-0">
              <button 
                onClick={downloadTemplate}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <DownloadIcon /> <span className="ml-2">Template CSV</span>
              </button>
              
              <button 
                onClick={handlePrint}
                disabled={data.length === 0}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  data.length === 0 
                    ? 'bg-blue-300 cursor-not-allowed text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <PrinterIcon /> <span className="ml-2">Cetak ke PDF (F4)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-6 rounded-xl border border-blue-100">
            {/* Step 1: Data */}
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-900 flex items-center">
                <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">1</span>
                Upload Data Promo (CSV)
              </h3>
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleCSVUpload}
                ref={fileInputRef}
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-100 transition-colors bg-white"
              >
                <UploadIcon className="mx-auto text-blue-500 mb-2" />
                <p className="text-sm text-gray-600">
                  {data.length > 0 ? <span className="font-bold text-green-600">{data.length} baris data dimuat</span> : "Pilih file .csv dari komputer"}
                </p>
              </div>
            </div>

            {/* Step 2: Gambar */}
            <div className="space-y-3">
               <h3 className="font-semibold text-blue-900 flex items-center">
                <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">2</span>
                Upload Gambar Produk
              </h3>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                onChange={handleImageUpload}
                ref={imageInputRef}
                className="hidden"
              />
              <div 
                onClick={() => imageInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-100 transition-colors bg-white"
              >
                <UploadIcon className="mx-auto text-blue-500 mb-2" />
                <p className="text-sm text-gray-600">
                  {Object.keys(images).length > 0 ? <span className="font-bold text-green-600">{Object.keys(images).length} gambar dimuat</span> : "Pilih semua gambar produk (Multiple)"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Petunjuk Penting */}
          <div className="mt-4 text-xs text-gray-500 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <strong className="text-yellow-800">⚠️ Penting saat mencetak:</strong> Pastikan settingan printer Anda pada browser: 
            <strong> Paper Size: F4 (atau 8.5 x 13 inch), Margins: None / Default, Scale: 100%, </strong> dan centang <strong>"Background graphics"</strong> agar warna biru muncul.
          </div>
        </div>
      </div>

      {/* Main Content / Print Area */}
      <div className="print-container max-w-6xl mx-auto py-8">
        {data.length === 0 ? (
          <div className="no-print text-center py-20 text-gray-400">
            Silakan upload file CSV untuk melihat pratinjau desain.
          </div>
        ) : (
          <div className="flex flex-col items-center gap-10">
            {/* Iterasi per halaman F4 */}
            {chunkedData.map((pageData, pageIndex) => (
              <div 
                key={`page-${pageIndex}`} 
                className="print-page bg-white shadow-lg no-print-shadow border relative"
                style={{ 
                  width: '215mm', 
                  minHeight: '330mm',
                  padding: '10mm',
                  boxSizing: 'border-box'
                }}
              >
                <div className="grid grid-cols-3 grid-rows-2 gap-[10mm] w-full h-full">
                  {/* Render 6 Wobbler per halaman */}
                  {Array.from({ length: 6 }).map((_, itemIndex) => {
                    const item = pageData[itemIndex];
                    if (!item) return <div key={`empty-${itemIndex}`} className="w-full h-full"></div>; // Placeholder kosong

                    const imgSrc = images[item.nama_file_gambar] || ''; // Gunakan gambar lokal yang diupload, atau kosong

                    return (
                      <div 
                        key={`wobbler-${pageIndex}-${itemIndex}`} 
                        className="w-[60mm] h-[60mm] rounded-full border-[3px] border-white mx-auto relative overflow-hidden flex flex-col justify-between"
                        style={{
                          background: 'radial-gradient(circle, #3b82f6 0%, #1e3a8a 100%)',
                          boxShadow: '0 0 0 4px #1d4ed8'
                        }}
                      >
                        {/* Header Section */}
                        <div className="text-center pt-2 px-3 z-10 relative">
                          <span className="inline-block bg-yellow-400 text-blue-900 font-black text-[7px] px-2 py-[2px] rounded-sm mb-[2px] border border-blue-900">
                            BEXmart
                          </span>
                          <div className="text-white font-black italic leading-[1] text-[10px] uppercase drop-shadow-md">
                            PROMO<br/>
                            <span className="text-yellow-400">SUPER HEMAT</span>
                          </div>
                        </div>

                        {/* Periode Pita Kuning */}
                        <div className="bg-yellow-400 text-black text-[6px] font-bold text-center py-[2px] w-full uppercase shadow-sm z-10 relative">
                          PERIODE: {item.periode || 'TANGGAL BELUM DISET'}
                        </div>

                        {/* Product Section (Nama Kiri, Gambar Kanan) */}
                        <div className="flex px-3 pt-1 h-[20mm] relative z-10">
                          <div className="w-[55%] text-white font-bold text-[7px] leading-snug text-left pt-1 drop-shadow-sm pr-1">
                            {item.nama_produk || 'NAMA PRODUK'}
                          </div>
                          <div className="w-[45%] flex justify-end items-start pt-1">
                            {imgSrc ? (
                              <img src={imgSrc} alt="Product" className="max-h-[16mm] max-w-full object-contain drop-shadow-lg bg-white/10 rounded-sm p-[1px]" />
                            ) : (
                              <div className="w-[14mm] h-[14mm] bg-gray-200 border border-gray-400 flex items-center justify-center text-[5px] text-gray-500 text-center rounded-sm">No Img<br/>{item.nama_file_gambar}</div>
                            )}
                          </div>
                        </div>

                        {/* Harga Section */}
                        <div className="px-3 pb-4 z-10 relative">
                          <div className="bg-yellow-400 text-black text-[6px] font-bold px-[6px] py-[1px] inline-block rounded-t-sm shadow-sm relative z-20">
                            KINI HANYA
                          </div>
                          <div className="bg-red-600 text-white rounded-tr-md rounded-br-md rounded-bl-md px-2 py-[1px] border border-white inline-flex items-baseline relative z-10 shadow-md -mt-[1px]">
                            <span className="text-[7px] font-bold mr-[1px]">Rp</span>
                            <span className="text-[16px] font-black tracking-tight leading-none">{item.harga_promo || '0'}</span>
                            <span className="text-[6px] font-medium ml-1 text-red-100">{item.satuan || '/ PCS'}</span>
                          </div>
                        </div>

                        {/* Footer Ribbon Pita Bawah */}
                        <div className="absolute bottom-0 left-0 w-full bg-blue-700 text-yellow-400 text-[6px] text-center py-[3px] font-bold border-t-[1px] border-white z-20 shadow-inner">
                          {item.keterangan_bawah || 'Promo Spesial'}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Visual indicator for F4 Page bounds during web preview (hidden in print) */}
                <div className="absolute inset-0 border-2 border-dashed border-gray-200 pointer-events-none no-print"></div>
                <div className="absolute -top-6 left-0 text-sm font-bold text-gray-400 no-print">Lembar F4 {pageIndex + 1}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
