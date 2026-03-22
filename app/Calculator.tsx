"use client";

import { useState } from 'react';

export default function Calculator({ listwy }: { listwy: any[] }) {
  // 1. ZAMÓWIENIE KLIENTA
  const [wybranaListwaId, setWybranaListwaId] = useState(listwy[0]?.id || '');
  const [typOprawy, setTypOprawy] = useState('rama'); // 'rama' lub 'listwa'
  const [szerokosc, setSzerokosc] = useState('');
  const [wysokosc, setWysokosc] = useState('');
  const [rodzajOszklenia, setRodzajOszklenia] = useState('float');

  // Passe-partout
  const [maPassepartout, setMaPassepartout] = useState(false);
  const [marginesPp, setMarginesPp] = useState('5');
  const [cenaPpM2, setCenaPpM2] = useState('80');

  // 2. CENNIK MATERIAŁÓW RAMIARZA
  const [cenaSzkloFloat, setCenaSzkloFloat] = useState('60'); 
  const [cenaSzkloAnty, setCenaSzkloAnty] = useState('90');
  const [cenaPlexi, setCenaPlexi] = useState('120');
  const [cenaHdfM2, setCenaHdfM2] = useState('25');     
  const [marzaProcent, setMarzaProcent] = useState('100'); 

  const listwa = listwy.find((l) => l.id.toString() === wybranaListwaId.toString());

  // Zmienne wynikowe
  let zuzycieMb = 0;
  let poleM2 = 0;
  let s_ramy = 0; 
  let w_ramy = 0; 
  
  let kosztHurtRama = 0;
  let kosztHurtOszklenie = 0;
  let kosztHurtHdf = 0;
  let kosztHurtPp = 0;
  
  let nazwaOszklenia = "";
  let nazwaOprawy = "";
  let kosztCalkowityHurt = 0;
  let cenaDetaliczna = 0;

  if (listwa && szerokosc && wysokosc) {
    const s_obrazu = parseFloat(szerokosc);
    const w_obrazu = parseFloat(wysokosc);
    const hdfM2 = parseFloat(cenaHdfM2) || 0;
    const marza = parseFloat(marzaProcent) || 0;

    if (!isNaN(s_obrazu) && !isNaN(w_obrazu)) {
      
      // LOGIKA PASSE-PARTOUT
      if (maPassepartout) {
        const margines = parseFloat(marginesPp) || 0;
        s_ramy = s_obrazu + (2 * margines);
        w_ramy = w_obrazu + (2 * margines);
      } else {
        s_ramy = s_obrazu;
        w_ramy = w_obrazu;
      }

      // RAMA / LISTWA - Obliczanie zużycia
      const listwaSzerCm = listwa.szerokosc_mm / 10;
      const zuzycieCm = 2 * (s_ramy + w_ramy) + (8 * listwaSzerCm);
      zuzycieMb = zuzycieCm / 100;

      // Wybór ceny na podstawie typu oprawy
      if (typOprawy === 'rama') {
        kosztHurtRama = zuzycieMb * listwa.cena_zlozona_hurt;
        nazwaOprawy = "Rama złożona";
      } else {
        kosztHurtRama = zuzycieMb * listwa.cena_mb_hurt;
        nazwaOprawy = "Listwa (z metra)";
      }

      // POWIERZCHNIA M2 (do szkła, pleców i PP)
      poleM2 = (s_ramy * w_ramy) / 10000;

      // OSZKLENIE - dobieramy cenę na podstawie wyboru z listy
      let cenaOszkleniaM2 = 0;
      if (rodzajOszklenia === 'float') { 
        cenaOszkleniaM2 = parseFloat(cenaSzkloFloat) || 0; 
        nazwaOszklenia = "Szkło Float"; 
      }
      else if (rodzajOszklenia === 'szklo_anty') { 
        cenaOszkleniaM2 = parseFloat(cenaSzkloAnty) || 0; 
        nazwaOszklenia = "Szkło Antyrefleks"; 
      }
      else if (rodzajOszklenia === 'plexi') { 
        cenaOszkleniaM2 = parseFloat(cenaPlexi) || 0; 
        nazwaOszklenia = "Plexi"; 
      }
      else if (rodzajOszklenia === 'brak') { 
        cenaOszkleniaM2 = 0; 
        nazwaOszklenia = "Bez oszklenia"; 
      }

      kosztHurtOszklenie = poleM2 * cenaOszkleniaM2;

      // PLECY HDF
      kosztHurtHdf = poleM2 * hdfM2;

      // PASSE-PARTOUT
      if (maPassepartout) {
        const ppM2 = parseFloat(cenaPpM2) || 0;
        kosztHurtPp = poleM2 * ppM2;
      }

      // PODSUMOWANIE
      kosztCalkowityHurt = kosztHurtRama + kosztHurtOszklenie + kosztHurtHdf + kosztHurtPp;
      cenaDetaliczna = kosztCalkowityHurt * (1 + (marza / 100));
    }
  }

  return (
    <div className="mb-4">
      
      {/* SEKCJA 1: WYMIARY I LISTWA */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 bg-blue-50 p-4 rounded">
        <div className="md:col-span-3 lg:col-span-5 border-b border-blue-200 pb-2 mb-2">
          <h4 className="font-bold text-blue-800 uppercase text-sm tracking-wider">1. Obraz i Rama</h4>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wybierz listwę</label>
          <select 
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white"
            value={wybranaListwaId}
            onChange={(e) => setWybranaListwaId(e.target.value)}
          >
            {listwy.map((l) => (
              <option key={l.id} value={l.id}>{l.kod} ({l.szerokosc_mm}mm)</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rodzaj oprawy</label>
          <select 
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white"
            value={typOprawy}
            onChange={(e) => setTypOprawy(e.target.value)}
          >
            <option value="rama">Rama (Złożona)</option>
            <option value="listwa">Listwa (Z metra)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Szerokość (cm)</label>
          <input 
            type="number" 
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            placeholder="np. 50"
            value={szerokosc}
            onChange={(e) => setSzerokosc(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wysokość (cm)</label>
          <input 
            type="number" 
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            placeholder="np. 70"
            value={wysokosc}
            onChange={(e) => setWysokosc(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rodzaj Oszklenia</label>
          <select 
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white"
            value={rodzajOszklenia}
            onChange={(e) => setRodzajOszklenia(e.target.value)}
          >
            <option value="float">Szkło Float</option>
            <option value="szklo_anty">Szkło Antyrefleks</option>
            <option value="plexi">Plexi</option>
            <option value="brak">Brak oszklenia</option>
          </select>
        </div>
      </div>

      {/* SEKCJA 2: PASSE-PARTOUT */}
      <div className={`mb-6 p-4 rounded border transition-colors ${maPassepartout ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center mb-1">
          <input 
            type="checkbox" 
            id="dodajPp"
            className="w-5 h-5 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
            checked={maPassepartout}
            onChange={(e) => setMaPassepartout(e.target.checked)}
          />
          <label htmlFor="dodajPp" className="ml-2 font-bold text-gray-800 cursor-pointer uppercase text-sm tracking-wider">
            2. Dodaj Passe-partout
          </label>
        </div>

        {maPassepartout && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-amber-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Margines z każdej strony (cm)</label>
              <input 
                type="number" 
                className="w-full p-2 border border-amber-300 rounded focus:ring-amber-500 focus:border-amber-500"
                value={marginesPp} 
                onChange={(e) => setMarginesPp(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cena kartonu PP (zł/m²)</label>
              <input 
                type="number" 
                className="w-full p-2 border border-amber-300 rounded focus:ring-amber-500 focus:border-amber-500"
                value={cenaPpM2} 
                onChange={(e) => setCenaPpM2(e.target.value)} 
              />
            </div>
          </div>
        )}
      </div>

      {/* SEKCJA 3: CENNIK MATERIAŁÓW I MARŻA */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 bg-gray-50 p-4 rounded border border-gray-200">
        <div className="md:col-span-3 lg:col-span-5 border-b border-gray-300 pb-2 mb-2">
          <h4 className="font-bold text-gray-700 uppercase text-sm tracking-wider">3. Ustawienia Cennika i Marży</h4>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Szkło Float (zł/m²)</label>
          <input 
            type="number" 
            className="w-full p-2 border border-gray-300 rounded text-sm" 
            value={cenaSzkloFloat} 
            onChange={(e) => setCenaSzkloFloat(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Antyrefleks (zł/m²)</label>
          <input 
            type="number" 
            className="w-full p-2 border border-gray-300 rounded text-sm" 
            value={cenaSzkloAnty} 
            onChange={(e) => setCenaSzkloAnty(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Plexi (zł/m²)</label>
          <input 
            type="number" 
            className="w-full p-2 border border-gray-300 rounded text-sm" 
            value={cenaPlexi} 
            onChange={(e) => setCenaPlexi(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Plecy / HDF (zł/m²)</label>
          <input 
            type="number" 
            className="w-full p-2 border border-gray-300 rounded text-sm" 
            value={cenaHdfM2} 
            onChange={(e) => setCenaHdfM2(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-blue-700 mb-1">Narzut / Marża (%)</label>
          <input 
            type="number" 
            className="w-full p-2 border-2 border-blue-400 bg-blue-50 rounded text-sm font-bold" 
            value={marzaProcent} 
            onChange={(e) => setMarzaProcent(e.target.value)} 
          />
        </div>
      </div>

      {/* SEKCJA 4: WYNIKI KOŃCOWE */}
      {zuzycieMb > 0 && (
        <div className="mt-8 border-t-2 border-gray-200 pt-6">
          <h4 className="text-xl font-bold text-gray-800 mb-4">Podsumowanie Zlecenia</h4>
          
          <div className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-300 text-yellow-900 shadow-sm flex items-center">
            <svg className="w-6 h-6 mr-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>
            <div>
              <span className="block text-sm uppercase font-semibold">Wymiar roboczy (do cięcia na warsztacie):</span>
              <span className="text-xl font-black">{s_ramy} cm x {w_ramy} cm</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-100 p-5 rounded-lg border border-gray-200 text-sm">
              <p className="text-gray-500 font-bold mb-3 uppercase tracking-wider text-xs border-b border-gray-300 pb-2">Koszty Hurtowe (Materiały)</p>
              <div className="flex justify-between mb-2">
                <span>{nazwaOprawy} ({zuzycieMb.toFixed(2)} mb):</span>
                <strong className="text-gray-800">{kosztHurtRama.toFixed(2)} zł</strong>
              </div>
              <div className="flex justify-between mb-2">
                <span>{nazwaOszklenia} ({poleM2.toFixed(2)} m²):</span>
                <strong className="text-gray-800">{kosztHurtOszklenie.toFixed(2)} zł</strong>
              </div>
              <div className="flex justify-between mb-2">
                <span>Plecy HDF ({poleM2.toFixed(2)} m²):</span>
                <strong className="text-gray-800">{kosztHurtHdf.toFixed(2)} zł</strong>
              </div>
              {maPassepartout && (
                <div className="flex justify-between mb-2 text-amber-700">
                  <span>Passe-partout ({poleM2.toFixed(2)} m²):</span>
                  <strong>{kosztHurtPp.toFixed(2)} zł</strong>
                </div>
              )}
              <div className="flex justify-between mt-3 pt-3 border-t-2 border-gray-300 text-base">
                <span>Suma (Twój koszt):</span>
                <strong className="text-black">{kosztCalkowityHurt.toFixed(2)} zł</strong>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg border-2 border-green-500 flex flex-col justify-center items-center text-center shadow-lg">
              <p className="text-green-800 font-black tracking-wider uppercase text-lg mb-1">Do zapłaty (Klient)</p>
              <p className="text-sm text-green-600 mb-4 font-medium">(uwzględnia {marzaProcent}% marży ramiarza)</p>
              <p className="text-5xl font-black text-green-700">{cenaDetaliczna.toFixed(2)} zł</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}