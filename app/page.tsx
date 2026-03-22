"use client";

import React, { useState, useEffect } from 'react';

// --- KOMPONENT KALKULATORA (Logika i Formularze) ---
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
  const [typOprawy, setTypOprawy] = useState('rama'); // 'rama' = W oprawie, 'listwa' = Z metra
  const [szerokosc, setSzerokosc] = useState('');
  const [wysokosc, setWysokosc] = useState('');
  const [rodzajOszklenia, setRodzajOszklenia] = useState('float');
  const [rodzajTylu, setRodzajTylu] = useState('hdf'); 
  const [uwagi, setUwagi] = useState('');

  const [maPassepartout, setMaPassepartout] = useState(false);
  const [marginesPp, setMarginesPp] = useState('5');
  const [cenaPpM2, setCenaPpM2] = useState('80');

  // 4. CENNIK I INDYWIDUALNE MARŻE (%)
  const [cenaSzkloFloat, setCenaSzkloFloat] = useState('60'); 
  const [cenaSzkloAnty, setCenaSzkloAnty] = useState('90');
  const [cenaPlexi, setCenaPlexi] = useState('120');
  const [cenaHdfM2, setCenaHdfM2] = useState('25');     
  const [cenaKartonTylM2, setCenaKartonTylM2] = useState('15');

  const [marzaListwaRama, setMarzaListwaRama] = useState('100');
  const [marzaListwaMetr, setMarzaListwaMetr] = useState('150');
  
  const [marzaSzklo, setMarzaSzklo] = useState('150');
  const [marzaTyl, setMarzaTyl] = useState('150');
  const [marzaPp, setMarzaPp] = useState('150');

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

      // Logika wybrana przez użytkownika: W oprawie (rama_złożona) vs Z metra (cena_mb)
      const cenaHurtRamaElement = typOprawy === 'rama' ? listwa.cena_zlozona_hurt : listwa.cena_mb_hurt;
      const marzaDlaListwy = typOprawy === 'rama' ? parseFloat(marzaListwaRama) : parseFloat(marzaListwaMetr);
      
      const kosztHurtRama = zuzycieMb * cenaHurtRamaElement;

      let cSzkloHurt = 0;
      if (rodzajOszklenia === 'float') { cSzkloHurt = parseFloat(cenaSzkloFloat); nazwaOszklenia = "Szkło Float"; }
      else if (rodzajOszklenia === 'szklo_anty') { cSzkloHurt = parseFloat(cenaSzkloAnty); nazwaOszklenia = "Szkło Antyrefleks"; }
      else if (rodzajOszklenia === 'plexi') { cSzkloHurt = parseFloat(cenaPlexi); nazwaOszklenia = "Plexi"; }
      else nazwaOszklenia = "Brak";
      const kosztHurtSzklo = poleM2 * cSzkloHurt;

      let cTylHurt = 0;
      if (rodzajTylu === 'hdf') { cTylHurt = parseFloat(cenaHdfM2); nazwaTylu = "HDF"; }
      else if (rodzajTylu === 'karton') { cTylHurt = parseFloat(cenaKartonTylM2); nazwaTylu = "Karton"; }
      else nazwaTylu = "Brak";
      const kosztHurtTyl = poleM2 * cTylHurt;

      const kosztHurtPp = maPassepartout ? poleM2 * parseFloat(cenaPpM2) : 0;
      
      kosztCalkowityHurt = kosztHurtRama + kosztHurtSzklo + kosztHurtTyl + kosztHurtPp;

      const cenaDetalRama = kosztHurtRama * (1 + marzaDlaListwy / 100);
      const cenaDetalSzklo = kosztHurtSzklo * (1 + parseFloat(marzaSzklo) / 100);
      const cenaDetalTyl = kosztHurtTyl * (1 + parseFloat(marzaTyl) / 100);
      const cenaDetalPp = kosztHurtPp * (1 + parseFloat(marzaPp) / 100);

      cenaDetaliczna = cenaDetalRama + cenaDetalSzklo + cenaDetalTyl + cenaDetalPp;
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
            <input type="text" className="p-1 text-xs font-bold border rounded w-20 text-center shadow-sm" value={nrZlecenia} onChange={e => setNrZlecenia(e.target.value)} title="Nr zlecenia" />
            <input type="date" className="p-1 text-xs border rounded w-28 text-center shadow-sm" value={dataZlecenia} onChange={e => setDataZlecenia(e.target.value)} title="Data" />
          </div>
        </div>
        <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Listwa</label>
          <select className="p-2 text-sm rounded border bg-white text-gray-800 shadow-sm" value={wybranaListwaId} onChange={e => setWybranaListwaId(e.target.value)}>
            {listwy.map((l) => <option key={l.id} value={l.id}>{l.kod} ({l.szerokosc_mm}mm)</option>)}
          </select>
        </div>
        <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Typ oprawy</label>
          <select className="p-2 text-sm rounded border bg-white text-gray-800 shadow-sm" value={typOprawy} onChange={e => setTypOprawy(e.target.value)}>
            <option value="rama">W oprawie</option>
            <option value="listwa">Z metra</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Szer. (cm)</label><input type="number" className="p-2 text-sm rounded border text-gray-800 shadow-sm" value={szerokosc} onChange={e => setSzerokosc(e.target.value)} /></div>
          <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Wys. (cm)</label><input type="number" className="p-2 text-sm rounded border text-gray-800 shadow-sm" value={wysokosc} onChange={e => setWysokosc(e.target.value)} /></div>
        </div>
        <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Oszklenie</label>
          <select className="p-2 text-sm rounded border bg-white text-gray-800 shadow-sm" value={rodzajOszklenia} onChange={e => setRodzajOszklenia(e.target.value)}><option value="float">Float</option><option value="szklo_anty">Antyrefleks</option><option value="plexi">Plexi</option><option value="brak">Brak</option></select>
        </div>
        <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Tył</label>
          <select className="p-2 text-sm rounded border bg-white text-gray-800 shadow-sm" value={rodzajTylu} onChange={e => setRodzajTylu(e.target.value)}><option value="hdf">HDF</option><option value="karton">Karton</option><option value="brak">Brak</option></select>
        </div>
        <div className="col-span-full"><label className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Uwagi klienta</label>
          <textarea className="w-full p-2 text-sm rounded border text-gray-800 shadow-sm" rows={2} value={uwagi} onChange={e => setUwagi(e.target.value)} />
        </div>
      </div>

      <div className={`p-3 rounded-xl border flex items-center cursor-pointer print:hidden transition-colors ${maPassepartout ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`} onClick={() => setMaPassepartout(!maPassepartout)}>
        <input type="checkbox" className="mr-2 h-4 w-4 accent-amber-600" checked={maPassepartout} readOnly /> <span className="text-xs font-bold uppercase text-gray-700">Dodaj Passe-partout (+{marginesPp}cm)</span>
      </div>

      {/* 2. USTAWIENIA WARSZTATU I CEN (UKRYTE W DRUKU) */}
      <details className="group print:hidden text-gray-800 shadow-sm rounded-xl">
        <summary className="cursor-pointer p-3 rounded-xl bg-gray-100 border text-xs font-bold uppercase flex justify-between items-center hover:bg-gray-200 transition-colors">
          <span>⚙️ Ustawienia warsztatu i marż</span>
          <span className="text-[10px] opacity-50 font-normal">Kliknij aby edytować</span>
        </summary>
        <div className="p-4 bg-white border-x border-b rounded-b-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-full font-bold text-gray-400 text-[10px] uppercase border-b pb-1">Dane Twojego Zakładu</div>
            <div className="flex flex-col col-span-2"><label className="text-[10px] font-bold text-gray-500">Nazwa Firmy</label><input className="p-1 border rounded text-xs" value={shopName} onChange={e => setShopName(e.target.value)} /></div>
            <div className="flex flex-col col-span-2"><label className="text-[10px] font-bold text-gray-500">Adres</label><input className="p-1 border rounded text-xs" value={shopAddress} onChange={e => setShopAddress(e.target.value)} /></div>
            <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-500">Tel</label><input className="p-1 border rounded text-xs" value={shopPhone} onChange={e => setShopPhone(e.target.value)} /></div>
            <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-500">Email</label><input className="p-1 border rounded text-xs" value={shopEmail} onChange={e => setShopEmail(e.target.value)} /></div>
            <div className="flex flex-col col-span-2"><label className="text-[10px] font-bold text-gray-500">WWW</label><input className="p-1 border rounded text-xs" value={shopWeb} onChange={e => setShopWeb(e.target.value)} /></div>
          </div>

          <div className="space-y-4">
             <div className="col-span-full font-bold text-gray-400 text-[10px] uppercase border-b pb-1">Cennik materiałów i marże komponentów</div>
             
             <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
               <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                 <p className="text-[9px] font-bold text-blue-800 uppercase mb-1">Marża Listwy</p>
                 <div className="grid grid-cols-2 gap-1">
                   <div className="flex flex-col"><label className="text-[8px] text-gray-500 uppercase">W oprawie %</label><input type="number" className="p-0.5 border rounded text-[10px] font-bold" value={marzaListwaRama} onChange={e => setMarzaListwaRama(e.target.value)} /></div>
                   <div className="flex flex-col"><label className="text-[8px] text-gray-500 uppercase">Z metra %</label><input type="number" className="p-0.5 border rounded text-[10px] font-bold" value={marzaListwaMetr} onChange={e => setMarzaListwaMetr(e.target.value)} /></div>
                 </div>
               </div>

               <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                 <p className="text-[9px] font-bold text-gray-800 uppercase mb-1">Oszklenie</p>
                 <div className="grid grid-cols-2 gap-1 mb-1">
                   <div className="flex flex-col"><label className="text-[8px] text-gray-500">Float</label><input type="number" className="p-0.5 border rounded text-[10px]" value={cenaSzkloFloat} onChange={e => setCenaSzkloFloat(e.target.value)} /></div>
                   <div className="flex flex-col"><label className="text-[8px] text-gray-500">Antyref.</label><input type="number" className="p-0.5 border rounded text-[10px]" value={cenaSzkloAnty} onChange={e => setCenaSzkloAnty(e.target.value)} /></div>
                   <div className="flex flex-col"><label className="text-[8px] text-gray-500">Plexi</label><input type="number" className="p-0.5 border rounded text-[10px]" value={cenaPlexi} onChange={e => setCenaPlexi(e.target.value)} /></div>
                 </div>
                 <div className="flex flex-col border-t pt-1"><label className="text-[10px] text-gray-500 font-bold">Marża %</label><input type="number" className="p-0.5 border rounded text-[10px] font-bold text-blue-700" value={marzaSzklo} onChange={e => setMarzaSzklo(e.target.value)} /></div>
               </div>

               <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                 <p className="text-[9px] font-bold text-gray-800 uppercase mb-1">Tyły</p>
                 <div className="grid grid-cols-2 gap-1 mb-1">
                   <div className="flex flex-col"><label className="text-[8px] text-gray-500">HDF</label><input type="number" className="p-0.5 border rounded text-[10px]" value={cenaHdfM2} onChange={e => setCenaHdfM2(e.target.value)} /></div>
                   <div className="flex flex-col"><label className="text-[8px] text-gray-500">Karton</label><input type="number" className="p-0.5 border rounded text-[10px]" value={cenaKartonTylM2} onChange={e => setCenaKartonTylM2(e.target.value)} /></div>
                 </div>
                 <div className="flex flex-col border-t pt-1"><label className="text-[10px] text-gray-500 font-bold">Marża %</label><input type="number" className="p-0.5 border rounded text-[10px] font-bold text-blue-700" value={marzaTyl} onChange={e => setMarzaTyl(e.target.value)} /></div>
               </div>
             </div>
          </div>
        </div>
      </details>

      {/* 3. WIDOK PODSUMOWANIA I DRUKU */}
      {zuzycieMb > 0 && (
        <div className="mt-2 pt-2 border-t-2 text-gray-900 animate-in fade-in duration-300">
          
          <div className="hidden print:flex flex-col mb-8 border-b-4 border-black pb-4">
            <h2 className="text-3xl font-black uppercase leading-tight">{shopName}</h2>
            <p className="text-sm font-bold text-gray-700">{shopAddress}</p>
            <p className="text-xs text-gray-500">Tel: {shopPhone} | {shopWeb}</p>
            <div className="mt-4 text-right border-t-2 border-black/10 pt-2">
               <h3 className="text-xl font-black uppercase">POTWIERDZENIE ZLECENIA NR {nrZlecenia}</h3>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Data: {dataZlecenia}</p>
            </div>
          </div>

          <div className="mb-3 p-3 border rounded-2xl bg-yellow-50 print:bg-white print:border-2 print:border-black shadow-sm flex items-center">
            <div className="mr-3 text-xl print:hidden">📏</div>
            <div>
              <span className="block text-[9px] font-bold uppercase text-gray-500 print:text-black">Wymiar zewnętrzny ramy (roboczy):</span>
              <span className="text-xl font-black">{s_ramy} x {w_ramy} cm</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1">
            <div className="text-sm space-y-0.5">
              <p className="font-bold border-b pb-1 text-[9px] uppercase tracking-widest text-gray-400 print:text-black print:mb-2">Specyfikacja:</p>
              <div className="flex justify-between py-1"><span>Typ usługi:</span><span className="font-bold">{typOprawy === 'rama' ? 'W oprawie' : 'Z metra'}</span></div>
              <div className="flex justify-between py-1 border-t border-gray-100"><span>Model listwy:</span><span className="font-bold">{listwa.kod} ({listwa.szerokosc_mm}mm)</span></div>
              <div className="flex justify-between py-1 border-t border-gray-100"><span>Format obrazu:</span><span className="font-bold">{szerokosc} x {wysokosc} cm</span></div>
              <div className="flex justify-between py-1 border-t border-gray-100"><span>Oszklenie:</span><span className="font-bold">{nazwaOszklenia}</span></div>
              <div className="flex justify-between py-1 border-t border-gray-100"><span>Tył:</span><span className="font-bold">{nazwaTylu}</span></div>
              {maPassepartout && <div className="flex justify-between py-1 border-t border-gray-100"><span>Passe-partout:</span><span className="font-bold">TAK (+{marginesPp} cm)</span></div>}
              {uwagi && <div className="mt-3 p-2 bg-gray-50 border-l-4 border-gray-300 italic text-xs print:border-black print:bg-gray-50"><strong>Uwagi:</strong> {uwagi}</div>}
            </div>

            <div className="p-7 bg-green-600 rounded-2xl text-white flex flex-col items-center justify-center shadow-lg print:bg-white print:text-black print:border-4 print:border-black print:shadow-none print:rounded-xl">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 print:opacity-100 print:text-green-700">DO ZAPŁATY (BRUTTO):</p>
              <p className="text-5xl font-black my-1 print:text-6xl">{cenaDetaliczna.toFixed(2)} zł</p>
              <div className="hidden print:block w-full border-t border-black/10 mt-3 pt-1 text-center text-[9px] font-bold uppercase italic">
                 Status płatności: .......................................
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 print:hidden">
            <button onClick={handlePrint} className="flex-1 bg-blue-700 text-white font-bold p-3.5 rounded-2xl hover:bg-blue-800 transition shadow-lg active:scale-95">📄 GENERUJ PDF DLA KLIENTA</button>
            <button onClick={handleSms} className="flex-1 bg-green-500 text-white font-bold p-3.5 rounded-2xl hover:bg-green-600 transition shadow-lg active:scale-95">📱 WYŚLIJ WYCENĘ SMS</button>
          </div>

          <div className="hidden print:block mt-24 border-t-2 border-dashed border-black pt-10 relative">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white px-6 text-2xl">✂️</div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-blue-900 uppercase leading-none">{shopName}</h3>
                <p className="text-sm font-bold mt-1 uppercase tracking-tight">POTWIERDZENIE ODBIORU NR {nrZlecenia}</p>
                <div className="mt-8 text-[10px] space-y-0.5 text-gray-600 uppercase font-bold">
                   <p>{shopAddress}</p>
                   <p>Tel: {shopPhone} | {shopEmail}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="border-4 border-black p-4 inline-block mb-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase mb-1">Suma końcowa:</p>
                  <p className="text-5xl font-black">{cenaDetaliczna.toFixed(2)} zł</p>
                </div>
                <div className="mt-6 border-t-2 border-black/20 pt-1 w-48 ml-auto text-center">
                  <p className="text-[8px] uppercase text-gray-400 font-bold">Pieczątka i podpis ramiarza</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- GŁÓWNA STRONA (APP) ---
export default function App() {
  const listwyDemo = [
    { id: 1, kod: 'SY-001', szerokosc_mm: 30, cena_mb_hurt: 15.0, cena_zlozona_hurt: 25.0 },
    { id: 2, kod: 'SY-002', szerokosc_mm: 45, cena_mb_hurt: 22.0, cena_zlozona_hurt: 35.0 },
    { id: 3, kod: 'ALU-10', szerokosc_mm: 20, cena_mb_hurt: 12.0, cena_zlozona_hurt: 18.0 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 print:bg-white print:p-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 0.5cm; }
          body { -webkit-print-color-adjust: exact; background: white !important; }
          header, footer, details, .print-hidden, .print\\:hidden { display: none !important; }
          .max-w-2xl { max-width: 100% !important; }
        }
      `}} />
      
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:max-w-full print:rounded-none">
        <header className="bg-gradient-to-r from-blue-800 to-blue-900 p-6 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-3">
             <div className="bg-white p-1 rounded-md shadow-inner">
                <img src="sayart-logo-1551950478.jpg" alt="Sayart" className="h-8 w-auto object-contain" onError={e => (e.currentTarget.style.display='none')} />
             </div>
             <div>
                <h1 className="text-xl font-black uppercase tracking-tighter leading-none">Panel Ramiarza</h1>
                <span className="text-[9px] opacity-60 font-bold uppercase">System Wycen v1.9.8</span>
             </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="bg-blue-700/50 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-white/10 shadow-sm">Warsztat Online</span>
          </div>
        </header>

        <div className="p-6 print:p-4">
          <Calculator listwy={listwyDemo} />
          
          <details className="mt-12 group print:hidden text-gray-800 border rounded-xl overflow-hidden shadow-sm">
            <summary className="cursor-pointer p-4 bg-gray-50 border-b font-bold text-sm flex justify-between items-center hover:bg-gray-100 transition-colors">
              <span>📋 Baza materiałowa listew</span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest group-open:hidden">Pokaż listę</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hidden group-open:inline">Ukryj</span>
            </summary>
            <div className="p-4 overflow-x-auto bg-white">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 border-b text-left">
                    <th className="py-2">KOD</th>
                    <th className="py-2 text-center">SZER.</th>
                    <th className="py-2 text-right">MB (HURT)</th>
                    <th className="py-2 text-right">RAMA (HURT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listwyDemo.map((l) => (
                    <tr key={l.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-3 font-bold text-blue-700">{l.kod}</td>
                      <td className="py-3 text-center">{l.szerokosc_mm} mm</td>
                      <td className="py-3 text-right">{l.cena_mb_hurt.toFixed(2)} zł</td>
                      <td className="py-3 text-right">{l.cena_zlozona_hurt.toFixed(2)} zł</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>

        <footer className="bg-gray-50 p-6 text-center text-[10px] text-gray-400 uppercase font-bold border-t print:hidden">
          © 2026 Kalkulator Ramiarski • Engine by Sayart Supply
        </footer>
      </div>
    </div>
  );
}