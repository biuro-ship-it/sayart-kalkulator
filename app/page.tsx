import pool from '../lib/db';
import Calculator from './Calculator'; // Importujemy nasz nowy kalkulator!

export default async function Home() {
  const [rows] = await pool.query('SELECT * FROM cennik_sayart ORDER BY id ASC');
  const listwy = rows as any[];

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-2 text-blue-700">Sayart</h1>
        <h2 className="text-xl mb-6 text-gray-600">Panel Ramiarza</h2>

        {/* Wstawiamy nasz interaktywny kalkulator i przekazujemy mu dane z bazy */}
        <Calculator listwy={listwy} />

        <h3 className="text-lg font-bold text-gray-700 mb-3 mt-8">Twój pełny cennik:</h3>
        <div className="overflow-x-auto">
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
      </div>
    </main>
  );
}