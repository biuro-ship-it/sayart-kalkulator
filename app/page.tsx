"use client";

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInAnonymously,
  signInWithCustomToken,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot 
} from 'firebase/firestore';

// --- KONFIGURACJA FIREBASE (Dostarczana przez środowisko) ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : { apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'sayart-kalkulator';

// --- KOMPONENT KALKULATORA ---
const Calculator = ({ listwy, userSettings, onSaveSettings }: { listwy: any[], userSettings: any, onSaveSettings: (s: any) => void }) => {
  const [settings, setSettings] = useState(userSettings);
  
  // Dane zlecenia
  const [nrZlecenia, setNrZlecenia] = useState('1/2026');
  const [dataZlecenia, setDataZlecenia] = useState(new Date().toISOString().split('T')[0]);
  const [wybranaListwaId, setWybranaListwaId] = useState('');
  const [typOprawy, setTypOprawy] = useState('rama'); 
  const [szerokosc, setSzerokosc] = useState('');
  const [wysokosc, setWysokosc] = useState('');
  const [rodzajOszklenia, setRodzajOszklenia] = useState('float');
  const [rodzajTylu, setRodzajTylu] = useState('hdf'); 
  const [uwagi, setUwagi] = useState('');
  const [maPassepartout, setMaPassepartout] = useState(false);

  useEffect(() => {
    if (listwy.length > 0 && !wybranaListwaId) setWybranaListwaId(listwy[0].id);
  }, [listwy, wybranaListwaId]);

  const listwa = listwy.find((l) => l.id.toString() === wybranaListwaId.toString()) || listwy[0];

  // OBLICZENIA
  let s_ramy = 0, w_ramy = 0, cenaDetaliczna = 0;
  let nazwaOszklenia = "", nazwaTylu = "";

  if (listwa && szerokosc && wysokosc) {
    const s_obr = parseFloat(szerokosc), w_obr = parseFloat(wysokosc);
    if (!isNaN(s_obr) && !isNaN(w_obr)) {
      s_ramy = maPassepartout ? s_obr + (2 * 5) : s_obr;
      w_ramy = maPassepartout ? w_obr + (2 * 5) : w_obr;
      
      const zuzycieMb = (2 * (s_ramy + w_ramy) + (8 * (listwa.szerokosc_mm / 10))) / 100;
      const poleM2 = (s_ramy * w_ramy) / 10000;

      // 1. Zastosowanie RABATU OD SAYARTU na cenę hurtową
      const cenaKatalogowa = typOprawy === 'rama' ? listwa.cena_zlozona_hurt : listwa.cena_mb_hurt;
      const rabatMnoznik = (1 - (parseFloat(settings.discountSayart) || 0) / 100);
      const mojKosztListwyHurt = zuzycieMb * cenaKatalogowa * rabatMnoznik;

      // 2. Koszty oszklenia i tyłu (z ustawień ramiarza)
      let cSzkloHurt = 0;
      if (rodzajOszklenia === 'float') { cSzkloHurt = parseFloat(settings.priceFloat); nazwaOszklenia = "Szkło Float"; }
      else if (rodzajOszklenia === 'szklo_anty') { cSzkloHurt = parseFloat(settings.priceAnty); nazwaOszklenia = "Szkło Antyrefleks"; }
      else if (rodzajOszklenia === 'plexi') { cSzkloHurt = parseFloat(settings.pricePlexi); nazwaOszklenia = "Plexi"; }
      
      const kosztHurtSzklo = poleM2 * cSzkloHurt;

      let cTylHurt = 0;
      if (rodzajTylu === 'hdf') { cTylHurt = parseFloat(settings.priceHdf); nazwaTylu = "HDF"; }
      else if (rodzajTylu === 'karton') { cTylHurt = parseFloat(settings.priceKarton); nazwaTylu = "Karton"; }
      
      const kosztHurtTyl = poleM2 * cTylHurt;
      const kosztHurtPp = maPassepartout ? poleM2 * 80 : 0;

      // 3. Zastosowanie MARŻY do każdego elementu
      const marzaListwa = typOprawy === 'rama' ? settings.marginRama : settings.marginMetr;
      const cenaDetalRama = mojKosztListwyHurt * (1 + parseFloat(marzaListwa) / 100);
      const cenaDetalSzklo = kosztHurtSzklo * (1 + parseFloat(settings.marginSzklo) / 100);
      const cenaDetalTyl = kosztHurtTyl * (1 + parseFloat(settings.marginTyl) / 100);
      const cenaDetalPp = kosztHurtPp * (1 + 150 / 100);

      cenaDetaliczna = cenaDetalRama + cenaDetalSzklo + cenaDetalTyl + cenaDetalPp;
    }
  }

  return (
    <div className="space-y-4">
      {/* FORMULARZ ZLECENIA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border print:hidden">
        <div className="col-span-full flex justify-between border-b pb-2 mb-1">
          <h4 className="font-bold text-slate-700 uppercase text-xs">Parametry</h4>
          <input type="text" className="p-1 text-xs border rounded w-20 text-center" value={nrZlecenia} onChange={e => setNrZlecenia(e.target.value)} />
        </div>
        <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-400 uppercase">Listwa</label>
          <select className="p-2 text-sm rounded border bg-white" value={wybranaListwaId} onChange={e => setWybranaListwaId(e.target.value)}>
            {listwy.map((l) => <option key={l.id} value={l.id}>{l.kod} ({l.szerokosc_mm}mm)</option>)}
          </select>
        </div>
        <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-400 uppercase">Typ</label>
          <select className="p-2 text-sm rounded border bg-white" value={typOprawy} onChange={e => setTypOprawy(e.target.value)}><option value="rama">W oprawie</option><option value="listwa">Z metra</option></select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" className="p-2 text-sm rounded border" placeholder="Szerokość" value={szerokosc} onChange={e => setSzerokosc(e.target.value)} />
          <input type="number" className="p-2 text-sm rounded border" placeholder="Wysokość" value={wysokosc} onChange={e => setWysokosc(e.target.value)} />
        </div>
        <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-400 uppercase">Oszklenie</label>
          <select className="p-2 text-sm rounded border bg-white" value={rodzajOszklenia} onChange={e => setRodzajOszklenia(e.target.value)}><option value="float">Float</option><option value="szklo_anty">Antyrefleks</option><option value="plexi">Plexi</option><option value="brak">Brak</option></select>
        </div>
        <div className="flex flex-col"><label className="text-[10px] font-bold text-gray-400 uppercase">Tył</label>
          <select className="p-2 text-sm rounded border bg-white" value={rodzajTylu} onChange={e => setRodzajTylu(e.target.value)}><option value="hdf">HDF</option><option value="karton">Karton</option><option value="brak">Brak</option></select>
        </div>
        <div className="col-span-full">
          <textarea className="w-full p-2 text-sm rounded border" placeholder="Uwagi..." rows={1} value={uwagi} onChange={e => setUwagi(e.target.value)} />
        </div>
      </div>

      {/* USTAWIENIA INDYWIDUALNE */}
      <details className="group print:hidden">
        <summary className="cursor-pointer p-3 rounded-xl bg-slate-800 text-white text-xs font-bold uppercase flex justify-between">
          <span>⚙️ Twoje Indywidualne Marże i Rabaty</span>
          <span className="opacity-50">Kliknij aby zmienić</span>
        </summary>
        <div className="p-4 bg-white border border-t-0 rounded-b-xl space-y-4 shadow-inner">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-full font-bold text-[10px] text-blue-600 uppercase border-b pb-1">Ustawienia u dostawcy</div>
            <div className="flex flex-col bg-blue-50 p-2 rounded border border-blue-100">
               <label className="text-[10px] font-black text-blue-800">TWÓJ RABAT W SAYART %</label>
               <input type="number" className="p-1 border rounded font-bold text-blue-900" value={settings.discountSayart} onChange={e => setSettings({...settings, discountSayart: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            <div className="col-span-full font-bold text-[10px] text-gray-400 uppercase border-b pb-1">Twoje marże (%)</div>
            <div className="flex flex-col"><label className="text-[9px]">W oprawie %</label><input type="number" className="p-1 border rounded text-xs" value={settings.marginRama} onChange={e => setSettings({...settings, marginRama: e.target.value})} /></div>
            <div className="flex flex-col"><label className="text-[9px]">Z metra %</label><input type="number" className="p-1 border rounded text-xs" value={settings.marginMetr} onChange={e => setSettings({...settings, marginMetr: e.target.value})} /></div>
            <div className="flex flex-col"><label className="text-[9px]">Szkło %</label><input type="number" className="p-1 border rounded text-xs" value={settings.marginSzklo} onChange={e => setSettings({...settings, marginSzklo: e.target.value})} /></div>
            <div className="flex flex-col"><label className="text-[9px]">Tyły %</label><input type="number" className="p-1 border rounded text-xs" value={settings.marginTyl} onChange={e => setSettings({...settings, marginTyl: e.target.value})} /></div>
          </div>
          <button 
            onClick={() => onSaveSettings(settings)}
            className="w-full bg-blue-600 text-white text-[10px] font-bold py-2 rounded hover:bg-blue-700"
          >
            ZAPISZ MOJE USTAWIENIA NA STAŁE
          </button>
        </div>
      </details>

      {/* WYNIK */}
      {cenaDetaliczna > 0 && (
        <div className="mt-4 pt-4 border-t-2 text-slate-900">
           <div className="hidden print:block mb-6 border-b pb-4">
              <h2 className="text-2xl font-black uppercase">{settings.shopName}</h2>
              <p className="text-xs text-gray-500">{settings.shopAddress} | Tel: {settings.shopPhone}</p>
           </div>
           <div className="p-6 bg-green-600 rounded-2xl text-white flex flex-col items-center print:bg-white print:text-black print:border-4 print:border-black print:p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Do zapłaty:</p>
              <p className="text-5xl font-black my-1">{cenaDetaliczna.toFixed(2)} zł</p>
           </div>
           <div className="mt-4 flex gap-2 print:hidden">
              <button onClick={handlePrint} className="flex-1 bg-slate-700 text-white font-bold p-3 rounded-xl text-xs">📄 DRUKUJ</button>
              <button onClick={handleSms} className="flex-1 bg-green-500 text-white font-bold p-3 rounded-xl text-xs">📱 SMS</button>
           </div>
        </div>
      )}
    </div>
  );
};

// --- GŁÓWNA STRONA Z LOGOWANIEM ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'app'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const listwyDemo = [
    { id: 1, kod: 'SY-001', szerokosc_mm: 30, cena_mb_hurt: 15.0, cena_zlozona_hurt: 25.0 },
    { id: 2, kod: 'SY-002', szerokosc_mm: 45, cena_mb_hurt: 22.0, cena_zlozona_hurt: 35.0 }
  ];

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setView('app');
      else setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        const defaultSettings = {
          shopName: 'Twoja Pracownia',
          shopAddress: 'ul. Ramiarska 1',
          shopPhone: '123-456-789',
          discountSayart: '10',
          marginRama: '100',
          marginMetr: '150',
          marginSzklo: '150',
          marginTyl: '150',
          priceFloat: '60',
          priceAnty: '90',
          pricePlexi: '120',
          priceHdf: '25',
          priceKarton: '15'
        };
        await setDoc(docRef, defaultSettings);
        setSettings(defaultSettings);
      }
      setLoading(false);
    };
    fetchSettings();
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Błędny email lub hasło.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Błąd rejestracji: Hasło min. 6 znaków.');
    }
  };

  const saveSettings = async (newSettings: any) => {
    if (!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile'), newSettings);
    setSettings(newSettings);
    // Custom notification
    const banner = document.createElement('div');
    banner.className = "fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-full shadow-lg z-50 font-bold text-xs animate-bounce";
    banner.innerText = "Ustawienia zapisane!";
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Ładowanie profilu...</div>;

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 font-sans">
      <div className="max-w-2xl mx-auto">
        
        {!user && (
          <div className="bg-white p-8 rounded-3xl shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Wyceny Ramiarskie</h1>
              <p className="text-gray-400 text-xs mt-1 uppercase font-bold tracking-widest">Zaloguj się, aby używać własnych marż i rabatów</p>
            </div>

            <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {error && <p className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold text-center">{error}</p>}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-2">E-mail</label>
                <input type="email" required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-2">Hasło</label>
                <input type="password" required className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-slate-900 transition-all uppercase tracking-widest">
                {view === 'login' ? 'Zaloguj mnie' : 'Załóż konto'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => setView(view === 'login' ? 'register' : 'login')}
                className="text-blue-600 text-xs font-bold hover:underline"
              >
                {view === 'login' ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
              </button>
            </div>
          </div>
        )}

        {user && settings && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <header className="bg-slate-800 p-5 text-white flex justify-between items-center print:hidden">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-black text-xs">
                   {user.email?.charAt(0).toUpperCase()}
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-gray-400 leading-none">Witaj,</p>
                   <p className="text-sm font-black truncate max-w-[150px]">{user.email}</p>
                 </div>
               </div>
               <button onClick={() => signOut(auth)} className="text-[10px] font-bold text-gray-400 hover:text-white border border-gray-600 px-3 py-1 rounded-lg">WYLOGUJ</button>
            </header>
            <div className="p-6">
              <Calculator listwy={listwyDemo} userSettings={settings} onSaveSettings={saveSettings} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}