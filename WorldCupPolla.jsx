import { useState, useEffect, useMemo, useRef } from 'react';
import { Users, Plus, BarChart3, Settings, Lock, CheckCircle, Clock, MapPin, Wifi, WifiOff, ShieldCheck, Calendar, Unlock, Edit3, Trash2 } from 'lucide-react';
import { db, FB_READY } from './src/firebase.js';
import { ref, onValue, set } from 'firebase/database';

// ── Partidos Jue 25 – Sáb 27 Jun 2026 · Fase de Grupos Jornada 3 ─────────────

const MATCHES = [
  { id:'E1', date:'25/06', group:'E', home:'Curazao',       away:'Costa de Marfil', time:'15:00', venue:'Philadelphia'  },
  { id:'E2', date:'25/06', group:'E', home:'Ecuador',       away:'Alemania',         time:'15:00', venue:'Nueva Jersey'  },
  { id:'F1', date:'25/06', group:'F', home:'Japón',         away:'Suecia',           time:'18:00', venue:'Dallas'        },
  { id:'F2', date:'25/06', group:'F', home:'Túnez',         away:'Países Bajos',    time:'18:00', venue:'Kansas City'   },
  { id:'D1', date:'25/06', group:'D', home:'Paraguay',      away:'Australia',        time:'21:00', venue:'San Francisco' },
  { id:'D2', date:'25/06', group:'D', home:'Turquía',       away:'Estados Unidos',  time:'21:00', venue:'Los Ángeles'   },
  { id:'I1', date:'26/06', group:'I', home:'Noruega',       away:'Francia',          time:'14:00', venue:'Boston'        },
  { id:'I2', date:'26/06', group:'I', home:'Senegal',       away:'Irak',             time:'14:00', venue:'Toronto'       },
  { id:'H1', date:'26/06', group:'H', home:'Cabo Verde',    away:'Arabia Saudita',  time:'19:00', venue:'Houston'       },
  { id:'H2', date:'26/06', group:'H', home:'Uruguay',       away:'España',           time:'19:00', venue:'Guadalajara'   },
  { id:'G1', date:'26/06', group:'G', home:'Egipto',        away:'Irán',             time:'22:00', venue:'Seattle'       },
  { id:'G2', date:'26/06', group:'G', home:'Nueva Zelanda', away:'Bélgica',          time:'22:00', venue:'Vancouver'     },
  { id:'L1', date:'27/06', group:'L', home:'Croacia',       away:'Ghana',            time:'16:00', venue:'Philadelphia'  },
  { id:'L2', date:'27/06', group:'L', home:'Panamá',        away:'Inglaterra',       time:'16:00', venue:'Nueva Jersey'  },
  { id:'K1', date:'27/06', group:'K', home:'Colombia',      away:'Portugal',         time:'18:30', venue:'Miami'         },
  { id:'K2', date:'27/06', group:'K', home:'RD Congo',      away:'Uzbekistán',       time:'18:30', venue:'Atlanta'       },
  { id:'J1', date:'27/06', group:'J', home:'Argelia',       away:'Austria',          time:'21:00', venue:'Kansas City'   },
  { id:'J2', date:'27/06', group:'J', home:'Jordania',      away:'Argentina',        time:'21:00', venue:'Dallas'        },
  // ── 16avos de Final · 28 Jun – 3 Jul 2026 ────────────────────────────────
  { id:'R01', date:'28/06', round:'16avos', home:'Sudáfrica',            away:'Canadá',               time:'14:00', venue:'SoFi Stadium, L.A.'   },
  { id:'R02', date:'29/06', round:'16avos', home:'Brasil',               away:'Japón',                time:'12:00', venue:'NRG Stadium, Houston'  },
  { id:'R03', date:'29/06', round:'16avos', home:'Alemania',             away:'Paraguay',             time:'15:30', venue:'Gillette Stadium, Boston'},
  { id:'R04', date:'29/06', round:'16avos', home:'Países Bajos',         away:'Marruecos',            time:'20:00', venue:'Est. BBVA, Monterrey'  },
  { id:'R05', date:'30/06', round:'16avos', home:'Costa de Marfil',      away:'Noruega',              time:'12:00', venue:'Cotton Bowl, Dallas'   },
  { id:'R06', date:'30/06', round:'16avos', home:'Francia',              away:'Suecia',               time:'16:00', venue:'MetLife, Nueva Jersey' },
  { id:'R07', date:'30/06', round:'16avos', home:'México',               away:'Ecuador',              time:'20:00', venue:'Est. Azteca, México'   },
  { id:'R08', date:'01/07', round:'16avos', home:'Inglaterra',           away:'RD Congo',             time:'11:00', venue:'Mercedes-Benz, Atlanta'},
  { id:'R09', date:'01/07', round:'16avos', home:'Bélgica',              away:'Senegal',              time:'15:00', venue:'Lumen Field, Seattle'  },
  { id:'R10', date:'01/07', round:'16avos', home:'Estados Unidos',       away:'Bosnia y Herzegovina', time:'19:00', venue:'Levi\'s Stadium, S.J.' },
  { id:'R11', date:'02/07', round:'16avos', home:'España',               away:'Austria',              time:'14:00', venue:'SoFi Stadium, L.A.'   },
  { id:'R12', date:'02/07', round:'16avos', home:'Portugal',             away:'Croacia',              time:'18:00', venue:'BMO Field, Toronto'    },
  { id:'R13', date:'02/07', round:'16avos', home:'Suiza',                away:'Argelia',              time:'22:00', venue:'BC Place, Vancouver'   },
  { id:'R14', date:'03/07', round:'16avos', home:'Australia',            away:'Egipto',               time:'13:00', venue:'AT&T Stadium, Dallas'  },
  { id:'R15', date:'03/07', round:'16avos', home:'Argentina',            away:'Cabo Verde',           time:'17:00', venue:'Hard Rock, Miami'      },
  { id:'R16', date:'03/07', round:'16avos', home:'Colombia',             away:'Ghana',                time:'20:30', venue:'Arrowhead, Kansas City'},
];

const FLAG = {
  'Curazao':       'cw', 'Costa de Marfil': 'ci', 'Ecuador':       'ec',
  'Alemania':      'de', 'Japón':           'jp', 'Suecia':        'se',
  'Túnez':         'tn', 'Países Bajos':    'nl', 'Paraguay':      'py',
  'Australia':     'au', 'Turquía':         'tr', 'Estados Unidos':'us',
  'Noruega':       'no', 'Francia':         'fr', 'Senegal':       'sn',
  'Irak':          'iq', 'Cabo Verde':      'cv', 'Arabia Saudita':'sa',
  'Uruguay':       'uy', 'España':          'es', 'Egipto':        'eg',
  'Irán':          'ir', 'Nueva Zelanda':   'nz', 'Bélgica':       'be',
  'Croacia':       'hr', 'Ghana':           'gh', 'Panamá':        'pa',
  'Inglaterra':  'gb-eng','Colombia':       'co', 'Portugal':      'pt',
  'RD Congo':      'cd', 'Uzbekistán':      'uz', 'Argelia':       'dz',
  'Austria':       'at', 'Jordania':        'jo', 'Argentina':     'ar',
  // 16avos de final
  'Canadá':        'ca', 'Sudáfrica':       'za', 'Brasil':        'br',
  'Marruecos':     'ma', 'México':          'mx', 'Bosnia y Herzegovina':'ba',
  'Suiza':         'ch',
};

// Abreviatura corta para el bracket (código de bandera en mayúsculas)
const teamAbbr = (team) => {
  const code = FLAG[team];
  if (!code) return team ? team.slice(0, 3).toUpperCase() : '?';
  const c = code.includes('-') ? code.split('-')[1] : code;
  return c.toUpperCase();
};

const FlagImg = ({ team, size = 28 }) => {
  const code = FLAG[team];
  if (!code) return <span className="text-gray-500 text-xs">{team?.[0]}</span>;
  return (
    <img src={`${import.meta.env.BASE_URL}flags/${code}.svg`} alt={team}
      width={size} height={Math.round(size * 0.67)}
      style={{ objectFit:'cover', borderRadius:2, flexShrink:0, display:'inline-block' }}/>
  );
};

const DATES = [
  { key:'25/06', short:'Jue 25', label:'Jueves 25 Jun',     phase:'Grupos D · E · F' },
  { key:'26/06', short:'Vie 26', label:'Viernes 26 Jun',    phase:'Grupos G · H · I' },
  { key:'27/06', short:'Sáb 27', label:'Sábado 27 Jun',     phase:'Grupos J · K · L' },
  { key:'28/06', short:'Sáb 28', label:'Sábado 28 Jun',     phase:'16avos de Final'  },
  { key:'29/06', short:'Dom 29', label:'Domingo 29 Jun',    phase:'16avos de Final'  },
  { key:'30/06', short:'Lun 30', label:'Lunes 30 Jun',      phase:'16avos de Final'  },
  { key:'01/07', short:'Mar 1',  label:'Martes 1 Jul',      phase:'16avos de Final'  },
  { key:'02/07', short:'Mié 2',  label:'Miércoles 2 Jul',   phase:'16avos de Final'  },
  { key:'03/07', short:'Jue 3',  label:'Jueves 3 Jul',      phase:'16avos de Final'  },
];

// ── Llave eliminatoria (Octavos → Final) ─────────────────────────────────────
// home/away son referencias dinámicas: { src: matchId, side: 'winner'|'loser' }
const BRACKET_MATCHES = [
  // Octavos de Final · 4-7 Jul
  { id:'Q01', date:'04/07', round:'Octavos', time:'18:00', venue:'Houston',      home:{src:'R01',side:'winner'}, away:{src:'R04',side:'winner'} },
  { id:'Q02', date:'04/07', round:'Octavos', time:'23:00', venue:'Filadelfia',   home:{src:'R03',side:'winner'}, away:{src:'R06',side:'winner'} },
  { id:'Q03', date:'05/07', round:'Octavos', time:'17:00', venue:'NJ (MetLife)', home:{src:'R02',side:'winner'}, away:{src:'R05',side:'winner'} },
  { id:'Q04', date:'05/07', round:'Octavos', time:'23:00', venue:'México DF',    home:{src:'R07',side:'winner'}, away:{src:'R08',side:'winner'} },
  { id:'Q05', date:'06/07', round:'Octavos', time:'17:00', venue:'Dallas',       home:{src:'R12',side:'winner'}, away:{src:'R11',side:'winner'} },
  { id:'Q06', date:'06/07', round:'Octavos', time:'23:00', venue:'Seattle',      home:{src:'R10',side:'winner'}, away:{src:'R09',side:'winner'} },
  { id:'Q07', date:'07/07', round:'Octavos', time:'17:00', venue:'Miami',        home:{src:'R15',side:'winner'}, away:{src:'R14',side:'winner'} },
  { id:'Q08', date:'07/07', round:'Octavos', time:'23:00', venue:'Vancouver',    home:{src:'R13',side:'winner'}, away:{src:'R16',side:'winner'} },
  // Cuartos de Final · 9-11 Jul
  { id:'C01', date:'09/07', round:'Cuartos', time:'18:00', venue:'TBD', home:{src:'Q01',side:'winner'}, away:{src:'Q02',side:'winner'} },
  { id:'C02', date:'10/07', round:'Cuartos', time:'18:00', venue:'TBD', home:{src:'Q03',side:'winner'}, away:{src:'Q04',side:'winner'} },
  { id:'C03', date:'11/07', round:'Cuartos', time:'18:00', venue:'TBD', home:{src:'Q05',side:'winner'}, away:{src:'Q06',side:'winner'} },
  { id:'C04', date:'11/07', round:'Cuartos', time:'18:00', venue:'TBD', home:{src:'Q07',side:'winner'}, away:{src:'Q08',side:'winner'} },
  // Semifinales · 14-15 Jul
  { id:'S01', date:'14/07', round:'Semis', time:'18:00', venue:'TBD', home:{src:'C01',side:'winner'}, away:{src:'C02',side:'winner'} },
  { id:'S02', date:'15/07', round:'Semis', time:'18:00', venue:'TBD', home:{src:'C03',side:'winner'}, away:{src:'C04',side:'winner'} },
  // Final y 3er Lugar · 18-19 Jul
  { id:'FIN', date:'19/07', round:'Final',     time:'18:00', venue:'MetLife, NJ', home:{src:'S01',side:'winner'}, away:{src:'S02',side:'winner'} },
  { id:'BRO', date:'18/07', round:'3er Lugar', time:'18:00', venue:'TBD',         home:{src:'S01',side:'loser'},  away:{src:'S02',side:'loser'}  },
];

// Resuelve el nombre del equipo que avanzó (o perdió) en un partido dado
const getMatchWinner = (matchId, homeTeam, awayTeam, real) => {
  const r = real?.[matchId];
  if (!r) return null;
  if (r.winner === 'home') return homeTeam;
  if (r.winner === 'away') return awayTeam;
  const h = parseInt(r.home), a = parseInt(r.away);
  if (!isNaN(h) && !isNaN(a) && r.home !== '' && r.away !== '') {
    if (h > a) return homeTeam;
    if (a > h) return awayTeam;
  }
  return null;
};

const resolveTeam = (srcId, side, real) => {
  const m = MATCHES.find(x => x.id === srcId);
  if (m) {
    if (side === 'winner') return getMatchWinner(srcId, m.home, m.away, real);
    if (side === 'loser') {
      const w = getMatchWinner(srcId, m.home, m.away, real);
      return w ? (w === m.home ? m.away : m.home) : null;
    }
    return side === 'home' ? m.home : m.away;
  }
  const bm = BRACKET_MATCHES.find(x => x.id === srcId);
  if (!bm) return null;
  const homeTeam = resolveTeam(bm.home.src, bm.home.side, real);
  const awayTeam = resolveTeam(bm.away.src, bm.away.side, real);
  if (side === 'winner') return getMatchWinner(srcId, homeTeam, awayTeam, real);
  if (side === 'loser') {
    const w = getMatchWinner(srcId, homeTeam, awayTeam, real);
    return w ? (w === homeTeam ? awayTeam : homeTeam) : null;
  }
  return side === 'home' ? homeTeam : awayTeam;
};

// Fechas adicionales para la fase eliminatoria (pronósticos)
const BRACKET_DATES = [
  { key:'04/07', short:'Oct 4',   label:'Octavos · 4 Jul',    phase:'Octavos de Final' },
  { key:'05/07', short:'Oct 5',   label:'Octavos · 5 Jul',    phase:'Octavos de Final' },
  { key:'06/07', short:'Oct 6',   label:'Octavos · 6 Jul',    phase:'Octavos de Final' },
  { key:'07/07', short:'Oct 7',   label:'Octavos · 7 Jul',    phase:'Octavos de Final' },
  { key:'09/07', short:'Cto 9',   label:'Cuartos · 9 Jul',    phase:'Cuartos de Final' },
  { key:'10/07', short:'Cto 10',  label:'Cuartos · 10 Jul',   phase:'Cuartos de Final' },
  { key:'11/07', short:'Cto 11',  label:'Cuartos · 11 Jul',   phase:'Cuartos de Final' },
  { key:'14/07', short:'SF 14',   label:'Semis · 14 Jul',     phase:'Semifinal'        },
  { key:'15/07', short:'SF 15',   label:'Semis · 15 Jul',     phase:'Semifinal'        },
  { key:'18/07', short:'3° Lug',  label:'3er Lugar · 18 Jul', phase:'3er Lugar'        },
  { key:'19/07', short:'🏆Final', label:'🏆 FINAL · 19 Jul',  phase:'FINAL'            },
];
const ALL_PRED_DATES = [...DATES, ...BRACKET_DATES];

const COLORS  = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];
const DB_PATH = 'polla_2026';
const PRIZES  = [400000, 100000, 50000];

const formatPeso = (n) => '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// Calcula premios por RANGO único de puntos:
// - Cada grupo con la misma puntuación recibe el premio de SU rango (no la suma de rangos ocupados).
// - Si 1° empata entre 2, ambos dividen SOLO el premio de 1° y el de 2° pasa íntegro al siguiente grupo.
// - Si 3° empata con un 4°, ambos dividen el premio de 3° aunque haya 4 participantes.
const calcPrizes = (board) => {
  const out = {};
  let rank = 0; // índice en PRIZES — avanza una vez por grupo único, no por persona
  let i = 0;
  while (i < board.length && rank < PRIZES.length) {
    const pts = board[i].pts;
    let j = i;
    // Encontrar TODOS los empatados (puede superar PRIZES.length en cantidad de personas)
    while (j < board.length && board[j].pts === pts) j++;
    const share = PRIZES[rank] / (j - i);
    for (let k = i; k < j; k++) out[board[k].id] = { amount: share, count: j - i };
    rank++;
    i = j;
  }
  return out;
};
const LOCAL_KEY = 'polla_2026_v3';
const SID_KEY   = 'polla_participant_id';
const PIN       = '2478';

// ── Helpers ───────────────────────────────────────────────────────────────────

const toFbKey  = (date) => date.replace('/', '_');
const fromDate = (date) => MATCHES.filter(m => m.date === date);
const slotsFor = (date) => [...new Set(fromDate(date).map(m => m.time))].sort();

// Un partido está bloqueado si el usuario lo bloqueó (por matchId) o si existe
// el formato legado de bloqueo por día (toFbKey(date)).
const isMatchLocked = (locked, pid, matchId) => {
  const l = locked[pid];
  if (!l) return false;
  if (l === true) return true;
  if (l[matchId]) return true;
  const m = MATCHES.find(x => x.id === matchId);
  return m ? Boolean(l[toFbKey(m.date)]) : false;
};

// Un día está "completamente bloqueado" cuando todos sus partidos lo están.
const isDateFullyLocked = (locked, pid, date) =>
  fromDate(date).every(m => isMatchLocked(locked, pid, m.id));

// Mantener alias para compatibilidad con comparativa/tabla
const isDateLocked = isDateFullyLocked;

const getResult = (h, a) => {
  const ph = parseInt(h), pa = parseInt(a);
  if (isNaN(ph) || isNaN(pa)) return null;
  return ph > pa ? 'H' : pa > ph ? 'A' : 'D';
};

const calcScore = (pred, real) => {
  let pts = 0, exact = 0, correct = 0;
  [...MATCHES, ...BRACKET_MATCHES].forEach(({ id }) => {
    const r = real?.[id]; const p = pred?.[id];
    if (r?.home == null || r?.home === '') return;
    if (p?.home == null || p?.home === '') return;
    const rr = getResult(r.home, r.away), pr = getResult(p.home, p.away);
    if (!rr || !pr) return;
    if (+p.home === +r.home && +p.away === +r.away) { pts += 3; exact++; }
    else if (pr === rr) { pts += 1; correct++; }
  });
  return { pts, exact, correct };
};

const filledForDate = (pred, date) =>
  fromDate(date).filter(m => {
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
  const [dayLocked,    setDayLocked]    = useState({});
  const [mLocked,      setMlocked]      = useState({});
  const [real,         setReal]         = useState({});
  const [connected,    setConnected]    = useState(!FB_READY);
  const [isLoading,    setIsLoading]    = useState(FB_READY);
  const [current,      setCurrent]      = useState(null);
  const [draft,        setDraft]        = useState({});
  const [activeDate,   setActiveDate]   = useState('03/07');
  const [adminMode,    setAdminMode]    = useState(false);
  const [adminSection, setAdminSection] = useState('results'); // 'results' | 'days' | 'users'
  const [adminEditPid,      setAdminEditPid]      = useState('');
  const [adminDraft,        setAdminDraft]        = useState({});
  const [confirmDeletePid,  setConfirmDeletePid]  = useState('');
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
    const loadDraft = (sid) => {
      try { const d = localStorage.getItem(`draft_${sid}`); if (d) setDraft(JSON.parse(d)); } catch {}
    };

    if (!FB_READY) {
      try {
        const saved = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
        if (saved.participants) setParticipants(saved.participants);
        if (saved.predictions)  setPredictions(saved.predictions);
        if (saved.locked)       setLocked(saved.locked);
        if (saved.dayLocked)    setDayLocked(saved.dayLocked);
        if (saved.matchLocked)  setMlocked(saved.matchLocked);
        if (saved.real)         setReal(saved.real);
        const sid = sessionStorage.getItem(SID_KEY);
        if (sid && saved.participants?.[sid]) {
          setCurrent(saved.participants[sid]);
          loadDraft(sid);
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
      setDayLocked(data.dayLocked     || {});
      setMlocked(data.matchLocked     || {});
      setReal(data.real               || {});
      const sid = sessionStorage.getItem(SID_KEY);
      if (sid && data.participants?.[sid]) {
        setCurrent(data.participants[sid]);
        loadDraft(sid);
        setTab(prev => prev === 'inicio' ? 'pronosticos' : prev);
      }
      initialRef.current = false;
    }, () => { setIsLoading(false); setConnected(false); });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (FB_READY || initialRef.current) return;
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ participants, predictions, locked, dayLocked, matchLocked: mLocked, real }));
  }, [participants, predictions, locked, dayLocked, real]);

  // ── Toast ─────────────────────────────────────────────────────────────────

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(''), 3200);
  };

  // ── Helpers de estado ─────────────────────────────────────────────────────

  const isDayLocked          = (date)    => Boolean(dayLocked[toFbKey(date)]);
  const isAdminMatchLocked   = (matchId) => Boolean(mLocked[matchId]);
  const isBlockedForUser     = (matchId, date) =>
    isDayLocked(date) || isAdminMatchLocked(matchId) ||
    (current ? isMatchLocked(locked, current.id, matchId) : false);

  // Para mostrar: usa Firebase si el partido está bloqueado de alguna forma, draft si no
  const getPred = (matchId) => {
    if (!current) return {};
    const m = MATCHES.find(x => x.id === matchId) ?? BRACKET_MATCHES.find(x => x.id === matchId);
    if (!m) return {};
    if (isDayLocked(m.date) || isAdminMatchLocked(matchId) || isMatchLocked(locked, current.id, matchId))
      return predictions[current.id]?.[matchId] ?? {};
    return draft[matchId] ?? {};
  };

  // ── Handlers usuarios ─────────────────────────────────────────────────────

  const join = async () => {
    const name = nameInput.trim();
    if (!name) return;
    const existing = Object.values(participants).find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setCurrent(existing);
      sessionStorage.setItem(SID_KEY, existing.id);
      try { const d = localStorage.getItem(`draft_${existing.id}`); setDraft(d ? JSON.parse(d) : {}); } catch { setDraft({}); }
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
    if (!current) return;
    const m = MATCHES.find(x => x.id === matchId) ?? BRACKET_MATCHES.find(x => x.id === matchId);
    if (!m || isBlockedForUser(matchId, m.date)) return;
    setDraft(prev => {
      const next = { ...prev, [matchId]: { ...(prev[matchId] ?? {}), [field]: value } };
      localStorage.setItem(`draft_${current.id}`, JSON.stringify(next));
      return next;
    });
  };

  // Bloquea un único partido
  const saveMatchPrediction = async (matchId) => {
    if (!current) return;
    const m = MATCHES.find(x => x.id === matchId) ?? BRACKET_MATCHES.find(x => x.id === matchId);
    if (!m || isBlockedForUser(matchId, m.date)) return;
    const pred = draft[matchId];
    if (pred?.home == null || pred?.home === '' || pred?.away == null || pred?.away === '') return;
    if (FB_READY) {
      await set(ref(db, `${DB_PATH}/predictions/${current.id}/${matchId}`), pred);
      await set(ref(db, `${DB_PATH}/locked/${current.id}/${matchId}`), true);
    } else {
      setPredictions(prev => ({ ...prev, [current.id]: { ...(prev[current.id] ?? {}), [matchId]: pred } }));
      setLocked(prev => ({
        ...prev,
        [current.id]: { ...(typeof prev[current.id]==='object' ? prev[current.id] : {}), [matchId]: true },
      }));
    }
    showToast(`🔒 ${m.home} vs ${m.away} bloqueado`);
  };

  // Bloquea solo los partidos pendientes que tienen pronóstico en draft
  const saveDatePredictions = async (date) => {
    if (!current || isDayLocked(date)) return;
    const toSave = getMatchesForDate(date).filter(m => {
      if (isBlockedForUser(m.id, date)) return false;
      const p = draft[m.id];
      return p?.home != null && p?.home !== '' && p?.away != null && p?.away !== '';
    });
    if (!toSave.length) return;
    const merged = { ...(predictions[current.id] ?? {}) };
    toSave.forEach(m => { merged[m.id] = draft[m.id]; });
    if (FB_READY) {
      await set(ref(db, `${DB_PATH}/predictions/${current.id}`), merged);
      for (const m of toSave) {
        await set(ref(db, `${DB_PATH}/locked/${current.id}/${m.id}`), true);
      }
    } else {
      setPredictions(prev => ({ ...prev, [current.id]: merged }));
      const perMatch = {};
      toSave.forEach(m => { perMatch[m.id] = true; });
      setLocked(prev => ({
        ...prev,
        [current.id]: { ...(typeof prev[current.id]==='object' ? prev[current.id] : {}), ...perMatch },
      }));
    }
    showToast(`🔒 ${toSave.length} partido${toSave.length!==1?'s':''} bloqueado${toSave.length!==1?'s':''}`);
  };

  // ── Handlers admin ────────────────────────────────────────────────────────

  const setRealResult = async (matchId, field, value) => {
    if (FB_READY) await set(ref(db, `${DB_PATH}/real/${matchId}/${field}`), value);
    else setReal(prev => ({ ...prev, [matchId]: { ...(prev[matchId] ?? {}), [field]: value } }));
    showToast('Resultado actualizado ✓');
  };

  const toggleDayLock = async (date) => {
    const dk = toFbKey(date);
    const now = !isDayLocked(date);
    if (FB_READY) await set(ref(db, `${DB_PATH}/dayLocked/${dk}`), now || null);
    else setDayLocked(prev => { const n={...prev}; if(now) n[dk]=true; else delete n[dk]; return n; });
    showToast(now ? `🔒 ${ALL_PRED_DATES.find(d=>d.key===date)?.label} bloqueado para todos` : `🔓 ${ALL_PRED_DATES.find(d=>d.key===date)?.label} desbloqueado`);
  };

  const toggleMatchLockAdmin = async (matchId) => {
    const now = !mLocked[matchId];
    const m = MATCHES.find(x => x.id === matchId) ?? resolvedBracketMatches.find(x => x.id === matchId);
    if (FB_READY) await set(ref(db, `${DB_PATH}/matchLocked/${matchId}`), now || null);
    else setMlocked(prev => { const n={...prev}; if(now) n[matchId]=true; else delete n[matchId]; return n; });
    showToast(now ? `🔒 ${m?.home} vs ${m?.away} bloqueado` : `🔓 ${m?.home} vs ${m?.away} desbloqueado`);
  };

  // Desbloquea todos los partidos de un día para un participante específico
  const adminUnlockUserDay = async (pid, date) => {
    if (FB_READY) {
      for (const m of getMatchesForDate(date)) {
        await set(ref(db, `${DB_PATH}/locked/${pid}/${m.id}`), null);
      }
      // Limpiar también el formato legado de día si existe
      await set(ref(db, `${DB_PATH}/locked/${pid}/${toFbKey(date)}`), null);
    } else {
      setLocked(prev => {
        const next = { ...prev, [pid]: { ...(prev[pid] ?? {}) } };
        getMatchesForDate(date).forEach(m => { delete next[pid][m.id]; });
        delete next[pid][toFbKey(date)];
        return next;
      });
    }
    showToast(`🔓 ${participants[pid]?.name} desbloqueado para ${ALL_PRED_DATES.find(d=>d.key===date)?.label}`);
  };

  const loadAdminUser = (pid) => {
    setAdminEditPid(pid);
    setAdminDraft({ ...(predictions[pid] ?? {}) });
    setConfirmDeletePid('');
  };

  const deleteParticipant = async (pid) => {
    const name = participants[pid]?.name;
    if (FB_READY) {
      await set(ref(db, `${DB_PATH}/participants/${pid}`), null);
      await set(ref(db, `${DB_PATH}/predictions/${pid}`), null);
      await set(ref(db, `${DB_PATH}/locked/${pid}`), null);
    } else {
      setParticipants(prev => { const n = {...prev}; delete n[pid]; return n; });
      setPredictions(prev => { const n = {...prev}; delete n[pid]; return n; });
      setLocked(prev => { const n = {...prev}; delete n[pid]; return n; });
    }
    if (adminEditPid === pid) setAdminEditPid('');
    if (current?.id === pid) { setCurrent(null); sessionStorage.removeItem(SID_KEY); }
    setConfirmDeletePid('');
    showToast(`🗑️ ${name} eliminado`);
  };

  const updateAdminDraft = (matchId, field, value) => {
    setAdminDraft(prev => ({ ...prev, [matchId]: { ...(prev[matchId] ?? {}), [field]: value } }));
  };

  const saveAdminUserPreds = async (date) => {
    if (!adminEditPid) return;
    const merged = { ...(predictions[adminEditPid] ?? {}) };
    getMatchesForDate(date).forEach(m => { if (adminDraft[m.id]) merged[m.id] = adminDraft[m.id]; });
    if (FB_READY) await set(ref(db, `${DB_PATH}/predictions/${adminEditPid}`), merged);
    else setPredictions(prev => ({ ...prev, [adminEditPid]: merged }));
    showToast(`Pronósticos de ${participants[adminEditPid]?.name} actualizados ✓`);
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

  // Bracket matches con equipos resueltos dinámicamente desde real[]
  const resolvedBracketMatches = useMemo(() =>
    BRACKET_MATCHES.map(bm => ({
      ...bm,
      home: resolveTeam(bm.home.src, bm.home.side, real) ?? `G.${bm.home.src}`,
      away: resolveTeam(bm.away.src, bm.away.side, real) ?? `G.${bm.away.src}`,
    })), [real]);

  // Retorna los partidos de una fecha — MATCHES para grupos/16avos, bracket para el resto
  const getMatchesForDate = (date) => {
    if (DATES.some(d => d.key === date)) return fromDate(date);
    return resolvedBracketMatches.filter(m => m.date === date);
  };

  // Como isDateFullyLocked pero soporta también fechas de la llave eliminatoria
  const isDateFullyLockedFor = (pid, date) => {
    const dm = getMatchesForDate(date);
    return dm.length > 0 && dm.every(m => isMatchLocked(locked, pid, m.id));
  };

  const partList = useMemo(() => Object.values(participants).sort((a,b) => Number(a.id)-Number(b.id)), [participants]);

  const leaderboard = useMemo(() =>
    partList.map(p => ({ ...p, ...calcScore(predictions[p.id] ?? {}, real) }))
            .sort((a,b) => b.pts - a.pts),
    [partList, predictions, real]
  );

  const hasRealResults = [...MATCHES, ...BRACKET_MATCHES].some(m => real[m.id]?.home != null && real[m.id]?.home !== '');

  const navTabs = [
    { id:'inicio',      label:'Inicio',      emoji:'🏠' },
    { id:'pronosticos', label:'Pronósticos', emoji:'⚽' },
    { id:'tabla',       label:'Tabla',       emoji:'📊' },
    { id:'llave',       label:'Llave',       emoji:'🏆' },
    ...(adminMode ? [{ id:'admin', label:'Admin', emoji:'🔐' }] : []),
  ];

  // ── Sub-componentes ───────────────────────────────────────────────────────

  const DateTabs = ({ value, onChange, showLock = false, dates = DATES }) => (
    <div className="flex gap-1 overflow-x-auto">
      {dates.map(d => {
        const hasRegular = fromDate(d.key).length > 0;
        const pLock = showLock && current && hasRegular && isDateLocked(locked, current.id, d.key);
        const dLock = isDayLocked(d.key);
        return (
          <button key={d.key} onClick={() => onChange(d.key)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 ${
              value === d.key ? 'bg-green-500 text-black shadow-md' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}>
            {d.short}
            {(pLock || dLock) && <Lock size={10} className={value===d.key ? 'text-black/60' : dLock ? 'text-red-400' : 'text-green-400'}/>}
          </button>
        );
      })}
    </div>
  );

  const MatchRow = ({ m, homeVal, awayVal, onHome, onAway, disabled, gold, onLock, matchLocked, adminLocked }) => {
    const hasPred  = homeVal != null && homeVal !== '' && awayVal != null && awayVal !== '';
    const inputOff = disabled || matchLocked || adminLocked;
    return (
      <div className={`rounded-xl overflow-hidden transition-colors ${inputOff ? 'bg-white/2' : 'bg-white/5 hover:bg-white/8'}`}>
        <div className="flex items-center gap-2 p-3">
          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
            <span className="text-gray-200 text-xs font-semibold truncate hidden sm:block">{m.home}</span>
            <FlagImg team={m.home} size={28}/>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <input type="number" min="0" max="20" placeholder="0"
              value={homeVal ?? ''}
              onChange={e => !inputOff && onHome?.(e.target.value)}
              readOnly={inputOff}
              className={numInput(inputOff)}
              style={gold && !inputOff ? { borderColor:'rgba(245,158,11,0.5)' } : {}}
            />
            <span className="text-gray-500 font-black text-xl select-none">–</span>
            <input type="number" min="0" max="20" placeholder="0"
              value={awayVal ?? ''}
              onChange={e => !inputOff && onAway?.(e.target.value)}
              readOnly={inputOff}
              className={numInput(inputOff)}
              style={gold && !inputOff ? { borderColor:'rgba(245,158,11,0.5)' } : {}}
            />
          </div>
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <FlagImg team={m.away} size={28}/>
            <span className="text-gray-200 text-xs font-semibold truncate hidden sm:block">{m.away}</span>
          </div>
          {onLock && (
            adminLocked
              ? <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center" title="Bloqueado por el juez">
                  <Lock size={14} className="text-red-400"/>
                </div>
              : matchLocked
                ? <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    <Lock size={14} className="text-green-400"/>
                  </div>
                : <button onClick={onLock} disabled={!hasPred} title="Bloquear este partido"
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      hasPred ? 'bg-green-500/20 text-green-400 hover:bg-green-500/35 active:scale-90' : 'text-gray-700 cursor-not-allowed'
                    }`}>
                    <Lock size={14}/>
                  </button>
          )}
        </div>
        <div className="flex items-center justify-center gap-1 pb-2 text-xs text-gray-600">
          <MapPin size={9}/> {m.venue} <span className="text-gray-700 mx-1">·</span> {m.group ? `Gr. ${m.group}` : (m.round || '')}
        </div>
      </div>
    );
  };

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
      <header className="relative py-8 px-4 text-center select-none overflow-hidden cursor-default" onClick={handleHeaderClick}>
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 44px,#22c55e 44px,#22c55e 45px),repeating-linear-gradient(90deg,transparent,transparent 44px,#22c55e 44px,#22c55e 45px)',
        }}/>
        <div className="relative z-10">
          <div className="text-6xl mb-2 inline-block"
            style={{ filter:'drop-shadow(0 0 24px #f59e0b)', animation:'float 3s ease-in-out infinite' }}>🏆</div>
          <h1 className="text-4xl font-black tracking-widest uppercase"
            style={{ color:'#f59e0b', textShadow:'0 0 40px rgba(245,158,11,0.5)' }}>Polla Mundial TTN</h1>
          <p className="text-green-400 font-bold tracking-widest text-sm mt-1">USA · CANADÁ · MÉXICO 2026</p>
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-white/5 rounded-xl px-3 py-1.5 text-xs text-gray-400 border border-white/10">
              <Calendar size={11}/> Grupos + 16avos · <strong className="text-white">25 Jun – 3 Jul</strong>
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs border ${
              FB_READY && connected ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            }`}>
              {FB_READY && connected ? <><Wifi size={11}/> En línea</> : <><WifiOff size={11}/> Modo local</>}
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
                  onChange={e => setNameInput(e.target.value)} onKeyDown={e => e.key==='Enter' && join()} maxLength={30}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-400 transition-colors"
                />
                <button onClick={join} disabled={!nameInput.trim()}
                  className="px-6 py-3 rounded-xl font-bold text-black disabled:opacity-30 hover:opacity-90 active:scale-95 transition-all"
                  style={{ background:'linear-gradient(135deg,#22c55e,#16a34a)' }}>¡Entrar!</button>
              </div>
              <p className="text-gray-500 text-xs mt-2">💡 Si ya participaste antes, escribe el mismo nombre para retomar.</p>
            </div>

            <div className={`${glass} p-5`}>
              <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2"><Calendar size={15}/> Partidos · 25 Jun – 3 Jul 2026</h3>
              <DateTabs value={activeDate} onChange={setActiveDate}/>
              <div className="mt-3">
                {(() => {
                  const d = DATES.find(d => d.key === activeDate);
                  return (<>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">{d?.phase}</p>
                    {slotsFor(activeDate).map(time => (
                      <div key={time} className="mb-3">
                        <div className="text-xs text-gray-600 font-semibold mb-1.5 flex items-center gap-1"><Clock size={10}/> {time} COL/PER</div>
                        {fromDate(activeDate).filter(m => m.time===time).map(m => (
                          <div key={m.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5 mb-1">
                            <div className="flex items-center gap-2"><FlagImg team={m.home} size={22}/><span className="font-semibold text-sm">{m.home}</span></div>
                            <div className="text-center px-2">
                              {real[m.id]?.home != null && real[m.id]?.home !== ''
                                ? <span className="font-black text-white">{real[m.id].home} – {real[m.id].away}</span>
                                : <span className="text-gray-600 text-xs font-bold">VS</span>}
                            </div>
                            <div className="flex items-center gap-2"><span className="font-semibold text-sm">{m.away}</span><FlagImg team={m.away} size={22}/></div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </>);
                })()}
              </div>
            </div>

            {partList.length > 0 && (
              <div className={`${glass} p-5`}>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Users size={18} className="text-green-400"/> Participantes <span className="text-gray-400 font-normal">({partList.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {partList.map(p => {
                    const { pts } = calcScore(predictions[p.id] ?? {}, real);
                    const savedDates = DATES.filter(d => isDateLocked(locked, p.id, d.key)).length;
                    return (
                      <button key={p.id} onClick={() => { setCurrent(p); setTab('pronosticos'); }}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left hover:scale-[1.01] ${
                          current?.id===p.id ? 'border-green-400 bg-green-400/10' : 'border-white/10 hover:border-white/25 hover:bg-white/5'
                        }`}>
                        <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm text-black flex-shrink-0"
                          style={{ background:p.color }}>{p.initials}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white truncate">{p.name}</div>
                          <div className="text-xs text-gray-400">{pts} pts · {savedDates}/${DATES.length} días guardados</div>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {DATES.map(d => (
                            <div key={d.key} className={`w-2 h-2 rounded-full ${isDateLocked(locked, p.id, d.key) ? 'bg-green-400' : 'bg-white/15'}`}/>
                          ))}
                        </div>
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
                    <div><div className="text-white font-bold text-sm">{label}</div><div className="text-gray-500 text-xs">{sub}</div></div>
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
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-black flex-shrink-0"
                    style={{ background:current.color }}>{current.initials}</div>
                  <div className="flex-1">
                    <div className="font-bold text-white">{current.name}</div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {DATES.map(d => {
                        const dl  = isDateLocked(locked, current.id, d.key);
                        const adl = isDayLocked(d.key);
                        return (
                          <span key={d.key} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg font-semibold ${
                            adl ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                            dl  ? 'bg-green-500/15 text-green-400 border border-green-500/30' :
                                  'bg-white/5 text-gray-500 border border-white/10'
                          }`}>
                            <Lock size={9}/> {d.short} {adl ? '(admin)' : dl ? '' : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <DateTabs value={activeDate} onChange={setActiveDate} showLock dates={ALL_PRED_DATES}/>

                {(() => {
                  const d           = ALL_PRED_DATES.find(d => d.key === activeDate);
                  const adlocked    = isDayLocked(activeDate);
                  const dayMatches  = getMatchesForDate(activeDate);
                  const pLocked     = dayMatches.length > 0 && dayMatches.every(m => isMatchLocked(locked, current.id, m.id));
                  const anyLocked   = adlocked || pLocked;
                  const total       = dayMatches.length;
                  const filled      = dayMatches.filter(m => {
                    const p = getPred(m.id);
                    return p?.home != null && p?.home !== '' && p?.away != null && p?.away !== '';
                  }).length;
                  const pendingFilled = dayMatches.filter(m => {
                    if (isBlockedForUser(m.id, activeDate)) return false;
                    const p = draft[m.id];
                    return p?.home != null && p?.home !== '' && p?.away != null && p?.away !== '';
                  }).length;

                  const times = [...new Set(dayMatches.map(m => m.time))].sort();

                  return (
                    <div className={`${glass} p-4`} style={adlocked ? { border:'1px solid rgba(239,68,68,0.3)' } : pLocked ? { border:'1px solid rgba(34,197,94,0.3)' } : {}}>
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div>
                          <div className="text-yellow-400 font-bold flex items-center gap-2">
                            {d?.label}
                            {adlocked && <span className="inline-flex items-center gap-1 bg-red-500/15 text-red-400 text-xs px-2 py-0.5 rounded-lg border border-red-500/30"><Lock size={9}/> Cerrado por juez</span>}
                            {!adlocked && pLocked && <span className="inline-flex items-center gap-1 bg-green-500/15 text-green-400 text-xs px-2 py-0.5 rounded-lg border border-green-500/30"><Lock size={9}/> Guardado</span>}
                          </div>
                          <div className="text-gray-500 text-xs">{d?.phase}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-lg" style={{ color: filled===total ? '#22c55e' : '#f59e0b' }}>{filled}/{total}</div>
                          <div className="text-xs text-gray-500">completados</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {times.map(time => (
                          <div key={time}>
                            <div className="text-xs text-gray-600 font-semibold mb-2 flex items-center gap-1"><Clock size={10}/> {time} COL/PER</div>
                            <div className="space-y-2">
                              {dayMatches.filter(m => m.time===time).map(m => {
                                const p = getPred(m.id);
                                return (
                                  <MatchRow key={m.id} m={m}
                                    homeVal={p?.home} awayVal={p?.away}
                                    onHome={v => updateDraft(m.id,'home',v)}
                                    onAway={v => updateDraft(m.id,'away',v)}
                                    disabled={isDayLocked(m.date)}
                                    adminLocked={isAdminMatchLocked(m.id)}
                                    matchLocked={isMatchLocked(locked, current.id, m.id)}
                                    onLock={() => saveMatchPrediction(m.id)}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {!anyLocked && (
                        <div className="mt-4 pt-4 border-t border-white/8">
                          {filled < total && (
                            <p className="text-yellow-400/70 text-xs mb-3 text-center">
                              Faltan {total - filled} partido{total-filled!==1?'s':''} por pronosticar
                            </p>
                          )}
                          <button onClick={() => saveDatePredictions(activeDate)} disabled={pendingFilled===0}
                            className="w-full py-3.5 rounded-xl font-black text-base transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                            style={pendingFilled>0 ? { background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'black' } : { background:'rgba(255,255,255,0.05)', color:'#6b7280' }}>
                            <Lock size={17}/>
                            {pendingFilled===0 ? 'Nada pendiente' : `Bloquear ${pendingFilled} partido${pendingFilled!==1?'s':''} restante${pendingFilled!==1?'s':''}`}
                          </button>
                          <p className="text-center text-xs text-gray-600 mt-2">Usa 🔒 por partido o este botón para bloquear todos los pendientes</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </>
        )}

        {/* ════════ LLAVE ════════ */}
        {tab==='llave' && (() => {
          // Deriva las columnas del bracket recursivamente desde la final
          const srcs = (id) => {
            const bm = BRACKET_MATCHES.find(x => x.id === id);
            return bm ? [bm.home.src, bm.away.src] : [];
          };
          const semiL = ['S01'], quartL = srcs('S01'), octL = quartL.flatMap(srcs), r16L = octL.flatMap(srcs);
          const semiR = ['S02'], quartR = srcs('S02'), octR = quartR.flatMap(srcs), r16R = octR.flatMap(srcs);
          const leftCols = [
            { label:'16avos',  ids:r16L },
            { label:'Octavos', ids:octL },
            { label:'Cuartos', ids:quartL },
            { label:'Semis',   ids:semiL },
          ];
          const rightCols = [
            { label:'Semis',   ids:semiR },
            { label:'Cuartos', ids:quartR },
            { label:'Octavos', ids:octR },
            { label:'16avos',  ids:r16R },
          ];
          const champion = resolveTeam('FIN', 'winner', real);

          const Cell = ({ mid }) => {
            const sm = MATCHES.find(x => x.id === mid);
            const bm = BRACKET_MATCHES.find(x => x.id === mid);
            const m = sm ?? bm;
            if (!m) return null;
            const home = sm ? sm.home : resolveTeam(bm.home.src, bm.home.side, real);
            const away = sm ? sm.away : resolveTeam(bm.away.src, bm.away.side, real);
            const r = real[mid];
            const hasR = r?.home != null && r?.home !== '' && r?.away != null && r?.away !== '';
            const winner = hasR ? getMatchWinner(mid, home, away, real) : null;
            const isPens = hasR && r?.winner && parseInt(r.home) === parseInt(r.away);
            const row = (team, score) => (
              <div className={`flex items-center gap-1.5 min-w-0 ${winner && winner !== team ? 'opacity-40' : ''}`}>
                {team ? <FlagImg team={team} size={16}/> : <span className="w-4 h-3 rounded-sm bg-white/10 inline-block flex-shrink-0"/>}
                <span className={`text-[11px] font-bold truncate ${winner === team ? 'text-white' : winner ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                  {team ? teamAbbr(team) : 'TBD'}
                </span>
                <span className={`ml-auto text-xs font-black ${winner === team ? 'text-white' : 'text-gray-500'}`}>{hasR ? score : ''}</span>
              </div>
            );
            return (
              <div className={`rounded-lg border px-2 py-1.5 ${hasR ? 'bg-white/5 border-white/10' : 'bg-white/2 border-white/5'}`}>
                {row(home, r?.home)}
                {row(away, r?.away)}
                <div className="text-[9px] text-gray-600 text-center mt-0.5 leading-none">{m.date}{isPens ? ' · pen.' : ''}</div>
              </div>
            );
          };

          const Col = ({ col, side }) => (
            <div className="flex flex-col w-[118px] flex-shrink-0">
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider text-center mb-2">{col.label}</div>
              <div className="flex-1 flex flex-col justify-around gap-1.5">
                {col.ids.map(id => <Cell key={side+id} mid={id}/>)}
              </div>
            </div>
          );

          return (
            <div className={`${glass} p-4`} style={{ border:'1px solid rgba(245,158,11,0.25)' }}>
              <h3 className="text-yellow-400 font-bold mb-1 flex items-center gap-2">🏆 Llave del Torneo</h3>
              <p className="text-gray-500 text-xs mb-3">Desliza horizontalmente para ver toda la llave →</p>
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-2 items-stretch" style={{ minWidth:1180 }}>
                  {leftCols.map(c => <Col key={'L'+c.label} col={c} side="L"/>)}

                  {/* Centro: campeón, final y 3er lugar */}
                  <div className="flex flex-col items-center justify-center gap-2 w-[128px] flex-shrink-0 px-1">
                    <div className="text-4xl" style={{ filter: champion ? 'drop-shadow(0 0 18px #f59e0b)' : 'grayscale(1) opacity(0.4)' }}>🏆</div>
                    {champion
                      ? <div className="flex flex-col items-center gap-1">
                          <FlagImg team={champion} size={30}/>
                          <span className="text-yellow-400 font-black text-sm text-center">{champion}</span>
                        </div>
                      : <span className="text-gray-600 text-[10px] font-bold uppercase tracking-wider">Campeón</span>}
                    <div className="text-[9px] text-yellow-400 font-bold uppercase mt-2">Final · 19 Jul</div>
                    <div className="w-full"><Cell mid="FIN"/></div>
                    <div className="text-[9px] text-blue-400 font-bold uppercase mt-2">3er Lugar · 18 Jul</div>
                    <div className="w-full"><Cell mid="BRO"/></div>
                  </div>

                  {rightCols.map(c => <Col key={'R'+c.label} col={c} side="R"/>)}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ════════ TABLA ════════ */}
        {tab==='tabla' && (
          <>
            {/* Banner de premios */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl p-4 flex flex-col items-center gap-1 border"
                style={{ background:'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))', borderColor:'rgba(245,158,11,0.4)' }}>
                <span className="text-3xl">🥇</span>
                <span className="text-yellow-400 font-black text-lg">$400.000</span>
                <span className="text-gray-400 text-xs font-semibold">1er lugar</span>
              </div>
              <div className="rounded-2xl p-4 flex flex-col items-center gap-1 border"
                style={{ background:'linear-gradient(135deg,rgba(156,163,175,0.15),rgba(156,163,175,0.05))', borderColor:'rgba(156,163,175,0.3)' }}>
                <span className="text-3xl">🥈</span>
                <span className="text-gray-300 font-black text-lg">$100.000</span>
                <span className="text-gray-400 text-xs font-semibold">2do lugar</span>
              </div>
              <div className="rounded-2xl p-4 flex flex-col items-center gap-1 border"
                style={{ background:'linear-gradient(135deg,rgba(180,83,9,0.15),rgba(180,83,9,0.05))', borderColor:'rgba(180,83,9,0.35)' }}>
                <span className="text-3xl">🥉</span>
                <span className="text-orange-400 font-black text-lg">$50.000</span>
                <span className="text-gray-400 text-xs font-semibold">3er lugar</span>
              </div>
            </div>

            <div className={`${glass} p-5`}>
              <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <BarChart3 size={20} className="text-green-400"/> Tabla de Posiciones
              </h2>
              {leaderboard.length === 0
                ? <div className="text-center py-14 text-gray-500"><div className="text-5xl mb-3">📊</div><p>Nadie se ha unido todavía.</p></div>
                : (() => {
                  const prizeMap = calcPrizes(leaderboard);
                  return (
                    <div className="space-y-2">
                      {leaderboard.map((p, idx) => {
                        const savedDates = DATES.filter(d => isDateLocked(locked, p.id, d.key)).length;
                        const prize = prizeMap[p.id];
                        return (
                          <div key={p.id} className={`flex items-center gap-3 p-4 rounded-xl border ${
                            idx===0?'border-yellow-400/40 bg-yellow-400/8':idx===1?'border-gray-400/30 bg-gray-300/5':idx===2?'border-orange-700/30 bg-orange-800/5':'border-white/5 bg-white/2'
                          }`}>
                            <div className="w-9 text-center flex-shrink-0">
                              {idx===0?<span className="text-2xl">🥇</span>:idx===1?<span className="text-2xl">🥈</span>:idx===2?<span className="text-2xl">🥉</span>:<span className="text-gray-500 font-bold">{idx+1}</span>}
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-black flex-shrink-0"
                              style={{ background:p.color }}>{p.initials}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-white truncate">{p.name}</div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                <span className="text-green-400 font-bold">{p.exact}</span> exactos · <span className="text-blue-400 font-bold">{p.correct}</span> ganador · {savedDates}/3 días
                              </div>
                              {prize && (
                                <span className={`inline-flex items-center gap-1 mt-1 text-xs font-black rounded-lg px-2 py-0.5 ${
                                  idx===0 ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/30'
                                  : idx===1 ? 'text-gray-300 bg-gray-300/10 border border-gray-300/20'
                                  : 'text-orange-400 bg-orange-400/10 border border-orange-400/30'
                                }`}>
                                  {formatPeso(prize.amount)}
                                  {prize.count > 1 && <span className="font-semibold opacity-70"> ÷{prize.count}</span>}
                                </span>
                              )}
                            </div>
                            <div className="text-right"><div className="font-black text-2xl" style={{ color:'#f59e0b' }}>{p.pts}</div><div className="text-xs text-gray-500">pts</div></div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              }
            </div>

            {hasRealResults && (
              <div className={`${glass} p-4`}>
                <h3 className="text-green-400 font-bold mb-4">Resultados Reales</h3>
                {DATES.map(d => {
                  const played = fromDate(d.key).filter(m => real[m.id]?.home != null && real[m.id]?.home !== '');
                  if (!played.length) return null;
                  return (
                    <div key={d.key} className="mb-4">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">{d.label}</p>
                      <div className="space-y-2">
                        {played.map(m => (
                          <div key={m.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2.5">
                            <div className="flex items-center gap-2"><FlagImg team={m.home} size={20}/><span className="text-sm font-semibold">{m.home}</span></div>
                            <span className="font-black text-xl text-white px-3">{real[m.id].home} – {real[m.id].away}</span>
                            <div className="flex items-center gap-2"><span className="text-sm font-semibold">{m.away}</span><FlagImg team={m.away} size={20}/></div>
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
                <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-3">Comparativa · {ALL_PRED_DATES.find(d=>d.key===activeDate)?.label}</h3>
                <DateTabs value={activeDate} onChange={setActiveDate} dates={ALL_PRED_DATES}/>
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left text-gray-500 pb-2 pr-3 font-semibold">Partido</th>
                        {hasRealResults && <th className="text-center text-gray-500 pb-2 px-2 font-semibold">Real</th>}
                        {partList.map(p => (
                          <th key={p.id} className="text-center pb-2 px-2">
                            <span className="w-5 h-5 rounded-full inline-flex items-center justify-center font-black text-black text-xs" style={{ background:p.color }}>{p.initials}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getMatchesForDate(activeDate).map(m => {
                        const r = real[m.id]; const hasR = r?.home != null && r?.home !== '';
                        return (
                          <tr key={m.id} className="border-t border-white/5">
                            <td className="py-2 pr-3 text-gray-300 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <FlagImg team={m.home} size={14}/> vs <FlagImg team={m.away} size={14}/>
                                <span className="text-gray-600 ml-1 hidden sm:inline">{m.group ? `Gr.${m.group}` : (m.round || '')}</span>
                              </div>
                            </td>
                            {hasRealResults && <td className="py-2 px-2 text-center font-black text-white">{hasR ? `${r.home}-${r.away}` : '–'}</td>}
                            {partList.map(p => {
                              const pred = predictions[p.id]?.[m.id];
                              const ok = pred?.home != null && pred?.home !== '' && pred?.away != null && pred?.away !== '';
                              const dlk = isMatchLocked(locked, p.id, m.id) || isDayLocked(m.date);
                              let badge = '';
                              if (hasR && ok) {
                                const rr = getResult(r.home, r.away), pr = getResult(pred.home, pred.away);
                                if (+pred.home===+r.home && +pred.away===+r.away) badge='✅';
                                else if (pr===rr) badge='🟡';
                                else badge='❌';
                              }
                              return (
                                <td key={p.id} className="py-2 px-2 text-center">
                                  {ok ? <span className="text-gray-200">{pred.home}-{pred.away}{badge?` ${badge}`:''}</span>
                                      : dlk ? <span className="text-gray-600">–</span>
                                            : <span className="text-yellow-400/40">pend.</span>}
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
            {/* Sub-nav admin */}
            <div className={`${glass} p-2 flex gap-1`}>
              {[
                { id:'results', label:'Resultados', icon:<BarChart3 size={14}/> },
                { id:'days',    label:'Control días', icon:<Lock size={14}/> },
                { id:'users',   label:'Editar usuarios', icon:<Edit3 size={14}/> },
              ].map(s => (
                <button key={s.id} onClick={() => setAdminSection(s.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-all ${
                    adminSection===s.id ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  {s.icon} <span className="hidden sm:inline">{s.label}</span>
                </button>
              ))}
            </div>

            {/* ── Sección: Resultados reales ── */}
            {adminSection==='results' && (
              <div className={`${glass} p-5`} style={{ border:'1px solid rgba(245,158,11,0.4)' }}>
                <h2 className="text-xl font-bold text-yellow-400 mb-1 flex items-center gap-2"><Settings size={20}/> Resultados Reales</h2>
                <p className="text-gray-400 text-sm mb-4">Los puntos se recalculan al instante. En partidos de penales marca el ganador.</p>

                <DateTabs value={activeDate} onChange={setActiveDate} dates={ALL_PRED_DATES}/>

                <div className="mt-4 space-y-3">
                  {(() => {
                    const dayMatches = getMatchesForDate(activeDate);
                    const times = [...new Set(dayMatches.map(m => m.time))].sort();
                    return times.map(time => (
                      <div key={time}>
                        <div className="text-yellow-400/60 text-xs font-bold mb-2 flex items-center gap-1 uppercase tracking-wider"><Clock size={10}/> {time} COL/PER</div>
                        <div className="space-y-2">
                          {dayMatches.filter(m => m.time === time).map(m => {
                            // Todo partido de eliminación directa (16avos en adelante) permite elegir ganador en empate
                            const isKnockout = Boolean(m.round);
                            const r = real[m.id] ?? {};
                            const h = parseInt(r.home), a = parseInt(r.away);
                            const tied = !isNaN(h) && !isNaN(a) && h === a && r.home !== '' && r.away !== '';
                            if (!isKnockout) {
                              return (
                                <MatchRow key={m.id} m={m} gold
                                  homeVal={r.home} awayVal={r.away}
                                  onHome={v => setRealResult(m.id,'home',v)} onAway={v => setRealResult(m.id,'away',v)}
                                  disabled={false}
                                />
                              );
                            }
                            return (
                              <div key={m.id} className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2">
                                <div className="text-xs text-yellow-400/60 font-bold uppercase tracking-wider">{m.round} · {m.time} · {m.venue}</div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 flex items-center justify-end gap-1.5">
                                    <span className="text-xs text-gray-300 truncate">{m.home ?? '?'}</span>
                                    {m.home && <FlagImg team={m.home} size={20}/>}
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <input type="number" min="0" max="20" placeholder="0" value={r.home ?? ''}
                                      onChange={e => setRealResult(m.id,'home',e.target.value)}
                                      className="w-12 text-center bg-white/10 border border-yellow-400/30 rounded-lg py-1.5 text-white font-black text-sm focus:outline-none focus:border-yellow-400"/>
                                    <span className="text-gray-600 font-bold">-</span>
                                    <input type="number" min="0" max="20" placeholder="0" value={r.away ?? ''}
                                      onChange={e => setRealResult(m.id,'away',e.target.value)}
                                      className="w-12 text-center bg-white/10 border border-yellow-400/30 rounded-lg py-1.5 text-white font-black text-sm focus:outline-none focus:border-yellow-400"/>
                                  </div>
                                  <div className="flex-1 flex items-center gap-1.5">
                                    {m.away && <FlagImg team={m.away} size={20}/>}
                                    <span className="text-xs text-gray-300 truncate">{m.away ?? '?'}</span>
                                  </div>
                                </div>
                                {tied && (
                                  <div className="flex items-center gap-2 pt-1 border-t border-white/8">
                                    <span className="text-xs text-yellow-400 font-bold">Ganó en penales:</span>
                                    {[['home', m.home], ['away', m.away]].map(([side, team]) => (
                                      <button key={side} onClick={async () => {
                                        if (FB_READY) await set(ref(db, `${DB_PATH}/real/${m.id}/winner`), side);
                                        else setReal(prev => ({...prev, [m.id]: {...(prev[m.id]??{}), winner: side}}));
                                        showToast(`✓ Avanzó ${team}`);
                                      }}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                          r.winner === side ? 'bg-green-500 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                        }`}>
                                        {team && <FlagImg team={team} size={14}/>} {team ?? side}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* ── Sección: Control de días ── */}
            {adminSection==='days' && (
              <div className={`${glass} p-5`} style={{ border:'1px solid rgba(245,158,11,0.4)' }}>
                <h2 className="text-xl font-bold text-yellow-400 mb-1 flex items-center gap-2"><Lock size={20}/> Control de Partidos</h2>
                <p className="text-gray-400 text-sm mb-5">Bloquea o desbloquea días completos o partidos individuales, incluida la fase eliminatoria.</p>
                <div className="space-y-4">
                  {ALL_PRED_DATES.map(d => {
                    const dl = isDayLocked(d.key);
                    return (
                      <div key={d.key} className={`rounded-xl border overflow-hidden ${dl ? 'border-red-500/30' : 'border-white/10'}`}>
                        {/* Fila del día */}
                        <div className={`flex items-center justify-between p-3 ${dl ? 'bg-red-500/10' : 'bg-white/5'}`}>
                          <div>
                            <div className={`font-bold text-sm ${dl ? 'text-red-400' : 'text-white'}`}>{d.label}</div>
                            <div className="text-xs text-gray-500">{d.phase}</div>
                          </div>
                          <button onClick={() => toggleDayLock(d.key)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all ${
                              dl
                                ? 'bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25'
                                : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                            }`}>
                            {dl ? <><Unlock size={12}/> Desbloquear día</> : <><Lock size={12}/> Bloquear día</>}
                          </button>
                        </div>
                        {/* Filas de partidos */}
                        <div className="divide-y divide-white/5">
                          {getMatchesForDate(d.key).map(m => {
                            const ml = isAdminMatchLocked(m.id);
                            return (
                              <div key={m.id} className={`flex items-center justify-between px-3 py-2 ${ml ? 'bg-orange-500/5' : ''}`}>
                                <div className="flex items-center gap-2 min-w-0">
                                  <FlagImg team={m.home} size={18}/>
                                  <span className="text-xs text-gray-300 truncate">{m.home}</span>
                                  <span className="text-gray-600 text-xs">vs</span>
                                  <span className="text-xs text-gray-300 truncate">{m.away}</span>
                                  <FlagImg team={m.away} size={18}/>
                                  <span className="text-gray-600 text-xs ml-1">{m.time}</span>
                                </div>
                                <button onClick={() => toggleMatchLockAdmin(m.id)}
                                  className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all ml-2 ${
                                    dl ? 'opacity-40 cursor-not-allowed bg-white/5 text-gray-600 border border-white/10' :
                                    ml
                                      ? 'bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25'
                                      : 'bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25'
                                  }`}
                                  disabled={dl}>
                                  {ml ? <><Unlock size={10}/> Abrir</> : <><Lock size={10}/> Cerrar</>}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Sección: Editar pronósticos de usuario ── */}
            {adminSection==='users' && (
              <div className={`${glass} p-5`} style={{ border:'1px solid rgba(245,158,11,0.4)' }}>
                <h2 className="text-xl font-bold text-yellow-400 mb-1 flex items-center gap-2"><Edit3 size={20}/> Editar Pronósticos</h2>
                <p className="text-gray-400 text-sm mb-4">Edita el pronóstico de cualquier participante, incluso si está bloqueado.</p>

                {partList.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay participantes todavía.</p>
                ) : (
                  <>
                    {/* Selector de participante */}
                    <div className="space-y-2 mb-4">
                      {partList.map(p => (
                        <div key={p.id} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                          adminEditPid===p.id ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/10 bg-white/3'
                        }`}>
                          <button onClick={() => loadAdminUser(p.id)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-black flex-shrink-0"
                              style={{ background:p.color }}>{p.initials}</div>
                            <span className="text-sm font-semibold truncate">{p.name}</span>
                          </button>
                          {confirmDeletePid === p.id
                            ? <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-xs text-red-400 font-bold">¿Eliminar?</span>
                                <button onClick={() => deleteParticipant(p.id)}
                                  className="px-2 py-1 rounded-lg text-xs font-black bg-red-500 text-white hover:bg-red-600 transition-all">
                                  Sí
                                </button>
                                <button onClick={() => setConfirmDeletePid('')}
                                  className="px-2 py-1 rounded-lg text-xs font-bold bg-white/10 text-gray-400 hover:bg-white/20 transition-all">
                                  No
                                </button>
                              </div>
                            : <button onClick={() => setConfirmDeletePid(p.id)}
                                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/15 transition-all">
                                <Trash2 size={13}/>
                              </button>
                          }
                        </div>
                      ))}
                    </div>

                    {adminEditPid && (
                      <>
                        <div className="border-t border-white/8 pt-4 mb-4">
                          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                            <p className="text-yellow-400 font-bold text-sm">
                              Editando: <span className="text-white">{participants[adminEditPid]?.name}</span>
                            </p>
                            {/* Botón desbloquear día para este usuario */}
                            {isDateFullyLockedFor(adminEditPid, activeDate) && (
                              <button
                                onClick={() => adminUnlockUserDay(adminEditPid, activeDate)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 transition-all"
                              >
                                <Unlock size={12}/> Desbloquear {ALL_PRED_DATES.find(d=>d.key===activeDate)?.short}
                              </button>
                            )}
                          </div>
                          <DateTabs value={activeDate} onChange={setActiveDate} dates={ALL_PRED_DATES}/>
                          {/* Indicador de estado por día */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {ALL_PRED_DATES.map(d => {
                              const fullyLocked = isDateFullyLockedFor(adminEditPid, d.key);
                              const partial = !fullyLocked && getMatchesForDate(d.key).some(m => isMatchLocked(locked, adminEditPid, m.id));
                              return (
                                <span key={d.key} className={`text-xs px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1 ${
                                  fullyLocked ? 'bg-green-500/15 text-green-400 border border-green-500/25' :
                                  partial     ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25' :
                                                'bg-white/5 text-gray-600 border border-white/10'
                                }`}>
                                  <Lock size={8}/>
                                  {d.short} {fullyLocked ? '✓' : partial ? '~' : '–'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div className="space-y-3">
                          {[...new Set(getMatchesForDate(activeDate).map(m => m.time))].sort().map(time => (
                            <div key={time}>
                              <div className="text-yellow-400/60 text-xs font-bold mb-2 flex items-center gap-1 uppercase tracking-wider"><Clock size={10}/> {time} COL/PER</div>
                              <div className="space-y-2">
                                {getMatchesForDate(activeDate).filter(m => m.time===time).map(m => (
                                  <MatchRow key={m.id} m={m} gold
                                    homeVal={adminDraft[m.id]?.home}
                                    awayVal={adminDraft[m.id]?.away}
                                    onHome={v => updateAdminDraft(m.id,'home',v)}
                                    onAway={v => updateAdminDraft(m.id,'away',v)}
                                    disabled={false}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => saveAdminUserPreds(activeDate)}
                          className="mt-4 w-full py-3 rounded-xl font-black text-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                          style={{ background:'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                          <CheckCircle size={16}/> Guardar cambios de {ALL_PRED_DATES.find(d=>d.key===activeDate)?.short}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Tabla rápida de puntos */}
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
        Polla Mundial 2026 · 25 Jun – 3 Jul · {FB_READY && connected ? 'Firebase sync' : 'Modo local'}
      </footer>
    </div>
  );
}
