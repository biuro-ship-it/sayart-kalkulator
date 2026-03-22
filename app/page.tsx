import pool from '../lib/db';
import Calculator from './Calculator';

export default async function Home() {
  const [rows] = await pool.query('SELECT * FROM cennik_sayart ORDER BY id ASC');
  const listwy = rows as any[];

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-4 md:p-6 rounded-lg shadow-md">
        
        {/* NAGŁÓWEK */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-3xl font-bold text-blue-700">Sayart</h1>
          <h2 className="text-xl text-gray-600">Kalkulator Ramiarski</h2>
        </div>

        {/* GŁÓWNY KALKULATOR */}
        <Calculator listwy={listwy} />

        {/* ROZWIJANY CENNIK HURTOWY */}
        <details className="mt-8 pt-6 border-t border-gray-200 group">
          <summary className="cursor-pointer bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-md font-bold hover:bg-gray-50 transition shadow-sm inline-block list-none">
            <span className="group-open:hidden">👁️ Wyświetl pełny cennik listew</span>
            <span className="hidden group-open:inline">🙈 Ukryj cennik listew</span>
          </summary>
          
          <div className="mt-6 overflow-x-auto">
            <h3 className="text-lg font-bold text-gray-700 mb-3">Cennik Hurtowy Sayart:</h3>
            <table className="min-w-full border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 border-b text-left">Kod Listwy</th>
                  <th className="py-3 px-4 border-b text-center">Szerokość</th>
                  <th className="py-3 px-4 border-b text-right">Cena mb (Hurt)</th>
                  <th className="py-3 px-4 border-b text-right">Cena ramy (Hurt)</th>
                </tr>
              </thead>
              <tbody>
                {listwy.map((listwa) => (
                  <tr key={listwa.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 border-b font-medium text-blue-600">{listwa.kod}</td>
                    <td className="py-3 px-4 border-b text-center">{listwa.szerokosc_mm} mm</td>
                    <td className="py-3 px-4 border-b text-right">{listwa.cena_mb_hurt} zł</td>
                    <td className="py-3 px-4 border-b text-right">{listwa.cena_zlozona_hurt} zł</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

      </div>
    </main>
  );
}