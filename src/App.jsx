import React, { useState, useRef } from 'react';

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
    @page { size: 215mm 330mm; margin: 10mm; }
    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .no-print { display: none !important; }
    .print-container { margin: 0; padding: 0; width: 100%; }
    .print-page {
      page-break-after: always;
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      grid-template-rows: repeat(2, 1fr) !important;
      gap: 10mm 5mm !important;
      width: 195mm; height: 310mm;
      align-items: start; justify-items: center;
    }
  }
`;

export default function App() {
  const [data, setData] = useState([]);
  const [images, setImages] = useState({});
  const [templateImg, setTemplateImg] = useState(null);
  
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const templateInputRef = useRef(null);

  const downloadTemplate = () => {
    const csvContent = "nama_produk,harga_promo,satuan,periode,nama_file_gambar,keterangan_bawah\nCHUPA CHUPS BIGBABOL 3.8G ASSORTED,12.790,/ 1 PCS,6 - 15 JUNI 2026,chupa_babol.jpg,Promo Khusus Member\nHAPPYDENT COOL WHITE MINT BLISTER 10PCS,3.800,/ 1 PCS,6 - 15 JUNI 2026,happydent.jpg,Promo Khusus Member";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_wobbler.csv';
    link.click();
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(h => h.trim());
      const parsedData = [];
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        const values = rows[i].split(',').map(v => v.trim());
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index];
        });
        parsedData.push(rowData);
      }
      setData(parsedData);
    };
    reader.readAsText(file);
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

      {/* Header & Controls */}
      <div className="no-print p-6 bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">BEXmart Wobbler Generator</h1>
              <p className="text-gray-500 text-sm">Versi Custom Background Template</p>
            </div>
            <div className="flex space-x-3">
              <button onClick={downloadTemplate} className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                <DownloadIcon /> <span className="ml-2">Template CSV</span>
              </button>
              <button onClick={() => window.print()} disabled={data.length === 0} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                <PrinterIcon /> <span className="ml-2">Cetak ke PDF (F4)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
            {/* Step 1 */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-blue-900">1. Upload CSV</h3>
              <input type="file" accept=".csv" onChange={handleCSVUpload} ref={fileInputRef} className="hidden" />
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center cursor-pointer hover:bg-white bg-blue-50/50">
                <p className="text-xs text-gray-600">{data.length > 0 ? <span className="font-bold text-green-600">{data.length} baris dimuat</span> : "Pilih file .csv"}</p>
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
        </div>
      </div>

      {/* Main Print Area */}
      <div className="print-container max-w-6xl mx-auto py-8">
        {data.length === 0 ? (
          <div className="no-print text-center py-20 text-gray-400">Silakan upload data di atas.</div>
        ) : (
          <div className="flex flex-col items-center gap-10">
            {chunkedData.map((pageData, pageIndex) => (
              <div key={`page-${pageIndex}`} className="print-page bg-white shadow-lg border relative" style={{ width: '215mm', minHeight: '330mm', padding: '10mm', boxSizing: 'border-box' }}>
                <div className="grid grid-cols-3 grid-rows-2 gap-[10mm] w-full h-full">
                  {Array.from({ length: 6 }).map((_, itemIndex) => {
                    const item = pageData[itemIndex];
                    if (!item) return <div key={`empty-${itemIndex}`}></div>;
                    const imgSrc = images[item.nama_file_gambar] || '';

                    return (
                      <div key={`wobbler-${itemIndex}`} className="w-[64mm] h-[64mm] rounded-full mx-auto relative overflow-hidden" 
                           style={{ 
                             backgroundImage: templateImg ? `url(${templateImg})` : 'radial-gradient(circle, #3b82f6 0%, #1e3a8a 100%)',
                             backgroundSize: '100% 100%', 
                             backgroundPosition: 'center',
                             backgroundRepeat: 'no-repeat',
                             border: templateImg ? 'none' : '3px solid white',
                           }}>
                        
                        {/* Fallback Jika Tidak Ada Template */}
                        {!templateImg && (
                           <div className="absolute top-[8%] w-full text-center text-white text-[8px] font-bold">BEXmart<br/>PROMO SUPER HEMAT<br/>(UPLOAD TEMPLATE PNG)</div>
                        )}

                        {/* Teks Periode (Pita Kuning Atas) */}
                        <div className="absolute top-[30.5%] w-full text-center text-[5.5px] font-extrabold text-black uppercase tracking-tight z-10">
                          PERIODE: {item.periode || 'TANGGAL BELUM DISET'}
                        </div>

                        {/* Nama Produk (Kiri Area Putih) */}
                        <div className="absolute top-[42%] left-[8%] w-[42%] text-[7.5px] font-bold text-black text-left leading-tight z-10">
                          {item.nama_produk || 'NAMA PRODUK'}
                        </div>

                        {/* Teks "KINI HANYA" (Kotak Kuning Kecil) */}
                        <div className="absolute top-[57%] left-[9%] text-[5px] font-black text-black z-10">
                          KINI HANYA
                        </div>

                        {/* Area Harga (Blok Merah) */}
                        <div className="absolute top-[63%] left-[8%] flex items-baseline text-white z-10">
                          <span className="text-[7.5px] font-bold mr-[1px]">Rp</span>
                          <span className="text-[20px] font-black tracking-tighter leading-none">{item.harga_promo || '0'}</span>
                          <span className="text-[6.5px] font-bold ml-[2px]">{item.satuan || '/ PCS'}</span>
                        </div>

                        {/* Gambar Produk (Kanan Area Putih) */}
                        <div className="absolute top-[37%] right-[8%] w-[38%] h-[32%] flex justify-center items-center z-10">
                          {imgSrc ? (
                            <img src={imgSrc} className="max-w-full max-h-full object-contain drop-shadow-md" />
                          ) : (
                            <div className="text-[5px] text-gray-400 border border-gray-300 p-1">No Img</div>
                          )}
                        </div>

                        {/* Keterangan Bawah (Area Biru Paling Bawah) */}
                        <div className="absolute bottom-[3%] w-full text-center text-[5.5px] font-bold text-white z-10">
                          {item.keterangan_bawah || 'Promo Khusus Member'}
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
