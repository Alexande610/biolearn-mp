import { useEffect,useState } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { bossFeatureEnabled,bossRpc,bossUrl,formatBossTime,remainingSeconds } from '../lib/bossBattle';
import './bossBattle.css';

export default function BossEncounterNotice() {
  const {user}=useAuth(); const location=useLocation();const navigate=useNavigate();
  const [encounters,setEncounters]=useState([]);const [expanded,setExpanded]=useState(false);
  const [now,setNow]=useState(()=>Date.now());const [clockOffset,setClockOffset]=useState(0);
  const [owner,setOwner]=useState('');
  useEffect(()=>{
    if(!bossFeatureEnabled || !user || user.role!=='student') return;
    let active=true;
    const refresh=async()=>{try {
      const data=await bossRpc('boss_list_encounters');
      if(active && Array.isArray(data)) {setOwner(user.id);setEncounters(data);if(data[0])setClockOffset(Date.parse(data[0].serverNow)-Date.now());}
    }catch{/* A temporary failure must not interrupt normal games. */}};
    const onEncounter=event=>{setOwner(user.id);setEncounters(prev=>[event.detail,...prev.filter(e=>e.id!==event.detail.id)]);setExpanded(true);
      setClockOffset(Date.parse(event.detail.serverNow)-Date.now());};
    refresh();const poll=setInterval(refresh,15000);const clock=setInterval(()=>setNow(Date.now()),1000);
    window.addEventListener('boss-encounter',onEncounter);
    return()=>{active=false;clearInterval(poll);clearInterval(clock);window.removeEventListener('boss-encounter',onEncounter);};
  },[user]);
  const e=encounters.find(item=>item.status==='active' || remainingSeconds(item.expiresAt,now+clockOffset)>0);
  if(!e || location.pathname.startsWith('/boss') || !user || owner!==user.id) return null;
  const seconds=remainingSeconds(e.expiresAt,now+clockOffset);
  return <aside className={`boss-notice ${expanded?'is-expanded':''}`} aria-live="polite">
    <div className="boss-notice-icon">🦠</div><div className="boss-notice-body">
      <strong>{e.status==='active'?'Trận boss đang diễn ra':'Boss đã xuất hiện!'}</strong>
      <span>{e.title}</span>
      {expanded && <p>{e.finalChance?'Cơ hội cuối của bài này. ':''}Chinh phục để nhận 1000 XP và 500 vàng. {e.status==='offered'?'Bạn có thể đổi ý trong thời hạn lời mời.':''}</p>}
    </div>
    <span className="boss-notice-time">{e.status==='offered'?formatBossTime(seconds):'Đang chơi'}</span>
    <button className="boss-button" onClick={()=>navigate(bossUrl(e))}>{e.status==='active'?'Tiếp tục':'Chinh phục'}</button>
    <button className="boss-button ghost" onClick={()=>setExpanded(!expanded)}>{expanded?'Để sau':'Chi tiết'}</button>
  </aside>;
}
