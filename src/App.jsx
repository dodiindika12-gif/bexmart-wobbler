import React, { useState, useRef, useEffect } from 'react';

// Ikon Lucide (Inline SVG)
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
);
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
);

const printStyles = `
  @media print {
    .no-print { display: none !important; }
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
  const printAreaRef = useRef(null);

  useEffect(() => {
    const scripts = [
      { src: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', global: 'XLSX' },
      { src: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', global: 'html2canvas' }
    ];

    scripts.forEach(s => {
      if (typeof window !== 'undefined' && !window[s.global]) {
        const script = document.createElement('script');
        script.src = s.src;
        script.async = true;
        document.body.appendChild(script);
      }
    });
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const handleSaveAsImage = async (pageIndex) => {
    if (!window.html2canvas) {
      showToast("Library masih memuat...");
      return;
    }
    const element = document.getElementById(`page-${pageIndex}`);
    const canvas = await window.html2canvas(element, { scale: 2 });
    const link = document.createElement('a');
    link.download = `wobbler_page_${pageIndex + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadTemplate = () => {
    if (!window.XLSX) return;
    const ws = window.XLSX.utils.json_to_sheet([{"nama_produk": "Contoh", "harga_promo": "0", "satuan": "/ PCS", "periode": "JUNI 2026", "nama_file_gambar": "img.jpg", "keterangan_bawah": "Promo"}]);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Data");
    window.XLSX.writeFile(wb, "template.xlsx");
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !window.XLSX) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = window.XLSX.read(new Uint8Array(event.target.result), { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = window.XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
      setData(rawData.map(row => {
        const n = {};
        for(let k in row) n[k.trim().toLowerCase()] = String(row[k]);
        return n;
      }));
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {toastMsg && <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded">{toastMsg}</div>}
      
      <div className="no-print max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm mb-8">
        <h1 className="text-xl font-bold mb-4">Generator Wobbler</h1>
        <div className="flex gap-4">
          <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 text-white px-4 py-2 rounded">Upload Excel</button>
          <button onClick={downloadTemplate} className="bg-green-600 text-white px-4 py-2 rounded">Download Template</button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleExcelUpload} />
          <input type="file" ref={imageInputRef} className="hidden" multiple onChange={(e) => {
             const n = {...images};
             Array.from(e.target.files).forEach(f => n[f.name] = URL.createObjectURL(f));
             setImages(n);
          }} />
          <button onClick={() => imageInputRef.current?.click()} className="bg-gray-600 text-white px-4 py-2 rounded">Upload Gambar</button>
          <input type="file" ref={templateInputRef} className="hidden" onChange={(e) => setTemplateImg(URL.createObjectURL(e.target.files[0]))} />
          <button onClick={() => templateInputRef.current?.click()} className="bg-purple-600 text-white px-4 py-2 rounded">Template BG</button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8">
        {Array.from({ length: Math.ceil(data.length / 6) }).map((_, pIdx) => (
          <div key={pIdx} className="flex flex-col items-center gap-2">
            <button onClick={() => handleSaveAsImage(pIdx)} className="no-print flex items-center gap-2 bg-blue-700 text-white px-6 py-2 rounded-full font-bold">
              <CameraIcon /> Simpan Halaman {pIdx + 1} sebagai Gambar
            </button>
            <div id={`page-${pIdx}`} className="bg-white p-4" style={{ width: '330mm', height: '215mm' }}>
              <div className="grid grid-cols-3 grid-rows-2 gap-2 h-full">
                {data.slice(pIdx * 6, pIdx * 6 + 6).map((item, i) => (
                  <div key={i} className="rounded-full overflow-hidden relative border flex flex-col items-center justify-center p-4 text-center"
                       style={{ backgroundImage: templateImg ? `url(${templateImg})` : 'none', backgroundSize: 'cover' }}>
                    <div className="text-[10px] font-bold">{item.periode}</div>
                    <div className="text-[12px] font-bold">{item.nama_produk}</div>
                    <div className="text-[32px] font-black text-red-600">Rp{item.harga_promo}</div>
                    {images[item.nama_file_gambar] && <img src={images[item.nama_file_gambar]} className="h-16 w-16 object-contain" />}
                    <div className="text-[8px]">{item.keterangan_bawah}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
