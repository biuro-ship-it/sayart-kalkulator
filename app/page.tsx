"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  onSnapshot,
  addDoc,
  deleteDoc
} from 'firebase/firestore';

// --- INICJALIZACJA FIREBASE ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : { 
      apiKey: "AIzaSy_dummy_key_for_local_environment_do_not_use", 
      authDomain: "dummy.firebaseapp.com", 
      projectId: "dummy-project", 
      storageBucket: "dummy.appspot.com", 
      messagingSenderId: "123456789", 
      appId: "1:123456789:web:abcdef" 
    };

const isLocalMock = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('dummy');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'sayart-pro-v5';

// --- KOMPONENTY POWIADOMIEŃ ---
const Alert = ({ msg, type = 'success' }: { msg: string, type?: 'success' | 'error' }) => (
  <div className={`fixed bottom-4 right-4 p-4 rounded-2xl shadow-2xl z-[200] animate-in slide-in-from-right duration-300 border-2 ${
    type === 'success' ? 'bg-green-600 border-green-400 text-white' : 'bg-red-600 border-red-400 text-white'
  }`}>
    <div className="flex items-center gap-2 font-bold text-sm">
      {type === 'success' ? '✓' : '✕'} {msg}
    </div>
  </div>
);

// --- KOMPONENT KALKULATORA ---
const Calculator = ({ 
  listwy, 
  settings, 
  user, 
  isMock,
  onSaveSettings 
}: { 
  listwy: any[], 
  settings: any, 
  user: User, 
  isMock: boolean,
  onSaveSettings: (s: any) => void 
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [orders, setOrders] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3000);
  };

  // Stany formularza
  const [form, setForm] = useState({
    nr: '1/2026',
    data: new Date().toISOString().split('T')[0],
    listwaId: '',
    typ: 'rama', 
    szerokosc: '',
    wysokosc: '',
    oszklenie: 'brak',
    tyl: 'brak',
    uwagi: '',
    maPp: false
  });

  // Pobieranie Archiwum
  useEffect(() => {
    if (!user || isMock) return; 
    const ordersRef = collection(db, 'artifacts', appId, 'users', user.uid, 'orders');
    const unsubOrders = onSnapshot(ordersRef, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => console.error("Orders Snapshot Error:", error));
    return () => unsubOrders();
  }, [user, isMock]);

  // Logika obliczeń
  const results = useMemo(() => {
    if (!localSettings || !form.listwaId || !form.szerokosc || !form.wysokosc) return null;
    const l = listwy.find(i => i.id.toString() === form.listwaId);
    if (!l) return null;

    const s = parseFloat(form.szerokosc), w = parseFloat(form.wysokosc);
    if (isNaN(s) || isNaN(w)) return null;

    const s_ramy = form.maPp ? s + 10 : s;
    const w_ramy = form.maPp ? w + 10 : w;
    const mb = (2 * (s_ramy + w_ramy) + (8 * (l.szerokosc_mm / 10))) / 100;
    const m2 = (s_ramy * w_ramy) / 10000;

    const cenaHurt = form.typ === 'rama' ? l.cena_zlozona_hurt : l.cena_mb_hurt;
    const rabat = 1 - (parseFloat(localSettings.discountSayart) / 100);
    const marzaL = form.typ === 'rama' ? localSettings.marginRama : localSettings.marginMetr;
    
    let cSzklo = 0;
    if (form.oszklenie === 'float') cSzklo = parseFloat(localSettings.priceFloat);
    else if (form.oszklenie === 'szklo_anty') cSzklo = parseFloat(localSettings.priceAnty);
    else if (form.oszklenie === 'plexi') cSzklo = parseFloat(localSettings.pricePlexi);

    let cTyl = 0;
    if (form.tyl === 'hdf') cTyl = parseFloat(localSettings.priceHdf);
    else if (form.tyl === 'karton') cTyl = parseFloat(localSettings.priceKarton);

    const cenaL = (mb * cenaHurt * rabat) * (1 + parseFloat(marzaL) / 100);
    const cenaS = (m2 * cSzklo) * (1 + parseFloat(localSettings.marginSzklo) / 100);
    const cenaT = (m2 * cTyl) * (1 + parseFloat(localSettings.marginTyl) / 100);
    const cenaPp = form.maPp ? (m2 * parseFloat(localSettings.priceKarton || '80')) * 2.5 : 0;

    return { total: cenaL + cenaS + cenaT + cenaPp, s_ramy, w_ramy };
  }, [form, localSettings, listwy]);

  const resetForm = () => {
    const nrStr = form.nr.split('/')[0];
    const nextNr = !isNaN(parseInt(nrStr)) ? `${parseInt(nrStr) + 1}/2026` : form.nr;
    setForm({
      ...form, listwaId: '', szerokosc: '', wysokosc: '', uwagi: '', 
      maPp: false, oszklenie: 'brak', tyl: 'brak', nr: nextNr
    });
    setEditingId(null);
  };

  const handleSave = async (isNew: boolean) => {
    if (!user) { showAlert("Brak autoryzacji.", "error"); return; }
    const data = { ...form, total: results?.total, updatedAt: new Date().toISOString() };
    
    if (isMock) {
      if (editingId) {
        setOrders(orders.map(o => o.id === editingId ? { id: editingId, ...data } : o));
        showAlert("Zaktualizowane (Tryb Demo)");
      } else {
        setOrders([...orders, { id: Math.random().toString(), ...data }]);
        showAlert("Zapisane lokalnie (Tryb Demo)");
      }
      if (isNew) resetForm();
      return;
    }

    try {
      if (editingId) {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'orders', editingId), data);
        showAlert("Zlecenie zaktualizowane pomyślnie");
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'orders'), data);
        showAlert("Zlecenie dodane do archiwum");
      }
      if (isNew) resetForm();
    } catch (e) { 
      showAlert("Błąd zapisu zlecenia. Odśwież stronę.", "error"); 
    }
  };

  return (
    <div className="space-y-4">
      {alert && <Alert msg={alert.msg} type={alert.type} />}

      {/* FORMULARZ ZLECENIA */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white mb-8">
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:hidden">
            <div className="col-span-full flex justify-between items-center border-b pb-4">
              <span className="text-xs font-black uppercase text-slate-400 tracking-widest">
                {editingId ? '📝 EDYCJA ZLECENIA' : '1. DANE NOWEJ OPRAWY'}
              </span>
              <div className="flex gap-2">
                <input type="text" className="p-2 border rounded-xl text-xs font-bold w-20 text-center" value={form.nr} onChange={e => setForm({...form, nr: e.target.value})} title="Nr zlecenia" />
                <input type="date" className="p-2 border rounded-xl text-xs w-32 text-center" value={form.data} onChange={e => setForm({...form, data: e.target.value})} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Wybierz listwę</label>
              <select className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm shadow-inner" 
                value={form.listwaId} onChange={e => setForm({...form, listwaId: e.target.value})}>
                <option value="">-- wybierz kod --</option>
                {listwy.map(l => <option key={l.id} value={l.id}>{l.kod} ({l.szerokosc_mm}mm)</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Typ usługi</label>
              <select className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm shadow-inner" 
                value={form.typ} onChange={e => setForm({...form, typ: e.target.value})}>
                <option value="rama">W oprawie (złożona)</option>
                <option value="listwa">Z metra (sama listwa)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Format obrazu (cm)</label>
              <div className="flex gap-2">
                <input type="number" placeholder="Szer." className="w-1/2 p-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm shadow-inner" value={form.szerokosc} onChange={e => setForm({...form, szerokosc: e.target.value})} />
                <input type="number" placeholder="Wys." className="w-1/2 p-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm shadow-inner" value={form.wysokosc} onChange={e => setForm({...form, wysokosc: e.target.value})} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Oszklenie</label>
              <select className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm shadow-inner" 
                value={form.oszklenie} onChange={e => setForm({...form, oszklenie: e.target.value})}>
                <option value="brak">nie wybrano</option>
                <option value="float">Szkło Float</option>
                <option value="szklo_anty">Antyrefleks</option>
                <option value="plexi">Plexi</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Rodzaj pleców</label>
              <select className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm shadow-inner" 
                value={form.tyl} onChange={e => setForm({...form, tyl: e.target.value})}>
                <option value="brak">nie wybrano</option>
                <option value="hdf">Płyta HDF</option>
                <option value="karton">Karton</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Uwagi do zlecenia</label>
              <input className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm shadow-inner" 
                placeholder="..." value={form.uwagi} onChange={e => setForm({...form, uwagi: e.target.value})} />
            </div>
          </div>

          <div className="flex gap-4 mb-8 print:hidden">
            <button onClick={() => setForm({...form, maPp: !form.maPp})} className={`flex-1 p-4 rounded-2xl border-2 flex items-center justify-center gap-3 font-bold transition-all ${
              form.maPp ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-md' : 'bg-slate-50 border-slate-50 text-slate-400'
            }`}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${form.maPp ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white border-slate-300'}`}>
                {form.maPp && '✓'}
              </div>
              DODAJ PASSE-PARTOUT
            </button>
            <button onClick={resetForm} className="px-6 py-4 rounded-2xl bg-slate-100 text-slate-500 font-black text-[10px] uppercase hover:bg-slate-200 transition-all tracking-widest">
              Wyczyść pola
            </button>
          </div>

          {/* KARTA WYNIKÓW EKRANOWA (Ukryta na wydruku!) */}
          {results && (
            <div className="animate-in fade-in zoom-in-95 duration-500 print:hidden">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10 select-none text-9xl">➕</div>
                 <div className="relative z-10 flex flex-col items-center text-center">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-50 mb-3">Suma do zapłaty (Brutto)</p>
                    <h3 className="text-7xl font-black mb-2">{results.total.toFixed(2)} <span className="text-3xl opacity-30">zł</span></h3>
                    <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 mb-8 flex gap-4 text-[11px] font-bold">
                       <span>CIĘCIE: <strong className="text-blue-400">{results.s_ramy}x{results.w_ramy} cm</strong></span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full print:hidden">
                      <button onClick={() => handleSave(false)} className="flex items-center justify-center gap-2 bg-white/10 p-4 rounded-2xl font-bold text-[10px] hover:bg-white/20 transition-all uppercase tracking-widest">
                        <span className="text-sm">💾</span> {editingId ? 'Aktualizuj' : 'Zapisz'}
                      </button>
                      <button onClick={() => handleSave(true)} className="flex items-center justify-center gap-2 bg-blue-600 p-4 rounded-2xl font-bold text-[10px] hover:bg-blue-500 transition-all uppercase tracking-widest shadow-lg active:scale-95">
                        <span className="text-sm">➕</span> Zapisz i Nowe
                      </button>
                      <button onClick={() => window.print()} className="flex items-center justify-center gap-2 bg-white/10 p-4 rounded-2xl font-bold text-[10px] hover:bg-white/20 transition-all uppercase tracking-widest">
                        <span className="text-sm">🖨️</span> Drukuj
                      </button>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ARCHIWUM Z ROZWIJANYM PANELEM */}
      {orders.length > 0 && (
        <details className="group print:hidden mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <summary className="cursor-pointer p-5 bg-white rounded-[2rem] shadow-sm flex justify-between items-center font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all select-none border border-slate-100">
             <div className="flex items-center gap-3">
               <span className="text-xl leading-none">🗄️</span> Archiwum Pracowni
               <span className="bg-slate-200 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold">{orders.length}</span>
             </div>
             <span className="group-open:rotate-180 transition-transform inline-block">▼</span>
          </summary>
          <div className="p-6 md:p-8 bg-white border-t border-slate-100 rounded-b-[2rem] mt-1 shadow-inner">
            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {orders.sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).map(o => (
                <div key={o.id} className="group bg-slate-50 p-4 rounded-2xl border-2 border-transparent hover:border-blue-500 transition-all flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center text-slate-400 font-bold text-[10px] group-hover:text-blue-600 transition-colors">
                      {o.nr}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{o.szerokosc}x{o.wysokosc} cm • {o.total?.toFixed(2)} zł</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{o.data} • {listwy.find(l => l.id.toString() === o.listwaId.toString())?.kod || '---'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                    <button onClick={() => { setForm(o); setEditingId(o.id); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors">
                      <span className="text-sm">✏️</span>
                    </button>
                    <button onClick={async () => { 
                      if(!confirm("Trwale usunąć zlecenie?")) return;
                      if (isMock) { setOrders(orders.filter(item => item.id !== o.id)); return; }
                      await deleteDoc(doc(db, 'artifacts', appId, 'users', user!.uid, 'orders', o.id)); 
                    }} className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors">
                      <span className="text-sm">🗑️</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      )}

      {/* USTAWIENIA WARSZTATU */}
      <details className="group print:hidden mb-12">
        <summary className="cursor-pointer p-5 bg-white rounded-[2rem] shadow-sm flex justify-between items-center font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all select-none border border-slate-100">
           <div className="flex items-center gap-3"><span className="text-xl leading-none">⚙️</span> Konfiguracja Warsztatu i Bazy</div>
           <span className="group-open:rotate-180 transition-transform inline-block">▼</span>
        </summary>
        <div className="p-6 md:p-8 bg-white border-t border-slate-100 rounded-b-[2rem] space-y-8 animate-in slide-in-from-top-2 duration-300 mt-1 shadow-inner">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* 1. DANE FIRMY */}
             <div className="space-y-4">
                <p className="text-[10px] font-black text-blue-600 uppercase border-b border-blue-100 pb-2">Dane Pracowni (na wydruk)</p>
                <input placeholder="Nazwa Pracowni" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-700" value={localSettings?.shopName} onChange={e => setLocalSettings({...localSettings, shopName: e.target.value})} />
                <input placeholder="Adres" className="w-full p-3 bg-slate-50 rounded-xl text-xs text-slate-700" value={localSettings?.shopAddress} onChange={e => setLocalSettings({...localSettings, shopAddress: e.target.value})} />
                <div className="flex gap-2">
                  <input placeholder="Telefon" className="w-1/2 p-3 bg-slate-50 rounded-xl text-xs text-slate-700" value={localSettings?.shopPhone} onChange={e => setLocalSettings({...localSettings, shopPhone: e.target.value})} />
                  <input placeholder="E-mail" className="w-1/2 p-3 bg-slate-50 rounded-xl text-xs text-slate-700" value={localSettings?.shopEmail} onChange={e => setLocalSettings({...localSettings, shopEmail: e.target.value})} />
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-white/10 mt-4">
                   <p className="text-[9px] font-black text-amber-400 uppercase mb-2 flex items-center gap-2"><span>🔗</span> Zewnętrzna Baza MyDevil</p>
                   <input placeholder="API URL (np. https://twoja-strona.pl/api)" className="w-full p-3 bg-white/5 rounded-xl text-[10px] text-white outline-none border border-white/5" value={localSettings?.myDevilApi || ''} onChange={e => setLocalSettings({...localSettings, myDevilApi: e.target.value})} />
                </div>
             </div>

             {/* 2. CENNIK MATERIAŁÓW I MARŻE */}
             <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase border-b pb-2 mb-3">Koszty Zakupu Surowców (zł/m²)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500">Szkło Float</label><input type="number" className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700" value={localSettings?.priceFloat} onChange={e => setLocalSettings({...localSettings, priceFloat: e.target.value})} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500">Antyrefleks</label><input type="number" className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700" value={localSettings?.priceAnty} onChange={e => setLocalSettings({...localSettings, priceAnty: e.target.value})} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500">Plexi</label><input type="number" className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700" value={localSettings?.pricePlexi} onChange={e => setLocalSettings({...localSettings, pricePlexi: e.target.value})} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500">Płyta HDF</label><input type="number" className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700" value={localSettings?.priceHdf} onChange={e => setLocalSettings({...localSettings, priceHdf: e.target.value})} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500">Karton</label><input type="number" className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700" value={localSettings?.priceKarton} onChange={e => setLocalSettings({...localSettings, priceKarton: e.target.value})} /></div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase border-b pb-2 mb-3">Twoje Indywidualne Marże (%)</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500">Rama</label><input type="number" className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-xs font-black text-blue-700" value={localSettings?.marginRama} onChange={e => setLocalSettings({...localSettings, marginRama: e.target.value})} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500">Metr</label><input type="number" className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-xs font-black text-blue-700" value={localSettings?.marginMetr} onChange={e => setLocalSettings({...localSettings, marginMetr: e.target.value})} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500">Szkło</label><input type="number" className="p-2 bg-green-50 border border-green-100 rounded-xl text-xs font-black text-green-700" value={localSettings?.marginSzklo} onChange={e => setLocalSettings({...localSettings, marginSzklo: e.target.value})} /></div>
                    <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500">Tyły</label><input type="number" className="p-2 bg-green-50 border border-green-100 rounded-xl text-xs font-black text-green-700" value={localSettings?.marginTyl} onChange={e => setLocalSettings({...localSettings, marginTyl: e.target.value})} /></div>
                  </div>
                </div>
             </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-2xl flex items-center justify-between shadow-inner">
             <div>
               <p className="text-[10px] font-black text-white uppercase">Twój Rabat Sayart</p>
               <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Pomniejsza hurtowe ceny z katalogu</p>
             </div>
             <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                <input type="number" className="w-12 text-center font-black bg-transparent text-white outline-none" value={localSettings?.discountSayart} onChange={e => setLocalSettings({...localSettings, discountSayart: e.target.value})} />
                <span className="text-slate-500 font-bold">%</span>
             </div>
          </div>

          <button onClick={() => {
            onSaveSettings(localSettings);
            showAlert("Konfiguracja warsztatu zapisana!");
          }} 
            className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all active:scale-95 mt-4">
            Zapisz Profil Ramiarza
          </button>
        </div>
      </details>

      {/* DOKUMENT DO WYDRUKU (Jedna Strona) */}
      <div className="hidden print:block print-document bg-white text-black">
         <div className="border-b-4 border-slate-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black uppercase text-slate-900 leading-tight">{localSettings?.shopName}</h2>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{localSettings?.shopAddress}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Tel: {localSettings?.shopPhone || '---'} | Email: {localSettings?.shopEmail || '---'}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black uppercase">POTWIERDZENIE ZLECENIA</p>
              <p className="text-sm font-bold bg-slate-900 text-white px-3 py-1 inline-block mt-1 uppercase">NR {form.nr}</p>
              <p className="text-xs text-slate-500 mt-2 uppercase font-bold tracking-tighter">DATA: {form.data}</p>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
               <div className="border-l-4 border-slate-900 pl-4 py-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Model Oprawy / Format</p>
                  <p className="text-xl font-bold uppercase">{listwy.find(l => l.id.toString() === form.listwaId.toString())?.kod || '---'} ({form.szerokosc}x{form.wysokosc} cm)</p>
               </div>
               <div className="border-l-4 border-slate-900 pl-4 py-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Specyfikacja</p>
                  <p className="text-sm font-bold uppercase">{form.oszklenie !== 'brak' ? `Szkło: ${form.oszklenie}` : 'Bez oszklenia'}</p>
                  <p className="text-sm font-bold uppercase">{form.tyl !== 'brak' ? `Tył: ${form.tyl}` : 'Bez tyłu'}</p>
                  {form.maPp && <p className="text-sm font-bold uppercase text-slate-600 mt-1">Passe-partout dołączone</p>}
               </div>
            </div>
            <div className="flex flex-col items-center justify-center border-4 border-slate-900 rounded-[2rem] p-6 text-center">
               <p className="text-[11px] font-black uppercase tracking-[0.4em] mb-2 opacity-60">Suma do Zapłaty</p>
               <p className="text-5xl font-black leading-none">{results?.total.toFixed(2)} zł</p>
            </div>
         </div>

         {form.uwagi && (
           <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl mb-6 italic text-slate-700">
             <strong className="uppercase font-black text-[10px] mr-2">Uwagi:</strong> {form.uwagi}
           </div>
         )}

         {/* ODCINEK DLA KLIENTA - Zmniejszony margines z mt-40 na mt-12, żeby zmieścić na jednej stronie */}
         <div className="mt-12 border-t-2 border-dashed border-slate-400 pt-6 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-4 text-slate-400"><span className="text-2xl">✂️</span></div>
            <div className="flex justify-between items-start">
              <div className="w-2/3">
                <h3 className="text-lg font-black uppercase text-slate-900">POTWIERDZENIE ODBIORU ZLECENIA</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">Nr: {form.nr}</p>
                <p className="text-[11px] font-bold text-slate-900 uppercase leading-tight">{localSettings?.shopName}</p>
                <p className="text-[9px] uppercase tracking-tighter text-slate-500">{localSettings?.shopAddress}</p>
                <p className="text-[9px] uppercase tracking-tighter text-slate-500">{localSettings?.shopPhone}</p>
              </div>
              <div className="w-1/3 text-right">
                 <div className="border-2 border-slate-900 p-2 inline-block mb-6">
                    <p className="text-[10px] font-black uppercase leading-none text-slate-500 mb-1">Do zapłaty:</p>
                    <p className="text-2xl font-black">{results?.total.toFixed(2)} zł</p>
                 </div>
                 <div className="border-t border-slate-400 pt-1">
                    <p className="text-[7px] uppercase font-black text-slate-400 tracking-widest">Podpis / Pieczęć Ramiarza</p>
                 </div>
              </div>
            </div>
            <p className="text-center text-[8px] uppercase tracking-[0.5em] font-black text-slate-400 mt-10">Dziękujemy za zlecenie. Prosimy o zachowanie odcinka.</p>
         </div>
      </div>
    </div>
  );
};

// --- APP WRAPPER (Logowanie i Stan) ---
export default function App() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  // Stany logowania e-mailem
  const [view, setView] = useState<'app' | 'login' | 'register'>('app');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const listwyDemo = [
    { id: 1, kod: 'SY-001', szerokosc_mm: 30, cena_mb_hurt: 15.0, cena_zlozona_hurt: 25.0 },
    { id: 2, kod: 'SY-002', szerokosc_mm: 45, cena_mb_hurt: 22.0, cena_zlozona_hurt: 35.0 },
    { id: 3, kod: 'ALU-10', szerokosc_mm: 20, cena_mb_hurt: 10.0, cena_zlozona_hurt: 18.0 }
  ];

  useEffect(() => { setMounted(true); }, []);

  // INIT AUTH
  useEffect(() => {
    const init = async () => {
      try {
        if (!isLocalMock && typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          // Brak tokenu
        }
      } catch (e) {
        console.error("Auth Error:", e);
      }
    };
    init();

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u || u.isAnonymous) {
         setView('login');
      } else {
         setView('app');
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // FETCH SETTINGS
  useEffect(() => {
    if (!user) return;

    if (isLocalMock) {
      setSettings({
        shopName: 'Pracownia Demo', shopAddress: 'ul. Przykładowa 1', shopPhone: '123 456 789', shopEmail: 'biuro@demo.pl',
        discountSayart: '10', marginRama: '100', marginMetr: '150', marginSzklo: '150', marginTyl: '150',
        priceFloat: '60', priceAnty: '90', pricePlexi: '120', priceHdf: '25', priceKarton: '15'
      });
      return;
    }

    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      } else {
        const initial = {
          shopName: 'Twoja Pracownia', shopAddress: 'Uzupełnij adres', shopPhone: '', shopEmail: '',
          discountSayart: '10', marginRama: '100', marginMetr: '150', marginSzklo: '150', marginTyl: '150',
          priceFloat: '60', priceAnty: '90', pricePlexi: '120', priceHdf: '25', priceKarton: '15'
        };
        setDoc(profileRef, initial).catch(() => {});
        setSettings(initial);
      }
    }, (error) => {
      console.error("Profile Load Error:", error);
    });

    return () => unsubProfile();
  }, [user]);

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isLocalMock) {
        setUser({ uid: 'dev-123', email: email, isAnonymous: false } as User);
        setView('app');
        return;
      }

      if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setView('app');
    } catch (err: any) {
      setAuthError("Błąd autoryzacji: Sprawdź poprawność danych (hasło min. 6 znaków).");
    }
  };

  const handleSkipLogin = async () => {
    if (!isLocalMock) {
      try {
        await signInAnonymously(auth);
      } catch(e) {
        console.error("Anon Login Error", e);
      }
    } else {
      setUser({ uid: 'dev-anon', isAnonymous: true } as User);
    }
    setView('app');
  };

  if (!mounted || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center">
         <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] animate-spin mx-auto mb-6 flex items-center justify-center rotate-45 shadow-xl">
            <span className="text-white font-black text-3xl rotate-[-45deg] italic">S</span>
         </div>
         <p className="font-black uppercase tracking-[0.4em] text-[10px] text-slate-400">System Start...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-blue-500 selection:text-white pb-12">
      
      {/* EKRAN LOGOWANIA */}
      {(view === 'login' || view === 'register') && (
        <div className="fixed inset-0 bg-slate-900 z-[300] flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-center mb-8">
              <div className="bg-blue-600 w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-xl rotate-3">
                <span className="text-white text-4xl font-black italic">S</span>
              </div>
            </div>
            <h2 className="text-3xl font-black text-center text-slate-800 mb-2 uppercase tracking-tighter">Sayart Pro</h2>
            <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">Panel Wycen Ramiarza</p>
            
            <form onSubmit={handleManualAuth} className="space-y-4">
              {authError && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-bold text-center border border-red-100">{authError}</div>}
              
              <input type="email" placeholder="Adres E-mail" required className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium" value={email} onChange={e => setEmail(e.target.value)} />
              <input type="password" placeholder="Hasło" required className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium" value={password} onChange={e => setPassword(e.target.value)} />
              
              <button className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all uppercase text-[11px] tracking-widest active:scale-95">
                {view === 'login' ? 'Zaloguj Bezpiecznie' : 'Załóż Nowe Konto'}
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-3">
              <button onClick={() => setView(view === 'login' ? 'register' : 'login')} className="text-blue-600 text-[10px] font-black uppercase hover:underline underline-offset-4 transition-all">
                {view === 'login' ? 'Nie masz profilu? Utwórz konto' : 'Masz profil? Wróć do logowania'}
              </button>
              <div className="h-px w-full bg-slate-100 my-2" />
              <button onClick={handleSkipLogin} className="text-slate-400 hover:text-slate-600 text-[9px] font-black uppercase tracking-widest transition-all">
                Kontynuuj bez logowania (Tryb Demo)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GŁÓWNY WIDOK APLIKACJI */}
      {view === 'app' && (
        <div className="max-w-3xl mx-auto pt-8 px-4 animate-in fade-in duration-700">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-8 print:hidden">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl rotate-3">
                <span className="text-white text-3xl font-black italic">S</span>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Sayart Pro</h1>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                  {user?.isAnonymous || isLocalMock ? 'Tryb Lokalny (Offline)' : user?.email}
                </p>
              </div>
            </div>
            {(!user?.isAnonymous && !isLocalMock) && (
              <button onClick={() => { signOut(auth); setView('login'); }} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 bg-white px-5 py-3 rounded-xl shadow-sm transition-all active:scale-95">
                Wyloguj
              </button>
            )}
          </div>

          {/* GLÓWNY KOMPONENT */}
          {settings && (
            <Calculator 
              listwy={listwyDemo} 
              settings={settings} 
              user={user!}
              isMock={isLocalMock || user?.isAnonymous || false}
              onSaveSettings={(newS) => {
                if (isLocalMock || user?.isAnonymous) {
                   setSettings(newS);
                   return;
                }
                setDoc(doc(db, 'artifacts', appId, 'users', user!.uid, 'settings', 'profile'), newS)
                  .catch(e => console.error("Error saving settings", e));
              }}
            />
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 1.5cm; }
          body { background: white !important; }
          .min-h-screen { padding: 0 !important; background: white !important; }
          .max-w-3xl { max-width: 100% !important; }
          .print\\:hidden { display: none !important; }
          header, footer, details { display: none !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .print-document { font-family: sans-serif; }
      `}} />
    </div>
  );
}