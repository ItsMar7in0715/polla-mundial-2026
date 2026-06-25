import { useState, useEffect, useMemo, useRef } from 'react';
import { Users, Plus, BarChart3, Settings, Lock, CheckCircle, Clock, MapPin, Wifi, WifiOff, ShieldCheck, Calendar } from 'lucide-react';
import { db, FB_READY } from './src/firebase.js';
import { ref, onValue, set } from 'firebase/database';

// ── Partidos Jue 25 – Sáb 27 Jun 2026 · Fase de Grupos Jornada 3 ─────────────
//    Fuente: Flashscore / ESPN / FIFA

const MATCHES = [
  // ── Jueves 25 Jun — Grupos D · E · F ──────────────────────────────────────
  { id:'E1', date:'25/06', group:'E', home:'Curazao',      homeFlag:'🇨🇼', away:'Costa de Marfil', awayFlag:'🇨🇮', time:'15:00', venue:'Philadelphia'  },
  { id:'E2', date:'25/06', group:'E', home:'Ecuador',      homeFlag:'🇪🇨', away:'Alemania',         awayFlag:'🇩🇪', time:'15:00', venue:'Nueva Jersey'  },
  { id:'F1', date:'25/06', group:'F', home:'Japón',        homeFlag:'🇯🇵', away:'Suecia',           awayFlag:'🇸🇪', time:'18:00', venue:'Dallas'        },
  { id:'F2', date:'25/06', group:'F', home:'Túnez',        homeFlag:'🇹🇳', away:'Países Bajos',    awayFlag:'🇳🇱', time:'18:00', venue:'Kansas City'   },
  { id:'D1', date:'25/06', group:'D', home:'Paraguay',     homeFlag:'🇵🇾', away:'Australia',        awayFlag:'🇦🇺', time:'21:00', venue:'San Francisco' },
  { id:'D2', date:'25/06', group:'D', home:'Turquía',      homeFlag:'🇹🇷', away:'Estados Unidos',  awayFlag:'🇺🇸', time:'21:00', venue:'Los Ángeles'   },
  // ── Viernes 26 Jun — Grupos G · H · I ─────────────────────────────────────
  { id:'I1', date:'26/06', group:'I', home:'Noruega',      homeFlag:'🇳🇴', away:'Francia',          awayFlag:'🇫🇷', time:'14:00', venue:'Boston'        },
  { id:'I2', date:'26/06', group:'I', home:'Senegal',      homeFlag:'🇸🇳', away:'Irak',             awayFlag:'🇮🇶', time:'14:00', venue:'Toronto'       },
  { id:'H1', date:'26/06', group:'H', home:'Cabo Verde',   homeFlag:'🇨🇻', away:'Arabia Saudita',  awayFlag:'🇸🇦', time:'19:00', venue:'Houston'       },
  { id:'H2', date:'26/06', group:'H', home:'Uruguay',      homeFlag:'🇺🇾', away:'España',           awayFlag:'🇪🇸', time:'19:00', venue:'Guadalajara'   },
  { id:'G1', date:'26/06', group:'G', home:'Egipto',       homeFlag:'🇪🇬', away:'Irán',             awayFlag:'🇮🇷', time:'22:00', venue:'Seattle'       },
  { id:'G2', date:'26/06', group:'G', home:'Nueva Zelanda',homeFlag:'🇳🇿', away:'Bélgica',          awayFlag:'🇧🇪', time:'22:00', venue:'Vancouver'     },
  // ── Sábado 27 Jun — Grupos J · K · L ──────────────────────────────────────
  { id:'L1', date:'27/06', group:'L', home:'Croacia',      homeFlag:'🇭🇷', away:'Ghana',            awayFlag:'🇬🇭', time:'16:00', venue:'Philadelphia'  },
  { id:'L2', date:'27/06', group:'L', home:'Panamá',       homeFlag:'🇵🇦', away:'Inglaterra',       awayFlag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', time:'16:00', venue:'Nueva Jersey'  },
  { id:'K1', date:'27/06', group:'K', home:'Colombia',     homeFlag:'🇨🇴', away:'Portugal',         awayFlag:'🇵🇹', time:'18:30', venue:'Miami'         },
  { id:'K2', date:'27/06', group:'K', home:'RD Congo',     homeFlag:'🇨🇩', away:'Uzbekistán',       awayFlag:'🇺🇿', time:'18:30', venue:'Atlanta'       },
  { id:'J1', date:'27/06', group:'J', home:'Argelia',      homeFlag:'🇩🇿', away:'Austria',          awayFlag:'🇦🇹', time:'21:00', venue:'Kansas City'   },
  { id:'J2', date:'27/06', group:'J', home:'Jordania',     homeFlag:'🇯🇴', away:'Argentina',        awayFlag:'🇦🇷', time:'21:00', venue:'Dallas'        },
];

const DATES = [
  { key:'25/06', short:'Jue 25', label:'Jueves 25 Jun',  phase:'Grupos D · E · F' },
  { key:'26/06', short:'Vie 26', label:'Viernes 26 Jun', phase:'Grupos G · H · I' },
  { key:'27/06', short:'Sáb 27', label:'Sábado 27 Jun',  phase:'Grupos J · K · L' },
];

const COLORS    = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];
const DB_PATH   = 'polla_2026';
const LOCAL_KEY = 'polla_2026_v3';
const SID_KEY   = 'polla_participant_id';
const PIN       = '2026';

// ── Helpers ───────────────────────────────────────────────────────────────────

const dateMatches = (d) => MATCHES.filter(m => m.date === d);
const dateSlots   = (d) => [...new Set(dateMatches(d).map(m => m.time))].sort();

const getResult = (h, a) => {
  const ph = parseInt(h), pa = parseInt(a);
  if (isNaN(ph) || isNaN(pa)) return null;
  return ph > pa ? 'H' : pa > ph ? 'A' : 'D';
};

const calcScore = (pred, real) => {
  let pts = 0, exact = 0, correct = 0;
  MATCHES.forEach(({ id }) => {
    const r = real?.[id];
    const p = pred?.[id];
    if (!r || r.home == null || r.home === '' || r.away == null || r.away === '') return;
    if (!p || p.home == null || p.home === '' || p.away == null || p.away === '') return;
    const rr = getResult(r.home, r.away);
    const pr = getResult(p.home, p.away);
    if (!rr || !pr) return;
    if (+p.home === +r.home && +p.away === +r.away) { pts += 3; exact++; }
    else if (pr === rr) { pts += 1; correct++; }
  });
  return { pts, exact, correct };
};

const countFilled = (pred) =>
  MATCHES.filter(m => {
    const p = pred?.[m.id];
    return p?.home != null && p?.home !== '' && p?.away != null && p?.away !== '';
  }).length;

// ── Estilos ───────────────────────────────────────────────────────────────────

const glass    = 'bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl';
const numInput = (disabled) =>
  `border rounded-lg px-2 py-2 text-sm w-14 text-center font-black transition-colors focus:outline-none ${
    disabled
      ? 'bg-white/3 border-white/8 text-gray-600 cursor-not-allowed'
      : 'bg-white/10 border-white/20 text-white focus:border-green-400'
  }`;

// ── Componente ────────────────────────────────────────────────────────────────

export default function WorldCupPolla() {

  const [tab,          setTab]          = useState('inicio');
  const [participants, setParticipants] = useState({});
  const [predictions,  setPredictions]  = useState({});
  const [locked,       setLocked]       = useState({});
  const [real,         setReal]         = useState({});
  const [connected,    setConnected]    = useState(!FB_READY);
  const [isLoading,    setIsLoading]    = useState(FB_READY);
  const [current,      setCurrent]      = useState(null);
  const [draft,        setDraft]        = useState({});
  const [activeDate,   setActiveDate]   = useState('25/06');
  const [adminMode,    setAdminMode]    = useState(false);
  const [nameInput,    setNameInput]    = useState('');
  const [hClicks,      setHClicks]      = useState(0);
  const [pinModal,     setPinModal]     = useState(false);
  const [pin,          setPin]          = useState('');
  const [pinErr,       setPinErr]       = useState(false);
  const [toast,        setToast]        = useState('');
  const timerRef   = useRef(null);
  const initialRef = useRef(true);

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!FB_READY) {
      try {
        const saved = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
        if (saved.participants) setParticipants(saved.participants);
        if (saved.predictions)  setPredictions(saved.predictions);
        if (saved.locked)       setLocked(saved.locked);
        if (saved.real)         setReal(saved.real);
        const sid = sessionStorage.getItem(SID_KEY);
        if (sid && saved.participants?.[sid]) {
          setCurrent(saved.participants[sid]);
          if (!saved.locked?.[sid]) {
            try { const d = localStorage.getItem(`draft_${sid}`); if (d) setDraft(JSON.parse(d)); } catch {}
          }
          setTab('pronosticos');
        }
      } catch {}
      initialRef.current = false;
      return;
    }

    const unsub = onValue(ref(db, DB_PATH), (snap) => {
      setIsLoading(false); setConnected(true);
      const data = snap.val() || {};
      setParticipants(data.participants || {});
      setPredictions(data.predictions  || {});
      setLocked(data.locked           || {});
      setReal(data.real               || {});
      const sid = sessionStorage.getItem(SID_KEY);
      if (sid && data.participants?.[sid]) {
        setCurrent(data.participants[sid]);
        if (!data.locked?.[sid]) {
          try { const d = localStorage.getItem(`draft_${sid}`); if (d) setDraft(JSON.parse(d)); } catch {}
        }
        setTab(prev => prev === 'inicio' ? 'pronosticos' : prev);
      }
      initialRef.current = false;
    }, () => { setIsLoading(false); setConnected(false); });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (FB_READY || initialRef.current) return;
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ participants, predictions, locked, real }));
  }, [participants, predictions, locked, real]);

  // ── Toast ─────────────────────────────────────────────────────────────────

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(''), 3000);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const join = async () => {
    const name = nameInput.trim();
    if (!name) return;
    const existing = Object.values(participants).find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setCurrent(existing);
      sessionStorage.setItem(SID_KEY, existing.id);
      if (!locked[existing.id]) {
        try { const d = localStorage.getItem(`draft_${existing.id}`); setDraft(d ? JSON.parse(d) : {}); } catch { setDraft({}); }
      }
      setNameInput(''); setTab('pronosticos');
      showToast(`¡Bienvenido de vuelta, ${existing.name}! 👋`);
      return;
    }
    const id       = String(Date.now());
    const initials = name.split(' ').slice(0, 2).map(w => w[0].toUpperCase()).join('');
    const color    = COLORS[Object.keys(participants).length % COLORS.length];
    const newP     = { id, name, initials, color };
    if (FB_READY) await set(ref(db, `${DB_PATH}/participants/${id}`), newP);
    else setParticipants(prev => ({ ...prev, [id]: newP }));
    sessionStorage.setItem(SID_KEY, id);
    setCurrent(newP); setDraft({}); setNameInput(''); setTab('pronosticos');
    showToast('¡Bienvenido a la polla! 🎉');
  };

  const updateDraft = (matchId, field, value) => {
    if (!current || locked[current.id]) return;
    setDraft(prev => {
      const next = { ...prev, [matchId]: { ...(prev[matchId] ?? {}), [field]: value } };
      localStorage.setItem(`draft_${current.id}`, JSON.stringify(next));
      return next;
    });
  };

  const savePredictions = async () => {
    if (!current || locked[current.id]) return;
    if (FB_READY) {
      await set(ref(db, `${DB_PATH}/predictions/${current.id}`), draft);
      await set(ref(db, `${DB_PATH}/locked/${current.id}`), true);
    } else {
      setPredictions(prev => ({ ...prev, [current.id]: draft }));
      setLocked(prev     => ({ ...prev, [current.id]: true  }));
    }
    localStorage.removeItem(`draft_${current.id}`);
    showToast('🔒 Pronósticos guardados y bloqueados para siempre');
  };

  const setRealResult = async (matchId, field, value) => {
    if (FB_READY) await set(ref(db, `${DB_PATH}/real/${matchId}/${field}`), value);
    else setReal(prev => ({ ...prev, [matchId]: { ...(prev[matchId] ?? {}), [field]: value } }));
    showToast('Resultado actualizado ✓');
  };

  const handleHeaderClick = () => {
    const n = hClicks + 1;
    if (n >= 5) { setHClicks(0); setPinModal(true); } else setHClicks(n);
  };
  const checkPin = () => {
    if (pin === PIN) { setAdminMode(true); setPinModal(false); setPin(''); setPinErr(false); setTab('admin'); }
    else { setPinErr(true); setPin(''); }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const partList    = useMemo(() => Object.values(participants).sort((a,b) => Number(a.id)-Number(b.id)), [participants]);
  const isLocked    = current ? Boolean(locked[current.id]) : false;
  const myPred      = isLocked ? (predictions[current?.id] ?? {}) : draft;
  const filledCount = countFilled(draft);

  const leaderboard = useMemo(() =>
    partList.map(p => ({ ...p, ...calcScore(predictions[p.id] ?? {}, real) }))
            .sort((a,b) => b.pts - a.pts),
    [partList, predictions, real]
  );

  const hasRealResults = MATCHES.some(m => real[m.id]?.home != null && real[m.id]?.home !== '');

  const navTabs = [
    { id:'inicio',      label:'Inicio',      emoji:'🏠' },
    { id:'pronosticos', label:'Pronósticos', emoji:'⚽' },
    { id:'tabla',       label:'Tabla',       emoji:'📊' },
    ...(adminMode ? [{ id:'admin', label:'Admin', emoji:'🔐' }] : []),
  ];

  // ── Sub-componentes ───────────────────────────────────────────────────────

  const DateTabs = ({ value, onChange, compact }) => (
    <div className="flex gap-1 overflow-x-auto">
      {DATES.map(d => (
        <button key={d.key} onClick={() => onChange(d.key)}
          className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            value === d.key
              ? 'bg-green-500 text-black shadow-md'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}>
          {compact ? d.short : d.short}
        </button>
      ))}
    </div>
  );

  const MatchRow = ({ m, homeVal, awayVal, onHome, onAway, disabled, gold }) => (
    <div className={`rounded-xl overflow-hidden transition-colors ${disabled ? 'bg-white/2' : 'bg-white/5 hover:bg-white/8'}`}>
      <div className="flex items-center gap-2 p-3">
        <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
          <span className="text-gray-200 text-xs font-semibold truncate hidden sm:block">{m.home}</span>
          <span className="text-2xl flex-shrink-0">{m.homeFlag}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <input type="number" min="0" max="20" placeholder="0"
            value={homeVal ?? ''}
            onChange={e => !disabled && onHome?.(e.target.value)}
            readOnly={disabled}
            className={numInput(disabled)}
            style={gold && !disabled ? { borderColor:'rgba(245,158,11,0.5)' } : {}}
          />
          <span className="text-gray-500 font-black text-xl select-none">–</span>
          <input type="number" min="0" max="20" placeholder="0"
            value={awayVal ?? ''}
            onChange={e => !disabled && onAway?.(e.target.value)}
            readOnly={disabled}
            className={numInput(disabled)}
            style={gold && !disabled ? { borderColor:'rgba(245,158,11,0.5)' } : {}}
          />
        </div>
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <span className="text-2xl flex-shrink-0">{m.awayFlag}</span>
          <span className="text-gray-200 text-xs font-semibold truncate hidden sm:block">{m.away}</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1 pb-2 text-xs text-gray-600">
        <MapPin size={9}/> {m.venue} <span className="text-gray-700 mx-1">·</span> Gr. {m.group}
      </div>
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center text-white"
      style={{ background:'linear-gradient(160deg,#050b14 0%,#0b2010 45%,#060d1c 100%)' }}>
      <div className="text-center">
        <div className="text-6xl mb-4 inline-block" style={{ animation:'spin 1.5s linear infinite' }}>⚽</div>
        <p className="text-green-400 font-bold">Conectando…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-white"
      style={{ background:'linear-gradient(160deg,#050b14 0%,#0b2010 45%,#060d1c 100%)' }}>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        .slide-down { animation:slideDown 0.3s ease; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
      `}</style>

      {toast && (
        <div className="fixed top-4 right-4 z-50 slide-down bg-green-500 text-black font-bold px-4 py-2 rounded-xl shadow-xl text-sm flex items-center gap-2">
          <CheckCircle size={14}/> {toast}
        </div>
      )}

      {pinModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => { setPinModal(false); setPin(''); setPinErr(false); }}>
          <div className={`${glass} p-6 max-w-sm w-full mx-4 slide-down`}
            style={{ border:'1px solid rgba(245,158,11,0.5)' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="text-yellow-400 font-bold text-lg mb-1 flex items-center gap-2"><Lock size={18}/> Modo Juez</h3>
            <p className="text-gray-400 text-sm mb-4">PIN de administrador</p>
            <input type="password" placeholder="••••" value={pin}
              onChange={e => { setPin(e.target.value); setPinErr(false); }}
              onKeyDown={e => e.key==='Enter' && checkPin()}
              className={`w-full bg-white/10 border rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest mb-2 focus:outline-none ${pinErr?'border-red-500':'border-white/20 focus:border-yellow-400'}`}
            />
            {pinErr && <p className="text-red-400 text-xs text-center mb-2">PIN incorrecto</p>}
            <div className="flex gap-3 mt-2">
              <button onClick={() => { setPinModal(false); setPin(''); setPinErr(false); }}
                className="flex-1 py-2 rounded-xl border border-white/20 text-gray-400 hover:bg-white/5">Cancelar</button>
              <button onClick={checkPin} className="flex-1 py-2 rounded-xl font-bold text-black"
                style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)' }}>Ingresar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative py-8 px-4 text-center select-none overflow-hidden cursor-default"
        onClick={handleHeaderClick}>
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 44px,#22c55e 44px,#22c55e 45px),repeating-linear-gradient(90deg,transparent,transparent 44px,#22c55e 44px,#22c55e 45px)',
        }}/>
        <div className="relative z-10">
          <div className="text-6xl mb-2 inline-block"
            style={{ filter:'drop-shadow(0 0 24px #f59e0b)', animation:'float 3s ease-in-out infinite' }}>🏆</div>
          <h1 className="text-4xl font-black tracking-widest uppercase"
            style={{ color:'#f59e0b', textShadow:'0 0 40px rgba(245,158,11,0.5)' }}>Polla Mundial</h1>
          <p className="text-green-400 font-bold tracking-widest text-sm mt-1">USA · CANADÁ · MÉXICO 2026</p>
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-white/5 rounded-xl px-3 py-1.5 text-xs text-gray-400 border border-white/10">
              <Calendar size={11}/> Jornada Final Grupos · <strong className="text-white">25–27 Jun</strong>
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs border ${
              FB_READY && connected
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            }`}>
              {FB_READY && connected ? <><Wifi size={11}/> En línea · compartido</> : <><WifiOff size={11}/> Modo local</>}
            </span>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className="sticky top-0 z-40 px-4 py-2"
        style={{ background:'rgba(5,11,20,0.88)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-3xl mx-auto flex gap-1 overflow-x-auto items-center">
          {navTabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                tab===t.id ? 'bg-green-500 text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              <span>{t.emoji}</span><span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* ════════ INICIO ════════ */}
        {tab==='inicio' && (
          <>
            <div className={`${glass} p-6`}>
              <h2 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2"><Plus size={18}/> Unirse a la Polla</h2>
              <div className="flex gap-3">
                <input type="text" placeholder="Tu nombre o apodo…" value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && join()}
                  maxLength={30}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-400 transition-colors"
                />
                <button onClick={join} disabled={!nameInput.trim()}
                  className="px-6 py-3 rounded-xl font-bold text-black disabled:opacity-30 hover:opacity-90 active:scale-95 transition-all"
                  style={{ background:'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                  ¡Entrar!
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                💡 Si ya participaste antes, escribe el mismo nombre para retomar tus pronósticos.
              </p>
            </div>

            {/* Calendario de partidos por fecha */}
            <div className={`${glass} p-5`}>
              <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2">
                <Calendar size={15}/> Partidos · 25–27 Jun 2026
              </h3>
              <DateTabs value={activeDate} onChange={setActiveDate} />
              <div className="mt-3">
                {(() => {
                  const d = DATES.find(d => d.key === activeDate);
                  return (
                    <>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">{d?.phase}</p>
                      {dateSlots(activeDate).map(time => (
                        <div key={time} className="mb-3">
                          <div className="text-xs text-gray-600 font-semibold mb-1.5 flex items-center gap-1">
                            <Clock size={10}/> {time} COL/PER
                          </div>
                          {dateMatches(activeDate).filter(m => m.time===time).map(m => (
                            <div key={m.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5 mb-1">
                              <span className="font-semibold text-sm">{m.homeFlag} {m.home}</span>
                              <div className="text-center">
                                {real[m.id]?.home != null && real[m.id]?.home !== ''
                                  ? <span className="font-black text-white">{real[m.id].home} – {real[m.id].away}</span>
                                  : <span className="text-gray-600 text-xs font-bold">VS</span>
                                }
                              </div>
                              <span className="font-semibold text-sm">{m.away} {m.awayFlag}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Participantes */}
            {partList.length > 0 && (
              <div className={`${glass} p-5`}>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Users size={18} className="text-green-400"/>
                  Participantes <span className="text-gray-400 font-normal">({partList.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {partList.map(p => {
                    const { pts } = calcScore(predictions[p.id] ?? {}, real);
                    const pLocked = Boolean(locked[p.id]);
                    return (
                      <button key={p.id}
                        onClick={() => { setCurrent(p); setTab('pronosticos'); }}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left hover:scale-[1.01] ${
                          current?.id===p.id ? 'border-green-400 bg-green-400/10' : 'border-white/10 hover:border-white/25 hover:bg-white/5'
                        }`}>
                        <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm text-black flex-shrink-0"
                          style={{ background:p.color }}>{p.initials}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white truncate flex items-center gap-1.5">
                            {p.name} {pLocked && <Lock size={11} className="text-green-400 flex-shrink-0"/>}
                          </div>
                          <div className="text-xs text-gray-400">{pts} pts</div>
                        </div>
                        {pLocked
                          ? <span className="text-green-400 text-xs font-bold px-2 py-1 bg-green-400/10 rounded-lg whitespace-nowrap">Guardado</span>
                          : <span className="text-yellow-400 text-xs font-bold px-2 py-1 bg-yellow-400/10 rounded-lg whitespace-nowrap">Pendiente</span>
                        }
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={`${glass} p-4`}>
              <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-3">Sistema de Puntos</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label:'Marcador exacto',  sub:'Ej: 2-1 → pronosticaste 2-1', pts:'+3', color:'#22c55e' },
                  { label:'Ganador correcto', sub:'Victoria o empate acertado',   pts:'+1', color:'#3b82f6' },
                ].map(({ label, sub, pts, color }) => (
                  <div key={label} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-3">
                    <div>
                      <div className="text-white font-bold text-sm">{label}</div>
                      <div className="text-gray-500 text-xs">{sub}</div>
                    </div>
                    <span className="font-black text-2xl ml-3 flex-shrink-0" style={{ color }}>{pts}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ════════ PRONÓSTICOS ════════ */}
        {tab==='pronosticos' && (
          <>
            {!current ? (
              <div className={`${glass} p-10 text-center text-gray-400`}>
                <div className="text-5xl mb-3">👤</div>
                <p className="text-lg">Regístrate en <strong className="text-green-400">Inicio</strong> para hacer tus pronósticos.</p>
              </div>
            ) : (
              <>
                {/* Cabecera */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-black"
                      style={{ background:current.color }}>{current.initials}</div>
                    <div>
                      <div className="font-bold text-white">{current.name}</div>
                      <div className="text-xs text-gray-400">Mis pronósticos · {filledCount}/{MATCHES.length} completados</div>
                    </div>
                  </div>
                  {isLocked
                    ? <div className="flex items-center gap-2 bg-green-500/15 border border-green-500/30 rounded-xl px-4 py-2">
                        <ShieldCheck size={15} className="text-green-400"/>
                        <div>
                          <div className="text-green-400 font-bold text-sm">Bloqueados</div>
                          <div className="text-green-400/60 text-xs">No se pueden modificar</div>
                        </div>
                      </div>
                    : <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2">
                        <Clock size={14} className="text-yellow-400"/>
                        <div>
                          <div className="text-yellow-400 font-bold text-sm">Sin guardar</div>
                          <div className="text-yellow-400/60 text-xs">Guarda antes de que empiece</div>
                        </div>
                      </div>
                  }
                </div>

                {/* Selector de fecha */}
                <DateTabs value={activeDate} onChange={setActiveDate} />

                {/* Partidos del día seleccionado */}
                {(() => {
                  const d = DATES.find(d => d.key === activeDate);
                  return (
                    <div className={`${glass} p-4`}>
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div>
                          <div className="text-yellow-400 font-bold">{d?.label}</div>
                          <div className="text-gray-500 text-xs">{d?.phase}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {dateMatches(activeDate).filter(m => {
                            const p = myPred[m.id];
                            return p?.home != null && p?.home !== '' && p?.away != null && p?.away !== '';
                          }).length}/{dateMatches(activeDate).length} en este día
                        </div>
                      </div>
                      <div className="space-y-3">
                        {dateSlots(activeDate).map(time => (
                          <div key={time}>
                            <div className="text-xs text-gray-600 font-semibold mb-2 flex items-center gap-1">
                              <Clock size={10}/> {time} COL/PER
                            </div>
                            <div className="space-y-2">
                              {dateMatches(activeDate).filter(m => m.time===time).map(m => (
                                <MatchRow key={m.id} m={m}
                                  homeVal={myPred[m.id]?.home}
                                  awayVal={myPred[m.id]?.away}
                                  onHome={v => updateDraft(m.id,'home',v)}
                                  onAway={v => updateDraft(m.id,'away',v)}
                                  disabled={isLocked}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Botón guardar */}
                {!isLocked && (
                  <div className={`${glass} p-4`}>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <div>
                        <p className="text-white font-bold">¿Listo para guardar?</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          Una vez guardados, <strong className="text-red-400">no podrás modificar</strong> tus pronósticos.
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-xl" style={{ color: filledCount===MATCHES.length ? '#22c55e' : '#f59e0b' }}>
                          {filledCount}/{MATCHES.length}
                        </div>
                        <div className="text-xs text-gray-500">completados</div>
                      </div>
                    </div>

                    {filledCount < MATCHES.length && (
                      <div className="mb-3 text-xs text-gray-500 bg-white/3 rounded-xl p-3">
                        <p className="font-semibold text-yellow-400 mb-1">⚠️ Partidos sin pronosticar:</p>
                        <div className="grid grid-cols-3 gap-1">
                          {DATES.map(d => {
                            const missing = dateMatches(d.key).filter(m => {
                              const p = draft[m.id];
                              return !(p?.home != null && p?.home !== '' && p?.away != null && p?.away !== '');
                            }).length;
                            if (missing === 0) return null;
                            return (
                              <button key={d.key} onClick={() => setActiveDate(d.key)}
                                className="text-center bg-white/5 rounded-lg py-1.5 hover:bg-white/10 transition-colors">
                                <div className="text-yellow-400 font-black">{missing}</div>
                                <div className="text-gray-500 text-xs">{d.short}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={savePredictions}
                      disabled={filledCount === 0}
                      className="w-full py-4 rounded-xl font-black text-base transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                      style={filledCount > 0
                        ? { background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'black' }
                        : { background:'rgba(255,255,255,0.05)', color:'#6b7280' }}
                    >
                      <Lock size={18}/>
                      {filledCount === MATCHES.length
                        ? 'Guardar y bloquear pronósticos'
                        : `Guardar ${filledCount} pronóstico${filledCount!==1?'s':''} y bloquear`}
                    </button>
                    {filledCount > 0 && filledCount < MATCHES.length && (
                      <p className="text-center text-xs text-gray-500 mt-2">
                        Puedes guardar ahora — los {MATCHES.length - filledCount} restantes quedarán en blanco (0 pts).
                      </p>
                    )}
                  </div>
                )}

                {/* Resumen bloqueado */}
                {isLocked && (
                  <div className={`${glass} p-4`}>
                    <h3 className="text-green-400 font-bold text-sm mb-3 flex items-center gap-2">
                      <ShieldCheck size={14}/> Todos mis pronósticos
                    </h3>
                    {DATES.map(d => (
                      <div key={d.key} className="mb-4">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">{d.label} · {d.phase}</p>
                        <div className="space-y-1.5">
                          {dateMatches(d.key).map(m => {
                            const p = myPred[m.id];
                            const filled = p?.home != null && p?.home !== '' && p?.away != null && p?.away !== '';
                            return (
                              <div key={m.id} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                                <span className="text-xs text-gray-300">{m.homeFlag} {m.home}</span>
                                <span className="font-black text-sm mx-2" style={{ color: filled ? '#f59e0b' : '#374151' }}>
                                  {filled ? `${p.home} – ${p.away}` : '–'}
                                </span>
                                <span className="text-xs text-gray-300">{m.away} {m.awayFlag}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ════════ TABLA ════════ */}
        {tab==='tabla' && (
          <>
            <div className={`${glass} p-5`}>
              <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <BarChart3 size={20} className="text-green-400"/> Tabla de Posiciones
              </h2>
              {leaderboard.length === 0
                ? <div className="text-center py-14 text-gray-500"><div className="text-5xl mb-3">📊</div><p>Nadie se ha unido todavía.</p></div>
                : (
                <div className="space-y-2">
                  {leaderboard.map((p, idx) => (
                    <div key={p.id} className={`flex items-center gap-3 p-4 rounded-xl border ${
                      idx===0?'border-yellow-400/40 bg-yellow-400/8':idx===1?'border-gray-400/30 bg-gray-300/5':idx===2?'border-orange-700/30 bg-orange-800/5':'border-white/5 bg-white/2'
                    }`}>
                      <div className="w-9 text-center flex-shrink-0">
                        {idx===0?<span className="text-2xl">🥇</span>:idx===1?<span className="text-2xl">🥈</span>:idx===2?<span className="text-2xl">🥉</span>:<span className="text-gray-500 font-bold">{idx+1}</span>}
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-black flex-shrink-0"
                        style={{ background:p.color }}>{p.initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white truncate flex items-center gap-1.5">
                          {p.name}
                          {locked[p.id] ? <Lock size={11} className="text-green-400 flex-shrink-0"/> : <Clock size={11} className="text-yellow-400/50 flex-shrink-0"/>}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          <span className="text-green-400 font-bold">{p.exact}</span> exactos · <span className="text-blue-400 font-bold">{p.correct}</span> ganador
                          <span className="text-gray-600"> · {countFilled(predictions[p.id]||{})}/{MATCHES.length} pronósticos</span>
                        </div>
                      </div>
                      <div className="text-right"><div className="font-black text-2xl" style={{ color:'#f59e0b' }}>{p.pts}</div><div className="text-xs text-gray-500">pts</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {hasRealResults && (
              <div className={`${glass} p-4`}>
                <h3 className="text-green-400 font-bold mb-4">✅ Resultados Reales</h3>
                {DATES.map(d => {
                  const played = dateMatches(d.key).filter(m => real[m.id]?.home != null && real[m.id]?.home !== '');
                  if (!played.length) return null;
                  return (
                    <div key={d.key} className="mb-4">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">{d.label}</p>
                      <div className="space-y-2">
                        {played.map(m => (
                          <div key={m.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5">
                            <span className="text-sm font-semibold">{m.homeFlag} {m.home}</span>
                            <span className="font-black text-xl text-white px-3">{real[m.id].home} – {real[m.id].away}</span>
                            <span className="text-sm font-semibold">{m.away} {m.awayFlag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {partList.length > 0 && (
              <div className={`${glass} p-4`}>
                <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-3">Comparativa · {DATES.find(d=>d.key===activeDate)?.label}</h3>
                <DateTabs value={activeDate} onChange={setActiveDate} />
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left text-gray-500 pb-2 pr-3 font-semibold">Partido</th>
                        {hasRealResults && <th className="text-center text-gray-500 pb-2 px-2 font-semibold">Real</th>}
                        {partList.map(p => (
                          <th key={p.id} className="text-center pb-2 px-2">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="w-5 h-5 rounded-full inline-flex items-center justify-center font-black text-black text-xs" style={{ background:p.color }}>{p.initials}</span>
                              {locked[p.id] ? <Lock size={8} className="text-green-400"/> : <Clock size={8} className="text-yellow-400/50"/>}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dateMatches(activeDate).map(m => {
                        const r = real[m.id];
                        const hasR = r?.home != null && r?.home !== '';
                        return (
                          <tr key={m.id} className="border-t border-white/5">
                            <td className="py-2 pr-3 text-gray-300 whitespace-nowrap">{m.homeFlag} vs {m.awayFlag} <span className="text-gray-600 hidden sm:inline">Gr.{m.group}</span></td>
                            {hasRealResults && <td className="py-2 px-2 text-center font-black text-white">{hasR ? `${r.home}-${r.away}` : '–'}</td>}
                            {partList.map(p => {
                              const pred = predictions[p.id]?.[m.id];
                              const ok = pred?.home != null && pred?.home !== '' && pred?.away != null && pred?.away !== '';
                              let badge = '';
                              if (hasR && ok) {
                                const rr = getResult(r.home, r.away), pr = getResult(pred.home, pred.away);
                                if (+pred.home===+r.home && +pred.away===+r.away) badge='✅';
                                else if (pr===rr) badge='🟡';
                                else badge='❌';
                              }
                              return (
                                <td key={p.id} className="py-2 px-2 text-center">
                                  {ok
                                    ? <span className="text-gray-200">{pred.home}-{pred.away}{badge?` ${badge}`:''}</span>
                                    : locked[p.id]
                                      ? <span className="text-gray-600">–</span>
                                      : <span className="text-yellow-400/40">pend.</span>
                                  }
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {hasRealResults && <div className="mt-2 flex gap-3 text-xs text-gray-500"><span>✅ Exacto (+3)</span><span>🟡 Ganador (+1)</span><span>❌ Falló</span></div>}
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════ ADMIN ════════ */}
        {tab==='admin' && adminMode && (
          <>
            <div className={`${glass} p-5`} style={{ border:'1px solid rgba(245,158,11,0.4)' }}>
              <h2 className="text-xl font-bold text-yellow-400 mb-1 flex items-center gap-2"><Settings size={20}/> Panel del Juez</h2>
              <p className="text-gray-400 text-sm mb-4">Ingresa los resultados reales. Los puntos se recalculan al instante.</p>
              <DateTabs value={activeDate} onChange={setActiveDate} />
              <div className="mt-4 space-y-3">
                {dateSlots(activeDate).map(time => (
                  <div key={time}>
                    <div className="text-yellow-400/60 text-xs font-bold mb-2 flex items-center gap-1 uppercase tracking-wider">
                      <Clock size={10}/> {time} COL/PER
                    </div>
                    <div className="space-y-2">
                      {dateMatches(activeDate).filter(m => m.time===time).map(m => (
                        <MatchRow key={m.id} m={m} gold
                          homeVal={real[m.id]?.home}
                          awayVal={real[m.id]?.away}
                          onHome={v => setRealResult(m.id,'home',v)}
                          onAway={v => setRealResult(m.id,'away',v)}
                          disabled={false}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {leaderboard.length > 0 && (
              <div className={`${glass} p-4`} style={{ border:'1px solid rgba(245,158,11,0.2)' }}>
                <h3 className="text-yellow-400 font-bold mb-3 text-sm">Puntos en tiempo real</h3>
                <div className="space-y-2">
                  {leaderboard.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5">
                      <span className="text-gray-500 w-5">{idx+1}</span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-black" style={{ background:p.color }}>{p.initials}</div>
                      <span className="flex-1 text-white text-sm font-semibold">{p.name}</span>
                      <span className="font-black text-lg" style={{ color:'#f59e0b' }}>{p.pts} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => { setAdminMode(false); setTab('tabla'); }}
              className="w-full py-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 transition-all">
              Salir del modo Juez
            </button>
          </>
        )}

      </main>

      <footer className="text-center py-8 text-gray-600 text-xs">
        ⚽ Polla Mundial 2026 · 25–27 Jun · {FB_READY && connected ? 'Firebase sync' : 'Modo local'}
      </footer>
    </div>
  );
}
