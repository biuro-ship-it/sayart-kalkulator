"use client";

import React, { useState, useEffect } from 'react';

// --- KOMPONENT KALKULATORA ---
const Calculator = ({ listwy = [] }: { listwy: any[] }) => {
  // 1. DANE TWOJEGO ZAKŁADU (Pojawiają się na wydruku)
  const [shopName, setShopName] = useState('Twoja Pracownia Opraw');
  const [shopAddress, setShopAddress] = useState('ul. Przykładowa 123, 00-000 Miasto');
  const [shopPhone, setShopPhone] = useState('+48 123 456 789');
  const [shopWeb, setShopWeb] = useState('www.twoja-strona.pl');
  const [shopEmail, setShopEmail] = useState('biuro@twoja-strona.pl');

  // 2. DANE ZLECENIA
  const [nrZlecenia, setNrZlecenia] = useState('1/2026');
  const [dataZlecenia, setDataZlecenia] = useState(new Date().toISOString().split('T')[0]);

  // 3. PARAMETRY KLIENTA
  const [wybranaListwaId, setWybranaListwaId] = useState('');
  const [typOprawy, setTypOprawy] = useState('rama'); 
  const [szerokosc, setSzerokosc] = useState('');
  const [wysokosc, setWysokosc] = useState('');
  const [rodzajOszklenia, setRodzajOszklenia] = useState('float');
  const [rodzajTylu, setRodzajTylu] = useState('hdf'); 
  const [uwagi, setUwagi] = useState('');

  const [maPassepartout, setMaPassepartout] = useState(false);
  const [marginesPp, setMarginesPp] = useState('5');
  const [cenaPpM2, setCenaPpM2] = useState('80');

  // 4. CENNIK WARSZTATOWY (Tylko do obliczeń)
  const [cenaSzkloFloat, setCenaSzkloFloat] = useState('60'); 
  const [cenaSzkloAnty, setCenaSzkloAnty] = useState('90');
  const [cenaPlexi, setCenaPlexi] = useState('120');
  const [cenaHdfM2, setCenaHdfM2] = useState('25');     
  const [cenaKartonTylM2, setCenaKartonTylM2] = useState('15');
  const [marzaProcent, setMarzaProcent] = useState('100'); 

  useEffect(() => {
    if (listwy.length > 0 && !wybranaListwaId) {
      setWybranaListwaId(listwy[0].id);
    }
  }, [listwy, wybranaListwaId]);

  const listwa = listwy.find((l) => l.id.toString() === wybranaListwaId.toString()) || listwy[0];

  // OBLICZENIA LOGICZNE
  let s_ramy = 0, w_ramy = 0, zuzycieMb = 0, poleM2 = 0, cenaDetaliczna = 0, kosztCalkowityHurt = 0;
  let nazwaOszklenia = "", nazwaTylu = "";

  if (listwa && szerokosc && wysokosc) {
    const s_obr = parseFloat(szerokosc), w_obr = parseFloat(wysokosc);
    if (!isNaN(s_obr) && !isNaN(w_obr)) {
      s_ramy = maPassepartout ? s_obr + (2 * parseFloat(marginesPp)) : s_obr;
      w_ramy = maPassepartout ? w_obr + (2 * parseFloat(marginesPp)) : w_obr;
      
      zuzycieMb = (2 * (s_ramy + w_ramy) + (8 * (listwa.szerokosc_mm / 10))) / 100;
      poleM2 = (s_ramy * w_ramy) / 10000;

      const cenaRama = typOprawy === 'rama' ? listwa.cena_zlozona_hurt : listwa.cena_mb_hurt;

      let cSzklo = 0;
      if (rodzajOszklenia === 'float') { cSzklo = parseFloat(cenaSzkloFloat); nazwaOszklenia = "Szkło Float"; }
      else if (rodzajOszklenia === 'szklo_anty') { cSzklo = parseFloat(cenaSzkloAnty); nazwaOszklenia = "Szkło Antyrefleks"; }
      else if (rodzajOszklenia === 'plexi') { cSzklo = parseFloat(cenaPlexi); nazwaOszklenia = "Plexi"; }
      else nazwaOszklenia = "Brak";

      let cTyl = 0;
      if (rodzajTylu === 'hdf') { cTyl = parseFloat(cenaHdfM2); nazwaTylu = "HDF"; }
      else if (rodzajTylu === 'karton') { cTyl = parseFloat(cenaKartonTylM2); nazwaTylu = "Karton"; }
      else nazwaTylu = "Brak";

      const kosztPp = maPassepartout ? poleM2 * parseFloat(cenaPpM2) : 0;
      kosztCalkowityHurt = (zuzycieMb * cenaRama) + (poleM2 * cSzklo) + (poleM2 * cTyl) + kosztPp;
      cenaDetaliczna = kosztCalkowityHurt * (1 + (parseFloat(marzaProcent) / 100));
    }
  }

  const handlePrint = () => window.print();
  const handleSms = () => {
    const msg = `Wycena nr ${nrZlecenia}: Rama ${listwa.kod}, ${szerokosc}x${wysokosc}cm. Do zaplaty: ${cenaDetaliczna.toFixed(2)}zl. Pozdrawiamy, ${shopName}`;
    window.location.href = `sms:?body=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-4">
      {/* 1. PARAMETRY (UKRYTE W DRUKU) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100 print:hidden shadow-sm">
        <div className="col-span-full flex justify-between items-center border-b border-blue-200 pb-2 mb-1 text-gray-800">
          <h4 className="font-bold text-blue-800 uppercase text-xs">1. Parametry zlecenia</h4>
          <div className="flex gap-2">
            <input type="text" className="p-1 text-xs font-bold border rounded w-20 text-center" value={nrZlecenia} onChange={e => setNrZlecenia(e.target.value)} />
            <input type="date" className="p-1 text-xs border rounded w-28 text-center" value={dataZlecenia} onChange={e => setDataZlecenia(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-500 mb-1">Listwa</label>
          <select className="p-2 text-sm rounded border bg-white text-gray-800" value={wybranaListwaId} onChange={e => setWybranaListwaId(e.target.value)}>
            {listwy.map((l) => <option key={l.id} value={l.id}>{l.kod} ({l.szerokosc_mm}mm)</option>)}
          </select>
        </div>
        <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-500 mb-1">Typ</label>
          <select className="p-2 text-sm rounded border bg-white text-gray-800" value={typOprawy} onChange={e => setTypOprawy(e.target.value)}><option value="rama">Rama</option><option value="listwa">Listwa</option></select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-500 mb-1">Szer. (cm)</label><input type="number" className="p-2 text-sm rounded border text-gray-800" value={szerokosc} onChange={e => setSzerokosc(e.target.value)} /></div>
          <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-500 mb-1">Wys. (cm)</label><input type="number" className="p-2 text-sm rounded border text-gray-800" value={wysokosc} onChange={e => setWysokosc(e.target.value)} /></div>
        </div>
        <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-500 mb-1">Oszklenie</label>
          <select className="p-2 text-sm rounded border bg-white text-gray-800" value={rodzajOszklenia} onChange={e => setRodzajOszklenia(e.target.value)}><option value="float">Float</option><option value="szklo_anty">Antyrefleks</option><option value="plexi">Plexi</option><option value="brak">Brak</option></select>
        </div>
        <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-500 mb-1">Tył</label>
          <select className="p-2 text-sm rounded border bg-white text-gray-800" value={rodzajTylu} onChange={e => setRodzajTylu(e.target.value)}><option value="hdf">HDF</option><option value="karton">Karton</option><option value="brak">Brak</option></select>
        </div>
        <div className="col-span-full"><label className="text-[10px] font-bold text-gray-500 mb-1">Uwagi klienta</label>
          <textarea className="w-full p-2 text-sm rounded border text-gray-800" rows={2} value={uwagi} onChange={e => setUwagi(e.target.value)} />
        </div>
      </div>

      <div className="p-3 rounded-xl border bg-gray-50 print:hidden text-gray-800 flex items-center cursor-pointer" onClick={() => setMaPassepartout(!maPassepartout)}>
        <input type="checkbox" className="mr-2 h-4 w-4" checked={maPassepartout} readOnly /> <span className="text-xs font-bold uppercase">Dodaj Passe-partout</span>
      </div>

      {/* 2. USTAWIENIA WARSZTATU (UKRYTE W DRUKU) */}
      <details className="group print:hidden text-gray-800">
        <summary className="cursor-pointer p-3 rounded-xl bg-gray-100 border text-xs font-bold uppercase">⚙️ Ustawienia warsztatu i cen</summary>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-t bg-white rounded-b-xl shadow-inner">
          <div className="flex flex-col col-span-2"><label className="text-[10px] font-bold">Nazwa Firmy</label><input className="p-1 border rounded text-xs" value={shopName} onChange={e => setShopName(e.target.value)} /></div>
          <div className="flex flex-col col-span-2"><label className="text-[10px] font-bold">Adres</label><input className="p-1 border rounded text-xs" value={shopAddress} onChange={e => setShopAddress(e.target.value)} /></div>
          <div className="flex flex-col"><label className="text-[10px] font-bold">Tel</label><input className="p-1 border rounded text-xs" value={shopPhone} onChange={e => setShopPhone(e.target.value)} /></div>
          <div className="flex flex-col"><label className="text-[10px] font-bold">WWW</label><input className="p-1 border rounded text-xs" value={shopWeb} onChange={e => setShopWeb(e.target.value)} /></div>
          <div className="flex flex-col text-blue-700 font-bold"><label className="text-[10px] uppercase">Marża %</label><input type="number" className="p-1 border-2 border-blue-200 rounded text-xs" value={marzaProcent} onChange={e => setMarzaProcent(e.target.value)} /></div>
        </div>
      </details>

      {/* 3. WIDOK PODSUMOWANIA I DRUKU */}
      {zuzycieMb > 0 && (
        <div className="mt-4 pt-4 border-t-2 text-gray-900">
          
          {/* Nagłówek wydruku (Tylko Twój Zakład) */}
          <div className="hidden print:flex flex-col mb-6 border-b-4 border-black pb-4">
            <h2 className="text-3xl font-black uppercase leading-tight">{shopName}</h2>
            <p className="text-sm font-bold text-gray-700">{shopAddress}</p>
            <p className="text-xs text-gray-500">Tel: {shopPhone} | {shopWeb} | {shopEmail}</p>
            <div className="mt-4 text-right"><h3 className="text-xl font-black uppercase">Potwierdzenie oprawy nr {nrZlecenia}</h3><p className="text-xs font-bold text-gray-400">Data: {dataZlecenia}</p></div>
          </div>

          <div className="mb-4 p-4 border rounded-2xl bg-yellow-50 print:bg-white print:border-2 print:border-black shadow-sm">
            <span className="block text-[10px] font-bold uppercase text-gray-500 print:text-black">Wymiar ramy (roboczy):</span>
            <span className="text-2xl font-black">{s_ramy} x {w_ramy} cm</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1">
            <div className="text-sm space-y-1">
              <p className="font-bold border-b pb-1 text-[10px] uppercase tracking-widest text-gray-400 print:text-black">Specyfikacja:</p>
              <div className="flex justify-between py-1"><span>Wybrana listwa:</span><span className="font-bold">{listwa.kod}</span></div>
              <div className="flex justify-between py-1 border-t border-gray-100"><span>Format obrazu:</span><span className="font-bold">{szerokosc} x {wysokosc} cm</span></div>
              <div className="flex justify-between py-1 border-t border-gray-100"><span>Oszklenie:</span><span className="font-bold">{nazwaOszklenia}</span></div>
              <div className="flex justify-between py-1 border-t border-gray-100"><span>Tył:</span><span className="font-bold">{nazwaTylu}</span></div>
              {maPassepartout && <div className="flex justify-between py-1 border-t border-gray-100"><span>Passe-partout:</span><span className="font-bold">TAK ({marginesPp} cm)</span></div>}
              {uwagi && <div className="mt-4 p-3 bg-gray-50 border-l-4 border-gray-300 italic text-xs print:border-black">Uwagi: {uwagi}</div>}
            </div>

            <div className="p-8 bg-green-600 rounded-3xl text-white flex flex-col items-center justify-center shadow-lg print:bg-white print:text-black print:border-4 print:border-black print:shadow-none print:rounded-none">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Do zapłaty (brutto):</p>
              <p className="text-6xl font-black my-2">{cenaDetaliczna.toFixed(2)} zł</p>
            </div>
          </div>

          {/* Przyciski ekranowe */}
          <div className="mt-8 flex gap-3 print:hidden">
            <button onClick={handlePrint} className="flex-1 bg-blue-700 text-white font-bold p-4 rounded-2xl hover:bg-blue-800 transition shadow-lg active:scale-95">📄 DRUKUJ PDF</button>
            <button onClick={handleSms} className="flex-1 bg-green-500 text-white font-bold p-4 rounded-2xl hover:bg-green-600 transition shadow-lg active:scale-95">📱 WYŚLIJ SMS</button>
          </div>

          {/* ODCINEK DLA KLIENTA (TYLKO WYDRUK) */}
          <div className="hidden print:block mt-32 border-t-2 border-dashed border-black pt-10 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-6 text-2xl">✂️</div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-blue-900 uppercase leading-none">{shopName}</h3>
                <p className="text-sm font-bold mt-1">POTWIERDZENIE ODBIORU ZLECENIA NR {nrZlecenia}</p>
                <p className="text-xs text-gray-500 mt-2">Data przyjęcia: {dataZlecenia}</p>
                <div className="mt-6 text-[10px] space-y-0.5">
                   <p>{shopAddress}</p>
                   <p>Telefon: {shopPhone}</p>
                   <p>{shopEmail}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="border-4 border-black p-4 inline-block mb-4">
                  <p className="text-[10px] font-bold uppercase mb-1">Cena końcowa:</p>
                  <p className="text-4xl font-black">{cenaDetaliczna.toFixed(2)} zł</p>
                </div>
                <div className="mt-6 border-t border-gray-300 pt-1 w-48 ml-auto text-center">
                  <p className="text-[8px] uppercase text-gray-400">Podpis ramiarza</p>
                </div>
              </div>
            </div>
            <p className="mt-12 text-[9px] text-center uppercase tracking-widest font-bold">Dziękujemy za zlecenie! Prosimy o zachowanie tego odcinka przy odbiorze pracy.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  // Przykładowe dane w przypadku braku połączenia z bazą
  const listwyDemo = [
    { id: 1, kod: 'SY-001', szerokosc_mm: 30, cena_mb_hurt: 15.0, cena_zlozona_hurt: 25.0 },
    { id: 2, kod: 'SY-002', szerokosc_mm: 45, cena_mb_hurt: 22.0, cena_zlozona_hurt: 35.0 },
    { id: 3, kod: 'ALU-10', szerokosc_mm: 20, cena_mb_hurt: 12.0, cena_zlozona_hurt: 18.0 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 print:bg-white print:p-0">
      {/* Wstrzykiwanie bezpiecznych stylów CSS dla druku */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 0.5cm; }
          body { -webkit-print-color-adjust: exact; background: white !important; }
          header, footer, details, .print\\:hidden { display: none !important; }
          .max-w-2xl { max-width: 100% !important; }
        }
      `}} />
      
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:max-w-full">
        {/* NAGŁÓWEK EKRANOWY */}
        <header className="bg-gradient-to-r from-blue-800 to-blue-900 p-6 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3">
             <div className="bg-white p-1 rounded-md shadow-inner">
                <img src="sayart-logo-1551950478.jpg" alt="Sayart" className="h-8 w-auto object-contain" onError={e => (e.currentTarget.style.display='none')} />
             </div>
             <div>
                <h1 className="text-xl font-black uppercase tracking-tighter leading-none">Panel Ramiarza</h1>
                <span className="text-[9px] opacity-60 font-bold uppercase">System Wycen v1.9.2</span>
             </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="bg-blue-700/50 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-white/10">Warsztat Online</span>
          </div>
        </header>

        <div className="p-6 print:p-0">
          <Calculator listwy={listwyDemo} />
        </div>
      </div>
    </div>
  );
}