import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
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
  Timestamp
} from 'firebase/firestore';

// --- CONFIGURACIÓN DE IDENTIDAD Y LOGO ---
const COMPANY_LOGO_URL = "https://www.cidelt.com/img/logo-cidelt.png"; 

// --- CONFIGURACIÓN DE SEGURIDAD (Centralizada) ---
const SECURITY_CONFIG = {
  PRICE_CHANGE_PIN: "20202025",
  WEEKLY_REPORT_PIN: "212232",
  EJIDO_MODE_PIN: "707070", 
  MIN_PIN_LENGTH: 6,
  MIN_CYCLE_TIME_MINUTES: 15
};

// --- ESTILOS MODERNOS (PREMIUM UI) ---
const styles = {
  container: { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '110px', color: '#1e293b', position: 'relative' },
  header: { background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', color: 'white', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)' },
  headerEjido: { background: 'rgba(88, 28, 135, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.1)' }, 
  title: { fontSize: '1.1rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em', textTransform: 'uppercase', background: 'linear-gradient(to right, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  subtitle: { fontSize: '0.7rem', color: '#94a3b8', margin: '2px 0 0 0', fontWeight: '500', fontFamily: "'JetBrains Mono', monospace" },
  main: { maxWidth: '1000px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: 'white', borderRadius: '24px', padding: '28px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' },
  kpiCard: { padding: '24px', borderRadius: '20px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.35)', position: 'relative', overflow: 'hidden' },
  kpiValue: { fontSize: '2.2rem', fontWeight: '800', lineHeight: 1, letterSpacing: '-0.03em', zIndex: 2 },
  kpiLabel: { fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.9, marginTop: '8px', fontWeight: '600', letterSpacing: '0.08em', zIndex: 2 },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0', fontSize: '0.85rem' },
  th: { textAlign: 'left', padding: '16px 12px', color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9' },
  td: { padding: '16px 12px', borderBottom: '1px solid #f8fafc', color: '#334155', transition: 'background 0.2s' },
  nav: { position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '380px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '28px', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 40, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.5)', border: '1px solid rgba(203, 213, 225, 0.3)' },
  navBtn: { background: 'none', border: 'none', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontSize: '0.65rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease' },
  navBtnActive: { color: '#2563eb' },
  fab: { width: '60px', height: '60px', borderRadius: '22px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginTop: '-35px', boxShadow: '0 15px 30px -5px rgba(37, 99, 235, 0.4)', border: '6px solid #f8fafc', cursor: 'pointer', transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' },
  input: { width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '1rem', backgroundColor: '#f8fafc', outline: 'none', transition: 'all 0.2s', color: '#1e293b', boxSizing: 'border-box' },
  button: { width: '100%', padding: '18px', borderRadius: '16px', border: 'none', fontWeight: '700', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', transition: 'transform 0.1s, box-shadow 0.2s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.15)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85rem' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' },
  modalContent: { backgroundColor: 'white', borderRadius: '32px', padding: '36px', width: '100%', maxWidth: '400px', textAlign: 'center', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  modalContentOficio: { backgroundColor: 'white', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '800px', minHeight: '80vh', textAlign: 'left', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  noteBlock: { backgroundColor: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(251, 191, 36, 0.1)' },
  textArea: { width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #fcd34d', minHeight: '100px', marginTop: '12px', fontSize: '0.95rem', backgroundColor: 'white', outline:'none' },
  closeBtn: { position: 'absolute', top: '24px', right: '24px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: '1.4rem', fontWeight: 'bold', transition: 'background 0.2s' },
  loginScreen: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0f172a', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  loginBox: { backgroundColor: 'white', borderRadius: '32px', padding: '48px 32px', width: '100%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
  select: { width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '1rem', backgroundColor: '#f8fafc', marginBottom: '10px', outline: 'none' },
  bgBlueGradient: { background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' },
  onlineIndicator: { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', marginRight: '6px', boxShadow: '0 0 0 2px rgba(255,255,255,0.1)' },
  accordionBtn: { width: '100%', padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', textAlign: 'left', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '12px', fontSize: '0.95rem', color: '#334155', transition: 'all 0.2s' },
  rowCard: { background:'white', borderRadius:'16px', padding:'18px', marginBottom:'12px', border:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 4px rgba(0,0,0,0.02)' },
  inputIconGroup: { position: 'relative', marginBottom: '20px', width: '100%' },
  inputIcon: { position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 10 },
  inputWithIcon: { paddingLeft: '50px' },
  searchBar: { width: '100%', padding: '14px 20px 14px 48px', borderRadius: '16px', border: '1px solid #cbd5e1', fontSize: '0.95rem', backgroundColor: 'white', marginBottom: '20px', outline:'none', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)', boxSizing: 'border-box' },
  chartContainer: { height: '240px', display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '20px 0', overflowX: 'auto' },
  barGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '45px', position: 'relative' },
  bar: { width: '100%', borderRadius: '6px 6px 0 0', transition: 'height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', minHeight: '6px', display:'flex', alignItems:'flex-end', justifyContent:'center' },
  barLabel: { fontSize: '0.65rem', color: '#64748b', marginTop: '10px', textAlign:'center', fontWeight:'600' },
  barValue: { fontSize: '0.7rem', color: '#1e293b', fontWeight:'700', marginBottom:'6px', background:'rgba(255,255,255,0.9)', padding:'2px 6px', borderRadius:'6px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)' },
  syncBanner: { background: '#f59e0b', color: 'white', padding: '10px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold', position: 'fixed', top: '65px', left: '50%', transform: 'translateX(-50%)', zIndex: 49, borderRadius: '20px', width: 'auto', paddingLeft: '20px', paddingRight: '20px', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)' },
  ejidoBadge: { backgroundColor: '#7e22ce', color:'white', fontSize:'0.65rem', padding:'3px 8px', borderRadius:'6px', fontWeight:'800', marginLeft:'8px', letterSpacing:'0.05em' },
  tabSwitch: { display:'flex', backgroundColor:'#e2e8f0', borderRadius:'16px', padding:'6px', marginBottom:'24px' },
  tabSwitchBtn: { flex:1, padding:'10px', textAlign:'center', borderRadius:'12px', fontSize:'0.85rem', fontWeight:'700', cursor:'pointer', transition:'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' },
  tabSwitchActive: { backgroundColor:'white', color:'#0f172a', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)' },
  progressBarContainer: { height:'8px', width:'100%', backgroundColor:'#f1f5f9', borderRadius:'4px', marginTop:'10px', overflow:'hidden' },
  progressBarFill: { height:'100%', transition:'width 0.8s ease', borderRadius:'4px' },
  timeTag: { fontSize:'0.65rem', fontWeight:'700', padding:'3px 8px', borderRadius:'6px', marginLeft:'8px', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  timeTagNormal: { backgroundColor:'#f0fdf4', color:'#15803d', border: '1px solid #bbf7d0' },
  timeTagSuspicious: { backgroundColor:'#fef2f2', color:'#b91c1c', border:'1px solid #fecaca' },
  lockedScreen: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '20px', textAlign: 'center' },
  splashScreen: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0f172a', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  splashLogoContainer: { width: '220px', height: '110px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom: '20px' }
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
  Chart: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Time: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Lock: () => <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  Logo: () => <img src={COMPANY_LOGO_URL} alt="CIDELT Logo" style={{width: '100%', height: '100%', objectFit: 'contain'}} onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/200x80?text=LOGO+ERROR"; }} />
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

const EXCEL_CURRENCY_FMT = '"$"#,##0.00'; 

// --- FUNCIÓN DE FORMATO INTELIGENTE DE EXCEL (MEJORADA PARA PROGOLD) ---
const formatSheetMoney = (ws) => {
    if(!ws['!ref']) return;
    const range = window.XLSX.utils.decode_range(ws['!ref']);
    
    // Lista de columnas activas para formateo vertical (tablas)
    let activeMoneyCols = [];

    // Escaneo celda por celda
    for (let R = range.s.r; R <= range.e.r; ++R) {
        let rowHasText = false;
        let isHeaderRow = false;
        let currentResets = [];

        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellRef = window.XLSX.utils.encode_cell({c: C, r: R});
            const cell = ws[cellRef];
            
            if (cell) {
                rowHasText = true;
                if (typeof cell.v === 'string') {
                    const val = cell.v.toUpperCase();
                    // Detectar palabras clave de dinero
                    if (val.includes("IMPORTE") || val.includes("PRECIO") || val.includes("COSTO") || val.includes("($)") || val.includes("MONTO")) {
                        // CASO 1: Es un encabezado de columna (formatear hacia abajo)
                        currentResets.push(C);
                        isHeaderRow = true;
                        
                        // CASO 2: Es una etiqueta lateral (ej: "Importe Total:" -> 500)
                        // Revisar si la celda a la DERECHA es un número
                        const nextCellRef = window.XLSX.utils.encode_cell({c: C + 1, r: R});
                        const nextCell = ws[nextCellRef];
                        if (nextCell && typeof nextCell.v === 'number') {
                            nextCell.z = EXCEL_CURRENCY_FMT;
                            nextCell.t = 'n';
                        }
                    }
                } else if (typeof cell.v === 'number') {
                    // Si la celda es numérica y está en una columna marcada como dinero
                    if (activeMoneyCols.includes(C)) {
                        cell.z = EXCEL_CURRENCY_FMT;
                        cell.t = 'n';
                    }
                }
            }
        }

        // Lógica de control de tablas apiladas
        if (isHeaderRow) {
            // Si encontramos nuevos encabezados, actualizamos las columnas activas
            activeMoneyCols = currentResets;
        } else if (!rowHasText) {
            // Si la fila está vacía, asumimos fin de tabla y reseteamos
            activeMoneyCols = [];
        }
    }
};

const getLogPrice = (log, currentGlobalPrice) => {
    if (log.priceSnapshot !== undefined && log.priceSnapshot !== null) {
        return Number(log.priceSnapshot);
    }
    return Number(currentGlobalPrice);
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
        <button onClick={onCancel} style={{...styles.button, backgroundColor: '#ef4444', position: 'absolute', bottom: '20px', left: '20px', right: '20px', width: 'auto', borderRadius: '12px'}}>CANCELAR</button>
      </div>
    </div>
  );
};

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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [pendingWrites, setPendingWrites] = useState(false);

  const [trucks, setTrucks] = useState([]);
  const [logs, setLogs] = useState([]); 
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [dailyNote, setDailyNote] = useState("");
  const [pricePerM3, setPricePerM3] = useState(0); 
  const [isScanning, setIsScanning] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState('normal'); 
  const [isEjidoMode, setIsEjidoMode] = useState(false);
  
  const [newTruck, setNewTruck] = useState({ placas: '', capacidad: '', agrupacion: '' });
  const [newLocation, setNewLocation] = useState({ name: '', cc: '', dailyGoal: '' });
  const [newUser, setNewUser] = useState({ name: '', pin: '', role: 'checker' });
  
  const [showQRModal, setShowQRModal] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(null);
  const [processingScan, setProcessingScan] = useState(false);
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
  
  const [expandWeeklyGen, setExpandWeeklyGen] = useState(false);
  const [weeklyPin, setWeeklyPin] = useState("");
  const [isWeeklyUnlocked, setIsWeeklyUnlocked] = useState(false);
  const [weeklyStart, setWeeklyStart] = useState(getTodayString());
  const [weeklyEnd, setWeeklyEnd] = useState(getTodayString());

  const [noteData, setNoteData] = useState(null);
  const [showNotePreview, setShowNotePreview] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  useEffect(() => {
    document.title = "CIDELT | Control Pro GOLD";
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = "https://www.cidelt.com/img/logo-cidelt.png";
    document.getElementsByTagName('head')[0].appendChild(link);
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
        const userStatusRef = doc(db, collectionPath, "status", currentAuth.name);
        try {
            await setDoc(userStatusRef, { name: currentAuth.name, role: currentAuth.role, lastSeen: serverTimestamp() }, { merge: true });
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

  const processLogsWithTime = (rawLogs) => {
      const sortedLogs = [...rawLogs].sort((a,b) => b.createdAt - a.createdAt);
      const truckGroups = {};
      sortedLogs.forEach(log => {
          if(!truckGroups[log.truckId]) truckGroups[log.truckId] = [];
          truckGroups[log.truckId].push(log);
      });

      const logsWithDelta = sortedLogs.map(log => {
          const myGroup = truckGroups[log.truckId];
          const myIdx = myGroup.findIndex(l => l.id === log.id);
          const prevLog = myGroup[myIdx + 1];
          let timeDelta = null;
          if (prevLog && prevLog.createdAt) {
              const diffMs = log.createdAt - prevLog.createdAt;
              timeDelta = Math.floor(diffMs / 60000); 
          }
          return { ...log, timeDelta };
      });
      return logsWithDelta;
  };

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
      const processedData = processLogsWithTime(data);
      setLogs(processedData);
      setPendingWrites(pendingCount > 0);
    }, e => console.log(e));

    getDoc(doc(db, collectionPath, "daily_notes", selectedDate)).then(d => {
      if (d.exists()) setDailyNote(d.data().text || ""); else setDailyNote("");
    }).catch(e=>{});
    
    return () => { unsubTrucks(); unsubLocs(); unsubUsers(); unsubLogs(); }
  }, [user, selectedDate, isMaster]); 

  // --- HELPER FUNCTIONS ---

  const getFilteredLogs = () => {
      const visibleLogs = logs.filter(l => viewMode === 'ejido' ? l.isEjido : !l.isEjido);
      if (!searchTerm) return visibleLogs;
      const lowerSearch = searchTerm.toLowerCase();
      return visibleLogs.filter(log => 
          (log.placas && log.placas.toLowerCase().includes(lowerSearch)) ||
          (log.locationName && log.locationName.toLowerCase().includes(lowerSearch)) ||
          (log.noteNumber && log.noteNumber.toLowerCase().includes(lowerSearch))
      );
  };

  const getLocationProgress = (locId) => {
      const loc = locations.find(l => l.id === locId);
      if (!loc || !loc.dailyGoal) return null;
      
      const locLogs = logs.filter(l => l.locationName === loc.name && (isEjidoMode ? l.isEjido : !l.isEjido));
      const currentVol = locLogs.reduce((acc, curr) => acc + (curr.capacidad || 0), 0);
      const goal = parseFloat(loc.dailyGoal);
      const pct = Math.min((currentVol / goal) * 100, 100);
      return { currentVol, goal, pct };
  };

  const getBiData = () => {
      try {
        const sourceLogs = logs.filter(l => !l.isEjido);
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
        alert("Error de autenticación.");
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

  const handleToggleEjidoMode = () => {
      if (isEjidoMode) {
          setIsEjidoMode(false);
      } else {
          const pin = prompt("🔒 SEGURIDAD: Ingresa PIN para habilitar Modo Ejido:");
          if (pin === SECURITY_CONFIG.EJIDO_MODE_PIN) {
              setIsEjidoMode(true);
              alert("⚠️ MODO EJIDO ACTIVADO: Los viajes registrados NO tendrán valor monetario.");
          } else {
              alert("PIN Incorrecto.");
          }
      }
  };

  const handleTruckClick = (plate) => {
      if (isSupervisorOrHigher) {
          const trips = logs.filter(l => l.placas === plate && (viewMode === 'ejido' ? l.isEjido : !l.isEjido));
          if (trips.length === 0) return alert("No hay viajes visibles para esta placa hoy en este modo.");
          
          const totalM3 = trips.reduce((acc, curr) => acc + (curr.capacidad || 0), 0);
          const totalImporte = trips.reduce((acc, curr) => {
              const histPrice = getLogPrice(curr, pricePerM3);
              return acc + ((curr.capacidad || 0) * histPrice);
          }, 0); 
          const truckInfo = trips[0] || { agrupacion: 'S/N' };
          setNoteData({ 
              date: selectedDate, 
              plate: plate, 
              provider: truckInfo.agrupacion, 
              trips: trips, 
              totalViajes: trips.length, 
              totalM3: totalM3, 
              totalImporte: totalImporte 
          });
          setShowNotePreview(true);
      }
  };

  const handleUnlockPrice = () => {
      if(pricePinInput === SECURITY_CONFIG.PRICE_CHANGE_PIN) {
          setIsPriceUnlocked(true);
          setPricePinInput("");
      } else {
          alert("PIN Incorrecto.");
      }
  };

  const handleUnlockWeekly = () => {
      if(weeklyPin === SECURITY_CONFIG.WEEKLY_REPORT_PIN) {
          setIsWeeklyUnlocked(true);
          setWeeklyPin("");
      } else {
          alert("Código incorrecto");
      }
  };

  const savePrice = async () => {
    if (!isMaster) return alert("⛔ Solo MasterAdmin.");
    const confirmPin = prompt("⚠️ SEGURIDAD: Ingresa el PIN nuevamente para confirmar el cambio de precio:");
    if(confirmPin !== SECURITY_CONFIG.PRICE_CHANGE_PIN) return alert("PIN Incorrecto. Cambio cancelado.");
    try { 
        await setDoc(doc(db, collectionPath, "settings", "general"), { pricePerM3: Number(pricePerM3) }, { merge: true }); 
        alert("✅ Precio actualizado correctamente."); 
        setIsPriceUnlocked(false);
        setExpandPriceConfig(false);
    } catch (e) { alert("Error: " + e.message); }
  };

  const appendDailySummaryToSheet = (sheetData, logsToSummarize, currentPrice) => {
     const summaryTree = {};
     logsToSummarize.forEach(log => {
         const prov = log.agrupacion || "SIN PROVEEDOR";
         const ccName = `${log.locationName || 'Zona'} (${log.cc || 'S/N'})`;
         const p = getLogPrice(log, currentPrice);
         const m3 = log.capacidad || 0;
         const money = m3 * p;
         const note = log.noteNumber || "";

         if (!summaryTree[prov]) {
             summaryTree[prov] = { totalTrips: 0, totalM3: 0, totalMoney: 0, ccs: {} };
         }
         
         summaryTree[prov].totalTrips += 1;
         summaryTree[prov].totalM3 += m3;
         summaryTree[prov].totalMoney += money;

         if (!summaryTree[prov].ccs[ccName]) {
             summaryTree[prov].ccs[ccName] = { notes: [], trips: 0, m3: 0, money: 0 };
         }
         
         if (note) summaryTree[prov].ccs[ccName].notes.push(note);
         summaryTree[prov].ccs[ccName].trips += 1;
         summaryTree[prov].ccs[ccName].m3 += m3;
         summaryTree[prov].ccs[ccName].money += money;
     });

     sheetData.push([""]);
     sheetData.push([""]);
     sheetData.push(["RESUMEN DETALLADO POR PROVEEDOR Y CENTRO DE COSTO"]);
     sheetData.push(["PROVEEDOR", "CENTRO DE COSTO (DESTINO)", "FOLIOS / NOTAS", "VIAJES", "M3", "IMPORTE"]);

     Object.keys(summaryTree).sort().forEach(prov => {
         const provData = summaryTree[prov];
         Object.keys(provData.ccs).sort().forEach(ccKey => {
             const ccData = provData.ccs[ccKey];
             const uniqueNotes = [...new Set(ccData.notes)].filter(n => n && n.trim() !== "");
             const notesStr = uniqueNotes.join(", ");
             sheetData.push([
                 prov, 
                 ccKey, 
                 notesStr, 
                 ccData.trips, 
                 ccData.m3, 
                 ccData.money
             ]);
         });
         sheetData.push([
             `TOTAL ${prov}`, 
             "", 
             "", 
             provData.totalTrips, 
             provData.totalM3, 
             provData.totalMoney
         ]);
         sheetData.push([""]); 
     });
  };

  const handleExportDailyExcel = () => {
    if (!isSupervisorOrHigher) return alert("Permisos insuficientes");
    if (!window.XLSX) return alert("Cargando Excel... Intenta de nuevo.");
    const XLSX_LIB = window.XLSX;
    const dailyLogs = logs.filter(l => !l.isEjido);

    try {
        const wb = XLSX_LIB.utils.book_new();
        const sheetData = [];
        sheetData.push(["REPORTE DIARIO DE OBRA"]);
        sheetData.push([`FECHA: ${selectedDate}`]);
        sheetData.push([`GENERADO POR: ${currentAuth.name}`]);
        sheetData.push([""]);
        if (dailyNote) { sheetData.push(["OBSERVACIONES DEL DÍA:", dailyNote]); sheetData.push([""]); }
        sheetData.push(["No.", "HORA", "PLACAS", "PROVEEDOR", "M3", "PRECIO APL.", "ZONA", "CC", "NOTA FÍSICA", "CAPTURISTA"]);
        dailyLogs.forEach((log, index) => {
            const priceUsed = getLogPrice(log, pricePerM3);
            const capturista = log.recordedBy || 'Desconocido';
            sheetData.push([index + 1, log.createdAt ? log.createdAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '', log.placas, log.agrupacion, log.capacidad, priceUsed, log.locationName, log.cc, log.noteNumber || '', capturista]);
        });
        sheetData.push([""]);
        const totalM3 = dailyLogs.reduce((acc, curr) => acc + (curr.capacidad || 0), 0);
        sheetData.push(["TOTAL VIAJES:", dailyLogs.length]);
        sheetData.push(["TOTAL VOLUMEN (m3):", totalM3]);
        appendDailySummaryToSheet(sheetData, dailyLogs, pricePerM3);
        const ws = XLSX_LIB.utils.aoa_to_sheet(sheetData);
        
        formatSheetMoney(ws); // Aplicar formato inteligente
        
        XLSX_LIB.utils.book_append_sheet(wb, ws, "Reporte Diario");
        XLSX_LIB.writeFile(wb, `Reporte_Diario_${selectedDate}.xlsx`);
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleGenerateWeeklyReport = async () => {
      if (!isWeeklyUnlocked && !isMaster) return alert("Desbloquea primero.");
      if (!window.XLSX) return alert("Cargando librería... Intenta de nuevo.");
      const XLSX_LIB = window.XLSX;
      setLoading(true);
      
      try {
          const q = query(
            collection(db, collectionPath, "logs"),
            where("dateString", ">=", weeklyStart),
            where("dateString", "<=", weeklyEnd)
          );
          const snap = await getDocs(q);
          const logsData = snap.docs.map(d => ({...d.data(), id:d.id, createdAt: d.data().createdAt?.toDate() })).filter(l => !l.isEjido);
          if(logsData.length === 0) { setLoading(false); return alert("No hay datos en este rango"); }
          const wb = XLSX_LIB.utils.book_new();
          const providers = {};
          logsData.forEach(l => {
              const p = l.agrupacion || "SIN_PROVEEDOR";
              if(!providers[p]) providers[p] = [];
              providers[p].push(l);
          });
          for (const provName of Object.keys(providers)) {
              const provLogs = providers[provName];
              const sheetRows = [];
              sheetRows.push(["REPORTE DE ACARREOS"]);
              sheetRows.push([`PROVEEDOR: ${provName}`]);
              sheetRows.push([`PERIODO: ${weeklyStart} al ${weeklyEnd}`]);
              sheetRows.push([""]);
              
              const truckGroups = {};
              provLogs.forEach(l => {
                  if(!truckGroups[l.placas]) truckGroups[l.placas] = [];
                  truckGroups[l.placas].push(l);
              });
              const sortedPlates = Object.keys(truckGroups).sort(); 
              
              let grandTotalTrips = 0;
              let grandTotalMoney = 0;
              const volumeStats = {};
              const cecoStats = {};
              
              for(const plate of sortedPlates) {
                  const truckLogs = truckGroups[plate];
                  const capacity = truckLogs[0].capacidad || 0;
                  sheetRows.push([`NUMERO DE PLACA: ${plate}`, `CAPACIDAD: ${capacity} m3`]);
                  sheetRows.push(["#", "FECHA", "FOLIO/NOTA", "CECO", "ZONA", "VIAJES", "COSTO X VIAJE", "IMPORTE TOTAL"]);
                  const tripGroups = {};
                  truckLogs.forEach(l => {
                      const date = l.dateString;
                      const cc = l.cc || "S/N";
                      const zone = l.locationName || "S/N";
                      const price = getLogPrice(l, pricePerM3);
                      const key = `${date}|${cc}|${zone}|${price}`;
                      if(!tripGroups[key]) tripGroups[key] = { date, cc, zone, price, count: 0, notes: [], totalM3: 0 };
                      tripGroups[key].count++;
                      tripGroups[key].notes.push(l.noteNumber || "");
                      tripGroups[key].totalM3 += (l.capacidad || 0);
                      
                      const capKey = l.capacidad || 0;
                      if(!volumeStats[capKey]) volumeStats[capKey] = { count: 0, money: 0 };
                      volumeStats[capKey].count++;
                      volumeStats[capKey].money += (l.capacidad * price);
                      if(!cecoStats[cc]) cecoStats[cc] = { count: 0, money: 0 };
                      cecoStats[cc].count++;
                      cecoStats[cc].money += (l.capacidad * price);
                  });
                  let truckSubtotalMoney = 0;
                  let truckSubtotalTrips = 0;
                  let itemCounter = 1;
                  Object.values(tripGroups).sort((a,b) => a.date.localeCompare(b.date)).forEach( group => {
                      const totalImporte = group.totalM3 * group.price;
                      const unitCost = totalImporte / group.count;
                      const uniqueNotes = [...new Set(group.notes)].filter(n => n && n.trim() !== "");
                      sheetRows.push([itemCounter++, group.date, uniqueNotes.join(", "), group.cc, group.zone, group.count, unitCost, totalImporte]);
                      truckSubtotalMoney += totalImporte;
                      truckSubtotalTrips += group.count;
                  });
                  sheetRows.push(["", "", "", "", "SUBTOTAL:", truckSubtotalTrips, "", truckSubtotalMoney]);
                  sheetRows.push([""]); 
                  grandTotalTrips += truckSubtotalTrips;
                  grandTotalMoney += truckSubtotalMoney;
              }
              sheetRows.push([""]);
              sheetRows.push(["RESUMEN DE VOLUMETRÍA"]);
              sheetRows.push(["#", "DESCRIPCIÓN (m3)", "NUMERO DE VIAJES", "IMPORTE TOTAL"]);
              let volTotalMoney = 0;
              let volTotalTrips = 0;
              let volCounter = 1;
              Object.keys(volumeStats).sort((a,b)=>b-a).forEach(cap => {
                  const s = volumeStats[cap];
                  sheetRows.push([volCounter++, `UNIDADES DE ${cap} m3`, s.count, s.money]);
                  volTotalMoney += s.money;
                  volTotalTrips += s.count;
              });
              sheetRows.push(["", "TOTALES", volTotalTrips, volTotalMoney]);
              sheetRows.push([""]);
              sheetRows.push(["CONTABILIDAD (POR CECO)"]);
              sheetRows.push(["CENTRO DE COSTO", "VIAJES", "TOTAL"]);
              let cecoTotalMoney = 0;
              let cecoTotalTrips = 0;
              Object.keys(cecoStats).sort().forEach(cc => {
                  const s = cecoStats[cc];
                  sheetRows.push([cc, s.count, s.money]);
                  cecoTotalMoney += s.money;
                  cecoTotalTrips += s.count;
              });
              sheetRows.push(["SUMA DE TOTALES", cecoTotalTrips, cecoTotalMoney]);
              
              const ws = XLSX_LIB.utils.aoa_to_sheet(sheetRows);
              formatSheetMoney(ws); // Aplicar formato inteligente
              const safeName = provName.replace(/[\/\\\?\*\[\]]/g, "").substring(0, 30) || "Prov";
              XLSX_LIB.utils.book_append_sheet(wb, ws, safeName);
          }
          XLSX_LIB.writeFile(wb, `Semana_${weeklyStart}_${weeklyEnd}.xlsx`);
      } catch(e) {
          console.error(e);
          alert("Error al generar: " + e.message);
      }
      setLoading(false);
  };

  const handleExportExcel = async () => {
    if (!isAdminOrMaster) return alert("Solo Admin/Master");
    if (!window.XLSX) return alert("Cargando Excel... Intenta de nuevo.");
    const XLSX_LIB = window.XLSX;
    setLoading(true);

    try {
      const q = query(
        collection(db, collectionPath, "logs"),
        where("dateString", ">=", exportStartDate),
        where("dateString", "<=", exportEndDate)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ ...d.data(), createdAt: d.data().createdAt?.toDate() })).filter(l => !l.isEjido);
      
      if (data.length === 0) { setLoading(false); return alert("Sin datos en el rango seleccionado"); }

      const wb = XLSX_LIB.utils.book_new();
      
      let totalM3 = 0;
      let totalImport = 0;

      data.forEach(log => {
          totalM3 += (log.capacidad || 0);
          const p = getLogPrice(log, pricePerM3);
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
      const globalCCStats = {};
      const simpleProviderStats = {}; 
      let grandTotalTrips = 0;
      let grandTotalM3 = 0;
      let grandTotalMoney = 0;

      data.forEach(log => {
        const prov = log.agrupacion || "SIN ASIGNAR";
        const p = getLogPrice(log, pricePerM3);
        const m3 = log.capacidad || 0;
        const money = m3 * p;

        if (!supplierStats[prov]) supplierStats[prov] = { plates: {}, totalTrips: 0, totalM3: 0, money: 0 };
        supplierStats[prov].totalTrips += 1;
        supplierStats[prov].totalM3 += m3;
        supplierStats[prov].money += money;

        const plate = log.placas;
        if (!supplierStats[prov].plates[plate]) supplierStats[prov].plates[plate] = { trips: 0, m3: 0, money: 0 };
        supplierStats[prov].plates[plate].trips += 1;
        supplierStats[prov].plates[plate].m3 += m3;
        supplierStats[prov].plates[plate].money += money;

        const ccKey = `${log.locationName} (CC: ${log.cc || 'S/N'})`;
        if (!providerCCStats[prov]) providerCCStats[prov] = {};
        if (!providerCCStats[prov][ccKey]) providerCCStats[prov][ccKey] = { m3: 0, money: 0 };
        providerCCStats[prov][ccKey].m3 += m3;
        providerCCStats[prov][ccKey].money += money;

        const cleanCC = log.cc ? log.cc.toUpperCase().trim() : 'SIN ASIGNAR';
        const locationName = log.locationName || 'Desconocido';
        
        if (!globalCCStats[cleanCC]) globalCCStats[cleanCC] = { trips: 0, m3: 0, money: 0, locations: {} };
        globalCCStats[cleanCC].trips += 1;
        globalCCStats[cleanCC].m3 += m3;
        globalCCStats[cleanCC].money += money;
        
        if(!globalCCStats[cleanCC].locations[locationName]) globalCCStats[cleanCC].locations[locationName] = { m3: 0, money: 0 };
        globalCCStats[cleanCC].locations[locationName].m3 += m3;
        globalCCStats[cleanCC].locations[locationName].money += money;
        
        if(!simpleProviderStats[prov]) simpleProviderStats[prov] = { trips:0, m3:0, money:0 };
        simpleProviderStats[prov].trips += 1;
        simpleProviderStats[prov].m3 += m3;
        simpleProviderStats[prov].money += money;

        grandTotalTrips += 1;
        grandTotalM3 += m3;
        grandTotalMoney += money;
      });

      Object.keys(supplierStats).sort().forEach(prov => {
        summaryData.push([`PROVEEDOR: ${prov}`, "", supplierStats[prov].totalTrips, supplierStats[prov].totalM3, supplierStats[prov].money]);
        Object.keys(supplierStats[prov].plates).forEach(plate => {
          const pData = supplierStats[prov].plates[plate];
          summaryData.push(["", plate, pData.trips, pData.m3, pData.money]);
        });
        summaryData.push([""]); 
      });
      summaryData.push(["TOTAL GENERAL FLOTILLA", "", grandTotalTrips, grandTotalM3, grandTotalMoney]); 
      summaryData.push([""]); 

      summaryData.push([""]); 
      summaryData.push(["DESGLOSE DE GASTOS POR CENTRO DE COSTO (POR PROVEEDOR)"]);
      summaryData.push(["Proveedor", "Centro de Costo (Zona)", "Volumen Total (m3)", "Importe Total ($)"]);

      Object.keys(providerCCStats).sort().forEach(prov => {
          let provM3 = 0;
          let provMoney = 0;
          Object.keys(providerCCStats[prov]).sort().forEach(ccKey => {
              const stats = providerCCStats[prov][ccKey];
              summaryData.push([prov, ccKey, stats.m3, stats.money]);
              provM3 += stats.m3;
              provMoney += stats.money;
          });
          summaryData.push([`TOTAL ${prov}`, "", provM3, provMoney]); 
          summaryData.push([""]);
      });
      summaryData.push(["TOTAL GENERAL POR ZONAS", "", grandTotalM3, grandTotalMoney]); 

      summaryData.push([""]);
      summaryData.push([""]);
      summaryData.push(["DESGLOSE FINANCIERO POR CENTRO DE COSTOS (CC)"]);
      // NUEVA ESTRUCTURA LIMPIA (SIN PORCENTAJES)
      summaryData.push(["CÓDIGO CC", "ZONA / BANCO", "VOLUMEN (m3)", "IMPORTE ($)"]);
      
      Object.keys(globalCCStats).sort().forEach(cc => {
          const s = globalCCStats[cc];
          Object.keys(s.locations).sort().forEach(locName => {
              const lData = s.locations[locName];
              // SE ELIMINÓ EL CÁLCULO DE PORCENTAJE
              summaryData.push([cc, locName, lData.m3, lData.money]);
          });
      });
      // Fila de Total final sin porcentaje
      summaryData.push(["TOTAL GENERAL", "", grandTotalM3, grandTotalMoney]); 
      
      summaryData.push([""]);
      summaryData.push([""]);
      summaryData.push(["=========================================================================="]);
      summaryData.push([`Total de viajes del periodo (${exportStartDate} al ${exportEndDate})`]); 
      summaryData.push(["PROVEEDOR", "TOTAL DE VIAJES", "TOTAL DE IMPORTE", "TOTAL DE M3"]);

      Object.keys(simpleProviderStats).sort().forEach(prov => {
          const s = simpleProviderStats[prov];
          summaryData.push([prov, s.trips, s.money, s.m3]);
      });

      summaryData.push(["TOTALES", grandTotalTrips, grandTotalMoney, grandTotalM3]);
      summaryData.push([""]);
      summaryData.push([""]);

      summaryData.push(["ESTADO DE FACTURACIÓN"]);
      summaryData.push(["PROVEEDOR", "IMPORTE", "FACTURA", "TOTAL DE FACTURA", "DIFERENCIA POR FACTURAR"]);

      Object.keys(simpleProviderStats).sort().forEach(prov => {
          const s = simpleProviderStats[prov];
          summaryData.push([prov, s.money, "", "", ""]);
      });
      summaryData.push(["TOTALES", grandTotalMoney, "", "", ""]);

      const wsSummary = XLSX_LIB.utils.aoa_to_sheet(summaryData);
      formatSheetMoney(wsSummary); // Aplicar formato inteligente
      XLSX_LIB.utils.book_append_sheet(wb, wsSummary, "RESUMEN_TOTAL");

      const days = [...new Set(data.map(item => item.dateString))].sort();

      days.forEach(day => {
        const dayLogs = data.filter(d => d.dateString === day);
        dayLogs.sort((a,b) => a.createdAt - b.createdAt);
        
        let dayTotalM3 = 0;
        let dayTotalMoney = 0;
        dayLogs.forEach(l => {
            dayTotalM3 += (l.capacidad || 0);
            const p = getLogPrice(l, pricePerM3);
            dayTotalMoney += (l.capacidad || 0) * p;
        });

        const daySheetData = [
          ["CONCENTRADORA DE RESIDUOS MEXICANA, S.A. DE C.V."],
          [`CONTROL DE VIAJES DE ACARREOS - FECHA: ${day}`],
          [""],
          // NUEVOS ENCABEZADOS DE RESUMEN DIARIO
          ["TOTAL VIAJES DÍA:", dayLogs.length],
          ["TOTAL VOLUMEN DÍA (m3):", dayTotalM3],
          ["IMPORTE TOTAL DÍA:", dayTotalMoney],
          [""],
          ["No.", "HORA", "PLACAS", "PROVEEDOR", "M3", "PRECIO APL.", "ZONA", "CC", "NOTA FÍSICA", "CAPTURISTA"]
        ];

        dayLogs.forEach((log, idx) => {
            const p = getLogPrice(log, pricePerM3);
            const capturista = log.recordedBy || 'Desconocido';
            daySheetData.push([
                idx + 1,
                log.createdAt ? log.createdAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '',
                log.placas,
                log.agrupacion,
                log.capacidad,
                p,
                (log.capacidad * p), // Este valor no se muestra en columna, solo cálculo interno si quisiera
                log.locationName,
                log.cc,
                log.noteNumber || '',
                capturista
            ]);
        });

        appendDailySummaryToSheet(daySheetData, dayLogs, pricePerM3);
        
        const wsDay = XLSX_LIB.utils.aoa_to_sheet(daySheetData);
        formatSheetMoney(wsDay); // Aplicar formato inteligente
        XLSX_LIB.utils.book_append_sheet(wb, wsDay, day);
      });

      XLSX_LIB.writeFile(wb, `Reporte_Obra_${exportStartDate}_al_${exportEndDate}.xlsx`);

    } catch (e) { alert("Error Excel: " + e.message); }
    setLoading(false);
  };

  const handleExportEjidoReport = async () => {
      if (!isSupervisorOrHigher) return alert("Permisos insuficientes");
      if (!window.XLSX) return alert("Cargando Excel... Intenta de nuevo.");
      const XLSX_LIB = window.XLSX;
      setLoading(true);

      try {
          const q = query(
            collection(db, collectionPath, "logs"),
            where("dateString", ">=", exportStartDate),
            where("dateString", "<=", exportEndDate)
          );
          const snap = await getDocs(q);
          const data = snap.docs.map(d => ({ ...d.data(), createdAt: d.data().createdAt?.toDate() })).filter(l => l.isEjido);
          
          if (data.length === 0) { setLoading(false); return alert("Sin viajes Ejido en el rango seleccionado."); }

          const wb = XLSX_LIB.utils.book_new();
          const sheetData = [];
          
          sheetData.push(["REPORTE ESPECIAL - VIAJES EJIDO (SIN VALOR COMERCIAL)"]);
          sheetData.push([`Periodo: ${exportStartDate} al ${exportEndDate}`]);
          sheetData.push([`Generado por: ${currentAuth.name}`]);
          sheetData.push([""]);
          
          sheetData.push(["FECHA", "HORA", "PLACAS", "PROVEEDOR", "M3", "ZONA / DESTINO", "NOTA", "CAPTURISTA"]);
          
          let totalM3 = 0;
          data.sort((a,b) => a.createdAt - b.createdAt);

          data.forEach(log => {
              totalM3 += (log.capacidad || 0);
              sheetData.push([
                  log.dateString,
                  log.createdAt ? log.createdAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '',
                  log.placas,
                  log.agrupacion,
                  log.capacidad,
                  log.locationName,
                  log.noteNumber || '',
                  log.recordedBy
              ]);
          });
          
          sheetData.push([""]);
          sheetData.push(["TOTAL VIAJES:", data.length]);
          sheetData.push(["TOTAL VOLUMEN:", totalM3]);

          const ws = XLSX_LIB.utils.aoa_to_sheet(sheetData);
          XLSX_LIB.utils.book_append_sheet(wb, ws, "EJIDO");
          XLSX_LIB.writeFile(wb, `Reporte_Ejido_${exportStartDate}_al_${exportEndDate}.xlsx`);

      } catch(e) { alert("Error: " + e.message); }
      setLoading(false);
  };

  const processScan = async (truck, location, noteNumber = "") => {
    setProcessingScan(true);
    
    const logData = {
        truckId: truck.id, 
        placas: truck.placas, 
        capacidad: truck.capacidad, 
        agrupacion: truck.agrupacion,
        locationName: location.name, 
        cc: location.cc,
        noteNumber: noteNumber,
        isEjido: isEjidoMode,
        priceSnapshot: isEjidoMode ? 0 : Number(pricePerM3),
        createdAt: serverTimestamp(),
        dateString: getTodayString(),
        recordedBy: currentAuth.name
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
  const handleAddLocation = async () => { if (!isSupervisorOrHigher) return alert("Permisos insuficientes"); if(!newLocation.name) return alert("Faltan datos"); await addDoc(collection(db, collectionPath, "locations"), newLocation); setNewLocation({ name: '', cc: '', dailyGoal: '' }); };
  
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
      if (!isAdminOrMaster) return;
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
    window.location.reload();
  };

  // --- RENDERIZADO CONDICIONAL ---

  if (loading) return (
      <div style={styles.splashScreen}>
          <div style={styles.splashLogoContainer}>
              <Icons.Logo />
          </div>
          <style>{`@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }`}</style>
          <div style={{color:'white', marginTop:'20px', fontWeight:'bold', letterSpacing:'0.2em'}}>CARGANDO SISTEMA...</div>
      </div>
  );

  if (!currentAuth.isAuthenticated) {
    return (
      <div style={styles.loginScreen}>
        <style>{`
          .press-effect:active { transform: scale(0.96); }
        `}</style>
        <div style={styles.loginBox}>
          <div style={{display:'flex', justifyContent:'center', marginBottom:'20px', height: '80px'}}>
              <Icons.Logo />
          </div>
          <h1 style={{color: '#1e293b', margin: '0 0 5px 0', fontSize:'1.8rem', fontWeight:'800'}}>CONTROL OBRA <span style={{color:'#d97706'}}>PRO GOLD</span></h1>
          <p style={{color:'#64748b', margin:'0 0 30px 0', fontSize:'0.9rem'}}>Sistema de Gestión de Obra</p>
          
          <div style={styles.inputIconGroup}>
            <div style={styles.inputIcon}><Icons.User/></div>
            <input 
              style={{...styles.input, ...styles.inputWithIcon}} 
              placeholder="Usuario" 
              value={authInput.user} 
              onChange={e => setAuthInput({...authInput, user: e.target.value})} 
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          
          <div style={styles.inputIconGroup}>
            <div style={styles.inputIcon}><Icons.Key/></div>
            <input 
              style={{...styles.input, ...styles.inputWithIcon, paddingRight:'45px'}} 
              type={showPin ? "text" : "password"} 
              placeholder="PIN de Acceso" 
              value={authInput.pin} 
              onChange={e => setAuthInput({...authInput, pin: e.target.value})} 
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button onClick={() => setShowPin(!showPin)} style={{position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8'}}>{showPin ? <Icons.EyeOff/> : <Icons.Eye/>}</button>
          </div>

          <button onClick={handleLogin} className="press-effect" style={{...styles.button, ...styles.bgBlueGradient, color:'white', boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)', marginTop:'10px'}}>INICIAR SESIÓN</button>
        </div>
      </div>
    );
  }

  // --- RENDERIZADO PRINCIPAL (SOLO SI ESTÁ AUTENTICADO) ---
  
  const { hourlyCounts, providerData, totalM3, count } = getBiData();
  const filteredLogs = getFilteredLogs();

  return (
    <div style={styles.container}>
      <style>{printStyles}</style>
      <style>{`
          .press-effect:active { transform: scale(0.96); }
      `}</style>
      
      {pendingWrites && isOnline && (
        <div style={styles.syncBanner}>📡 Sincronizando datos...</div>
      )}

      <header style={{...styles.header, ...(isEjidoMode ? styles.headerEjido : {})}} className="no-print">
        <div>
          <h1 style={styles.title}>Control <span style={{color: isEjidoMode ? '#e9d5ff' : '#60a5fa'}}>{isEjidoMode ? 'EJIDO' : 'GOLD'}</span></h1>
          <p style={styles.subtitle}>
             <span style={{...styles.onlineIndicator, backgroundColor: isOnline ? '#4ade80' : '#f87171'}}></span>
             {isOnline ? 'ONLINE' : 'OFFLINE'} 
             <span style={{opacity: 0.7}}> | {currentAuth.name}</span>
          </p>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
           <input type="date" value={selectedDate} onChange={(e) => e.target.value && setSelectedDate(e.target.value)} style={{background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'white', borderRadius:'12px', padding:'8px 12px', fontSize:'0.8rem', outline:'none', backdropFilter:'blur(4px)'}} />
           <button onClick={handleLogout} className="press-effect" style={{fontSize:'0.7rem', color: 'white', background:'rgba(255,255,255,0.15)', border:'none', padding:'8px 12px', borderRadius:'12px', cursor:'pointer', fontWeight:'700', backdropFilter:'blur(4px)'}}>SALIR</button>
        </div>
      </header>

      {editingLog && (
          <div style={styles.modalOverlay}>
              <div style={styles.modalContent}>
                  <h3 style={{marginTop:0, color:'#1e293b', fontSize:'1.2rem', marginBottom:'20px'}}>✏️ Editar Viaje</h3>
                  <div style={{textAlign:'left', marginBottom:15}}><label style={{fontSize:'0.75rem', fontWeight:'700', color:'#64748b', marginBottom:'6px', display:'block', textTransform:'uppercase'}}>Nota Física</label><input style={styles.input} value={editingLog.noteNumber} onChange={e=>setEditingLog({...editingLog, noteNumber: e.target.value})} /></div>
                  <div style={{textAlign:'left', marginBottom:25}}><label style={{fontSize:'0.75rem', fontWeight:'700', color:'#64748b', marginBottom:'6px', display:'block', textTransform:'uppercase'}}>Zona/Banco</label><select style={styles.select} value={editingLog.locationName} onChange={e=>setEditingLog({...editingLog, locationName: e.target.value})}>{locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}</select></div>
                  <div style={{display:'flex', gap:15}}><button onClick={()=>setEditingLog(null)} className="press-effect" style={{...styles.button, background:'#f1f5f9', color:'#64748b', flex:1}}>Cancelar</button><button onClick={handleEditLog} className="press-effect" style={{...styles.button, flex:1, boxShadow:'0 10px 20px -5px rgba(37, 99, 235, 0.4)'}}>Guardar Cambios</button></div>
              </div>
          </div>
      )}

      {showNoteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{color: '#1e293b', marginTop:0, fontSize:'1.4rem'}}>📝 Nota Inicial</h2>
            {isEjidoMode && <div style={{background:'#f3e8ff', color:'#6b21a8', padding:'8px 12px', borderRadius:'12px', marginBottom:'20px', fontWeight:'700', fontSize:'0.75rem', letterSpacing:'0.05em'}}>MODO EJIDO: SIN VALOR COMERCIAL</div>}
            <p style={{color:'#64748b', marginBottom:'20px', fontSize:'0.9rem'}}>Ingresa el número de folio físico:</p>
            <input style={{...styles.input, textAlign:'center', fontSize:'2rem', fontWeight:'800', letterSpacing:'0.15em', padding:'20px', color:'#2563eb'}} value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="000" autoFocus />
            <div style={{display:'flex', gap:'15px', marginTop:'30px'}}>
                 <button onClick={cancelNote} className="press-effect" style={{...styles.button, backgroundColor:'#f1f5f9', color:'#64748b', flex:1}}>CANCELAR</button>
                 <button onClick={confirmNote} className="press-effect" style={{...styles.button, ...styles.bgBlueGradient, flex:1, boxShadow:'0 10px 20px -5px rgba(37, 99, 235, 0.4)'}}>CONFIRMAR</button>
            </div>
            {processingScan && <p style={{marginTop:20, color:'#94a3b8', fontSize:'0.8rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>⏳ Registrando viaje en la nube...</p>}
          </div>
        </div>
      )}
      
      {showNotePreview && noteData && (
          <div style={styles.modalOverlay}>
              <div style={{...styles.modalContent, maxWidth: '600px', width:'95%', textAlign:'left', padding:'32px'}}>
                   <button onClick={() => setShowNotePreview(false)} style={styles.closeBtn}>×</button>
                   <div id="print-note">
                       <h2 style={{textAlign:'center', borderBottom:'2px solid #f1f5f9', paddingBottom:'20px', margin:'0 0 24px 0', color:'#1e293b', fontSize:'1.2rem', letterSpacing:'-0.02em'}}>NOTA DE REMISIÓN</h2>
                       {viewMode === 'ejido' && <div style={{textAlign:'center', color:'#7e22ce', fontWeight:'bold', marginBottom:'10px'}}>REGISTRO EJIDO (SIN VALOR)</div>}
                       <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                           <span style={{color:'#94a3b8', fontSize:'0.75rem', fontWeight:'700', textTransform:'uppercase'}}>FECHA</span>
                           <strong style={{fontSize:'1rem', color:'#334155'}}>{noteData.date}</strong>
                       </div>
                       <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                           <span style={{color:'#94a3b8', fontSize:'0.75rem', fontWeight:'700', textTransform:'uppercase'}}>PLACA</span>
                           <strong style={{fontSize:'1.2rem', color:'#2563eb'}}>{noteData.plate}</strong>
                       </div>
                       <p style={{background:'#f8fafc', padding:'12px', borderRadius:'12px', fontSize:'0.9rem', marginBottom:'24px', color:'#475569', border:'1px solid #e2e8f0'}}><strong>PROVEEDOR:</strong> {noteData.provider}</p>
                       
                       <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.85rem'}}>
                           <thead>
                               <tr style={{background:'#f1f5f9', color:'#64748b'}}>
                                   <th style={{padding:'10px', textAlign:'center', borderRadius:'8px 0 0 8px'}}>HORA</th>
                                   <th style={{padding:'10px', textAlign:'center'}}>NOTA</th>
                                   <th style={{padding:'10px'}}>ZONA</th>
                                   <th style={{padding:'10px', textAlign:'right', borderRadius:'0 8px 8px 0'}}>M3</th>
                               </tr>
                           </thead>
                           <tbody>
                               {noteData.trips.map((t, idx) => (
                                   <tr key={idx} style={{borderBottom:'1px dashed #e2e8f0'}}>
                                       <td style={{padding:'12px', textAlign:'center', color:'#64748b'}}>{t.createdAt ? t.createdAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</td>
                                       <td style={{padding:'12px', textAlign:'center', fontWeight:'700', color:'#334155'}}>{t.noteNumber}</td>
                                       <td style={{padding:'12px', color:'#334155'}}>{t.locationName}</td>
                                       <td style={{padding:'12px', textAlign:'right', fontWeight:'800', color:'#334155'}}>{t.capacidad}</td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                       
                       <div style={{marginTop:'30px', textAlign:'right', fontSize:'1rem', background:'#f8fafc', padding:'20px', borderRadius:'16px'}}>
                           <p style={{margin:'6px 0', color:'#64748b', fontSize:'0.9rem'}}>TOTAL VIAJES: <strong style={{fontSize:'1.1rem', color:'#1e293b'}}>{noteData.totalViajes}</strong></p>
                           <p style={{margin:'6px 0', color:'#2563eb'}}>VOLUMEN TOTAL: <strong style={{fontSize:'1.4rem'}}>{noteData.totalM3} m³</strong></p>
                       </div>
                   </div>
                   
                   <div style={{display:'flex', gap:'12px', marginTop:'30px'}}>
                       <button onClick={() => {
                           const printContent = document.getElementById('print-note').innerHTML;
                           const originalContents = document.body.innerHTML;
                           document.body.innerHTML = printContent;
                           window.print();
                           document.body.innerHTML = originalContents;
                           window.location.reload(); 
                       }} className="press-effect" style={{...styles.button, flex:1, fontSize:'0.8rem', background:'#1e293b'}}>IMPRIMIR PDF</button>
                   </div>
              </div>
          </div>
      )}

      {isScanning && <NativeScanner onScan={handleScan} onCancel={() => setIsScanning(false)} />}
      {processingScan && !showNoteModal && (
          <div style={styles.modalOverlay}>
              <div style={{color:'white', fontWeight:'bold', fontSize:'1.2rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'15px'}}>
                  <div style={{width:'50px', height:'50px', border:'4px solid rgba(255,255,255,0.2)', borderTop:'4px solid white', borderRadius:'50%', animation:'spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite'}}></div>
                  <span style={{marginTop:'10px', letterSpacing:'0.05em'}}>PROCESANDO...</span>
                  <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>
          </div>
      )}

      <main style={styles.main}>
        {activeTab === 'dashboard' && (
          <div className="no-print-padding">
            {/* KPI CARDS (SIEMPRE NORMALES) */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px'}} className="no-print">
              <div style={styles.kpiCard}>
                  <div style={{position:'absolute', top:'-20px', right:'-20px', opacity:0.1, transform:'rotate(15deg)'}}><Icons.List /></div>
                  <div style={styles.kpiValue}>{logs.filter(l=>!l.isEjido).length}</div>
                  <div style={styles.kpiLabel}>Viajes</div>
              </div>
              <div style={{...styles.kpiCard, background:'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow:'0 10px 25px -5px rgba(5, 150, 105, 0.35)'}}>
                  <div style={styles.kpiValue}>{logs.filter(l=>!l.isEjido).reduce((a,c)=>a+(c.capacidad||0),0)}</div>
                  <div style={styles.kpiLabel}>M³ Total</div>
              </div>
              <div style={{...styles.kpiCard, background:'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', boxShadow:'0 10px 25px -5px rgba(124, 58, 237, 0.35)'}}>
                  <div style={styles.kpiValue}>{[...new Set(logs.filter(l=>!l.isEjido).map(l=>l.placas))].length}</div>
                  <div style={styles.kpiLabel}>Camiones</div>
              </div>
            </div>

            {isAdminOrMaster && (
              <div style={{...styles.card, marginTop: '20px', border: '1px solid #bfdbfe', background:'#f0f9ff'}} className="no-print">
                {/* ... existing admin panel ... */}
                <h3 style={{margin:'0 0 20px 0', fontSize:'1rem', color:'#1e40af', display:'flex', alignItems:'center', gap:'10px', fontWeight:'800'}}>
                    <Icons.Report/> PANEL FINANCIERO
                </h3>
                
                {/* CONFIGURAR PRECIO (SOLO MASTER) */}
                {isMaster && (
                    <div style={{marginBottom:'20px', paddingBottom:'20px', borderBottom:'1px solid #dbeafe'}}>
                        <button 
                            onClick={() => setExpandPriceConfig(!expandPriceConfig)} 
                            className="press-effect"
                            style={{...styles.accordionBtn, background:'white', border:'1px solid #bfdbfe', color:'#1e40af', marginBottom:0}}
                        >
                            <span>💰 Configurar Precio Base</span>
                            <span style={{fontSize:'0.8rem'}}>{expandPriceConfig ? 'Menos' : 'Más'}</span>
                        </button>

                        {expandPriceConfig && (
                            <div style={{padding:'20px', marginTop:'12px', backgroundColor:'white', borderRadius:'20px', border:'1px solid #bfdbfe', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.02)'}}>
                                {!isPriceUnlocked ? (
                                    <div style={{display:'flex', gap:'12px'}}>
                                        <input 
                                            type="password" 
                                            placeholder="PIN Maestro" 
                                            value={pricePinInput} 
                                            onChange={e=>setPricePinInput(e.target.value)} 
                                            style={{...styles.input}} 
                                        />
                                        <button onClick={handleUnlockPrice} className="press-effect" style={{...styles.button, width:'auto', fontSize:'0.8rem', padding:'0 24px'}}>Desbloquear</button>
                                    </div>
                                ) : (
                                    <>
                                        <label style={{fontSize:'0.75rem', fontWeight:'700', color:'#1e40af', display:'block', marginBottom:'8px', textTransform:'uppercase'}}>Precio por m³ ($):</label>
                                        <div style={{display:'flex', gap:'12px'}}>
                                            <input type="number" value={pricePerM3} onChange={e=>setPricePerM3(e.target.value)} style={{...styles.input}} />
                                            <button onClick={savePrice} className="press-effect" style={{...styles.button, width:'auto', fontSize:'0.8rem', backgroundColor: '#15803d', padding:'0 24px'}}>Guardar</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div style={{display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap'}}>
                  <div style={{flex:1}}>
                      <span style={{fontSize:'0.65rem', fontWeight:'700', color:'#64748b', textTransform:'uppercase', display:'block', marginBottom:'4px'}}>Desde</span>
                      <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} style={{...styles.input, padding:'12px'}} />
                  </div>
                  <div style={{flex:1}}>
                      <span style={{fontSize:'0.65rem', fontWeight:'700', color:'#64748b', textTransform:'uppercase', display:'block', marginBottom:'4px'}}>Hasta</span>
                      <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} style={{...styles.input, padding:'12px'}} />
                  </div>
                </div>
                <button onClick={handleExportExcel} className="press-effect" style={{...styles.button, marginTop:'20px', fontSize:'0.85rem', background:'white', color:'#1e40af', border:'2px solid #1e40af', boxShadow:'none'}}>📥 DESCARGAR REPORTE EXCEL</button>
              
                {/* --- GENERADOR SEMANAL --- */}
                <div style={{marginTop:'24px', borderTop:'1px solid #bfdbfe', paddingTop:'20px'}}>
                    <button 
                        onClick={() => setExpandWeeklyGen(!expandWeeklyGen)} 
                        className="press-effect"
                        style={{...styles.accordionBtn, background:'#f0f9ff', border:'1px solid #bae6fd', color:'#0284c7', marginBottom:0}}
                    >
                        <span>📅 Generador Semanal (Proveedores)</span>
                        <span style={{fontSize:'0.8rem'}}>{expandWeeklyGen ? 'Menos' : 'Más'}</span>
                    </button>
                    
                    {expandWeeklyGen && (
                        <div style={{padding:'20px', backgroundColor:'white', borderRadius:'20px', border:'1px solid #bae6fd', marginTop:'12px'}}>
                            {/* ... same logic ... */}
                            {!isWeeklyUnlocked ? (
                                <div style={{display:'flex', gap:'10px'}}>
                                    <input type="password" placeholder="Código de Acceso" value={weeklyPin} onChange={e=>setWeeklyPin(e.target.value)} style={{...styles.input, flex:1}} />
                                    <button onClick={handleUnlockWeekly} className="press-effect" style={{...styles.button, width:'auto', fontSize:'0.8rem', padding:'0 24px', background:'#0284c7'}}>Desbloquear</button>
                                </div>
                            ) : (
                                <div>
                                    <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                                        <input type="date" value={weeklyStart} onChange={e => setWeeklyStart(e.target.value)} style={{...styles.input, padding:'10px'}} />
                                        <input type="date" value={weeklyEnd} onChange={e => setWeeklyEnd(e.target.value)} style={{...styles.input, padding:'10px'}} />
                                    </div>
                                    <button onClick={handleGenerateWeeklyReport} className="press-effect" style={{...styles.button, background:'#0ea5e9'}}>📄 GENERAR REPORTE</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
              </div>
            )}
            
            {/* BOTÓN DESCARGAR REPORTE DEL DÍA */}
            {isSupervisorOrHigher && (
                 <div style={{...styles.card, marginTop:'20px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'linear-gradient(to right, #ecfdf5, #ffffff)', borderColor:'#a7f3d0', padding:'24px'}}>
                     <div>
                         <h3 style={{margin:0, fontSize:'1.1rem', color:'#065f46'}}>📊 Reporte Diario</h3>
                         <p style={{margin:'4px 0 0 0', fontSize:'0.8rem', color:'#059669', opacity:0.8}}>{selectedDate}</p>
                     </div>
                     <button onClick={handleExportDailyExcel} className="press-effect" style={{...styles.button, width:'auto', padding:'12px 24px', fontSize:'0.8rem', background:'#10b981', boxShadow:'0 10px 20px -5px rgba(16, 185, 129, 0.4)'}}>DESCARGAR</button>
                 </div>
            )}

            <div style={{...styles.card, padding:0, overflow:'hidden', marginTop:'30px'}} className="print-only">
               <div style={{padding:'20px 24px', background:'#f8fafc', fontWeight:'800', borderBottom:'1px solid #e2e8f0', color:'#334155', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                   <span style={{fontSize:'0.9rem', letterSpacing:'-0.02em'}}>📋 REGISTRO DE VIAJES</span>
                   <span style={{fontSize:'0.7rem', background:'#e2e8f0', padding:'6px 10px', borderRadius:'8px', color:'#64748b'}}>{filteredLogs.length} Viajes</span>
               </div>
               
               {/* --- SWITCH VISUALIZACIÓN --- */}
               <div style={{padding:'20px 24px 0 24px', backgroundColor:'white'}}>
                   <div style={styles.tabSwitch}>
                       <div onClick={() => setViewMode('normal')} style={{...styles.tabSwitchBtn, ...(viewMode==='normal' ? styles.tabSwitchActive : {color:'#94a3b8'})}}>Obras Normales</div>
                       <div onClick={() => setViewMode('ejido')} style={{...styles.tabSwitchBtn, ...(viewMode==='ejido' ? styles.tabSwitchActive : {color:'#94a3b8'})}}>Registros Ejido</div>
                   </div>

                   <div style={styles.inputIconGroup}>
                       <div style={styles.inputIcon}><Icons.Search/></div>
                       <input style={styles.searchBar} placeholder="Buscar por placa, zona o nota..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                   </div>
               </div>
               
               {/* EMPTY STATE TABLE */}
               {filteredLogs.length === 0 ? (
                   <div style={{padding:'60px 20px', textAlign:'center', color:'#94a3b8'}}>
                       <div style={{fontSize:'3rem', marginBottom:'15px', opacity:0.5}}>📭</div>
                       <p style={{fontSize:'0.9rem'}}>No hay registros para mostrar hoy.</p>
                   </div>
               ) : (
                   <div style={{overflowX:'auto'}}>
                    <table style={styles.table}>
                      <thead><tr style={{background:'#f9fafb'}}><th style={styles.th}>#</th><th style={styles.th}>Placa</th><th style={styles.th}>Nota</th><th style={styles.th}>Hora</th><th style={styles.th}>Zona</th><th style={{...styles.th, textAlign:'right'}}>M³</th><th style={styles.th}></th></tr></thead>
                      <tbody>
                        {filteredLogs.map((log, i) => (
                          <tr key={log.id} style={{display: i < 50 ? 'table-row' : 'none'}} className="print-row">
                            <td style={styles.td}>{filteredLogs.length - i}</td>
                            <td style={{...styles.td, fontWeight:'700', color:'#1e293b'}}>
                                {log.placas}
                                {log.isEjido && <span style={styles.ejidoBadge}>EJIDO</span>}
                                {/* INDICADOR DE TIEMPO / VUELTA RÁPIDA */}
                                {!log.isEjido && log.timeDelta !== null && (
                                    <div style={{
                                        ...styles.timeTag, 
                                        ...(log.timeDelta < SECURITY_CONFIG.MIN_CYCLE_TIME_MINUTES ? styles.timeTagSuspicious : styles.timeTagNormal),
                                    }}>
                                        <Icons.Time/> {log.timeDelta}m
                                    </div>
                                )}
                            </td>
                            <td style={{...styles.td, color:'#2563eb', fontWeight:'600'}}>{log.noteNumber || '-'}</td>
                            <td style={styles.td}>{log.createdAt && typeof log.createdAt.toLocaleTimeString === 'function' ? log.createdAt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</td>
                            <td style={styles.td}><span style={{background:'#f1f5f9', padding:'4px 8px', borderRadius:'6px', fontSize:'0.75rem', fontWeight:'500'}}>{log.locationName}</span></td>
                            <td style={{...styles.td, textAlign:'right', fontWeight:'800', fontSize:'0.9rem'}}>{log.capacidad}</td>
                            <td style={styles.td} className="no-print">
                                {isSupervisorOrHigher && <button onClick={()=>setEditingLog(log)} style={{border:'none', background:'white', color:'#2563eb', marginRight:'8px', cursor:'pointer', padding:'8px', borderRadius:'8px', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}><Icons.Edit/></button>}
                                {isAdminOrMaster && <button onClick={()=>deleteItem('logs', log.id)} style={{border:'none', background:'#fef2f2', color:'#ef4444', cursor:'pointer', padding:'8px', borderRadius:'8px'}}><Icons.Trash/></button>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredLogs.length > 50 && <div style={{textAlign:'center', padding:'20px', color:'#94a3b8', fontSize:'0.8rem'}}>Mostrando últimos 50 registros...</div>}
                    <style>{`@media print { .print-row { display: table-row !important; } }`}</style>
                   </div>
               )}
            </div>

            <div style={{...styles.card, marginTop: '30px', padding:'32px'}}>
                <h3 style={{margin:'0 0 20px 0', fontSize:'1rem', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:'700'}}>🚛 Flotilla Activa</h3>
                <div style={{display:'flex', flexWrap:'wrap', gap:'12px'}}>
                    {[...new Set(filteredLogs.map(l=>l.placas))].map(placa => (
                        <button key={placa} onClick={() => handleTruckClick(placa)} className="press-effect" style={{background:'white', border:'1px solid #cbd5e1', color:'#334155', padding:'10px 16px', borderRadius:'12px', fontSize:'0.85rem', fontWeight:'700', cursor:'pointer', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)', transition:'all 0.2s'}}>{placa}</button>
                    ))}
                    {filteredLogs.length === 0 && <span style={{color:'#94a3b8', fontSize:'0.9rem', fontStyle:'italic'}}>No hay camiones en la lista visible.</span>}
                </div>
            </div>

            <div style={styles.noteBlock} className="no-print">
              <strong style={{color:'#92400e', display:'flex', alignItems:'center', gap:'8px', fontSize:'0.9rem'}}>📝 Nota del Día</strong>
              <textarea style={styles.textArea} value={dailyNote} onChange={e=>setDailyNote(e.target.value)} placeholder="Escribe observaciones importantes..." />
              <button onClick={handleSaveNote} className="press-effect" style={{...styles.button, background:'#f59e0b', marginTop:'15px', width:'auto', fontSize:'0.8rem', padding:'12px 24px', color:'white', boxShadow:'0 10px 20px -5px rgba(245, 158, 11, 0.4)'}}>Guardar Nota</button>
            </div>
          </div>
        )}

        {/* ... (Scanner Tab - Style Upgrades) ... */}
        {activeTab === 'scanner' && (
          <div style={{textAlign:'center', padding:'20px'}}>
             {isSupervisorOrHigher && (
                 <div style={{marginBottom:'24px', display:'flex', justifyContent:'center'}}>
                     <button 
                        onClick={handleToggleEjidoMode} 
                        className="press-effect"
                        style={{
                            ...styles.button, 
                            background: isEjidoMode ? '#7e22ce' : 'white', 
                            color: isEjidoMode ? 'white' : '#7e22ce',
                            border: '2px solid #7e22ce',
                            boxShadow: isEjidoMode ? '0 10px 25px -5px rgba(126, 34, 206, 0.5)' : 'none',
                            padding: '12px 24px',
                            fontSize: '0.85rem',
                            width: 'auto'
                        }}
                     >
                        {isEjidoMode ? '⚠️ MODO EJIDO ACTIVO' : '🔒 ACTIVAR MODO EJIDO'}
                     </button>
                 </div>
             )}

             <div style={{...styles.card, marginBottom:'30px', padding:'32px', borderColor: isEjidoMode ? '#7e22ce' : '#e2e8f0'}}>
               <h3 style={{marginTop:0, marginBottom:'24px', color: isEjidoMode ? '#7e22ce' : '#1e293b', fontSize:'1.2rem'}}>
                   {isEjidoMode ? '🚜 Zona Ejido Seleccionada' : '📍 Selecciona Zona'}
               </h3>
               <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
                 {locations.map(l => {
                    const progress = getLocationProgress(l.id);
                    return (
                    <button 
                        key={l.id} 
                        onClick={()=>setSelectedLocationId(l.id)} 
                        className="press-effect"
                        style={{
                            padding:'20px', 
                            border: selectedLocationId===l.id ? (isEjidoMode ? '2px solid #7e22ce' : '2px solid #2563eb') : '1px solid #f1f5f9', 
                            borderRadius:'20px', 
                            background: selectedLocationId===l.id ? (isEjidoMode ? '#f3e8ff' : '#eff6ff') : 'white',
                            color: selectedLocationId===l.id ? (isEjidoMode ? '#7e22ce' : '#1e40af') : '#334155',
                            fontWeight: '700',
                            boxShadow: selectedLocationId===l.id ? '0 10px 20px -5px rgba(37, 99, 235, 0.2)' : '0 4px 6px -1px rgba(0,0,0,0.02)',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: selectedLocationId===l.id ? 'scale(1.02)' : 'scale(1)'
                        }}
                    >
                        <span style={{marginBottom:'8px', fontSize:'0.9rem'}}>{l.name}</span>
                        {progress && progress.goal > 0 && (
                            <div style={{width:'100%'}}>
                                <div style={{fontSize:'0.65rem', color:'#64748b', marginBottom:'4px'}}>
                                    {progress.currentVol} / {progress.goal} m³
                                </div>
                                <div style={styles.progressBarContainer}>
                                    <div style={{
                                        ...styles.progressBarFill, 
                                        width: `${progress.pct}%`,
                                        backgroundColor: progress.pct >= 100 ? '#ef4444' : (progress.pct > 80 ? '#f59e0b' : '#10b981')
                                    }}></div>
                                </div>
                            </div>
                        )}
                    </button>
                 )})}
               </div>
             </div>
             <button 
                onClick={()=>{ if(!currentAuth.isAuthenticated) return setShowAuthModal(true); if(!selectedLocationId) return alert("Selecciona zona"); setIsScanning(true); }} 
                className="press-effect"
                style={{
                    ...styles.button, 
                    padding:'24px', 
                    fontSize:'1.2rem', 
                    borderRadius:'28px', 
                    boxShadow: isEjidoMode ? '0 20px 40px -10px rgba(126, 34, 206, 0.5)' : '0 20px 40px -10px rgba(37, 99, 235, 0.5)',
                    background: isEjidoMode ? 'linear-gradient(135deg, #7e22ce 0%, #581c87 100%)' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    gap:'16px'
                }}
            >
                <Icons.Camera/> {isEjidoMode ? 'ESCANEAR (EJIDO)' : 'ESCANEAR QR'}
            </button>
          </div>
        )}
        
        {/* ... (BI Tab Styles) ... */}
        {activeTab === 'bi' && (
            <div style={{display:'flex', flexDirection:'column', gap:'24px'}}>
                <div style={{...styles.card, background:'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color:'white', border:'none', position:'relative', overflow:'hidden'}}>
                    <div style={{position:'absolute', top:'-20%', right:'-10%', fontSize:'8rem', opacity:0.05}}><Icons.Chart/></div>
                    <h2 style={{margin:'0 0 8px 0', fontSize:'1.6rem', letterSpacing:'-0.03em'}}>Inteligencia de Obra</h2>
                    <p style={{margin:0, opacity:0.7, fontSize:'0.9rem', fontWeight:'300'}}>Análisis comercial en tiempo real.</p>
                </div>
                {/* ... charts logic ... */}
                {selectedDate !== getTodayString() ? (
                    <div style={{...styles.card, textAlign:'center', padding:'60px'}}>
                        <h3 style={{color:'#64748b', margin:0}}>⚠️ Datos Históricos</h3>
                        <p style={{color:'#94a3b8', margin:'10px 0 0 0'}}>La visualización BI en tiempo real solo está disponible para la fecha actual.</p>
                    </div>
                ) : (
                    <>
                        <ChartBar title="📊 Ritmo de Trabajo (x Hora)" data={hourlyCounts} labelKey="hour" valueKey="count" color="#f59e0b" />
                        <ChartBar title="🏗️ Top Proveedores (m³)" data={providerData} labelKey="name" valueKey="m3" color="#3b82f6" />
                        
                        <div style={styles.card}>
                            <h3 style={{fontSize:'1rem', color:'#334155', marginBottom:'20px'}}>📈 Resumen Ejecutivo</h3>
                            <ul style={{paddingLeft:'20px', lineHeight:'2', fontSize:'0.95rem', color:'#475569'}}>
                                <li>Volumen Total Periodo: <strong>{totalM3} m³</strong></li>
                                <li>Hora Pico: <strong>{hourlyCounts.sort((a,b)=>b.count-a.count)[0].hour}:00 hrs</strong></li>
                                <li>Líder: <strong>{providerData.length > 0 ? providerData[0].name : 'N/A'}</strong></li>
                                <li>Promedio: <strong>{count > 0 ? (totalM3/count).toFixed(1) : 0} m³/viaje</strong></li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        )}

        {/* ... (Config Tab Styles) ... */}
        {activeTab === 'config' && (
          <div style={{display:'flex', flexDirection:'column', gap:'24px'}}>
            {isMaster && (
              <div style={{...styles.card, border:'1px solid #bfdbfe', backgroundColor:'#f0f9ff'}}>
                <button 
                    onClick={() => setExpandUsers(!expandUsers)} 
                    className="press-effect"
                    style={{...styles.accordionBtn, background:'white', border:'1px solid #bfdbfe', marginBottom:0}}
                >
                    <span style={{color:'#0369a1', display:'flex', alignItems:'center', gap:'10px'}}>👥 Gestión de Usuarios</span>
                    <span style={{fontSize:'0.8rem'}}>{expandUsers ? 'Menos' : 'Más'}</span>
                </button>
                
                {expandUsers && (
                    <div style={{paddingTop: '24px'}}>
                        <div style={{display:'flex', gap:'12px', marginBottom:'20px', flexDirection: 'column'}}>
                          <div style={{display:'flex', gap:'12px'}}>
                              <input style={{...styles.input, flex:2}} placeholder="Nombre" value={newUser.name} onChange={e=>setNewUser({...newUser, name:e.target.value})} />
                              <input style={{...styles.input, flex:1}} type="password" placeholder="PIN (6+)" value={newUser.pin} onChange={e=>setNewUser({...newUser, pin:e.target.value})} />
                          </div>
                          <select style={styles.select} value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})}>
                              <option value="checker">Checador</option>
                              <option value="supervisor">Supervisor</option>
                              <option value="admin">Admin</option>
                              <option value="masteradmin">Master Admin</option>
                          </select>
                        </div>
                        <button onClick={handleCreateUser} className="press-effect" style={{...styles.button, width:'100%', fontSize:'0.85rem'}}>CREAR USUARIO</button>

                        <div style={{marginTop:'30px', borderTop:'1px solid #bfdbfe', paddingTop:'20px'}}>
                          <p style={{fontSize:'0.75rem', color:'#0369a1', fontStyle:'italic', marginBottom:'15px'}}>* Lista de usuarios protegida.</p>
                          {users.map(u => (
                            <div key={u.id} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', fontSize:'0.9rem', borderBottom:'1px dashed #cbd5e1'}}>
                              <span style={{fontWeight:'500'}}>{u.name} <span style={{fontSize:'0.7rem', background:'#bae6fd', color:'#0369a1', padding:'3px 8px', borderRadius:'6px', marginLeft:'8px'}}>{u.role}</span></span>
                              <button onClick={()=>deleteItem('system_users', u.id)} style={{border:'none', background:'#fee2e2', color:'#ef4444', borderRadius:'8px', padding:'6px 12px', cursor:'pointer', fontWeight:'600'}}>Borrar</button>
                            </div>
                          ))}
                        </div>
                        <div style={{marginTop:'30px', borderTop:'2px solid #fecaca', paddingTop:'20px'}}>
                           <button onClick={handleWipeData} className="press-effect" style={{...styles.button, backgroundColor:'#dc2626', fontSize:'0.8rem', boxShadow:'0 4px 10px rgba(220, 38, 38, 0.4)'}}>⚠️ LIMPIAR BASE DE DATOS</button>
                        </div>
                    </div>
                )}
              </div>
            )}

            {currentAuth.isAuthenticated && (
              <>
                <div style={{...styles.card, opacity: isSupervisorOrHigher ? 1 : 0.8}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                     <h3 style={{margin:0, fontSize:'1.1rem'}}>📍 Zonas / Bancos</h3>
                     {!isSupervisorOrHigher && <span style={{fontSize:'0.65rem', background:'#f1f5f9', padding:'4px 8px', borderRadius:'6px', color:'#64748b'}}>Solo Lectura</span>}
                  </div>
                  {isSupervisorOrHigher && (
                      <div style={{display:'flex', gap:'12px', marginBottom:'20px'}}>
                        <input style={{...styles.input, flex:2}} placeholder="Nombre Zona" value={newLocation.name} onChange={e=>setNewLocation({...newLocation, name:e.target.value})} />
                        <input style={{...styles.input, flex:1}} placeholder="C.C." value={newLocation.cc} onChange={e=>setNewLocation({...newLocation, cc:e.target.value})} />
                        <button onClick={handleAddLocation} className="press-effect" style={{...styles.button, width:'auto', padding:'0 24px'}}>+</button>
                      </div>
                  )}
                  <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    {locations.map(l => (
                        <div key={l.id} style={styles.rowCard}>
                            <span style={{fontWeight:'600'}}>{l.name} <span style={{fontSize:'0.75rem', color:'#64748b', fontWeight:'400'}}>({l.cc || 'S/N'})</span></span> 
                            {isAdminOrMaster && <button onClick={()=>deleteItem('locations', l.id)} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer', padding:'4px'}}><Icons.Trash/></button>}
                        </div>
                    ))}
                  </div>
                </div>

                <div style={{...styles.card}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
                    <h3 style={{margin:0, fontSize:'1.1rem'}}>🚛 Flotilla</h3>
                    {!isAdminOrMaster && <span style={{fontSize:'0.65rem', background:'#f1f5f9', padding:'4px 8px', borderRadius:'6px', color:'#64748b'}}>Solo Lectura</span>}
                  </div>
                  
                  {isAdminOrMaster && (
                    <div style={{marginBottom:'24px'}}>
                        {/* MENÚ DESPLEGABLE: AGREGAR CAMIÓN */}
                        <button 
                            onClick={() => setExpandAddTruck(!expandAddTruck)} 
                            className="press-effect"
                            style={{...styles.accordionBtn, backgroundColor: '#f0fdf4', color: '#166534', border:'1px solid #bbf7d0', marginBottom:'12px'}}
                        >
                            <span>➕ Agregar Nuevo Camión</span>
                            <span style={{fontSize:'0.8rem'}}>{expandAddTruck ? 'Menos' : 'Más'}</span>
                        </button>

                        {expandAddTruck && (
                            <div style={{padding: '24px', border: '1px solid #bbf7d0', borderRadius: '24px', marginTop: '12px', background:'#f0fdf4'}}>
                                <div style={{display:'flex', gap:'12px', marginBottom:'16px'}}>
                                    <input style={{...styles.input, textTransform:'uppercase'}} placeholder="PLACAS" value={newTruck.placas} onChange={e=>setNewTruck({...newTruck, placas:e.target.value})} />
                                    <input 
                                        style={styles.input} 
                                        type="number" 
                                        placeholder="Capacidad (m3)" 
                                        value={newTruck.capacidad} 
                                        onChange={e=>setNewTruck({...newTruck, capacidad:e.target.value})} 
                                    />
                                </div>
                                <input style={{...styles.input, marginBottom:'20px'}} placeholder="Proveedor / Sindicato" value={newTruck.agrupacion} onChange={e=>setNewTruck({...newTruck, agrupacion:e.target.value})} />
                                <button onClick={handleAddTruck} className="press-effect" style={{...styles.button, background:'#16a34a', boxShadow:'0 4px 10px rgba(22, 163, 74, 0.4)'}}>GUARDAR CAMIÓN</button>
                            </div>
                        )}
                    </div>
                  )}
                  
                  {/* MENÚ DESPLEGABLE: LISTA CAMIONES */}
                  <button 
                        onClick={() => setExpandTruckList(!expandTruckList)} 
                        className="press-effect"
                        style={styles.accordionBtn}
                    >
                        <span>📋 Ver Lista de Camiones ({trucks.length})</span>
                        <span style={{fontSize:'0.8rem'}}>{expandTruckList ? 'Menos' : 'Más'}</span>
                  </button>

                  {expandTruckList && (
                      <div style={{marginTop:'16px', maxHeight: '450px', overflowY: 'auto', paddingRight:'4px'}}>
                        {trucks.map(t => (
                          <div key={t.id} style={styles.rowCard}>
                            <div>
                                <div style={{fontWeight:'800', fontSize:'1rem', color:'#1e293b'}}>{t.placas}</div>
                                <div style={{fontSize:'0.75rem', color:'#64748b', marginTop:'4px'}}>{t.capacidad} m³ • {t.agrupacion}</div>
                            </div>
                            <div style={{display:'flex', gap:'12px'}}>
                               <button onClick={()=>setShowQRModal(t)} className="press-effect" style={{background:'white', border:'1px solid #cbd5e1', borderRadius:'12px', width:'42px', height:'42px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>🏁</button>
                               {isAdminOrMaster && <button onClick={()=>deleteItem('trucks', t.id)} style={{background:'#fef2f2', border:'none', color:'#ef4444', borderRadius:'12px', width:'42px', height:'42px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><Icons.Trash/></button>}
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
             <button onClick={()=>setShowQRModal(null)} style={{...styles.closeBtn, top:'24px', right:'24px'}} className="no-print">×</button>
             
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
                <button onClick={()=>setShowQRModal(null)} className="press-effect" style={{...styles.button, width:'200px', fontSize:'1rem', backgroundColor:'#ef4444', borderRadius:'12px'}}>CERRAR</button>
                <button onClick={()=>window.print()} className="press-effect" style={{...styles.button, width:'200px', fontSize:'1rem', background:'#1e293b', borderRadius:'12px'}}>🖨️ IMPRIMIR</button>
             </div>
          </div>
        </div>
      )}
      {scanSuccess && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{fontSize:'5rem', marginBottom:'16px'}}>✅</div>
            <h2 style={{margin:'0 0 12px 0', color:'#166534', fontSize:'1.8rem'}}>¡REGISTRADO!</h2>
            <p style={{fontSize:'1.3rem', margin:'0 0 30px 0', color:'#334155'}}><b>{scanSuccess.truck.placas}</b><br/><span style={{fontSize:'1rem', color:'#64748b'}}>en {scanSuccess.location.name}</span></p>
            <button onClick={()=>setScanSuccess(null)} className="press-effect" style={{...styles.button, background:'#16a34a', boxShadow:'0 10px 20px -5px rgba(22, 163, 74, 0.4)'}}>CONTINUAR</button>
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