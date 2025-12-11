import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp, getApps } from 'firebase/app';
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
  where,
  limit,
  orderBy
} from 'firebase/firestore';

// --- ESTILOS ---
const styles = {
  container: { fontFamily: "'Inter', system-ui, -apple-system, sans-serif", backgroundColor: '#f3f4f6', minHeight: '100vh', paddingBottom: '120px', color: '#334155', position: 'relative' },
  header: { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  title: { fontSize: '1.25rem', fontWeight: '800', margin: 0, letterSpacing: '-0.03em', textTransform: 'uppercase', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { fontSize: '0.75rem', color: '#94a3b8', margin: 0, fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' },
  main: { maxWidth: '900px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { backgroundColor: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)' },
  kpiCard: { padding: '20px', borderRadius: '16px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(145deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' },
  kpiValue: { fontSize: '2rem', fontWeight: '800', lineHeight: 1, textShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  kpiLabel: { fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.9, marginTop: '6px', fontWeight: '700', letterSpacing: '0.05em' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '0.85rem' },
  th: { textAlign: 'left', padding: '12px', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em' },
  td: { padding: '16px 12px', backgroundColor: 'white', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', firstChild: { borderTopLeftRadius: '10px', borderBottomLeftRadius: '10px' }, lastChild: { borderTopRightRadius: '10px', borderBottomRightRadius: '10px' } },
  nav: { position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '400px', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '24px', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 40, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(255,255,255,0.5)' },
  navBtn: { background: 'none', border: 'none', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer', transition: 'color 0.2s' },
  navBtnActive: { color: '#2563eb' },
  fab: { width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginTop: '-30px', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)', border: '4px solid #f8fafc', cursor: 'pointer', transition: 'transform 0.1s' },
  input: { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', backgroundColor: '#f8fafc', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', ':focus': { borderColor: '#3b82f6', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)' } },
  button: { width: '100%', padding: '16px', borderRadius: '14px', border: 'none', fontWeight: '700', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.9rem' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)', overflowY: 'auto' },
  modalContent: { backgroundColor: 'white', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '380px', textAlign: 'center', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  modalContentOficio: { backgroundColor: 'white', borderRadius: '8px', padding: '40px', width: '100%', maxWidth: '800px', minHeight: '80vh', textAlign: 'left', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  noteBlock: { backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(251, 191, 36, 0.1)' },
  textArea: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #fcd34d', minHeight: '100px', marginTop: '12px', fontSize: '0.95rem', backgroundColor: '#ffffff' },
  closeBtn: { position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: '1.2rem', fontWeight: 'bold', transition: 'background 0.2s' },
  loginScreen: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at top right, #334155, #0f172a)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  loginBox: { backgroundColor: 'white', borderRadius: '24px', padding: '40px 30px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
  select: { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', backgroundColor: '#f8fafc', marginBottom: '10px', outline: 'none' },
  bgBlueGradient: { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' },
  onlineIndicator: { display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', marginRight: '8px', boxShadow: '0 0 0 2px rgba(255,255,255,0.2)' },
  onlineBadge: { fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', marginLeft: '5px', fontWeight: 'bold' },
  accordionBtn: { width: '100%', padding: '18px 20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', textAlign: 'left', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '10px', fontSize: '0.95rem', color: '#334155', transition: 'all 0.2s' },
  rowCard: { background:'white', borderRadius:'12px', padding:'16px', marginBottom:'10px', border:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' },
  inputIconGroup: { position: 'relative', marginBottom: '15px' },
  inputIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
  inputWithIcon: { paddingLeft: '45px' },
  // ESTILOS BI (Agregados para la gráfica)
  chartContainer: { height: '220px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '20px 0', overflowX: 'auto' },
  barGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '40px', position: 'relative' },
  bar: { width: '100%', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease', minHeight: '4px', display:'flex', alignItems:'flex-end', justifyContent:'center' },
  barLabel: { fontSize: '0.7rem', color: '#64748b', marginTop: '8px', textAlign:'center', fontWeight:'600' },
  barValue: { fontSize: '0.7rem', color: '#1e293b', fontWeight:'700', marginBottom:'4px', background:'rgba(255,255,255,0.8)', padding:'2px 4px', borderRadius:'4px' },
  syncBanner: { background: '#f97316', color: 'white', padding: '8px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold', position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 49 },
  biTab: { background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.4)' }
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
  Camera: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
  Truck: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  List: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Trash: () => <span>🗑️</span>,
  Edit: () => <span>✏️</span>,
  Eye: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Report: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Building: () => <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Key: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  Chart: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
};

let firebaseConfig;
try {
  if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
  } else {
    throw new Error("No environment config");
  }
} catch (e) {
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

try { 
  enableIndexedDbPersistence(db).catch(err => {}); 
} catch(e){}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'controlexcavacion-default';
const isImmersive = typeof __app_id !== 'undefined';
const collectionPath = isImmersive ? `artifacts/${appId}/public/data` : "registros/proyecto-master";

const getTodayString = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const getLongDateString = () => { const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }; return new Date().toLocaleDateString('es-MX', options); };
const playBeep = () => { try { const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'); audio.volume = 0.5; audio.play().catch(()=>{}); if(navigator.vibrate) navigator.vibrate(200); } catch(e){} };

// FIX: Función GPS Robusta (Simulando la original con mejoras Offline)
const getGPS = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    const timer = setTimeout(() => { resolve(null); }, 5000); // 5s timeout original
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timer); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      (err) => { clearTimeout(timer); resolve(null); },
      { 
          enableHighAccuracy: false, // ORIGINAL: OFF para rapidez
          timeout: 4000, 
          maximumAge: 3600000 // 1 HORA de memoria para offline
      }
    );
  });
};

// Helper for currency - Safe wrapper
const fmtMoney = (n) => {
  try {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);
  } catch(e) {
    return `$${(n || 0).toFixed(2)}`;
  }
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

// --- COMPONENTES BI DASHBOARD (Inteligencia de Negocios) MEJORADO ---
const ChartBar = ({ data, labelKey, valueKey, color = '#3b82f6', title, emptyMsg = "Sin datos en este rango" }) => {
    if (!data || data.length === 0 || data.every(d => d[valueKey] === 0)) {
        return (
            <div style={styles.card}>
                <h3 style={{fontSize:'1rem', color:'#334155', marginBottom:'10px'}}>{title}</h3>
                <div style={{height: '150px', display: 'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontStyle:'italic', backgroundColor:'#f8fafc', borderRadius:'12px', flexDirection:'column', gap:'10px'}}>
                    <span style={{fontSize:'2rem', opacity:0.3}}>📉</span>
                    {emptyMsg}
                </div>
            </div>
        );
    }

    const max = Math.max(...data.map(d => d[valueKey]), 1);

    return (
        <div style={styles.card}>
            <h3 style={{fontSize:'1rem', color:'#334155', marginBottom:'10px'}}>{title}</h3>
            <div style={styles.chartContainer}>
                {data.map((item, idx) => {
                    const val = item[valueKey];
                    const heightPct = val > 0 ? Math.max((val / max) * 100, 4) : 0;
                    return (
                        <div key={idx} style={styles.barGroup}>
                            {val > 0 && <span style={styles.barValue}>{val}</span>}
                            <div style={{
                                ...styles.bar, 
                                height: `${heightPct}%`, 
                                backgroundColor: color,
                                opacity: val > 0 ? 1 : 0.1
                            }}></div>
                            <span style={styles.barLabel}>{item[labelKey]}</span>
                        </div>
                    )
                })}
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
  
  const [pendingWrites, setPendingWrites] = useState(false);

  const [trucks, setTrucks] = useState([]);
  const [logs, setLogs] = useState([]); // LOGS DEL DÍA (Dashboard y BI Realtime)

  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
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

  const [expandUsers, setExpandUsers] = useState(false);
  const [expandAddTruck, setExpandAddTruck] = useState(false);
  const [expandTruckList, setExpandTruckList] = useState(false);
  
  const [expandPriceConfig, setExpandPriceConfig] = useState(false);
  const [pricePinInput, setPricePinInput] = useState("");
  const [isPriceUnlocked, setIsPriceUnlocked] = useState(false);

  const SESSION_KEY = `control_obra_session_${appId}`; 

  const [exportStartDate, setExportStartDate] = useState(getTodayString());
  const [exportEndDate, setExportEndDate] = useState(getTodayString());
  
  const [noteData, setNoteData] = useState(null);
  const [showNotePreview, setShowNotePreview] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  useEffect(() => {
    document.title = "Control Pro GOLD";
    let meta = document.createElement('meta');
    meta.name = "apple-mobile-web-app-capable";
    meta.content = "yes";
    document.getElementsByTagName('head')[0].appendChild(meta);
  }, []);

  const isAdminOrMaster = ['masteradmin', 'admin'].includes(currentAuth.role);
  const isSupervisorOrHigher = ['masteradmin', 'admin', 'supervisor'].includes(currentAuth.role);
  const isMaster = currentAuth.role === 'masteradmin';

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

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error(e);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, u => { 
        if(u) setUser(u); 
        setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if(!currentAuth.isAuthenticated || !user) return;
    const reportPresence = async () => {
        const gps = await getGPS(); 
        if (!gps) return; 

        const userStatusRef = doc(db, collectionPath, "status", currentAuth.name);
        try {
            await setDoc(userStatusRef, { name: currentAuth.name, role: currentAuth.role, lastSeen: serverTimestamp(), gps: gps }, { merge: true });
        } catch(e) {}
    };
    reportPresence();
    const interval = setInterval(reportPresence, 60000);
    return () => clearInterval(interval);
  }, [currentAuth, user]);

  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        setCurrentAuth(parsedSession);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    
    let unsubUsers = () => {};
    if (isMaster) {
        unsubUsers = onSnapshot(collection(db, collectionPath, "system_users"), s => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => console.log(e));
    } else { setUsers([]); }

    const unsubTrucks = onSnapshot(collection(db, collectionPath, "trucks"), s => setTrucks(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => console.log(e));
    const unsubLocs = onSnapshot(collection(db, collectionPath, "locations"), s => setLocations(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => console.log(e));
    
    onSnapshot(doc(db, collectionPath, "settings", "general"), d => {
        if (d.exists()) setPricePerM3(d.data().pricePerM3 || 0);
    }, e => {});

    const logsQuery = query(
        collection(db, collectionPath, "logs"), 
        where("dateString", "==", selectedDate)
    );
    
    const unsubLogs = onSnapshot(logsQuery, { includeMetadataChanges: true }, s => {
      const data = [];
      let pendingCount = 0;
      s.docs.forEach(d => {
          const dat = d.data();
          if(d.metadata.hasPendingWrites) pendingCount++;
          data.push({
              id: d.id, 
              ...dat, 
              createdAt: dat.createdAt?.toDate ? dat.createdAt.toDate() : new Date(),
              isLocal: d.metadata.hasPendingWrites 
          });
      });
      data.sort((a, b) => b.createdAt - a.createdAt);
      setLogs(data);
      setPendingWrites(pendingCount > 0);
    }, e => console.log(e));

    getDoc(doc(db, collectionPath, "daily_notes", selectedDate)).then(d => {
      if (d.exists()) setDailyNote(d.data().text || ""); else setDailyNote("");
    }).catch(e=>{});
    
    return () => { unsubTrucks(); unsubLocs(); unsubUsers(); unsubLogs(); }
  }, [user, selectedDate, isMaster]); 

  const handleLogin = async () => {
    if (!user) { alert("Error de conexión. Recarga."); return; }
    if (!authInput.user || !authInput.pin) return alert("Ingresa usuario y PIN");

    setLoading(true);
    try {
        const q = query(
            collection(db, collectionPath, "system_users"), 
            where("name", "==", authInput.user.trim()),
            where("pin", "==", authInput.pin.trim()),
            limit(1)
        );
        
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            const validUser = snapshot.docs[0].data();
            const s = { name: validUser.name, role: validUser.role, isAuthenticated: true };
            setCurrentAuth(s);
            localStorage.setItem(SESSION_KEY, JSON.stringify(s));
        } else {
            await new Promise(r => setTimeout(r, 1000));
            alert("Credenciales incorrectas.");
        }
    } catch (e) {
        console.error(e);
        if (e.code === 'failed-precondition') {
             alert("⚠️ El sistema se está optimizando (Índices). Intenta de nuevo en unos minutos o contacta al admin.");
        } else {
             alert("Error de autenticación.");
        }
    }
    setLoading(false);
    setAuthInput({ user: '', pin: '' });
  };
  
  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentAuth({ name: '', role: 'guest', isAuthenticated: false });
  };

  const handleTabChange = (tab) => {
    if ((tab === 'scanner' || tab === 'config' || tab === 'bi') && !currentAuth.isAuthenticated) {
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

  const handleUnlockPrice = () => {
      if(pricePinInput === "20202025") {
          setIsPriceUnlocked(true);
          setPricePinInput("");
      } else {
          alert("PIN Incorrecto.");
      }
  };

  const savePrice = async () => {
    if (!isMaster) return alert("⛔ Solo MasterAdmin.");
    
    const confirmPin = prompt("⚠️ SEGURIDAD: Ingresa el PIN nuevamente para confirmar el cambio de precio:");
    if(confirmPin !== "20202025") return alert("PIN Incorrecto. Cambio cancelado.");

    try { 
        await setDoc(doc(db, collectionPath, "settings", "general"), { pricePerM3: Number(pricePerM3) }, { merge: true }); 
        alert("✅ Precio actualizado correctamente."); 
        setIsPriceUnlocked(false);
        setExpandPriceConfig(false);
    } catch (e) { alert("Error: " + e.message); }
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
        // FIX: ELIMINADA COLUMNA FACTURA DEL DETALLE DIARIO
        sheetData.push(["No.", "HORA", "PLACAS", "PROVEEDOR", "M3", "PRECIO APL.", "ZONA", "CC", "NOTA FÍSICA", "CAPTURISTA", "GPS"]);
        logs.forEach((log, index) => {
            const priceUsed = log.priceSnapshot || pricePerM3;
            const gpsLink = log.gps ? `https://maps.google.com/?q=${log.gps.lat},${log.gps.lng}` : 'Sin GPS';
            const capturista = log.recordedBy || 'Desconocido';
            sheetData.push([index + 1, log.createdAt ? log.createdAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '', log.placas, log.agrupacion, log.capacidad, fmtMoney(priceUsed), log.locationName, log.cc, log.noteNumber || '', capturista, gpsLink]);
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
        [`Precio Actual (Ref):`, fmtMoney(pricePerM3)],
        ["Generado por: " + currentAuth.name],
        [""],
        ["RESUMEN GENERAL"],
        ["Total Viajes", data.length],
        ["Total Volumen (m3)", totalM3],
        ["IMPORTE TOTAL ESTIMADO", fmtMoney(totalImport)], 
        [""],
        ["RESUMEN POR PROVEEDOR (CAMIONES)"],
        ["Proveedor", "Placa", "Viajes", "Volumen (m3)", "Importe ($)"]
      ];

      const supplierStats = {};
      const providerCCStats = {};
      const globalCCStats = {};

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

        const cleanCC = log.cc ? log.cc.toUpperCase().trim() : 'SIN ASIGNAR';
        const locationName = log.locationName || 'Desconocido';
        
        if (!globalCCStats[cleanCC]) globalCCStats[cleanCC] = { trips: 0, m3: 0, money: 0, locations: new Set() };
        globalCCStats[cleanCC].trips += 1;
        globalCCStats[cleanCC].m3 += (log.capacidad || 0);
        globalCCStats[cleanCC].money += (log.capacidad || 0) * p;
        globalCCStats[cleanCC].locations.add(locationName);
      });

      Object.keys(supplierStats).forEach(prov => {
        summaryData.push([`PROVEEDOR: ${prov}`, "", supplierStats[prov].totalTrips, supplierStats[prov].totalM3, fmtMoney(supplierStats[prov].money)]);
        Object.keys(supplierStats[prov].plates).forEach(plate => {
          const pData = supplierStats[prov].plates[plate];
          summaryData.push(["", plate, pData.trips, pData.m3, fmtMoney(pData.money)]);
        });
        summaryData.push([""]); 
      });

      summaryData.push([""]); 
      summaryData.push(["DESGLOSE DE GASTOS POR CENTRO DE COSTO (POR PROVEEDOR)"]);
      summaryData.push(["Proveedor", "Centro de Costo (Zona)", "Volumen Total (m3)", "Importe Total ($)"]);

      Object.keys(providerCCStats).forEach(prov => {
          Object.keys(providerCCStats[prov]).forEach(ccKey => {
              const stats = providerCCStats[prov][ccKey];
              summaryData.push([prov, ccKey, stats.m3, fmtMoney(stats.money)]);
          });
          summaryData.push([""]);
      });

      summaryData.push([""]);
      summaryData.push([""]);
      summaryData.push(["DESGLOSE FINANCIERO POR CENTRO DE COSTOS (CC)"]);
      summaryData.push(["CÓDIGO CC", "ZONAS / BANCOS INCLUIDOS", "VOLUMEN TOTAL (m3)", "IMPORTE TOTAL ($)", "% GASTO"]);
      
      Object.keys(globalCCStats).forEach(cc => {
          const s = globalCCStats[cc];
          const pct = totalImport > 0 ? (s.money / totalImport) * 100 : 0;
          const locationsList = Array.from(s.locations).join(", ");
          summaryData.push([cc, locationsList, s.m3, fmtMoney(s.money), `${pct.toFixed(2)}%`]);
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

        // FIX: ELIMINADA COLUMNA FACTURA DEL DETALLE DIARIO
        const daySheetData = [
          ["CONCENTRADORA DE RESIDUOS MEXICANA, S.A. DE C.V."],
          [`CONTROL DE VIAJES DE ACARREOS - FECHA: ${day}`],
          [""],
          ["No.", "HORA", "PLACAS", "PROVEEDOR", "M3", "PRECIO", "IMPORTE", "RUTA", "CC", "NOTA", "CAPTURISTA", "GPS LINK"]
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
                fmtMoney(p),
                fmtMoney(log.capacidad * p),
                log.locationName,
                log.cc,
                log.noteNumber || '',
                capturista,
                gpsLink
            ]);
        });

        daySheetData.push([""]);
        daySheetData.push([""]);
        
        // FIX: COLUMNA FACTURA EN RESUMEN INFERIOR
        daySheetData.push(["RESUMEN DEL DÍA POR CAMIÓN"]);
        daySheetData.push(["No.", "PLACA", "PROVEEDOR", "M3", "PRECIO REF", "No. VIAJES", "COSTO TOTAL", "TOTAL M3", "NO. NOTA", "NO. FACTURA", "SEMANA ENVIO", "OBSERVACIONES"]);

        let rowCount = 1;
        Object.keys(dayProvStats).forEach(prov => {
           Object.keys(dayProvStats[prov].plates).forEach(plate => {
             const pData = dayProvStats[prov].plates[plate];
             const finalNote = truckNotes[plate] || ""; 
             // Campo vacío para factura manual
             daySheetData.push([rowCount++, plate, prov, pData.capacity, fmtMoney(pricePerM3), pData.trips, fmtMoney(pData.money), pData.m3, finalNote, "", "", ""]);
           });
        });

        daySheetData.push([""]);
        daySheetData.push(["RESUMEN DE ZONAS Y CENTROS DE COSTO DEL DÍA"]);
        daySheetData.push(["ZONA / BANCO (CC)", "No. VIAJES", "VOLUMEN (m3)", "IMPORTE ($)"]);
        
        Object.keys(dayCCStats).forEach(key => {
            const stat = dayCCStats[key];
            daySheetData.push([key, stat.trips, stat.m3, fmtMoney(stat.money)]);
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
        gps = await getGPS();
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
  
  const handleAddTruck = async () => { 
      if (!isAdminOrMaster) return alert("Solo Admin/Master"); 
      
      if (!newTruck.placas.trim() || !newTruck.capacidad || !newTruck.agrupacion.trim()) {
          return alert("⚠️ Error: Todos los campos del camión son obligatorios (Placas, Capacidad y Proveedor).");
      }

      const docRef = await addDoc(collection(db, collectionPath, "trucks"), { 
          placas: newTruck.placas.toUpperCase(), 
          capacidad: parseFloat(newTruck.capacidad), 
          agrupacion: newTruck.agrupacion, 
          createdAt: serverTimestamp() 
      }); 
      
      setNewTruck({ placas: '', capacidad: '', agrupacion: '' }); 
      setShowQRModal({ id: docRef.id, placas: newTruck.placas.toUpperCase(), capacidad: newTruck.capacidad, agrupacion: newTruck.agrupacion }); 
      alert("Camión agregado correctamente."); 
  };

  const handleCreateUser = async () => { 
      if (!isMaster) return alert("⛔ Solo MasterAdmin."); 
      if (!newUser.name || !newUser.pin) return alert("Faltan datos"); 
      
      if (newUser.pin.length < 6) return alert("⚠️ Seguridad: El PIN debe tener al menos 6 dígitos.");

      const q = query(collection(db, collectionPath, "system_users"), where("name", "==", newUser.name.trim()));
      const snap = await getDocs(q);
      
      if (!snap.empty) return alert("⚠️ Error: El nombre de usuario ya existe. Elige otro.");

      await addDoc(collection(db, collectionPath, "system_users"), newUser); 
      setNewUser({ name: '', pin: '', role: 'checker' }); 
      alert("Usuario creado exitosamente."); 
  };
  const deleteItem = async (coll, id) => { 
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

  // --- LOGICA BI (Intelligence) ---
  const getBiData = () => {
      try {
        const sourceLogs = logs || [];
        const hourlyCounts = Array(13).fill(0).map((_,i) => ({ hour: i+7, count: 0 })); 
        sourceLogs.forEach(l => {
            if(!l.createdAt || typeof l.createdAt.getHours !== 'function') return;
            const h = l.createdAt.getHours();
            if (h >= 7 && h <= 19) hourlyCounts[h-7].count++;
        });
        
        const provMap = {};
        sourceLogs.forEach(l => {
            const p = l.agrupacion || 'S/N';
            provMap[p] = (provMap[p] || 0) + (l.capacidad || 0);
        });
        const providerData = Object.keys(provMap).map(k => ({ name: k, m3: provMap[k] })).sort((a,b) => b.m3 - a.m3);
        const totalM3 = providerData.reduce((acc, curr)=>acc+curr.m3, 0);

        return { hourlyCounts, providerData, totalM3, count: sourceLogs.length };
      } catch(e) {
        console.error("BI Error", e);
        return { hourlyCounts: [], providerData: [], totalM3: 0, count: 0 };
      }
  };

  if (loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>Cargando Sistema PRO-GOLD...</div>;

  if (!currentAuth.isAuthenticated) {
    return (
      <div style={styles.loginScreen}>
        <div style={styles.loginBox}>
          <div style={{display:'flex', justifyContent:'center', marginBottom:'20px'}}>
              <Icons.Building />
          </div>
          <h1 style={{color: '#1e293b', margin: '0 0 5px 0', fontSize:'1.8rem', fontWeight:'800'}}>CONTROL OBRA <span style={{color:'#d97706'}}>PRO GOLD</span></h1>
          <p style={{color:'#64748b', margin:'0 0 30px 0', fontSize:'0.9rem'}}>Sistema de Gestión de Obra</p>
          
          <div style={styles.inputIconGroup}>
            <div style={styles.inputIcon}><Icons.User/></div>
            <input style={{...styles.input, ...styles.inputWithIcon}} placeholder="Usuario" value={authInput.user} onChange={e => setAuthInput({...authInput, user: e.target.value})} />
          </div>
          
          <div style={styles.inputIconGroup}>
            <div style={styles.inputIcon}><Icons.Key/></div>
            <input style={{...styles.input, ...styles.inputWithIcon, paddingRight:'45px'}} type={showPin ? "text" : "password"} placeholder="PIN de Acceso" value={authInput.pin} onChange={e => setAuthInput({...authInput, pin: e.target.value})} />
            <button onClick={() => setShowPin(!showPin)} style={{position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8'}}>{showPin ? <Icons.EyeOff/> : <Icons.Eye/>}</button>
          </div>

          <button onClick={handleLogin} style={{...styles.button, ...styles.bgBlueGradient, color:'white', boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)', marginTop:'10px'}}>INICIAR SESIÓN</button>
        </div>
      </div>
    );
  }

  const { hourlyCounts, providerData, totalM3, count } = getBiData();

  return (
    <div style={styles.container}>
      <style>{printStyles}</style>
      
      {/* PWA: SYNC BANNER */}
      {pendingWrites && isOnline && (
        <div style={styles.syncBanner}>📡 Sincronizando datos con el servidor...</div>
      )}

      <header style={styles.header} className="no-print">
        <div>
          <h1 style={styles.title}>Control <span style={{color:'#fbbf24'}}>GOLD</span></h1>
          <p style={styles.subtitle}>
             <span style={{...styles.onlineIndicator, backgroundColor: isOnline ? '#4ade80' : '#ef4444'}}></span>
             {isOnline ? 'EN LÍNEA' : 'OFFLINE'} 
             <span style={{opacity: 0.7}}> | {currentAuth.name}</span>
          </p>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
           <input type="date" value={selectedDate} onChange={(e) => e.target.value && setSelectedDate(e.target.value)} style={{background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'white', borderRadius:'8px', padding:'6px 10px', fontSize:'0.85rem', outline:'none'}} />
           <button onClick={handleLogout} style={{fontSize:'0.75rem', color:'#fca5a5', background:'none', border:'1px solid #fca5a5', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>SALIR</button>
        </div>
      </header>

      {editingLog && (
          <div style={styles.modalOverlay}>
              <div style={styles.modalContent}>
                  <h3 style={{marginTop:0, color:'#1e293b'}}>✏️ Editar Viaje</h3>
                  <div style={{textAlign:'left', marginBottom:15}}><label style={{fontSize:'0.85rem', fontWeight:'600', color:'#64748b', marginBottom:'5px', display:'block'}}>Nota Física:</label><input style={styles.input} value={editingLog.noteNumber} onChange={e=>setEditingLog({...editingLog, noteNumber: e.target.value})} /></div>
                  <div style={{textAlign:'left', marginBottom:25}}><label style={{fontSize:'0.85rem', fontWeight:'600', color:'#64748b', marginBottom:'5px', display:'block'}}>Zona/Banco:</label><select style={styles.select} value={editingLog.locationName} onChange={e=>setEditingLog({...editingLog, locationName: e.target.value})}>{locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}</select></div>
                  <div style={{display:'flex', gap:15}}><button onClick={()=>setEditingLog(null)} style={{...styles.button, background:'#ef4444', color:'white', flex:1}}>Cancelar</button><button onClick={handleEditLog} style={{...styles.button, flex:1}}>Guardar</button></div>
              </div>
          </div>
      )}

      {showNoteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{color: '#b91c1c', marginTop:0}}>📝 Nota Inicial</h2>
            <p style={{color:'#64748b', marginBottom:'20px'}}>Ingresa el número de folio físico:</p>
            <input style={{...styles.input, textAlign:'center', fontSize:'1.8rem', fontWeight:'800', letterSpacing:'0.1em'}} value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="000" autoFocus />
            <div style={{display:'flex', gap:'15px', marginTop:'25px'}}>
                 <button onClick={cancelNote} style={{...styles.button, backgroundColor:'#ef4444', flex:1}}>CANCELAR</button>
                 <button onClick={confirmNote} style={{...styles.button, ...styles.bgBlueGradient, flex:1}}>CONFIRMAR</button>
            </div>
            {processingScan && <p style={{marginTop:15, color:'#64748b', fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px'}}>⏳ Guardando ubicación GPS...</p>}
          </div>
        </div>
      )}
      
      {showNotePreview && noteData && (
          <div style={styles.modalOverlay}>
              <div style={{...styles.modalContent, maxWidth: '600px', width:'95%', textAlign:'left', padding:'25px'}}>
                   <button onClick={() => setShowNotePreview(false)} style={styles.closeBtn}>×</button>
                   <div id="print-note">
                       <h2 style={{textAlign:'center', borderBottom:'2px solid #e2e8f0', paddingBottom:'15px', margin:'0 0 20px 0', color:'#1e293b'}}>NOTA DE REMISIÓN</h2>
                       <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px'}}>
                           <span style={{color:'#64748b', fontSize:'0.85rem'}}>FECHA:</span>
                           <strong style={{fontSize:'1rem'}}>{noteData.date}</strong>
                       </div>
                       <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                           <span style={{color:'#64748b', fontSize:'0.85rem'}}>PLACA:</span>
                           <strong style={{fontSize:'1.1rem', color:'#2563eb'}}>{noteData.plate}</strong>
                       </div>
                       <p style={{background:'#f8fafc', padding:'10px', borderRadius:'8px', fontSize:'0.9rem', marginBottom:'20px'}}><strong>PROVEEDOR:</strong> {noteData.provider}</p>
                       
                       <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.85rem'}}>
                           <thead>
                               <tr style={{background:'#f1f5f9', color:'#475569'}}>
                                   <th style={{padding:'8px', border:'1px solid #e2e8f0', textAlign:'center'}}>HORA</th>
                                   <th style={{padding:'8px', border:'1px solid #e2e8f0', textAlign:'center'}}>NOTA</th>
                                   <th style={{padding:'8px', border:'1px solid #e2e8f0'}}>ZONA</th>
                                   <th style={{padding:'8px', border:'1px solid #e2e8f0', textAlign:'right'}}>M3</th>
                               </tr>
                           </thead>
                           <tbody>
                               {noteData.trips.map((t, idx) => (
                                   <tr key={idx}>
                                       <td style={{padding:'8px', border:'1px solid #e2e8f0', textAlign:'center'}}>{t.createdAt ? t.createdAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</td>
                                       <td style={{padding:'8px', border:'1px solid #e2e8f0', textAlign:'center', fontWeight:'bold'}}>{t.noteNumber}</td>
                                       <td style={{padding:'8px', border:'1px solid #e2e8f0'}}>{t.locationName}</td>
                                       <td style={{padding:'8px', border:'1px solid #e2e8f0', textAlign:'right', fontWeight:'bold'}}>{t.capacidad}</td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                       
                       <div style={{marginTop:'25px', textAlign:'right', fontSize:'1rem', background:'#f8fafc', padding:'15px', borderRadius:'12px'}}>
                           <p style={{margin:'5px 0'}}>TOTAL VIAJES: <strong style={{fontSize:'1.2rem'}}>{noteData.totalViajes}</strong></p>
                           <p style={{margin:'5px 0', color:'#2563eb'}}>TOTAL VOLUMEN: <strong style={{fontSize:'1.2rem'}}>{noteData.totalM3} m³</strong></p>
                       </div>
                       <div style={{marginTop: '40px', textAlign:'center', borderTop:'1px dashed #cbd5e1', paddingTop:'15px', color:'#94a3b8', fontSize:'0.8rem'}}>
                           Firma de Conformidad
                       </div>
                   </div>
                   
                   <div style={{display:'flex', gap:'10px', marginTop:'25px'}}>
                       <button onClick={() => {
                           const printContent = document.getElementById('print-note').innerHTML;
                           const originalContents = document.body.innerHTML;
                           document.body.innerHTML = printContent;
                           window.print();
                           document.body.innerHTML = originalContents;
                           window.location.reload(); 
                       }} style={{...styles.button, flex:1, fontSize:'0.8rem'}}>IMPRIMIR PDF</button>
                       
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
                       }} style={{...styles.button, background:'#10b981', flex:1, fontSize:'0.8rem'}}>EXCEL</button>
                   </div>
              </div>
          </div>
      )}

      {isScanning && <NativeScanner onScan={handleScan} onCancel={() => setIsScanning(false)} />}
      {processingScan && !showNoteModal && (
          <div style={styles.modalOverlay}>
              <div style={{color:'white', fontWeight:'bold', fontSize:'1.2rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'15px'}}>
                  <div style={{width:'40px', height:'40px', border:'4px solid rgba(255,255,255,0.3)', borderTop:'4px solid white', borderRadius:'50%', animation:'spin 1s linear infinite'}}></div>
                  ⏳ Registrando...
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>
          </div>
      )}

      <main style={styles.main}>
        {activeTab === 'dashboard' && (
          <div className="no-print-padding">
            {/* KPI CARDS */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px'}} className="no-print">
              <div style={styles.kpiCard}><div style={styles.kpiValue}>{logs.length}</div><div style={styles.kpiLabel}>Viajes</div></div>
              <div style={{...styles.kpiCard, background:'linear-gradient(145deg, #059669, #047857)'}}><div style={styles.kpiValue}>{logs.reduce((a,c)=>a+(c.capacidad||0),0)}</div><div style={styles.kpiLabel}>M³ Total</div></div>
              <div style={{...styles.kpiCard, background:'linear-gradient(145deg, #7c3aed, #6d28d9)'}}><div style={styles.kpiValue}>{[...new Set(logs.map(l=>l.placas))].length}</div><div style={styles.kpiLabel}>Camiones</div></div>
            </div>

            {isAdminOrMaster && (
              <div style={{...styles.card, marginTop: '25px', border: '1px solid #bfdbfe', background:'#eff6ff'}} className="no-print">
                <h3 style={{margin:'0 0 15px 0', fontSize:'1rem', color:'#1e40af', display:'flex', alignItems:'center', gap:'8px'}}>
                    <Icons.Report/> Reporte y Finanzas
                </h3>
                
                {/* CONFIGURAR PRECIO (SOLO MASTER) */}
                {isMaster && (
                    <div style={{marginBottom:'15px', paddingBottom:'15px', borderBottom:'1px solid #dbeafe'}}>
                        <button 
                            onClick={() => setExpandPriceConfig(!expandPriceConfig)} 
                            style={{...styles.accordionBtn, background:'white', border:'1px solid #bfdbfe'}}
                        >
                            <span style={{color:'#1e40af'}}>💰 Configurar Precio Base (Master)</span>
                            <span>{expandPriceConfig ? '▲' : '▼'}</span>
                        </button>

                        {expandPriceConfig && (
                            <div style={{padding:'15px', marginTop:'10px', backgroundColor:'white', borderRadius:'12px', border:'1px solid #bfdbfe'}}>
                                {!isPriceUnlocked ? (
                                    <div style={{display:'flex', gap:'10px'}}>
                                        <input 
                                            type="password" 
                                            placeholder="PIN de Seguridad" 
                                            value={pricePinInput} 
                                            onChange={e=>setPricePinInput(e.target.value)} 
                                            style={{...styles.input, padding:'10px'}} 
                                        />
                                        <button onClick={handleUnlockPrice} style={{...styles.button, width:'auto', fontSize:'0.8rem', padding:'0 20px'}}>Desbloquear</button>
                                    </div>
                                ) : (
                                    <>
                                        <label style={{fontSize:'0.8rem', fontWeight:'700', color:'#1e40af', display:'block', marginBottom:'8px'}}>Precio por m³ ($):</label>
                                        <div style={{display:'flex', gap:'10px'}}>
                                            <input type="number" value={pricePerM3} onChange={e=>setPricePerM3(e.target.value)} style={{...styles.input, padding:'10px'}} />
                                            <button onClick={savePrice} style={{...styles.button, width:'auto', fontSize:'0.8rem', backgroundColor: '#15803d', padding:'0 20px'}}>Guardar</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div style={{display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap'}}>
                  <div style={{flex:1}}><span style={{fontSize:'0.75rem', fontWeight:'bold', color:'#64748b'}}>DESDE:</span><input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} style={{...styles.input, padding:'8px'}} /></div>
                  <div style={{flex:1}}><span style={{fontSize:'0.75rem', fontWeight:'bold', color:'#64748b'}}>HASTA:</span><input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} style={{...styles.input, padding:'8px'}} /></div>
                </div>
                <button onClick={handleExportExcel} style={{...styles.button, marginTop:'15px', fontSize:'0.85rem', background:'white', color:'#1e40af', border:'2px solid #1e40af'}}>📥 DESCARGAR REPORTE EXCEL</button>
              </div>
            )}
            
            {/* BOTÓN DESCARGAR REPORTE DEL DÍA (SUPERVISOR/ADMIN/MASTER) */}
            {isSupervisorOrHigher && (
                 <div style={{...styles.card, marginTop:'20px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'linear-gradient(to right, #ecfdf5, #ffffff)', borderColor:'#a7f3d0', padding:'20px'}}>
                     <div>
                         <h3 style={{margin:0, fontSize:'1rem', color:'#065f46'}}>📊 Reporte Diario ({selectedDate})</h3>
                         <p style={{margin:'4px 0 0 0', fontSize:'0.75rem', color:'#059669'}}>Excel detallado de la jornada actual</p>
                     </div>
                     <button onClick={handleExportDailyExcel} style={{...styles.button, width:'auto', padding:'10px 20px', fontSize:'0.8rem', background:'#10b981', boxShadow:'0 4px 10px rgba(16, 185, 129, 0.3)'}}>DESCARGAR</button>
                 </div>
            )}

            <div style={{...styles.card, padding:0, overflow:'hidden', marginTop:'25px'}} className="print-only">
               <div style={{padding:'16px 20px', background:'#f8fafc', fontWeight:'800', borderBottom:'1px solid #e2e8f0', color:'#334155', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                   <span>📋 REGISTRO DE VIAJES</span>
                   <span style={{fontSize:'0.75rem', background:'#e2e8f0', padding:'4px 8px', borderRadius:'6px'}}>{logs.length} Total</span>
               </div>
               
               {/* EMPTY STATE TABLE */}
               {logs.length === 0 ? (
                   <div style={{padding:'40px', textAlign:'center', color:'#94a3b8'}}>
                       <div style={{fontSize:'2rem', marginBottom:'10px'}}>📭</div>
                       <p>No hay viajes registrados para este día.</p>
                   </div>
               ) : (
                   <div style={{overflowX:'auto'}}>
                    <table style={styles.table}>
                      <thead><tr style={{background:'#f9fafb'}}><th style={styles.th}>#</th><th style={styles.th}>Placa</th><th style={styles.th}>Nota</th><th style={styles.th}>Hora</th><th style={styles.th}>Zona</th><th style={{...styles.th, textAlign:'right'}}>M³</th><th style={styles.th}></th></tr></thead>
                      <tbody>
                        {logs.map((log, i) => (
                          <tr key={log.id} style={{display: i < 10 ? 'table-row' : 'none'}} className="print-row">
                            <td style={styles.td}>{logs.length - i}</td>
                            <td style={{...styles.td, fontWeight:'bold', color:'#1e293b'}}>{log.placas}</td>
                            <td style={{...styles.td, color:'#2563eb', fontWeight:'600'}}>{log.noteNumber || '-'}</td>
                            <td style={styles.td}>{log.createdAt && typeof log.createdAt.toLocaleTimeString === 'function' ? log.createdAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</td>
                            <td style={styles.td}><span style={{background:'#f1f5f9', padding:'2px 6px', borderRadius:'4px', fontSize:'0.75rem'}}>{log.locationName}</span></td>
                            <td style={{...styles.td, textAlign:'right', fontWeight:'800'}}>{log.capacidad}</td>
                            <td style={styles.td} className="no-print">
                                {isSupervisorOrHigher && <button onClick={()=>setEditingLog(log)} style={{border:'none', background:'#eff6ff', color:'#2563eb', marginRight:'8px', cursor:'pointer', padding:'6px', borderRadius:'6px'}}><Icons.Edit/></button>}
                                {isAdminOrMaster && <button onClick={()=>deleteItem('logs', log.id)} style={{border:'none', background:'#fef2f2', color:'#ef4444', cursor:'pointer', padding:'6px', borderRadius:'6px'}}><Icons.Trash/></button>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <style>{`@media print { .print-row { display: table-row !important; } }`}</style>
                   </div>
               )}
            </div>

            <div style={{...styles.card, marginTop: '25px', padding:'20px'}}>
                <h3 style={{margin:'0 0 15px 0', fontSize:'1rem', color:'#64748b'}}>🚛 Flotilla Activa</h3>
                <div style={{display:'flex', flexWrap:'wrap', gap:'10px'}}>
                    {[...new Set(logs.map(l=>l.placas))].map(placa => (
                        <button key={placa} onClick={() => handleTruckClick(placa)} style={{background:'white', border:'1px solid #cbd5e1', color:'#334155', padding:'8px 12px', borderRadius:'10px', fontSize:'0.85rem', fontWeight:'700', cursor:'pointer', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>{placa}</button>
                    ))}
                    {logs.length === 0 && <span style={{color:'#94a3b8', fontSize:'0.9rem', fontStyle:'italic'}}>No hay camiones registrados hoy.</span>}
                </div>
                {isSupervisorOrHigher && <p style={{fontSize:'0.7rem', color:'#94a3b8', marginTop:'15px', display:'flex', alignItems:'center', gap:'5px'}}><Icons.Eye/> Toca una placa para ver su Nota de Remisión</p>}
            </div>

            <div style={styles.noteBlock} className="no-print">
              <strong style={{color:'#92400e', display:'flex', alignItems:'center', gap:'5px'}}>📝 Nota del Día:</strong>
              <textarea style={styles.textArea} value={dailyNote} onChange={e=>setDailyNote(e.target.value)} placeholder="Escribe observaciones importantes..." />
              <button onClick={handleSaveNote} style={{...styles.button, background:'#f59e0b', marginTop:'10px', width:'auto', fontSize:'0.8rem', padding:'10px 20px', color:'white'}}>Guardar Nota</button>
            </div>
          </div>
        )}

        {/* ... (RESTO DE PESTAÑAS IGUALES) ... */}
        {activeTab === 'scanner' && (
          <div style={{textAlign:'center', padding:'20px'}}>
             <div style={{...styles.card, marginBottom:'25px', padding:'30px'}}>
               <h3 style={{marginTop:0, marginBottom:'20px', color:'#1e293b'}}>📍 1. Selecciona Zona</h3>
               <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                 {locations.map(l => (
                    <button 
                        key={l.id} 
                        onClick={()=>setSelectedLocationId(l.id)} 
                        style={{
                            padding:'20px', 
                            border: selectedLocationId===l.id?'2px solid #2563eb':'1px solid #e2e8f0', 
                            borderRadius:'16px', 
                            background: selectedLocationId===l.id?'#eff6ff':'white',
                            color: selectedLocationId===l.id?'#1e40af':'#334155',
                            fontWeight: '700',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                        }}
                    >
                        {l.name}
                    </button>
                 ))}
               </div>
             </div>
             <button 
                onClick={()=>{ if(!currentAuth.isAuthenticated) return setShowAuthModal(true); if(!selectedLocationId) return alert("Selecciona zona"); setIsScanning(true); }} 
                style={{
                    ...styles.button, 
                    padding:'25px', 
                    fontSize:'1.3rem', 
                    borderRadius:'24px', 
                    boxShadow:'0 20px 25px -5px rgba(37, 99, 235, 0.3)',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    gap:'15px'
                }}
            >
                <Icons.Camera/> ESCANEAR QR
            </button>
          </div>
        )}
        
        {/* --- NUEVA PESTAÑA: BUSINESS INTELLIGENCE (BI) --- */}
        {activeTab === 'bi' && (
            <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                <div style={{...styles.card, background:'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color:'white', border:'none'}}>
                    <h2 style={{margin:'0 0 10px 0', fontSize:'1.4rem'}}>🧠 Inteligencia de Obra</h2>
                    <p style={{margin:0, opacity:0.8, fontSize:'0.9rem'}}>Análisis en tiempo real de la productividad.</p>
                </div>
                
                {selectedDate !== getTodayString() ? (
                    <div style={{...styles.card, textAlign:'center', padding:'40px'}}>
                        <h3 style={{color:'#64748b', margin:0}}>⚠️ Datos no disponibles</h3>
                        <p style={{color:'#94a3b8', margin:'10px 0 0 0'}}>Estos datos no están ya disponibles, únicamente son registros en tiempo real.</p>
                    </div>
                ) : (
                    <>
                        <ChartBar 
                            title="📊 Ritmo de Trabajo (Viajes x Hora)" 
                            data={hourlyCounts} 
                            labelKey="hour" 
                            valueKey="count" 
                            color="#f59e0b"
                            emptyMsg="Sin viajes en este horario"
                        />

                        <ChartBar 
                            title="🏗️ Top Proveedores (Volumen m³)" 
                            data={providerData} 
                            labelKey="name" 
                            valueKey="m3" 
                            color="#3b82f6"
                            emptyMsg="Sin datos de proveedores"
                        />

                        <div style={styles.card}>
                            <h3 style={{fontSize:'1rem', color:'#334155'}}>📈 Resumen Ejecutivo ({count} viajes)</h3>
                            <ul style={{paddingLeft:'20px', lineHeight:'1.8', fontSize:'0.9rem', color:'#475569'}}>
                                <li>Volumen Total Periodo: <strong>{totalM3} m³</strong></li>
                                <li>Hora pico: <strong>{hourlyCounts.sort((a,b)=>b.count-a.count)[0].hour}:00 hrs</strong></li>
                                <li>Proveedor líder: <strong>{providerData.length > 0 ? providerData[0].name : 'N/A'}</strong></li>
                                <li>Promedio M3/Viaje: <strong>{count > 0 ? (totalM3/count).toFixed(1) : 0} m³</strong></li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        )}

        {activeTab === 'config' && (
          <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
            
            {/* --- GESTIÓN DE USUARIOS (MASTER) --- */}
            {isMaster && (
              <div style={{...styles.card, border:'1px solid #bfdbfe', backgroundColor:'#f0f9ff'}}>
                <button 
                    onClick={() => setExpandUsers(!expandUsers)} 
                    style={{...styles.accordionBtn, background:'white', border:'1px solid #bfdbfe'}}
                >
                    <span style={{color:'#0369a1', display:'flex', alignItems:'center', gap:'10px'}}>👥 Gestión de Usuarios</span>
                    <span>{expandUsers ? '▲' : '▼'}</span>
                </button>
                
                {expandUsers && (
                    <div style={{paddingTop: '15px'}}>
                        <div style={{display:'flex', gap:'10px', marginBottom:'15px', flexDirection: 'column'}}>
                          <div style={{display:'flex', gap:'10px'}}>
                              <input style={{...styles.input, flex:2}} placeholder="Nombre" value={newUser.name} onChange={e=>setNewUser({...newUser, name:e.target.value})} />
                              {/* PIN SEGURO: Type Password */}
                              <input style={{...styles.input, flex:1}} type="password" placeholder="PIN (6+)" value={newUser.pin} onChange={e=>setNewUser({...newUser, pin:e.target.value})} />
                          </div>
                          <select style={styles.select} value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})}>
                              <option value="checker">Checador (Solo Escanear)</option>
                              <option value="supervisor">Supervisor (Escanear + Notas + Zonas)</option>
                              <option value="admin">Admin (Total + Excel + Precios)</option>
                              <option value="masteradmin">Master Admin (Control Total)</option>
                          </select>
                        </div>
                        <button onClick={handleCreateUser} style={{...styles.button, width:'100%', fontSize:'0.85rem'}}>CREAR USUARIO</button>

                        <div style={{marginTop:'20px', borderTop:'1px solid #bfdbfe', paddingTop:'15px'}}>
                          <p style={{fontSize:'0.8rem', color:'#0369a1', fontStyle:'italic'}}>* Por seguridad PRO-GOLD, la lista de usuarios ya no se descarga visiblemente. Solo puedes agregar o borrar si conoces el ID.</p>
                          {/* LISTADO LIMITADO SOLO SI ES MASTER PARA BORRAR */}
                          {users.map(u => (
                            <div key={u.id} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', fontSize:'0.9rem', borderBottom:'1px dashed #cbd5e1'}}>
                              {/* PIN OCULTO EN LISTA */}
                              <span style={{fontWeight:'500'}}>{u.name} <span style={{fontSize:'0.75rem', background:'#e0f2fe', color:'#0369a1', padding:'2px 6px', borderRadius:'4px'}}>{u.role}</span></span>
                              <button onClick={()=>deleteItem('system_users', u.id)} style={{border:'none', background:'#fef2f2', color:'#ef4444', borderRadius:'6px', padding:'4px 8px', cursor:'pointer'}}>Eliminar</button>
                            </div>
                          ))}
                        </div>
                        <div style={{marginTop:'25px', borderTop:'2px solid #fecaca', paddingTop:'15px'}}>
                           <button onClick={handleWipeData} style={{...styles.button, backgroundColor:'#dc2626', fontSize:'0.8rem'}}>⚠️ LIMPIAR BASE DE DATOS</button>
                        </div>
                    </div>
                )}
              </div>
            )}

            {currentAuth.isAuthenticated && (
              <>
                <div style={{...styles.card, opacity: isSupervisorOrHigher ? 1 : 0.8}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                     <h3 style={{margin:0}}>📍 Zonas / Bancos</h3>
                     {!isSupervisorOrHigher && <span style={{fontSize:'0.7rem', background:'#f1f5f9', padding:'4px 8px', borderRadius:'4px'}}>Solo Lectura</span>}
                  </div>
                  {isSupervisorOrHigher && (
                      <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                        <input style={{...styles.input, flex:2}} placeholder="Nombre Zona" value={newLocation.name} onChange={e=>setNewLocation({...newLocation, name:e.target.value})} />
                        <input style={{...styles.input, flex:1}} placeholder="C.C." value={newLocation.cc} onChange={e=>setNewLocation({...newLocation, cc:e.target.value})} />
                        <button onClick={handleAddLocation} style={{...styles.button, width:'auto', padding:'0 20px'}}>+</button>
                      </div>
                  )}
                  <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                    {locations.map(l => (
                        <div key={l.id} style={styles.rowCard}>
                            <span style={{fontWeight:'600'}}>{l.name} <span style={{fontSize:'0.75rem', color:'#64748b'}}>({l.cc || 'S/N'})</span></span> 
                            {isAdminOrMaster && <button onClick={()=>deleteItem('locations', l.id)} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer'}}><Icons.Trash/></button>}
                        </div>
                    ))}
                  </div>
                </div>

                <div style={{...styles.card}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px'}}>
                    <h3 style={{margin:0}}>🚛 Flotilla</h3>
                    {!isAdminOrMaster && <span style={{fontSize:'0.7rem', background:'#f1f5f9', padding:'4px 8px', borderRadius:'4px'}}>Solo Lectura</span>}
                  </div>
                  
                  {isAdminOrMaster && (
                    <div style={{marginBottom:'15px'}}>
                        {/* MENÚ DESPLEGABLE: AGREGAR CAMIÓN */}
                        <button 
                            onClick={() => setExpandAddTruck(!expandAddTruck)} 
                            style={{...styles.accordionBtn, backgroundColor: '#f0fdf4', color: '#166534', border:'1px solid #bbf7d0'}}
                        >
                            <span>➕ Agregar Nuevo Camión</span>
                            <span>{expandAddTruck ? '▲' : '▼'}</span>
                        </button>

                        {expandAddTruck && (
                            <div style={{padding: '20px', border: '1px solid #bbf7d0', borderRadius: '16px', marginTop: '10px', background:'#f0fdf4'}}>
                                <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                                    <input style={{...styles.input, textTransform:'uppercase'}} placeholder="PLACAS" value={newTruck.placas} onChange={e=>setNewTruck({...newTruck, placas:e.target.value})} />
                                    <input 
                                        style={styles.input} 
                                        type="number" 
                                        placeholder="Capacidad (m3)" 
                                        value={newTruck.capacidad} 
                                        onChange={e=>setNewTruck({...newTruck, capacidad:e.target.value})} 
                                    />
                                </div>
                                <input style={{...styles.input, marginBottom:'15px'}} placeholder="Proveedor / Sindicato" value={newTruck.agrupacion} onChange={e=>setNewTruck({...newTruck, agrupacion:e.target.value})} />
                                <button onClick={handleAddTruck} style={{...styles.button, background:'#16a34a'}}>GUARDAR CAMIÓN</button>
                            </div>
                        )}
                    </div>
                  )}
                  
                  {/* MENÚ DESPLEGABLE: LISTA CAMIONES */}
                  <button 
                        onClick={() => setExpandTruckList(!expandTruckList)} 
                        style={styles.accordionBtn}
                    >
                        <span>📋 Ver Lista de Camiones ({trucks.length})</span>
                        <span>{expandTruckList ? '▲' : '▼'}</span>
                  </button>

                  {expandTruckList && (
                      <div style={{marginTop:'10px', maxHeight: '400px', overflowY: 'auto'}}>
                        {trucks.map(t => (
                          <div key={t.id} style={styles.rowCard}>
                            <div>
                                <div style={{fontWeight:'800', fontSize:'1rem'}}>{t.placas}</div>
                                <div style={{fontSize:'0.8rem', color:'#64748b'}}>{t.capacidad} m³ • {t.agrupacion}</div>
                            </div>
                            <div style={{display:'flex', gap:'15px'}}>
                               <button onClick={()=>setShowQRModal(t)} style={{background:'white', border:'1px solid #cbd5e1', borderRadius:'8px', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>🏁</button>
                               {isAdminOrMaster && <button onClick={()=>deleteItem('trucks', t.id)} style={{background:'#fef2f2', border:'none', color:'#ef4444', borderRadius:'8px', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><Icons.Trash/></button>}
                            </div>
                          </div>
                        ))}
                      </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {showQRModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContentOficio}>
             <button onClick={()=>setShowQRModal(null)} style={{...styles.closeBtn, top:'20px', right:'20px'}} className="no-print">×</button>
             
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

             <div style={{textAlign:'center', marginTop:'30px', display:'flex', justifyContent:'center', gap:'15px'}} className="no-print">
                <button onClick={()=>setShowQRModal(null)} style={{...styles.button, width:'200px', fontSize:'1rem', backgroundColor:'#ef4444'}}>CERRAR</button>
                <button onClick={()=>window.print()} style={{...styles.button, width:'200px', fontSize:'1rem'}}>🖨️ IMPRIMIR</button>
             </div>
          </div>
        </div>
      )}
      {scanSuccess && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{fontSize:'5rem', marginBottom:'10px'}}>✅</div>
            <h2 style={{margin:'0 0 10px 0', color:'#166534'}}>¡REGISTRADO!</h2>
            <p style={{fontSize:'1.2rem', margin:'0 0 25px 0', color:'#334155'}}><b>{scanSuccess.truck.placas}</b><br/><span style={{fontSize:'0.9rem', color:'#64748b'}}>en {scanSuccess.location.name}</span></p>
            <button onClick={()=>setScanSuccess(null)} style={{...styles.button, background:'#16a34a', boxShadow:'0 10px 20px -5px rgba(22, 163, 74, 0.4)'}}>CONTINUAR</button>
          </div>
        </div>
      )}

      <footer className="no-print" style={{textAlign:'center', padding:'30px 20px', color:'#94a3b8', fontSize:'0.75rem'}}>
        <p>Control De Obra Pro &copy; 2025<br/>Desarrollado por <b>Ing. Eduardo Lopez Garcia</b></p>
      </footer>

      <nav style={styles.nav} className="no-print">
        <button onClick={()=>handleTabChange('dashboard')} style={{...styles.navBtn, color: activeTab==='dashboard' ? '#2563eb' : '#94a3b8'}}><Icons.List/>REPORTE</button>
        <button onClick={()=>handleTabChange('scanner')} style={styles.fab}><Icons.Camera/></button>
        {isAdminOrMaster && (
            <button onClick={()=>handleTabChange('bi')} style={{...styles.navBtn, color: activeTab==='bi' ? '#7c3aed' : '#94a3b8'}}><Icons.Chart/>INTELIGENCIA</button>
        )}
        <button onClick={()=>handleTabChange('config')} style={{...styles.navBtn, color: activeTab==='config' ? '#2563eb' : '#94a3b8'}}><Icons.Truck/>CONFIG</button>
      </nav>
    </div>
  );
}