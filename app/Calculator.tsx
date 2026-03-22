"use client";

import { useState } from 'react';

export default function Calculator({ listwy }: { listwy: any[] }) {
  // 1. ZAMÓWIENIE KLIENTA
  const [wybranaListwaId, setWybranaListwaId] = useState(listwy[0]?.id || '');
  const [szerokosc, setSzerokosc] = useState('');
  const [wysokosc, setWysokosc] = useState('');
  const [rodzajOszklenia, setRodzajOszklenia] = useState('float');

  // Passe-partout
  const [maPassepartout, setMaPassepartout] = useState(false);
  const [marginesPp, setMarginesPp] = useState('5');
  const [cenaPpM2, setCenaPpM2] = useState('80');

  // 2. CENNIK MATERIAŁÓW RAMIARZA (Z domyślnymi cenami hurtowymi za m2)
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

      // RAMA
      const listwaSzerCm = listwa.szerokosc_mm / 10;
      const zuzycieCm = 2 * (s_ramy + w_ramy) + (8 * listwaSzerCm);
      zuzycieMb = zuzycieCm / 100;
      kosztHurtRama = zuzycieMb * listwa.cena_zlozona_hurt;

      // POWIERZCHNIA M2 (do szkła, pleców i PP)
      poleM2 = (s_ramy * w_ramy) / 10000;

      // OSZKLENIE - dobieramy cenę na podstawie wyboru z listy
      let cenaOszkleniaM2 = 0;
      if (rodzajOszklenia === 'float') { cenaOszkleniaM2 = parseFloat(cenaSzkloFloat) || 0; nazwaOszklenia = "Szkło Float"; }
      else if (rodzajOszklenia === 'szklo_anty') { cenaOszkleniaM2 = parseFloat(cenaSzkloAnty) || 0; nazwaOszklenia = "Szkło Antyrefleks"; }
      else if (rodzajOszklenia === 'plexi') { cenaOszkleniaM2 = parseFloat(cenaPlexi) || 0; nazwaOszklenia = "Plexi"; }
      else if (rodzajOszklenia === 'brak') { cenaOszkleniaM2 = 0; nazwaOszklenia = "Bez oszklenia"; }

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-blue-50 p-4 rounded">
        <div className="md:col-span-2 lg:col-span-4 border-b border-blue-200 pb-2 mb-2">
          <h4 className="font-bold text-blue-800 uppercase text-sm tracking-wider">1. Obraz i Rama</h4>
        </div>
        <div className="lg:col-span-2">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Szerokość obrazu (cm)</label>
          <input 
            type="number" 
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            placeholder="np. 50"
            value={szerokosc}
            onChange={(e) => setSzerokosc(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wysokość obrazu (cm)</label>
          <input 
            type="number" 
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            placeholder="np. 70"
            value={wysokosc}
            onChange={(e) => setWysokosc(e.target.value)}
          />
        </div>
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Rodzaj Oszklenia</label>
          <select 
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white"
            value={rodzajOszklenia}
            onChange={(e) => setRodzajOszklenia(e.target.value)}
          >
            <option value="float">Szkło Float</option>
            <option value="sz