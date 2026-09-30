import {useCallback,useEffect,useRef,useState} from 'react';
import {useNavigate,useParams,useSearchParams} from 'react-router-dom';
import {ArrowLeft,Heart,Shield,Lightbulb,Timer,Swords,Trophy,FlaskConical,ChevronRight} from 'lucide-react';
import {useAuth} from '../hooks/useAuth';
import {bossRpc,formatBossTime,remainingSeconds} from '../lib/bossBattle';
import BossArena from '../components/BossArena';
import {JUMP_COOLDOWN_MS} from '../utils/bossMotion';
import '../components/bossBattle.css';
const items=[
 [Swords,'Vũ khí sinh học','Nhặt vũ khí để mở câu hỏi. Câu đúng gây 10 sát thương; cần 10 đòn đúng để hạ boss.'],
 [Lightbulb,'Gợi ý','Nhặt ánh sáng vàng rồi dùng cho câu khó. Mỗi lần dùng tiêu hao một gợi ý.'],
 [FlaskConical,'Bình hồi máu','Hồi một tim đã mất. Đủ ba tim thì không tăng hoặc dự trữ thêm mạng.'],
 [Shield,'Khiên bảo vệ','Chặn một va chạm hoặc đòn boss trên đường rồi mất. Không cộng dồn; không chặn phản công khi trả lời sai.']
];
const reasons={no_hearts:'Bạn đã hết tim.',time_expired:'Thời gian chiến đấu đã hết.',abandoned:'Bạn đã rời trận chiến.',questions_exhausted:'Bạn chưa hạ boss trong bộ câu hỏi của trận.',offer_expired:'Lời mời đã hết hạn.'};
export default function BossBattleV2Page({previewAdapter}){
 const {classId,chapterId,lessonId}=useParams();const [search]=useSearchParams();const navigate=useNavigate();const {updateStats}=useAuth();
 const [s,setS]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [now,setNow]=useState(()=>Date.now()),[offset,setOffset]=useState(0),[answer,setAnswer]=useState(null);
 const current=useRef(null),inFlight=useRef(false),alive=useRef(true),refreshed=useRef(null);
 const queued=useRef([]);
 const [jumpCue,setJumpCue]=useState(null);
 const lastLocalJump=useRef(-Infinity);
 const questionDialog=useRef(null);
 useEffect(()=>{
  if(!s?.question?.id)return;
  const previous=document.activeElement;
  questionDialog.current?.focus();
  return()=>{if(previous?.isConnected)previous.focus();};
 },[s?.question?.id]);
 const invoke=useCallback((name,args)=>import.meta.env.DEV&&previewAdapter?previewAdapter(name,args):bossRpc(name,args),[previewAdapter]);
 const accept=useCallback(data=>{if(!data||!alive.current)return;
  if(current.current?.id===data.id&&Date.parse(data.serverNow)<Date.parse(current.current.serverNow))return;
  if(current.current?.question?.id!==data.question?.id)setAnswer(null);
  current.current=data;setS(data);setOffset(Date.parse(data.serverNow)-Date.now());},[]);
 const encounterId=search.get('encounter');
 useEffect(()=>{
  alive.current=true;current.current=null;let cancelled=false;
  Promise.resolve().then(()=>{if(cancelled)return null;setLoading(true);setError('');setS(null);
   return invoke('boss_get_encounter',{p_class_id:Number(classId),p_chapter_id:Number(chapterId),p_lesson_id:Number(lessonId)});})
   .then(data=>{if(cancelled)return;const e=data?.encounter;
    if(!e||(encounterId&&encounterId!==e.id))setError('Không có lời mời boss hợp lệ. Hãy kết thúc một ải của bài để tìm boss.');else accept(e);})
   .catch(e=>{if(!cancelled)setError(e.message);}).finally(()=>{if(!cancelled)setLoading(false);});
  return()=>{cancelled=true;alive.current=false;queued.current=[];};
 },[classId,chapterId,lessonId,encounterId,accept,invoke]);
 const act=useCallback(async function perform(action,extra={}){
  if(!current.current)return;
  if(inFlight.current){if(action!=='tick'&&queued.current.length<8)queued.current.push([action,extra]);return;}
  inFlight.current=true;if(action!=='tick')setBusy(true);
  try{const data=await invoke('boss_action',{p_encounter_id:current.current.id,p_action:action,...extra});
   if(!data)throw Error('Trận chưa sẵn sàng.');if(alive.current){setError('');accept(data);}}
  catch(e){if(alive.current)setError('Kết nối bị gián đoạn. '+e.message);}
  finally{inFlight.current=false;if(alive.current){setBusy(false);const next=queued.current.shift();if(next)queueMicrotask(()=>perform(...next));}}
 },[accept,invoke]);
 const requestJump=useCallback(()=>{
  const snap=current.current,at=performance.now();
  if(snap?.status!=='active'||snap.question||at-lastLocalJump.current<JUMP_COOLDOWN_MS)return;
  lastLocalJump.current=at;setJumpCue({at});
  // Jump takes its own request lane: a slow polling request must not queue input.
  invoke('boss_action',{p_encounter_id:snap.id,p_action:'jump'})
   .then(data=>{if(!data)throw Error('Trận chưa sẵn sàng.');if(current.current?.id===snap.id)accept(data);})
   .catch(e=>{if(alive.current&&current.current?.id===snap.id)setError('Kết nối khi nhảy bị gián đoạn. '+e.message);});
 },[accept,invoke]);
 useEffect(()=>{
  const clock=setInterval(()=>setNow(Date.now()),250);
  const poll=setInterval(()=>{const snap=current.current;
   if(snap?.status==='active')act('tick');
   else if(snap?.status==='offered'&&remainingSeconds(snap.expiresAt,Date.now()+offset)===0)
    invoke('boss_get_encounter',{p_class_id:Number(classId),p_chapter_id:Number(chapterId),p_lesson_id:Number(lessonId)}).then(data=>accept(data?.encounter)).catch(()=>{});
  },750);
  return()=>{clearInterval(clock);clearInterval(poll);};
 },[act,accept,classId,chapterId,lessonId,offset,invoke]);
 useEffect(()=>{const key=e=>{if((e.code==='Space'||e.code==='ArrowUp')&&!e.repeat&&current.current?.status==='active'&&!current.current?.question){e.preventDefault();requestJump();}};
  window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[requestJump]);
 useEffect(()=>{if(s?.status==='won'&&refreshed.current!==s.id){refreshed.current=s.id;updateStats?.();}},[s,updateStats]);
 const back=()=>navigate(`/map/${classId}`);
 const start=async()=>{if(inFlight.current)return;inFlight.current=true;setBusy(true);
  try{const data=await invoke('boss_start_encounter',{p_encounter_id:s.id});if(!data)throw Error('Trận chưa sẵn sàng.');accept(data);setError('');}
  catch(e){setError(e.message);}finally{inFlight.current=false;setBusy(false);}};
 const time=remainingSeconds(s?.status==='offered'?s?.expiresAt:s?.deadline,now+offset);
 const finished=s&&['won','failed','expired'].includes(s.status);
 return <div className={`boss-page ${s?.status==='active'?'boss-page-playing':''}`}><header className="boss-header">
  <button className="boss-icon-button" aria-label="Quay về bản đồ" onClick={back}><ArrowLeft size={21}/></button>
  <div><span className="boss-eyebrow">BIOQUEST / BOSS BATTLE</span><h1>{s?.title||'Cuộc chạm trán sinh học'}</h1></div><span className="boss-header-badge">LỚP 6</span></header>
  <main className="boss-main">{loading?<div className="boss-loading">Đang xác minh lời mời boss…</div>:!s?<section className="boss-empty"><Shield size={48}/><h2>Chưa có cuộc chạm trán</h2><p>{error}</p><button className="boss-button" onClick={back}>Về bản đồ</button></section>:<>
   {error&&<div className="boss-error" role="alert">{error} Thời hạn vẫn chạy; trận sẽ đồng bộ khi có kết nối.</div>}
   {s.status==='offered'&&<section className="boss-intro"><div className="boss-intro-copy">
    <span className="boss-eyebrow">{s.finalChance?'CƠ HỘI CUỐI CỦA BÀI':'MỘT THỬ THÁCH ĐÃ XUẤT HIỆN'}</span><h2>Kiến thức là<br/><em>vũ khí của bạn.</em></h2>
    <p>Vượt đường chạy sinh học, né chướng ngại và đánh bại boss bằng kiến thức của bài vừa học.</p>
    <div className="boss-intro-stats"><span><Heart/>3 tim</span><span><Swords/>100 HP boss</span><span><Timer/>{Math.round((s.battleSeconds||480)/60)} phút</span></div>
    <div className="boss-prize"><Trophy/><div><strong>1000 XP <span>+ 500 vàng</span></strong><small>{s.preview?'Phần thưởng bản chính thức; chế độ thử không cộng thưởng.':'Chỉ nhận khi thắng, tối đa một lần mỗi bài.'}</small></div></div>
    {s.preview&&<p className="boss-control-guide">Bạn đang chơi bản thử nghiệm. Không cộng XP hoặc vàng thật.</p>}
    <div className="boss-offer-time">Lời mời còn <strong>{formatBossTime(time)}</strong> · Đồng hồ trận bắt đầu khi vào chơi.</div>
    <button className="boss-button primary" disabled={busy||time===0} onClick={start}>Sẵn sàng chinh phục <ChevronRight size={19}/></button>
    <button className="boss-button ghost" onClick={back}>Để sau — lời mời vẫn còn trong thời hạn</button>
   </div><div className="boss-intro-guide"><BossArena snapshot={s} onJump={()=>{}} busy/>
    <h3>Hành trang trước trận</h3><div className="boss-items">{items.map(item=>{const [Icon,title,text]=item;return <article key={title}><Icon/><div><h4>{title}</h4><p>{text}</p></div></article>;})}</div>
    <p className="boss-control-guide"><strong>Điều khiển:</strong> Space / ↑ hoặc chạm đường chạy để nhảy. Đường chạy tạm dừng khi đọc câu hỏi; đồng hồ trận vẫn chạy. Hết tim hoặc hết giờ là thua.</p>
    <p className="boss-control-guide">{s.repeatTest?'Chế độ tài khoản thử: kết thúc bất kỳ ải nào của 10 bài lớp 6 đều có boss. Có thể chơi lại sau khi thắng, thua hoặc hết hạn; không nhận thưởng thật.':s.finalChance?'Thắng, thua hoặc hết hạn lời mời này sẽ đóng cơ hội boss của bài.':'Nếu thua, hãy kết thúc một ải khác để có cơ hội gặp lại. Boss đã thắng không xuất hiện lại.'}</p>
   </div></section>}
   {s.status==='active'&&<><div className="boss-hud"><div className="boss-hearts" aria-label={`${s.hearts} tim`}>{[0,1,2].map(n=><Heart key={n} className={n<s.hearts?'full':''}/>)}</div>
    <div className="boss-hp"><div><span>MÁU BOSS</span><strong>{s.bossHp}/100</strong></div><div className="boss-hp-track"><i style={{width:`${s.bossHp}%`}}/></div></div>
    <div className={`boss-clock ${time<60?'urgent':''}`}><Timer size={18}/>{formatBossTime(time)}</div></div>
    <BossArena snapshot={s} jumpCue={jumpCue} busy={Boolean(s.question)} onJump={requestJump}/>
    <div className="boss-inventory"><span className={s.shield?'charged':''}><Shield/>{s.shield?'Khiên sẵn sàng':'Chưa có khiên'}</span><span><Lightbulb/>{s.hints} gợi ý</span><span><Swords/>{10-s.bossHp/10}/10 đòn đúng</span><button className="boss-button" disabled={Boolean(s.question)} onClick={requestJump}>Nhảy / Né</button></div>
    {s.question?<div className="boss-question-overlay"><section className="boss-question" key={s.question.id} ref={questionDialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="boss-question-title" onKeyDown={e=>{
     if(e.key!=='Tab')return;const controls=[...e.currentTarget.querySelectorAll('button:not(:disabled)')];
     const first=controls[0],last=controls.at(-1);
     if(!first){e.preventDefault();return;}
     if(e.shiftKey&&(document.activeElement===first||document.activeElement===e.currentTarget)){e.preventDefault();last.focus();}
     else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===e.currentTarget)){e.preventDefault();first.focus();}
    }}><span className="boss-eyebrow">ĐÃ NHẶT VŨ KHÍ • TẤN CÔNG BẰNG KIẾN THỨC</span><h2 id="boss-question-title">{s.question.question}</h2>
     <div className="boss-options">{s.question.options.map((text,index)=><button key={index} className={answer===index?'selected':''} disabled={busy} onClick={()=>setAnswer(index)}><b>{String.fromCharCode(65+index)}</b>{text}</button>)}</div>
     {s.question.hint&&<div className="boss-hint"><Lightbulb size={18}/>{s.question.hint}</div>}
     <div className="boss-question-actions"><button className="boss-button ghost" disabled={busy||s.hints<1||Boolean(s.question.hint)} onClick={()=>act('hint',{p_question_id:s.question.id})}><Lightbulb size={17}/>Dùng gợi ý ({s.hints})</button>
      <button className="boss-button primary" disabled={busy||answer===null} onClick={()=>act('answer',{p_question_id:s.question.id,p_answer:answer})}><Swords size={18}/>Tấn công</button></div><p className="boss-rule-note">Sai đáp án mất một tim. Khiên không chặn đòn phản công này.</p>
    </section></div>:<div className="boss-runner-tip" aria-live="polite">{s.feedback?.kind==='correct'?`Đánh trúng! −10 HP boss. ${s.feedback.explanation}`:s.feedback?.kind==='wrong'?`Sai đáp án: mất 1 tim. ${s.feedback.explanation}`:s.feedback?.kind==='shield_block'?'Khiên đã chặn đòn và tiêu hao.':s.feedback?.kind==='hazard_hit'?'Va chạm! Bạn mất một tim.':'Quan sát chướng ngại phía trước. Nhặt vũ khí để mở câu hỏi tấn công.'}</div>}
   </>}
   {finished&&<section className={`boss-result ${s.status==='won'?'won':''}`}><div className="boss-result-icon">{s.status==='won'?<Trophy size={58}/>:<Heart size={58}/>}</div>
    <span className="boss-eyebrow">{s.status==='won'?'BOSS ĐÃ BỊ ĐÁNH BẠI':'CUỘC CHẠM TRÁN KẾT THÚC'}</span><h2>{s.status==='won'?'Kiến thức chiến thắng!':s.status==='expired'?'Bạn đã bỏ lỡ lời mời':'Chưa thể chinh phục'}</h2>
    <p>{s.status==='won'?'Bạn đã tung đủ 10 đòn đúng để hạ boss.':reasons[s.reason]||'Cuộc gặp này đã kết thúc.'}</p>
    {s.status==='won'?s.reward?.awarded?<div className="boss-result-reward"><strong>+1000 XP</strong><strong>+500 vàng</strong><small>Phần thưởng đã được lưu.</small></div>:<p>{s.reward?.preview?s.repeatTest?'Bản thử nghiệm: không cộng XP hoặc vàng thật. Kết thúc lại bất kỳ ải nào để gặp boss mới.':'Bản thử nghiệm: không cộng XP hoặc vàng thật.':'Không cộng thêm thưởng cho sự kiện đã ghi nhận.'}</p>:<><strong className="boss-zero-reward">0 XP · 0 vàng</strong><p>{s.repeatTest?'Chế độ thử: kết thúc lại bất kỳ ải nào để gặp boss mới, kể cả ải đã chơi.':s.finalChance?'Cơ hội boss của bài đã đóng. Hãy tìm boss ở bài mới.':'Kết thúc một ải khác trong bài để có cơ hội gặp lại boss.'}</p></>}
    <button className="boss-button primary" onClick={back}>Trở về bản đồ <ChevronRight size={18}/></button></section>}
  </>}</main></div>;
}
