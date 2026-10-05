const SUPABASE_URL = 'https://gejzlucmikzghyccpxub.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CqvOKqXTSVG1xBwl7tqIVw_rBKDuKVm';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);



const KEY='winterArc2026v3',START='2026-10-01',END='2026-12-31',TOTAL=92,WATER=4;
const habits=[['workout','Workout','Warm-up • training • cool-down','◆'],['steps','5K or 10K steps','Hit your step target','↗'],['diet','Clean diet','Stay aligned with nutrition','◈'],['water','4L water','Fixed daily hydration target','◉'],['sleep','7h+ sleep','Minimum 7 hours','☾'],['learn','Read / Learn','Save a key takeaway','✦'],['alcohol','No alcohol until end','Protect the streak','○'],['distractions','No distractions','Keep attention on the mission','◎']];
const quotes=['You do not need motivation. You need a standard.','Small promises kept daily become a different life.','Discipline today. Freedom tomorrow.','Make today’s version of you proud of tomorrow’s.','The goal is not perfection. The goal is returning to the plan.'];
const warm=[['Jumping jacks','60 sec'],['Arm circles + shoulder rotations','60 sec'],['Hip rotations','45 sec'],['Dynamic leg swings','45 sec / side']];
const cool=[['Chest & shoulder stretch','30 sec / side'],['Hamstring stretch','30 sec / side'],['Hip-flexor stretch','30 sec / side'],['Slow breathing','60 sec']];
const plans=[
{name:'UPPER BODY',focus:'Chest • back • shoulders • arms',items:[['Push-ups','3 × 8–15'],['Dumbbell floor press','3 × 10–12'],['One-arm dumbbell row','3 × 10 / side'],['Dumbbell shoulder press','3 × 10'],['Biceps curl','3 × 12'],['Overhead triceps extension','3 × 12']]},
{name:'LOWER + CORE',focus:'Legs • glutes • core',items:[['Goblet squat','3 × 12'],['Reverse lunges','3 × 10 / side'],['Dumbbell Romanian deadlift','3 × 12'],['Glute bridge','3 × 15'],['Plank','3 × 40 sec'],['Mountain climbers','3 × 20']]},
{name:'FULL BODY',focus:'Strength • conditioning',items:[['Bodyweight squat','3 × 15'],['Push-ups','3 × 8–15'],['Bent-over dumbbell row','3 × 12'],['Dumbbell shoulder press','3 × 10'],['Burpees','3 × 8'],['Plank','3 × 45 sec']]},
{name:'RECOVERY',focus:'Mobility • easy movement',items:[['Cat-cow','2 × 10'],['World’s greatest stretch','2 × 5 / side'],['Bird dog','2 × 10 / side'],['Bodyweight squat','2 × 12'],['Easy walk','15–20 min']]}];

let state=fresh();
let currentUser=null;
let saveQueue=Promise.resolve();
let authMode='login';

function fresh(){return{profile:{name:'',age:25,sex:'male',height:170,weight:70,activity:1.55,goal:'lose',steps:10000},days:{},settings:{notify:false}}}

function cloneState(x){return JSON.parse(JSON.stringify(x))}

function save(){
  if(!currentUser)return Promise.resolve();
  const snapshot=cloneState(state);
  saveQueue=saveQueue.then(async()=>{
    const {error}=await db.from('challenge_data').upsert(
      {user_id:currentUser.id,data:snapshot,updated_at:new Date().toISOString()},
      {onConflict:'user_id'}
    );
    if(error)throw error;
  }).catch(err=>{
    console.error('Save failed:',err);
    toast('Could not save progress');
  });
  return saveQueue;
}

async function loadUserData(){
  const {data,error}=await db.from('challenge_data').select('data').eq('user_id',currentUser.id).maybeSingle();
  if(error)throw error;
  if(data?.data){
    state=data.data;
    if(!state.profile)state.profile=fresh().profile;
    if(!state.days)state.days={};
    if(!state.settings)state.settings={notify:false};
  }else{
    state=fresh();
    const {error:insertError}=await db.from('challenge_data').insert({user_id:currentUser.id,data:state});
        if(insertError)throw insertError;
  }
}

function normalizeUsername(value){return value.trim().toLowerCase()}
function validUsername(u){return /^[a-z0-9._-]{3,20}$/.test(u)}
function usernameEmail(u){return `${u}@winterarc.invalid`}
function validPassword(p){return p.length>=8&&/[a-z]/.test(p)&&/[A-Z]/.test(p)&&/\d/.test(p)&&/[^A-Za-z0-9]/.test(p)}

function setAuthMessage(msg,good=false){
  const el=document.getElementById('authMessage');
  el.textContent=msg||'';
  el.style.color=good?'var(--green)':'var(--red)';
}

function setAuthMode(mode){
  authMode=mode;
  const signup=mode==='signup';
  document.getElementById('authTitle').textContent=signup?'Create your account':'Welcome back';
  document.getElementById('authSubtitle').textContent='ENTER THE ARC, EARN THE EXIT.';
  document.getElementById('confirmPasswordLabel').hidden=!signup;
  document.getElementById('authSubmit').textContent=signup?'Create account':'Sign in';
  document.getElementById('authSwitch').textContent=signup?'Already have an account? Sign in':'New here? Create account';
  document.getElementById('authPassword').autocomplete=signup?'new-password':'current-password';
  document.getElementById('authConfirmPassword').value='';
  setAuthMessage('');
}

function showAuth(){
  document.getElementById('authScreen').hidden=false;
}

function hideAuth(){
  document.getElementById('authScreen').hidden=true;
}

function setAuthBusy(busy){
  const submit=document.getElementById('authSubmit');
  const sw=document.getElementById('authSwitch');
  submit.disabled=busy;
  sw.disabled=busy;
  submit.textContent=busy?(authMode==='signup'?'Creating account…':'Signing in…'):(authMode==='signup'?'Create account':'Sign in');
}

async function enterApp(user){
  currentUser=user;
  await loadUserData();
  hideAuth();
  renderAll();
}

async function handleAuthSubmit(){
  const username=normalizeUsername(document.getElementById('authUsername').value);
  const password=document.getElementById('authPassword').value;
  const confirmPassword=document.getElementById('authConfirmPassword').value;
    if(!validUsername(username))return setAuthMessage('Username: 3–20 characters using letters, numbers, dot, _ or -.');
  if(authMode==='signup'){
    if(!validPassword(password))return setAuthMessage('Password needs 8+ characters with uppercase, lowercase, number and symbol.');
    if(password!==confirmPassword)return setAuthMessage('Passwords do not match.');
  }else if(!password){
    return setAuthMessage('Enter your password.');
  }

  setAuthBusy(true);
  setAuthMessage('');

  try{
    const email=usernameEmail(username);

    if(authMode==='signup'){
      const {data,error}=await db.auth.signUp({email,password});
      if(error)throw error;
      if(!data.user)throw new Error('Account could not be created.');
      if(!data.session)throw new Error('Account created, but automatic sign-in is unavailable. Check that Confirm Email is turned off.');

      currentUser=data.user;

      const {error:profileError}=await db.from('profiles').insert({id:currentUser.id,username});
      if(profileError){
        await db.auth.signOut();
        currentUser=null;
        if(profileError.code==='23505')throw new Error('That username is unavailable.');
        throw profileError;
      }

      state=fresh();
      const {error:dataError}=await db.from('challenge_data').insert({user_id:currentUser.id,data:state});
      if(dataError)throw dataError;

      hideAuth();
      renderAll();
      toast('Account created ✓');
    }else{
      const {data,error}=await db.auth.signInWithPassword({email,password});
      if(error)throw new Error('Incorrect username or password.');
      await enterApp(data.user);
      toast('Welcome back ✓');
    }
  }catch(err){
    console.error(err);
    setAuthMessage(err.message||'Something went wrong. Please try again.');
  }finally{
    setAuthBusy(false);
  }
}

async function logout(){
  try{
        await saveQueue;
    const {error}=await db.auth.signOut();
    if(error)throw error;
  }catch(err){
    console.error(err);
    toast('Could not sign out');
    return;
  }
  currentUser=null;
  state=fresh();
  document.getElementById('authPassword').value='';
  document.getElementById('authConfirmPassword').value='';
  setAuthMode('login');
  showAuth();
}

function addLogoutButton(){
  if(document.getElementById('logoutBtn'))return;
  const reset=document.getElementById('resetBtn');
  const btn=document.createElement('button');
  btn.id='logoutBtn';
  btn.className='ghost full';
  btn.textContent='Log out';
  btn.style.marginTop='10px';
  btn.onclick=logout;
  reset.insertAdjacentElement('afterend',btn);
}

async function initAuth(){
  addLogoutButton();
  document.getElementById('authSwitch').onclick=()=>setAuthMode(authMode==='login'?'signup':'login');
  document.getElementById('authSubmit').onclick=handleAuthSubmit;
  document.getElementById('authPassword').addEventListener('keydown',e=>{if(e.key==='Enter')handleAuthSubmit()});
  document.getElementById('authConfirmPassword').addEventListener('keydown',e=>{if(e.key==='Enter')handleAuthSubmit()});

  try{
    const {data,error}=await db.auth.getSession();
    if(error)throw error;
    if(data.session?.user){
      await enterApp(data.session.user);
    }else{
      showAuth();
    }
  }catch(err){
    console.error(err);
    showAuth();
    setAuthMessage('Could not connect to Winter ARC. Check your connection and Supabase settings.');
  }
}

function iso(d){const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,'0');const day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;}
function todayKey(){return iso(new Date());}



function dateObj(k){const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d);}
function challengeKey(i){const d=dateObj(START);d.setDate(d.getDate()+(i-1));return iso(d);}
function dayIndex(k=todayKey()){const start=Date.UTC(2026,9,1);const [y,m,d]=k.split('-').map(Number);return Math.floor((Date.UTC(y,m-1,d)-start)/86400000)+1;}
function activeKey(){const k=todayKey();if(k<START)return START;if(k>END)return END;return k;}
function currentDay(){return Math.max(1,Math.min(TOTAL,dayIndex(activeKey())));}
function rec(k=activeKey()){if(!state.days[k])state.days[k]={habits:{},steps:0,stepLog:[],water:0,waterLog:[],workout:{warm:{},main:{},cool:{},complete:false},nutrition:{},learn:{},sleep:null};return state.days[k]}
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function fmt(n){return Number(n||0).toLocaleString('en-IN')}
function toast(t){const e=document.getElementById('toast');e.textContent=t;e.classList.add('show');clearTimeout(window.__t);window.__t=setTimeout(()=>e.classList.remove('show'),2200)}
function statusFor(id,k=activeKey()){const r=rec(k),v=r.habits[id];if(v==='done')return'done';if(v==='missed')return'missed';if(id==='steps'&&r.steps>=state.profile.steps)return'done';if(id==='water'&&r.water>=WATER)return'done';if(id==='workout'&&r.workout.complete)return'done';if(id==='learn'&&r.learn.text)return'done';if(id==='sleep'&&r.sleep!=null&&r.sleep>=7)return'done';return'pending'}
function completion(k){return habits.filter(h=>statusFor(h[0],k)==='done').length}
function perfect(k){return completion(k)===8}
function past(k){return dateObj(k)<dateObj(todayKey())}
function setHabit(id,s='done',k=activeKey()){rec(k).habits[id]=s;save();renderAll()}
function cycleHabit(id){setHabit(id,statusFor(id)==='done'?'missed':'done')}
function showScreen(n){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id==='screen-'+n));document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.screen===n));window.scrollTo({top:0,behavior:'smooth'});renderAll()}
function stats(){let perfectDays=0,workouts=0,longest=0,run=0;for(let i=1;i<=TOTAL;i++){const k=challengeKey(i);if(perfect(k)){perfectDays++;run++;longest=Math.max(longest,run)}else if(past(k))run=0;if(statusFor('workout',k)==='done')workouts++}let current=0;let d=Math.min(TOTAL,Math.max(0,dayIndex(todayKey())));for(;d>=1&&perfect(challengeKey(d));d--)current++;return{perfectDays,workouts,longest,current}}
function renderHome(){const k=activeKey(),d=currentDay(),done=completion(k),pct=Math.round(done/8*100),r=rec(k),s=stats();document.getElementById('dayNo').textContent=d;document.getElementById('dateLabel').textContent=dateObj(k).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});document.getElementById('overallPct').textContent=pct+'%';document.getElementById('overallBar').style.width=pct+'%';document.getElementById('habitCount').textContent=done+'/8';document.getElementById('streak').textContent=s.current+' days';document.getElementById('longestStreak').textContent=s.longest;document.getElementById('daysCompleted').textContent=s.perfectDays+'/92';document.getElementById('workoutDays').textContent=s.workouts;document.getElementById('quote').textContent=quotes[(d-1)%quotes.length];document.getElementById('todaySummary').innerHTML=`<b>${done}/8 habits</b><span>Steps ${fmt(r.steps)}/${fmt(state.profile.steps)}</span><span>Water ${(r.water||0).toFixed(2)}/4L</span><span>Workout ${statusFor('workout')==='done'?'✓':'—'}</span>`;const list=document.getElementById('habitList');list.innerHTML='';habits.forEach(h=>{const st=statusFor(h[0]),e=document.createElement('div');e.className='habit '+(st==='done'?'done':'');e.innerHTML=`<div class="hicon">${h[3]}</div><div class="habit-main"><b>${h[1]}</b><small>${h[2]}</small></div><button>${st.toUpperCase()}</button>`;e.querySelector('button').onclick=()=>habitAction(h[0]);list.appendChild(e)});if(done===8&&!r.celebrated){r.celebrated=true;save();setTimeout(()=>openModal(`<span class="eyebrow">PERFECT DAY</span><h2>${'DAY '+d+' COMPLETE'} 🎉</h2><p>All 8 habits completed. Keep the streak alive 🔥</p>`),200)}}
function habitAction(id){if(['workout','steps'].includes(id))return showScreen('workout');if(id==='water')return showScreen('water');if(id==='learn')return showScreen('learn');if(id==='diet')return showScreen('nutrition');if(id==='sleep')return enterSleep();cycleHabit(id);toast(id+' updated')}

function enterSleep(){let k=activeKey();const r=rec(k);openModal(`<span class="eyebrow">MORNING CHECK-IN</span><h2>Last night's sleep</h2><p>Minimum 7 hours of sleep required.</p><label>Hours slept<input id="sleepModalIn" type="number" min="7" max="16" step=".25" value="${r.sleep??''}"></label><button class="primary full" id="saveSleep">Save sleep</button>`);document.getElementById('saveSleep').onclick=()=>{const v=Number(document.getElementById('sleepModalIn').value);if(!Number.isFinite(v)||v<7)return toast('Sleep must be at least 7 hours');r.sleep=v;r.habits.sleep='done';save();closeModal();renderAll();toast('Sleep saved ✓');};}
function planForDay(){const d=currentDay(),week=Math.floor((d-1)/7),idx=(d-1)%7;const map=[0,1,2,3,0,1,3],p=JSON.parse(JSON.stringify(plans[map[idx]]));const add=Math.min(2,Math.floor(week/4));p.phase=week<4?'FOUNDATION':week<8?'BUILD':'FINISH STRONG';p.items=p.items.map(x=>[x[0],x[1].replace(/^3 ×/,`${3+add} ×`)]);return p}
function videoLink(name){return 'https://www.youtube.com/results?search_query='+encodeURIComponent(name+' correct form tutorial')}
function renderWorkout(){const p=planForDay(),r=rec(),section=(title,key,items)=>`<div class="workout-section"><h4>${title}</h4>${items.map((x,i)=>`<div class="exercise"><div><b>${x[0]}</b><br><small>${x[1]}</small> · <a href="${videoLink(x[0])}" target="_blank" rel="noopener">How to do ↗</a></div><button class="check ${r.workout[key][i]?'on':''}" data-sec="${key}" data-ex="${i}">${r.workout[key][i]?'✓':'+'}</button></div>`).join('')}</div>`;document.getElementById('workoutBox').innerHTML=`<div class="workout-card"><span class="eyebrow">${p.phase} • DAY ${currentDay()}</span><h3>${p.name}</h3><p>${p.focus}</p>${section('1. PRE-WORKOUT WARM-UP','warm',warm)}${section('2. MAIN WORKOUT','main',p.items)}${section('3. POST-WORKOUT COOL-DOWN','cool',cool)}<button id="completeWorkout" class="primary full">${r.workout.complete?'Workout completed ✓':'Complete all sections'}</button></div>`;document.querySelectorAll('[data-sec]').forEach(b=>b.onclick=()=>{r.workout[b.dataset.sec][b.dataset.ex]=!r.workout[b.dataset.sec][b.dataset.ex];save();renderWorkout()});document.getElementById('completeWorkout').onclick=()=>{const all=[...Object.values(r.workout.warm),...Object.values(r.workout.main),...Object.values(r.workout.cool)].filter(Boolean).length;const need=warm.length+p.items.length+cool.length;if(all<need)return toast(`Complete all ${need} items first`);r.workout.complete=true;r.habits.workout='done';save();renderAll();toast('Workout complete!')};const target=state.profile.steps,steps=r.steps||0,pct=clamp(Math.round(steps/target*100),0,100);document.getElementById('stepTargetLabel').textContent=fmt(target)+' steps';document.getElementById('stepProgressText').textContent=`${fmt(steps)} / ${fmt(target)}`;document.getElementById('stepsRemaining').textContent=`${fmt(Math.max(0,target-steps))} remaining`;document.getElementById('stepPct').textContent=pct+'%';document.getElementById('stepRing').style.setProperty('--p',pct+'%');document.getElementById('stepsInput').value='';renderLog('stepLog',r.stepLog,'steps')}
function targets(){const p=state.profile,bmr=p.sex==='male'?10*p.weight+6.25*p.height-5*p.age+5:10*p.weight+6.25*p.height-5*p.age-161,tdee=bmr*p.activity,adj=p.goal==='lose'?-350:p.goal==='gain'?250:0,cal=Math.max(1200,Math.round(tdee+adj)),protein=Math.round(p.weight*(p.goal==='gain'?1.8:1.6)),fat=Math.round(p.weight*.8),carbs=Math.max(0,Math.round((cal-protein*4-fat*9)/4)),burn=Math.round(Math.max(150,Math.min(600,(p.activity-1.15)*500+(p.goal==='lose'?100:0))));return{cal,protein,fat,carbs,burn}}
function renderNutrition(){const t=targets(),r=rec();calTarget.textContent=fmt(t.cal);proteinTarget.textContent=t.protein;carbTarget.textContent=t.carbs;fatTarget.textContent=t.fat;burnTarget.textContent=t.burn;calIn.value=r.nutrition.cal||'';proteinIn.value=r.nutrition.protein||''}
function renderWater(){const r=rec(),l=Math.max(0,r.water||0),p=clamp(Math.round(l/WATER*100),0,100);waterText.textContent=l.toFixed(2)+' L logged';waterPct.textContent=p+'%';waterRing.style.setProperty('--p',p+'%');renderLog('waterLog',r.waterLog,'water')}
function renderLog(id,log,type){const el=document.getElementById(id);el.innerHTML=(log||[]).slice(-5).reverse().map((x,i)=>`<div><span>${x.amount>0?'+':''}${type==='water'?x.amount+' L':fmt(x.amount)+' steps'} · ${x.time}</span>${i===0?`<button data-undo="${type}">Undo</button>`:''}</div>`).join('');el.querySelector('[data-undo]')?.addEventListener('click',()=>undo(type))}
function undo(type){const r=rec();const log=type==='water'?r.waterLog:r.stepLog;const last=log.pop();if(!last)return;if(type==='water'){r.water=Math.max(0,r.water-last.amount);r.habits.water=r.water>=WATER?'done':'pending';}else{r.steps=Math.max(0,r.steps-last.amount);r.habits.steps=r.steps>=state.profile.steps?'done':'pending';}save();renderAll();toast('Last entry undone');}
function renderLearn(){const r=rec();learnText.value=r.learn.text||'';learnKey.value=r.learn.key||'';learnSaved.textContent=r.learn.saved?'Saved for today ✓':''}
function renderProgress(){const k=activeKey(),done=completion(k),s=stats();progressBig.textContent=Math.round(done/8*100)+'%';progressSub.textContent=`${done} of 8 habits completed today.`;progressStats.innerHTML=`<b>Perfect ${s.perfectDays}/92</b><span>Current streak ${s.current}</span><span>Longest ${s.longest}</span><span>Workouts ${s.workouts}</span>`;habitStats.innerHTML='';habits.forEach(h=>{let n=0;for(let i=1;i<=TOTAL;i++)if(statusFor(h[0],challengeKey(i))==='done')n++;habitStats.innerHTML+=`<div class="habit-stat"><div class="habit-stat-top"><b>${h[1]}</b><span>${n}/92</span></div><div class="bar"><i style="width:${Math.round(n/TOTAL*100)}%"></i></div></div>`});calendar.innerHTML='';
for(let i=1;i<=TOTAL;i++){const dk=challengeKey(i),e=document.createElement('button');let cls=perfect(dk)?'good':past(dk)?'bad':'';if(dk===todayKey())cls+=' today';e.className='day-cell '+cls;e.textContent=i;e.onclick=()=>showDay(dk,i);calendar.appendChild(e)}}
function showDay(k,i){const r=rec(k),done=completion(k),displayDay=dayIndex(k);openModal(`<span class="eyebrow">DAY ${displayDay}</span><h2>${dateObj(k).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</h2><p>${done}/8 habits completed.</p>${habits.map(h=>`<div class="history-item"><div><b>${h[1]}</b><small>${statusFor(h[0],k).toUpperCase()}${h[0]==='learn'&&r.learn.key?`<br>Key takeaway: ${escapeHtml(r.learn.key)}`:''}</small></div><span class="status-dot ${statusFor(h[0],k)==='done'?'good':past(k)?'bad':''}"></span></div>`).join('')}`)}
function renderHistory(){historyList.innerHTML='';let last=Math.min(TOTAL,Math.max(0,dayIndex(todayKey())));for(let i=last;i>=1;i--){const k=challengeKey(i),e=document.createElement('button');e.className='history-item';e.innerHTML=`<div><b>Day ${i}</b><small>${dateObj(k).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} · ${completion(k)}/8</small></div><span class="status-dot ${perfect(k)?'good':past(k)?'bad':''}"></span>`;e.onclick=()=>showDay(k,i);historyList.appendChild(e);}}
function renderSettings(){const p=state.profile;nameIn.value=p.name||'';ageIn.value=p.age;sexIn.value=p.sex;heightIn.value=p.height;weightIn.value=p.weight;activityIn.value=p.activity;goalIn.value=p.goal||'lose';stepIn.value=p.steps}
function renderAll(){renderHome();const a=document.querySelector('.screen.active')?.id.replace('screen-','');if(a==='workout')renderWorkout();if(a==='nutrition')renderNutrition();if(a==='water')renderWater();if(a==='learn')renderLearn();if(a==='progress')renderProgress();if(a==='history')renderHistory();if(a==='settings')renderSettings()}
function openModal(h){modalContent.innerHTML=h;modal.classList.add('show')}
function closeModal(){modal.classList.remove('show')}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function beep(){try{const C=window.AudioContext||window.webkitAudioContext,c=new C(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.25);o.stop(c.currentTime+.3)}catch(e){}}
async function enableNotifications(){if(!('Notification'in window))return toast('Notifications unsupported');const p=await Notification.requestPermission();state.settings.notify=p==='granted';save();toast(p==='granted'?'Notifications enabled':'Permission not granted')}
document.addEventListener('click',e=>{const b=e.target.closest('[data-screen]');if(b)showScreen(b.dataset.screen)});
settingsBtn.onclick=()=>showScreen('settings');
alarmBtn.onclick=()=>{beep();toast('Alarm sound test')};
modalClose.onclick=closeModal;
modal.onclick=e=>{if(e.target.id==='modal')closeModal()};




saveSteps.onclick=()=>{const add=Math.max(0,Number(stepsInput.value)||0);if(!add)return toast('Enter steps to add');const r=rec();r.steps=(r.steps||0)+add;r.stepLog.push({amount:add,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})});r.habits.steps=r.steps>=state.profile.steps?'done':'pending';save();renderAll();toast(`${fmt(add)} steps added`)};

document.querySelectorAll('[data-water]').forEach(b=>b.onclick=()=>{const amount=Number(b.dataset.water),r=rec();r.water=Math.max(0,(r.water||0)+amount);r.waterLog.push({amount,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})});r.habits.water=r.water>=WATER?'done':'pending';save();renderAll();toast('Water updated')});

saveNutrition.onclick=()=>{const r=rec();const cal=Number(calIn.value);const protein=Number(proteinIn.value);if(!Number.isFinite(cal)||cal<=0)return toast('Enter calories eaten');if(!Number.isFinite(protein)||protein<=0)return toast('Enter protein intake');r.nutrition={cal,protein};r.habits.diet='done';save();renderAll();toast('Nutrition saved • Clean Diet completed ✓');};

saveLearn.onclick=()=>{const r=rec();r.learn={text:learnText.value.trim(),key:learnKey.value.trim(),saved:true};r.habits.learn=r.learn.text?'done':'pending';save();renderAll();toast('Learning saved')};

saveSettings.onclick=()=>{const p=state.profile;p.name=nameIn.value.trim();p.age=Number(ageIn.value)||25;p.sex=sexIn.value;p.height=Number(heightIn.value)||170;p.weight=Number(weightIn.value)||70;p.activity=Number(activityIn.value)||1.55;p.goal=goalIn.value;p.steps=Number(stepIn.value)||10000;save();renderAll();toast('Profile saved')};

notifyBtn.onclick=enableNotifications;

exportBtn.onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='winter-arc-backup.json';a.click();URL.revokeObjectURL(a.href)};

importIn.onchange=async e=>{try{const x=JSON.parse(await e.target.files[0].text());if(!x.profile||!x.days)throw 0;state=x;state.profile.water=undefined;save();renderAll();toast('Backup restored')}catch(_){toast('Invalid backup file')}};

resetBtn.onclick=()=>{if(confirm('Reset all Winter ARC data for this account?')){state=fresh();save();renderAll();toast('Challenge reset')}};

if('serviceWorker'in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}

initAuth();
focusBtn.onclick=()=>document.querySelector('.habit button')?.scrollIntoView({behavior:'smooth'});
