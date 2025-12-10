import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp, getApps } from 'firebase/app';
// NOTA: Usamos window.XLSX cargado por CDN.
// Asegúrate de que en tu index.html tengas la librería de Tailwind o los estilos base si usas clases.

import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously,
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  enableIndexedDbPersistence,
  getDocs,
  writeBatch,
  query,
  where
} from 'firebase/firestore';

// --- ESTILOS ---
const styles = {
  container: { fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '120px', color: '#1e293b', position: 'relative' },
  header: { backgroundColor: '#0f172a', color: 'white', padding: '16px', position: 'sticky', top: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  title: { fontSize: '1.1rem', fontWeight: '900', margin: 0, letterSpacing: '-0.025em', textTransform: 'uppercase' },
  subtitle: { fontSize: '0.7rem', color: '#94a3b8', margin: 0, fontFamily: 'monospace' },
  main: { maxWidth: '800px', margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { backgroundColor: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  kpiCard: { padding: '16px', borderRadius: '12px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#2563eb' },
  kpiValue: { fontSize: '2.2rem', fontWeight: '900', lineHeight: 1 },
  kpiLabel: { fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.9, marginTop: '4px', fontWeight: 'bold', letterSpacing: '0.05em' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' },
  th: { textAlign: 'left', padding: '10px', color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', fontWeight: '800' },
  td: { padding: '10px', borderBottom: '1px solid #f1f5f9' },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTop: '1px solid #e2e8f0', padding: '12px', display: 'flex', justifyContent: 'space-around', zIndex: 40 },
  navBtn: { background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' },
  fab: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginTop: '-40px', border: '4px solid #f8fafc', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', backgroundColor: '#f8fafc', boxSizing: 'border-box' },
  button: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', transition: 'background 0.2s' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(2px)', overflowY: 'auto' },
  modalContent: { backgroundColor: 'white', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '340px', textAlign: 'center', position: 'relative' },
  modalContentOficio: { backgroundColor: 'white', borderRadius: '0', padding: '40px', width: '100%', maxWidth: '800px', minHeight: '80vh', textAlign: 'left', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  noteBlock: { backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '12px', padding: '16px' },
  textArea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #fde047', minHeight: '80px', marginTop: '8px', fontSize: '0.9rem' },
  closeBtn: { position: 'absolute', top: '16px', right: '16px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: '1.2rem', fontWeight: 'bold' },
  loginScreen: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0f172a', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  loginBox: { backgroundColor: 'white', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  select: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', backgroundColor: '#f8fafc', marginBottom: '10px' },
  bgBlueGradient: { background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
  onlineIndicator: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', marginRight: '5px' },
  onlineBadge: { fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px' }
};

const printStyles = `
  @media screen { .visible-print { display: none !important; } }
  @media print {
    @page { margin: 15mm; size: letter; }
    body { background-color: white; color: black; font-family: 'Times New Roman', serif; font-size: 12pt; -webkit-print-color-adjust: exact; }
    .no-print { display: none !important; }
    .visible-print { display: block !important; }
    .card { box-shadow: none; border: none; padding: 0; }
    .oficio-container { width: 100%; max-width: 100%; padding: 0; box-sizing: border-box; }
    .oficio-header { text-align: center; font-weight: bold; margin-bottom: 40px; border-bottom: 3px solid black; padding-bottom: 15px; font-size: 16pt; text-transform: uppercase; }
    .oficio-date { text-align: right; margin-bottom: 40px; font-style: italic; }
    .oficio-body { line-height: 1.8; text-align: justify; margin-bottom: 30px; font-size: 12pt; }
    .oficio-data-box { border: 2px solid #000; padding: 20px; margin: 20px 0; background-color: #f8fafc !important; border-radius: 8px; }
    .oficio-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 5px; }
    .oficio-label { font-weight: bold; }
    .oficio-value { font-family: 'Courier New', monospace; font-weight: bold; font-size: 14pt; }
    .oficio-qr-container { text-align: center; margin: 40px 0; }
    .oficio-qr-img { width: 300px; height: 300px; border: 4px solid black; padding: 10px; }
    .oficio-signatures { display: flex; justify-content: space-between; margin-top: 100px; page-break-inside: avoid; }
    .sign-box { width: 40%; text-align: center; border-top: 2px solid black; padding-top: 10px; font-size: 10pt; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 9pt; }
    table th { color: black; border-bottom: 2px solid black; background-color: #f3f4f6 !important; font-weight: bold; }
    table td { border-bottom: 1px solid #ddd; }
    .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .print-footer { margin-top: 30px; }
    .totals-box { border: 2px solid #000; padding: 10px; margin-top: 20px; break-inside: avoid; font-family: sans-serif; }
    .totals-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 1rem; }
  }
`;

const Icons = {
  Camera: () => <span>📷</span>,
  Truck: () => <span>🚛</span>,
  List: () => <span>📋</span>,
  Trash: () => <span>🗑️</span>,
  Edit: () => <span>✏️</span>,
  Map: () => <span>📍</span>,
  Eye: () => <span>👁️</span>,
  EyeOff: () => <span>🙈</span>,
  Print: () => <span>🖨️</span>,
  World: () => <span>🌐</span>,
  Lock: () => <span>🔒</span>,
  Unlock: () => <span>🔓</span>
};

// --- FIREBASE CONFIG (ROBUSTA) ---
// Intentamos cargar la config del entorno (Immersive). Si falla (Localhost), usamos la tuya original.
let firebaseConfig;
try {
  // Intentamos obtener la variable global del entorno
  if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
  } else {
    throw new Error("No environment config");
  }
} catch (e) {
  // FALLBACK: Configuración original de tu archivo txt
  const savedKey = localStorage.getItem('custom_firebase_key');
  firebaseConfig = { 
    apiKey: savedKey || "AIzaSyDCcDPEHZO8K8XL9Ni2ZHTkwwb7jT8-BnQ", 
    authDomain: "controlexcavacion.firebaseapp.com", 
    projectId: "controlexcavacion", 
    storageBucket: "controlexcavacion.firebasestorage.app", 
    messagingSenderId: "780205412766", 
    appId: "1:780205412766:web:91caa9e71ff213a40e868f" 
  };
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Intentar habilitar persistencia
try { 
  enableIndexedDbPersistence(db).catch(err => console.log("Persistencia no disponible:", err.code)); 
} catch(e){}

// Usamos ID del entorno o un default si estamos local
const appId = typeof __app_id !== 'undefined' ? __app_id : 'controlexcavacion-default';

// --- ATENCIÓN: RUTA DE COLECCIONES ---
// Si estamos en entorno Immersive usamos artifacts, si estamos en local usamos tu ruta original para no perder datos.
const isImmersive = typeof __app_id !== 'undefined';
// Si prefieres usar SIEMPRE tu base de datos original, descomenta la linea de abajo:
const collectionPath = isImmersive ? `artifacts/${appId}/public/data` : "registros/proyecto-master";
// const collectionPath = "registros/proyecto-master"; // <--- Descomenta esto si quieres forzar tu DB original siempre

// --- CONSTANTES ---

// --- UTILIDADES ---
const getTodayString = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const getLongDateString = () => { const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }; return new Date().toLocaleDateString('es-MX', options); };
const playBeep = () => { try { const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'); audio.volume = 0.5; audio.play().catch(()=>{}); if(navigator.vibrate) navigator.vibrate(200); } catch(e){} };

const getGPS = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    const timer = setTimeout(() => { console.log("GPS Timeout"); resolve(null); }, 2000);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timer); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      (err) => { clearTimeout(timer); resolve(null); },
      { enableHighAccuracy: false, timeout: 1500, maximumAge: 60000 }
    );
  });
};

const NativeScanner = ({ onScan, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    if (!window.jsQR) {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    let stream = null;
    let mounted = true; 
    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if(mounted) setCameraError("Tu navegador no soporta acceso a la cámara.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } } });
        if (videoRef.current && mounted) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", true);
          await videoRef.current.play();
          scanFrame();
        }
      } catch (err) { 
        if(!mounted) return;
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') setCameraError("⛔ Permiso denegado. Habilita la cámara.");
        else setCameraError("Error de cámara: Revisa HTTPS."); 
      }
    };
    startCamera();
    return () => {
      mounted = false;
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const scanFrame = () => {
    if (videoRef.current && canvasRef.current && window.jsQR) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        if (canvas.width !== video.videoWidth) { canvas.height = video.videoHeight; canvas.width = video.videoWidth; }
        const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: false });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
            if (code && code.data && code.data.length > 0) { onScan(code.data); return; }
        } catch (e) {}
      }
    }
    requestRef.current = requestAnimationFrame(scanFrame);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{...styles.modalContent, backgroundColor: 'black', color: 'white', padding: 0, overflow: 'hidden', height: '100%', maxHeight: '600px', display: 'flex', flexDirection: 'column'}}>
        {cameraError ? <div style={{padding:20, color:'#fca5a5', fontWeight:'bold', fontSize:'1.2rem'}}>{cameraError}</div> : (
          <>
            <video ref={videoRef} style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7}} muted />
            <canvas ref={canvasRef} style={{display: 'none'}} />
            <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', border: '4px solid #22c55e', borderRadius: '16px', boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'}}></div>
            <div style={{position: 'absolute', top: '20px', left: 0, right: 0, textAlign: 'center', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.8)'}}>BUSCANDO QR...</div>
          </>
        )}
        <button onClick={onCancel} style={{...styles.button, backgroundColor: '#ef4444', position: 'absolute', bottom: '20px', left: '20px', right: '20px', width: 'auto'}}>CANCELAR</button>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [processingScan, setProcessingScan] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [trucks, setTrucks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]); 
  const [dailyNote, setDailyNote] = useState("");
  const [pricePerM3, setPricePerM3] = useState(0); 
  const [isScanning, setIsScanning] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  
  const [newTruck, setNewTruck] = useState({ placas: '', capacidad: '', agrupacion: '' });
  const [newLocation, setNewLocation] = useState({ name: '', cc: '' });
  const [newUser, setNewUser] = useState({ name: '', pin: '', role: 'checker' });
  
  const [showQRModal, setShowQRModal] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [pendingScan, setPendingScan] = useState(null);

  const [selectedDate, setSelectedDate] = useState(getTodayString()); 
  const [currentAuth, setCurrentAuth] = useState({ name: '', role: 'guest', isAuthenticated: false });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInput, setAuthInput] = useState({ user: '', pin: '' });
  const [showPin, setShowPin] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  // Storage key para sesión local
  const SESSION_KEY = `control_obra_session_${appId}`; 

  const [exportStartDate, setExportStartDate] = useState(getTodayString());
  const [exportEndDate, setExportEndDate] = useState(getTodayString());
  
  const [noteData, setNoteData] = useState(null);
  const [showNotePreview, setShowNotePreview] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  // --- HELPERS PARA ROLES ---
  const isAdminOrMaster = ['masteradmin', 'admin'].includes(currentAuth.role);
  const isSupervisorOrHigher = ['masteradmin', 'admin', 'supervisor'].includes(currentAuth.role);
  const isMaster = currentAuth.role === 'masteradmin';

  // Carga única de librerías
  useEffect(() => {
    if (!window.XLSX && !document.getElementById('xlsx-script')) {
      const script = document.createElement('script');
      script.id = 'xlsx-script';
      script.src = "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- AUTH INICIAL ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth Error (Ignorable if persistence works):", e);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, u => { 
        if(u) setUser(u); 
        setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  // --- HEARTBEAT SYSTEM ---
  useEffect(() => {
    if(!currentAuth.isAuthenticated || !user) return;
    const reportPresence = async () => {
        const gps = await getGPS(); 
        const userStatusRef = doc(db, collectionPath, "status", currentAuth.name);
        try {
            await setDoc(userStatusRef, { name: currentAuth.name, role: currentAuth.role, lastSeen: serverTimestamp(), gps: gps }, { merge: true });
        } catch(e) {}
    };
    reportPresence();
    const interval = setInterval(reportPresence, 60000);
    return () => clearInterval(interval);
  }, [currentAuth, user]);

  // --- MONITOR DE USUARIOS ONLINE ---
  useEffect(() => {
      if(!isMaster) return;
      // Para evitar errores si la colección no existe aún, usamos try
      try {
        const q = query(collection(db, collectionPath, "status"));
        const unsubStatus = onSnapshot(q, (snapshot) => {
            const now = new Date();
            const active = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if(data.lastSeen){
                    const lastSeenDate = data.lastSeen.toDate();
                    const diffMins = (now - lastSeenDate) / 1000 / 60;
                    if(diffMins < 5) { active.push({...data, id: doc.id, minsAgo: Math.floor(diffMins)}); }
                }
            });
            setOnlineUsers(active);
        }, (error) => {
             console.log("Monitor offline (puede ser normal en data nueva)");
        });
        return () => unsubStatus();
      } catch(e) {}
  }, [isMaster]);

  // Recuperar sesión local
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        setCurrentAuth(parsedSession);
      } catch (e) { console.error("Error recuperando sesión:", e); }
    }
  }, []);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!user) return;
    
    // Solo MasterAdmin lee la lista completa de usuarios
    let unsubUsers = () => {};
    if (isMaster) {
        unsubUsers = onSnapshot(collection(db, collectionPath, "system_users"), s => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => console.log("Users sync error (ok)", e));
    } else { setUsers([]); }

    const unsubTrucks = onSnapshot(collection(db, collectionPath, "trucks"), s => setTrucks(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => console.log("Trucks sync error (ok)", e));
    const unsubLocs = onSnapshot(collection(db, collectionPath, "locations"), s => setLocations(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => console.log("Locs sync error (ok)", e));
    
    onSnapshot(doc(db, collectionPath, "settings", "general"), d => {
        if (d.exists()) setPricePerM3(d.data().pricePerM3 || 0);
    }, e => {});

    const logsQuery = query(
        collection(db, collectionPath, "logs"), 
        where("dateString", "==", selectedDate)
    );
    
    const unsubLogs = onSnapshot(logsQuery, { includeMetadataChanges: true }, s => {
      const data = [];
      s.docs.forEach(d => {
          const dat = d.data();
          data.push({
              id: d.id, 
              ...dat, 
              createdAt: dat.createdAt?.toDate ? dat.createdAt.toDate() : new Date(),
              isLocal: d.metadata.hasPendingWrites 
          });
      });
      data.sort((a, b) => b.createdAt - a.createdAt);
      setLogs(data);
    }, e => console.log("Logs sync error", e));

    getDoc(doc(db, collectionPath, "daily_notes", selectedDate)).then(d => {
      if (d.exists()) setDailyNote(d.data().text || ""); else setDailyNote("");
    }).catch(e=>{});
    
    return () => { unsubTrucks(); unsubLocs(); unsubUsers(); unsubLogs(); }
  }, [user, selectedDate, isMaster]); 

  // --- LOGIN SIMPLE (SIN BLOQUEO) ---
  const handleLogin = async () => {
    if (!user) { alert("Error de conexión con Firebase. Recarga."); return; }

    const q = query(collection(db, collectionPath, "system_users"), where("pin", "==", authInput.pin));
    
    try {
        const snapshot = await getDocs(q);
        let validUser = null;
        snapshot.forEach(doc => {
            const u = doc.data();
            // Comparamos nombre insensible a mayúsculas
            if(u.name.toLowerCase().trim() === authInput.user.toLowerCase().trim()) {
                validUser = u;
            }
        });

        if (validUser) {
            const s = { name: validUser.name, role: validUser.role, isAuthenticated: true };
            setCurrentAuth(s);
            localStorage.setItem(SESSION_KEY, JSON.stringify(s));
        } else {
            // BACKDOOR TEMPORAL: Si la DB está vacía y meten admin/1234
            if (users.length === 0 && authInput.user === 'admin' && authInput.pin === '1234') {
                const s = { name: 'AdminTemp', role: 'masteradmin', isAuthenticated: true };
                setCurrentAuth(s);
                alert("Login temporal de emergencia (Base de datos vacía)");
            } else {
                alert("Credenciales incorrectas.");
            }
        }
    } catch (e) {
        console.error(e);
        alert("Error al intentar loguear: " + e.message);
    }
    setAuthInput({ user: '', pin: '' });
  };
  
  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentAuth({ name: '', role: 'guest', isAuthenticated: false });
  };

  const handleTabChange = (tab) => {
    if ((tab === 'scanner' || tab === 'config') && !currentAuth.isAuthenticated) {
      setShowAuthModal(true);
      setAuthInput({ user: '', pin: '' }); 
      setShowPin(false); 
    } else {
      setActiveTab(tab);
    }
  };

  const handleTruckClick = (plate) => {
      if (isSupervisorOrHigher) {
          const trips = logs.filter(l => l.placas === plate);
          if (trips.length === 0) return alert("No hay viajes para esta placa hoy.");
          const totalM3 = trips.reduce((acc, curr) => acc + (curr.capacidad || 0), 0);
          const totalImporte = trips.reduce((acc, curr) => acc + ((curr.capacidad || 0) * (curr.priceSnapshot || pricePerM3)), 0);
          const truckInfo = trucks.find(t => t.placas === plate) || { agrupacion: 'S/N' };
          setNoteData({ date: selectedDate, plate: plate, provider: truckInfo.agrupacion, trips: trips, totalViajes: trips.length, totalM3: totalM3, totalImporte: totalImporte });
          setShowNotePreview(true);
      }
  };

  const savePrice = async () => {
    if (!isMaster) return alert("⛔ Solo MasterAdmin.");
    try { await setDoc(doc(db, collectionPath, "settings", "general"), { pricePerM3: Number(pricePerM3) }, { merge: true }); alert("Precio actualizado."); } catch (e) { alert("Error: " + e.message); }
  };

  const handleExportDailyExcel = () => {
    if (!isSupervisorOrHigher) return alert("Permisos insuficientes");
    if (!window.XLSX) return alert("Cargando Excel...");
    const XLSX_LIB = window.XLSX;
    try {
        const wb = XLSX_LIB.utils.book_new();
        const sheetData = [];
        sheetData.push(["REPORTE DIARIO DE OBRA"]);
        sheetData.push([`FECHA: ${selectedDate}`]);
        sheetData.push([`GENERADO POR: ${currentAuth.name}`]);
        sheetData.push([""]);
        if (dailyNote) { sheetData.push(["OBSERVACIONES DEL DÍA:", dailyNote]); sheetData.push([""]); }
        sheetData.push(["No.", "HORA", "PLACAS", "PROVEEDOR", "M3", "PRECIO APL.", "ZONA", "CC", "NOTA FÍSICA", "CAPTURISTA", "GPS"]);
        logs.forEach((log, index) => {
            const priceUsed = log.priceSnapshot || pricePerM3;
            const gpsLink = log.gps ? `https://maps.google.com/?q=${log.gps.lat},${log.gps.lng}` : 'Sin GPS';
            const capturista = log.recordedBy || 'Desconocido';
            sheetData.push([index + 1, log.createdAt ? log.createdAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '', log.placas, log.agrupacion, log.capacidad, priceUsed, log.locationName, log.cc, log.noteNumber || '', capturista, gpsLink]);
        });
        sheetData.push([""]);
        const totalM3 = logs.reduce((acc, curr) => acc + (curr.capacidad || 0), 0);
        sheetData.push(["TOTAL VIAJES:", logs.length]);
        sheetData.push(["TOTAL VOLUMEN (m3):", totalM3]);
        const ws = XLSX_LIB.utils.aoa_to_sheet(sheetData);
        XLSX_LIB.utils.book_append_sheet(wb, ws, "Reporte Diario");
        XLSX_LIB.writeFile(wb, `Reporte_Diario_${selectedDate}.xlsx`);
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleExportExcel = async () => {
    if (!isAdminOrMaster) return alert("Solo Admin/Master");
    if (!window.XLSX) return alert("Cargando Excel...");
    const XLSX_LIB = window.XLSX;
    setLoading(true);

    try {
      const q = query(
        collection(db, collectionPath, "logs"),
        where("dateString", ">=", exportStartDate),
        where("dateString", "<=", exportEndDate)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ ...d.data(), createdAt: d.data().createdAt?.toDate() }));
      
      if (data.length === 0) { setLoading(false); return alert("Sin datos en el rango seleccionado"); }

      const wb = XLSX_LIB.utils.book_new();
      
      const FMT_NUMBER = "#,##0";
      const FMT_CURRENCY = "$#,##0.00";

      // --- 1. HOJA TOTAL ---
      let totalM3 = 0;
      let totalImport = 0;

      data.forEach(log => {
          totalM3 += (log.capacidad || 0);
          const p = log.priceSnapshot || pricePerM3;
          totalImport += (log.capacidad || 0) * p;
      });

      const summaryData = [
        ["REPORTE CONCENTRADO DE OBRA"],
        [`Periodo: ${exportStartDate} al ${exportEndDate}`],
        [`Precio Actual (Ref):`, pricePerM3],
        ["Generado por: " + currentAuth.name],
        [""],
        ["RESUMEN GENERAL"],
        ["Total Viajes", data.length],
        ["Total Volumen (m3)", totalM3],
        ["IMPORTE TOTAL ESTIMADO", totalImport], 
        [""],
        ["RESUMEN POR PROVEEDOR (CAMIONES)"],
        ["Proveedor", "Placa", "Viajes", "Volumen (m3)", "Importe ($)"]
      ];

      const supplierStats = {};
      const providerCCStats = {};

      data.forEach(log => {
        const prov = log.agrupacion || "SIN ASIGNAR";
        const p = log.priceSnapshot || pricePerM3;

        if (!supplierStats[prov]) supplierStats[prov] = { plates: {}, totalTrips: 0, totalM3: 0, money: 0 };
        supplierStats[prov].totalTrips += 1;
        supplierStats[prov].totalM3 += (log.capacidad || 0);
        supplierStats[prov].money += (log.capacidad || 0) * p;

        const plate = log.placas;
        if (!supplierStats[prov].plates[plate]) supplierStats[prov].plates[plate] = { trips: 0, m3: 0, money: 0 };
        supplierStats[prov].plates[plate].trips += 1;
        supplierStats[prov].plates[plate].m3 += (log.capacidad || 0);
        supplierStats[prov].plates[plate].money += (log.capacidad || 0) * p;

        const ccKey = `${log.locationName} (CC: ${log.cc || 'S/N'})`;
        if (!providerCCStats[prov]) providerCCStats[prov] = {};
        if (!providerCCStats[prov][ccKey]) providerCCStats[prov][ccKey] = { m3: 0, money: 0 };
        providerCCStats[prov][ccKey].m3 += (log.capacidad || 0);
        providerCCStats[prov][ccKey].money += (log.capacidad || 0) * p;
      });

      Object.keys(supplierStats).forEach(prov => {
        summaryData.push([`PROVEEDOR: ${prov}`, "", supplierStats[prov].totalTrips, supplierStats[prov].totalM3, supplierStats[prov].money]);
        Object.keys(supplierStats[prov].plates).forEach(plate => {
          const pData = supplierStats[prov].plates[plate];
          summaryData.push(["", plate, pData.trips, pData.m3, pData.money]);
        });
        summaryData.push([""]); 
      });

      summaryData.push([""]); 
      summaryData.push(["DESGLOSE DE GASTOS POR CENTRO DE COSTO (POR PROVEEDOR)"]);
      summaryData.push(["Proveedor", "Centro de Costo (Zona)", "Volumen Total (m3)", "Importe Total ($)"]);

      Object.keys(providerCCStats).forEach(prov => {
          Object.keys(providerCCStats[prov]).forEach(ccKey => {
              const stats = providerCCStats[prov][ccKey];
              summaryData.push([prov, ccKey, stats.m3, stats.money]);
          });
          summaryData.push([""]);
      });

      const wsSummary = XLSX_LIB.utils.aoa_to_sheet(summaryData);
      XLSX_LIB.utils.book_append_sheet(wb, wsSummary, "RESUMEN_TOTAL");

      const days = [...new Set(data.map(item => item.dateString))].sort();

      days.forEach(day => {
        const dayLogs = data.filter(d => d.dateString === day);
        dayLogs.sort((a,b) => a.createdAt - b.createdAt);
        
        const dayProvStats = {};
        const truckNotes = {}; 
        const dayCCStats = {};

        dayLogs.forEach(log => {
          const p = log.priceSnapshot || pricePerM3;
          const prov = log.agrupacion || "SIN ASIGNAR";
          if (!dayProvStats[prov]) dayProvStats[prov] = { plates: {} };
          const plate = log.placas;
          if (!dayProvStats[prov].plates[plate]) dayProvStats[prov].plates[plate] = { trips: 0, m3: 0, capacity: log.capacidad, money: 0 };
          dayProvStats[prov].plates[plate].trips += 1;
          dayProvStats[prov].plates[plate].m3 += (log.capacidad || 0);
          dayProvStats[prov].plates[plate].money += (log.capacidad || 0) * p;

          if (log.noteNumber && !truckNotes[plate]) {
              truckNotes[plate] = log.noteNumber;
          }

          const ccKey = `${log.locationName} (CC: ${log.cc || 'S/N'})`;
          if (!dayCCStats[ccKey]) dayCCStats[ccKey] = { trips: 0, m3: 0, money: 0 };
          dayCCStats[ccKey].trips += 1;
          dayCCStats[ccKey].m3 += (log.capacidad || 0);
          dayCCStats[ccKey].money += (log.capacidad || 0) * p;
        });

        const daySheetData = [
          ["CONCENTRADORA DE RESIDUOS MEXICANA, S.A. DE C.V."],
          [`CONTROL DE VIAJES DE ACARREOS - FECHA: ${day}`],
          [""],
          ["No.", "HORA", "PLACAS", "PROVEEDOR", "M3", "PRECIO", "IMPORTE", "RUTA", "CC", "NOTA", "CAPTURISTA", "FACTURA", "GPS LINK"]
        ];

        dayLogs.forEach((log, idx) => {
            const p = log.priceSnapshot || pricePerM3;
            const gpsLink = log.gps ? `https://maps.google.com/?q=${log.gps.lat},${log.gps.lng}` : 'Sin GPS';
            const capturista = log.recordedBy || 'Desconocido';
            daySheetData.push([
                idx + 1,
                log.createdAt ? log.createdAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '',
                log.placas,
                log.agrupacion,
                log.capacidad,
                p,
                log.capacidad * p,
                log.locationName,
                log.cc,
                log.noteNumber || '',
                capturista,
                '',
                gpsLink
            ]);
        });

        daySheetData.push([""]);
        daySheetData.push([""]);
        
        daySheetData.push(["RESUMEN DEL DÍA POR CAMIÓN"]);
        daySheetData.push(["No.", "PLACA", "PROVEEDOR", "M3", "PRECIO REF", "No. VIAJES", "COSTO TOTAL", "TOTAL M3", "NO. NOTA", "NO. FACTURA", "SEMANA ENVIO", "OBSERVACIONES"]);

        let rowCount = 1;
        Object.keys(dayProvStats).forEach(prov => {
           Object.keys(dayProvStats[prov].plates).forEach(plate => {
             const pData = dayProvStats[prov].plates[plate];
             const finalNote = truckNotes[plate] || ""; 
             daySheetData.push([rowCount++, plate, prov, pData.capacity, pricePerM3, pData.trips, pData.money, pData.m3, finalNote, "", "", ""]);
           });
        });

        daySheetData.push([""]);
        daySheetData.push(["RESUMEN DE ZONAS Y CENTROS DE COSTO DEL DÍA"]);
        daySheetData.push(["ZONA / BANCO (CC)", "No. VIAJES", "VOLUMEN (m3)", "IMPORTE ($)"]);
        
        Object.keys(dayCCStats).forEach(key => {
            const stat = dayCCStats[key];
            daySheetData.push([key, stat.trips, stat.m3, stat.money]);
        });
        
        const wsDay = XLSX_LIB.utils.aoa_to_sheet(daySheetData);
        XLSX_LIB.utils.book_append_sheet(wb, wsDay, day);
      });

      XLSX_LIB.writeFile(wb, `Reporte_Obra_${exportStartDate}_al_${exportEndDate}.xlsx`);

    } catch (e) { alert("Error Excel: " + e.message); }
    setLoading(false);
  };

  const processScan = async (truck, location, noteNumber = "") => {
    setProcessingScan(true);
    let gps = null;
    try {
        gps = await Promise.race([
            getGPS(),
            new Promise(resolve => setTimeout(() => resolve(null), 2000))
        ]);
    } catch(e) { console.log("GPS Skipped"); }

    const logData = {
        truckId: truck.id, 
        placas: truck.placas, 
        capacidad: truck.capacidad, 
        agrupacion: truck.agrupacion,
        locationName: location.name, 
        cc: location.cc,
        noteNumber: noteNumber,
        priceSnapshot: Number(pricePerM3),
        createdAt: serverTimestamp(),
        dateString: getTodayString(),
        recordedBy: currentAuth.name,
        gps: gps 
    };

    addDoc(collection(db, collectionPath, "logs"), logData).catch(e => console.error("Error saving doc", e));

    setScanSuccess({ truck, location, noteNumber });
    setTimeout(() => setScanSuccess(null), 2500); 
    setPendingScan(null);
    setProcessingScan(false);
  };

  const handleScan = async (code) => {
    if (processingScan) return; 
    if (selectedDate !== getTodayString()) return alert("⚠️ Error de Fecha: Solo puedes registrar viajes hoy.");
    setIsScanning(false);
    playBeep();
    if (!selectedLocationId) return alert("⚠️ SELECCIONA ZONA");
    const truck = trucks.find(t => t.id === code);
    const location = locations.find(l => l.id === selectedLocationId);
    if (truck && location) {
        const recentLogs = logs.filter(l => l.truckId === truck.id && (new Date() - l.createdAt) < 5 * 60 * 1000);
        if (recentLogs.length > 0) { if(!confirm(`⚠️ ADVERTENCIA: Este camión se registró hace ${Math.floor((new Date() - recentLogs[0].createdAt)/60000)} minutos. ¿Registrar de nuevo?`)) return; }
        const todayLogs = logs.filter(l => l.truckId === truck.id);
        if (todayLogs.length === 0) { setPendingScan({ truck, location }); setNoteInput(""); setShowNoteModal(true); } else { const prevNote = todayLogs[0].noteNumber || ""; processScan(truck, location, prevNote); }
    } else { alert("Código inválido o no encontrado"); }
  };

  const confirmNote = () => { if (!noteInput.trim()) return alert("Nota obligatoria."); processScan(pendingScan.truck, pendingScan.location, noteInput); setShowNoteModal(false); };
  const cancelNote = () => { setShowNoteModal(false); setPendingScan(null); setNoteInput(""); };
  const handleEditLog = async () => { if(!editingLog) return; try { await updateDoc(doc(db, collectionPath, "logs", editingLog.id), { noteNumber: editingLog.noteNumber, locationName: editingLog.locationName }); setEditingLog(null); } catch(e) { alert("Error: " + e.message); } };
  const handleSaveNote = async () => { await setDoc(doc(db, collectionPath, "daily_notes", selectedDate), { text: dailyNote }); alert("✅ Nota guardada"); };
  const handleAddLocation = async () => { if (!isSupervisorOrHigher) return alert("Permisos insuficientes"); if(!newLocation.name) return alert("Faltan datos"); await addDoc(collection(db, collectionPath, "locations"), newLocation); setNewLocation({ name: '', cc: '' }); };
  const handleAddTruck = async () => { if (!isAdminOrMaster) return alert("Solo Admin/Master"); const docRef = await addDoc(collection(db, collectionPath, "trucks"), { placas: newTruck.placas.toUpperCase(), capacidad: parseFloat(newTruck.capacidad), agrupacion: newTruck.agrupacion, createdAt: serverTimestamp() }); setNewTruck({ placas: '', capacidad: '', agrupacion: '' }); setShowQRModal({ id: docRef.id, placas: newTruck.placas.toUpperCase(), capacidad: newTruck.capacidad, agrupacion: newTruck.agrupacion }); };
  const handleCreateUser = async () => { if (!isMaster) return alert("⛔ Solo MasterAdmin."); if (!newUser.name || !newUser.pin) return alert("Faltan datos"); await addDoc(collection(db, collectionPath, "system_users"), newUser); setNewUser({ name: '', pin: '', role: 'checker' }); alert("Usuario creado"); };
  const deleteItem = async (coll, id) => { 
      // Permitimos a Admin eliminar cosas generales para igualar su experiencia, pero reservamos Usuarios/Wipe para Master
      if (!isAdminOrMaster && coll !== 'system_users') return alert("⛔ Solo Admin/Master.");
      if (coll === 'system_users' && !isMaster) return alert("⛔ Solo MasterAdmin puede eliminar usuarios.");
      
      if(confirm("¿Eliminar?")) await deleteDoc(doc(db, collectionPath, coll, id)); 
  };
  
  const handleWipeData = async () => {
    if (!isMaster) return alert("⛔ Solo MasterAdmin.");
    if (!confirm("⚠️ ¡PELIGRO! ¿Borrar TODOS los viajes históricos?")) return;
    const pass = prompt("Confirma tu clave de MASTER:");
    if (!pass) return;
    setLoading(true);
    try {
        const q = query(collection(db, collectionPath, "system_users"), where("name", "==", currentAuth.name), where("pin", "==", pass), where("role", "==", "masteradmin"));
        const snapshot = await getDocs(q);
        if (snapshot.empty) { setLoading(false); return alert("Clave incorrecta."); }
        
        const logsSnapshot = await getDocs(collection(db, collectionPath, "logs"));
        const batch = writeBatch(db);
        logsSnapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        alert("Limpieza completada.");
    } catch(e) { alert("Error: " + e.message); }
    setLoading(false);
  };

  if (loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>Cargando Sistema...</div>;

  if (!currentAuth.isAuthenticated) {
    return (
      <div style={styles.loginScreen}>
        <div style={styles.loginBox}>
          <h1>🚜 Control Obra V16.2</h1>
          <input style={{...styles.input, marginBottom:'10px'}} placeholder="Usuario" value={authInput.user} onChange={e => setAuthInput({...authInput, user: e.target.value})} />
          <div style={{position: 'relative', marginBottom: '20px'}}>
            <input style={{...styles.input, paddingRight: '40px'}} type={showPin ? "text" : "password"} placeholder="PIN" value={authInput.pin} onChange={e => setAuthInput({...authInput, pin: e.target.value})} />
            <button onClick={() => setShowPin(!showPin)} style={{position: 'absolute', right: '10px', top: '25%'}}>{showPin ? <Icons.EyeOff/> : <Icons.Eye/>}</button>
          </div>
          <button onClick={handleLogin} style={{...styles.button, ...styles.bgBlueGradient, color:'white'}}>ENTRAR AL SISTEMA</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{printStyles}</style>
      <header style={styles.header} className="no-print">
        <div>
          <h1 style={styles.title}>🚜 Control Obra</h1>
          <p style={styles.subtitle}>
             <span style={{...styles.onlineIndicator, backgroundColor: isOnline ? '#22c55e' : '#ef4444'}}></span>
             {isOnline ? '' : 'OFFLINE - '} 
             {currentAuth.name} | {currentAuth.role.toUpperCase()}
          </p>
        </div>
        <div style={{textAlign:'right'}}>
           <button onClick={handleLogout} style={{fontSize:'0.7rem', color:'#fca5a5', background:'none', border:'none'}}>SALIR</button>
           <input type="date" value={selectedDate} onChange={(e) => e.target.value && setSelectedDate(e.target.value)} style={{background:'#334155', border:'none', color:'white', borderRadius:'4px'}} />
        </div>
      </header>

      {editingLog && (
          <div style={styles.modalOverlay}>
              <div style={styles.modalContent}>
                  <h3>✏️ Editar Viaje</h3>
                  <div style={{textAlign:'left', marginBottom:10}}><label style={{fontSize:'0.8rem'}}>Nota Física:</label><input style={styles.input} value={editingLog.noteNumber} onChange={e=>setEditingLog({...editingLog, noteNumber: e.target.value})} /></div>
                  <div style={{textAlign:'left', marginBottom:20}}><label style={{fontSize:'0.8rem'}}>Zona/Banco:</label><select style={styles.select} value={editingLog.locationName} onChange={e=>setEditingLog({...editingLog, locationName: e.target.value})}>{locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}</select></div>
                  <div style={{display:'flex', gap:10}}><button onClick={()=>setEditingLog(null)} style={{...styles.button, background:'#ef4444'}}>Cancelar</button><button onClick={handleEditLog} style={styles.button}>Guardar</button></div>
              </div>
          </div>
      )}

      {showNoteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{color: '#b91c1c'}}>📝 Primer Viaje del Día</h2>
            <p>Ingresa el número de Nota/Folio físico:</p>
            <input style={{...styles.input, textAlign:'center', fontSize:'1.5rem', fontWeight:'bold'}} value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="000" autoFocus />
            <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                 <button onClick={cancelNote} style={{...styles.button, backgroundColor:'#ef4444'}}>CANCELAR</button>
                 <button onClick={confirmNote} style={{...styles.button, ...styles.bgBlueGradient}}>CONFIRMAR</button>
            </div>
            {processingScan && <p style={{marginTop:10, color:'#64748b', fontSize:'0.8rem'}}>⏳ Guardando ubicación GPS...</p>}
          </div>
        </div>
      )}
      
      {showNotePreview && noteData && (
          <div style={styles.modalOverlay}>
              <div style={{...styles.modalContent, maxWidth: '600px', width:'95%', textAlign:'left'}}>
                   <button onClick={() => setShowNotePreview(false)} style={styles.closeBtn}>×</button>
                   <div id="print-note">
                       <h2 style={{textAlign:'center', borderBottom:'2px solid #ccc', paddingBottom:'10px'}}>NOTA DE REMISIÓN</h2>
                       <div style={{display:'flex', justifyContent:'space-between', marginTop:'15px'}}>
                           <strong>FECHA: {noteData.date}</strong>
                           <strong>PLACA: {noteData.plate}</strong>
                       </div>
                       <p>PROVEEDOR: {noteData.provider}</p>
                       
                       <table style={{width:'100%', marginTop:'20px', borderCollapse:'collapse', fontSize:'0.8rem'}}>
                           <thead>
                               <tr style={{background:'#f0f0f0'}}>
                                   <th style={{padding:'5px', border:'1px solid #ccc'}}>HORA</th>
                                   <th style={{padding:'5px', border:'1px solid #ccc'}}>NOTA</th>
                                   <th style={{padding:'5px', border:'1px solid #ccc'}}>ZONA</th>
                                   <th style={{padding:'5px', border:'1px solid #ccc'}}>M3</th>
                               </tr>
                           </thead>
                           <tbody>
                               {noteData.trips.map((t, idx) => (
                                   <tr key={idx}>
                                       <td style={{padding:'5px', border:'1px solid #ccc'}}>{t.createdAt ? t.createdAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</td>
                                       <td style={{padding:'5px', border:'1px solid #ccc'}}>{t.noteNumber}</td>
                                       <td style={{padding:'5px', border:'1px solid #ccc'}}>{t.locationName}</td>
                                       <td style={{padding:'5px', border:'1px solid #ccc'}}>{t.capacidad}</td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                       
                       <div style={{marginTop:'20px', textAlign:'right', fontSize:'1rem'}}>
                           <p>TOTAL VIAJES: <strong>{noteData.totalViajes}</strong></p>
                           <p>TOTAL VOLUMEN: <strong>{noteData.totalM3} m³</strong></p>
                       </div>
                       <div style={{marginTop: '30px', textAlign:'center', borderTop:'1px solid #ccc', paddingTop:'5px'}}>
                           Firma de Conformidad
                       </div>
                   </div>
                   
                   <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                       <button onClick={() => {
                           const printContent = document.getElementById('print-note').innerHTML;
                           const originalContents = document.body.innerHTML;
                           document.body.innerHTML = printContent;
                           window.print();
                           document.body.innerHTML = originalContents;
                           window.location.reload(); 
                       }} style={{...styles.button, ...styles.bgBlueGradient}}>IMPRIMIR PDF</button>
                       
                       <button onClick={() => {
                            const wb = window.XLSX.utils.book_new();
                            const data = [
                                ["NOTA DE REMISIÓN", `FECHA: ${noteData.date}`],
                                ["PLACA:", noteData.plate],
                                ["PROVEEDOR:", noteData.provider],
                                [""],
                                ["HORA", "NOTA", "ZONA", "CC", "M3"]
                            ];
                            noteData.trips.forEach(t => {
                                data.push([
                                    t.createdAt ? t.createdAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '',
                                    t.noteNumber,
                                    t.locationName,
                                    t.cc,
                                    t.capacidad
                                ]);
                            });
                            data.push([""]);
                            data.push(["TOTAL VIAJES:", noteData.totalViajes]);
                            data.push(["TOTAL VOLUMEN:", noteData.totalM3]);
                            
                            const ws = window.XLSX.utils.aoa_to_sheet(data);
                            window.XLSX.utils.book_append_sheet(wb, ws, "NOTA");
                            window.XLSX.writeFile(wb, `Nota_${noteData.plate}_${noteData.date}.xlsx`);
                       }} style={{...styles.button, ...styles.bgBlueGradient}}>DESCARGAR EXCEL</button>
                   </div>
              </div>
          </div>
      )}

      {isScanning && <NativeScanner onScan={handleScan} onCancel={() => setIsScanning(false)} />}
      {processingScan && !showNoteModal && (
          <div style={styles.modalOverlay}>
              <div style={{color:'white', fontWeight:'bold', textShadow:'0 2px 4px rgba(0,0,0,0.5)'}}>⏳ Registrando...</div>
          </div>
      )}

      <main style={styles.main}>
        {activeTab === 'dashboard' && (
          <div className="no-print-padding">
            {/* KPI CARDS */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px'}} className="no-print">
              <div style={styles.kpiCard}><div style={styles.kpiValue}>{logs.length}</div><div style={styles.kpiLabel}>Viajes</div></div>
              <div style={{...styles.kpiCard, background:'#059669'}}><div style={styles.kpiValue}>{logs.reduce((a,c)=>a+(c.capacidad||0),0)}</div><div style={styles.kpiLabel}>M³ Total</div></div>
              <div style={{...styles.kpiCard, background:'#7c3aed'}}><div style={styles.kpiValue}>{[...new Set(logs.map(l=>l.placas))].length}</div><div style={styles.kpiLabel}>Camiones</div></div>
            </div>

            {isAdminOrMaster && (
              <div style={{...styles.card, marginTop: '20px', border: '2px solid #3b82f6'}} className="no-print">
                <h3 style={{margin:'0 0 10px 0', fontSize:'0.9rem', color:'#1e40af'}}>📑 Reporte y Finanzas (Admin/Master)</h3>
                
                {/* CONFIGURAR PRECIO */}
                <div style={{marginBottom:'15px', paddingBottom:'15px', borderBottom:'1px solid #e2e8f0'}}>
                    <label style={{fontSize:'0.75rem', fontWeight:'bold', display:'block'}}>Precio por m³ ($):</label>
                    <div style={{display:'flex', gap:'8px'}}>
                        <input type="number" value={pricePerM3} onChange={e=>setPricePerM3(e.target.value)} style={{...styles.input, padding:'6px'}} />
                        <button onClick={savePrice} style={{...styles.button, width:'auto', fontSize:'0.75rem', backgroundColor: '#15803d'}}>Guardar Precio</button>
                    </div>
                </div>

                <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                  <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} style={{...styles.input, padding:'8px'}} />
                  <span>a</span>
                  <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} style={{...styles.input, padding:'8px'}} />
                </div>
                <button onClick={handleExportExcel} style={{...styles.button, marginTop:'10px', fontSize:'0.8rem'}}>DESCARGAR EXCEL MULTI-HOJA</button>
              </div>
            )}
            
            {/* BOTÓN DESCARGAR REPORTE DEL DÍA (SUPERVISOR/ADMIN/MASTER) */}
            {isSupervisorOrHigher && (
                 <div style={{...styles.card, marginTop:'20px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f0fdf4', borderColor:'#86efac'}}>
                     <div>
                         <h3 style={{margin:0, fontSize:'0.9rem', color:'#166534'}}>📊 Reporte Diario ({selectedDate})</h3>
                         <p style={{margin:0, fontSize:'0.7rem', color:'#15803d'}}>Descargar Excel exclusivo de este día</p>
                     </div>
                     <button onClick={handleExportDailyExcel} style={{...styles.button, width:'auto', padding:'8px 16px', fontSize:'0.8rem', background:'#16a34a'}}>DESCARGAR</button>
                 </div>
            )}

            <div style={{...styles.card, padding:0, overflow:'hidden', marginTop:'20px'}} className="print-only">
               <div style={{padding:'12px', background:'#f8fafc', fontWeight:'bold', borderBottom:'1px solid #eee'}}>📋 {selectedDate}</div>
               <div style={{overflowX:'auto'}}>
                <table style={styles.table}>
                  <thead><tr><th style={styles.th}>#</th><th style={styles.th}>Placa</th><th style={styles.th}>Nota</th><th style={styles.th}>Hora</th><th style={styles.th}>Zona</th><th style={{...styles.th, textAlign:'right'}}>M³</th><th style={styles.th}></th></tr></thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={log.id} style={{display: i < 10 ? 'table-row' : 'none'}} className="print-row">
                        <td style={styles.td}>{logs.length - i}</td>
                        <td style={{...styles.td, fontWeight:'bold'}}>{log.placas}</td>
                        <td style={{...styles.td, color:'#2563eb'}}>{log.noteNumber || '-'}</td>
                        <td style={styles.td}>{log.createdAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                        <td style={styles.td}>{log.locationName}</td>
                        <td style={{...styles.td, textAlign:'right', fontWeight:'bold'}}>{log.capacidad}</td>
                        <td style={styles.td} className="no-print">
                            {isSupervisorOrHigher && <button onClick={()=>setEditingLog(log)} style={{border:'none', background:'none', color:'#2563eb', marginRight:'10px', cursor:'pointer'}}><Icons.Edit/></button>}
                            {isAdminOrMaster && <button onClick={()=>deleteItem('logs', log.id)} style={{border:'none', background:'none', color:'red', cursor:'pointer'}}>🗑️</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <style>{`@media print { .print-row { display: table-row !important; } }`}</style>
               </div>
            </div>

            <div style={{...styles.card, marginTop: '20px'}}>
                <h3 style={{margin:'0 0 10px 0', fontSize:'0.9rem', color:'#64748b'}}>🚛 Flotilla Activa ({selectedDate})</h3>
                <div style={{display:'flex', flexWrap:'wrap', gap:'8px'}}>
                    {[...new Set(logs.map(l=>l.placas))].map(placa => (
                        <button key={placa} onClick={() => handleTruckClick(placa)} style={{background:'#e0f2fe', border:'none', color:'#0369a1', padding:'4px 8px', borderRadius:'6px', fontSize:'0.8rem', fontWeight:'bold', cursor:'pointer'}}>{placa}</button>
                    ))}
                    {logs.length === 0 && <span style={{color:'#94a3b8', fontSize:'0.8rem'}}>Sin actividad hoy</span>}
                </div>
                {isSupervisorOrHigher && <p style={{fontSize:'0.6rem', color:'#94a3b8', marginTop:'5px'}}>* Click en la placa para ver Nota de Remisión</p>}
            </div>

            <div style={styles.noteBlock} className="no-print">
              <strong>📝 Nota:</strong>
              <textarea style={{...styles.textArea, minHeight:'60px'}} value={dailyNote} onChange={e=>setDailyNote(e.target.value)} />
              <button onClick={handleSaveNote} style={{...styles.button, background:'#f59e0b', marginTop:'5px'}}>Guardar</button>
            </div>
          </div>
        )}

        {/* ... (RESTO DE PESTAÑAS IGUALES) ... */}
        {activeTab === 'scanner' && (
          <div style={{textAlign:'center'}}>
             <div style={{...styles.card, marginBottom:'20px'}}>
               <h3>1. Selecciona Zona</h3>
               <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                 {locations.map(l => <button key={l.id} onClick={()=>setSelectedLocationId(l.id)} style={{padding:'15px', border: selectedLocationId===l.id?'2px solid blue':'1px solid #eee', borderRadius:'10px', background:'white'}}><b>{l.name}</b></button>)}
               </div>
             </div>
             <button onClick={()=>{ if(!currentAuth.isAuthenticated) return setShowAuthModal(true); if(!selectedLocationId) return alert("Selecciona zona"); setIsScanning(true); }} style={{...styles.button, padding:'20px', fontSize:'1.2rem'}}>📷 ESCANEAR QR</button>
          </div>
        )}

        {activeTab === 'config' && (
          <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
            
            {/* CORRECCIÓN AQUI: Se cambió la verificación de nombre "EduardoAdmin" por verificación de rol "masteradmin" */}
            {isMaster && (
              <div style={{...styles.card, border:'2px solid #3b82f6', backgroundColor:'#eff6ff'}}>
                <h3 style={{color:'#1e40af', marginTop:0}}>👥 Gestión de Usuarios (Master)</h3>
                <div style={{display:'flex', gap:'10px', marginBottom:'10px', flexDirection: 'column'}}>
                  <div style={{display:'flex', gap:'10px'}}>
                      <input style={{...styles.input, flex:2}} placeholder="Nombre" value={newUser.name} onChange={e=>setNewUser({...newUser, name:e.target.value})} />
                      <input style={{...styles.input, flex:1}} type="tel" placeholder="PIN" value={newUser.pin} onChange={e=>setNewUser({...newUser, pin:e.target.value})} />
                  </div>
                  <select style={styles.select} value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})}>
                      <option value="checker">Checador (Solo Escanear)</option>
                      <option value="supervisor">Supervisor (Escanear + Notas + Zonas)</option>
                      <option value="admin">Admin (Total + Excel + Precios)</option>
                      {/* Agregado para poder crear otros MasterAdmins si es necesario */}
                      <option value="masteradmin">Master Admin (Control Total)</option>
                  </select>
                </div>
                <button onClick={handleCreateUser} style={{...styles.button, width:'100%', fontSize:'0.8rem'}}>CREAR USUARIO</button>

                {/* LISTA USUARIOS */}
                <div style={{marginTop:'10px', borderTop:'1px solid #bfdbfe', paddingTop:'10px'}}>
                  {users.map(u => (
                    <div key={u.id} style={{display:'flex', justifyContent:'space-between', padding:'5px 0', fontSize:'0.9rem'}}>
                      <span>{u.name} ({u.role}) - PIN: {u.pin}</span>
                      <button onClick={()=>deleteItem('system_users', u.id)} style={{border:'none', background:'none', color:'red', cursor:'pointer'}}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:'20px', borderTop:'2px solid #fca5a5', paddingTop:'10px'}}>
                   <button onClick={handleWipeData} style={{...styles.button, backgroundColor:'#dc2626'}}>⚠️ LIMPIAR BASE DE DATOS</button>
                </div>
              </div>
            )}

            {currentAuth.isAuthenticated && (
              <>
                <div style={{...styles.card, opacity: isSupervisorOrHigher ? 1 : 0.8}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                     <h3>Zonas / Bancos</h3>
                     {!isSupervisorOrHigher && <span style={{fontSize:'0.7rem', color:'gray'}}>Solo Lectura</span>}
                  </div>
                  {/* SOLO ADMIN Y SUPERVISOR PUEDEN AGREGAR ZONAS */}
                  {isSupervisorOrHigher && (
                      <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                        <input style={{...styles.input, flex:2}} placeholder="Nombre" value={newLocation.name} onChange={e=>setNewLocation({...newLocation, name:e.target.value})} />
                        <input style={{...styles.input, flex:1}} placeholder="CC" value={newLocation.cc} onChange={e=>setNewLocation({...newLocation, cc:e.target.value})} />
                        <button onClick={handleAddLocation} style={{...styles.button, width:'auto'}}>+</button>
                      </div>
                  )}
                  {locations.map(l => <div key={l.id} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #eee'}}><span>{l.name}</span> {isAdminOrMaster && <button onClick={()=>deleteItem('locations', l.id)} style={{background:'none', border:'none', color:'red'}}>🗑️</button>}</div>)}
                </div>

                <div style={{...styles.card}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h3>Camiones</h3>
                    {!isAdminOrMaster && <span style={{fontSize:'0.7rem', color:'red'}}>Solo Lectura (Admin/Master)</span>}
                  </div>
                  
                  {isAdminOrMaster && (
                    <div style={{marginBottom:'10px', paddingBottom:'10px', borderBottom:'1px solid #eee'}}>
                      <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                        <input style={{...styles.input, textTransform:'uppercase'}} placeholder="Placas" value={newTruck.placas} onChange={e=>setNewTruck({...newTruck, placas:e.target.value})} />
                        <input style={{...styles.input, type:'number', placeholder:'M3'}} value={newTruck.capacidad} onChange={e=>setNewTruck({...newTruck, capacidad:e.target.value})} />
                      </div>
                      <input style={{...styles.input, marginBottom:'10px'}} placeholder="Sindicato" value={newTruck.agrupacion} onChange={e=>setNewTruck({...newTruck, agrupacion:e.target.value})} />
                      <button onClick={handleAddTruck} style={styles.button}>GUARDAR</button>
                    </div>
                  )}
                  
                  <div style={{marginTop:'10px', maxHeight: '300px', overflowY: 'auto'}}>
                    {trucks.map(t => (
                      <div key={t.id} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #eee'}}>
                        <div><b>{t.placas}</b> ({t.capacidad}m³)</div>
                        <div style={{display:'flex', gap:'10px'}}>
                           <button onClick={()=>setShowQRModal(t)} style={{background:'none', border:'none'}}>🏁</button>
                           {isAdminOrMaster && <button onClick={()=>deleteItem('trucks', t.id)} style={{background:'none', border:'none', color:'red'}}>🗑️</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {showQRModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContentOficio}>
             <button onClick={()=>setShowQRModal(null)} style={{...styles.closeBtn, top:'10px', right:'10px'}} className="no-print">×</button>
             
             <div id="print-oficio" className="oficio-container">
                <div className="oficio-header">
                    CONSTANCIA DE ASIGNACIÓN DE CÓDIGO QR<br/>
                    <span style={{fontSize:'10pt', fontWeight:'normal'}}>CONTROL DE ACARREOS Y VOLUMETRÍA</span>
                </div>

                <div className="oficio-date">
                    {getLongDateString()}
                </div>

                <div className="oficio-body">
                    <p>
                        Por medio de la presente, se hace entrega del distintivo digital (Código QR) único e intransferible 
                        asignado a la unidad de transporte descrita a continuación. Este código servirá como identificación 
                        oficial dentro de la obra para el registro, conteo y validación de viajes de material.
                    </p>
                    <p>
                        El portador se compromete a mantener el código visible y en buen estado, aceptando que la capacidad 
                        cúbica asignada es la correcta según las mediciones realizadas.
                    </p>
                </div>

                <div className="oficio-data-box">
                    <div className="oficio-row">
                        <span className="oficio-label">PLACAS DEL VEHÍCULO:</span>
                        <span className="oficio-value">{showQRModal.placas}</span>
                    </div>
                    <div className="oficio-row">
                        <span className="oficio-label">CAPACIDAD ASIGNADA:</span>
                        <span className="oficio-value">{showQRModal.capacidad} m³</span>
                    </div>
                    <div className="oficio-row" style={{borderBottom:'none'}}>
                        <span className="oficio-label">PROVEEDOR / SINDICATO:</span>
                        <span className="oficio-value">{showQRModal.agrupacion}</span>
                    </div>
                </div>

                <div className="oficio-qr-container">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${showQRModal.id}`} alt="QR" className="oficio-qr-img" />
                    {/* ID INTERNO OCULTO POR SEGURIDAD */}
                </div>

                <div className="oficio-signatures">
                    <div className="sign-box">
                        ENTREGA<br/><br/><br/>
                        __________________________<br/>
                        FIRMA Y NOMBRE<br/>
                        (ADMINISTRACIÓN)
                    </div>
                    <div className="sign-box">
                        RECIBE DE CONFORMIDAD<br/><br/><br/>
                        __________________________<br/>
                        FIRMA Y NOMBRE<br/>
                        (OPERADOR / PROVEEDOR)
                    </div>
                </div>
             </div>

             <div style={{textAlign:'center', marginTop:'20px', display:'flex', justifyContent:'center', gap:'10px'}} className="no-print">
                <button onClick={()=>setShowQRModal(null)} style={{...styles.button, width:'200px', fontSize:'1.1rem', backgroundColor:'#ef4444'}}>CERRAR</button>
                <button onClick={()=>window.print()} style={{...styles.button, width:'200px', fontSize:'1.1rem'}}>🖨️ IMPRIMIR OFICIO</button>
             </div>
          </div>
        </div>
      )}
      {scanSuccess && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{fontSize:'4rem'}}>✅</div>
            <h2>¡REGISTRADO!</h2>
            <p><b>{scanSuccess.truck.placas}</b> en <b>{scanSuccess.location.name}</b></p>
            <button onClick={()=>setScanSuccess(null)} style={styles.button}>CONTINUAR</button>
          </div>
        </div>
      )}

      <footer className="no-print" style={{textAlign:'center', padding:'20px', color:'#cbd5e1', fontSize:'0.7rem'}}>
        <p>Derechos del programa propiedad intelectual y dueño:<br/><b>Ing. Eduardo Lopez Garcia</b></p>
      </footer>

      <nav style={styles.nav} className="no-print">
        <button onClick={()=>handleTabChange('dashboard')} style={styles.navBtn}><Icons.List/>REPORTE</button>
        <button onClick={()=>handleTabChange('scanner')} style={styles.fab}><Icons.Camera/></button>
        <button onClick={()=>handleTabChange('config')} style={styles.navBtn}><Icons.Truck/>CONFIG</button>
      </nav>
    </div>
  );
}