
import React, { useState, useMemo } from 'react';
import Uploader from './components/Uploader';
import { extractDataFromDocument } from './services/geminiService';
import { ExtractionResult, DocFile, DeclarationRow } from './types';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  const [doc, setDoc] = useState<DocFile | null>(null);
  const [history, setHistory] = useState<DeclarationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File, base64: string, mimeType: string) => {
    setDoc({ file, preview: URL.createObjectURL(file), base64, mimeType });
    setError(null);
  };

  const handleProcess = async () => {
    if (!doc) return;
    setLoading(true);
    setError(null);
    try {
      const result = await extractDataFromDocument(doc.base64, doc.mimeType, doc.file.name, "");
      setHistory(prev => [...prev, ...result.declarations]);
      setDoc(null);
    } catch (err) {
      setError("Error al extraer datos. Asegúrate de que el documento contiene formularios DIM legibles.");
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    return history.reduce((acc, row) => ({
      c54: acc.c54 + row.c54,
      c55: acc.c55 + row.c55,
      c58: acc.c58 + row.c58,
      c59: acc.c59 + row.c59,
      c66: acc.c66 + row.c66,
      c70: acc.c70 + row.c70,
      c71: acc.c71 + row.c71,
      c72: acc.c72 + row.c72,
      c74: acc.c74 + row.c74,
      c77: acc.c77 + row.c77,
      c78: acc.c78 + row.c78,
      c82: acc.c82 + row.c82,
    }), {
      c54: 0, c55: 0, c58: 0, c59: 0, c66: 0, c70: 0, c71: 0, c72: 0, c74: 0, c77: 0, c78: 0, c82: 0
    });
  }, [history]);

  const handleExportExcel = () => {
    if (history.length === 0) return;

    // Map data to friendly names for Excel headers
    const excelData = history.map(row => ({
      'ID Declaración': row.docId,
      'Archivo': row.fileName,
      'C.42 (Manifiesto)': row.c42,
      'C.44 (Doc T)': row.c44,
      'C.51 (Fact)': row.c51,
      'C.54 (Trans)': row.c54,
      'C.55 (Bandera)': row.c55,
      'C.58 (T Cambio)': row.c58,
      'C.59 (Sub)': Math.round(row.c59),
      'C.66 (P Origen)': row.c66,
      'C.70 (P Compra)': row.c70,
      'C.71 (P.Bruto)': row.c71,
      'C.72 (P.Neto)': row.c72,
      'C.73 (Embalaje)': row.c73,
      'C.74 (Bulto)': row.c74,
      'C.77 (Cant.)': row.c77,
      'C.78 (FOB)': row.c78,
      'C.82 (Sum.G)': row.c82,
      'C.134 (Levante)': row.c134,
    }));

    // Add Totals row at the end
    excelData.push({
      'ID Declaración': 'TOTALES',
      'Archivo': '',
      'C.42 (Manifiesto)': '',
      'C.44 (Doc T)': '',
      'C.51 (Fact)': '',
      'C.54 (Trans)': totals.c54,
      'C.55 (Bandera)': totals.c55,
      'C.58 (T Cambio)': totals.c58,
      'C.59 (Sub)': Math.round(totals.c59),
      'C.66 (P Origen)': totals.c66,
      'C.70 (P Compra)': totals.c70,
      'C.71 (P.Bruto)': totals.c71,
      'C.72 (P.Neto)': totals.c72,
      'C.73 (Embalaje)': '',
      'C.74 (Bulto)': totals.c74,
      'C.77 (Cant.)': totals.c77,
      'C.78 (FOB)': totals.c78,
      'C.82 (Sum.G)': totals.c82,
      'C.134 (Levante)': '',
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Declaraciones DIM");
    
    // Download file
    XLSX.writeFile(workbook, `DIM_Reporte_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatNum = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatIntegerOnly = (n: number) => Math.round(n).toString();

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter']">
      <header className="bg-white border-b border-slate-200 px-8 h-16 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-sm font-black text-slate-800 tracking-tighter uppercase">Sistema DIM ZFSANTANDER DE LUISK</h1>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={handleExportExcel}
            disabled={history.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-30 disabled:grayscale uppercase tracking-wider"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar Excel
          </button>
          <div className="w-px h-6 bg-slate-200" />
          <button onClick={() => setHistory([])} className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors">Borrar Todo</button>
        </div>
      </header>

      <main className="p-8 space-y-8">
        {!history.length || doc ? (
          <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-4xl mx-auto transition-all">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 text-center">Nuevo Procesamiento</h2>
            <Uploader onFileSelect={handleFileSelect} isLoading={loading} />
            {doc && (
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded border border-slate-200 shadow-sm">
                    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                  </div>
                  <span className="text-sm font-bold text-slate-700 truncate max-w-[300px]">{doc.file.name}</span>
                </div>
                <button 
                  onClick={handleProcess}
                  disabled={loading}
                  className="bg-slate-900 text-white px-8 py-3 rounded-lg text-sm font-black hover:bg-slate-800 transition-all disabled:opacity-50 w-full md:w-auto shadow-md"
                >
                  {loading ? 'ANALIZANDO PDF...' : 'PROCESAR DOCUMENTO'}
                </button>
              </div>
            )}
          </section>
        ) : (
          <div className="flex justify-center">
            <button 
              onClick={() => setDoc({ file: {} as File, preview: "", base64: "", mimeType: "" })} 
              className="bg-indigo-600 text-white px-8 py-3 rounded-full text-xs font-black hover:bg-indigo-700 shadow-xl transition-all hover:-translate-y-1 uppercase tracking-widest"
            >
              + Añadir más documentos
            </button>
          </div>
        )}

        {error && <div className="max-w-4xl mx-auto p-4 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 animate-pulse">{error}</div>}

        <section className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] border-collapse min-w-[2000px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="px-6 py-5 text-left font-black uppercase tracking-wider sticky left-0 bg-slate-50 z-10 border-r">DOC / FORM</th>
                  <th className="px-2 py-5 text-center font-bold">C.42<br/><span className="text-[8px] opacity-70">(MANIFIESTO)</span></th>
                  <th className="px-2 py-5 text-center font-bold">C.44<br/><span className="text-[8px] opacity-70">(DOC T.)</span></th>
                  <th className="px-2 py-5 text-center font-bold">C.51<br/><span className="text-[8px] opacity-70">(FACT)</span></th>
                  <th className="px-2 py-5 text-center font-bold">C.54<br/><span className="text-[8px] opacity-70">(TRANS)</span></th>
                  <th className="px-2 py-5 text-center font-bold">C.55<br/><span className="text-[8px] opacity-70">(BANDERA)</span></th>
                  <th className="px-2 py-5 text-center font-bold">C.58<br/><span className="text-[8px] opacity-70">(T CAMBIO)</span></th>
                  <th className="px-2 py-5 text-center font-bold">C.59<br/><span className="text-[8px] opacity-70">(SUB)</span></th>
                  <th className="px-2 py-5 text-center font-bold">C.66<br/><span className="text-[8px] opacity-70">(P ORIGEN)</span></th>
                  <th className="px-2 py-5 text-center font-bold">C.70<br/><span className="text-[8px] opacity-70">(P COMPRA)</span></th>
                  <th className="px-2 py-5 text-center font-bold text-green-700">C.71<br/><span className="text-[8px] opacity-70">(P.BRUTO)</span></th>
                  <th className="px-2 py-5 text-center font-bold text-green-700">C.72<br/><span className="text-[8px] opacity-70">(P.NETO)</span></th>
                  <th className="px-2 py-5 text-center font-bold">C.73<br/><span className="text-[8px] opacity-70">(EMBALAJE)</span></th>
                  <th className="px-2 py-5 text-center font-bold">C.74<br/><span className="text-[8px] opacity-70">(BULTO)</span></th>
                  <th className="px-2 py-5 text-center font-bold">C.77<br/><span className="text-[8px] opacity-70">(CANT.)</span></th>
                  <th className="px-2 py-5 text-center font-bold text-green-700">C.78<br/><span className="text-[8px] opacity-70">(FOB)</span></th>
                  <th className="px-2 py-5 text-center font-bold text-green-700">C.82<br/><span className="text-[8px] opacity-70">(SUM.G)</span></th>
                  <th className="px-2 py-5 text-center font-bold">C.134<br/><span className="text-[8px] opacity-70">(LEVANTE)</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="py-24 text-center text-slate-300 font-medium text-sm">No hay datos procesados</td>
                  </tr>
                ) : (
                  <>
                    {history.map((row, i) => (
                      <tr key={i} className="hover:bg-indigo-50/40 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10 border-r group-hover:bg-indigo-50">
                          <div className="font-black text-slate-800">{row.docId}</div>
                          <div className="text-[9px] text-slate-400 font-medium truncate max-w-[150px]">{row.fileName}</div>
                        </td>
                        <td className="px-2 py-4 text-center text-slate-500 font-medium">{row.c42 || '---'}</td>
                        <td className="px-2 py-4 text-center text-slate-500 font-medium">{row.c44 || '---'}</td>
                        <td className="px-2 py-4 text-center text-slate-800 font-bold">{row.c51 || '---'}</td>
                        <td className="px-2 py-4 text-center text-slate-600 font-medium">{formatNum(row.c54)}</td>
                        <td className="px-2 py-4 text-center text-slate-600 font-medium">{formatNum(row.c55)}</td>
                        <td className="px-2 py-4 text-center text-slate-600 font-medium">{formatNum(row.c58)}</td>
                        <td className="px-2 py-4 text-center text-slate-600 font-medium">{formatIntegerOnly(row.c59)}</td>
                        <td className="px-2 py-4 text-center text-slate-600 font-medium">{formatNum(row.c66)}</td>
                        <td className="px-2 py-4 text-center text-slate-600 font-medium">{formatNum(row.c70)}</td>
                        <td className="px-2 py-4 text-center text-green-700 font-black">{formatNum(row.c71)}</td>
                        <td className="px-2 py-4 text-center text-green-700 font-black">{formatNum(row.c72)}</td>
                        <td className="px-2 py-4 text-center text-slate-800 font-bold">{row.c73 || '---'}</td>
                        <td className="px-2 py-4 text-center text-slate-600 font-medium">{formatNum(row.c74)}</td>
                        <td className="px-2 py-4 text-center text-slate-600 font-medium">{formatNum(row.c77)}</td>
                        <td className="px-2 py-4 text-center text-green-700 font-black">{formatNum(row.c78)}</td>
                        <td className="px-2 py-4 text-center text-green-700 font-black">{formatNum(row.c82)}</td>
                        <td className="px-2 py-4 text-center text-slate-800 font-bold">{row.c134 || '---'}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                      <td className="px-6 py-5 font-black text-slate-900 uppercase tracking-widest sticky left-0 bg-slate-100 z-10 border-r">TOTALES</td>
                      <td className="px-2 py-5 text-center text-slate-400 italic">---</td>
                      <td className="px-2 py-5 text-center text-slate-400 italic">---</td>
                      <td className="px-2 py-5 text-center text-slate-400 italic">---</td>
                      <td className="px-2 py-5 text-center text-slate-900">{formatNum(totals.c54)}</td>
                      <td className="px-2 py-5 text-center text-slate-900">{formatNum(totals.c55)}</td>
                      <td className="px-2 py-5 text-center text-slate-900">{formatNum(totals.c58)}</td>
                      <td className="px-2 py-5 text-center text-slate-900">{formatIntegerOnly(totals.c59)}</td>
                      <td className="px-2 py-5 text-center text-slate-900">{formatNum(totals.c66)}</td>
                      <td className="px-2 py-5 text-center text-slate-900">{formatNum(totals.c70)}</td>
                      <td className="px-2 py-5 text-center text-green-700 font-black">{formatNum(totals.c71)}</td>
                      <td className="px-2 py-5 text-center text-green-700 font-black">{formatNum(totals.c72)}</td>
                      <td className="px-2 py-5 text-center text-slate-400 italic">---</td>
                      <td className="px-2 py-5 text-center text-slate-900">{formatNum(totals.c74)}</td>
                      <td className="px-2 py-5 text-center text-slate-900">{formatNum(totals.c77)}</td>
                      <td className="px-2 py-5 text-center text-green-700 font-black">{formatNum(totals.c78)}</td>
                      <td className="px-2 py-5 text-center text-green-700 font-black">{formatNum(totals.c82)}</td>
                      <td className="px-2 py-5 text-center text-slate-400 italic">---</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 h-1 opacity-20 z-40"></div>
    </div>
  );
};

export default App;
