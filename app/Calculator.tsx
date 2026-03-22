"use client"; // To mówi Next.js, że to jest interaktywny element (Client Component)

import { useState } from 'react';

export default function Calculator({ listwy }: { listwy: any[] }) {
  const [wybranaListwaId, setWybranaListwaId] = useState(listwy[0]?.id || '');
  const [szerokosc, setSzerokosc] = useState('');
  const [wysokosc, setWysokosc] = useState('');

  // Znajdujemy pełne dane wybranej listwy
  const listwa = listwy.find((l) => l.id.toString() === wybranaListwaId.toString());

  // Zmienne do wyników
  let zuzycieMb = 0;
  let cenaMaterialu = 0;
  let cenaZlozona = 0;

  // Główny wzór matematyczny Sayart
  if (listwa && szerokosc && wysokosc) {
    const s = parseFloat(szerokosc);
    const w = parseFloat(wysokosc);

    if (!isNaN(s) && !isNaN(w)) {
      const listwaSzerCm = listwa.szerokosc_mm / 10;
      // 2*(S+W) + 8 uciosów (szerokości listwy)
      const zuzycieCm = 2 * (s + w) + (8 * listwaSzerCm);
      zuzycieMb = zuzycieCm / 100;

      cenaMaterialu = zuzycieMb * listwa.cena_mb_hurt;
      cenaZlozona = zuzycieMb * listwa.cena_zlozona_hurt;
    }
  }

  return (
    <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mb-8">
      <h3 className="text-xl font-bold text-blue-800 mb-4">Kalkulator Oprawy</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wybierz listwę</label>
          <select 
            className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
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
      </div>

      {zuzycieMb > 0 && (
        <div className="bg-white p-4 rounded border border-green-200 shadow-inner">
          <p className="text-gray-600 mb-1">Zapotrzebowanie materiału: <strong className="text-black">{zuzycieMb.toFixed(2)} mb</strong></p>
          <p className="text-gray-600 mb-1">Koszt samej listwy (hurt): <strong className="text-black">{cenaMaterialu.toFixed(2)} zł</strong></p>
          <p className="text-lg text-green-700 mt-2">Cena ramy złożonej (hurt): <strong>{cenaZlozona.toFixed(2)} zł</strong></p>
        </div>
      )}
    </div>
  );
}