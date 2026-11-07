const $=(s,p=document)=>p.querySelector(s),$$=(s,p=document)=>[...p.querySelectorAll(s)];
const KEY='apexOmsV7';
const owner={id:'OWNER-001',name:'APEX Owner',email:'owner@apexholdings.lk',role:'Owner',companyId:null,companyName:'APEX HOLDINGS'};
const companySeed=[
 ['CMP-001','Lanka Fashion Hub','admin.lfh@apexdemo.lk'],
 ['CMP-002','Kandy Lifestyle','admin.kandy@apexdemo.lk'],
 ['CMP-003','Colombo Trends','admin.colombo@apexdemo.lk'],
 ['CMP-004','Galle Online','admin.galle@apexdemo.lk'],
 ['CMP-005','Ruhuna Mart','admin.ruhuna@apexdemo.lk']
];
function seedDb(){
 const products=[
  {id:1,code:'P-001',name:'Herbal Hair Oil 100ml',cost:45,sell:1990,ownerQty:600},
  {id:2,code:'P-002',name:'Office Pant — Black',cost:45,sell:2950,ownerQty:500},
  {id:3,code:'P-003',name:'Night Dress Full Kit',cost:45,sell:2690,ownerQty:450},
  {id:4,code:'P-004',name:'Welpenela Tea — 32 Bags',cost:45,sell:2100,ownerQty:350},
  {id:5,code:'P-005',name:'Purple Sweet Potato Slips — 30',cost:45,sell:1750,ownerQty:300}
 ];
 const companyDetails=[['Colombo 03, Sri Lanka','011 200 1001'],['Kandy City, Sri Lanka','081 200 1002'],['Colombo 04, Sri Lanka','011 200 1003'],['Galle City, Sri Lanka','091 200 1004'],['Matara Road, Ruhuna','041 200 1005']];
 const companies=companySeed.map(([id,name,email],i)=>({id,name,manager:'Company Admin',address:companyDetails[i][0],phone:companyDetails[i][1],sales:[184500,139800,121200,97200,76400][i],adminEmail:email,active:true,created:today()}));
 const staff=[]; companies.forEach((c,i)=>{
  const base=['lfh','kandy','colombo','galle','ruhuna'][i];
  staff.push({id:`ST-${i+1}A`,name:`${c.name} Admin`,type:'Admin',companyId:c.id,company:c.name,email:c.adminEmail,phone:`077${100000+i}01`});
  staff.push({id:`ST-${i+1}S`,name:`${c.name} Sales`,type:'Sales',companyId:c.id,company:c.name,email:`sales.${base}@apexdemo.lk`,phone:`077${100000+i}02`});
  staff.push({id:`ST-${i+1}W`,name:`${c.name} Shipping`,type:'Shipping',companyId:c.id,company:c.name,email:`ship.${base}@apexdemo.lk`,phone:`077${100000+i}03`});
 });
 const stock={};companies.forEach(c=>stock[c.id]=products.map(p=>({productId:p.id,qty:20})));
 const t=today();
 const leads=[
  {no:'L-1001',importedAt:new Date(Date.now()-2*3600000).toISOString(),date:t,name:'Hiruni Perera',address:'Katugastota, Kandy',city:'Kandy',tel:'0771234567',tel2:'',other:'Asked for black',product:'P-002',staff:staff[1].name,status:'Pending',note:'',companyId:'CMP-001'},
  {no:'L-1002',importedAt:new Date(Date.now()-3*3600000).toISOString(),date:t,name:'Dinithi Fernando',address:'Nugegoda, Colombo',city:'Nugegoda',tel:'0712345678',tel2:'0767890123',other:'',product:'P-001',staff:staff[1].name,status:'No Answer',note:'',companyId:'CMP-001'},
  {no:'L-1003',importedAt:new Date(Date.now()-26*3600000).toISOString(),date:new Date(Date.now()-86400000).toISOString().slice(0,10),name:'Old Pending Customer',address:'Galle',city:'Galle',tel:'0775556611',tel2:'',other:'',product:'P-003',staff:staff[4].name,status:'Pending',note:'',companyId:'CMP-002'},
  {no:'L-1004',importedAt:new Date(Date.now()-1*3600000).toISOString(),date:t,name:'Shashika Jayasuriya',address:'Peradeniya, Kandy',city:'Peradeniya',tel:'0778881001',tel2:'',other:'',product:'P-001',staff:staff[1].name,status:'Pending',note:'',companyId:'CMP-001'},
  {no:'L-1005',importedAt:new Date(Date.now()-4*3600000).toISOString(),date:t,name:'Tharushi Wickramasinghe',address:'Kurunegala',city:'Kurunegala',tel:'0718881002',tel2:'',other:'',product:'P-004',staff:staff[1].name,status:'Pending',note:'',companyId:'CMP-001'}
 ];
 const stockRequests=[{id:'REQ-DEMO-001',companyId:'CMP-002',companyName:companies[1].name,productId:2,product:products[1].name,qty:30,unitCost:45,total:1350,payment:1350,note:'Bank transfer completed — demo request',paymentRef:'DEMO-TRX-045',requestedBy:staff.find(s=>s.companyId==='CMP-002'&&s.type==='Admin')?.name||companies[1].manager,status:'Pending',date:new Date().toISOString()}];
 return {companies,staff,products,stock,leads,orders:[],shipped:[],returned:[],stockRequests,session:null,nextOrder:1001,nextWaybill:5001,commission:{Admin:0,Sales:100,Shipping:0}};
}
let db=JSON.parse(localStorage.getItem(KEY)||'null')||seedDb();
// Catalog isolation migration: legacy demo companies keep the original shared starter catalogue.
// Every newly created company gets its own empty catalogue and can only see products it creates itself.
const legacySharedCatalogCompanyIds = new Set(companySeed.map(row=>row[0]));
if(db.companies && db.products && db.stock){
 db.companies.forEach(c=>{
  if(!legacySharedCatalogCompanyIds.has(c.id)) c.catalogIsolated = true;
  db.stock[c.id] ||= [];
  if(c.catalogIsolated){
   // Remove legacy rows that would expose another company's product/stock in an isolated company.
   db.stock[c.id] = db.stock[c.id].filter(x=>db.products.some(p=>p.id===x.productId && p.companyId===c.id));
  }
  db.products.forEach(p=>{
   const visibleInCatalogue = p.companyId===c.id || (!c.catalogIsolated && !p.companyId);
   if(visibleInCatalogue && !db.stock[c.id].some(x=>x.productId===p.id)) db.stock[c.id].push({productId:p.id,qty:0});
  });
 });
}
if(db.leads){db.leads.forEach(l=>{if(l.assignedStaffId===undefined){const st=db.staff?.find(s=>s.companyId===l.companyId&&s.name===l.staff);if(st)l.assignedStaffId=st.id}})}
save();
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function applyTheme(){const t=localStorage.getItem('apexOmsTheme')||'light';document.body.dataset.theme=t;const l=$('#lightModeBtn'),d=$('#darkModeBtn');if(l&&d){l.classList.toggle('active',t==='light');d.classList.toggle('active',t==='dark')}}
function setTheme(t){localStorage.setItem('apexOmsTheme',t==='dark'?'dark':'light');applyTheme()}

function today(){return new Date().toISOString().slice(0,10)}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function money(n){return 'Rs. '+Number(n||0).toLocaleString('en-LK')}
function toast(m){const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(window._toast);window._toast=setTimeout(()=>t.classList.remove('show'),2300)}
function currentUser(){return db.session?.role==='Owner'?owner:(db.staff.find(s=>s.id===db.session?.staffId)||null)}
function currentCompanyId(){return db.session?.role==='Owner'?null:db.session?.companyId}
function companyProducts(){if(!currentCompanyId())return db.products.map(p=>({...p,qty:'Unlimited',isUnlimited:true}));const sid=currentCompanyId();return db.products.filter(p=>!p.companyId||p.companyId===sid).map(p=>({...p,qty:(db.stock[sid]||[]).find(x=>x.productId===p.id)?.qty||0,isUnlimited:false}))}
function stockForCompany(companyId,pid){const r=(db.stock[companyId]||[]).find(x=>x.productId===pid);return r?.qty||0}
function addCompanyStock(companyId,pid,qty){if(!db.stock[companyId])db.stock[companyId]=[];let r=db.stock[companyId].find(x=>x.productId===pid);if(!r){r={productId:pid,qty:0};db.stock[companyId].push(r)}r.qty+=qty}
function auth(){return db.session}
function loginScreen(){
 const savedLoginEmail=esc(localStorage.getItem('apexOmsLastLoginEmail')||'');
 $('#appShell').style.display='none';$('#loginScreen').style.display='grid';
 $('#loginScreen').innerHTML=`<div class="login-card"><div class="login-brand"><img src="assets/apex-logo.png"><h2>APEX HOLDINGS</h2><p>Cloud-ready multi-company Order Management System for leads, orders, stock, shipping and returns.</p><div class="login-bullets"><div>✓ Separate company access</div><div>✓ Admin / Sales / Shipping staff accounts</div><div>✓ Owner controlled stock allocation</div><div>✓ Lead + order workflow with history</div></div></div><div class="login-form"><h3>Sign in</h3><div class="sub">Use your email and password</div><div id="loginError" class="login-error"></div><form id="loginForm" autocomplete="on" onsubmit="event.preventDefault();doLogin()"><div class="field"><label for="loginEmail">Email</label><input id="loginEmail" name="username" type="email" autocomplete="username" value="${savedLoginEmail}" placeholder="you@company.com" required></div><div class="field" style="margin-top:12px"><label for="loginPassword">Password</label><input id="loginPassword" name="password" type="password" autocomplete="current-password" placeholder="••••••••" required></div><button type="submit" class="btn btn-primary" style="margin-top:16px;height:44px">Sign in</button></form><div class="login-help">Your account is verified securely by the OMS server. Contact the Owner if you need account access.</div></div></div>`;
}
function fillLogin(e,p){$('#loginEmail').value=e;$('#loginPassword').value=p}
async function doLogin(){
 const e=$('#loginEmail').value.trim().toLowerCase(),p=$('#loginPassword').value;
 const err=$('#loginError');err.textContent='';err.classList.remove('show');
 try{
  const response=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({email:e,password:p})});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(payload.error||'Invalid email or password.');
  const u=payload.user||{};
  if(u.role==='Owner')db.session={role:'Owner',staffId:null,companyId:null,email:u.email};
  else db.session={role:u.role,staffId:u.staffId,companyId:u.companyId,email:u.email};
  if(window.apexSyncLogin)await window.apexSyncLogin();
  localStorage.setItem('apexOmsLastLoginEmail',e);save();bootApp();toast('Login successful');
 }catch(ex){err.textContent=ex.message||'Unable to connect to the secure OMS server.';err.classList.add('show')}
}
async function logout(){try{await fetch('/api/logout',{method:'POST',credentials:'same-origin'})}catch(e){}db.session=null;save();loginScreen()}
function bootApp(){
 applyTheme();
 if(!db.session){loginScreen();return}
 $('#loginScreen').style.display='none';$('#appShell').style.display='flex';const u=currentUser();
 $('#sessionName').textContent=db.session.role==='Owner'?owner.name:u.name;$('#sessionCompany').textContent=db.session.role==='Owner'?'APEX HOLDINGS':u.company;$('#roleText').textContent=db.session.role;$('#profileCompany').textContent=db.session.role==='Owner'?'APEX HOLDINGS':u.company;$('#avatar').textContent=(db.session.role==='Owner'?'O':(u.name||'U')[0]).toUpperCase();
 applyMenu();render();
}
const routeTitles={dashboard:'Dashboard','stock-list':'Stock List','stock-purchase':'Stock Request / Purchase','stock-requests':'Company Stock Requests','product-tools':'Product Create & Transfer','import-lead':'Import Lead','lead-list':'Lead List','new-order':'New Order','pending-orders':'Pending Orders','search-orders':'Search Orders',ship:'Ship Orders','shipped-list':'Shipped List','add-return':'Add Return','returned-list':'Returned List','create-company':'Create Company','company-list':'Company List','new-staff':'New Staff','staff-list':'Staff List','commission-rate':'Commission Rate',settings:'Settings'};
function navTo(r){location.hash=r}
function setPage(r){$('#pageTitle').textContent=routeTitles[r]||'Dashboard';$('#breadcrumb').textContent=routeTitles[r]||'Dashboard';$$('[data-route]').forEach(x=>x.classList.toggle('active',x.dataset.route===r))}
function permitted(r){const role=db.session?.role;if(role==='Owner')return true;if(['Sales','Shipping'].includes(role)&&['dashboard','stock-list','stock-purchase','product-tools','staff-list','new-staff','commission-rate','create-company','company-list'].includes(r))return false;if(role==='Shipping'&&['import-lead','lead-list','new-order'].includes(r))return false;return true}
function applyMenu(){const role=db.session.role;$$('.owner-only').forEach(x=>x.style.display=role==='Owner'?'':'none');$$('.admin-owner').forEach(x=>x.style.display=(role==='Owner'||role==='Admin')?'':'none');$$('.staff-hide').forEach(x=>x.style.display=(role==='Sales'||role==='Shipping')?'none':'');$$('.company-stock-request').forEach(x=>x.style.display=role==='Admin'?'':'none');$$('[data-route=product-tools]').forEach(x=>x.style.display=(role==='Owner'||role==='Admin')?'':'none');}
function render(){if(!db.session)return loginScreen();let r=location.hash.slice(1)||'dashboard';if(!routeTitles[r]||!permitted(r))r=db.session.role==='Sales'||db.session.role==='Shipping'?'pending-orders':'dashboard';setPage(r);(pages[r]||pages.dashboard)();}
function layout(inner){$('#content').innerHTML=inner}
function showLogoLoader(duration=550,after=()=>{}){const existing=$('#logoLoader');if(existing)existing.remove();const d=document.createElement('div');d.id='logoLoader';d.className='logo-loader';d.innerHTML='<img src="assets/apex-logo.png" alt="APEX HOLDINGS">';document.body.appendChild(d);requestAnimationFrame(()=>d.classList.add('show'));window.setTimeout(()=>{d.classList.remove('show');window.setTimeout(()=>{d.remove();after()},160)},duration)}
function badge(s){const cls={Pending:'pending',Act:'pending',OK:'ok','No Answer':'noanswer',Rejected:'rejected',Deleted:'deleted',Shipped:'shipped',Delivered:'delivered',Returned:'rejected',Active:'shipped'}[s]||'pending';return `<span class="badge ${cls}">${esc(s)}</span>`}
function companyChartColors(i){const colors=['#2563eb','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899','#64748b','#14b8a6','#f97316'];return colors[i%colors.length]}
function chart(){
 const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(6-i));return d.toISOString().slice(0,10)});
 const companies=db.companies;
 const rows=companies.map((c,ri)=>({company:c.name,color:companyChartColors(ri),days:days.map(day=>{const os=db.orders.filter(o=>o.companyId===c.id&&o.date===day);return {count:os.length,sales:os.reduce((a,o)=>a+Number(o.price||0),0)}})}));
 const max=Math.max(...rows.flatMap(r=>r.days.map(x=>x.count)),1),w=980,h=340,padL=48,padR=20,padT=26,padB=48;
 const iw=w-padL-padR,ih=h-padT-padB,xStep=iw/Math.max(days.length-1,1),y=v=>padT+ih-(v/max)*ih;
 const grid=[0,1,2,3,4].map(i=>{const val=Math.round(max-(i*max/4)),yy=y(val);return `<line x1="${padL}" y1="${yy}" x2="${w-padR}" y2="${yy}" class="chart-axis"/><text x="8" y="${yy+4}" class="chart-axis-label">${val}</text>`}).join('');
 const xlabels=days.map((d,i)=>{const xx=padL+i*xStep;return `<text x="${xx}" y="${h-14}" text-anchor="middle" class="chart-label">${d.slice(5)}</text>`}).join('');
 function smoothPath(points){
  if(points.length<2)return '';
  let d=`M ${points[0][0]} ${points[0][1]}`;
  for(let i=0;i<points.length-1;i++){
   const p0=points[i-1]||points[i], p1=points[i], p2=points[i+1], p3=points[i+2]||p2;
   const cp1x=p1[0]+(p2[0]-p0[0])/6, cp1y=p1[1]+(p2[1]-p0[1])/6;
   const cp2x=p2[0]-(p3[0]-p1[0])/6, cp2y=p2[1]-(p3[1]-p1[1])/6;
   d+=` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
 }
 const series=rows.map(r=>{const points=r.days.map((v,i)=>[padL+i*xStep,y(v.count)]);const dots=r.days.map((v,i)=>`<circle cx="${points[i][0]}" cy="${points[i][1]}" r="4" fill="#fff" stroke="${r.color}" stroke-width="2.5"><title>${esc(r.company)} • ${days[i]} • ${v.count} orders • ${money(v.sales)}</title></circle>`).join('');return `<path d="${smoothPath(points)}" fill="none" stroke="${r.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}`}).join('');
 return `<div class="chart-wrap"><svg viewBox="0 0 ${w} ${h}" aria-label="Weekly company sales comparison line chart">${grid}${series}${xlabels}</svg></div><div class="chart-legend colorful">${rows.map(r=>`<span><i class="legend-dot" style="background:${r.color}"></i>${esc(r.company)}</span>`).join('')}</div><div class="weekly-note"><span>Vertical axis: Orders</span><span>Horizontal axis: Day</span></div>`;
}

function leaderboardData(){
 const companyById=new Map(db.companies.map(c=>[c.id,c.name]));
 const leadsByStaff=new Map();
 db.leads.forEach(l=>leadsByStaff.set(l.assignedStaffId||l.staff,(leadsByStaff.get(l.assignedStaffId||l.staff)||0)+1));
 const bestCall=db.staff.filter(s=>s.type==='Sales'||s.type==='Shipping').map(s=>({name:s.name,company:companyById.get(s.companyId)||s.company||'—',value:leadsByStaff.get(s.id)||leadsByStaff.get(s.name)||0})).sort((a,b)=>b.value-a.value).slice(0,50);
 const salesCompanies=db.companies.map(c=>{const value=db.orders.filter(o=>o.companyId===c.id).reduce((a,o)=>a+Number(o.price||0),0);return {name:c.name,company:c.name,value}}).sort((a,b)=>b.value-a.value).slice(0,50);
 const purchases=db.companies.map(c=>{const value=db.stockRequests.filter(r=>r.companyId===c.id&&r.status==='Approved').reduce((a,r)=>a+Number(r.qty||0),0);return {name:c.name,company:c.name,value}}).sort((a,b)=>b.value-a.value).slice(0,50);
 const weekStart=new Date();weekStart.setHours(0,0,0,0);weekStart.setDate(weekStart.getDate()-6);const prevStart=new Date(weekStart);prevStart.setDate(prevStart.getDate()-7);
 const emerging=db.companies.map(c=>{const cur=db.orders.filter(o=>o.companyId===c.id&&new Date(o.date)>=weekStart).length;const prev=db.orders.filter(o=>o.companyId===c.id&&new Date(o.date)>=prevStart&&new Date(o.date)<weekStart).length;return {name:c.manager||c.name,company:c.name,value:cur-prev,cur,prev}}).sort((a,b)=>b.value-a.value||b.cur-a.cur).slice(0,50);
 const highest=db.companies.map(c=>{const value=db.orders.filter(o=>o.companyId===c.id).reduce((a,o)=>a+Number(o.price||0),0);const admin=db.staff.find(s=>s.companyId===c.id&&s.type==='Admin');return {name:admin?.name||c.manager||c.name,company:c.name,value}}).sort((a,b)=>b.value-a.value).slice(0,50);
 return {bestCall,salesCompanies,purchases,emerging,highest};
}
function leaderboardSection(title,items,cat){return `<button class="leader-mini-card" onclick="openLeaderboard('${cat}')"><span class="leader-mini-icon">${cat==='bestCall'?'☎':cat==='highest'?'◆':cat==='purchases'?'▣':cat==='emerging'?'↗':'★'}</span><span><b>${title}</b><small>${items.length?esc(items[0].name)+' • '+esc(items[0].company):'No data'}</small></span><strong>View</strong></button>`}
function openLeaderboard(cat){const lb=leaderboardData();const map={bestCall:['Best Call Centre',lb.bestCall,x=>`${x.value} leads`],highest:['Highest Sales Company',lb.highest,x=>money(x.value)],purchases:['Top Purchase',lb.purchases,x=>`${x.value} units`],emerging:['Emerging Entrepreneur',lb.emerging,x=>`${x.value>=0?'+':''}${x.value} orders vs prior week`],salesCompanies:['Sales Performance',lb.salesCompanies,x=>money(x.value)]};const [title,items,fmt]=map[cat]||map.bestCall;const rows=items.map((x,i)=>`<tr><td><span class="rank-badge">${i+1}</span></td><td><b>${esc(x.name)}</b></td><td>${esc(x.company)}</td><td><strong>${esc(fmt(x))}</strong></td></tr>`).join('')||'<tr><td colspan="4" class="empty">No data</td></tr>';const m=document.createElement('div');m.className='modal-mask';m.style.display='flex';m.innerHTML=`<div class="modal leaderboard-modal"><div class="modal-head"><div><div class="eyebrow">LEADERBOARD</div><div class="panel-title">${title}</div><div class="note">Top 50 • Name • Company • Performance</div></div><button class="close" onclick="this.closest('.modal-mask').remove()">×</button></div><div class="table-wrap" style="margin-top:14px"><table class="table"><thead><tr><th>Rank</th><th>Name</th><th>Company</th><th>Performance</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;document.body.appendChild(m)}
function dashboard(){
 const comp=currentCompanyId();
 const orders=db.orders.filter(o=>!comp||o.companyId===comp);
 const ship=db.shipped.filter(x=>!comp||x.companyId===comp);
 const ret=db.returned.filter(x=>!comp||x.companyId===comp);
 const sales=orders.reduce((a,o)=>a+Number(o.price||0),0);
 const lb=leaderboardData();
 const trendVisible=['Owner','Admin'].includes(db.session.role);
 layout(`<div class="dashboard-hero premium cloud-hero"><div><div class="eyebrow">APEX HOLDINGS • CLOUD OMS</div><h2>${db.session.role==='Owner'?'Owner Dashboard':esc(currentUser().company)}</h2><p>Live operations, company performance, stock movement and order intelligence in one place.</p></div><div class="hero-badge colorful-badge"><span>Cloud Ready</span><b>${today()}</b></div></div>
 <div class="grid kpi-grid dashboard-kpis">
  <div class="card kpi gradient-blue"><div class="label">TOTAL ORDERS</div><div class="value">${orders.length}</div><div class="meta">All created orders</div></div>
  <div class="card kpi gradient-amber"><div class="label">PENDING ORDERS</div><div class="value">${orders.filter(o=>o.status==='Pending').length}</div><div class="meta">Waiting to ship</div></div>
  <div class="card kpi gradient-cyan"><div class="label">SHIPPED</div><div class="value">${orders.filter(o=>o.status==='Shipped').length}</div><div class="meta">Shipped orders</div></div>
  <div class="card kpi gradient-red"><div class="label">RETURNED</div><div class="value">${ret.length}</div><div class="meta">Received back</div></div>
  <div class="card kpi gradient-green"><div class="label">DELIVERED</div><div class="value">${orders.filter(o=>o.status==='Delivered').length}</div><div class="meta">Completed orders</div></div>
  <div class="card kpi gradient-purple"><div class="label">SALES</div><div class="value small-money">${money(sales)}</div><div class="meta">${comp?'This company':'All companies'}</div></div>
 </div>
 <div class="dashboard-main-grid premium-grid">
  <div class="card panel chart-card premium-panel"><div class="panel-head"><div><div class="panel-title">All Company Comparison</div><div class="panel-sub">7-day order comparison • each company has a separate color</div></div><div class="chart-live-badge">LIVE</div></div><div class="chart">${chart()}</div></div>
  <div class="card panel leaderboard-card premium-panel"><div class="panel-head"><div><div class="panel-title">Leaderboard</div><div class="panel-sub">Open a category to view the Top 50</div></div></div><div class="leader-mini-grid">${leaderboardSection('Best Call Centre',lb.bestCall,'bestCall')}${leaderboardSection('Highest Sales Company',lb.highest,'highest')}${leaderboardSection('Top Purchase',lb.purchases,'purchases')}${leaderboardSection('Emerging Entrepreneur',lb.emerging,'emerging')}${leaderboardSection('Sales Performance',lb.salesCompanies,'salesCompanies')}</div></div>
 </div>
 <button class="card company-summary-card" onclick="navTo('company-list')"><span class="company-summary-icon">▦</span><span><b>Company List</b><small>Click to view all companies</small></span><strong>${db.companies.length}</strong><span class="company-summary-arrow">→</span></button>
 ${trendVisible?`<div class="card panel premium-panel trend-panel" id="profitTrendPanel" style="margin-top:16px"></div>`:''}`);
 if(trendVisible) renderProfitSalesTrend();
}

function daysAgo(n){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)}
function orderProfit(o){
 let p=0;
 const items=o.items||[];
 if(items.length){items.forEach(it=>{const product=db.products.find(x=>x.id===it.productId);const cost=Number(product?.cost||120);p+=Math.max(0,Number(it.qty||0)*(Number(it.price||0)-cost));});return p;}
 const fallbackCost=120*Number(o.qty||0);return Math.max(0,Number(o.price||0)-fallbackCost);
}
function renderProfitSalesTrend(){
 const box=$('#profitTrendPanel');if(!box)return;
 const admin=db.session.role==='Admin';
 const fixed=admin?currentCompanyId():'';
 const start=document.getElementById('trendStart')?.value||daysAgo(6);
 const end=document.getElementById('trendEnd')?.value||today();
 const selected=document.getElementById('trendCompany')?.value||fixed||db.companies.find(c=>c.active!==false)?.id||'';
 const companies=selected?[db.companies.find(c=>c.id===selected)].filter(Boolean):db.companies;
 box.innerHTML=`<div class="panel-head trend-head"><div><div class="panel-title">Profit &amp; Sales Trend</div><div class="panel-sub">${admin?'Your company performance for the selected period.':'Select a company and date range to inspect its performance.'}</div></div><div class="trend-controls"><div class="field"><label>Start Date</label><input id="trendStart" type="date" value="${start}"></div><div class="field"><label>End Date</label><input id="trendEnd" type="date" value="${end}"></div>${admin?`<div class="trend-scope"><span class="scope-pill">${esc(currentUser().company)}</span></div>`:`<div class="field"><label>Company</label><select id="trendCompany"><option value="">Select company</option>${db.companies.filter(c=>c.active!==false).map(c=>`<option value="${c.id}" ${c.id===selected?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div>`}</div></div><div class="trend-chart-wrap">${renderProfitSalesSvg(companies,start,end)}</div><div class="trend-summary">${companies.map(c=>{const data=trendValues(c.id,start,end);return `<div class="trend-mini"><span class="legend-dot" style="background:${companyChartColors(db.companies.findIndex(x=>x.id===c.id))}"></span><div><b>${esc(c.name)}</b><small>${data.totalOrders} orders • ${money(data.sales)} sales • ${money(data.profit)} profit</small></div></div>`}).join('')||'<div class="trend-empty">Select a company to view the trend.</div>'}</div>`;
 box.querySelector('#trendStart')?.addEventListener('change',renderProfitSalesTrend);
 box.querySelector('#trendEnd')?.addEventListener('change',renderProfitSalesTrend);
 box.querySelector('#trendCompany')?.addEventListener('change',renderProfitSalesTrend);
}
function trendValues(companyId,start,end){
 const os=db.orders.filter(o=>o.companyId===companyId&&o.date>=start&&o.date<=end);
 return {sales:os.reduce((a,o)=>a+Number(o.price||0),0),profit:os.reduce((a,o)=>a+orderProfit(o),0),totalOrders:os.length};
}
function renderProfitSalesSvg(companies,start,end){
 const days=[];const a=new Date(start),b=new Date(end);if(isNaN(a)||isNaN(b)||a>b)return '<div class="trend-empty">Choose a valid date range.</div>';
 for(const d=new Date(a);d<=b;d.setDate(d.getDate()+1))days.push(d.toISOString().slice(0,10));
 const visibleDays=days;
 const series=[];companies.forEach(c=>{const sales=visibleDays.map(day=>db.orders.filter(o=>o.companyId===c.id&&o.date===day).reduce((a,o)=>a+Number(o.price||0),0));const profit=visibleDays.map(day=>db.orders.filter(o=>o.companyId===c.id&&o.date===day).reduce((a,o)=>a+orderProfit(o),0));series.push({c,sales,profit,color:companyChartColors(db.companies.findIndex(x=>x.id===c.id))});});
 if(!series.length)return '<div class="trend-empty">Select a company to view the trend.</div>';
 const all=[0,...series.flatMap(s=>s.sales),...series.flatMap(s=>s.profit)];const max=Math.max(...all,1);const w=1040,h=360,pl=58,pr=18,pt=22,pb=50,iw=w-pl-pr,ih=h-pt-pb,xStep=iw/Math.max(visibleDays.length-1,1),y=v=>pt+ih-(v/max)*ih;
 const grid=[0,.25,.5,.75,1].map(f=>{const yy=pt+ih-(ih*f);const val=Math.round(max*f);return `<line x1="${pl}" y1="${yy}" x2="${w-pr}" y2="${yy}" class="trend-grid"/><text x="8" y="${yy+4}" class="trend-axis-label">${val.toLocaleString('en-LK')}</text>`}).join('');
 const xlabels=visibleDays.map((d,i)=>{if(visibleDays.length>12 && i%Math.ceil(visibleDays.length/12)!==0 && i!==visibleDays.length-1)return '';const xx=pl+i*xStep;return `<text x="${xx}" y="${h-14}" text-anchor="middle" class="trend-axis-label">${d.slice(5)}</text>`}).join('');
 const smooth=pts=>{if(pts.length<2)return '';let d=`M ${pts[0][0]} ${pts[0][1]}`;for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;const c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];d+=` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;}return d};
 const paths=series.flatMap(s=>{const ps=s.sales.map((v,i)=>[pl+i*xStep,y(v)]),pp=s.profit.map((v,i)=>[pl+i*xStep,y(v)]);return [`<path d="${smooth(ps)}" fill="none" stroke="${s.color}" stroke-width="3.5" stroke-linecap="round"/><path d="${smooth(pp)}" fill="none" stroke="${s.color}" stroke-width="2.2" stroke-dasharray="6 5" stroke-linecap="round"/>`].join('')}).join('');
 const legend=series.map(s=>`<span><i class="legend-dot" style="background:${s.color}"></i>${esc(s.c.name)} <em>solid sales / dashed profit</em></span>`).join('');
 return `<div class="trend-legend"><span class="trend-key sales-key"><i></i>Sales</span><span class="trend-key profit-key"><i></i>Profit</span>${legend}</div><svg viewBox="0 0 ${w} ${h}" class="profit-trend-svg" aria-label="Profit and sales trend chart">${grid}${paths}${xlabels}</svg>`;
}


function stockList(){const ps=companyProducts();const scopeLabel=db.session.role==='Owner'?'Owner Stock / Master Inventory':`Company Stock — ${currentUser().company}`;layout(`<div class="toolbar"><div class="field grow"><label>Search product</label><input id="stockSearch" placeholder="Search product name or code" oninput="filterStock()"></div>${db.session.role==='Admin'?`<button class="btn btn-primary" onclick="navTo('product-tools')">+ Create / Transfer Product</button>`:''}<button class="btn ${db.session.role==='Owner'?'btn-gold':'btn-primary'}" onclick="navTo('stock-purchase')">${db.session.role==='Owner'?'+ Owner Stock':'Request Stock'}</button></div>${db.session.role!=='Owner'?`<div class="callout stock-control-card"><b>${esc(scopeLabel)}</b><div class="stock-request-note">Only this company’s stock quantities are shown here. Other companies’ stock is never displayed.</div></div>`:`<div class="callout stock-control-card"><b>${esc(scopeLabel)}</b><div class="stock-request-note">Owner inventory is separate from every company’s stock.</div></div>`}<div class="card table-card"><div class="table-wrap"><table class="table" id="stockTable"><thead><tr><th>#</th><th>Product ID</th><th>Product</th><th>Product Code</th><th>Available Qty</th><th>Selling Price (Rs)</th><th>Actions</th></tr></thead><tbody>${ps.map((p,i)=>`<tr><td>${i+1}</td><td>${p.id}</td><td><b>${esc(p.name)}</b></td><td>${esc(p.code)}</td><td>${p.isUnlimited?'Unlimited':p.qty}</td><td>${Number(p.sell).toLocaleString()}</td><td>${db.session.role==='Owner'?`<button class="btn btn-outline" onclick="editOwnerCost(${p.id})">Edit Cost</button>`:db.session.role==='Admin'?`<button class="btn btn-outline" onclick="editSellingPrice(${p.id})">Edit</button>`:`<button class="btn btn-outline" onclick="toast('Stock history opened')">History</button>`}</td></tr>`).join('')}</tbody></table></div></div>`) }
function filterStock(){const q=($('#stockSearch')?.value||'').toLowerCase().trim(),qn=q.replace(/,/g,''),cf=$('#stockCompany')?.value||'';$$('#stockTable tbody tr[data-search]').forEach(tr=>{const hay=tr.dataset.search,okQ=!q||hay.includes(q)||hay.replace(/,/g,'').includes(qn),okC=!cf||tr.dataset.company===cf;tr.style.display=okQ&&okC?'':'none'})}
function editOwnerCost(pid){if(db.session.role!=='Owner')return toast('Owner only');const p=db.products.find(x=>x.id===pid);if(!p)return;const v=prompt('Set stock purchase cost per unit (Rs). Default is 45.',p.cost??45);if(v===null)return;const n=Number(v);if(!Number.isFinite(n)||n<0)return toast('Invalid cost');p.cost=n;save();toast('Stock cost updated');stockList()}
function editSellingPrice(pid){if(db.session.role!=='Admin')return toast('Company Admin only');const p=db.products.find(x=>x.id===pid);if(!p)return;const v=prompt('Edit selling price (Rs.)',p.sell);if(v===null)return;const n=Number(v);if(!Number.isFinite(n)||n<0)return toast('Invalid selling price');p.sell=n;save();toast('Selling price updated');stockList()}
function productTools(){if(!['Owner','Admin'].includes(db.session.role))return toast('Admin/Owner only');if(db.session.role==='Owner'){return layout(`<div class="page-intro"><div><div class="eyebrow">PRODUCT CONTROL</div><h2>Product Create & Transfer</h2><p>Owner can create products. Company Admins can create a product and transfer available company stock from an existing product.</p></div></div><div class="card section-card"><div class="panel-title">Owner note</div><p class="note">Use Company Admin accounts for company-level product creation and stock transfer.</p></div>`)}
layout(`<div class="page-intro"><div><div class="eyebrow">STOCK TOOLS</div><h2>Create Product & Transfer Stock</h2><p>Create a new product, then move stock from an existing product into the new product. The source stock is reduced and the new stock is added to your company.</p></div></div><div class="split"><div class="card section-card"><div class="panel-title">Create New Product</div><div class="form-grid"><div class="field"><label>Product Name</label><input id="npName" placeholder="e.g. New Variant"></div><div class="field"><label>Product Code</label><input id="npCode" placeholder="P-NEW01"></div><div class="field"><label>Selling Price (Rs)</label><input id="npSell" type="number" min="0" placeholder="1990"></div></div><div class="callout" style="margin-top:12px"><b>Opening quantity: not allowed</b><div class="note">New products start with 0 stock. To add stock, transfer from an existing product or request stock from Owner.</div></div><div class="actions" style="margin-top:14px"><button class="btn btn-primary" onclick="createCompanyProduct()">Create Product</button></div></div><div class="card section-card"><div class="panel-title">Transfer Stock</div><div class="form-grid"><div class="field span-2"><label>From Product</label><select id="trFrom">${companyProducts().map(p=>`<option value="${p.id}">${esc(p.name)} — ${esc(p.code)} — Stock ${p.qty}</option>`).join('')}</select></div><div class="field span-2"><label>To Product</label><select id="trTo">${db.products.filter(p=>(db.stock[currentCompanyId()]||[]).some(s=>s.productId===p.id)).map(p=>`<option value="${p.id}">${esc(p.name)} — ${esc(p.code)}</option>`).join('')}</select></div><div class="field"><label>Transfer Qty</label><input id="trQty" type="number" min="1" value="1"></div></div><div class="actions" style="margin-top:14px"><button class="btn btn-primary" onclick="transferCompanyStock()">Transfer Stock</button></div></div></div>`)}
function createCompanyProduct(){if(db.session.role!=='Admin')return toast('Company Admin only');const name=$('#npName').value.trim(),code=$('#npCode').value.trim(),sell=Number($('#npSell').value);if(!name||!code||!Number.isFinite(sell)||sell<0)return toast('Enter product name, code and selling price');if(db.products.some(p=>p.code.toLowerCase()===code.toLowerCase()))return toast('Product code already exists');const id=Math.max(0,...db.products.map(p=>Number(p.id)||0))+1;db.products.push({id,code,name,cost:45,sell,ownerQty:0});(db.stock[currentCompanyId()] ||= []).push({productId:id,qty:0});save();toast('Product created with 0 stock');navTo('stock-list')}
function transferCompanyStock(){if(db.session.role!=='Admin')return toast('Company Admin only');const from=Number($('#trFrom').value),to=Number($('#trTo').value),qty=Number($('#trQty').value);if(from===to)return toast('Choose two different products');if(!Number.isInteger(qty)||qty<1)return toast('Enter a valid quantity');const stock=db.stock[currentCompanyId()]||[];const src=stock.find(x=>x.productId===from);if(!src||src.qty<qty)return toast('Not enough source stock');let dst=stock.find(x=>x.productId===to);if(!dst){dst={productId:to,qty:0};stock.push(dst)}src.qty-=qty;dst.qty+=qty;db.stock[currentCompanyId()]=stock;save();toast('Stock transferred successfully');navTo('stock-list')}
function stockPurchase(){
 if(db.session.role!=='Owner'){
  layout(`<div class="page-intro"><div><div class="eyebrow">STOCK CONTROL</div><h2>Request Stock From Owner</h2><p>Submit a clear stock request. After the Owner confirms payment, the requested quantity is added to your company stock.</p></div></div><div class="card section-card stock-request-form"><div class="panel-head"><div><div class="panel-title">New Stock Request</div><div class="panel-sub">All request fields are kept separate for easy desktop entry.</div></div><span class="badge pending">Owner approval required</span></div><div class="form-grid stock-request-grid"><div class="field span-2"><label>Product</label><select id="reqProduct" onchange="updateStockRequestTotal()">${db.products.map(p=>`<option value="${p.id}">${esc(p.name)} — ${esc(p.code)}</option>`).join('')}</select></div><div class="field"><label>Requested Qty</label><input id="reqQty" type="number" min="1" value="10" oninput="updateStockRequestTotal()"></div><div class="field"><label>Unit Price</label><input id="reqUnit" value="45" readonly></div><div class="field"><label>Total Stock Cost</label><input id="reqTotal" value="Rs. 1,200" readonly></div><div class="field"><label>Payment Amount</label><input id="reqPay" type="number" min="0" value="1200"></div><div class="field"><label>Payment / Transaction Ref</label><input id="reqRef" placeholder="e.g. TRX-12345"></div><div class="field span-4 receipt-field"><label>Payment receipt * (image or PDF)</label><input id="reqReceipt" type="file" accept="image/*,application/pdf" onchange="pickStockReceipt(this)"><div id="reqReceiptPreview" class="receipt-preview"><span class="note">Attach the bank slip / transfer screenshot. Required to send the request.</span></div></div><div class="field span-4"><label>Request Note</label><textarea id="reqNote" rows="3" placeholder="Payment / delivery / stock details for Owner"></textarea></div></div><div class="request-summary"><div class="mini-stat"><b id="reqSummaryQty">10</b><span>Requested quantity</span></div><div class="mini-stat"><b id="reqSummaryTotal">Rs. 1,200</b><span>Stock cost</span></div><div class="mini-stat"><b id="reqSummaryPay">Rs. 1,200</b><span>Payment entered</span></div></div><div class="actions" style="margin-top:16px"><button class="btn btn-primary" onclick="sendStockRequest()">Send Stock Request</button><button class="btn btn-outline" onclick="navTo('stock-list')">Back to Stock</button></div></div><div class="card section-card" style="margin-top:16px"><div class="panel-head"><div><div class="panel-title">My Stock Requests</div><div class="panel-sub">Track quantity, payment, reference and approval status.</div></div></div><div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Request</th><th>Product</th><th>Qty</th><th>Unit</th><th>Total</th><th>Paid</th><th>Reference</th><th>Date</th><th>Status</th></tr></thead><tbody>${db.stockRequests.filter(r=>r.companyId===currentCompanyId()).map(r=>`<tr><td><b>${esc(r.id)}</b></td><td>${esc(r.product)}</td><td>${r.qty}</td><td>${money(r.unitCost||45)}</td><td>${money(r.total||r.qty*45)}</td><td>${money(r.payment)}</td><td>${esc(r.paymentRef||'—')}</td><td>${new Date(r.date).toLocaleDateString('en-GB')}</td><td>${badge(r.status)}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">No requests yet.</td></tr>'}</tbody></table></div></div>`);
  updateStockRequestTotal(); return;
 }
 layout(`<div class="page-intro"><div><div class="eyebrow">OWNER CONTROL</div><h2>Company Stock Requests</h2><p>Every company request is listed below. Review the request, payment and quantity, then allocate stock after payment confirmation.</p></div><div class="mini-stat"><b>${db.stockRequests.filter(r=>r.status==='Pending').length}</b><span>Pending requests</span></div></div><div class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Request</th><th>Company</th><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Total</th><th>Payment</th><th>Payment Ref</th><th>Requested By</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>${db.stockRequests.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r=>`<tr><td><b>${esc(r.id)}</b><div class="note">${esc(r.note||'No note')}</div></td><td><b>${esc(r.companyName)}</b></td><td>${esc(r.product)}</td><td><strong>${r.qty}</strong></td><td>${money(r.unitCost||45)}</td><td><strong>${money(r.total||r.qty*45)}</strong></td><td>${money(r.payment)}</td><td>${esc(r.paymentRef||'—')}</td><td>${esc(r.requestedBy)}</td><td>${new Date(r.date).toLocaleString('en-GB')}</td><td>${badge(r.status)}</td><td>${r.status==='Pending'?`<button class="btn btn-primary" onclick="approveStockRequest('${r.id}')">Approve & Add Stock</button>`:'<span class="note">Processed</span>'}</td></tr>`).join('')||'<tr><td colspan="12" class="empty">No stock requests.</td></tr>'}</tbody></table></div></div>`);
}
function updateStockRequestTotal(){const q=Number($('#reqQty')?.value||0),t=q*120;if($('#reqTotal'))$('#reqTotal').value=money(t);if($('#reqPay')&&(!$('#reqPay').value||Number($('#reqPay').value)===Number($('#reqPay').dataset.auto||0))){$('#reqPay').value=t;$('#reqPay').dataset.auto=t}}

function sendStockRequest(){if(db.session.role==='Owner')return toast('Owner does not send company stock requests');const p=db.products.find(x=>x.id===Number($('#reqProduct').value)),q=Number($('#reqQty').value),payment=Number($('#reqPay').value),ref=$('#reqRef').value.trim(),note=$('#reqNote').value.trim();if(!p||q<1)return toast('Select a product and enter a valid quantity');if(payment<q*120)return toast('Payment amount cannot be less than the stock cost');const req={id:'REQ-'+Date.now().toString().slice(-7),companyId:currentCompanyId(),companyName:currentUser().company,productId:p.id,product:p.name,qty:q,unitCost:120,total:q*120,payment,note,paymentRef:ref,requestedBy:currentUser().name,status:'Pending',date:new Date().toISOString()};db.stockRequests.unshift(req);save();toast('Stock request sent to Owner');navTo('stock-purchase')}

function approveStockRequest(id){if(db.session.role!=='Owner')return toast('Owner only');const r=db.stockRequests.find(x=>x.id===id),p=db.products.find(x=>x.id===r?.productId);if(!r||!p)return;if(r.status!=='Pending')return toast('Request already processed');if(Number(r.payment)<Number(r.total||r.qty*45))return toast('Payment is not sufficient');if(p.ownerQty<r.qty)return toast('Owner stock is not enough');p.ownerQty-=r.qty;addCompanyStock(r.companyId,r.productId,r.qty);r.status='Approved';r.approvedAt=new Date().toISOString();r.approvedBy=owner.name;save();toast(`${r.qty} units allocated to ${r.companyName}`);navTo('stock-purchase')}
let pendingLeadRows=[];
function importLead(){
 if(db.session.role==='Shipping')return navTo('pending-orders');
 layout(`<div class="card section-card"><div class="panel-head"><div><div class="panel-title">Import Leads</div><div class="panel-sub">Upload your CSV, XLS or XLSX first. After the file is read, choose staff and split the imported leads between them.</div></div><span id="leadCountBadge" class="badge pending">0 leads</span></div><div class="toolbar"><div class="field grow"><label>Lead file</label><input id="leadFile" type="file" accept=".csv,.xls,.xlsx"></div><button class="btn btn-primary" onclick="readLeadImportFile()">Read File</button></div><div class="callout"><b>Import columns</b><div class="note">Customer Name • Address • Contact No • Contact No 2 • Other • Product Code</div><div class="note" style="margin-top:4px">Lead No and Lead Date are generated automatically.</div></div><div id="leadPreview" style="margin-top:15px"></div></div>`);
}
function normalizeHeader(h){return String(h??'').replace(/^\uFEFF/,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function parseCsv(text){
 const rows=[];let row=[],cell='',q=false;
 text=String(text??'').replace(/^\uFEFF/,'');
 // Excel CSV files may use semicolons or tabs depending on regional settings.
 const firstLine=(text.split(/\r?\n/).find(line=>line.trim())||'');
 const countOutsideQuotes=delimiter=>{let count=0,quoted=false;for(let i=0;i<firstLine.length;i++){const c=firstLine[i];if(c==='"'&&firstLine[i+1]==='"'&&quoted){i++;continue}if(c==='"'){quoted=!quoted;continue}if(c===delimiter&&!quoted)count++}return count};
 const delimiter=[',',';','\t'].sort((a,b)=>countOutsideQuotes(b)-countOutsideQuotes(a))[0];
 for(let i=0;i<text.length;i++){
  const c=text[i],n=text[i+1];
  if(c==='"'&&q&&n==='"'){cell+='"';i++;continue}
  if(c==='"'){q=!q;continue}
  if(c===delimiter&&!q){row.push(cell);cell='';continue}
  if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(cell);if(row.some(v=>String(v??'').trim()))rows.push(row);row=[];cell='';continue}
  cell+=c;
 }
 if(cell||row.length){row.push(cell);if(row.some(v=>String(v??'').trim()))rows.push(row)}
 return rows;
}
function mapLeadRows(rows){
 if(!Array.isArray(rows)||!rows.length)return [];
 const h=rows[0].map(normalizeHeader);
 const idx=(...names)=>{for(const n of names){const i=h.indexOf(normalizeHeader(n));if(i>=0)return i}return -1};
 const getCell=(row,...names)=>{
  const i=idx(...names);if(i<0)return '';
  let value=String(row[i]??'').trim();
  // Excel/CSV sometimes drops the leading zero when a phone column was stored numerically.
  const header=normalizeHeader(h[i]||'');
  if(/(contact no|contact number|phone|tel)/.test(header) && /^\d{9}$/.test(value)) value='0'+value;
  return value;
 };
 // Supports the requested import columns exactly, including the short Contact No header.
 return rows.slice(1).map(v=>({
  name:getCell(v,'Customer Name','Customer','Name'),
  address:getCell(v,'Address'),
  tel:getCell(v,'Contact No','Contact No 1','Contact Number','Phone','Phone Number'),
  tel2:getCell(v,'Contact No 2','Contact Number 2','Phone 2','Phone Number 2'),
  other:getCell(v,'Other'),
  product:getCell(v,'Product Code','Product')
 })).filter(r=>r.name||r.address||r.tel||r.tel2||r.other||r.product);
}
async function readLeadImportFile(){
 const f=$('#leadFile')?.files?.[0];if(!f)return toast('Choose a CSV, XLS or XLSX file');
 const ext=(f.name.split('.').pop()||'').toLowerCase();if(!['csv','xls','xlsx'].includes(ext))return toast('Supported files: CSV, XLS, XLSX');
 try{
  let rows;
  if(ext==='csv') rows=parseCsv(await f.text());
  else {
   if(location.protocol==='file:')return toast('For XLS/XLSX import, open this package with start_server.bat');
   const fd=new FormData();fd.append('file',f);
   const res=await fetch('/api/parse-excel',{method:'POST',body:fd});
   const payload=await res.json().catch(()=>null);
   if(!res.ok)throw new Error(payload?.error||`Excel parser unavailable (${res.status})`);
   if(!Array.isArray(payload))throw new Error(payload?.error||'Excel file could not be parsed');
   rows=payload;
  }
  pendingLeadRows=mapLeadRows(rows);
  if(!pendingLeadRows.length)return toast('No valid lead rows found. Check the header row: Customer Name, Address, Contact No, Contact No 2, Other, Product Code.');
  $('#leadCountBadge').textContent=`${pendingLeadRows.length} leads ready`;
  $('#leadPreview').innerHTML=`<div class="mini-stat"><b>${pendingLeadRows.length}</b><span>Valid lead rows read. Assign them to company users before importing.</span></div><div class="table-wrap" style="margin-top:10px"><table class="table"><thead><tr><th>#</th><th>Customer</th><th>Contact</th><th>Product</th></tr></thead><tbody>${pendingLeadRows.slice(0,8).map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${esc(r.tel)}</td><td>${esc(r.product)}</td></tr>`).join('')}${pendingLeadRows.length>8?`<tr><td colspan="4" class="note">+ ${pendingLeadRows.length-8} more</td></tr>`:''}</tbody></table></div><div class="actions" style="margin-top:14px"><button class="btn btn-outline" onclick="importLeadsUnassigned()">Import to Lead List</button><button class="btn btn-primary" onclick="openLeadAssignmentModal()">Assign Imported Leads</button></div>`;
 }catch(e){toast(e.message||'Could not read file')}
}
function importLeadsUnassigned(){
 if(!pendingLeadRows.length)return toast('Read a lead file first');
 const isOwner=db.session?.role==='Owner';
 let companyId=currentCompanyId();
 if(isOwner){
  const options=db.companies.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
  const m=document.createElement('div');m.className='modal-mask';m.style.display='flex';
  m.innerHTML=`<div class="modal" style="width:min(520px,94vw)"><div class="modal-head"><div><div class="eyebrow">IMPORT LEADS</div><div class="panel-title">Choose Company</div><div class="note">${pendingLeadRows.length} leads will be saved directly to Lead List as Unassigned.</div></div><button class="close" onclick="this.closest('.modal-mask').remove()">×</button></div><div class="field" style="margin-top:14px"><label>Company</label><select id="directLeadCompany">${options}</select></div><div class="actions" style="margin-top:14px;justify-content:flex-end"><button class="btn btn-outline" onclick="this.closest('.modal-mask').remove()">Cancel</button><button class="btn btn-primary" onclick="confirmUnassignedLeadImport(document.getElementById('directLeadCompany').value)">Import Leads</button></div></div>`;
  document.body.appendChild(m);return;
 }
 if(!companyId)return toast('Select a company account before importing leads');
 confirmUnassignedLeadImport(companyId);
}
function confirmUnassignedLeadImport(companyId){
 if(!pendingLeadRows.length)return toast('Read a lead file first');
 const isOwner=db.session?.role==='Owner';
 if(!isOwner&&companyId!==currentCompanyId())return toast('You can only import leads into your own company');
 if(!db.companies.some(c=>c.id===companyId))return toast('Select a valid company');
 const importAt=new Date().toISOString();
 const used=new Set((db.leads||[]).map(l=>String(l.no)));
 const prefix=`L-${Date.now()}`;let seq=0;
 const newLeads=pendingLeadRows.map(r=>{let no;do{no=`${prefix}-${String(++seq).padStart(4,'0')}`;}while(used.has(no));used.add(no);return {no,date:today(),importedAt:importAt,name:r.name||'',address:r.address||'',city:'',tel:r.tel||'',tel2:r.tel2||'',other:r.other||'',product:r.product||'',staff:'Unassigned',status:'Pending',note:'',companyId,assignedStaffId:''};});
 db.leads.unshift(...newLeads);save();pendingLeadRows=[];document.querySelectorAll('.modal-mask').forEach(m=>m.remove());toast(`${newLeads.length} leads imported to Lead List`);navTo('lead-list');
}
function addAssignmentRow(){const wrap=$('#staffAssignWrap');if(!wrap)return;let rows=collectAssignmentRows();rows.push({staffId:'',qty:0});renderAssignmentRows(rows)}
function collectAssignmentRows(){return $$('#staffAssignWrap .assignment-row').map(r=>({staffId:r.querySelector('.assignment-staff').value,qty:Number(r.querySelector('.assignment-qty').value)||0}))}
function renderAssignmentRows(rows=collectAssignmentRows().length?collectAssignmentRows():[{staffId:'',qty:pendingLeadRows.length}]){const staffs=db.staff.filter(s=>s.companyId===currentCompanyId()&&(s.type==='Sales'||s.type==='Shipping'));if(!pendingLeadRows.length){$('#staffAssignWrap').innerHTML='<div class="empty" style="padding:16px">Read a file first.</div>';return}$('#staffAssignWrap').innerHTML=rows.map((r,i)=>`<div class="assignment-row" style="display:grid;grid-template-columns:1fr 120px auto;gap:8px;align-items:end;margin-bottom:8px"><div class="field"><label>User</label><select class="assignment-staff">${staffs.map(s=>`<option value="${s.id}" ${s.id===r.staffId?'selected':''}>${esc(s.name)} (${esc(s.type)})</option>`).join('')}</select></div><div class="field"><label>Lead Count</label><input class="assignment-qty" type="number" min="0" max="${pendingLeadRows.length}" value="${r.qty}"></div><button class="btn btn-danger" onclick="removeAssignmentRow(${i})">Remove</button></div>`).join('');updateAssignmentTotal()}
function removeAssignmentRow(i){const rows=collectAssignmentRows();rows.splice(i,1);renderAssignmentRows(rows.length?rows:[{staffId:'',qty:pendingLeadRows.length}])}
function updateAssignmentTotal(){const total=collectAssignmentRows().reduce((a,r)=>a+r.qty,0),el=$('#leadAssignmentTotal');if(el)el.textContent=`${total} / ${pendingLeadRows.length} leads assigned`}
function openLeadAssignmentModal(){if(!pendingLeadRows.length)return toast('Read a lead file first');const staffs=db.staff.filter(s=>s.companyId===currentCompanyId()&&(s.type==='Sales'||s.type==='Shipping'));if(!staffs.length)return toast('No Sales or Shipping users available');const m=document.createElement('div');m.className='modal-mask';m.style.display='flex';m.innerHTML=`<div class="modal" style="width:min(760px,96vw)"><div class="modal-head"><div><div class="eyebrow">LEAD DISTRIBUTION</div><div class="panel-title">Assign Imported Leads</div><div class="note">Imported leads: ${pendingLeadRows.length}. Select users and enter how many leads each should receive.</div></div><button class="close" onclick="this.closest('.modal-mask').remove()">×</button></div><div id="leadAssignModalBody" style="margin-top:14px"></div><div class="actions" style="justify-content:space-between;margin-top:14px"><div class="note" id="leadAssignmentTotal">0 / ${pendingLeadRows.length} leads assigned</div><div class="actions"><button class="btn btn-outline" onclick="addModalAssignmentRow()">+ Add User</button><button class="btn btn-primary" onclick="confirmLeadAssignment()">Import & Assign</button></div></div></div>`;document.body.appendChild(m);renderModalAssignmentRows([{staffId:staffs[0]?.id||'',qty:pendingLeadRows.length}]);}
function collectModalAssignmentRows(){return $$('#leadAssignModalBody .assignment-row').map(r=>({staffId:r.querySelector('.assignment-staff').value,qty:Number(r.querySelector('.assignment-qty').value)||0}))}
function renderModalAssignmentRows(rows){const staffs=db.staff.filter(s=>s.companyId===currentCompanyId()&&(s.type==='Sales'||s.type==='Shipping'));$('#leadAssignModalBody').innerHTML=rows.map((r,i)=>`<div class="assignment-row" style="display:grid;grid-template-columns:1fr 130px auto;gap:8px;align-items:end;margin-bottom:8px"><div class="field"><label>User</label><select class="assignment-staff">${staffs.map(s=>`<option value="${s.id}" ${s.id===r.staffId?'selected':''}>${esc(s.name)} (${esc(s.type)})</option>`).join('')}</select></div><div class="field"><label>Lead Count</label><input class="assignment-qty" type="number" min="0" max="${pendingLeadRows.length}" value="${r.qty}" oninput="updateModalAssignmentTotal()"></div><button class="btn btn-danger" onclick="removeModalAssignmentRow(${i})">Remove</button></div>`).join('');updateModalAssignmentTotal()}
function addModalAssignmentRow(){const rows=collectModalAssignmentRows();rows.push({staffId:'',qty:0});renderModalAssignmentRows(rows)}
function removeModalAssignmentRow(i){const rows=collectModalAssignmentRows();rows.splice(i,1);renderModalAssignmentRows(rows.length?rows:[{staffId:'',qty:pendingLeadRows.length}])}
function updateModalAssignmentTotal(){const total=collectModalAssignmentRows().reduce((a,r)=>a+r.qty,0);const el=$('#leadAssignmentTotal');if(el)el.textContent=`${total} / ${pendingLeadRows.length} leads assigned`}
function confirmLeadAssignment(){
 if(db.session?.role!=='Admin')return toast('Only the Company Admin can import and distribute leads');
 if(!pendingLeadRows.length)return toast('Read a lead file first');
 const rows=collectModalAssignmentRows();
 if(!rows.length)return toast('Select at least one company user');
 if(rows.some(r=>!Number.isInteger(r.qty)||r.qty<0))return toast('Lead counts must be whole numbers of zero or more');
 const total=rows.reduce((a,r)=>a+r.qty,0);
 if(total!==pendingLeadRows.length)return toast(`Assign exactly ${pendingLeadRows.length} leads`);
 const staffMap=new Map(db.staff.map(s=>[s.id,s]));
 const companyId=currentCompanyId();
 if(!companyId)return toast('Select a company account before importing leads');
 for(const a of rows){const st=staffMap.get(a.staffId);if(!st||st.companyId!==companyId||!['Sales','Shipping','Admin'].includes(st.type))return toast('Every assignment must use a valid Sales or Shipping user from your company');}
 // Generate each ID from one monotonic cursor. This prevents duplicate Lead Nos when leads
 // are split across multiple staff assignment rows.
 const importAt=new Date().toISOString();
 let cursor=0, leadSequence=0; const prefix=`L-${Date.now()}`; const newLeads=[]; const usedLeadNos=new Set((db.leads||[]).map(l=>String(l.no)));
 const nextUniqueLeadNo=()=>{let candidate;do{candidate=`${prefix}-${String(++leadSequence).padStart(4,'0')}`;}while(usedLeadNos.has(candidate));usedLeadNos.add(candidate);return candidate;};
 for(const a of rows){const st=staffMap.get(a.staffId);for(let i=0;i<a.qty;i++){
   const r=pendingLeadRows[cursor];
   if(!r){return toast('Import count mismatch. Please review your allocation before saving');}
   cursor++;
   newLeads.push({no:nextUniqueLeadNo(),date:today(),importedAt:importAt,name:r.name,address:r.address,city:'',tel:r.tel,tel2:r.tel2,other:r.other,product:r.product,staff:st.name,status:'Pending',note:'',companyId,assignedStaffId:st.id});
 }}
 if(cursor!==pendingLeadRows.length)return toast('Not all leads were assigned; nothing was saved');
 db.leads.unshift(...newLeads);save();toast(`${newLeads.length} leads imported and assigned`);pendingLeadRows=[];document.querySelector('.modal-mask')?.remove();navTo('lead-list');
}
function importAssignedLeads(){confirmLeadAssignment()}

function leadVisible(l){if(l.companyId!==currentCompanyId())return false;const age=(Date.now()-new Date(l.importedAt||`${l.date}T00:00:00`).getTime())/3600000;return l.status==='Pending'||((l.status==='No Answer'||l.status==='Rejected')&&age<=24)||(l.status==='OK'&&l.date===today())}
function leadList(){const allStaff=db.staff.filter(s=>db.session.role==='Owner'||s.companyId===currentCompanyId());const users=allStaff.filter(s=>s.type==='Sales'||s.type==='Shipping');layout(`<div class="toolbar lead-toolbar"><div class="field"><label>Status</label><select id="leadStatus"><option value="">All Visible</option><option>Pending</option><option>No Answer</option><option>Rejected</option><option>OK</option></select></div><div class="field"><label>User</label><select id="leadUser"><option value="">All users</option>${users.map(s=>`<option>${esc(s.name)}</option>`).join('')}</select></div><div class="field"><label>Start Date</label><input id="leadStart" type="date" value="${today()}"></div><div class="field"><label>End Date</label><input id="leadEnd" type="date" value="${today()}"></div><div class="field grow"><label>Search</label><input id="leadSearch" placeholder="Name, contact, lead no, product..."></div><button class="btn btn-outline" onclick="exportSelectedLeads()">Export Selected CSV</button></div><div class="card table-card"><div class="table-wrap"><table class="table" id="leadTable"><thead><tr><th><input type="checkbox" id="leadAll" onchange="toggleAllLeads(this.checked)"></th><th>#</th><th>Lead No</th><th>Lead Date</th><th>Customer Name</th><th>Address</th><th>Contact No</th><th>Contact No 2</th><th>Other</th><th>Product Code</th><th>Staff</th><th>View</th><th>Status</th><th>Note</th></tr></thead><tbody id="leadBody"></tbody></table></div></div>`);['leadStatus','leadUser','leadStart','leadEnd','leadSearch'].forEach(id=>$('#'+id).addEventListener(id==='leadSearch'?'input':'change',renderLeadRows));renderLeadRows()}
function leadBelongsToAdminCompany(l,companyId){
 if(!companyId)return false;
 if(l.companyId===companyId)return true;
 // Compatibility for older lead records where companyId was not saved, but the lead
 // was assigned to a user who belongs to this Admin's company.
 const assigned=db.staff.find(s=>s.id===l.assignedStaffId);
 if(assigned?.companyId===companyId && !l.companyId)return true;
 if(!l.companyId && l.staff && db.staff.some(s=>s.companyId===companyId&&s.name===l.staff))return true;
 return false;
}
function renderLeadRows(){
 const sd=$('#leadStart').value,ed=$('#leadEnd').value,customDate=(sd!==today()||ed!==today());
 const isOwner=db.session.role==='Owner',isAdmin=db.session.role==='Admin',me=currentUser(),cid=currentCompanyId();
 let a=db.leads.filter(l=>{
  if(isOwner)return true;
  if(!cid)return false;
  if(isAdmin)return leadBelongsToAdminCompany(l,cid);
  if(l.companyId!==cid)return false;
  return l.assignedStaffId===me?.id||l.staff===me?.name;
 });
 const st=$('#leadStatus').value,usr=$('#leadUser').value,q=$('#leadSearch').value.toLowerCase().trim();
 a=a.filter(l=>{
  // Admins see all leads imported into their company, regardless of assigned staff or status.
  // Staff retain the normal visibility window unless they explicitly search a date range.
  const dateOk=customDate?((!sd||String(l.date||'')>=sd)&&(!ed||String(l.date||'')<=ed)):((isAdmin||isOwner)?true:leadVisibleForRole(l));
  const staffName=l.staff||db.staff.find(s=>s.id===l.assignedStaffId)?.name||'Unassigned';
  return dateOk&&(!st||l.status===st)&&(!usr||staffName===usr)&&(!q||JSON.stringify(l).toLowerCase().includes(q));
 });
 a.sort(leadOrder);
 $('#leadBody').innerHTML=a.map((l,i)=>`<tr data-lead-no="${esc(l.no)}" class="lead-row-${l.status==='No Answer'?'noanswer':l.status==='Confirm'?'confirmed':l.status==='Rejected'?'rejected':'pending'}"><td><input type="checkbox" class="lead-check" value="${esc(l.no)}"></td><td>${i+1}</td><td>${esc(l.no)}</td><td>${esc(l.date)}</td><td><button class="lead-customer-link" onclick="openLeadOrder('${esc(l.no)}')"><b>${esc(l.name)}</b></button></td><td>${esc(l.address)}</td><td>${esc(l.tel)}</td><td>${esc(l.tel2)}</td><td>${esc(l.other)}</td><td>${esc(l.product)}</td><td>${esc(l.staff||db.staff.find(s=>s.id===l.assignedStaffId)?.name||'Unassigned')}</td><td><div class="actions"><button class="btn btn-primary" onclick="openLeadOrder('${esc(l.no)}')">View</button>${isAdmin?`<button class="btn btn-outline" onclick="openReassignLead('${esc(l.no)}')">Reassign</button>`:''}</div></td><td>${badge(l.status)}</td><td>${leadNoteBtn(l)}</td></tr>`).join('')||'<tr><td colspan="14" class="empty">No leads found.</td></tr>';
}
function leadVisibleForRole(l){if(db.session.role==='Owner'){const age=(Date.now()-new Date(l.importedAt||`${l.date}T00:00:00`).getTime())/3600000;return l.status==='Pending'||((l.status==='No Answer'||l.status==='Rejected')&&age<=24)||(l.status==='OK'&&l.date===today())}return leadVisible(l)}
function toggleAllLeads(c){$$('.lead-check').forEach(x=>x.checked=c)}
function saveLeadNote(no,v){const l=db.leads.find(x=>x.no===no);if(l){l.note=v;save()}}
function openReassignLead(no){if(db.session?.role!=='Admin')return toast('Admin only');const l=db.leads.find(x=>x.no===no&&leadBelongsToAdminCompany(x,currentCompanyId()));if(!l)return toast('Lead not found in your company');const staffs=db.staff.filter(s=>s.companyId===currentCompanyId()&&(s.type==='Sales'||s.type==='Shipping'||s.type==='Admin'));if(!staffs.length)return toast('No company users available');const currentId=l.assignedStaffId||db.staff.find(s=>s.companyId===currentCompanyId()&&s.name===l.staff)?.id;const m=document.createElement('div');m.className='modal-mask';m.style.display='flex';m.innerHTML=`<div class="modal" style="width:min(520px,94vw)"><div class="modal-head"><div><div class="eyebrow">LEAD CONTROL</div><div class="panel-title">Reassign Lead</div><div class="note">${esc(l.no)} • ${esc(l.name)} • current: ${esc(l.staff||'Unassigned')}</div></div><button class="close" onclick="this.closest('.modal-mask').remove()">×</button></div><div class="field" style="margin-top:14px"><label>Assign to Company User</label><select id="reassignStaff">${staffs.map(s=>`<option value="${esc(s.id)}" ${s.id===currentId?'selected':''}>${esc(s.name)} (${esc(s.type)})</option>`).join('')}</select></div><div class="actions" style="margin-top:14px;justify-content:flex-end"><button class="btn btn-outline" onclick="this.closest('.modal-mask').remove()">Cancel</button><button class="btn btn-primary" onclick="confirmReassignLead('${esc(l.no)}')">Save Reassignment</button></div></div>`;document.body.appendChild(m);}
function confirmReassignLead(no){if(db.session?.role!=='Admin')return toast('Admin only');const l=db.leads.find(x=>x.no===no&&leadBelongsToAdminCompany(x,currentCompanyId())),st=db.staff.find(s=>s.id===$('#reassignStaff')?.value);if(!l||!st||st.companyId!==currentCompanyId()||!['Sales','Shipping','Admin'].includes(st.type))return toast('Select a valid user from your company');l.companyId=currentCompanyId();l.assignedStaffId=st.id;l.staff=st.name;l.updatedAt=new Date().toISOString();save();document.querySelector('.modal-mask')?.remove();toast('Lead reassigned successfully');renderLeadRows();}
function exportSelectedLeads(){const ids=$$('.lead-check:checked').map(x=>x.value);if(!ids.length)return toast('Select leads first');const rows=db.leads.filter(l=>ids.includes(l.no));const header=['Lead No','Lead Date','Customer Name','Address','City','Contact No','Contact No 2','Other','Product Code','Staff','Status','Note'];const csv=[header,...rows.map(l=>header.map(h=>({"Lead No":l.no,"Lead Date":l.date,"Customer Name":l.name,"Address":l.address,"City":l.city,"Contact No":l.tel,"Contact No 2":l.tel2,"Other":l.other,"Product Code":l.product,"Staff":l.staff,"Status":l.status,"Note":l.note||''}[h])))] .map(r=>r.map(x=>`"${String(x??'').replace(/"/g,'""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='apex-leads-'+today()+'.csv';a.click();URL.revokeObjectURL(a.href);toast(rows.length+' leads exported')}
function openLeadOrder(no){newOrder(no)}
function citySeed(){
 const places = [
  // Colombo 01-15 + core Colombo / suburbs
  'Colombo 01 - Fort','Colombo 02 - Slave Island','Colombo 03 - Kollupitiya','Colombo 04 - Bambalapitiya','Colombo 05 - Havelock Town','Colombo 06 - Wellawatte','Colombo 07 - Cinnamon Gardens','Colombo 08 - Borella','Colombo 09 - Dematagoda','Colombo 10 - Maradana','Colombo 11 - Pettah','Colombo 12 - Hulftsdorp','Colombo 13 - Kotahena','Colombo 14 - Grandpass','Colombo 15 - Mattakkuliya',
  'Colombo','Dehiwala','Mount Lavinia','Moratuwa','Ratmalana','Nedimala','Kalubowila','Pepiliyana','Boralesgamuwa','Kesbewa','Piliyandala','Maharagama','Nugegoda','Kottawa','Pannipitiya','Homagama','Godagama','Kottawa Makumbura','Kaduwela','Malabe','Battaramulla','Rajagiriya','Sri Jayawardenepura Kotte','Nawinna','Wijerama','Thalawathugoda','Pelawatte','Koswatta','Talangama','Athurugiriya','Mulleriyawa','Kolonnawa','Wellampitiya','Orugodawatta','Grandpass','Kotugoda','Wattala','Hunupitiya','Hendala','Peliyagoda','Kelaniya','Dalugama','Kiribathgoda','Kadawatha','Mahara','Ragama','Ganemulla','Yakkala','Kirindiwela','Delgoda','Biyagama','Makola','Sapugaskanda','Ja-Ela','Ekala','Kandana','Seeduwa','Katunayake','Negombo','Kochchikade','Wennappuwa','Kochchikade South','Minuwangoda','Dagonna','Divulapitiya','Badalgama','Nittabuwa','Veyangoda','Pasyala','Mirigama','Attanagalla','Gampaha','Yakkala Town',
  // Kalutara
  'Panadura','Wadduwa','Moronthuduwa','Bandaragama','Keselwatta','Ingiriya','Horana','Munagama','Pokunuwita','Millewa','Bulathsinhala','Agalawatta','Matugama','Baduraliya','Kalutara','Kalutara North','Kalutara South','Beruwala','Aluthgama','Bentota','Dharga Town','Payagala','Magalkanda','Maggona','Katukurunda','Dodangoda','Meegahatenna','Walallawita','Bombuwala','Nagoda','Paiyagala','Panapitiya','Neboda','Waskaduwa','Kalawila','Wettumakanda',
  // Galle
  'Galle','Galle Fort','Unawatuna','Habaraduwa','Koggala','Ahangama','Midigama','Weligama','Hikkaduwa','Dodanduwa','Narigama','Boossa','Rathgama','Ambalangoda','Balapitiya','Karandeniya','Elpitiya','Neluwa','Udugama','Baddegama','Yakkalamulla','Nagoda Galle','Mapalagama','Pitigala','Imaduwa','Thawalama','Hiniduma','Kandewatta','Gonapinuwala','Meetiyagoda','Urala','Wanduramba','Labuduwa','Akmeemana','Poddala',
  // Matara
  'Matara','Walgama','Nupe','Dikwella','Dikwella South','Weligama','Mirissa','Kamburupitiya','Akuressa','Hakmana','Deiyandara','Mulatiyana','Kottegoda','Kekanadurra','Gandara','Dondra','Devinuwara','Thihagoda','Kamburugamuwa','Malimbada','Kirinda Puhulwella','Pasgoda','Kotapola','Deniyaya','Pitabeddara','Athuraliya','Morawaka','Makandura','Wiharahena','Matara Town','Palatuwa','Telijjawila','Diyagaha','Urubokka',
  // Hambantota
  'Hambantota','Tangalle','Beliatta','Dickwella','Tissamaharama','Debarawewa','Kataragama','Ambalantota','Lunugamvehera','Sooriyawewa','Weeraketiya','Middeniya','Walasmulla','Ranna','Netolpitiya','Angunakolapelessa','Siyambalanduwa Junction','Bundala','Kirinda','Hambantota New Town','Katuwana','Sithulpawwa','Ridiyagama','Hedigama','Bandagiriya','Agunukolapelessa',
  // Kandy
  'Kandy','Katugastota','Peradeniya','Gampola','Nawalapitiya','Kadugannawa','Pilimathalawa','Akurana','Harispattuwa','Kundasale','Digana','Teldeniya','Wattegama','Poojapitiya','Doluwa','Galagedara','Galaha','Daulagala','Gelioya','Pussellawa','Rikillagaskada','Hanthana','Ampitiya','Mahaiyawa','Asgiriya','Aruppola','Anniewatta','Bogambara','Madawala','Alawathugoda','Menikhinna','Panwila','Thalathuoya','Udawela','Hunnasgiriya','Kengalla','Medawala','Pallekele','Katugastota South','Udispattuwa','Hanguranketha','Hataraliyadda','Ulapane','Danture','Marassana','Pitawala','Yatinuwara','Amunugama','Balana',
  // Matale
  'Matale','Dambulla','Ukuwela','Rattota','Naula','Galewela','Pallepola','Yatawatta','Laggala','Wilgamuwa','Kibissa','Sigiriya','Inamaluwa','Palapathwela','Madawala Ulpotha','Dambadeniya Matale','Aluvihare','Ukuwela Junction','Kandy Road Matale','Kawatayamuna','Nalanda Matale','Hettipola Matale','Opalgala','Knuckles','Illukkumbura','Wewegama','Kaikawala','Ambanganga Korale',
  // Nuwara Eliya
  'Nuwara Eliya','Nanu Oya','Hatton','Talawakele','Kotagala','Dimbula','Lindula','Ragala','Rupass','Pussellawa','Ginigathhena','Maskeliya','Norton Bridge','Bogawantalawa','Agarapathana','Dayagama','Ambewela','Pattipola','Welimada','Udapussellawa','Walapane','Hanguranketha','Rikillagaskada','Keerthi Bandarapura','Labookellie','Ramboda','Pundaluoya','Madulla','Kandapola','Meepilimana','Laxapana','Watawala','Norwood','Upcot','Strathspey',
  // Kurunegala
  'Kurunegala','Kuliyapitiya','Dambadeniya','Pannala','Narammala','Polgahawela','Wariyapola','Nikaweratiya','Mawathagama','Alawwa','Ibbagamuwa','Galgamuwa','Maho','Hettipola','Bingiriya','Giriulla','Boyagane','Wellawa','Melsiripura','Ridigama','Dodangaslanda','Rideegama','Ganewatta','Polgahawela Junction','Padeniya','Ambanpola','Nikaweratiya Town','Kobeigane','Maspotha','Kobeigane Junction','Bingiriya East','Udubaddawa','Galgamuwa Junction','Maspotha North','Ettampitiya Kurunegala','Bamunakotuwa','Maspotha South','Wadakada','Kattimahana','Makulpotha','Rambukkana',
  // Puttalam
  'Puttalam','Chilaw','Marawila','Wennappuwa','Nattandiya','Dankotuwa','Madampe','Anamaduwa','Kalpitiya','Norachcholai','Mundel','Pallama','Arachchikattuwa','Bangadeniya','Dankotuwa South','Halawata','Karukkuponai','Nainamadama','Waikkala','Kakkapalliya','Mundalama','Tabbowa','Vanathavilluwa','Eluwankulama','Andigama','Madampe Junction','Ilavanaduluwa','Dematapitiya',
  // Kegalle
  'Kegalle','Mawanella','Warakapola','Rambukkana','Ruwanwella','Avissawella','Yatiyantota','Dehiowita','Deraniyagala','Galigamuwa','Aranayake','Bulathkohupitiya','Kitulgala','Ambepussa','Karawanella','Nelundeniya','Parape','Kegalle Town','Mawanella Bazaar','Dedigama','Pindeniya','Malmaduwa','Algama','Kotiyakumbura','Uduwella','Dippitiya','Hemmatagama','Berannawa','Ruwanwella Junction','Thalduwa',
  // Ratnapura
  'Ratnapura','Balangoda','Embilipitiya','Pelmadulla','Kuruwita','Eheliyagoda','Rakwana','Kalawana','Godakawela','Opanayake','Kahawatta','Nivithigala','Ayagama','Kolonna','Weligepola','Imbulpe','Kiriella','Erathna','Dela','Pannila','Udawalawe','Madampe Ratnapura','Rathganga','Karangoda','Kurugammodara','Godigamuwa','Kiriibbanwewa','Madalagama','Weddagala',
  // Badulla
  'Badulla','Bandarawela','Ella','Haputale','Diyatalawa','Welimada','Mahiyanganaya','Passara','Hali Ela','Demodara','Kandaketiya','Bibile Badulla','Monaragala Road Badulla','Uva Paranagama','Lunugala','Soranatota','Meegahakiula','Rideemaliyadda','Kandekatiya','Dambana','Arawa','Welimada Town','Kumbalwela','Namunukula','Etampitiya','Haldummulla','Koslanda','Makulella','Boralanda','Beragala','Diyatalawa Camp',
  // Monaragala
  'Monaragala','Bibile','Wellawaya','Buttala','Kataragama','Siyambalanduwa','Medagama','Thanamalwila','Madulla','Okkampitiya','Dambagalla','Badalkumbura','Mariarawa','Kumbukkan Oya','Ayiwala','Bibila Town','Monaragala Town','Wellawaya Town','Buttala Town','Thanamalwila Town','Siyambalanduwa Town','Kotiyagala','Galabedda','Ethimale','Wekada','Nilgala','Mahiyangana Road','Balaharuwa',
  // Anuradhapura
  'Anuradhapura','Medawachchiya','Eppawala','Kekirawa','Nochchiyagama','Galnewa','Horowpothana','Padaviya','Rambewa','Mihintale','Thirappane','Galenbindunuwewa','Kebithigollewa','Giribawa','Talawa','Nuwaragam Palatha','Rajanganaya','Ipalogama','Kahatagasdigiliya','Nachchaduwa','Maha Iluppallama','Bulnewa','Galenbindunuwewa Junction','Padavi Parakrama','Palagala','Rambewa Town','Mihintale Junction','Saliyapura','Parasangahawewa','Mahakanadarawa','Mahawilachchiya','Nachchaduwa Tank','Kahatagasdigiliya Town',
  // Polonnaruwa
  'Polonnaruwa','Medirigiriya','Hingurakgoda','Kaduruwela','Bakamoona','Elahera','Dimbulagala','Aralaganwila','Welikanda','Minneriya','Giritale','Somawathiya','Lankapura','Thamankaduwa','Jayabima','Jayanthipura','Bendiwewa','Manampitiya','Palugasdamana','Aluthwewa','Polonnaruwa New Town','Kadawela Polonnaruwa','Kaduruwela Town','Minneriya Junction','Welikanda Town',
  // Jaffna
  'Jaffna','Nallur','Chunnakam','Kopay','Point Pedro','Karainagar','Kankesanthurai','Tellippalai','Chavakachcheri','Manipay','Inuvil','Uduvil','Sandilipay','Navatkuli','Kayts','Velanai','Delft','Analaitivu','Pungudutivu','Karaveddi','Nelliady','Achchuveli','Atchuveli','Palai','Maruthankerny','Kaitady','Kaithady','Jaffna Fort','Ariyalai','Colombuthurai','Urumpirai','Alaveddy','Vaddukoddai','Sulipuram','Araly','Thellippalai South',
  // Kilinochchi
  'Kilinochchi','Pallai','Poonakary','Karachchi','Paranthan','Elephant Pass','Uruthirapuram','Iranamadu','Akkarayankulam','Vaddakachchi','Murasumoddai','Tharmapuram','Visuvamadu','Puthukudiyiruppu Road','Pallavarayankaddu','Kalmadunagar',
  // Mullaitivu
  'Mullaitivu','Puthukudiyiruppu','Oddusuddan','Mankulam','Maritimepattu','Chundikulam','Puthukkudiyiruppu','Alampil','Nanthi Kadal','Mulliyawalai','Thunukkai','Mallavi','Oddusuddan Town','Mullaitivu Town','Kokkilai',
  // Vavuniya
  'Vavuniya','Vavuniya Town','Nedunkerny','Cheddikulam','Settikulam','Omanthei','Kanagarayankulam','Paranthan Junction Vavuniya','Nelumkulam','Pampaimadu','Poonthottam','Mahakachchakodiya','Maruthodai','Vavuniya North','Vavuniya South',
  // Mannar
  'Mannar','Talaimannar','Pesalai','Murunkan','Madhu','Nanattan','Erukkulampiddi','Silavathurai','Arippu','Adampan','Murunkan Junction','Uyilankulam','Mannar Island','Thottaveli',
  // Batticaloa
  'Batticaloa','Kattankudy','Eravur','Kalmunai','Valachchenai','Oddamavadi','Valaichchenai','Chenkalady','Kiran','Vakarai','Kokkadicholai','Kaluwanchikudy','Arayampathy','Navatkadu','Paddiruppu','Kallady','Palameenmadu','Navalady','Vellavely','Mandur','Periyapullumalai','Punanai','Kathiraveli','Vellaveli East','Batticaloa Town',
  // Ampara
  'Ampara','Akkaraipattu','Kalmunai','Sainthamaruthu','Sammanthurai','Nintavur','Addalaichenai','Pottuvil','Uhana','Dehiattakandiya','Maha Oya','Damana','Navithanveli','Irakkamam','Lahugala','Thirukkovil','Panama','Inginiyagala','Karaitivu','Alayadivembu','Akkaraipattu Town','Kalmunai Town','Samanthurai Town','Padiyatalawa','Kudakumbura','Uhana Town','Ampara Town','Siyambalawewa','Bakmitiyawa',
  // Trincomalee
  'Trincomalee','Kinniya','Kantale','Mutur','China Bay','Nilaveli','Uppuveli','Kuchchaveli','Morawewa','Padavi Sri Pura','Seruwila','Thampalakamam','Echchilampattai','Gomarankadawala','Kinniya Town','Kantale Town','Muttur Town','Nilaveli Town','Pulmoddai','Ichchampitiya','Trincomalee Town',
  // Additional well-known delivery localities / towns from across the island
  'Ahangama','Akaragama','Akarawita','Agalawatta','Akurana','Akurubebila','Alawwa','Aluthgama','Aluthwala','Aluthwewa','Ambagaspitiya','Ambakandawila','Ambalangoda','Ambalantota','Ambepitiya','Ambepussa','Ambewela','Ampara Bazaar','Ampara Bus Stand','Anuradhapura Sacred City','Anuragoda','Arangala','Aranayake Bazaar','Arachchikattuwa','Arukwatta','Asmadala','Atabage','Atale','Attidiya','Avissawella Bazaar','Ayagama','Badalgama','Baduraliya','Bakamuna','Balangoda','Balapitiya Courts','Bambalapitiya','Bandaragama','Bandarawela Bazaar','Banduragoda','Batuwatta','Batuwita','Bawulana','Beliatta Bazaar','Beligaha Junction','Beligala','Bellanwila','Bibile','Bingiriya','Biyagama IPZ','Bokkawala','Bokundara','Bolagala','Bolawatta','Bomiriya','Bopagama','Bopitiya','Boralesgamuwa','Boralessa','Borella','Bossella','Boyagane','Bulathsinhala','Bulnewa','Bulutota','Bussissa','Chilaw','Chunnakam','Dambagasara','Dambawala','Dandeniya','Dangedara','Dangolla','Danowita','Daskara','Dayagama Bazaar','Dedigama','Dediyagala','Dehianga','Dehideniya','Dehigaha Hena','Dehiowita','Dekatana','Dela','Delgoda','Delgalla','Dematagoda','Demodara','Deniyaya','Deyyannewela','Digana','Dikkapitiya','Dikoya','Doluwa','Doluwa Junction','Dummaladeniya','Dunagaha','Dunuwila','Eheliyagoda','Ekala','Ella','Elpitiya','Embilipitiya','Enderamulla','Eppawala','Erathna','Eravur','Eheliyagoda Town','Gampaha','Gampola','Ganemulla','Ganewatta','Galenbindunuwewa','Galewela','Galagedara','Galle Bazaar','Galle Bope','Galle Harbour','Galhinna','Galkadawala','Galkulama','Galnewa','Gampolawatta','Gangodawila','Ginigathhena','Girithale','Godagama','Godakawela','Godapitiya','Habaraduwa','Hakmana','Hali Ela','Halawatha','Hanguranketha','Harispattuwa','Haputale','Hettipola','Hikkaduwa','Hingurakgoda','Homagama','Horana','Horowpothana','Ingiriya','Ibbagamuwa','Inamaluwa','Ja-Ela','Jaffna Town','Kaduwela','Kahawatta','Kandana','Kandapola','Kataragama','Katana','Katugastota','Kegalle','Kekanadura','Kekirawa','Kelaniya','Kiriella','Kiribathgoda','Kirindiwela','Kochchikade','Kolonnawa','Kottawa','Kuliyapitiya','Kurunegala','Kuruwita','Lunugala','Madampe','Madawachchiya','Madawala','Maho','Malabe','Maligawatta','Mannar Town','Matale','Matara','Matugama','Mawanella','Medagama','Medawachchiya','Medirigiriya','Minuwangoda','Mirigama','Moratuwa','Morawaka','Mulleriyawa','Nanu Oya','Narahenpita','Nawala','Nawinna','Nawalapitiya','Negombo','Neluwa','Nittabuwa','Nochchiyagama','Nugegoda','Nuwara Eliya','Padukka','Pannala','Panadura','Pallepola','Peliyagoda','Pelmadulla','Peradeniya','Piliyandala','Polgahawela','Polonnaruwa','Pottuvil','Puttalam','Ragama','Rajagiriya','Rambukkana','Ratnapura','Rattota','Rikillagaskada','Ruwanwella','Seeduwa','Sigiriya','Siyambalanduwa','Sri Jayawardenepura Kotte','Tangalle','Teldeniya','Tellippalai','Thalawakele','Thalawathugoda','Thambuttegama','Thihagoda','Tissamaharama','Trincomalee Town','Ukuwela','Unawatuna','Uragasmanhandiya','Uragaha','Udugama','Uduwalawela','Urumpirai','Vavuniya Town','Valachchenai','Wadduwa','Wariyapola','Wattala','Weligama','Wellawaya','Wennappuwa','Welimada','Weliweriya','Wilgamuwa','Yatiyantota','Yakkala','Yakkalamulla','Yatawatta'
 ];
 return [...new Set(places)].filter(Boolean).sort((a,b)=>a.localeCompare(b));
}
const cities=citySeed();
function newOrder(leadNo=''){orderProducts=[];const l=leadNo?db.leads.find(x=>x.no===leadNo):null;layout(`<div class="card section-card order-form-card"><div class="panel-head"><div><div class="panel-title">New Order</div><div class="panel-sub">Fill customer details, add a product manually, then save the order.</div></div><span class="badge pending">Due today</span></div><div id="orderValidation" class="form-error-box"></div><div class="form-grid"><div class="field"><label>Customer Name *</label><input id="oName" value="${esc(l?.name||'')}" placeholder="Customer name"></div><div class="field span-2"><label>Address *</label><input id="oAddress" value="${esc(l?.address||'')}" placeholder="Full address"></div><div class="field city-search"><label>Town / City *</label><input id="oCity" value="${esc(l?.city||'')}" autocomplete="off" placeholder="Select town / city"><div id="cityDrop" class="city-dropdown"></div></div><div class="field"><label>Contact Number 1</label><input id="oTel" value="${esc(l?.tel||'')}" inputmode="tel"></div><div class="field"><label>Contact Number 2</label><input id="oTel2" value="${esc(l?.tel2||'')}" inputmode="tel"></div><div class="field"><label>Other</label><input id="oOther" value="${esc(l?.other||'')}"></div><div class="field"><label>Color / Size</label><input id="oVariant" value="" placeholder="e.g. Black / XL"></div><div class="field"><label>Due Date</label><input id="oDue" type="date" value="${today()}"></div></div><div style="margin-top:20px"><div class="panel-title">Product Selection</div><div class="toolbar" style="margin-top:10px"><div class="field grow"><label>Search Product *</label><input id="productSearch" placeholder="Type product name or code and press Enter" autocomplete="off"></div></div><div id="productResults" class="product-picker"></div><div id="productRows"></div></div><div class="actions order-main-actions" style="margin-top:20px"><button class="btn btn-primary" onclick="createOrder('${esc(leadNo)}')">Add Order</button><button class="btn btn-outline" onclick="leadQuick('${esc(leadNo)}','No Answer')">No Answer</button><button class="btn btn-danger" onclick="leadQuick('${esc(leadNo)}','Rejected')">Reject</button></div></div><div class="card section-card" style="margin-top:16px"><div class="panel-title">Customer History</div><div id="history" class="history empty">Enter a contact number to view previous orders.</div></div><div class="card section-card order-note-card" style="margin-top:16px"><div class="panel-head"><div><div class="panel-title">Order Note</div><div class="panel-sub">Your own note. It is not printed on waybills. For a lead it is saved to the Note column of the Lead List.</div></div></div><textarea id="oNote" rows="3" placeholder="Write a note..." style="width:100%">${esc(l?.note||'')}</textarea><div class="actions" style="margin-top:10px"><button type="button" class="btn btn-primary" onclick="saveOrderNote('${esc(leadNo||'')}')">Save Note</button></div></div>`);$('#productSearch').addEventListener('input',renderProductSearch);$('#productSearch').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();moveProductSelection(1);return}if(e.key==='ArrowUp'){e.preventDefault();moveProductSelection(-1);return}if(e.key==='Enter'){e.preventDefault();const x=$('#productResults .product-result.keyboard-selected');if(x){x.click()}else addFirstProductFromSearch()}});$('#oTel').addEventListener('input',e=>customerHistory(e.target.value));$('#oCity').addEventListener('input',citySuggest);$('#oCity').addEventListener('focus',citySuggest);$('#oCity').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();moveCitySelection(1);return}if(e.key==='ArrowUp'){e.preventDefault();moveCitySelection(-1);return}if(e.key==='Enter'){const x=$('#cityDrop .city-option.keyboard-selected')||$('#cityDrop .city-option');if(x){e.preventDefault();x.click()}}});if(l?.tel)customerHistory(l.tel)}
let productActiveIndex=-1;
function moveProductSelection(delta){const opts=$$('#productResults .product-result:not([aria-disabled=\"true\"])');if(!opts.length)return;productActiveIndex=(productActiveIndex+delta+opts.length)%opts.length;opts.forEach(x=>x.classList.remove('keyboard-selected'));const x=opts[productActiveIndex];x.classList.add('keyboard-selected');x.scrollIntoView({block:'nearest'});}
function addFirstProductFromSearch(){const q=$('#productSearch')?.value.trim().toLowerCase();if(!q)return toast('Type a product name or code first');const list=companyProducts().filter(p=>`${p.name} ${p.code}`.toLowerCase().includes(q));if(!list.length)return toast('Product not found');const p=list[0];if(p.qty<=0){toast('Out of Stock');$('#productResults').innerHTML=`<div class="stock-warning">Out of Stock — ${esc(p.name)}</div>`;return}selectProduct(p.id)}
function renderProductSearch(){const q=$('#productSearch').value.toLowerCase().trim();const ps=companyProducts().filter(p=>!q||`${p.name} ${p.code}`.toLowerCase().includes(q));productActiveIndex=-1;$('#productResults').innerHTML=q?ps.map((p,i)=>p.qty>0?`<button class="product-result" data-index="${i}" onclick="selectProduct(${p.id})"><span><b>${esc(p.name)}</b><small>${esc(p.code)} • Available ${p.qty}</small></span><strong>${money(p.sell)}</strong></button>`:`<div class="product-result out-stock" aria-disabled="true"><span><b>${esc(p.name)}</b><small>${esc(p.code)} • Available 0 stock units</small></span><strong>Out of Stock</strong></div>`).join('')||'<div class="empty">No matching products</div>':''}
let orderProducts=[];
function reservedOrderQty(productId){const editingId=window.__editingPendingOrderId;if(!editingId)return 0;const original=db.orders.find(x=>x.id===editingId&&x.companyId===currentCompanyId());return (original?.items||[]).filter(x=>(x.productId||x.id)===productId).reduce((n,x)=>n+Number(x.qty||0),0)}
function selectProduct(id){const p=companyProducts().find(x=>x.id===id);if(!p)return;const existing=orderProducts.find(x=>x.id===id);if(Number(p.qty||0)<=0&&!reservedOrderQty(id))return toast('Out of Stock');if(existing)existing.qty+=1;else orderProducts.push({id:p.id,code:p.code,name:p.name,qty:1,price:p.sell});renderProductRows();$('#productSearch').value='';$('#productResults').innerHTML=''}
function renderProductRows(){const wrap=$('#productRows');if(!wrap)return;wrap.innerHTML=orderProducts.map((r,i)=>{const p=companyProducts().find(x=>x.id===r.id);const maxQty=Math.max(Number(r.qty)||1,(Number(p?.qty)||0)+reservedOrderQty(r.id));return `<div class="product-row"><div><label>Product</label><input value="${esc(r.name)}" readonly></div><div><label>Qty</label><input type="number" min="1" max="${maxQty}" value="${r.qty}" onchange="changeOrderQty(${i},this.value)"></div><div><label>Price (Rs)</label><input type="number" min="0" value="${r.price}" onchange="changeOrderPrice(${i},this.value)"></div><button class="btn btn-danger" onclick="removeOrderProduct(${i})">Remove</button></div>`}).join('')||'<div class="callout">Search a product above and press Enter to add. Price and quantity can be edited.</div>'}
function changeOrderQty(i,v){const n=Math.max(1,Number(v));const r=orderProducts[i];const p=companyProducts().find(x=>x.id===r.id);const allowed=(Number(p?.qty)||0)+reservedOrderQty(r.id);if(n>allowed)return toast('Not enough stock');r.qty=n;renderProductRows()}
function changeOrderPrice(i,v){orderProducts[i].price=Math.max(0,Number(v));renderProductRows()}
function removeOrderProduct(i){orderProducts.splice(i,1);renderProductRows()}
function normalizePhoneHistoryV29(v){let n=String(v||'').replace(/\D/g,'');if(n.startsWith('94')&&n.length>=11)n='0'+n.slice(2);return n}
function customerHistory(_tel){const raw=[$('#oTel')?.value||'', $('#oTel2')?.value||''].map(normalizePhoneHistoryV29).filter(n=>n.length>=7);const history=$('#history'),add=$('#addHistoryDataBtn');if(!history)return;if(!raw.length){history.innerHTML='Enter Contact Number 1 or 2 to view previous orders.';history.classList.add('empty');if(add)add.style.display='none';window.__customerHistoryRowsV29=[];return}const same=(a,b)=>{a=normalizePhoneHistoryV29(a);b=normalizePhoneHistoryV29(b);return a===b||(a.length>=9&&b.length>=9&&a.slice(-9)===b.slice(-9))};const rows=(db.orders||[]).filter(o=>raw.some(n=>same(o.tel,n)||same(o.tel2,n))).sort((a,b)=>new Date(b.createdAt||b.date)-new Date(a.createdAt||a.date));window.__customerHistoryRowsV29=rows;history.classList.remove('empty');if(add)add.style.display=rows.length?'inline-flex':'none';const liveStatus=o=>o.status==='Pending'?'Active':(o.status||'Active');history.innerHTML=rows.length?`<div class="history-match-note">${rows.length} matching previous order(s) found using either contact number.</div><div class="table-wrap history-table-wrap"><table class="table history-table"><thead><tr><th>#</th><th>Date</th><th>Product name</th><th>Price</th><th>Qty</th><th>Staff</th><th>Company</th><th>Status</th></tr></thead><tbody>${rows.slice(0,50).map((o,i)=>{const company=db.companies.find(c=>c.id===o.companyId);return `<tr><td>${i+1}</td><td>${esc(o.date||'')}</td><td><b>${esc(o.productSummary||'')}</b></td><td>${money(o.price)}</td><td>${o.qty||1}</td><td>${esc(o.createdBy||o.staff||'')}</td><td>${esc(company?.name||'')}</td><td>${badge(liveStatus(o))}</td></tr>`}).join('')}</tbody></table></div>`:'No previous order history found for either number.'}
function addCustomerDataFromHistoryV29(){const rows=window.__customerHistoryRowsV29||[];if(!rows.length)return toast('No customer history data to add');const o=rows[0];if($('#oName'))$('#oName').value=o.customer||o.name||'';if($('#oAddress'))$('#oAddress').value=o.address||'';if($('#oCity'))$('#oCity').value=o.city||'';if($('#oTel')&&!$('#oTel').value)$('#oTel').value=o.tel||'';if($('#oTel2')&&!$('#oTel2').value)$('#oTel2').value=o.tel2||'';if($('#oOther')&&!$('#oOther').value)$('#oOther').value=o.other||'';toast('Customer name and address added from latest history')}
let cityActiveIndex=-1;
function citySuggest(){const q=$('#oCity').value.toLowerCase().trim(),a=cities.filter(c=>c.toLowerCase().includes(q));const d=$('#cityDrop');cityActiveIndex=-1;if(!a.length){d.classList.remove('show');d.innerHTML='';return}d.innerHTML=a.map((c,i)=>`<div class="city-option" data-index="${i}" onclick="pickCity('${esc(c)}')">${esc(c)}</div>`).join('');d.classList.add('show')}
function pickCity(c){$('#oCity').value=c;$('#cityDrop').classList.remove('show');cityActiveIndex=-1}
function moveCitySelection(delta){const opts=$$('#cityDrop .city-option');if(!opts.length)return;cityActiveIndex=(cityActiveIndex+delta+opts.length)%opts.length;opts.forEach(x=>x.classList.remove('keyboard-selected'));const x=opts[cityActiveIndex];x.classList.add('keyboard-selected');x.scrollIntoView({block:'nearest'});}
function cancelLeadAction(leadNo){if(leadNo)return navTo('lead-list');navTo('pending-orders')}
function pendingOrders(){const a=db.orders.filter(o=>o.companyId===currentCompanyId()&&o.status==='Pending');layout(`<div class="toolbar"><div class="field grow"><label>Search</label><input id="pendSearch" oninput="filterSimple('pendTable','pendSearch')" placeholder="Order, customer, contact..."></div></div><div class="card table-card"><div class="table-wrap"><table class="table" id="pendTable"><thead><tr><th>#</th><th>Order ID</th><th>Date</th><th>Customer / Address / Phone 1 / Phone 2</th><th>Product</th><th>Price</th><th>Status</th><th>Action</th></tr></thead><tbody>${a.map((o,i)=>`<tr><td>${i+1}</td><td>${esc(o.id)}</td><td>${esc(o.date||'')}</td><td><b>${esc(o.customer)}</b><br>${esc(o.address||'')}<br>${esc(o.tel||'')}${o.tel2?'<br>'+esc(o.tel2):''}</td><td>${esc(o.productSummary||'')}</td><td>${money(o.price)}</td><td>${badge(o.status)}</td><td><div class="actions pending-row-actions"><button class="btn btn-outline icon-action" title="Edit order" aria-label="Edit order" onclick="editOrder('${o.id}')">✎</button><button class="btn btn-danger icon-action" title="Delete order" aria-label="Delete order" onclick="deletePendingOrder('${o.id}')">🗑</button></div></td></tr>`).join('')||'<tr><td colspan="8" class="empty">No pending orders.</td></tr>'}</tbody></table></div></div>`)}
function deletePendingOrder(id){const o=db.orders.find(x=>x.id===id&&x.companyId===currentCompanyId()&&x.status==='Pending');if(!o)return toast('Pending order not found');if(!confirm(`Delete pending order ${o.id}?`))return;(o.items||[]).forEach(r=>{const st=(db.stock[o.companyId]||[]).find(x=>x.productId===r.productId);if(st)st.qty+=Number(r.qty||0)});db.orders=db.orders.filter(x=>x.id!==id);save();toast('Order deleted');pendingOrders()}

function editOrder(id){const o=db.orders.find(x=>x.id===id&&x.companyId===currentCompanyId()&&x.status==='Pending');if(!o)return toast('Pending order not found');window.__editingPendingOrderId=o.id;newOrder(o.lead||'');$('#oName').value=o.customer||'';$('#oAddress').value=o.address||'';$('#oCity').value=o.city||'';$('#oTel').value=o.tel||'';$('#oTel2').value=o.tel2||'';$('#oOther').value=o.other||'';$('#oVariant').value=o.variant||'';$('#oDue').value=o.due||today();$('#oNote').value=o.note||'';orderProducts=(o.items||[]).map(r=>{const productId=r.productId||r.id;const p=companyProducts().find(x=>x.id===productId)||{};return {id:productId,productId,code:r.code||p.code||'',name:r.name||p.name||'Product',qty:Number(r.qty)||1,price:Number(r.price)||0}});renderProductRows();const btn=document.querySelector('.order-form-card .order-main-actions .btn-primary');if(btn){btn.textContent='Update';btn.setAttribute('onclick',`updatePendingOrder('${o.id}')`)}const title=document.querySelector('.order-form-card .panel-title');if(title)title.textContent='Edit Pending Order';toast('Order loaded for editing')}
function updatePendingOrder(id){const o=db.orders.find(x=>x.id===id&&x.companyId===currentCompanyId()&&x.status==='Pending');if(!o)return toast('Pending order not found');const name=$('#oName').value.trim(),address=$('#oAddress').value.trim(),city=$('#oCity').value.trim(),tel=$('#oTel').value.trim();if(!name||!address||!city||!tel||!orderProducts.length)return toast('Customer name, address, town, phone and product are required');const oldItems=o.items||[];for(const r of orderProducts){const productId=r.id||r.productId;const p=companyProducts().find(x=>x.id===productId);const oldQty=oldItems.filter(x=>(x.productId||x.id)===productId).reduce((n,x)=>n+Number(x.qty||0),0);if(!p&&!oldQty)return toast(`${r.name}: product not found`);if(Number(r.qty)>Number(p?.qty||0)+oldQty)return toast(`${r.name}: insufficient stock`);if(Number(r.price)<=0||Number(r.qty)<=0)return toast(`${r.name}: enter valid price and quantity`)}oldItems.forEach(r=>{const productId=r.productId||r.id;const st=(db.stock[o.companyId]||[]).find(x=>x.productId===productId);if(st)st.qty+=Number(r.qty||0)});orderProducts.forEach(r=>{const productId=r.id||r.productId;const st=(db.stock[o.companyId]||[]).find(x=>x.productId===productId);if(st)st.qty-=Number(r.qty||0)});Object.assign(o,{customer:name,address,city,tel,tel2:$('#oTel2').value.trim(),other:$('#oOther').value.trim(),variant:$('#oVariant').value.trim(),note:$('#oNote').value.trim(),due:$('#oDue').value,items:orderProducts.map(r=>({productId:r.id||r.productId,code:r.code,name:r.name,qty:Number(r.qty),price:Number(r.price)})),productSummary:orderProducts.map(r=>`${r.name} × ${r.qty}`).join(', '),qty:orderProducts.reduce((n,r)=>n+Number(r.qty),0),price:orderProducts.reduce((n,r)=>n+Number(r.qty)*Number(r.price),0),updatedAt:new Date().toISOString()});save();window.__editingPendingOrderId='';orderProducts=[];toast('Order updated');location.hash='pending-orders';render()}
function searchOrders(){layout(`<div class="toolbar"><div class="field"><label>Start Date</label><input id="soStart" type="date" value="${today()}"></div><div class="field"><label>End Date</label><input id="soEnd" type="date" value="${today()}"></div><div class="field"><label>Status</label><select id="soStatus"><option value="">All</option><option>Pending</option><option>Shipped</option><option>Delivered</option><option>Returned</option></select></div><div class="field grow"><label>Search</label><input id="soSearch" placeholder="Order, customer, phone..."></div></div><div class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Order ID</th><th>Date</th><th>Customer</th><th>Tel</th><th>Products</th><th>Qty</th><th>Price</th><th>Status</th></tr></thead><tbody id="soBody"></tbody></table></div></div>`);['soStart','soEnd','soStatus','soSearch'].forEach(id=>$('#'+id).addEventListener('input',renderOrderSearch));renderOrderSearch()}
function renderOrderSearch(){const sd=$('#soStart').value,ed=$('#soEnd').value,st=$('#soStatus').value,q=$('#soSearch').value.toLowerCase(),a=db.orders.filter(o=>o.companyId===currentCompanyId()&&(!sd||o.date>=sd)&&(!ed||o.date<=ed)&&(!st||o.status===st)&&(!q||JSON.stringify(o).toLowerCase().includes(q)));$('#soBody').innerHTML=a.map((o,i)=>`<tr><td>${i+1}</td><td>${o.id}</td><td>${o.date}</td><td>${esc(o.customer)}</td><td>${esc(o.tel)}</td><td>${esc(o.productSummary)}</td><td>${o.qty}</td><td>${money(o.price)}</td><td>${badge(o.status)}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">No matching orders.</td></tr>'}
function leadQuick(no,status){const l=db.leads.find(x=>x.no===no);if(!l){navTo('lead-list');return}l.status=status;l.updatedAt=new Date().toISOString();save();location.hash='lead-list';render();}
function createOrder(leadNo){const validation=[];const name=$('#oName').value.trim(),address=$('#oAddress').value.trim(),city=$('#oCity').value.trim(),phone=$('#oTel').value.trim();if(!name)validation.push('Customer name is required.');if(!address)validation.push('Address is required.');if(!city)validation.push('Town / City is required.');if(!phone)validation.push('Contact number is required.');if(!orderProducts.length)validation.push('Add at least one product.');for(const r of orderProducts){if(Number(r.price)<=0)validation.push(`${r.name}: valid price is required.`);const p=companyProducts().find(x=>x.id===r.id);if(!p)validation.push(`${r.name}: product not found.`);else if(p.qty<=0)validation.push(`${r.name}: Out of Stock.`);else if(r.qty>p.qty)validation.push(`${r.name}: only ${p.qty} in stock.`)}if(validation.length){$('#orderValidation').innerHTML=validation.map(v=>`<div>• ${esc(v)}</div>`).join('');$('#orderValidation').classList.add('show');return}$('#orderValidation').classList.remove('show');const comp=currentCompanyId();const o={id:'ORD-'+db.nextOrder++,lead:leadNo||'',date:today(),createdAt:new Date().toISOString(),companyId:comp,customer:name,address,city,tel:phone,tel2:$('#oTel2').value.trim(),other:$('#oOther').value.trim(),variant:$('#oVariant').value.trim(),note:$('#oNote').value.trim(),due:$('#oDue').value,status:'Pending',createdBy:currentUser().name,items:orderProducts.map(r=>({productId:r.id,code:r.code,name:r.name,qty:r.qty,price:r.price})),productSummary:orderProducts.map(r=>`${r.name} × ${r.qty}`).join(', '),qty:orderProducts.reduce((a,r)=>a+r.qty,0),price:orderProducts.reduce((a,r)=>a+r.qty*r.price,0)};db.orders.unshift(o);o.items.forEach(r=>{if(comp){const st=(db.stock[comp]||[]).find(x=>x.productId===r.productId);if(st)st.qty-=r.qty}});if(leadNo){const l=db.leads.find(x=>x.no===leadNo);if(l){l.status='OK';l.updatedAt=new Date().toISOString()}}save();orderProducts=[];if(leadNo&&$('#oNote')&&$('#oNote').value.trim()){const ll=db.leads.find(x=>x.no===leadNo);if(ll){ll.note=$('#oNote').value.trim();save()}}const dest=leadNo?'lead-list':'pending-orders';showLogoLoader(520,()=>{location.hash=dest;render()})}

function ship(){const a=db.orders.filter(o=>o.companyId===currentCompanyId()&&o.status==='Pending');layout(`<div class="toolbar"><div class="field"><label>User</label><select id="shipUser"><option value="">All Users</option>${db.staff.filter(s=>s.companyId===currentCompanyId()).map(s=>`<option>${esc(s.name)}</option>`).join('')}</select></div><div class="field grow"><label>Search</label><input id="shipSearch" placeholder="Customer, order, contact..." oninput="filterSimple('shipTable','shipSearch')"></div><div class="field"><label>Delivery Company</label><select id="shipCompany"><option>Domex</option><option>Prompt X</option><option>Pronto</option><option>SL Post</option><option>Other</option></select></div><div class="field"><label>Start Date</label><input id="shipStart" type="date" value="${today()}"></div><div class="field"><label>End Date</label><input id="shipEnd" type="date" value="${today()}"></div><button class="btn btn-primary" onclick="shipSelected()">Ship Selected</button></div><div class="card table-card"><div class="table-wrap"><table class="table" id="shipTable"><thead><tr><th>#</th><th>Ordered Date</th><th>Products</th><th>Qty</th><th>Price (Rs)</th><th>Del Fee</th><th>Customer</th><th>Address</th><th>Tel</th><th>Tel Two</th><th>Ready To Ship</th></tr></thead><tbody>${a.map((o,i)=>`<tr><td>${i+1}</td><td>${o.date}</td><td>${esc(o.productSummary)}</td><td>${o.qty}</td><td>${money(o.price)}</td><td>${money(300)}</td><td>${esc(o.customer)}</td><td>${esc(o.address)}<br>${esc(o.city)}</td><td>${esc(o.tel)}</td><td>${esc(o.tel2)}</td><td><input type="checkbox" class="ship-check" value="${o.id}"></td></tr>`).join('')||'<tr><td colspan="11" class="empty">No pending orders ready to ship.</td></tr>'}</tbody></table></div></div>`)}
function shipSelected(){const ids=$$('.ship-check:checked').map(x=>x.value);if(!ids.length)return toast('Select orders');const orders=ids.map(id=>db.orders.find(o=>o.id===id)).filter(Boolean);const now=new Date();orders.forEach(o=>{o.status='Shipped';o.shippedAt=now.toISOString();o.waybill='WB-'+db.nextWaybill++});const s={id:'SHIP-'+Date.now().toString().slice(-7),orderIds:orders.map(o=>o.id),q:orders.reduce((a,o)=>a+o.qty,0),company:$('#shipCompany').value,date:today(),time:now.toLocaleTimeString('en-LK',{hour:'2-digit',minute:'2-digit'}),shippedAt:now.toISOString(),user:currentUser().name,companyId:currentCompanyId()};db.shipped.unshift(s);save();toast('Orders shipped into one shipment file');showLogoLoader(620,()=>navTo('shipped-list'))}
function shippedList(){
 const all=db.shipped.slice().sort((a,b)=>new Date(b.shippedAt||b.date||0)-new Date(a.shippedAt||a.date||0));
 const cid=currentCompanyId();
 const a=db.session.role==='Owner'?all:all.filter(s=>s.companyId===cid);
 layout(`<div class="toolbar"><div class="field grow"><label>Search</label><input id="shSearch" oninput="filterSimple('shTable','shSearch')" placeholder="Shipment, waybill, company, user..."></div><button class="btn btn-dark" onclick="printSelectedWaybills(1)">Layout 1</button><button class="btn btn-dark" onclick="printSelectedWaybills(2)">Layout 2</button><button class="btn btn-dark" onclick="printSelectedWaybills(3)">Layout 3</button></div><div class="waybill-sheet-note">All historical shipped batches remain here. <b>Today</b> shipments are highlighted. Select shipped files and choose one of five distinct A4 waybill designs.</div><div class="card table-card"><div class="table-wrap"><table class="table" id="shTable"><thead><tr><th></th><th>#</th><th>Shipped Items (Q)</th><th>Deliver Company</th><th>Shipped Date &amp; Time</th><th>User</th><th>Action</th></tr></thead><tbody>${a.map((s,i)=>{const dt=s.shippedAt?new Date(s.shippedAt):null;const display=dt&&!isNaN(dt)?`${dt.toLocaleDateString('en-GB')} ${dt.toLocaleTimeString('en-LK',{hour:'2-digit',minute:'2-digit'})}`:`${esc(s.date||'')} ${esc(s.time||'')}`;const isToday=dt&&!isNaN(dt)&&dt.toISOString().slice(0,10)===today() || (!dt&&s.date===today());return `<tr class="${isToday?'shipment-today':''}"><td><input type="checkbox" class="ship-file-check" value="${s.id}"></td><td>${i+1}</td><td><b>${s.id}</b> (${s.q})<br><small>${s.orderIds.map(id=>db.orders.find(o=>o.id===id)?.waybill||'').filter(Boolean).join(', ')}</small></td><td>${esc(s.company)}</td><td>${esc(display)}${isToday?'<span class="today-chip">TODAY</span>':''}</td><td>${esc(s.user)}</td><td><button class="btn btn-outline" onclick="viewShipment('${s.id}')">View</button></td></tr>`}).join('')||'<tr><td colspan="7" class="empty">No shipped files.</td></tr>'}</tbody></table></div></div>`)}

function shipmentOrders(s){return s.orderIds.map(id=>db.orders.find(o=>o.id===id)).filter(Boolean)}
function viewShipment(id){const s=db.shipped.find(x=>x.id===id);if(!s)return;const os=shipmentOrders(s);const dt=s.shippedAt?new Date(s.shippedAt):null;const display=dt&&!isNaN(dt)?`${dt.toLocaleDateString('en-GB')} ${dt.toLocaleTimeString('en-LK',{hour:'2-digit',minute:'2-digit'})}`:`${esc(s.date||'')} ${esc(s.time||'')}`;const m=document.createElement('div');m.className='modal-mask';m.style.display='flex';m.innerHTML=`<div class="modal"><div class="modal-head"><div><div class="panel-title">${esc(s.id)}</div><div class="note">${esc(s.company)} • ${esc(display)}</div></div><button class="close" onclick="this.closest('.modal-mask').remove()">×</button></div><div class="table-wrap" style="margin-top:15px"><table class="table"><thead><tr><th>Waybill</th><th>Order</th><th>Customer</th><th>Product</th><th>Qty</th><th>Price</th></tr></thead><tbody>${os.map(o=>`<tr><td>${esc(o.waybill||'')}</td><td>${o.id}</td><td>${esc(o.customer)}</td><td>${esc(o.productSummary)}</td><td>${o.qty}</td><td>${money(o.price)}</td></tr>`).join('')}</tbody></table></div><div class="actions" style="margin-top:14px"><button class="btn btn-dark" onclick="printShipment('${s.id}',1)">Layout 1</button><button class="btn btn-dark" onclick="printShipment('${s.id}',2)">Layout 2</button><button class="btn btn-dark" onclick="printShipment('${s.id}',3)">Layout 3</button></div></div>`;document.body.appendChild(m)}
function barcodeSvg(value){const patterns=["212222","222122","222221","121223","121322","131222","122213","122312","132212","221213","221312","231212","112232","122132","122231","113222","123122","123221","223211","221132","221231","213212","223112","312131","311222","321122","321221","312212","322112","322211","212123","212321","232121","111323","131123","131321","112313","132113","132311","211313","231113","231311","112133","112331","132131","113123","113321","133121","313121","211331","231131","213113","213311","213131","311123","311321","331121","312113","312311","332111","314111","221411","431111","111224","111422","121124","121421","141122","141221","112214","112412","122114","122411","142112","142211","241211","221114","413111","241112","134111","111242","121142","121241","114212","124112","124211","411212","421112","421211","212141","214121","412121","111143","111341","131141","114113","114311","411113","411311","113141","114131","311141","411131","211412","211214","211232","2331112"];const start=104,vals=[...String(value).replace(/[^\x20-\x7E]/g,'')].map(ch=>ch.charCodeAt(0)-32);let seq=[start,...vals];let sum=start;vals.forEach((v,i)=>sum+=v*(i+1));seq.push(sum%103,106);let x=2,parts='';for(const code of seq){for(let i=0;i<patterns[code].length;i++){const w=Number(patterns[code][i]);if(i%2===0)parts+=`<rect x="${x}" y="8" width="${w}" height="78"/>`;x+=w*2}}return `<svg viewBox="0 0 ${x+3} 104" preserveAspectRatio="none"><g fill="#111">${parts}</g><text x="${(x+3)/2}" y="101" text-anchor="middle" font-size="11" fill="#111">${esc(value)}</text></svg>`}
function waybillCard(o,s,layoutNo=1){
 const c=db.companies.find(x=>x.id===o.companyId)||{};
 const wb=o.waybill||s.id;
 if(layoutNo===3){
  const amt=money(o.price);const phones=[o.tel,o.tel2].filter(Boolean).map(x=>`<div>${esc(x)}</div>`).join('');
  return `<section class="waybill wb3-wrap"><div class="wb3"><div class="invoice3-head"><div><div class="invoice3-brand">${esc(c.name||o.company||'APEX HOLDINGS')}</div><div class="invoice3-sub">CUSTOMER INVOICE &amp; CASH RECEIPT</div></div><div class="invoice3-paid">CASH ON DELIVERY</div></div><div class="invoice3-meta"><span>ORDER / WAYBILL NO. <b>${esc(wb)}</b></span><span>DATE <b>${esc(o.date||s.date||'')}</b></span></div><div class="invoice3-customer"><div class="invoice3-section">CUSTOMER DETAILS</div><div class="invoice3-customer-name">${esc(o.customer||'Customer')}</div><div>${esc(o.address||'')}${o.city?`, ${esc(o.city)}`:''}</div><div class="invoice3-phone">${phones}</div></div><table class="invoice3-items"><thead><tr><th>DESCRIPTION</th><th>COLOUR / SIZE</th><th>QTY</th><th>AMOUNT</th></tr></thead><tbody><tr><td>${esc(o.productSummary||'Product')}</td><td>${esc(o.variant||'-')}</td><td>${o.qty||1}</td><td>${amt}</td></tr></tbody></table><div class="invoice3-total"><span>AMOUNT TO COLLECT (COD)</span><b>${amt}</b></div><div class="invoice3-from"><div><b>SELLER</b><br>${esc(c.name||o.company||'APEX HOLDINGS')}</div><div>${esc(c.address||'Sri Lanka')}<br>${esc(c.phone||'')}</div></div><div class="invoice3-footer">Please check your order upon delivery. Thank you for your purchase!</div></div></section>`
 }
 if(layoutNo===4){
  return `<section class="waybill wb-classic"><div class="classic-head"><div class="classic-ref"><div class="classic-company">${esc(c.name||o.company||'APEX HOLDINGS')}</div><div class="classic-refno">Reference No: <b>${esc(wb)}</b></div></div><div class="classic-title">WAYBILL</div></div><div class="classic-to"><div class="classic-label">TO</div><div class="classic-name">${esc(o.customer)}</div><div class="classic-line">${esc(o.address)}</div><div class="classic-line">${esc(o.city||'')}</div><div class="classic-line classic-phone">${esc(o.tel)}${o.tel2?` &nbsp; / &nbsp; ${esc(o.tel2)}`:''}</div></div><div class="classic-from"><div class="classic-label small">FROM</div><div><b>${esc(c.name||o.company||'APEX HOLDINGS')}</b></div><div>${esc(c.address||'Sri Lanka')}</div><div>${esc(c.phone||'')}</div></div><div class="classic-item"><div><span>Product</span><b>${esc(o.productSummary)}</b></div><div><span>Color</span><b>${esc((o.variant||'-').split(/[\/|,-]/)[0]?.trim()||'-')}</b></div><div><span>Qty</span><b>${o.qty}</b></div></div><div class="classic-price">${money(o.price)}</div><div class="classic-footer">Thank you for your trust in us.</div></section>`
 }
 if(layoutNo===5){
  return `<section class="waybill wb-layout5"><div class="l5-header"><div class="l5-brand">${esc(c.name||o.company||'APEX HOLDINGS')}</div><div class="l5-waybill">WAYBILL</div></div><div class="l5-ref">REF <b>${esc(wb)}</b></div><div class="l5-grid"><div class="l5-to"><span>TO</span><h3>${esc(o.customer)}</h3><p>${esc(o.address)}</p><p>${esc(o.city||'')}</p><p class="l5-phone">${esc(o.tel)}${o.tel2?` &nbsp;•&nbsp; ${esc(o.tel2)}`:''}</p></div><div class="l5-amount"><small>COD / TOTAL</small><b>${money(o.price)}</b></div></div><div class="l5-product"><div><small>ITEM</small><b>${esc(o.productSummary)}</b></div><div><small>COLOR</small><b>${esc(String(o.variant||'-').split(/[\/|,-]/)[0]?.trim()||'-')}</b></div><div><small>QTY</small><b>${o.qty}</b></div></div><div class="l5-from"><small>FROM</small><b>${esc(c.name||o.company||'APEX HOLDINGS')}</b><span>${esc(c.address||'Sri Lanka')} • ${esc(c.phone||'')}</span></div><div class="l5-footer">Thank you for your trust in us. <span>${esc(s.company)}</span></div></section>`
 }
 return `<section class="waybill"><div class="wb-top"><div><div class="wb-brand">${esc(c.name||o.company||'APEX HOLDINGS')}</div><div class="wb-sub">DELIVERY WAYBILL</div></div><div class="wb-delivery">${esc(s.company)}</div></div><div class="wb-customer"><div class="wb-label">CUSTOMER</div><div class="wb-name">${esc(o.customer)}</div><div class="wb-address">${esc(o.address)}${o.city?', '+esc(o.city):''}</div><div class="wb-phones">${esc(o.tel)}${o.tel2?` &nbsp; | &nbsp; ${esc(o.tel2)}`:''}</div><div class="wb-variant-mini">Color: ${esc(String(o.variant||'-').split(/[\/|,-]/)[0]?.trim()||'-')}</div></div><div class="wb-company-meta">${esc(c.address||'Sri Lanka')} • ${esc(c.phone||'')}</div><div class="wb-mid"><div><div class="wb-small">WAYBILL NUMBER</div><div class="wb-number">${esc(wb)}</div></div><div class="wb-barcode">${barcodeSvg(wb)}</div></div><div class="wb-items"><span><b>${esc(o.productSummary)}</b></span><span>Color: ${esc(String(o.variant||'-').split(/[\/|,-]/)[0]?.trim()||'-')}</span><span>Qty: ${o.qty}</span><span>COD: ${money(o.price)}</span></div><div class="wb-footer">${esc(s.date)} • APEX HOLDINGS OMS</div></section>`
}

function printSelectedWaybills(layoutNo=1){const ids=$$('.ship-file-check:checked').map(x=>x.value);if(!ids.length)return toast('Select at least one shipped file');const os=[],seen=new Set();for(const id of ids){const s=db.shipped.find(x=>x.id===id);if(!s)continue;for(const o of shipmentOrders(s)){if(!seen.has(o.id)){os.push({o,s});seen.add(o.id)}}}if(!os.length)return toast('No orders available for printing');const base=os.map(x=>x.o),s0=os[0].s;printWaybillCards(base,s0,os,layoutNo)}
function printWaybillCards(orders,s,paired,layoutNo=1){const pairs=paired||orders.map(o=>({o,s}));const layoutClass=`layout-${layoutNo}`;const html=`<!doctype html><html><head><title>APEX HOLDINGS Waybills</title><style>@page{size:A4 portrait;margin:7mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff}.sheet{width:196mm;min-height:283mm;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr);gap:3mm}.waybill{border:1px solid #161616;border-radius:2mm;padding:4mm;display:flex;flex-direction:column;overflow:hidden;break-inside:avoid;background:#fff}.wb-top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1.2px solid #111;padding-bottom:2mm}.wb-brand{font-size:14px;font-weight:900;line-height:1.05}.wb-sub{font-size:7px;letter-spacing:1.8px;margin-top:1mm}.wb-delivery{font-size:7px;font-weight:800;text-transform:uppercase;text-align:right;border:1px solid #111;padding:1mm 1.5mm}.wb-customer{background:#f2f2f2;border-left:3px solid #111;padding:2.5mm;margin-top:2.5mm}.wb-label{font-size:6px;letter-spacing:1.2px;font-weight:900}.wb-name{font-size:13px;font-weight:900;margin-top:1mm}.wb-address{font-size:9px;font-weight:700;line-height:1.25;margin-top:1mm}.wb-phones{font-size:9px;font-weight:800;margin-top:1.4mm}.wb-variant-mini{font-size:6px;font-weight:500;line-height:1.2;margin-top:1.1mm;padding:.55mm 1mm;border:.35px solid #9b9b9b;border-radius:.6mm;color:#333;background:transparent}.wb-company-meta{font-size:6.5px;color:#444;margin-top:2mm;line-height:1.25}.wb-mid{display:grid;grid-template-columns:1fr 1.25fr;gap:2mm;align-items:center;margin-top:2mm}.wb-small{font-size:5.5px;font-weight:800;letter-spacing:.8px}.wb-number{font-size:13px;font-weight:900;letter-spacing:.6px;margin-top:1mm}.wb-barcode{height:17mm}.wb-barcode svg{width:100%;height:100%}.wb-items{font-size:7px;border-top:1px solid #bdbdbd;margin-top:1.5mm;padding-top:1.5mm;display:grid;gap:1mm}.wb-footer{margin-top:auto;border-top:1px dashed #8d8d8d;padding-top:1mm;font-size:5.8px;color:#555}.layout-2 .waybill{border-width:2px;border-radius:0}.layout-2 .wb-customer{background:#fff;border:1px solid #111;border-left:6px solid #111}.layout-2 .wb-top{border-bottom:2px solid #111}.layout-2 .wb-number{font-size:15px}.layout-3.sheet{height:283mm;min-height:283mm;display:grid;grid-template-columns:1fr;grid-template-rows:repeat(2,minmax(0,1fr));gap:0}.layout-3 .waybill{border:0;border-radius:0;padding:2.5mm;overflow:hidden;min-height:0}.wb3{height:100%;min-height:0;display:flex;flex-direction:column;gap:2mm;border:1px solid #172033;padding:4mm 5mm;color:#172033;background:#fff;overflow:hidden;font-size:9pt}.invoice3-head{display:flex;justify-content:space-between;align-items:center;gap:4mm;border-bottom:2px solid #172033;padding-bottom:3mm}.invoice3-brand{font-size:17pt;font-weight:900;letter-spacing:.4px;text-transform:uppercase}.invoice3-sub{font-size:7.5pt;font-weight:700;letter-spacing:1.2px;margin-top:1mm;color:#526071}.invoice3-paid{border:1.5px solid #172033;padding:2mm 3mm;font-size:8pt;font-weight:900;text-align:center;max-width:38%}.invoice3-meta{display:flex;justify-content:space-between;gap:4mm;font-size:8pt;padding:1mm 0}.invoice3-customer{border:1px solid #cbd2dc;border-radius:1mm;padding:3mm 4mm;line-height:1.4;min-height:25mm}.invoice3-section{font-size:7pt;font-weight:900;letter-spacing:1.2px;color:#526071;margin-bottom:1.5mm}.invoice3-customer-name{font-size:13pt;font-weight:900;margin-bottom:1mm}.invoice3-phone{display:flex;gap:4mm;font-weight:800;margin-top:1mm}.invoice3-items{width:100%;border-collapse:collapse;margin-top:1mm;font-size:8.5pt}.invoice3-items th{background:#edf0f4;text-align:left;font-size:7pt;letter-spacing:.5px;padding:2.5mm 2mm;border:1px solid #cbd2dc}.invoice3-items td{padding:3mm 2mm;border:1px solid #cbd2dc;vertical-align:top;overflow-wrap:anywhere}.invoice3-items th:nth-child(3),.invoice3-items td:nth-child(3){text-align:center;width:12%}.invoice3-items th:last-child,.invoice3-items td:last-child{text-align:right;width:22%;white-space:nowrap}.invoice3-total{display:flex;justify-content:space-between;align-items:center;background:#172033;color:#fff;padding:3mm 4mm;font-size:9pt;font-weight:800}.invoice3-total b{font-size:17pt}.invoice3-from{display:grid;grid-template-columns:1fr 1fr;gap:4mm;border-top:1px dashed #9aa4b2;padding-top:3mm;font-size:8pt;line-height:1.5}.invoice3-footer{margin-top:auto;border-top:1px solid #cbd2dc;padding-top:2mm;text-align:center;font-size:7.5pt;font-weight:700;color:#526071}.layout-4 .waybill{border:1.2px solid #111;border-radius:0;padding:4mm;background:#fff}.layout-4 .classic-head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #111;padding-bottom:2mm}.layout-4 .classic-company{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.3px}.layout-4 .classic-refno{font-size:7px;margin-top:1.1mm}.layout-4 .classic-title{font-size:18px;font-weight:900;letter-spacing:2px;line-height:1}.layout-4 .classic-to{margin-top:2.2mm;padding:2.3mm;background:#efefef;border:1px solid #111}.layout-4 .classic-label{font-size:6px;font-weight:900;letter-spacing:1.2px;margin-bottom:1mm}.layout-4 .classic-label.small{font-size:5.5px}.layout-4 .classic-name{font-size:11px;font-weight:900;margin-bottom:1mm}.layout-4 .classic-line{font-size:7.5px;font-weight:650;line-height:1.25}.layout-4 .classic-phone{font-weight:800;margin-top:1mm}.layout-4 .classic-from{margin-top:2mm;font-size:6.2px;line-height:1.35}.layout-4 .classic-item{display:grid;grid-template-columns:2fr .5fr;gap:2.5mm;margin-top:2mm;border-top:1px solid #111;border-bottom:1px solid #111;padding:1.7mm 0;font-size:6.5px}.layout-4 .classic-item span{display:block;font-size:5.2px;text-transform:uppercase;letter-spacing:.7px;color:#555;margin-bottom:.7mm}.layout-4 .classic-item b{font-size:7.2px}.layout-4 .classic-price{margin-top:2.2mm;background:#111;color:#fff;font-weight:900;font-size:16px;text-align:center;padding:3.2mm 2mm;border-radius:0;letter-spacing:.5px}.layout-4 .classic-price::before{content:'PRICE / COD  ';font-size:6px;letter-spacing:1px;font-weight:700;vertical-align:middle;margin-right:2mm}.layout-4 .classic-footer{margin-top:auto;border-top:1px solid #111;padding-top:1.5mm;text-align:center;font-size:6px;font-weight:700;letter-spacing:.2px}.layout-4 .wb-delivery,.layout-4 .wb-barcode,.layout-4 .wb-mid,.layout-4 .wb-sub,.layout-4 .wb-company-meta,.layout-4 .wb-items,.layout-4 .wb-footer{display:none}.layout-5 .waybill{border:1.6px solid #111;border-radius:4px;padding:3.4mm;background:#fff}.layout-5 .l5-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #111;padding-bottom:1.8mm}.layout-5 .l5-brand{font-size:10px;font-weight:900;text-transform:uppercase;max-width:62%}.layout-5 .l5-waybill{font-size:17px;font-weight:900;letter-spacing:1.8px}.layout-5 .l5-ref{font-size:6.2px;letter-spacing:.8px;margin-top:1.5mm}.layout-5 .l5-grid{display:grid;grid-template-columns:1.7fr .9fr;gap:2.2mm;margin-top:2.2mm}.layout-5 .l5-to{border:1px solid #111;padding:2.3mm;background:#f3f3f3}.layout-5 .l5-to span,.layout-5 .l5-amount small,.layout-5 .l5-product small,.layout-5 .l5-from small{font-size:5.2px;font-weight:900;letter-spacing:1px}.layout-5 .l5-to h3{font-size:11px;margin:1mm 0}.layout-5 .l5-to p{font-size:6.8px;margin:1mm 0;line-height:1.25}.layout-5 .l5-phone{font-weight:800}.layout-5 .l5-amount{background:#111;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2mm}.layout-5 .l5-amount b{font-size:12px;margin-top:1.3mm}.layout-5 .l5-product{display:grid;grid-template-columns:1.9fr .55fr;gap:2mm;margin-top:2mm;border-top:1px solid #111;border-bottom:1px solid #111;padding:1.5mm 0}.layout-5 .l5-product div{display:grid;gap:.8mm}.layout-5 .l5-product b{font-size:7px;line-height:1.2}.layout-5 .l5-from{display:grid;grid-template-columns:auto 1fr;column-gap:1.5mm;row-gap:.7mm;margin-top:2mm;font-size:5.6px}.layout-5 .l5-from small{grid-column:1/-1}.layout-5 .l5-from b{font-size:6px}.layout-5 .l5-from span{font-size:5.5px;color:#444}.layout-5 .l5-footer{margin-top:auto;border-top:1px dashed #777;padding-top:1.2mm;font-size:5.5px;text-align:center;font-weight:700}.layout-5 .l5-footer span{float:right;font-weight:800}.layout-4 .wb-delivery,.layout-4 .wb-barcode,.layout-4 .wb-mid,.layout-4 .wb-sub,.layout-4 .wb-company-meta,.layout-4 .wb-items,.layout-4 .wb-footer{display:none}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}.sheet{page-break-after:always;break-after:page}.sheet:last-child{page-break-after:auto;break-after:auto}</style></head><body>${Array.from({length:Math.ceil(pairs.length/(layoutNo===3?2:6))},(_,k)=>{const perPage=layoutNo===3?2:6;return `<div class="sheet ${layoutClass}">${pairs.slice(k*perPage,k*perPage+perPage).map(({o,s})=>waybillCard(o,s,layoutNo)).join('')}</div>`}).join('')}<script>window.onload=()=>{window.focus()}<\/script></body></html>`;const w=window.open('','_blank','width=900,height=1100');if(!w)return toast('Allow popups to print');w.document.write(html);w.document.close()}

function addReturn(){layout(`<div class="card section-card" style="max-width:820px"><div class="panel-title">Add Return</div><p class="note">Enter a waybill. The first shipped order in that waybill is returned in this standalone demo and its stock is restored.</p><div class="toolbar"><div class="field grow"><label>Waybill / Tracking No</label><input id="returnWaybill" placeholder="WB-5001"></div><button class="btn btn-primary" onclick="processReturn()">Add Return</button></div></div>`)}
function processReturn(){const id=$('#returnWaybill').value.trim(),s=db.shipped.find(x=>x.id===id);if(!s)return toast('Waybill not found');const o=shipmentOrders(s).find(x=>x.status==='Shipped');if(!o)return toast('No shipped order available');o.status='Returned';o.returnedAt=new Date().toISOString();o.items.forEach(r=>addCompanyStock(o.companyId,r.productId,r.qty));db.returned.unshift({orderId:o.id,tracking:s.id,product:o.productSummary,date:today(),price:o.price,qty:o.qty,companyId:o.companyId});save();toast('Return added and stock restored');navTo('returned-list')}
function returnedList(){const a=db.returned.filter(r=>r.companyId===currentCompanyId());layout(`<div class="toolbar"><div class="field grow"><label>Search</label><input id="retSearch" oninput="filterSimple('retTable','retSearch')" placeholder="Order ID, tracking, product..."></div><div class="field"><label>Start Date</label><input id="retStart" type="date" value="${today()}"></div><div class="field"><label>End Date</label><input id="retEnd" type="date" value="${today()}"></div></div><div class="card table-card"><div class="table-wrap"><table class="table" id="retTable"><thead><tr><th>#</th><th>Order ID</th><th>Tracking No</th><th>Product Name</th><th>Return Date</th><th>View</th><th>Price</th><th>Qty</th></tr></thead><tbody>${a.map((r,i)=>`<tr><td>${i+1}</td><td>${r.orderId}</td><td>${r.tracking}</td><td>${esc(r.product)}</td><td>${r.date}</td><td><button class="btn btn-outline" onclick="toast('Return details opened')">View</button></td><td>${money(r.price)}</td><td>${r.qty}</td></tr>`).join('')||'<tr><td colspan="8" class="empty">No returns yet.</td></tr>'}</tbody></table></div></div>`)}
function createCompany(){if(db.session.role!=='Owner')return toast('Owner only');layout(`<div class="card section-card" style="max-width:900px"><div class="panel-title">Create Company</div><p class="note">Create a new partner company. The Owner controls company credentials; the company Admin cannot edit their own login.</p><div class="form-grid"><div class="field"><label>Company Name</label><input id="cName"></div><div class="field"><label>Admin Email / Username</label><input id="cEmail" type="email"></div><div class="field"><label>Admin Password</label><input id="cPass"></div><div class="field"><label>Manager Name (with initials) *</label><input id="cManager" required></div><div class="field"><label>Company Address *</label><input id="cAddress" required></div><div class="field"><label>Company Phone</label><input id="cPhone"></div></div><div class="actions" style="margin-top:15px"><button class="btn btn-primary" onclick="createCompanyNow()">Create Company</button><button class="btn btn-outline" onclick="navTo('company-list')">Company List</button></div></div>`)}
function createCompanyNow(){if(db.session.role!=='Owner')return toast('Owner only');const name=$('#cName').value.trim(),email=$('#cEmail').value.trim(),pass=$('#cPass').value,manager=$('#cManager').value.trim(),address=$('#cAddress').value.trim(),phone=$('#cPhone').value.trim();if(!name||!email||!pass)return toast('Complete company credentials');if(db.staff.some(s=>s.email.toLowerCase()===email.toLowerCase()))return toast('Email already exists');const id='CMP-'+String(db.companies.length+1).padStart(3,'0');const c={id,name,manager,address,phone,sales:0,active:true,adminEmail:email,adminPassword:pass,created:today()};db.companies.push(c);db.staff.push({id:'ST-'+Date.now(),name:(manager||name)+' Admin',type:'Admin',companyId:id,company:name,email,password:pass,phone:phone||''});db.stock[id]=db.products.map(p=>({productId:p.id,qty:0}));save();toast('Company created');navTo('company-list')}
function editCompany(id){if(db.session.role!=='Owner')return toast('Owner only');const c=db.companies.find(x=>x.id===id);if(!c)return;layout(`<div class="card section-card" style="max-width:900px"><div class="panel-title">Edit Company Login</div><p class="note">Only the Owner can change this company's Admin username/password.</p><div class="form-grid"><div class="field"><label>Company Name</label><input id="ecName" value="${esc(c.name)}"></div><div class="field"><label>Admin Email / Username</label><input id="ecEmail" value="${esc(c.adminEmail)}"></div><div class="field"><label>Admin Password</label><input id="ecPass" type="password" autocomplete="new-password" placeholder="Leave blank to keep current password"></div><div class="field"><label>Manager Name</label><input id="ecManager" value="${esc(c.manager||'')}"></div><div class="field"><label>Company Address</label><input id="ecAddress" value="${esc(c.address||'')}"></div><div class="field"><label>Company Phone</label><input id="ecPhone" value="${esc(c.phone||'')}"></div></div><div class="actions" style="margin-top:15px"><button class="btn btn-primary" onclick="saveCompanyEdit('${c.id}')">Save Changes</button><button class="btn btn-outline" onclick="navTo('company-list')">Cancel</button></div></div>`)}
function saveCompanyEdit(id){if(db.session.role!=='Owner')return toast('Owner only');const c=db.companies.find(x=>x.id===id);if(!c)return;const email=$('#ecEmail').value.trim(),pass=$('#ecPass').value;if(!email)return toast('Admin email is required');if(db.staff.some(s=>s.companyId!==id&&s.email.toLowerCase()===email.toLowerCase()))return toast('Email already exists');Object.assign(c,{name:$('#ecName').value.trim(),manager:$('#ecManager').value.trim(),address:$('#ecAddress').value.trim(),phone:$('#ecPhone').value.trim(),adminEmail:email});if(pass)c.adminPassword=pass;const admin=db.staff.find(s=>s.companyId===id&&s.type==='Admin');if(admin){Object.assign(admin,{name:(c.manager||c.name)+' Admin',company:c.name,email,phone:c.phone||''});if(pass)admin.password=pass}save();toast('Company login updated');companyList()}
function toggleCompany(id){if(db.session.role!=='Owner')return toast('Owner only');const c=db.companies.find(x=>x.id===id);if(!c)return;c.active=!c.active;save();toast(c.active?'Company unblocked':'Company blocked');companyList()}
function deleteCompany(id){if(db.session.role!=='Owner')return toast('Owner only');const c=db.companies.find(x=>x.id===id);if(!c)return;if(!confirm(`Delete ${c.name}? This removes the company, staff, stock, leads, orders, shipments, returns and stock requests.`))return;db.companies=db.companies.filter(x=>x.id!==id);db.staff=db.staff.filter(s=>s.companyId!==id);delete db.stock[id];db.leads=db.leads.filter(l=>l.companyId!==id);db.orders=db.orders.filter(o=>o.companyId!==id);db.shipped=db.shipped.filter(x=>x.companyId!==id);db.returned=db.returned.filter(x=>x.companyId!==id);db.stockRequests=db.stockRequests.filter(r=>r.companyId!==id);save();toast('Company deleted');companyList()}
function companyList(){if(db.session.role!=='Owner')return toast('Owner only');layout(`<div class="toolbar"><button class="btn btn-primary" onclick="navTo('create-company')">+ Create Company</button></div><div class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Company ID</th><th>Company</th><th>Status</th><th>Admin Username</th><th>Staff</th><th>Action</th></tr></thead><tbody>${db.companies.map((c,i)=>`<tr><td>${i+1}</td><td>${esc(c.id)}</td><td><b>${esc(c.name)}</b><br><small>${esc(c.address||'')}</small></td><td>${c.active!==false?badge('Active'):'<span class="badge rejected">Blocked</span>'}</td><td>${esc(c.adminEmail)}</td><td>${db.staff.filter(s=>s.companyId===c.id).length}</td><td><div class="actions"><button class="btn btn-outline" onclick="editCompany('${c.id}')">Edit Login</button><button class="btn ${c.active!==false?'btn-gold':'btn-primary'}" onclick="toggleCompany('${c.id}')">${c.active!==false?'Block':'Unblock'}</button><button class="btn btn-danger" onclick="deleteCompany('${c.id}')">Delete</button></div></td></tr>`).join('')}</tbody></table></div></div>`)}
function newStaff(){if(!['Owner','Admin'].includes(db.session.role))return toast('Owner/Admin only');const companyId=db.session.role==='Owner'?db.companies[0]?.id:currentCompanyId();layout(`<div class="card section-card" style="max-width:820px"><div class="panel-title">New Staff</div><p class="note">Company Admin can create staff only inside their company. Owner can create for any company.</p><div class="form-grid"><div class="field"><label>Name</label><input id="sName"></div><div class="field"><label>User Type</label><select id="sType"><option>Sales</option><option>Shipping</option></select></div><div class="field"><label>Company</label><select id="sCompany">${db.companies.filter(c=>db.session.role==='Owner'||c.id===companyId).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label>Email / Username</label><input id="sEmail" type="email"></div><div class="field"><label>Password</label><input id="sPass"></div></div><div class="actions" style="margin-top:15px"><button class="btn btn-primary" onclick="createStaffNow()">Create Staff Login</button><button class="btn btn-outline" onclick="navTo('staff-list')">Staff List</button></div></div>`)}
function createStaffNow(){if(!['Owner','Admin'].includes(db.session.role))return toast('Owner/Admin only');const n=$('#sName').value.trim(),type=$('#sType').value,cid=$('#sCompany').value,email=$('#sEmail').value.trim(),pass=$('#sPass').value;if(!n||!cid||!email||!pass)return toast('Complete staff login details');if(db.staff.some(s=>s.email.toLowerCase()===email.toLowerCase()))return toast('Email already exists');if(db.session.role==='Admin'&&cid!==currentCompanyId())return toast('You can only create staff for your company');const c=db.companies.find(x=>x.id===cid);db.staff.push({id:'ST-'+Date.now(),name:n,type,companyId:cid,company:c.name,email,password:pass,phone:''});save();toast('Staff login created');navTo('staff-list')}
function editStaff(id){if(!['Owner','Admin'].includes(db.session.role))return toast('No access');const s=db.staff.find(x=>x.id===id);if(!s|| (db.session.role==='Admin' && (s.companyId!==currentCompanyId()||s.type==='Admin')))return toast('Company Admin can edit staff only');layout(`<div class="card section-card" style="max-width:760px"><div class="panel-title">Edit Staff Login</div><p class="note">${db.session.role==='Owner'?'Owner can edit this login.':'You can edit Sales / Shipping staff login details in your company only.'}</p><div class="form-grid"><div class="field"><label>Name</label><input id="esName" value="${esc(s.name)}"></div><div class="field"><label>User Type</label><input value="${esc(s.type)}" disabled></div><div class="field"><label>Email / Username</label><input id="esEmail" value="${esc(s.email)}"></div><div class="field"><label>Password</label><input id="esPass" type="password" autocomplete="new-password" placeholder="Leave blank to keep current password"></div><div class="field"><label>Phone</label><input id="esPhone" value="${esc(s.phone||'')}"></div></div><div class="actions" style="margin-top:15px"><button class="btn btn-primary" onclick="saveStaffEdit('${s.id}')">Save Changes</button><button class="btn btn-outline" onclick="navTo('staff-list')">Cancel</button></div></div>`)}
function saveStaffEdit(id){if(!['Owner','Admin'].includes(db.session.role))return toast('No access');const s=db.staff.find(x=>x.id===id);if(!s)return;if(db.session.role==='Admin'&&(s.companyId!==currentCompanyId()||s.type==='Admin'))return toast('Not allowed');const email=$('#esEmail').value.trim(),pass=$('#esPass').value;if(!email)return toast('Email is required');if(db.staff.some(x=>x.id!==id&&x.email.toLowerCase()===email.toLowerCase()))return toast('Email already exists');Object.assign(s,{name:$('#esName').value.trim(),email,phone:$('#esPhone').value.trim()});if(pass)s.password=pass;if(s.type==='Admin'){const c=db.companies.find(x=>x.id===s.companyId);if(c){c.adminEmail=email;if(pass)c.adminPassword=pass}}save();toast('Staff login updated');staffList()}
function staffList(){if(!['Owner','Admin'].includes(db.session.role))return toast('No access');const a=db.session.role==='Owner'?db.staff:db.staff.filter(s=>s.companyId===currentCompanyId());layout(`<div class="toolbar">${db.session.role!=='Sales'&&db.session.role!=='Shipping'?'<button class="btn btn-primary" onclick="navTo(\'new-staff\')">+ New Staff</button>':''}</div><div class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Staff ID</th><th>Name</th><th>User Type</th><th>Company</th><th>Email / Username</th><th>Action</th></tr></thead><tbody>${a.map((s,i)=>`<tr><td>${i+1}</td><td>${s.id}</td><td><b>${esc(s.name)}</b></td><td>${badge(s.type)}</td><td>${esc(s.company)}</td><td>${esc(s.email)}</td><td>${(db.session.role==='Owner'||s.type!=='Admin')?`<button class="btn btn-outline" onclick="editStaff('${s.id}')">Edit Login</button>`:'<span class="note">Owner controls</span>'}</td></tr>`).join('')}</tbody></table></div></div>`) }
function commissionRate(){if(!['Owner','Admin'].includes(db.session.role))return toast('No access');layout(`<div class="card section-card"><div class="panel-title">Commission Rate</div><p class="note">Sales staff commission is fixed at Rs. 100 per completed order.</p><div class="mini-stat" style="margin-top:14px"><b>Rs. 100</b><span>Sales staff commission per order</span></div></div>`)}
function saveCommission(){toast('Sales commission is fixed at Rs. 100 per order')}
function filterSimple(tableId,inputId){const q=($('#'+inputId)?.value||'').toLowerCase();$$(`#${tableId} tbody tr`).forEach(tr=>tr.style.display=tr.innerText.toLowerCase().includes(q)?'':'none')}
/* ========================= APEX OMS REQUESTED EXTENSIONS ========================= */

// ---- Company-scoped products + unlimited Owner master stock ----
const _v11CompanyProducts = companyProducts;
function companyProducts(){
  if(db.session?.role==='Owner') return db.products.map(p=>({...p,qty:'Unlimited',isUnlimited:true}));
  const sid=currentCompanyId();
  if(!sid) return [];
  const company=db.companies.find(c=>c.id===sid);
  const visible=db.products.filter(p=>p.companyId===sid || (!company?.catalogIsolated && !p.companyId));
  return visible.map(p=>({...p,qty:(db.stock[sid]||[]).find(x=>x.productId===p.id)?.qty||0,isUnlimited:false}));
}
function addCompanyStock(companyId,pid,qty){
  if(!db.stock[companyId])db.stock[companyId]=[];
  let r=db.stock[companyId].find(x=>x.productId===pid);
  if(!r){r={productId:pid,qty:0};db.stock[companyId].push(r)}
  r.qty+=qty;
}
function approveStockRequest(id){
  if(db.session.role!=='Owner')return toast('Owner only');
  const r=db.stockRequests.find(x=>x.id===id),p=db.products.find(x=>x.id===r?.productId);
  if(!r||!p)return;
  if(r.status!=='Pending')return toast('Request already processed');
  if(Number(r.payment)<Number(r.total||r.qty*45))return toast('Payment is not sufficient');
  addCompanyStock(r.companyId,r.productId,r.qty); // Owner stock is unlimited and never decreases.
  r.status='Approved';r.approvedAt=new Date().toISOString();r.approvedBy=owner.name;
  save();toast(`${r.qty} units allocated to ${r.companyName}`);navTo('stock-purchase');
}
function createCompanyProduct(){
  if(db.session.role!=='Admin')return toast('Company Admin only');
  const name=$('#npName').value.trim(),code=$('#npCode').value.trim(),sell=Number($('#npSell').value),cid=currentCompanyId();
  if(!name||!code||!Number.isFinite(sell)||sell<0)return toast('Enter product name, code and selling price');
  const catalogCompany=db.companies.find(c=>c.id===cid);
  if(db.products.some(p=>p.code.toLowerCase()===code.toLowerCase() && (p.companyId===cid || (!catalogCompany?.catalogIsolated && !p.companyId))))return toast('Product code already exists in this company');
  const id=Math.max(0,...db.products.map(p=>Number(p.id)||0))+1;
  db.products.push({id,code,name,cost:45,sell,ownerQty:0,companyId:cid});
  (db.stock[cid] ||= []).push({productId:id,qty:0});save();toast('Product created for this company with 0 stock');navTo('stock-list');
}

// ---- Dashboard without any profit/profit-trend content ----
function dashboard(){
  const comp=currentCompanyId();
  const orders=db.orders.filter(o=>!comp||o.companyId===comp);
  const ship=db.shipped.filter(x=>!comp||x.companyId===comp);
  const ret=db.returned.filter(x=>!comp||x.companyId===comp);
  const sales=orders.reduce((a,o)=>a+Number(o.price||0),0);
  const lb=leaderboardData();
  layout(`<div class="dashboard-hero premium cloud-hero"><div><div class="eyebrow">APEX HOLDINGS • CLOUD OMS</div><h2>${db.session.role==='Owner'?'Owner Dashboard':esc(currentUser().company)}</h2><p>Live operations, company performance, stock movement and order intelligence in one place.</p></div><div class="hero-badge colorful-badge"><span>Cloud Ready</span><b>${today()}</b></div></div>
  <div class="grid kpi-grid dashboard-kpis">
   <div class="card kpi gradient-blue"><div class="label">TOTAL ORDERS</div><div class="value">${orders.length}</div><div class="meta">All created orders</div></div>
   <div class="card kpi gradient-amber"><div class="label">PENDING ORDERS</div><div class="value">${orders.filter(o=>o.status==='Pending').length}</div><div class="meta">Waiting to ship</div></div>
   <div class="card kpi gradient-cyan"><div class="label">SHIPPED</div><div class="value">${orders.filter(o=>o.status==='Shipped').length}</div><div class="meta">Shipped orders</div></div>
   <div class="card kpi gradient-red"><div class="label">RETURNED</div><div class="value">${ret.length}</div><div class="meta">Received back</div></div>
   <div class="card kpi gradient-green"><div class="label">DELIVERED</div><div class="value">${orders.filter(o=>o.status==='Delivered').length}</div><div class="meta">Completed orders</div></div>
   <div class="card kpi gradient-purple"><div class="label">SALES</div><div class="value small-money">${money(sales)}</div><div class="meta">${comp?'This company':'All companies'}</div></div>
  </div>
  <div class="dashboard-main-grid premium-grid">
   <div class="card panel chart-card premium-panel"><div class="panel-head"><div><div class="panel-title">All Company Comparison</div><div class="panel-sub">7-day order comparison • each company has a separate color</div></div><div class="chart-live-badge">LIVE</div></div><div class="chart">${chart()}</div></div>
   <div class="card panel leaderboard-card premium-panel"><div class="panel-head"><div><div class="panel-title">Leaderboard</div><div class="panel-sub">Open a category to view the Top 50</div></div></div><div class="leader-mini-grid">${leaderboardSection('Best Call Centre',lb.bestCall,'bestCall')}${leaderboardSection('Highest Sales Company',lb.highest,'highest')}${leaderboardSection('Top Purchase',lb.purchases,'purchases')}${leaderboardSection('Emerging Entrepreneur',lb.emerging,'emerging')}${leaderboardSection('Sales Performance',lb.salesCompanies,'salesCompanies')}</div></div>
  </div>
  <button class="card company-summary-card" onclick="navTo('company-list')"><span class="company-summary-icon">▦</span><span><b>Company List</b><small>Click to view all companies</small></span><strong>${db.companies.length}</strong><span class="company-summary-arrow">→</span></button>`);
}

// ---- Leaderboard: Best Call Centre uses Leads + Orders + Delivered. Highest sales uses Delivered sales only. ----
function medalMarkup(rank){
  if(rank===1)return '<span class="medal medal-gold" title="1st">★</span>';
  if(rank===2)return '<span class="medal medal-silver" title="2nd">★</span>';
  if(rank===3)return '<span class="medal medal-bronze" title="3rd">★</span>';
  if(rank<=10)return `<span class="medal medal-blue" title="${rank}th">${rank}</span>`;
  return `<span class="rank-badge">${rank}</span>`;
}
function staffOrderOwnerMatch(o,s){return o.companyId===s.companyId && (o.createdById===s.id || o.staffId===s.id || o.createdBy===s.name || o.staff===s.name)}
function leaderboardData(){
  const companyById=new Map(db.companies.map(c=>[c.id,c.name]));
  const leadMap=new Map();
  db.leads.forEach(l=>{const k=l.assignedStaffId||l.staff;if(k)leadMap.set(k,(leadMap.get(k)||0)+1)});
  const bestCall=db.staff.filter(s=>s.type==='Sales').map(s=>{
    const leads=leadMap.get(s.id)||leadMap.get(s.name)||0;
    const orderRows=db.orders.filter(o=>staffOrderOwnerMatch(o,s));
    const orders=orderRows.length;
    const delivered=orderRows.filter(o=>o.status==='Delivered').length;
    return {name:s.name,company:companyById.get(s.companyId)||s.company||'—',leads,orders,delivered,value:leads+orders+delivered};
  }).sort((a,b)=>b.value-a.value||b.delivered-a.delivered||b.orders-a.orders||b.leads-a.leads).slice(0,50);

  const deliveredByCompany=db.companies.map(c=>{
    const deliveredOrders=db.orders.filter(o=>o.companyId===c.id&&o.status==='Delivered');
    const value=deliveredOrders.reduce((a,o)=>a+Number(o.price||0),0);
    const dayTotals={}; deliveredOrders.forEach(o=>{const d=(o.date||o.createdAt||'').slice(0,10);dayTotals[d]=(dayTotals[d]||0)+Number(o.price||0)});
    const bestDate=Object.keys(dayTotals).sort((a,b)=>dayTotals[b]-dayTotals[a])[0]||'';
    return {name:c.name,company:c.name,value,deliveredOrders:deliveredOrders.length,bestDate,bestDaySales:bestDate?dayTotals[bestDate]:0};
  }).sort((a,b)=>b.value-a.value).slice(0,50);

  const purchases=db.companies.map(c=>{const value=db.stockRequests.filter(r=>r.companyId===c.id&&r.status==='Approved').reduce((a,r)=>a+Number(r.qty||0),0);return {name:c.name,company:c.name,value}}).sort((a,b)=>b.value-a.value).slice(0,50);
  const weekStart=new Date();weekStart.setHours(0,0,0,0);weekStart.setDate(weekStart.getDate()-6);const prevStart=new Date(weekStart);prevStart.setDate(prevStart.getDate()-7);
  const emerging=db.companies.map(c=>{const cur=db.orders.filter(o=>o.companyId===c.id&&new Date(o.date)>=weekStart).length;const prev=db.orders.filter(o=>o.companyId===c.id&&new Date(o.date)>=prevStart&&new Date(o.date)<weekStart).length;return {name:c.manager||c.name,company:c.name,value:cur-prev,cur,prev}}).sort((a,b)=>b.value-a.value||b.cur-a.cur).slice(0,50);
  return {bestCall,salesCompanies:deliveredByCompany,purchases,emerging,highest:deliveredByCompany};
}
function leaderboardSection(title,items,cat){
  const first=items[0];
  let summary='No data';
  if(first){
    if(cat==='bestCall')summary=`${first.name} • ${first.leads} Leads • ${first.orders} Orders • ${first.delivered} Delivered`;
    else if(cat==='purchases')summary=`${first.name} • ${first.value} units`;
    else if(cat==='emerging')summary=`${first.company} • ${first.value>=0?'+':''}${first.value} orders`;
    else summary=`${first.company} • ${money(first.value)}`;
  }
  return `<button class="leader-mini-card" onclick="openLeaderboard('${cat}')"><span class="leader-mini-icon">${cat==='bestCall'?'☎':cat==='highest'?'◆':cat==='purchases'?'▣':cat==='emerging'?'↗':'★'}</span><span><b>${title}</b><small>${esc(summary)}</small></span><strong>View</strong></button>`;
}
function openLeaderboard(cat){
  const lb=leaderboardData();
  const map={bestCall:['Best Call Centre',lb.bestCall],highest:['Highest Sales Company',lb.highest],purchases:['Top Purchase',lb.purchases],emerging:['Emerging Entrepreneur',lb.emerging],salesCompanies:['Sales Performance',lb.salesCompanies]};
  const [title,items]=map[cat]||map.bestCall;
  let head='<th>Place</th><th>Name</th><th>Company</th>';
  let rows=items.map((x,i)=>{
    let perf='';
    if(cat==='bestCall')perf=`<td>${x.leads}</td><td>${x.orders}</td><td>${x.delivered}</td><td><strong>${x.value}</strong></td>`;
    else if(cat==='highest'||cat==='salesCompanies')perf=`<td>${money(x.value)}</td><td>${x.deliveredOrders||0} delivered</td><td>${x.bestDate?esc(x.bestDate):'—'}${x.bestDaySales?` • ${money(x.bestDaySales)}`:''}</td>`;
    else if(cat==='purchases')perf=`<td>${x.value} units</td><td>Approved stock</td><td>—</td>`;
    else perf=`<td>${x.value>=0?'+':''}${x.value} orders</td><td>${x.cur} current</td><td>${x.prev} previous</td>`;
    return `<tr><td>${medalMarkup(i+1)}</td><td><b>${esc(x.name)}</b></td><td>${esc(x.company)}</td>${perf}</tr>`;
  }).join('')||'<tr><td colspan="6" class="empty">No data</td></tr>';
  if(cat==='bestCall')head+='<th>Leads</th><th>Orders</th><th>Delivered</th><th>Score</th>';else head+='<th>Value</th><th>Orders / Qty</th><th>Best Day / Detail</th>';
  const m=document.createElement('div');m.className='modal-mask';m.style.display='flex';m.innerHTML=`<div class="modal leaderboard-modal"><div class="modal-head"><div><div class="eyebrow">LEADERBOARD</div><div class="panel-title">${title}</div><div class="note">Top 50 • ranking • company • performance</div></div><button class="close" onclick="this.closest('.modal-mask').remove()">×</button></div><div class="table-wrap" style="margin-top:14px"><table class="table"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div></div>`;document.body.appendChild(m);
}

// ---- Stock list uses Unlimited for Owner + company isolation for Admin/Staff ----
function heldByCompanies(p){return db.companies.map(c=>{const e=(db.stock[c.id]||[]).find(x=>x.productId===p.id);return e&&Number(e.qty)>0?{name:c.name,qty:e.qty}:null}).filter(Boolean)}
function stockList(){
 const ps=companyProducts(),isOwner=db.session.role==='Owner';
 const scopeLabel=isOwner?'Owner Master Stock / Unlimited Inventory':`Company Stock — ${currentUser().company}`;
 const compOf=p=>p.companyId?(db.companies.find(c=>c.id===p.companyId)?.name||'Unknown company'):'APEX Holdings (Master)';
 const companyOpts=isOwner?`<div class="field"><label>Company</label><select id="stockCompany" onchange="filterStock()"><option value="">All companies</option><option value="__master">APEX Holdings (Master)</option>${db.companies.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></div>`:'';
 layout(`<div class="toolbar"><div class="field grow"><label>Search</label><input id="stockSearch" placeholder="Search name, product code, price or stock qty" oninput="filterStock()" autocomplete="off"></div>${companyOpts}${db.session.role==='Admin'?`<button class="btn btn-primary" onclick="navTo('product-tools')">+ Create / Transfer Product</button>`:''}<button class="btn ${isOwner?'btn-gold':'btn-primary'}" onclick="navTo('stock-purchase')">${isOwner?'+ Owner Stock':'Request Stock'}</button></div><div class="callout stock-control-card"><b>${esc(scopeLabel)}</b><div class="stock-request-note">${isOwner?'Owner can allocate any requested quantity. Master stock is unlimited. The Company column shows which company each product belongs to.':'Only this company’s products and stock quantities are shown. Other companies’ scoped products are hidden.'}</div></div><div class="card table-card"><div class="table-wrap"><table class="table" id="stockTable"><thead><tr><th>#</th><th>Product ID</th><th>Product</th><th>Product Code</th>${isOwner?'<th>Product Owner</th><th>Stock Held By Companies</th>':''}<th>Available Qty</th><th>Selling Price (Rs)</th><th>Actions</th></tr></thead><tbody>${ps.map((p,i)=>`<tr data-company="${esc(p.companyId||'__master')}" data-search="${esc([p.name,p.code,p.sell,Number(p.sell).toLocaleString(),p.isUnlimited?'unlimited':p.qty,isOwner?compOf(p)+' '+heldByCompanies(p).map(h=>h.name+' '+h.qty).join(' '):''].join(' ').toLowerCase())}"><td>${i+1}</td><td>${p.id}</td><td><b>${esc(p.name)}</b></td><td>${esc(p.code)}</td>${isOwner?`<td><span class="company-origin-pill">${esc(compOf(p))}</span></td><td>${heldByCompanies(p).map(h=>`<span class="held-chip">${esc(h.name)}<b>${Number(h.qty).toLocaleString()}</b></span>`).join('')||'<span class="note">Not allocated yet</span>'}</td>`:''}<td>${p.isUnlimited?'Unlimited':p.qty}</td><td>${Number(p.sell).toLocaleString()}</td><td>${isOwner?`<button class="btn btn-outline" onclick="editOwnerCost(${p.id})">Edit Cost</button>`:db.session.role==='Admin'?`<button class="btn btn-outline" onclick="editSellingPrice(${p.id})">Edit</button>`:`<button class="btn btn-outline" onclick="toast('Stock history opened')">History</button>`}</td></tr>`).join('')||`<tr><td colspan="${isOwner?9:7}" class="empty">No products.</td></tr>`}</tbody></table></div></div>`)
}

// ---- Settings: Language + WhatsApp, with English default ----
const LANGS={
  en:{Dashboard:'Dashboard',Stock:'Stock',Lead:'Lead',Orders:'Orders',Shipping:'Shipping',Return:'Return',Company:'Company',Staff:'Staff',Settings:'Settings', 'Stock List':'Stock List','Request Stock':'Request Stock','Company Stock Requests':'Company Stock Requests','Product Create & Transfer':'Product Create & Transfer','Import Lead':'Import Lead','Lead List':'Lead List','New Order':'New Order','Pending Order':'Pending Order','Search Order':'Search Order','Ship':'Ship','Shipped List':'Shipped List','Add Return':'Add Return','Returned List':'Returned List','Create Company':'Create Company','Company List':'Company List','New Staff':'New Staff','Staff List':'Staff List','Commission Rate':'Commission Rate','Waybill Designer':'Waybill Designer','Customize / Create':'Customize / Create'},
  si:{Dashboard:'උපකරණ පුවරුව',Stock:'ස්ටොක්',Lead:'ලීඩ්',Orders:'ඇණවුම්',Shipping:'Shipping',Return:'Returns',Company:'සමාගම්',Staff:'කාර්ය මණ්ඩලය',Settings:'සැකසුම්','Stock List':'ස්ටොක් ලැයිස්තුව','Request Stock':'ස්ටොක් ඉල්ලීම','Company Stock Requests':'සමාගම් ස්ටොක් ඉල්ලීම්','Product Create & Transfer':'නිෂ්පාදන නිර්මාණය / මාරු කිරීම','Import Lead':'ලීඩ් Import','Lead List':'ලීඩ් ලැයිස්තුව','New Order':'නව ඇණවුම','Pending Order':'Pending ඇණවුම්','Search Order':'ඇණවුම් සෙවීම','Ship':'Ship','Shipped List':'Shipped ලැයිස්තුව','Add Return':'Return එකතු කිරීම','Returned List':'Returned ලැයිස්තුව','Create Company':'සමාගම නිර්මාණය','Company List':'සමාගම් ලැයිස්තුව','New Staff':'නව Staff','Staff List':'Staff ලැයිස්තුව','Commission Rate':'කොමිස් අනුපාතය','Waybill Designer':'Waybill Designer','Customize / Create':'Customize / Create'},
  ta:{Dashboard:'டாஷ்போர்ட்',Stock:'ஸ்டாக்',Lead:'லீட்',Orders:'ஆர்டர்கள்',Shipping:'ஷிப்பிங்',Return:'ரிட்டர்ன்',Company:'நிறுவனம்',Staff:'பணியாளர்கள்',Settings:'அமைப்புகள்','Stock List':'ஸ்டாக் பட்டியல்','Request Stock':'ஸ்டாக் கோரிக்கை','Company Stock Requests':'நிறுவன ஸ்டாக் கோரிக்கைகள்','Product Create & Transfer':'பொருள் உருவாக்கம் / மாற்றம்','Import Lead':'லீட் இறக்குமதி','Lead List':'லீட் பட்டியல்','New Order':'புதிய ஆர்டர்','Pending Order':'நிலுவை ஆர்டர்கள்','Search Order':'ஆர்டர் தேடல்','Ship':'ஷிப்','Shipped List':'ஷிப் பட்டியல்','Add Return':'ரிட்டர்ன் சேர்','Returned List':'ரிட்டர்ன் பட்டியல்','Create Company':'நிறுவனம் உருவாக்கு','Company List':'நிறுவன பட்டியல்','New Staff':'புதிய பணியாளர்','Staff List':'பணியாளர் பட்டியல்','Commission Rate':'கமிஷன் விகிதம்','Waybill Designer':'Waybill Designer','Customize / Create':'Customize / Create'}
};
function lang(){return localStorage.getItem('apexOmsLang')||'en'}
function t(key){return LANGS[lang()]?.[key]||LANGS.en[key]||key}
function setLanguage(l){localStorage.setItem('apexOmsLang',['en','si','ta'].includes(l)?l:'en');applyLanguage();render()}
function applyLanguage(){
  const map={dashboard:'Dashboard',settings:'Settings','stock-list':'Stock List','stock-purchase':'Request Stock','stock-requests':'Company Stock Requests','product-tools':'Product Create & Transfer','import-lead':'Import Lead','lead-list':'Lead List','new-order':'New Order','pending-orders':'Pending Order','search-orders':'Search Order','ship':'Ship','shipped-list':'Shipped List','add-return':'Add Return','returned-list':'Returned List','create-company':'Create Company','company-list':'Company List','new-staff':'New Staff','staff-list':'Staff List','commission-rate':'Commission Rate'};
  Object.entries(map).forEach(([route,key])=>$$(`[data-route="${route}"]`).forEach(el=>{const sp=el.querySelector('span:not(.ico)');if(sp)sp.textContent=t(key);else el.textContent=t(key)}));
  const groups={stock:'Stock',lead:'Lead',orders:'Orders',shipping:'Shipping',return:'Return',company:'Company',staff:'Staff',waybill:'Waybill'};
  Object.entries(groups).forEach(([g,key])=>{const b=document.querySelector(`[data-group="${g}"] > .group-toggle`);const sp=b?.querySelector('span:nth-child(2)');if(sp)sp.textContent=t(key)});
  $('#breadcrumb') && ($('#breadcrumb').textContent=t(routeTitles[location.hash.slice(1)||'dashboard']||'Dashboard'));
  $('#pageTitle') && ($('#pageTitle').textContent=t(routeTitles[location.hash.slice(1)||'dashboard']||'Dashboard'));
}

// ---- WhatsApp click-to-chat ----
function whatsappNumber(v){return String(v||'').replace(/\D/g,'').replace(/^0/,'94')}
function updateWhatsAppQuick(){const n=$('#oTel')?.value.trim();const b=$('#waQuickBtn');if(!b)return;const digits=n.replace(/\D/g,'');b.style.display=digits.length>=9?'inline-flex':'none'}
function openCustomerWhatsApp(){const n=whatsappNumber($('#oTel')?.value||'');if(n.length<11)return toast('Enter a valid WhatsApp-capable phone number');const name=$('#oName')?.value.trim()||'Customer';const msg=`Hi ${name} ඔයා Order එකක් දාලා තියෙනවා නේද?`;window.open(`https://wa.me/${n}?text=${encodeURIComponent(msg)}`,'_blank','noopener')}

async function changeOwnPassword(){const current=$('#currentOwnPassword')?.value||'',next=$('#newOwnPassword')?.value||'',confirmNext=$('#confirmOwnPassword')?.value||'';if(!current||!next)return toast('Enter current and new passwords');if(next!==confirmNext)return toast('New passwords do not match');try{const r=await fetch('/api/change-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword:current,newPassword:next})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.message||j.error||'Password update failed');$('#currentOwnPassword').value='';$('#newOwnPassword').value='';$('#confirmOwnPassword').value='';toast('Password updated successfully')}catch(e){toast(e.message||'Password update failed')}}
async function downloadOmsBackup(){if(db.session?.role!=='Owner')return toast('Owner only');try{const r=await fetch('/api/backup');if(!r.ok)throw new Error('Backup failed: '+r.status);const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='apex-oms-backup.zip';a.click();URL.revokeObjectURL(url);toast('Backup downloaded')}catch(e){toast(e.message||'Backup failed')}}
async function restoreOmsBackup(input){if(db.session?.role!=='Owner')return toast('Owner only');const file=input.files?.[0];if(!file)return;if(!confirm('Restore this backup? Current database files will be replaced.')){input.value='';return}try{const fd=new FormData();fd.append('file',file);const r=await fetch('/api/restore',{method:'POST',body:fd});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Restore failed');toast('Backup restored. Please sign in again.');await logout()}catch(e){toast(e.message||'Restore failed')}finally{input.value=''}}
function settings(){
 const currentLang=lang();
 const wa=localStorage.getItem('apexOmsWhatsNumber')||'';const tpl=localStorage.getItem('apexOmsWhatsTemplate')||'Hello {name}, regarding your order {order}.';
 layout(`<div class="settings-wrap"><div class="settings-hero card"><div><div class="eyebrow">ACCOUNT SETTINGS</div><h2>Settings</h2><p>Choose language, theme and WhatsApp preferences for this device.</p></div><div class="cloud-status">☁ Cloud OMS</div></div><div class="settings-grid"><div class="card section-card"><div class="panel-title">Language</div><div class="panel-sub" style="margin-top:4px">English is the default language.</div><div class="field" style="margin-top:14px"><label>Language</label><select id="langSelect"><option value="en" ${currentLang==='en'?'selected':''}>English</option><option value="si" ${currentLang==='si'?'selected':''}>සිංහල</option><option value="ta" ${currentLang==='ta'?'selected':''}>தமிழ்</option></select></div><div class="actions" style="margin-top:12px"><button class="btn btn-primary" onclick="setLanguage($('#langSelect').value)">Apply Language</button></div></div><div class="card section-card"><div class="panel-title">Appearance</div><div class="panel-sub" style="margin-top:4px">Theme changes apply immediately.</div><div class="theme-setting-grid"><button class="theme-choice ${localStorage.getItem('apexOmsTheme')!=='dark'?'selected':''}" onclick="setTheme('light');settings()"><span>☀</span><div><b>Light Mode</b><small>Clean white workspace</small></div></button><button class="theme-choice ${localStorage.getItem('apexOmsTheme')==='dark'?'selected':''}" onclick="setTheme('dark');settings()"><span>◐</span><div><b>Dark Mode</b><small>Full-system dark workspace</small></div></button></div></div><div class="card section-card"><div class="panel-title">WhatsApp</div><div class="panel-sub">Use click-to-chat from New Order customer history.</div><div class="form-grid" style="margin-top:12px"><div class="field"><label>WhatsApp Business Number</label><input id="waSettingsNumber" value="${esc(wa)}" placeholder="9477xxxxxxx"></div><div class="field"><label>Message Template</label><input id="waSettingsTemplate" value="${esc(tpl)}" placeholder="Hello {name}, regarding {order}"></div></div><div class="actions" style="margin-top:12px"><button class="btn btn-primary" onclick="saveWhatsSettings()">Save WhatsApp Settings</button><button class="btn btn-outline" onclick="testWhatsApp()">Test WhatsApp</button></div></div>${db.session.role==='Owner'?`<div class="card section-card"><div class="panel-title">Database Backup</div><p class="note">Download a complete backup containing OMS data, hashed login accounts and announcement media.</p><div class="actions"><button class="btn btn-primary" onclick="downloadOmsBackup()">Download Backup</button><label class="btn btn-outline" style="cursor:pointer">Restore Backup<input type="file" accept=".zip" id="omsRestoreFile" style="display:none" onchange="restoreOmsBackup(this)"></label></div></div>`:''}<div class="card section-card"><div class="panel-title">Change Password</div><p class="note">Use a unique password with at least 12 characters.</p><div class="form-grid"><div class="field"><label>Current Password</label><input id="currentOwnPassword" type="password" autocomplete="current-password"></div><div class="field"><label>New Password</label><input id="newOwnPassword" type="password" autocomplete="new-password"></div><div class="field"><label>Confirm New Password</label><input id="confirmOwnPassword" type="password" autocomplete="new-password"></div></div><div class="actions" style="margin-top:12px"><button class="btn btn-primary" onclick="changeOwnPassword()">Update Password</button></div></div><div class="card section-card"><div class="panel-title">Session</div><div class="settings-list"><div><span>User</span><b>${esc(currentUser()?.name||owner.name)}</b></div><div><span>Role</span><b>${esc(db.session.role)}</b></div><div><span>Company</span><b>${esc(db.session.role==='Owner'?'APEX HOLDINGS':currentUser()?.company||'')}</b></div></div></div></div></div>`)
}
function saveWhatsSettings(){localStorage.setItem('apexOmsWhatsNumber',$('#waSettingsNumber').value.trim());localStorage.setItem('apexOmsWhatsTemplate',$('#waSettingsTemplate').value.trim()||'Hello {name}, regarding your order {order}.');toast('WhatsApp settings saved')}
function testWhatsApp(){const n=whatsappNumber($('#waSettingsNumber').value.trim());if(n.length<11)return toast('Enter a valid WhatsApp business number');const tpl=$('#waSettingsTemplate').value.trim()||'Hello {name}, regarding your order {order}.';window.open(`https://wa.me/${n}?text=${encodeURIComponent(tpl.replace(/\{name\}/gi,'Customer').replace(/\{order\}/gi,'TEST-ORDER'))}`,'_blank','noopener')}

// ---- New Order with WhatsApp quick action; all original order logic retained ----
function newOrder(leadNo=''){
  orderProducts=[];const l=leadNo?db.leads.find(x=>x.no===leadNo):null;
  layout(`<div class="card section-card order-form-card"><div class="panel-head"><div><div class="panel-title">New Order</div><div class="panel-sub">Fill customer details, add a product manually, then save the order.</div></div><span class="badge pending">Due today</span></div><div id="orderValidation" class="form-error-box"></div><div class="form-grid"><div class="field"><label>Customer Name *</label><input id="oName" value="${esc(l?.name||'')}" placeholder="Customer name"></div><div class="field span-2"><label>Address *</label><input id="oAddress" value="${esc(l?.address||'')}" placeholder="Full address"></div><div class="field city-search"><label>Town / City *</label><input id="oCity" value="${esc(l?.city||'')}" autocomplete="off" placeholder="Select town / city"><div id="cityDrop" class="city-dropdown"></div></div><div class="field"><label>Contact Number 1</label><input id="oTel" value="${esc(l?.tel||'')}" inputmode="tel"></div><div class="field"><label>Contact Number 2</label><input id="oTel2" value="${esc(l?.tel2||'')}" inputmode="tel"></div><div class="field"><label>Other</label><input id="oOther" value="${esc(l?.other||'')}"></div><div class="field"><label>Color / Size</label><input id="oVariant" value="" placeholder="e.g. Black / XL"></div><div class="field"><label>Due Date</label><input id="oDue" type="date" value="${today()}"></div></div><div style="margin-top:20px"><div class="panel-title">Product Selection</div><div class="toolbar" style="margin-top:10px"><div class="field grow"><label>Search Product *</label><input id="productSearch" placeholder="Type product name or code and press Enter" autocomplete="off"></div></div><div id="productResults" class="product-picker"></div><div id="productRows"></div></div><div class="actions order-main-actions" style="margin-top:20px"><button class="btn btn-primary" onclick="createOrder('${esc(leadNo)}')">Add Order</button><button class="btn btn-outline" onclick="leadQuick('${esc(leadNo)}','No Answer')">No Answer</button><button class="btn btn-danger" onclick="leadQuick('${esc(leadNo)}','Rejected')">Reject</button></div></div><div class="card section-card" style="margin-top:16px"><div class="panel-head"><div class="actions"><button id="waQuickBtn" class="btn btn-outline" style="display:none" onclick="openCustomerWhatsApp()">WhatsApp</button></div><div class="panel-title">Customer History</div><div class="actions"><button id="addHistoryDataBtn" class="btn btn-primary" style="display:none" onclick="addCustomerDataFromHistoryV29()">Add Data</button></div></div><div id="history" class="history empty">Enter Contact Number 1 or 2 to view previous orders.</div></div><div class="card section-card order-note-card" style="margin-top:16px"><div class="panel-head"><div><div class="panel-title">Order Note</div><div class="panel-sub">Your own note. It is not printed on waybills. For a lead it is saved to the Note column of the Lead List.</div></div></div><textarea id="oNote" rows="3" placeholder="Write a note..." style="width:100%">${esc(l?.note||'')}</textarea><div class="actions" style="margin-top:10px"><button type="button" class="btn btn-primary" onclick="saveOrderNote('${esc(leadNo||'')}')">Save Note</button></div></div>`);
  $('#productSearch').addEventListener('input',renderProductSearch);$('#productSearch').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();moveProductSelection(1);return}if(e.key==='ArrowUp'){e.preventDefault();moveProductSelection(-1);return}if(e.key==='Enter'){e.preventDefault();const x=$('#productResults .product-result.keyboard-selected');if(x){x.click()}else addFirstProductFromSearch()}});
  $('#oTel').addEventListener('input',e=>{customerHistory(e.target.value);updateWhatsAppQuick()});$('#oTel2').addEventListener('input',e=>customerHistory(e.target.value));$('#oCity').addEventListener('input',citySuggest);$('#oCity').addEventListener('focus',citySuggest);$('#oCity').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();moveCitySelection(1);return}if(e.key==='ArrowUp'){e.preventDefault();moveCitySelection(-1);return}if(e.key==='Enter'){const x=$('#cityDrop .city-option.keyboard-selected')||$('#cityDrop .city-option');if(x){e.preventDefault();x.click()}}});if(l?.tel){customerHistory(l.tel);updateWhatsAppQuick()}
}

// ---- Waybill Designer (Owner only) ----
function defaultWaybillSections(){return ['customer','sender','product','amount','reference','thankyou']}
function ensureWaybillLayouts(){if(!Array.isArray(db.waybillLayouts))db.waybillLayouts=[]}
function waybillDesigner(){
  if(db.session.role!=='Owner')return toast('Owner only');
  ensureWaybillLayouts();save();
  const rows=db.waybillLayouts.map(l=>`<div class="card section-card custom-wb-row"><div><b>${esc(l.name)}</b><div class="note">${esc(l.orientation||'portrait')} • ${esc(l.font||'Arial')} • ${Number(l.fontSize||18)}px</div></div><div class="actions"><button class="btn btn-outline" onclick="editWaybillLayout('${l.id}')">Edit</button><button class="btn btn-outline" onclick="previewWaybillLayout('${l.id}')">Preview</button><button class="btn btn-danger" onclick="deleteWaybillLayout('${l.id}')">Delete</button></div></div>`).join('');
  layout(`<div class="page-intro"><div><div class="eyebrow">OWNER CONTROL</div><h2>Waybill Designer</h2><p>Create unlimited custom layouts and see changes live while you build.</p></div><button class="btn btn-primary" onclick="editWaybillLayout('new')">+ Create New Layout</button></div><div class="custom-wb-list">${rows||'<div class="card empty">No custom layouts yet.</div>'}</div>`)
}
function waybillLayoutEditor(layoutId){
  ensureWaybillLayouts();
  const existing=layoutId==='new'?null:db.waybillLayouts.find(x=>x.id===layoutId);
  const l=existing?JSON.parse(JSON.stringify(existing)):{id:'WB-L-'+Date.now(),name:'New Layout',orientation:'portrait',font:'Arial, Helvetica, sans-serif',fontSize:20,bold:false,italic:false,textColor:'#111111',accent:'#111111',border:'solid',radius:6,sections:defaultWaybillSections(),customText:''};
  window._wblDraft=l;
  const sections=l.sections||defaultWaybillSections();
  return `<div class="waybill-editor-grid"><div class="card section-card"><div class="panel-title">${existing?'Edit':'Create'} Waybill Layout</div><div class="panel-sub">Drag sections or change a control. The preview on the right updates immediately.</div><div class="form-grid" style="margin-top:14px"><div class="field"><label>Layout Name</label><input id="wblName" value="${esc(l.name)}" oninput="renderWaybillLivePreview()"></div><div class="field"><label>Orientation</label><select id="wblOrient" onchange="renderWaybillLivePreview()"><option value="portrait" ${l.orientation==='portrait'?'selected':''}>Portrait</option><option value="landscape" ${l.orientation==='landscape'?'selected':''}>Landscape</option></select></div><div class="field"><label>Font</label><select id="wblFont" onchange="renderWaybillLivePreview()"><option value="Arial, Helvetica, sans-serif" ${String(l.font).startsWith('Arial')?'selected':''}>Arial</option><option value="Segoe UI, Arial, sans-serif" ${String(l.font).startsWith('Segoe')?'selected':''}>Segoe UI</option><option value="Georgia, serif" ${String(l.font).startsWith('Georgia')?'selected':''}>Georgia</option><option value="Verdana, sans-serif" ${String(l.font).startsWith('Verdana')?'selected':''}>Verdana</option></select></div><div class="field"><label>Font Size</label><input id="wblSize" type="number" min="10" max="48" value="${Number(l.fontSize||20)}" oninput="renderWaybillLivePreview()"></div><div class="field"><label>Text Color</label><input id="wblText" type="color" value="${l.textColor||'#111111'}" oninput="renderWaybillLivePreview()"></div><div class="field"><label>Accent Color</label><input id="wblAccent" type="color" value="${l.accent||'#111111'}" oninput="renderWaybillLivePreview()"></div><div class="field"><label>Border</label><select id="wblBorder" onchange="renderWaybillLivePreview()"><option ${l.border==='solid'?'selected':''}>solid</option><option ${l.border==='dashed'?'selected':''}>dashed</option><option ${l.border==='double'?'selected':''}>double</option></select></div><div class="field"><label>Radius</label><input id="wblRadius" type="number" min="0" max="28" value="${Number(l.radius||0)}" oninput="renderWaybillLivePreview()"></div></div><div class="actions" style="margin-top:12px"><label class="checkline"><input id="wblBold" type="checkbox" ${l.bold?'checked':''} onchange="renderWaybillLivePreview()"> Bold</label><label class="checkline"><input id="wblItalic" type="checkbox" ${l.italic?'checked':''} onchange="renderWaybillLivePreview()"> Italic</label></div><div class="panel-title" style="margin-top:18px">Sections — Drag to reorder</div><div id="wblSections" class="wb-section-editor">${sections.map(id=>`<div class="wb-section-chip" draggable="true" data-sec="${esc(id)}"><span class="drag">☷</span><b>${esc(waybillSectionLabel(id))}</b><button type="button" class="icon-btn" onclick="this.parentElement.remove();renderWaybillLivePreview()">×</button></div>`).join('')}</div><div class="actions" style="margin-top:12px"><select id="wblAddSection"><option value="customer">Customer Details</option><option value="sender">Company Details</option><option value="product">Product Details</option><option value="amount">Amount</option><option value="reference">Waybill Reference</option><option value="thankyou">Thank You</option><option value="custom">Custom Text</option></select><button class="btn btn-outline" onclick="addWaybillSection();renderWaybillLivePreview()">+ Add Section</button></div><div class="field" style="margin-top:12px"><label>Custom Text</label><textarea id="wblCustom" rows="3" placeholder="Add your own text block" oninput="renderWaybillLivePreview()">${esc(l.customText||'')}</textarea></div><div class="actions" style="margin-top:16px"><button class="btn btn-primary" onclick="saveWaybillLayout('${esc(l.id)}')">Save Layout</button><button class="btn btn-outline" onclick="navTo('waybill-designer')">Cancel</button></div></div><div class="card section-card waybill-live-panel"><div class="panel-head"><div><div class="panel-title">Live Preview</div><div class="panel-sub">Updates without leaving this page</div></div><span class="badge success">LIVE</span></div><div id="wblLivePreview" class="waybill-preview-stage"></div></div></div>`;
}
function waybillSectionLabel(id){return ({customer:'Customer Details',sender:'Company Details',product:'Product Details',amount:'Amount',reference:'Waybill Reference',thankyou:'Thank You',custom:'Custom Text'})[id]||id}
function addWaybillSection(){const sel=$('#wblAddSection').value;const d=document.createElement('div');d.className='wb-section-chip';d.draggable=true;d.dataset.sec=sel;d.innerHTML=`<span class="drag">☷</span><b>${esc(waybillSectionLabel(sel))}</b><button type="button" class="icon-btn" onclick="this.parentElement.remove();renderWaybillLivePreview()">×</button>`;$('#wblSections').appendChild(d);wireWaybillDrag()}
function wireWaybillDrag(){const wrap=$('#wblSections');if(!wrap)return;let drag=null;$$('.wb-section-chip',wrap).forEach(el=>{el.addEventListener('dragstart',()=>{drag=el;el.classList.add('dragging')});el.addEventListener('dragend',()=>{el.classList.remove('dragging');drag=null;renderWaybillLivePreview()});el.addEventListener('dragover',e=>{e.preventDefault();if(drag&&drag!==el){const r=el.getBoundingClientRect();(e.clientY-r.top)>r.height/2?el.after(drag):el.before(drag);renderWaybillLivePreview()}})})}
function currentWaybillDraft(){return {name:$('#wblName')?.value?.trim()||'Custom Layout',orientation:$('#wblOrient')?.value||'portrait',font:$('#wblFont')?.value||'Arial, Helvetica, sans-serif',fontSize:Number($('#wblSize')?.value)||20,bold:$('#wblBold')?.checked||false,italic:$('#wblItalic')?.checked||false,textColor:$('#wblText')?.value||'#111111',accent:$('#wblAccent')?.value||'#111111',border:$('#wblBorder')?.value||'solid',radius:Number($('#wblRadius')?.value)||0,sections:$$('#wblSections .wb-section-chip').map(x=>x.dataset.sec),customText:$('#wblCustom')?.value||''}}
function liveWaybillMarkup(l){
  const sample={customer:'Sample Customer',address:'No. 25, Main Street, Colombo 05',city:'Colombo',tel:'077 123 4567',tel2:'071 234 5678',productSummary:'Office Pant × 2',variant:'Black / XL',qty:2,price:4950,waybill:'WB-SAMPLE'};
  const company=db.companies[0]||{name:'APEX HOLDINGS',address:'Sri Lanka',phone:''};
  const map={customer:`<section><div class="wb-preview-label">TO</div><div class="wb-preview-customer">${esc(sample.customer)}</div><div>${esc(sample.address)}</div><div>${esc(sample.city)}</div><div>${esc(sample.tel)}${sample.tel2?' / '+esc(sample.tel2):''}</div></section>`,sender:`<section><div class="wb-preview-label">FROM</div><div><strong>${esc(company.name)}</strong></div><div>${esc(company.address||'Sri Lanka')}</div><div>${esc(company.phone||'')}</div></section>`,product:`<section><div><strong>Product</strong> ${esc(sample.productSummary)}</div><div><strong>Color / Size</strong> ${esc(sample.variant)}</div><div><strong>Qty</strong> ${sample.qty}</div></section>`,amount:`<section class="wb-preview-amount"><strong>${money(sample.price)}</strong></section>`,reference:`<section><div class="wb-preview-label">WAYBILL</div><strong>${esc(sample.waybill)}</strong></section>`,thankyou:`<section class="wb-preview-thank">Thank you for your trust in us.</section>`,custom:`<section><div class="wb-preview-label">CUSTOM</div><div>${esc(l.customText||'Your custom text')}</div></section>`};
  const dir=l.orientation==='landscape'?'landscape':'portrait';
  return `<div class="wb-preview-page ${dir}" style="--wb-font:${l.font};--wb-size:${l.fontSize}px;--wb-text:${l.textColor};--wb-accent:${l.accent};--wb-border:${l.border};--wb-radius:${l.radius}px;--wb-weight:${l.bold?700:400};--wb-style:${l.italic?'italic':'normal'}"><div class="wb-preview-card">${(l.sections||defaultWaybillSections()).map(x=>map[x]||'').join('')}</div></div>`;
}
function renderWaybillLivePreview(){const p=$('#wblLivePreview');if(!p)return;const l=currentWaybillDraft();p.innerHTML=liveWaybillMarkup(l);wireWaybillDrag()}
function editWaybillLayout(id){if(db.session.role!=='Owner')return toast('Owner only');layout(waybillLayoutEditor(id));wireWaybillDrag();renderWaybillLivePreview()}
function saveWaybillLayout(id){if(db.session.role!=='Owner')return toast('Owner only');const data=currentWaybillDraft();data.id=id;const i=db.waybillLayouts.findIndex(x=>x.id===id);if(i>=0)db.waybillLayouts[i]=data;else db.waybillLayouts.push(data);save();toast('Waybill layout saved');waybillDesigner()}
function deleteWaybillLayout(id){if(db.session.role!=='Owner')return toast('Owner only');if(!confirm('Delete this custom waybill layout?'))return;db.waybillLayouts=db.waybillLayouts.filter(x=>x.id!==id);save();waybillDesigner()}
function previewWaybillLayout(id){const l=db.waybillLayouts.find(x=>x.id===id);if(!l)return;const sample=db.orders[0]||{customer:'Sample Customer',address:'Sample Address',city:'Colombo',tel:'0771234567',tel2:'',productSummary:'Sample Product × 1',variant:'Black / XL',qty:1,price:2950,waybill:'WB-SAMPLE',companyId:db.companies[0]?.id};const sh=db.shipped[0]||{company:db.companies[0]?.name||'APEX HOLDINGS'};printCustomWaybill([sample],sh,l,true)}
function customWaybillHtml(orders,s,l){const c=db.companies.find(x=>x.id===orders[0]?.companyId)||{};const make=o=>{const map={customer:`<section class="wbsec"><div class="cap">TO</div><div class="customer">${esc(o.customer)}</div><div class="customer-detail">${esc(o.address)}</div><div class="customer-detail">${esc(o.city||'')}</div><div class="customer-detail">${esc(o.tel)}${o.tel2?' / '+esc(o.tel2):''}</div></section>`,sender:`<section class="wbsec"><div class="cap">FROM</div><strong>${esc(c.name||s.company||'APEX HOLDINGS')}</strong><div>${esc(c.address||'Sri Lanka')}</div><div>${esc(c.phone||'')}</div></section>`,product:`<section class="wbsec"><div><b>Product</b> ${esc(o.productSummary||'')}</div><div><b>Color</b> ${esc(o.variant||'-')}</div><div><b>Qty</b> ${o.qty||1}</div></section>`,amount:`<section class="wbsec amount"><strong>${money(o.price)}</strong></section>`,reference:`<section class="wbsec"><div class="cap">WAYBILL</div><strong>${esc(o.waybill||s.id)}</strong></section>`,thankyou:`<section class="wbsec thank">Thank you for your trust in us.</section>`,custom:`<section class="wbsec">${esc(l.customText||'')}</section>`};return `<article class="custom-waybill">${(l.sections||defaultWaybillSections()).map(x=>map[x]||'').join('')}</article>`};return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(l.name)}</title><style>@page{size:A4 ${l.orientation==='landscape'?'landscape':'portrait'};margin:6mm}*{box-sizing:border-box}body{margin:0;font-family:${l.font};color:${l.textColor};background:#fff}.sheet{width:${l.orientation==='landscape'?'285mm':'198mm'};min-height:${l.orientation==='landscape'?'198mm':'284mm'};display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr);gap:4mm}.custom-waybill{border:2px ${l.border} ${l.accent};border-radius:${l.radius}px;padding:4mm;display:flex;flex-direction:column;font-size:${l.fontSize}px;font-weight:${l.bold?700:400};font-style:${l.italic?'italic':'normal'};overflow:hidden;min-width:0;overflow-wrap:anywhere;word-break:break-word}.wbsec{min-width:0;max-width:100%;overflow:hidden;overflow-wrap:anywhere;word-break:break-word}.cap{font-size:${Math.max(12,l.fontSize-5)}px;font-weight:800;letter-spacing:.8px}.customer{font-size:${Math.max(24,l.fontSize+8)}px;font-weight:700;margin:.8mm 0}.wbsec{padding:2mm 0;border-bottom:1px solid #999}.amount{font-size:${Math.max(28,l.fontSize+10)}px;text-align:center;border:2px solid ${l.accent};padding:3mm;margin-top:1.5mm}.thank{text-align:center;margin-top:auto;border-top:1px solid #999;border-bottom:0}.wbsec b{font-weight:800}</style></head><body><div class="sheet">${orders.slice(0,6).map(make).join('')}</div></body></html>`}
function printCustomWaybill(orders,s,l,preview=false){const w=window.open('','_blank','width=1000,height=900');if(!w)return toast('Allow popups to print');w.document.write(customWaybillHtml(orders,s,l));w.document.close()}


// ---- Ship: Select 10 / 20 / 50 ----
function selectShipCount(n){$$('.ship-check').forEach((x,i)=>{x.checked=i<n})}
function ship(){
 const a=db.orders.filter(o=>o.companyId===currentCompanyId()&&o.status==='Pending');
 layout(`<div class="toolbar"><div class="field"><label>User</label><select id="shipUser"><option value="">All Users</option>${db.staff.filter(s=>s.companyId===currentCompanyId()).map(s=>`<option>${esc(s.name)}</option>`).join('')}</select></div><div class="field grow"><label>Search</label><input id="shipSearch" placeholder="Customer, order, contact..." oninput="filterSimple('shipTable','shipSearch')"></div><div class="field"><label>Delivery Company</label><select id="shipCompany"><option>Domex</option><option>Prompt X</option><option>Pronto</option><option>SL Post</option><option>Other</option></select></div><div class="field"><label>Start Date</label><input id="shipStart" type="date" value="${today()}"></div><div class="field"><label>End Date</label><input id="shipEnd" type="date" value="${today()}"></div><div class="ship-select-group"><button class="btn btn-outline" onclick="selectShipCount(10)">Select 10</button><button class="btn btn-outline" onclick="selectShipCount(20)">Select 20</button><button class="btn btn-outline" onclick="selectShipCount(50)">Select 50</button></div><button class="btn btn-primary" onclick="shipSelected()">Ship Selected</button></div><div class="card table-card"><div class="table-wrap"><table class="table" id="shipTable"><thead><tr><th>#</th><th>Ordered Date</th><th>Products</th><th>Qty</th><th>Price (Rs)</th><th>Del Fee</th><th>Customer</th><th>Address</th><th>Tel</th><th>Tel Two</th><th>Ready To Ship</th></tr></thead><tbody>${a.map((o,i)=>`<tr><td>${i+1}</td><td>${o.date}</td><td>${esc(o.productSummary)}</td><td>${o.qty}</td><td>${money(o.price)}</td><td>${money(300)}</td><td>${esc(o.customer)}</td><td>${esc(o.address)}<br>${esc(o.city)}</td><td>${esc(o.tel)}</td><td>${esc(o.tel2)}</td><td><input type="checkbox" class="ship-check" value="${o.id}"></td></tr>`).join('')||'<tr><td colspan="11" class="empty">No pending orders ready to ship.</td></tr>'}</tbody></table></div></div>`)
}

// ---- Shipped list includes historical records and custom waybill buttons ----
function shippedList(){
  ensureWaybillLayouts();
  const all=db.shipped.slice().sort((a,b)=>new Date(b.shippedAt||b.date||0)-new Date(a.shippedAt||a.date||0));const cid=currentCompanyId();const a=db.session.role==='Owner'?all:all.filter(s=>s.companyId===cid);
  layout(`<div class="toolbar"><div class="field grow"><label>Search</label><input id="shSearch" oninput="filterSimple('shTable','shSearch')" placeholder="Shipment, waybill, company, user..."></div><button class="btn btn-dark" onclick="printSelectedWaybills(1)">Layout 1</button><button class="btn btn-dark" onclick="printSelectedWaybills(2)">Layout 2</button><button class="btn btn-dark" onclick="printSelectedWaybills(3)">Layout 3</button></div><div class="waybill-sheet-note">All historical shipped batches remain here. <b>Today</b> shipments are highlighted. Select shipped files and choose a waybill design.</div><div class="card table-card"><div class="table-wrap"><table class="table" id="shTable"><thead><tr><th></th><th>#</th><th>Shipped Items (Q)</th><th>Deliver Company</th><th>Shipped Date &amp; Time</th><th>User</th><th>Action</th></tr></thead><tbody>${a.map((s,i)=>{const dt=s.shippedAt?new Date(s.shippedAt):null;const display=dt&&!isNaN(dt)?`${dt.toLocaleDateString('en-GB')} ${dt.toLocaleTimeString('en-LK',{hour:'2-digit',minute:'2-digit'})}`:`${esc(s.date||'')} ${esc(s.time||'')}`;const isToday=(dt&&!isNaN(dt)&&dt.toISOString().slice(0,10)===today())||(!dt&&s.date===today());return `<tr class="${isToday?'shipment-today':''}"><td><input type="checkbox" class="ship-file-check" value="${s.id}"></td><td>${i+1}</td><td><b>${s.id}</b> (${s.q})<br><small>${s.orderIds.map(id=>db.orders.find(o=>o.id===id)?.waybill||'').filter(Boolean).join(', ')}</small></td><td>${esc(s.company)}</td><td>${esc(display)}${isToday?'<span class="today-chip">TODAY</span>':''}</td><td>${esc(s.user)}</td><td><button class="btn btn-outline" onclick="viewShipment('${s.id}')">View</button></td></tr>`}).join('')||'<tr><td colspan="7" class="empty">No shipped files.</td></tr>'}</tbody></table></div></div>`)
}
function printSelectedCustomWaybills(layoutId){const ids=$$('.ship-file-check:checked').map(x=>x.value);if(!ids.length)return toast('Select at least one shipped file');const l=db.waybillLayouts.find(x=>x.id===layoutId);if(!l)return;const pairs=[];for(const id of ids){const s=db.shipped.find(x=>x.id===id);if(!s)continue;for(const o of shipmentOrders(s)){pairs.push({o,s});if(pairs.length>=6)break}if(pairs.length>=6)break}if(!pairs.length)return toast('No orders available for printing');printCustomWaybill(pairs.map(x=>x.o),pairs[0].s,l)}

/* ---- Language-aware route labels ---- */
const _baseRouteTitles={...routeTitles};
Object.keys(_baseRouteTitles).forEach(k=>Object.defineProperty(routeTitles,k,{configurable:true,get(){return t(_baseRouteTitles[k])}}));

// Run language update after each app boot/render.
const _oldBootApp=bootApp;
bootApp=function(){_oldBootApp();applyLanguage()}


// Requestable product scope: common master products + products belonging to this company only.
function requestableProducts(){
  const cid=currentCompanyId();
  if(db.session.role==='Owner'||!cid) return [];
  const company=db.companies.find(c=>c.id===cid);
  return db.products.filter(p=>p.companyId===cid || (!company?.catalogIsolated && !p.companyId));
}
function stockPurchase(){
 if(db.session.role!=='Owner'){
  const reqProducts=requestableProducts();
  layout(`<div class="page-intro"><div><div class="eyebrow">STOCK CONTROL</div><h2>Request Stock From Owner</h2><p>Submit a clear stock request. After the Owner confirms payment, the requested quantity is added to your company stock.</p></div></div><div class="card section-card stock-request-form"><div class="panel-head"><div><div class="panel-title">New Stock Request</div><div class="panel-sub">All request fields are kept separate for easy desktop entry.</div></div><span class="badge pending">Owner approval required</span></div><div class="form-grid stock-request-grid"><div class="field span-2"><label>Product</label><select id="reqProduct" onchange="updateStockRequestTotal()">${reqProducts.map(p=>`<option value="${p.id}">${esc(p.name)} — ${esc(p.code)}</option>`).join('')}</select></div><div class="field"><label>Requested Qty</label><input id="reqQty" type="number" min="1" value="10" oninput="updateStockRequestTotal()"></div><div class="field"><label>Unit Price</label><input id="reqUnit" value="45" readonly></div><div class="field"><label>Total Stock Cost</label><input id="reqTotal" value="Rs. 1,200" readonly></div><div class="field"><label>Payment Amount</label><input id="reqPay" type="number" min="0" value="1200"></div><div class="field"><label>Payment / Transaction Ref</label><input id="reqRef" placeholder="e.g. TRX-12345"></div><div class="field span-4 receipt-field"><label>Payment receipt * (image or PDF)</label><input id="reqReceipt" type="file" accept="image/*,application/pdf" onchange="pickStockReceipt(this)"><div id="reqReceiptPreview" class="receipt-preview"><span class="note">Attach the bank slip / transfer screenshot. Required to send the request.</span></div></div><div class="field span-4"><label>Request Note</label><textarea id="reqNote" rows="3" placeholder="Payment / delivery / stock details for Owner"></textarea></div></div><div class="request-summary"><div class="mini-stat"><b id="reqSummaryQty">10</b><span>Requested quantity</span></div><div class="mini-stat"><b id="reqSummaryTotal">Rs. 1,200</b><span>Stock cost</span></div><div class="mini-stat"><b id="reqSummaryPay">Rs. 1,200</b><span>Payment entered</span></div></div><div class="actions" style="margin-top:16px"><button class="btn btn-primary" onclick="sendStockRequest()">Send Stock Request</button><button class="btn btn-outline" onclick="navTo('stock-list')">Back to Stock</button></div></div><div class="card section-card" style="margin-top:16px"><div class="panel-head"><div><div class="panel-title">My Stock Requests</div><div class="panel-sub">Track quantity, payment, reference and approval status.</div></div></div><div class="table-wrap" style="margin-top:12px"><table class="table"><thead><tr><th>Request</th><th>Product</th><th>Qty</th><th>Unit</th><th>Total</th><th>Paid</th><th>Reference</th><th>Date</th><th>Status</th></tr></thead><tbody>${db.stockRequests.filter(r=>r.companyId===currentCompanyId()).map(r=>`<tr><td><b>${esc(r.id)}</b></td><td>${esc(r.product)}</td><td>${r.qty}</td><td>${money(r.unitCost||45)}</td><td>${money(r.total||r.qty*45)}</td><td>${money(r.payment)}</td><td>${esc(r.paymentRef||'—')}</td><td>${new Date(r.date).toLocaleDateString('en-GB')}</td><td>${badge(r.status)}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">No requests yet.</td></tr>'}</tbody></table></div></div>`);
  updateStockRequestTotal(); return;
 }
 layout(`<div class="page-intro"><div><div class="eyebrow">OWNER CONTROL</div><h2>Company Stock Requests</h2><p>Every company request is listed below. Review the request, payment and quantity, then allocate stock after payment confirmation.</p></div><div class="mini-stat"><b>${db.stockRequests.filter(r=>r.status==='Pending').length}</b><span>Pending requests</span></div></div><div class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Request</th><th>Company</th><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Total</th><th>Payment</th><th>Payment Ref</th><th>Requested By</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>${db.stockRequests.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r=>`<tr><td><b>${esc(r.id)}</b><div class="note">${esc(r.note||'No note')}</div></td><td><b>${esc(r.companyName)}</b></td><td>${esc(r.product)}</td><td><strong>${r.qty}</strong></td><td>${money(r.unitCost||45)}</td><td><strong>${money(r.total||r.qty*45)}</strong></td><td>${money(r.payment)}</td><td>${esc(r.paymentRef||'—')}</td><td>${esc(r.requestedBy)}</td><td>${new Date(r.date).toLocaleString('en-GB')}</td><td>${badge(r.status)}</td><td>${r.status==='Pending'?`<button class="btn btn-primary" onclick="approveStockRequest('${r.id}')">Approve & Add Stock</button>`:'<span class="note">Processed</span>'}</td></tr>`).join('')||'<tr><td colspan="12" class="empty">No stock requests.</td></tr>'}</tbody></table></div></div>`);
}

// Owner can use the unlimited master stock without numeric stock validation.
function selectProduct(id){const p=companyProducts().find(x=>x.id===id);if(!p)return;if(!p.isUnlimited&&p.qty<=0)return toast('Out of Stock');const existing=orderProducts.find(x=>x.id===id);if(existing)existing.qty+=1;else orderProducts.push({id:p.id,code:p.code,name:p.name,qty:1,price:p.sell});renderProductRows();$('#productSearch').value='';$('#productResults').innerHTML=''}
function addFirstProductFromSearch(){const q=$('#productSearch')?.value.trim().toLowerCase();if(!q)return toast('Type a product name or code first');const list=companyProducts().filter(p=>`${p.name} ${p.code}`.toLowerCase().includes(q));if(!list.length)return toast('Product not found');const p=list[0];if(!p.isUnlimited&&p.qty<=0){toast('Out of Stock');$('#productResults').innerHTML=`<div class="stock-warning">Out of Stock — ${esc(p.name)}</div>`;return}selectProduct(p.id)}
function renderProductSearch(){const q=$('#productSearch').value.toLowerCase().trim();const ps=companyProducts().filter(p=>!q||`${p.name} ${p.code}`.toLowerCase().includes(q));productActiveIndex=-1;$('#productResults').innerHTML=q?ps.map((p,i)=>(p.isUnlimited||p.qty>0)?`<button class="product-result" data-index="${i}" onclick="selectProduct(${p.id})"><span><b>${esc(p.name)}</b><small>${esc(p.code)} • Available ${p.isUnlimited?'Unlimited':p.qty}</small></span><strong>${money(p.sell)}</strong></button>`:`<div class="product-result out-stock" aria-disabled="true"><span><b>${esc(p.name)}</b><small>${esc(p.code)} • Available 0</small></span><strong>Out of Stock</strong></div>`).join('')||'<div class="empty">No matching products</div>':''}
function changeOrderQty(i,v){const n=Math.max(1,Number(v));const p=companyProducts().find(x=>x.id===orderProducts[i].id);if(!p)return;if(!p.isUnlimited && n>p.qty)return toast('Not enough stock');orderProducts[i].qty=n;renderProductRows()}

// Custom layout editor gets a real custom text field.
const _oldWaybillLayoutEditor=waybillLayoutEditor;
waybillLayoutEditor=function(layoutId){
  const base=_oldWaybillLayoutEditor(layoutId);
  const idx=base.indexOf('<div class="actions" style="margin-top:12px"><label class="checkline">');
  if(idx<0)return base;
  const custom='<div class="field" style="margin-top:12px"><label>Custom Text Block</label><textarea id="wblCustom" rows="2" placeholder="Optional text for a Custom Text section"></textarea></div>';
  return base.slice(0,idx)+custom+base.slice(idx);
}
const _oldSaveWaybillLayout=saveWaybillLayout;
saveWaybillLayout=function(id){
  if(db.session.role!=='Owner')return toast('Owner only');
  const sections=$$('#wblSections .wb-section-chip').map(x=>x.dataset.sec);
  const data={id,name:$('#wblName').value.trim()||'Custom Layout',orientation:$('#wblOrient').value,font:$('#wblFont').value,fontSize:Number($('#wblSize').value)||18,bold:$('#wblBold').checked,italic:$('#wblItalic').checked,textColor:$('#wblText').value,accent:$('#wblAccent').value,border:$('#wblBorder').value,radius:Number($('#wblRadius').value)||0,sections,customText:$('#wblCustom')?.value||''};
  const i=db.waybillLayouts.findIndex(x=>x.id===id);if(i>=0)db.waybillLayouts[i]=data;else db.waybillLayouts.push(data);save();toast('Waybill layout saved');waybillDesigner();
}
const _oldCustomWaybillHtml=customWaybillHtml;
customWaybillHtml=function(orders,s,l){
  const c=db.companies.find(x=>x.id===orders[0]?.companyId)||{};
  const make=(o)=>{const map={customer:`<section class="wbsec"><div class="cap">TO</div><div class="customer">${esc(o.customer)}</div><div class="customer-detail">${esc(o.address)}</div><div class="customer-detail">${esc(o.city||'')}</div><div class="customer-detail">${esc(o.tel)}${o.tel2?' / '+esc(o.tel2):''}</div></section>`,sender:`<section class="wbsec"><div class="cap">FROM</div><b>${esc(c.name||s.company||'APEX HOLDINGS')}</b><div>${esc(c.address||'Sri Lanka')}</div><div>${esc(c.phone||'')}</div></section>`,product:`<section class="wbsec"><div><b>Product</b> ${esc(o.productSummary||'')}</div><div><b>Color</b> ${esc(o.variant||'-')}</div><div><b>Qty</b> ${o.qty||1}</div></section>`,amount:`<section class="wbsec amount"><b>${money(o.price)}</b></section>`,reference:`<section class="wbsec"><div class="cap">WAYBILL</div><b>${esc(o.waybill||s.id)}</b></section>`,thankyou:`<section class="wbsec thank">Thank you for your trust in us.</section>`,custom:`<section class="wbsec">${esc(l.customText||'Custom Text')}</section>`};return `<article class="custom-waybill">${(l.sections||defaultWaybillSections()).map(x=>map[x]||'').join('')}</article>`};
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(l.name)}</title><style>@page{size:A4 ${l.orientation==='landscape'?'landscape':'portrait'};margin:6mm}*{box-sizing:border-box}body{margin:0;font-family:${l.font};color:${l.textColor};background:#fff}.sheet{width:${l.orientation==='landscape'?'285mm':'198mm'};min-height:${l.orientation==='landscape'?'198mm':'284mm'};display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr);gap:4mm}.custom-waybill{border:2px ${l.border} ${l.accent};border-radius:${l.radius}px;padding:4mm;display:flex;flex-direction:column;font-size:${l.fontSize}px;font-weight:${l.bold?700:400};font-style:${l.italic?'italic':'normal'};overflow:hidden;min-width:0;overflow-wrap:anywhere;word-break:break-word}.wbsec{min-width:0;max-width:100%;overflow:hidden;overflow-wrap:anywhere;word-break:break-word}.cap{font-size:${Math.max(10,l.fontSize-5)}px;font-weight:700;letter-spacing:.8px}.customer{font-size:${l.fontSize+4}px;font-weight:700;margin:.8mm 0}.customer-detail{font-size:${Math.max(16,Number(l.fontSize||20))}px;line-height:1.25;font-weight:500;margin:.5mm 0}.wbsec{padding:2mm 0;border-bottom:1px solid #999}.amount{font-size:${l.fontSize+6}px;text-align:center;border:2px solid ${l.accent};padding:3mm;margin-top:1.5mm}.thank{text-align:center;margin-top:auto;border-top:1px solid #999;border-bottom:0}.wbsec b{font-weight:700}</style></head><body><div class="sheet">${orders.slice(0,6).map(make).join('')}</div><div class="preview-controls"><button onclick="window.print()">Print Waybill</button><button onclick="window.close()">Close Preview</button></div><script>document.title='Waybill Preview - '+document.title<\/script></body></html>`;
}

const pages={dashboard, 'stock-list':stockList,'stock-purchase':stockPurchase,'stock-requests':stockPurchase,'product-tools':productTools,'import-lead':importLead,'lead-list':leadList,'new-order':()=>newOrder(),'pending-orders':pendingOrders,'search-orders':searchOrders,ship,'shipped-list':shippedList,'add-return':addReturn,'returned-list':returnedList,'create-company':createCompany,'company-list':companyList,'new-staff':newStaff,'staff-list':staffList,'commission-rate':commissionRate,settings};
$$('.group-toggle').forEach(btn=>btn.addEventListener('click',()=>{$$('.nav-group').forEach(g=>{if(g!==btn.parentElement)g.classList.remove('open')});btn.parentElement.classList.toggle('open')}));
$$('[data-route]').forEach(btn=>btn.addEventListener('click',()=>{navTo(btn.dataset.route);if(window.innerWidth<900)$('#sidebar').classList.remove('open')}));
$('#logoutBtn').addEventListener('click',logout);applyTheme();$('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));window.addEventListener('hashchange',render);window.addEventListener('load',()=>{applyTheme();bootApp()});


/* ===== Global stock-cost + leaderboard polish ===== */
// One shared stock purchase cost applies to every company request.
if (!Number.isFinite(Number(db.stockUnitCost)) || Number(db.stockUnitCost) <= 0) db.stockUnitCost = 45;
if (Array.isArray(db.products)) db.products.forEach(p => { p.cost = Number(db.stockUnitCost); });
save();

function currentStockUnitCost(){ return Number(db.stockUnitCost || 45); }

function editOwnerCost(pid){
  if(db.session?.role!=='Owner') return toast('Owner only');
  const current=currentStockUnitCost();
  const v=prompt('Stock purchase cost per unit (Rs). This value applies to ALL company stock requests.', String(current));
  if(v===null) return;
  const n=Number(v);
  if(!Number.isFinite(n) || n<=0) return toast('Enter a valid stock cost');
  db.stockUnitCost=n;
  (db.products||[]).forEach(p=>{p.cost=n;});
  (db.stockRequests||[]).forEach(r=>{ if(r.status==='Pending'){ r.unitCost=n; r.total=Number(r.qty||0)*n; } });
  save();
  toast(`Stock cost updated to ${money(n)} for all companies`);
  navTo('stock-list');
}

function updateStockRequestTotal(){
  const q=Number($('#reqQty')?.value||0), t=q*currentStockUnitCost();
  if($('#reqUnit')) $('#reqUnit').value=money(currentStockUnitCost());
  if($('#reqTotal')) $('#reqTotal').value=money(t);
  if($('#reqSummaryQty')) $('#reqSummaryQty').textContent=String(q);
  if($('#reqSummaryTotal')) $('#reqSummaryTotal').textContent=money(t);
  if($('#reqPay') && (!$('#reqPay').value || Number($('#reqPay').value)===Number($('#reqPay').dataset.auto||0))){
    $('#reqPay').value=t; $('#reqPay').dataset.auto=t;
  }
  if($('#reqSummaryPay')) $('#reqSummaryPay').textContent=money(Number($('#reqPay')?.value||0));
}

function sendStockRequest(){
  if(db.session?.role==='Owner') return toast('Owner does not send company stock requests');
  const requestedProductId=Number($('#reqProduct')?.value);
  const p=requestableProducts().find(x=>x.id===requestedProductId);
  const q=Number($('#reqQty')?.value); const unit=currentStockUnitCost();
  const payment=Number($('#reqPay').value); const ref=$('#reqRef').value.trim(); const note=$('#reqNote').value.trim();
  if(!p || q<1) return toast('Select a product and enter a valid quantity');
  const total=q*unit;
  if(payment<total) return toast(`Payment amount cannot be less than ${money(total)}`);
  const req={id:'REQ-'+Date.now().toString().slice(-7),companyId:currentCompanyId(),companyName:currentUser().company,productId:p.id,product:p.name,qty:q,unitCost:unit,total,payment,note,paymentRef:ref,requestedBy:currentUser().name,status:'Pending',date:new Date().toISOString()};
  db.stockRequests.unshift(req); save(); toast('Stock request sent to Owner'); navTo('stock-purchase');
}

function approveStockRequest(id){
  if(db.session?.role!=='Owner') return toast('Owner only');
  const r=db.stockRequests.find(x=>x.id===id), p=db.products.find(x=>x.id===r?.productId);
  if(!r||!p) return;
  if(r.status!=='Pending') return toast('Request already processed');
  const requestedCompany=db.companies.find(c=>c.id===r.companyId);
  if(requestedCompany?.catalogIsolated && p.companyId!==r.companyId) return toast('This company can only purchase stock for products in its own catalogue.');
  const expected=Number(r.qty||0)*currentStockUnitCost();
  if(Number(r.payment)<expected) return toast('Payment is not sufficient');
  r.unitCost=currentStockUnitCost(); r.total=expected;
  addCompanyStock(r.companyId,r.productId,Number(r.qty||0));
  r.status='Approved'; r.approvedAt=new Date().toISOString(); r.approvedBy=owner.name;
  save(); if(window.__bulkApprove) return true; toast(`${r.qty} units allocated to ${r.companyName}`); render(); return true;
}

function stockPurchase(){
  if(db.session.role!=='Owner'){
    const reqProducts=companyProducts();
    layout(`<div class="page-intro"><div><div class="eyebrow">STOCK CONTROL</div><h2>Request Stock From Owner</h2><p>Request any quantity. The same stock price applies to every company.</p></div></div>
    <div class="card section-card stock-request-form"><div class="panel-head"><div><div class="panel-title">New Stock Request</div><div class="panel-sub">Unit price: <strong>${money(currentStockUnitCost())}</strong></div></div><span class="badge pending">Owner approval required</span></div>
    <div class="form-grid stock-request-grid"><div class="field span-2"><label>Product</label><select id="reqProduct" onchange="updateStockRequestTotal()">${reqProducts.map(p=>`<option value="${p.id}">${esc(p.name)} — ${esc(p.code)}</option>`).join('')}</select></div><div class="field"><label>Requested Qty</label><input id="reqQty" type="number" min="1" value="10" oninput="updateStockRequestTotal()"></div><div class="field"><label>Unit Price</label><input id="reqUnit" value="${esc(money(currentStockUnitCost()))}" readonly></div><div class="field"><label>Total Stock Cost</label><input id="reqTotal" value="${esc(money(10*currentStockUnitCost()))}" readonly></div><div class="field"><label>Payment Amount</label><input id="reqPay" type="number" min="0" value="${10*currentStockUnitCost()}" oninput="updateStockRequestTotal()"></div><div class="field"><label>Payment / Transaction Ref</label><input id="reqRef" placeholder="e.g. TRX-12345"></div><div class="field span-4 receipt-field"><label>Payment receipt * (image or PDF)</label><input id="reqReceipt" type="file" accept="image/*,application/pdf" onchange="pickStockReceipt(this)"><div id="reqReceiptPreview" class="receipt-preview"><span class="note">Attach the bank slip / transfer screenshot. Required to send the request.</span></div></div><div class="field span-4"><label>Request Note</label><textarea id="reqNote" rows="3" placeholder="Payment / delivery / stock details for Owner"></textarea></div></div>
    <div class="request-summary"><div class="mini-stat"><b id="reqSummaryQty">10</b><span>Requested quantity</span></div><div class="mini-stat"><b id="reqSummaryTotal">${esc(money(10*currentStockUnitCost()))}</b><span>Stock cost</span></div><div class="mini-stat"><b id="reqSummaryPay">${esc(money(10*currentStockUnitCost()))}</b><span>Payment entered</span></div></div>
    <div class="actions" style="margin-top:16px"><button class="btn btn-primary" onclick="sendStockRequest()">Send Stock Request</button><button class="btn btn-outline" onclick="navTo('stock-list')">Back to Stock</button></div></div>`);
    updateStockRequestTotal(); return;
  }
  layout(`<div class="page-intro"><div><div class="eyebrow">OWNER CONTROL</div><h2>Company Stock Requests</h2><p>Every company request uses the global stock cost. Approving a request adds the requested quantity to that company without reducing Owner master stock.</p></div><div class="mini-stat"><b>${db.stockRequests.filter(r=>r.status==='Pending').length}</b><span>Pending requests</span></div></div><div class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Request</th><th>Company</th><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Total</th><th>Payment</th><th>Payment Ref</th><th>Requested By</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>${db.stockRequests.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r=>`<tr><td><b>${esc(r.id)}</b><div class="note">${esc(r.note||'No note')}</div></td><td><b>${esc(r.companyName)}</b></td><td>${esc(r.product)}</td><td><strong>${r.qty}</strong></td><td>${money(r.unitCost||currentStockUnitCost())}</td><td><strong>${money(r.total||r.qty*currentStockUnitCost())}</strong></td><td>${money(r.payment)}</td><td>${esc(r.paymentRef||'—')}</td><td>${esc(r.requestedBy)}</td><td>${new Date(r.date).toLocaleString('en-GB')}</td><td>${badge(r.status)}</td><td>${r.status==='Pending'?`<button class="btn btn-primary" onclick="approveStockRequest('${r.id}')">Approve & Add Stock</button>`:'<span class="note">Processed</span>'}</td></tr>`).join('')||'<tr><td colspan="12" class="empty">No stock requests.</td></tr>'}</tbody></table></div></div>`);
}

function medalMarkup(rank){
  if(rank===1)return '<span class="medal medal-gold" title="1st place">🥇 1</span>';
  if(rank===2)return '<span class="medal medal-silver" title="2nd place">🥈 2</span>';
  if(rank===3)return '<span class="medal medal-bronze" title="3rd place">🥉 3</span>';
  if(rank<=10)return `<span class="medal medal-blue" title="${rank}th place">${rank}</span>`;
  return `<span class="rank-badge">${rank}</span>`;
}


/* ===== v11 FINAL: Advanced Waybill Workspace + Company Purchase History ===== */
(function(){
  // ----- Route label: Waybill Edit -----
  
  // ----- Company Admin: own stock-purchase/request history with date filters -----
  const _ownerStockPurchase = stockPurchase;
  function stockPurchaseScoped(){
    if(db.session?.role==='Owner') return _ownerStockPurchase();
    const reqProducts = companyProducts();
    const rows = db.stockRequests
      .filter(r=>r.companyId===currentCompanyId())
      .sort((a,b)=>new Date(b.date)-new Date(a.date));
    layout(`<div class="page-intro"><div><div class="eyebrow">STOCK CONTROL</div><h2>Request Stock From Owner</h2><p>Request stock for your company and review your own stock purchase/request history.</p></div></div>
      <div class="card section-card stock-request-form">
        <div class="panel-head"><div><div class="panel-title">New Stock Request</div><div class="panel-sub">Unit price: <strong>${money(currentStockUnitCost())}</strong></div></div><span class="badge pending">Owner approval required</span></div>
        <div class="form-grid stock-request-grid">
          <div class="field span-2"><label>Product</label><select id="reqProduct" onchange="updateStockRequestTotal()">${reqProducts.map(p=>`<option value="${p.id}">${esc(p.name)} — ${esc(p.code)}</option>`).join('')}</select></div>
          <div class="field"><label>Requested Qty</label><input id="reqQty" type="number" min="1" value="10" oninput="updateStockRequestTotal()"></div>
          <div class="field"><label>Unit Price</label><input id="reqUnit" value="${esc(money(currentStockUnitCost()))}" readonly></div>
          <div class="field"><label>Total Stock Cost</label><input id="reqTotal" value="${esc(money(10*currentStockUnitCost()))}" readonly></div>
          <div class="field"><label>Payment Amount</label><input id="reqPay" type="number" min="0" value="${10*currentStockUnitCost()}" oninput="updateStockRequestTotal()"></div>
          <div class="field"><label>Payment / Transaction Ref</label><input id="reqRef" placeholder="e.g. TRX-12345"></div>
          <div class="field span-4 receipt-field"><label>Payment receipt * (image or PDF)</label><input id="reqReceipt" type="file" accept="image/*,application/pdf" onchange="pickStockReceipt(this)"><div id="reqReceiptPreview" class="receipt-preview"><span class="note">Attach the bank slip / transfer screenshot. Required to send the request.</span></div></div><div class="field span-4"><label>Request Note</label><textarea id="reqNote" rows="3" placeholder="Payment / stock details for Owner"></textarea></div>
        </div>
        <div class="request-summary"><div class="mini-stat"><b id="reqSummaryQty">10</b><span>Requested quantity</span></div><div class="mini-stat"><b id="reqSummaryTotal">${esc(money(10*currentStockUnitCost()))}</b><span>Stock cost</span></div><div class="mini-stat"><b id="reqSummaryPay">${esc(money(10*currentStockUnitCost()))}</b><span>Payment entered</span></div></div>
        <div class="actions" style="margin-top:16px"><button class="btn btn-primary" onclick="sendStockRequest()">Send Stock Request</button><button class="btn btn-outline" onclick="navTo('stock-list')">Back to Stock</button></div>
      </div>
      <div class="card section-card purchase-history-panel" style="margin-top:16px">
        <div class="panel-head"><div><div class="panel-title">My Stock Purchases / Requests</div><div class="panel-sub">Only this company’s requests are shown.</div></div></div>
        <div class="toolbar purchase-filter-toolbar" style="margin-top:12px">
          <div class="field"><label>Start Date</label><input id="purchaseStart" type="date"></div>
          <div class="field"><label>End Date</label><input id="purchaseEnd" type="date"></div>
          <div class="field grow"><label>Search</label><input id="purchaseSearch" placeholder="Product, request, reference..." oninput="filterCompanyPurchases()"></div>
          <button class="btn btn-outline" onclick="filterCompanyPurchases()">Search</button>
          <button class="btn btn-outline" onclick="clearCompanyPurchaseFilters()">Clear</button>
        </div>
        <div class="table-wrap" style="margin-top:12px"><table class="table" id="purchaseHistoryTable"><thead><tr><th>Request</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Payment</th><th>Reference</th><th>Receipt</th><th>Date &amp; Time</th><th>Status</th></tr></thead><tbody id="purchaseHistoryBody"></tbody></table></div>
      </div>`);
    const end = today();
    const d=new Date();d.setDate(d.getDate()-30);const start=d.toISOString().slice(0,10);
    if($('#purchaseStart')) $('#purchaseStart').value=start;
    if($('#purchaseEnd')) $('#purchaseEnd').value=end;
    window.__companyPurchaseRows = rows;
    filterCompanyPurchases();
    updateStockRequestTotal();
  }
  window.filterCompanyPurchases=function(){
    const rows=window.__companyPurchaseRows||[];const sd=$('#purchaseStart')?.value||'';const ed=$('#purchaseEnd')?.value||'';const q=($('#purchaseSearch')?.value||'').toLowerCase().trim();
    const a=rows.filter(r=>{const day=String(r.date||'').slice(0,10);return (!sd||day>=sd)&&(!ed||day<=ed)&&(!q||`${r.id} ${r.product} ${r.companyName} ${r.paymentRef||''} ${r.status}`.toLowerCase().includes(q))});
    if($('#purchaseHistoryBody')) $('#purchaseHistoryBody').innerHTML=a.map(r=>`<tr><td><b>${esc(r.id)}</b></td><td>${esc(r.product)}</td><td>${r.qty}</td><td>${money(r.unitCost||currentStockUnitCost())}</td><td><strong>${money(r.total||Number(r.qty||0)*currentStockUnitCost())}</strong></td><td>${money(r.payment)}</td><td>${esc(r.paymentRef||'—')}</td><td>${receiptCell(r)}</td><td>${new Date(r.date).toLocaleString('en-GB')}</td><td>${badge(r.status)}</td></tr>`).join('')||'<tr><td colspan="10" class="empty">No stock purchase/request records in this date range.</td></tr>';
  };
  window.clearCompanyPurchaseFilters=function(){if($('#purchaseStart'))$('#purchaseStart').value='';if($('#purchaseEnd'))$('#purchaseEnd').value='';if($('#purchaseSearch'))$('#purchaseSearch').value='';filterCompanyPurchases()};
  stockPurchase=stockPurchaseScoped;
  if (typeof pages==='object'){pages['stock-purchase']=stockPurchaseScoped;pages['stock-requests']=stockPurchaseScoped;}

  // ----- Advanced Photoshop-like Waybill Designer -----
  const WB_KEYS = {
    customer:'Customer Name', address:'Address', city:'Town / City', phone1:'Phone Number 1', phone2:'Phone Number 2',
    company:'Company Name', companyAddress:'Company Address', companyPhone:'Company Phone', product:'Product',
    qty:'Quantity', amount:'Price / Amount', reference:'Reference / Waybill No', variant:'Color', custom:'Custom Text', logo:'Company Logo'
  };
  const WB_TYPES = [['text','Text'],['box','Box / Shape'],['rounded','Rounded Shape'],['circle','Circle Shape'],['line','Line'],['logo','Logo'],['customer','Customer Name'],['address','Address'],['city','Town / City'],['phone1','Phone 1'],['phone2','Phone 2'],['company','Company Name'],['companyAddress','Company Address'],['companyPhone','Company Phone'],['product','Product'],['qty','Quantity'],['amount','Price / Amount'],['reference','Waybill / Reference'],['variant','Color / Size'],['custom','Custom Text']];
  function wbId(){return 'el_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)}
  function makeWbEl(type,text,label,x,y,w,h,overrides={}){
    const base={id:wbId(),type,text,label,x,y,w,h,font:'Arial, Helvetica, sans-serif',size:16,bold:false,weight:400,italic:false,color:'#111827',fill:'transparent',fillOpacity:0,border:'#1f2937',borderWidth:0,radius:6,align:'left',opacity:1,rotation:0};
    return Object.assign(base,overrides);
  }
  function defaultElements(preset=1){
    const white='#ffffff', dark='#111827', ink='#0f172a', soft='#f8fafc', line='#cbd5e1';
    const commonCustomer={font:'Arial, Helvetica, sans-serif',size:18,bold:true,weight:700,color:ink};
    const commonAddress={font:'Arial, Helvetica, sans-serif',size:17,bold:false,weight:400,color:ink};
    const commonPhone={font:'Arial, Helvetica, sans-serif',size:17,bold:false,weight:400,color:ink};
    const thank={font:'Arial, Helvetica, sans-serif',size:11,bold:false,weight:400,color:'#475569',align:'center'};
    if(preset===1){
      return [
        makeWbEl('company','APEX HOLDINGS','Company Name',5,4,44,7,{size:13,bold:true,weight:800}),
        makeWbEl('reference','Ref : WB-00001','Reference / Waybill No',5,11,34,6,{size:11,color:'#475569'}),
        makeWbEl('text','WAYBILL','Title',54,4,41,9,{size:24,bold:true,weight:900,align:'right',color:'#000'}),
        makeWbEl('box','','Customer Box',5,19,90,37,{fill:soft,fillOpacity:100,border:line,borderWidth:1.2,radius:9}),
        makeWbEl('text','TO','To Label',8,21,18,5,{size:10,bold:true,weight:800,color:'#475569'}),
        makeWbEl('customer','Customer Name','Customer Name',8,27,84,8,commonCustomer),
        makeWbEl('address','Address','Address',8,36,84,6,commonAddress),
        makeWbEl('city','Town / City','Town / City',8,43,84,5,commonAddress),
        makeWbEl('phone1','Phone 1','Phone 1',8,49,40,5,commonPhone),
        makeWbEl('phone2','Phone 2','Phone 2',50,49,40,5,commonPhone),
        makeWbEl('product','Product','Product',5,59,55,6,{size:14,bold:true,weight:700}),
        makeWbEl('variant','Color','Color',62,59,33,6,{size:13,align:'right'}),
        makeWbEl('company','APEX HOLDINGS','Sender Name',5,67,90,5,{size:11,bold:true,weight:700}),
        makeWbEl('companyAddress','Company Address','Sender Address',5,72,58,5,{size:10,color:'#475569'}),
        makeWbEl('companyPhone','Company Phone','Sender Phone',64,72,31,5,{size:10,color:'#475569',align:'right'}),
        makeWbEl('amount','Rs. 0','Price / Amount',50,80,45,11,{size:25,bold:true,weight:900,align:'center',fill:white,fillOpacity:100,border:dark,borderWidth:2,radius:6}),
        makeWbEl('text','Thank you for your trust in us.','Thank You',5,94,90,4,{...thank})
      ];
    }
    if(preset===2){
      return [
        makeWbEl('text','WAYBILL','Title',5,4,90,9,{size:26,bold:true,weight:900,align:'left'}),
        makeWbEl('company','APEX HOLDINGS','Company',5,13,50,6,{size:13,bold:true,weight:800}),
        makeWbEl('reference','Ref : WB-00001','Reference',58,13,37,6,{size:10,align:'right',color:'#475569'}),
        makeWbEl('box','','Top Customer',5,21,90,42,{fill:'#ffffff',fillOpacity:100,border:'#111827',borderWidth:1.6,radius:3}),
        makeWbEl('text','TO','To',8,23,14,5,{size:10,bold:true,weight:800}),
        makeWbEl('customer','Customer Name','Customer',8,30,84,8,commonCustomer),
        makeWbEl('address','Address','Address',8,39,84,6,commonAddress),
        makeWbEl('city','Town / City','Town',8,46,84,5,commonAddress),
        makeWbEl('phone1','Phone 1','Phone 1',8,53,40,5,commonPhone),
        makeWbEl('phone2','Phone 2','Phone 2',50,53,40,5,commonPhone),
        makeWbEl('amount','Rs. 0','Price',58,66,37,15,{size:27,bold:true,weight:900,align:'center',fill:'#eef2ff',fillOpacity:100,border:'#111827',borderWidth:1.5,radius:7}),
        makeWbEl('product','Product','Product',5,66,49,6,{size:14,bold:true,weight:700}),
        makeWbEl('variant','Color','Color',5,73,49,5,{size:12,color:'#475569'}),
        makeWbEl('company','APEX HOLDINGS','Sender Name',5,81,90,5,{size:11,bold:true,weight:700}),
        makeWbEl('companyAddress','Company Address','Sender Address',5,86,56,5,{size:10,color:'#475569'}),
        makeWbEl('companyPhone','Company Phone','Sender Phone',62,86,33,5,{size:10,color:'#475569',align:'right'}),
        makeWbEl('text','Thank you for your trust in us.','Thank You',5,94,90,4,{...thank})
      ];
    }
    if(preset===3){
      return [
        makeWbEl('company','APEX HOLDINGS','Company',5,4,45,7,{size:13,bold:true,weight:800}),
        makeWbEl('reference','WB-00001','Reference',54,5,41,6,{size:11,align:'right',color:'#475569'}),
        makeWbEl('text','NEW WAYBILL','Title',5,13,90,9,{size:25,bold:true,weight:900,align:'center'}),
        makeWbEl('box','','Customer Panel',5,24,90,33,{fill:'#ffffff',fillOpacity:100,border:'#0f172a',borderWidth:2,radius:12}),
        makeWbEl('text','TO','To',8,26,15,5,{size:10,bold:true,weight:800}),
        makeWbEl('customer','Customer Name','Customer',8,32,84,8,commonCustomer),
        makeWbEl('address','Address','Address',8,41,84,6,commonAddress),
        makeWbEl('city','Town / City','Town',8,48,84,5,commonAddress),
        makeWbEl('phone1','Phone 1','Phone1',8,54,40,5,commonPhone),
        makeWbEl('phone2','Phone 2','Phone2',50,54,40,5,commonPhone),
        makeWbEl('text','Product','Product Label',5,60,15,5,{size:10,bold:true,weight:800,color:'#475569'}),
        makeWbEl('product','Product','Product',20,60,45,6,{size:14,bold:true,weight:700}),
        makeWbEl('variant','Color','Color',66,60,29,6,{size:12,align:'right'}),
        makeWbEl('company','APEX HOLDINGS','Sender',5,69,90,5,{size:11,bold:true,weight:700}),
        makeWbEl('companyAddress','Company Address','Sender Address',5,74,58,5,{size:10,color:'#475569'}),
        makeWbEl('companyPhone','Company Phone','Sender Phone',64,74,31,5,{size:10,color:'#475569',align:'right'}),
        makeWbEl('amount','Rs. 0','Price',5,81,90,12,{size:30,bold:true,weight:900,align:'center',fill:'#fff',fillOpacity:100,border:'#111827',borderWidth:2,radius:0}),
        makeWbEl('text','Thank you for your trust in us.','Thank You',5,95,90,4,{...thank})
      ];
    }
    if(preset===4){
      return [
        makeWbEl('text','WAYBILL','Title',58,4,37,8,{size:22,bold:true,weight:900,align:'right'}),
        makeWbEl('company','APEX HOLDINGS','Company',5,4,48,7,{size:13,bold:true,weight:800}),
        makeWbEl('reference','Ref : WB-00001','Reference',5,12,44,5,{size:10,color:'#475569'}),
        makeWbEl('box','','Customer Card',5,20,90,35,{fill:'#f8fafc',fillOpacity:100,border:'#111827',borderWidth:1,radius:0}),
        makeWbEl('customer','Customer Name','Customer',8,24,84,8,commonCustomer),
        makeWbEl('address','Address','Address',8,34,84,6,commonAddress),
        makeWbEl('city','Town / City','Town',8,41,84,5,commonAddress),
        makeWbEl('phone1','Phone 1','Phone1',8,48,40,5,commonPhone),
        makeWbEl('phone2','Phone 2','Phone2',50,48,40,5,commonPhone),
        makeWbEl('product','Product','Product',5,59,55,7,{size:14,bold:true,weight:700}),
        makeWbEl('variant','Color','Color',62,59,33,7,{size:12,align:'right'}),
        makeWbEl('amount','Rs. 0','Price',55,69,40,15,{size:26,bold:true,weight:900,align:'center',fill:'#0f172a',fillOpacity:100,color:'#fff',border:'#0f172a',borderWidth:1,radius:2}),
        makeWbEl('company','APEX HOLDINGS','Sender',5,70,44,5,{size:11,bold:true,weight:700}),
        makeWbEl('companyAddress','Company Address','Sender Address',5,76,50,5,{size:10,color:'#475569'}),
        makeWbEl('companyPhone','Company Phone','Sender Phone',5,82,50,5,{size:10,color:'#475569'}),
        makeWbEl('text','Thank you for your trust in us.','Thank You',5,95,90,4,{...thank})
      ];
    }
    return [
      makeWbEl('company','APEX HOLDINGS','Company',5,4,90,7,{size:14,bold:true,weight:800,align:'center'}),
      makeWbEl('text','WAYBILL','Title',5,12,90,8,{size:24,bold:true,weight:900,align:'center',color:'#0f172a'}),
      makeWbEl('reference','Ref : WB-00001','Reference',5,20,90,5,{size:10,align:'center',color:'#475569'}),
      makeWbEl('box','','Customer Panel',5,28,90,34,{fill:'#eff6ff',fillOpacity:100,border:'#1d4ed8',borderWidth:1.5,radius:12}),
      makeWbEl('text','TO','To',8,30,15,5,{size:10,bold:true,weight:800,color:'#1d4ed8'}),
      makeWbEl('customer','Customer Name','Customer',8,36,84,8,{...commonCustomer,color:'#0f172a'}),
      makeWbEl('address','Address','Address',8,45,84,6,{...commonAddress,color:'#0f172a'}),
      makeWbEl('city','Town / City','Town',8,52,84,5,{...commonAddress,color:'#0f172a'}),
      makeWbEl('phone1','Phone 1','Phone1',8,58,40,5,{...commonPhone,color:'#0f172a'}),
      makeWbEl('phone2','Phone 2','Phone2',50,58,40,5,{...commonPhone,color:'#0f172a'}),
      makeWbEl('product','Product','Product',5,65,55,6,{size:14,bold:true,weight:700}),
      makeWbEl('variant','Color','Color',62,65,33,6,{size:12,align:'right'}),
      makeWbEl('amount','Rs. 0','Price',5,75,90,13,{size:29,bold:true,weight:900,align:'center',fill:'#ffffff',fillOpacity:100,border:'#1d4ed8',borderWidth:2,radius:10}),
      makeWbEl('company','APEX HOLDINGS','Sender',5,89,90,5,{size:11,bold:true,weight:700,align:'center'}),
      makeWbEl('companyAddress','Company Address','Sender Address',5,94,58,4,{size:10,color:'#475569'}),
      makeWbEl('companyPhone','Company Phone','Sender Phone',64,94,31,4,{size:10,color:'#475569',align:'right'}),
      makeWbEl('text','Thank you for your trust in us.','Thank You',5,99,90,4,{...thank})
    ];
  }
  function ensureAdvancedWaybills(){
    if(!Array.isArray(db.waybillLayouts))db.waybillLayouts=[];
    if(!Array.isArray(db.waybillBuiltins))db.waybillBuiltins=[null,null,null,null,null];
    if(db.waybillPresetVersion!=='pdfmatch-v2'){
      db.waybillBuiltins=[1,2,3,4,5].map(i=>({id:'builtin-'+i,name:`Creative Layout ${i}`,orientation:(i<=2?'landscape':'portrait'),width:(i===1?132:i===2?132:210),height:(i===1?62:i===2?58:297),elements:defaultElements(i),builtin:true,updatedAt:null,printVariant:(i<=2?`pdf-match-${i}`:null)}));
      db.waybillPresetVersion='pdfmatch-v2';
    } else {
      for(let i=1;i<=5;i++){if(!db.waybillBuiltins[i-1])db.waybillBuiltins[i-1]={id:'builtin-'+i,name:`Creative Layout ${i}`,orientation:(i<=2?'landscape':'portrait'),width:(i===1?132:i===2?132:210),height:(i===1?62:i===2?58:297),elements:defaultElements(i),builtin:true,updatedAt:null,printVariant:(i<=2?`pdf-match-${i}`:null)}; else if(i<=2){db.waybillBuiltins[i-1].orientation='landscape';db.waybillBuiltins[i-1].width=i===1?132:132;db.waybillBuiltins[i-1].height=i===1?62:58;db.waybillBuiltins[i-1].printVariant=`pdf-match-${i}`;}}
    }
    save();
  }
  ensureAdvancedWaybills();
  if (db.waybillBuiltins?.[2]?.elements) { const ttl=db.waybillBuiltins[2].elements.find(e=>e.label==='Title'||e.type==='text'&&e.text==='WAYBILL'); if (ttl) ttl.text='NEW WAYBILL'; db.waybillBuiltins[2].elements.filter(e=>e.type==='variant').forEach(e=>{e.label='Color';e.text='Color'}); }
  function sampleData(){const o=db.orders[0]||{};const c=db.companies.find(x=>x.id===o.companyId)||db.companies[0]||{};return {customer:o.customer||'Sample Customer',address:o.address||'Sample Address',city:o.city||'Colombo',tel:o.tel||'0771234567',tel2:o.tel2||'0712345678',company:c.name||'APEX HOLDINGS',companyAddress:c.address||'Sri Lanka',companyPhone:c.phone||'011 200 1000',product:o.productSummary||'Sample Product',qty:o.qty||1,amount:o.price||4950,reference:o.waybill||'WB-SAMPLE',variant:o.variant||'Black / XL',logo:'assets/apex-logo.png',custom:'Custom Text'} }
  function clone(o){return JSON.parse(JSON.stringify(o))}
  function currentEditorLayout(){
    return {id:$('#wbEdId')?.value||('WB-'+Date.now()),name:$('#wbEdName')?.value?.trim()||'Custom Layout',orientation:$('#wbEdOrient')?.value||'portrait',width:Number($('#wbEdWidth')?.value)||210,height:Number($('#wbEdHeight')?.value)||297,elements:clone(window.__wbEditorElements||[]),updatedAt:new Date().toISOString()};
  }
  function wbEditorStart(layoutObj){
    const l=clone(layoutObj);window.__wbEditorElements=l.elements||defaultElements(1);window.__wbSelectedId=null;window.__wbEditingId=l.id;layout(`<div class="page-intro"><div><div class="eyebrow">OWNER CONTROL</div><h2>Waybill Edit</h2><p>Create, edit and arrange every element visually. Drag elements on the canvas, resize them and see the print design live.</p></div><div class="actions"><button class="btn btn-primary" onclick="wbEditorSave()">Save Layout</button><button class="btn btn-outline" onclick="navTo('waybill-designer')">Back</button></div></div>
      <div class="wb-ps-editor">
        <div class="card wb-tools-panel">
          <input type="hidden" id="wbEdId" value="${esc(l.id)}">
          <div class="panel-title">Layout</div>
          <div class="field"><label>Name</label><input id="wbEdName" value="${esc(l.name)}" oninput="wbEditorRefresh()"></div>
          <div class="form-grid wb-size-grid"><div class="field"><label>Width (mm)</label><input id="wbEdWidth" type="number" min="80" max="400" value="${l.width||210}" oninput="wbEditorRefresh()"></div><div class="field"><label>Height (mm)</label><input id="wbEdHeight" type="number" min="80" max="400" value="${l.height||297}" oninput="wbEditorRefresh()"></div></div>
          <div class="field"><label>Orientation</label><select id="wbEdOrient" onchange="wbEditorRefresh()"><option value="portrait" ${l.orientation==='portrait'?'selected':''}>Portrait</option><option value="landscape" ${l.orientation==='landscape'?'selected':''}>Landscape</option></select></div>
          <div class="panel-title" style="margin-top:16px">Add to canvas</div>
          <div class="wb-tool-grid">${WB_TYPES.map(([v,t])=>`<button class="wb-tool-btn" onclick="wbAddElement('${v}')">+ ${esc(t)}</button>`).join('')}</div>
          <div class="panel-title" style="margin-top:16px">5 Creative Layouts</div>
          <div class="wb-preset-row">${[1,2,3,4,5].map(i=>`<button class="btn btn-outline" onclick="wbLoadPreset(${i})">Layout ${i}</button>`).join('')}</div>
          <div class="panel-title" style="margin-top:16px">AI Waybill Assistant</div>
          <div class="field"><label>Describe your design</label><textarea id="wbAiPrompt" rows="3" placeholder="Example: clean black and white, large customer details, bold price box"></textarea></div>
          <div class="actions"><button class="btn btn-primary" onclick="wbAiGenerate()">✨ Generate Design</button><button class="btn btn-outline" onclick="wbAiGenerate(1)">Auto Style</button></div>
          <div class="note" style="margin-top:6px">Prompt-based offline assistant: no Canva login or API key required.</div>
          <div id="wbProps" class="wb-properties"><div class="wb-props-empty">Select an element to edit it.</div></div>
        </div>
        <div class="card wb-canvas-panel"><div class="panel-head"><div><div class="panel-title">Design Canvas</div><div class="panel-sub">Drag objects • resize from the handle • click text to edit its typography</div></div><span class="badge success">LIVE</span></div><div id="wbCanvasStage" class="wb-canvas-stage"></div></div>
        <div class="card wb-live-panel-new"><div class="panel-head"><div><div class="panel-title">Live Preview</div><div class="panel-sub">Print preview updates instantly</div></div></div><div id="wbLiveStage" class="wb-live-stage"></div></div>
      </div>`);wbEditorRefresh();
  }
  function wbEditorPage(){
    if(db.session.role!=='Owner')return toast('Owner only');ensureAdvancedWaybills();
    const custom=db.waybillLayouts||[];const built=db.waybillBuiltins||[];
    layout(`<div class="page-intro"><div><div class="eyebrow">OWNER CONTROL</div><h2>Waybill Edit</h2><p>Choose a built-in waybill or create unlimited custom designs.</p></div><button class="btn btn-primary" onclick="wbCreateNew()">+ Create New Waybill</button></div>
      <div class="card section-card"><div class="panel-title">Standard Layouts</div><div class="panel-sub">These five layouts are ready to edit. Changes can be used by the corresponding Shipped List layout button.</div><div class="wb-built-list">${built.map((l,i)=>`<div class="wb-list-row"><div><b>Layout ${i+1}</b><div class="note">${esc(l.orientation)} • ${l.width}×${l.height} mm • ${l.elements.length} elements</div></div><div class="actions"><button class="btn btn-outline" onclick="wbEditBuiltin(${i+1})">Edit</button><button class="btn btn-outline" onclick="wbPreviewSaved('builtin-${i+1}')">Preview</button></div></div>`).join('')}</div></div>
      <div class="card section-card" style="margin-top:16px"><div class="panel-title">Custom Layouts</div><div class="panel-sub">Unlimited layouts. Each saved layout can be edited or deleted.</div><div class="wb-built-list">${custom.map(l=>`<div class="wb-list-row"><div><b>${esc(l.name)}</b><div class="note">${esc(l.orientation)} • ${l.width}×${l.height} mm • ${l.elements?.length||0} elements</div></div><div class="actions"><button class="btn btn-outline" onclick="wbEditCustom('${esc(l.id)}')">Edit</button><button class="btn btn-outline" onclick="wbPreviewSaved('${esc(l.id)}')">Preview</button><button class="btn btn-danger" onclick="wbDeleteCustom('${esc(l.id)}')">Delete</button></div></div>`).join('')||'<div class="empty">No custom layouts yet.</div>'}</div></div>`);
  }
  window.wbCreateNew=function(){wbEditorStart({id:'WB-'+Date.now(),name:'New Waybill',orientation:'portrait',width:210,height:297,elements:defaultElements(1)})};
  window.wbEditBuiltin=function(n){ensureAdvancedWaybills();wbEditorStart(db.waybillBuiltins[n-1])};
  window.wbEditCustom=function(id){const l=db.waybillLayouts.find(x=>x.id===id);if(l)wbEditorStart(l)};
  window.wbLoadPreset=function(n){const l=db.waybillBuiltins[n-1]||{orientation:'portrait',width:210,height:297};window.__wbEditorElements=defaultElements(n);$('#wbEdOrient').value=l.orientation;$('#wbEdWidth').value=l.width;$('#wbEdHeight').value=l.height;wbEditorRefresh()}
  window.wbAddElement=function(type){const e={id:wbId(),type,text:WB_KEYS[type]||'Text',label:WB_KEYS[type]||'Text',x:8,y:8,w:36,h:9,font:'Arial, Helvetica, sans-serif',size:16,bold:false,weight:400,italic:false,color:'#111827',fill:(type==='box'||type==='rounded'||type==='circle')?'#ffffff':'transparent',fillOpacity:(type==='box'||type==='rounded'||type==='circle')?100:0,border:'#1f2937',borderWidth:(type==='box'||type==='rounded'||type==='circle')?1:0,radius:type==='rounded'?14:(type==='box'?6:(type==='circle'?999:0)),align:'left',opacity:1,rotation:0};if(type==='line'){e.w=80;e.h=0;e.borderWidth=2}else if(type==='logo'){e.w=20;e.h=12;e.borderWidth=0}else if(type==='customer'){e.size=20;e.bold=true;e.weight=700;e.h=10}else if(type==='amount'){e.size=24;e.bold=true;e.weight=800;e.w=40;e.h=14;e.align='center';e.fill='#fff';e.fillOpacity=100;e.borderWidth=2}else if(type==='box'||type==='rounded'){e.w=40;e.h=24}else if(type==='circle'){e.w=20;e.h=20;e.align='center'}else if(type==='custom'){e.text='Your Text'}window.__wbEditorElements.push(e);window.__wbSelectedId=e.id;renderWbCanvas()}
  function wbFieldValue(e,d){if(WB_KEYS[e.type]){const map={customer:d.customer,address:d.address,city:d.city,phone1:d.tel,phone2:d.tel2,company:d.company,companyAddress:d.companyAddress,companyPhone:d.companyPhone,product:d.product,qty:d.qty,amount:money(d.amount),reference:d.reference,variant:d.variant,custom:e.text||d.custom};return (map[e.type] ?? e.text ?? '')}return e.text||''}
  function hexToRgba(hex,alpha=1){const h=String(hex||'#ffffff').replace('#','');const n=h.length===3?h.split('').map(x=>x+x).join(''):h;const r=parseInt(n.slice(0,2),16)||255,g=parseInt(n.slice(2,4),16)||255,b=parseInt(n.slice(4,6),16)||255;return `rgba(${r},${g},${b},${Math.max(0,Math.min(100,Number(alpha)))/100})`}  
  function wbCanvasElement(e,d,scale){const isImage=e.type==='logo';const text=esc(wbFieldValue(e,d));const bg=(e.fill&&e.fill!=='transparent')?hexToRgba(e.fill,e.fillOpacity??100):'transparent';const radius=e.type==='circle'?999:(e.radius||0);const weight=Number(e.weight|| (e.bold?700:400));const style=`left:${e.x}%;top:${e.y}%;width:${e.w}%;height:${e.h}%;font-family:${e.font};font-size:${e.size}px;font-weight:${weight};font-style:${e.italic?'italic':'normal'};color:${e.color};background:${bg};border:${Math.max(0,e.borderWidth||0)}px solid ${e.border||'#111'};border-radius:${radius}px;opacity:${e.opacity??1};transform:rotate(${e.rotation||0}deg);text-align:${e.align||'left'};`;const cls=`wb-draw-el ${window.__wbSelectedId===e.id?'selected':''} wb-type-${e.type}`;if(isImage)return `<div class="${cls}" data-el-id="${e.id}" style="${style}"><img src="assets/apex-logo.png" draggable="false" style="max-width:100%;max-height:100%;object-fit:contain"></div>`;if(e.type==='line')return `<div class="${cls}" data-el-id="${e.id}" style="${style}height:0;border-left:0;border-right:0;border-bottom:${Math.max(1,e.borderWidth||1)}px solid ${e.border||'#111'};background:transparent"></div>`;return `<div class="${cls}" data-el-id="${e.id}" style="${style}"><span>${text}</span>${(e.type==='box'||e.type==='rounded'||e.type==='circle')?'<i class="wb-box-hint"></i>':''}<span class="wb-resize-handle"></span></div>`}
  function renderWbCanvasOnly(){const stage=$('#wbCanvasStage');const live=$('#wbLiveStage');if(!stage||!live)return;const l=currentEditorLayout();const d=sampleData();stage.innerHTML=`<div class="wb-design-page" style="aspect-ratio:${l.width}/${l.height}">${(window.__wbEditorElements||[]).map(e=>wbCanvasElement(e,d,1)).join('')}</div>`;const cards=new Array(6).fill(0).map(()=>`<div class="wb-live-card" style="aspect-ratio:${l.width}/${l.height}">${(window.__wbEditorElements||[]).map(e=>wbCanvasElement({...e},d,.18).replace('wb-draw-el selected','wb-draw-el')).join('')}</div>`).join('');live.innerHTML=`<div class="wb-live-sheet" data-orientation="${l.orientation}">${cards}</div>`;wireWbCanvas()}
  function renderWbCanvas(){renderWbCanvasOnly();renderWbProps()}
  function findEl(id){return (window.__wbEditorElements||[]).find(e=>e.id===id)}
  function renderWbProps(){const box=$('#wbProps');if(!box)return;const e=findEl(window.__wbSelectedId);if(!e){box.innerHTML='<div class="wb-props-empty">Select an element to edit it.</div>';return}const hasFill=!['line','logo'].includes(e.type);const wt=Number(e.weight|| (e.bold?700:400));const fo=e.fillOpacity??(e.fill==='transparent'?0:100);box.innerHTML=`<div class="panel-title">Selected: ${esc(e.label||e.type)}</div><div class="field"><label>Text / Details</label><textarea id="wbpText" rows="2">${esc(e.text||'')}</textarea></div><div class="wb-prop-grid"><div class="field"><label>Font</label><select id="wbpFont"><option ${String(e.font||'').startsWith('Arial')?'selected':''}>Arial, Helvetica, sans-serif</option><option ${String(e.font||'').startsWith('Segoe')?'selected':''}>Segoe UI, Arial, sans-serif</option><option ${String(e.font||'').startsWith('Verdana')?'selected':''}>Verdana, sans-serif</option><option ${String(e.font||'').startsWith('Georgia')?'selected':''}>Georgia, serif</option></select></div><div class="field"><label>Size</label><input id="wbpSize" type="number" min=6 max=96 value="${e.size||16}"></div><div class="field"><label>Font Weight</label><input id="wbpWeight" type="range" min=100 max=900 step=100 value="${wt}"><div class="wb-range-value" id="wbpWeightValue">${wt}</div></div><div class="field"><label>Text Color</label><input id="wbpColor" type="color" value="${e.color||'#111827'}"></div><div class="field"><label>Fill Color</label><input id="wbpFill" type="color" value="${(e.fill&&e.fill!='transparent')?e.fill:'#ffffff'}" ${hasFill?'':'disabled'}></div><div class="field"><label>Fill Transparency</label><input id="wbpFillOpacity" type="range" min=0 max=100 step=5 value="${fo}" ${hasFill?'':'disabled'}><div class="wb-range-value" id="wbpFillOpacityValue">${fo}%</div></div><div class="field"><label>Border</label><input id="wbpBorder" type="color" value="${e.border||'#1f2937'}"></div><div class="field"><label>Border Width</label><input id="wbpBW" type="number" min=0 max=20 value="${e.borderWidth||0}"></div><div class="field"><label>Radius</label><input id="wbpRadius" type="number" min=0 max=100 value="${e.radius||0}" ${e.type==='circle'?'disabled':''}></div><div class="field"><label>Align</label><select id="wbpAlign"><option ${e.align==='left'?'selected':''}>left</option><option ${e.align==='center'?'selected':''}>center</option><option ${e.align==='right'?'selected':''}>right</option></select></div></div><div class="wb-checks"><label><input id="wbpBold" type="checkbox" ${wt>=700?'checked':''}> Bold</label><label><input id="wbpItalic" type="checkbox" ${e.italic?'checked':''}> Italic</label></div><div class="wb-prop-grid"><div class="field"><label>Width %</label><input id="wbpW" type="number" min=0.5 max=200 value="${e.w}"></div><div class="field"><label>Height %</label><input id="wbpH" type="number" min=0 max=200 value="${e.h}"></div><div class="field"><label>Left %</label><input id="wbpX" type="number" min=-200 max=300 value="${e.x}"></div><div class="field"><label>Top %</label><input id="wbpY" type="number" min=-200 max=300 value="${e.y}"></div></div><div class="actions"><button class="btn btn-danger" onclick="wbRemoveSelected()">Remove</button></div>`;
    ['wbpText','wbpFont','wbpSize','wbpWeight','wbpColor','wbpFill','wbpFillOpacity','wbpBorder','wbpBW','wbpRadius','wbpAlign','wbpBold','wbpItalic','wbpW','wbpH','wbpX','wbpY'].forEach(id=>{const n=$('#'+id);if(n)n.addEventListener(n.type==='checkbox'?'change':'input',wbApplyProp)});
  }
  window.wbApplyProp=function(){const e=findEl(window.__wbSelectedId);if(!e)return;const weight=Number($('#wbpWeight')?.value||e.weight|| (e.bold?700:400));const fillOpacity=e.type==='line'?0:Number($('#wbpFillOpacity')?.value??e.fillOpacity??100);Object.assign(e,{text:$('#wbpText')?.value??e.text,font:$('#wbpFont')?.value||e.font,size:Number($('#wbpSize')?.value||e.size),weight,bold:$('#wbpBold')?.checked||weight>=700,italic:$('#wbpItalic')?.checked||false,color:$('#wbpColor')?.value||e.color,fill:e.type==='line'?'transparent':($('#wbpFill')?.value||e.fill),fillOpacity,border:$('#wbpBorder')?.value||e.border,borderWidth:Number($('#wbpBW')?.value||0),radius:e.type==='circle'?999:Number($('#wbpRadius')?.value||0),align:$('#wbpAlign')?.value||e.align,w:Math.max(0.5,Number($('#wbpW')?.value||e.w)),h:Math.max(0,Number($('#wbpH')?.value||e.h)),x:Number($('#wbpX')?.value??e.x),y:Number($('#wbpY')?.value??e.y)});if($('#wbpWeightValue'))$('#wbpWeightValue').textContent=String(weight);if($('#wbpFillOpacityValue'))$('#wbpFillOpacityValue').textContent=`${fillOpacity}%`;renderWbCanvasOnly()}
  window.wbRemoveSelected=function(){window.__wbEditorElements=(window.__wbEditorElements||[]).filter(e=>e.id!==window.__wbSelectedId);window.__wbSelectedId=null;renderWbCanvas()}
  function wireWbCanvas(){const stage=$('#wbCanvasStage');const page=stage?.querySelector('.wb-design-page');if(!page)return;$$('.wb-draw-el',page).forEach(el=>{el.addEventListener('pointerdown',wbPointerDown);el.addEventListener('click',e=>{e.stopPropagation();window.__wbSelectedId=el.dataset.elId;renderWbCanvas()});const rh=el.querySelector('.wb-resize-handle');if(rh)rh.addEventListener('pointerdown',e=>{e.stopPropagation();startWbResize(e,el.dataset.elId)})});page.addEventListener('click',()=>{window.__wbSelectedId=null;renderWbCanvas()})}
  window.__wbDrag=null;
  function wbPointerDown(e){if(e.target.classList.contains('wb-resize-handle'))return;e.preventDefault();const id=this.dataset.elId;window.__wbSelectedId=id;const el=findEl(id);if(!el)return;const r=pageRect();window.__wbDrag={id,startX:e.clientX,startY:e.clientY,x:el.x,y:el.y,r};document.addEventListener('pointermove',wbPointerMove);document.addEventListener('pointerup',wbPointerUp,{once:true})}
  function pageRect(){return $('#wbCanvasStage .wb-design-page')?.getBoundingClientRect()}
  function wbPointerMove(e){const d=window.__wbDrag;if(!d)return;const el=findEl(d.id);if(!el)return;el.x=d.x+(e.clientX-d.startX)/d.r.width*100;el.y=d.y+(e.clientY-d.startY)/d.r.height*100;renderWbCanvasOnly()}
  function wbPointerUp(){window.__wbDrag=null;document.removeEventListener('pointermove',wbPointerMove)}
  function startWbResize(e,id){e.preventDefault();const el=findEl(id);const r=pageRect();const start={x:e.clientX,y:e.clientY,w:el.w,h:el.h};function mv(ev){el.w=Math.max(0.5,start.w+(ev.clientX-start.x)/r.width*100);el.h=Math.max(0,start.h+(ev.clientY-start.y)/r.height*100);renderWbCanvasOnly()}function up(){document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up)}document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up,{once:true})}
  function wbEditorRefresh(){if(!window.__wbEditorElements)window.__wbEditorElements=defaultElements(1);renderWbCanvasOnly();renderWbProps()}
  window.wbEditorRefresh=wbEditorRefresh;
  window.wbAiGenerate=function(forceAuto=false){
    const p=(String($('#wbAiPrompt')?.value||'').toLowerCase().trim());
    let preset=1;
    if(forceAuto){preset=1+Math.floor(Math.random()*5);} else if(/minimal|simple|black.?white|mono/.test(p)) preset=4;
    else if(/blue|modern|clean|corporate|professional/.test(p)) preset=5;
    else if(/bold|strong|heavy|price/.test(p)) preset=2;
    else if(/rounded|soft|friendly|light/.test(p)) preset=3;
    else if(/classic|formal|standard/.test(p)) preset=1;
    window.__wbEditorElements=defaultElements(preset);
    if(preset===2 && /horizontal|wide/.test(p)) $('#wbEdOrient').value='landscape';
    if(preset===4 && /vertical|tall|portrait/.test(p)) $('#wbEdOrient').value='portrait';
    wbEditorRefresh();
    toast(`AI style generated from Layout ${preset}`);
  };
  window.wbEditorSave=function(){if(db.session.role!=='Owner')return toast('Owner only');const l=currentEditorLayout();if(l.id.startsWith('builtin-')){const n=Number(l.id.split('-')[1]);db.waybillBuiltins[n-1]=l}else{const i=db.waybillLayouts.findIndex(x=>x.id===l.id);if(i>=0)db.waybillLayouts[i]=l;else db.waybillLayouts.push(l)}save();toast('Waybill layout saved');navTo('waybill-designer')};
  window.wbDeleteCustom=function(id){if(!confirm('Delete this custom waybill layout?'))return;db.waybillLayouts=db.waybillLayouts.filter(x=>x.id!==id);save();wbEditorPage()};
  window.wbPreviewSaved=function(id){const l=id.startsWith('builtin-')?(db.waybillBuiltins||[])[Number(id.split('-')[1])-1]:db.waybillLayouts.find(x=>x.id===id);if(!l)return;printAdvancedWaybill([db.orders[0]||sampleData()],[{company:db.companies[0]?.name||'APEX HOLDINGS'}][0],l,true)};

  // ----- Advanced print renderer: 6-up A4, preserving each selected layout -----
  function renderAdvancedElement(e,o,s,d){const text=esc(wbFieldValue(e,d));const bg=(e.fill&&e.fill!=='transparent')?hexToRgba(e.fill,e.fillOpacity??100):'transparent';const radius=e.type==='circle'?999:(e.radius||0);const weight=Number(e.weight|| (e.bold?800:400));const style=`position:absolute;left:${e.x}%;top:${e.y}%;width:${e.w}%;height:${e.h}%;font-family:${e.font};font-size:${e.size}px;font-weight:${weight};font-style:${e.italic?'italic':'normal'};color:${e.color};background:${bg};border:${Math.max(0,e.borderWidth||0)}px solid ${e.border||'#111'};border-radius:${radius}px;opacity:${e.opacity??1};transform:rotate(${e.rotation||0}deg);text-align:${e.align||'left'};display:flex;align-items:center;justify-content:${e.align==='center'?'center':e.align==='right'?'flex-end':'flex-start'};overflow:visible;padding:1.2mm;box-sizing:border-box;`;if(e.type==='logo')return `<div style="${style}"><img src="assets/apex-logo.png" style="max-width:100%;max-height:100%;object-fit:contain"></div>`;if(e.type==='line')return `<div style="position:absolute;left:${e.x}%;top:${e.y}%;width:${e.w}%;height:0;border-bottom:${Math.max(1,e.borderWidth||1)}px solid ${e.border||'#111'}"></div>`;return `<div style="${style}">${text}</div>`}
  function advancedWaybillCard(o,l){const c=db.companies.find(x=>x.id===o.companyId)||{};const d={customer:o.customer||'Customer Name',address:o.address||'',city:o.city||'',tel:o.tel||'',tel2:o.tel2||'',company:c.name||'APEX HOLDINGS',companyAddress:c.address||'',companyPhone:c.phone||'',product:o.productSummary||o.items?.map(x=>x.name).join(', ')||'',qty:o.qty||1,amount:o.price||0,reference:o.waybill||'',variant:String(o.variant||'').split(/[\/|,-]/)[0]?.trim()||'',custom:'',logo:'assets/apex-logo.png'};const productBox=l?.id==='builtin-3'?`<div class="adv-product-detail-box"><span><small>Product</small><b>${esc(d.product)}</b></span><span><small>Color</small><b>${esc(d.variant||'—')}</b></span></div>`:'';const elements=(l.elements||[]).filter(e=>!(l?.id==='builtin-3'&&['product','variant'].includes(e.type)));return `<div class="adv-wb-card" style="aspect-ratio:${l.width}/${l.height}">${productBox}${elements.map(e=>renderAdvancedElement(e,o,l,d)).join('')}</div>`}
  function waybillProductCodeV32(o){
    const codes=(o.items||[]).map(item=>{
      const product=db.products.find(p=>String(p.id)===String(item.productId ?? item.id));
      return item.code || product?.code || '';
    }).map(x=>String(x).trim()).filter(Boolean);
    if(!codes.length && o.productCode) codes.push(String(o.productCode).trim());
    return [...new Set(codes)].join(', ') || '—';
  }
  function pdfMatchLayout1Card(o,s,idx){
    const c=db.companies.find(x=>x.id===o.companyId)||{};
    const wb=o.waybill||o.id||s.id;
    const d={
      customer:o.customer||'Customer Name',address:o.address||'',city:o.city||'',tel:o.tel||'',tel2:o.tel2||'',
      company:c.name||o.company||'APEX HOLDINGS',companyAddress:c.address||'',companyPhone:c.phone||'',
      reference:wb,amount:o.price||0
    };
    const phones=[d.tel,d.tel2].filter(Boolean).join(' | ');
    const productCode=waybillProductCodeV32(o);
    return `<div class="pdf1-card">
      <div class="pdf1-header">
        <div class="pdf1-brand"><div class="pdf1-company">${esc(d.company)}</div><div class="pdf1-ref">Ref : ${esc(d.reference)}</div></div>
        <div class="pdf1-title">WAYBILL</div>
      </div>
      <div class="pdf1-rule"></div>
      <div class="pdf1-to">
        <div class="pdf1-to-label">To</div>
        <div class="pdf1-to-content"><div class="pdf1-customer">${esc(d.customer)}</div><div class="pdf1-address">${esc(d.address)}${d.city?', '+esc(d.city):''}</div><div class="pdf1-phone">${esc(phones)}</div><div class="pdf-product-detail-box"><span><small>Product</small><b>${esc(o.productSummary||o.items?.map(x=>x.name).join(', ')||'')}</b></span><span><small>Color</small><b>${esc(o.variant||'—')}</b></span></div></div>
      </div>
      <div class="pdf1-from">
        <div class="pdf1-from-label">From</div>
        <div class="pdf1-from-content"><div>${esc(d.company)},</div><div>${esc(d.companyAddress)}</div><div>${esc(d.companyPhone)}</div></div>
      </div>
      <div class="pdf1-barcode">${barcodeSvg(wb)}</div>
      <div class="pdf1-total"><span>Tot. Amount : <b>Rs. ${Number(d.amount||0).toLocaleString()}</b></span><span>Product Code: ${esc(productCode)}</span></div>
      <div class="pdf1-foot">Thank you for your trust in us.</div>
    </div>`;
  }
  function pdfMatchLayout2Card(o,s,idx){
    const c=db.companies.find(x=>x.id===o.companyId)||{};
    const wb=o.waybill||o.id||s.id;
    const productCode=waybillProductCodeV32(o);
    return `<div class="pdf2-card">
      <div class="pdf2-header"><span>COD Waybill</span><span>${esc(c.name||o.company||'APEX HOLDINGS')} Ref : ${esc(o.reference||wb)}</span></div>
      <div class="pdf2-main"><div class="pdf2-to"><div class="pdf2-label">To</div><div class="pdf2-name">${esc(o.customer||'')}</div><div class="pdf2-address">${esc(o.address||'')}${o.city?', '+esc(o.city):''}</div><div class="pdf2-phone">${esc(o.tel||'')}${o.tel2?` | ${esc(o.tel2)}`:''}</div><div class="pdf-product-detail-box pdf-product-detail-box-2"><span><small>Product</small><b>${esc(o.productSummary||o.items?.map(x=>x.name).join(', ')||'')}</b></span><span><small>Color</small><b>${esc(o.variant||'—')}</b></span></div></div><div class="pdf2-total"><div>COD Tot.</div><strong>RS ${Number(o.price||0).toLocaleString()}</strong></div></div>
      <div class="pdf2-bottom"><div class="pdf2-from"><div>From :</div><b>${esc(c.name||o.company||'APEX HOLDINGS')}</b><div>${esc(c.address||'')}</div><div>Phone: ${esc(c.phone||'')}</div></div><div class="pdf2-barcode">${barcodeSvg(wb)}</div></div>
      <div class="pdf2-footer"><span>**CAUTION**: Handle with care. Fragile contents inside.</span><span>Product Code: ${esc(productCode)}</span></div>
    </div>`;
  }
  function printAdvancedWaybill(orders,s,l,preview=false){
    const list=Array.isArray(orders)?orders.slice():[];
    const use1=l?.printVariant==='pdf-match-1' || l?.id==='builtin-1';
    const use2=l?.printVariant==='pdf-match-2' || l?.id==='builtin-2';
    if(use1||use2){
      const pages=[];
      for(let i=0;i<list.length;i+=6){
        const chunk=list.slice(i,i+6);
        const cells=chunk.map((o,j)=>use1?pdfMatchLayout1Card(o,s,i+j):pdfMatchLayout2Card(o,s,i+j));
        while(cells.length<6) cells.push('<div class="pdf-blank"></div>');
        pages.push(`<div class="pdf-sheet">${cells.join('')}</div>`);
      }
      if(!pages.length) pages.push(`<div class="pdf-sheet">${new Array(6).fill('<div class="pdf-blank"></div>').join('')}</div>`);
      const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(l.name)}</title><style>
      @page{size:A4 landscape;margin:6mm}html,body{margin:0;padding:0;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.pdf-sheet{width:285mm;height:198mm;display:grid;grid-template-columns:${use1?'repeat(3,84.8mm)':'repeat(2,132mm)'};grid-template-rows:${use1?'repeat(2,97.6mm)':'repeat(3,58mm)'};column-gap:${use1?'6.1mm':'5mm'};row-gap:${use1?'2.8mm':'5mm'};justify-content:center;align-content:center;page-break-after:always;break-after:page}.pdf-sheet:last-child{page-break-after:auto;break-after:auto}.pdf-blank{visibility:hidden}
      .pdf1-card{width:84.8mm;height:97.6mm;border:1px solid #333;border-radius:0;background:#fff;box-sizing:border-box;position:relative;overflow:visible;display:grid;grid-template-rows:14.8mm 2mm 29.5mm 16.2mm 21.7mm 8.2mm 7.2mm;font-family:Arial,Helvetica,sans-serif}.pdf1-header{display:flex;justify-content:space-between;align-items:flex-start;padding:4mm 3.1mm 0}.pdf1-company{font-size:10px;font-weight:600;line-height:1.15}.pdf1-ref{font-size:10px;margin-top:1mm}.pdf1-title{font-size:18px;font-weight:800;letter-spacing:.4px;text-align:right;padding-top:.2mm}.pdf1-rule{height:2mm;background:#111}.pdf1-to{display:flex;border-bottom:1px solid #555;padding:3mm 3mm 2.5mm}.pdf1-to-label{width:11mm;font-size:13px;font-weight:700;line-height:1.2}.pdf1-to-content{flex:1;min-width:0}.pdf1-customer{font-size:15px;font-weight:700;line-height:1.12;overflow-wrap:anywhere}.pdf1-address{font-size:11.5px;line-height:1.13;margin-top:1.2mm;overflow-wrap:anywhere}.pdf1-phone{font-size:13px;line-height:1.12;margin-top:1.2mm;overflow-wrap:anywhere}.pdf-product-detail-box{display:grid;grid-template-columns:1.5fr 1fr .65fr;gap:1mm;margin-top:1.2mm;padding:1mm 1.2mm;border:0.35mm solid #777;border-radius:1mm;min-width:0}.pdf-product-detail-box span{display:block;min-width:0;overflow:hidden}.pdf-product-detail-box small{display:block;font-size:5.5px;line-height:1.1;text-transform:uppercase;color:#555;font-weight:700}.pdf-product-detail-box b{display:block;font-size:7px;line-height:1.15;font-weight:700;overflow-wrap:anywhere}.pdf-product-detail-box-2{margin-top:1mm;padding:.7mm 1mm}.pdf-product-detail-box-2 b{font-size:6.4px}.pdf1-from{display:flex;border-bottom:1px solid #555;padding:3mm 3mm 2.5mm}.pdf1-from-label{width:11mm;font-size:13px;line-height:1.2}.pdf1-from-content{font-size:11.5px;line-height:1.2;min-width:0;overflow-wrap:anywhere}.pdf1-barcode{border-bottom:1px solid #555;display:flex;align-items:center;justify-content:center;padding:1mm 5mm}.pdf1-barcode svg{width:82%;height:17mm;display:block}.pdf1-total{display:flex;align-items:center;justify-content:space-between;padding:1.5mm 3mm;font-size:10.5px}.pdf1-total b{font-size:15px}.pdf1-total span:last-child{font-size:9px;font-weight:700}.pdf1-foot{border-top:1px solid #555;display:flex;align-items:center;padding:0 3mm;font-size:9px;font-weight:600}.pdf2-card{width:132mm;height:58mm;border:1.4px solid #111;background:#fff;box-sizing:border-box;position:relative;overflow:hidden}
      .pdf2-card{width:132mm;height:58mm;border:1.4px solid #111;background:#fff;box-sizing:border-box;position:relative;overflow:hidden}.pdf2-header{height:7mm;border-bottom:1.3px solid #111;display:flex;justify-content:space-between;align-items:center;padding:0 2.2mm;font-size:10.5px}.pdf2-main{height:26mm;display:grid;grid-template-columns:3.2fr 1.15fr;border-bottom:1.3px solid #111}.pdf2-to{padding:2.1mm 2.2mm;border-right:1.3px solid #111}.pdf2-label{font-size:9px}.pdf2-name{font-size:16px;line-height:1.08;margin-top:1mm}.pdf2-address{font-size:12.5px;line-height:1.08;margin-top:.9mm}.pdf2-phone{font-size:13px;margin-top:.9mm}.pdf2-total{padding:0 2.2mm;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}.pdf2-total div{font-size:10px}.pdf2-total strong{font-size:17px;margin-top:1.5mm}.pdf2-bottom{height:19mm;display:grid;grid-template-columns:1.2fr 1.8fr;border-bottom:1.3px solid #111}.pdf2-from{padding:1.6mm 2.2mm;font-size:8.5px;line-height:1.1;border-right:1.3px solid #111}.pdf2-from b{font-size:9px}.pdf2-barcode{padding:1.2mm 2.2mm;display:flex;align-items:center;justify-content:center}.pdf2-barcode svg{width:100%;height:15mm}.pdf2-footer{height:6mm;display:flex;justify-content:space-between;align-items:center;padding:0 2.2mm;font-size:8.2px}.pdf-blank{background:#fff}
      @media screen{body{background:#e8e8e8;padding:10mm 10mm 22mm}.pdf-sheet{margin:0 auto 10mm;background:#fff;box-shadow:0 8px 25px rgba(0,0,0,.12)}.preview-controls{position:fixed;z-index:999;right:18px;top:14px;display:flex;gap:8px}.preview-controls button{border:0;border-radius:8px;padding:10px 14px;background:#153e6e;color:#fff;font:700 13px Inter,Arial,sans-serif;cursor:pointer}.preview-controls button+button{background:#555}}@media print{html,body{background:#fff}.pdf-sheet{margin:0;box-shadow:none}.preview-controls{display:none}}
       .pdf-product-detail-box{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:1mm;margin-top:.6mm;padding:.55mm .8mm;border:.25mm solid #777;border-radius:.5mm;min-width:0;max-height:7.8mm;overflow:hidden;box-sizing:border-box}.pdf-product-detail-box span{display:block;min-width:0;max-width:100%;overflow:hidden;overflow-wrap:anywhere;word-break:break-word}.pdf-product-detail-box small{display:block;font-size:5.2px;line-height:1.05;white-space:nowrap;overflow:hidden}.pdf-product-detail-box b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:6.5px;line-height:1.08;overflow-wrap:anywhere;word-break:break-word}.pdf-product-detail-box-2{max-height:8mm;margin-top:.7mm;padding:.5mm .7mm}.pdf-product-detail-box-2 b{font-size:6.2px}.pdf1-card{overflow:hidden}.pdf1-to{padding:1.8mm 2.5mm 1.5mm;min-width:0;overflow:hidden}.pdf1-to-content{overflow:hidden;min-width:0}.pdf1-customer{font-size:13px;line-height:1.08}.pdf1-address{font-size:13px;line-height:1.08;margin-top:.6mm}.pdf1-phone{font-size:13px;line-height:1.08;margin-top:.6mm}.pdf2-to{min-width:0;overflow:hidden}.pdf2-name{font-size:13px;line-height:1.05;margin-top:.5mm}.pdf2-address{font-size:13px;line-height:1.05;margin-top:.5mm;overflow:hidden;overflow-wrap:anywhere}.pdf2-phone{font-size:13px;line-height:1.05;margin-top:.5mm;overflow:hidden;overflow-wrap:anywhere}</style></head><body>${pages.join('')}<div class="preview-controls"><button onclick="window.print()">Print Waybill</button><button onclick="window.close()">Close Preview</button></div></body></html>`;
      const w=window.open('','_blank','width=1200,height=900');if(!w)return toast('Allow popups to print');w.document.write(html);w.document.close();return;
    }
    const pageSize=l.orientation==='landscape'?'landscape':'portrait';
    const sheetW=pageSize==='landscape'?'284mm':'198mm'; const sheetH=pageSize==='landscape'?'198mm':'284mm';
    const pages=[]; for(let i=0;i<list.length;i+=6){const chunk=list.slice(i,i+6);while(chunk.length<6)chunk.push(null);pages.push(`<div class="sheet">${chunk.map(o=>o?advancedWaybillCard(o,l):'<div class="adv-wb-card blank"></div>').join('')}</div>`)}
    if(!pages.length)pages.push(`<div class="sheet">${new Array(6).fill('<div class="adv-wb-card blank"></div>').join('')}</div>`);
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(l.name)}</title><style>@page{size:A4 ${pageSize};margin:6mm}html,body{margin:0;padding:0;background:#fff}body{font-family:Arial,Helvetica,sans-serif}.sheet{width:${sheetW};height:${sheetH};display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr);gap:4mm;break-after:page;page-break-after:always}.sheet:last-child{break-after:auto;page-break-after:auto}.adv-wb-card{position:relative;overflow:visible;background:#fff;border:1px solid #111;box-sizing:border-box;min-height:0}.adv-wb-card.blank{visibility:hidden}.adv-product-detail-box{position:absolute;left:7%;top:58%;width:86%;height:9%;min-height:0;max-height:9%;z-index:2;display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:1mm;padding:.7mm;border:.25mm solid #666;border-radius:.7mm;background:#fff;box-sizing:border-box;overflow:hidden;font-family:Arial,Helvetica,sans-serif}.adv-product-detail-box span{display:block;min-width:0;max-width:100%;overflow:hidden;overflow-wrap:anywhere;word-break:break-word}.adv-product-detail-box small{display:block;font-size:5.2px;line-height:1.05;color:#555;text-transform:uppercase;font-weight:700;white-space:nowrap;overflow:hidden}.adv-product-detail-box b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:6.5px;line-height:1.08;overflow-wrap:anywhere;word-break:break-word;max-width:100%}.adv-wb-card>*{position:absolute;box-sizing:border-box}@media print{body{background:#fff}.preview-controls{display:none}}@media screen{body{padding:70px 12px 20px;background:#eee}.sheet{margin:0 auto 12px;background:#fff;box-shadow:0 8px 30px #0002}.preview-controls{position:fixed;top:12px;right:12px;z-index:999;display:flex;gap:8px}.preview-controls button{border:0;border-radius:8px;padding:10px 14px;background:#153e6e;color:#fff;font:700 13px Inter,Arial,sans-serif;cursor:pointer}.preview-controls button+button{background:#555}} .pdf-product-detail-box{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:1mm;margin-top:.6mm;padding:.55mm .8mm;border:.25mm solid #777;border-radius:.5mm;min-width:0;max-height:7.8mm;overflow:hidden;box-sizing:border-box}.pdf-product-detail-box span{display:block;min-width:0;max-width:100%;overflow:hidden;overflow-wrap:anywhere;word-break:break-word}.pdf-product-detail-box small{display:block;font-size:5.2px;line-height:1.05;white-space:nowrap;overflow:hidden}.pdf-product-detail-box b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:6.5px;line-height:1.08;overflow-wrap:anywhere;word-break:break-word}.pdf-product-detail-box-2{max-height:8mm;margin-top:.7mm;padding:.5mm .7mm}.pdf-product-detail-box-2 b{font-size:6.2px}.pdf1-card{overflow:hidden}.pdf1-to{padding:1.8mm 2.5mm 1.5mm;min-width:0;overflow:hidden}.pdf1-to-content{overflow:hidden;min-width:0}.pdf1-customer{font-size:13px;line-height:1.08}.pdf1-address,.pdf1-phone{font-size:13px;line-height:1.08;margin-top:.6mm}.pdf2-to{min-width:0;overflow:hidden}.pdf2-name{font-size:13px;line-height:1.05;margin-top:.5mm}.pdf2-address,.pdf2-phone{font-size:13px;line-height:1.05;margin-top:.5mm;overflow:hidden;overflow-wrap:anywhere}</style></head><body>${pages.join('')}<div class="preview-controls"><button onclick="window.print()">Print Waybill</button><button onclick="window.close()">Close Preview</button></div></body></html>`;
    const w=window.open('','_blank','width=1200,height=950');if(!w)return toast('Allow popups to print');w.document.write(html);w.document.close();
  }
  window.printAdvancedWaybill=printAdvancedWaybill;

  // Override fixed layout buttons to use editable built-ins.
  window.printSelectedWaybills=function(layoutNo=1){const ids=$$('.ship-file-check:checked').map(x=>x.value);if(!ids.length)return toast('Select at least one shipped file');ensureAdvancedWaybills();const l=db.waybillBuiltins[layoutNo-1];const os=[];for(const id of ids){const sh=db.shipped.find(x=>x.id===id);if(!sh)continue;for(const o of shipmentOrders(sh))os.push(o)}if(!os.length)return toast('No orders available for printing');printAdvancedWaybill(os,db.shipped.find(x=>x.id===ids[0])||{},l)};
  window.printShipment=function(id,layoutNo=1){ensureAdvancedWaybills();const sh=db.shipped.find(x=>x.id===id);if(!sh)return;const l=db.waybillBuiltins[layoutNo-1];printAdvancedWaybill(shipmentOrders(sh),sh,l)};

})();

/* ===== v11.2 PATCH: Owner Stock Request Controls ===== */
(function(){
  function ownerStockRequestsPage(){
    if(db.session?.role!=='Owner') return toast('Owner only');
    const rows=(db.stockRequests||[]).slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
    const pending=rows.filter(r=>r.status==='Pending').length;
    layout(`<div class="page-intro"><div><div class="eyebrow">OWNER CONTROL</div><h2>Company Stock Requests</h2><p>All company requests are shown here. Approve after payment confirmation, reject requests, or clear selected records.</p></div><div class="mini-stat"><b>${pending}</b><span>Pending requests</span></div></div>
      <div class="toolbar stock-request-admin-toolbar"><button class="btn btn-outline" onclick="ownerReqSelectAll()">Select All</button><button class="btn btn-outline" onclick="ownerReqClearSelection()">Clear Selection</button><button class="btn btn-primary" onclick="ownerReqApproveSelected()">&#10003; Approve Selected</button><button class="btn btn-danger" onclick="ownerReqRejectSelected()">&#10005; Reject Selected</button><button class="btn btn-outline" onclick="ownerReqClearSelected()">Clear Selected Requests</button></div>
      <div class="card table-card"><div class="table-wrap"><table class="table" id="ownerStockReqTable"><thead><tr><th></th><th>Request</th><th>Company</th><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Total</th><th>Payment</th><th>Payment Ref</th><th>Receipt</th><th>Requested By</th><th>Date &amp; Time</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.status==='Rejected'?'stock-request-rejected':''}"><td><input type="checkbox" class="owner-stock-req-check" value="${esc(r.id)}"></td><td><b>${esc(r.id)}</b>${r.note?`<div class="note">${esc(r.note)}</div>`:''}</td><td><b>${esc(r.companyName)}</b></td><td>${esc(r.product)}</td><td><strong>${Number(r.qty||0)}</strong></td><td>${money(r.unitCost||currentStockUnitCost())}</td><td><strong>${money(r.total||Number(r.qty||0)*currentStockUnitCost())}</strong></td><td>${money(r.payment||0)}</td><td>${esc(r.paymentRef||'—')}</td><td>${receiptCell(r)}</td><td>${esc(r.requestedBy||'—')}</td><td>${new Date(r.date).toLocaleString('en-GB')}</td><td>${badge(r.status)}</td><td>${r.status==='Pending'?`<div class="actions"><button class="btn btn-primary" onclick="approveStockRequest('${esc(r.id)}')">&#10003; Approve</button><button class="btn btn-danger" onclick="ownerReqRejectOne('${esc(r.id)}')">&#10005; Reject</button></div>`:'<span class="note">Processed</span>'}</td></tr>`).join('')||'<tr><td colspan="14" class="empty">No stock requests.</td></tr>'}</tbody></table></div></div>`);
  }
  window.ownerReqIds=function(){return $$('.owner-stock-req-check:checked').map(x=>x.value)};
  window.ownerReqSelectAll=function(){$$('.owner-stock-req-check').forEach(x=>x.checked=true)};
  window.ownerReqClearSelection=function(){$$('.owner-stock-req-check').forEach(x=>x.checked=false)};
  window.ownerReqRejectOne=function(id){if(db.session?.role!=='Owner')return toast('Owner only');const r=db.stockRequests.find(x=>x.id===id);if(!r)return;if(r.status!=='Pending')return toast('Request already processed');r.status='Rejected';r.rejectedAt=new Date().toISOString();r.rejectedBy=owner?.name||'Owner';save();toast('Stock request rejected');ownerStockRequestsPage()};
  window.ownerReqRejectSelected=function(){if(db.session?.role!=='Owner')return toast('Owner only');const ids=ownerReqIds();if(!ids.length)return toast('Select requests first');let n=0;ids.forEach(id=>{const r=db.stockRequests.find(x=>x.id===id);if(r&&r.status==='Pending'){r.status='Rejected';r.rejectedAt=new Date().toISOString();r.rejectedBy=owner?.name||'Owner';n++;}});save();toast(`${n} request(s) rejected`);ownerStockRequestsPage()};
  window.ownerReqClearSelected=function(){if(db.session?.role!=='Owner')return toast('Owner only');const ids=ownerReqIds();if(!ids.length)return toast('Select requests first');if(!confirm(`Clear ${ids.length} selected stock request(s)?`))return;db.stockRequests=(db.stockRequests||[]).filter(r=>!ids.includes(r.id));save();toast(`${ids.length} request(s) cleared`);ownerStockRequestsPage()};
  pages['stock-requests']=ownerStockRequestsPage;
})();


/* ===== v14 commission + dashboard visibility patch on v13 base ===== */
(function(){
  // Monthly 6% commission for companies created by a Company Admin.
  if(!Array.isArray(db.commissionPayouts)) db.commissionPayouts=[];
  (db.companies||[]).forEach(c=>{ if(c.parentCompanyId===undefined) c.parentCompanyId=null; });
  save();

  function commissionMonthsForCompany(parentId){
    const childIds=new Set((db.companies||[]).filter(c=>c.parentCompanyId===parentId).map(c=>c.id));
    const bucket={};
    (db.stockRequests||[]).forEach(r=>{
      if(r.status!=='Approved' || !childIds.has(r.companyId)) return;
      const when=r.approvedAt||r.date||new Date().toISOString();
      const month=String(when).slice(0,7);
      const qty=Number(r.qty||0), unit=Number(r.unitCost||currentStockUnitCost()), total=Number(r.total||qty*unit);
      if(!bucket[month]) bucket[month]={month,childCount:0,qty:0,total:0,requests:0,children:new Set()};
      bucket[month].qty+=qty; bucket[month].total+=total; bucket[month].requests+=1; bucket[month].children.add(r.companyId);
    });
    return Object.values(bucket).map(x=>({
      month:x.month,
      childCount:x.children.size,
      qty:x.qty,
      total:x.total,
      requests:x.requests,
      commission:x.total*0.06,
      status:(db.commissionPayouts.find(p=>p.companyId===parentId&&p.month===x.month)?.status)||'Pending'
    })).sort((a,b)=>b.month.localeCompare(a.month));
  }
  function currentParentCompanyId(){ return db.session?.role==='Admin' ? currentCompanyId() : null; }
  function commissionCard(row){
    const [y,m]=(row.month||'').split('-');
    const label=(y&&m)?new Date(Number(y),Number(m)-1,1).toLocaleDateString('en-US',{month:'long',year:'numeric'}):row.month;
    return `<div class="commission-mini card"><div class="commission-month">${esc(label)}</div><div class="commission-amount">${money(row.commission)}</div><div class="commission-meta">${row.childCount} companies • ${row.qty} units • ${money(row.total)} stock purchases</div><span class="badge ${row.status==='Paid'?'delivered':'pending'}">${row.status}</span></div>`;
  }

  // Add commission overview to the existing v13 dashboard without replacing its original layout.
  const _v13Dashboard=dashboard;
  dashboard=function(){
    _v13Dashboard();
    if(!['Owner','Admin'].includes(db.session?.role)) return;
    const wrap=document.createElement('div'); wrap.className='commission-dashboard-wrap';
    if(db.session.role==='Admin'){
      const rows=commissionMonthsForCompany(currentCompanyId());
      wrap.innerHTML=`<div class="card panel commission-dashboard-card"><div class="panel-head"><div><div class="panel-title">Monthly Commission</div><div class="panel-sub">6% commission from stock purchased by companies created under your company</div></div><span class="badge ok">6%</span></div><div class="commission-cards">${rows.slice(0,6).map(commissionCard).join('')||'<div class="empty">No commission records yet.</div>'}</div></div>`;
    } else {
      const rows=(db.companies||[]).map(c=>{const data=commissionMonthsForCompany(c.id);const latest=data[0];return latest?{company:c.name,...latest}:null;}).filter(Boolean).sort((a,b)=>b.commission-a.commission);
      wrap.innerHTML=`<div class="card panel commission-dashboard-card"><div class="panel-head"><div><div class="panel-title">Company Commission Overview</div><div class="panel-sub">Monthly 6% commission generated by companies created under each Admin company</div></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Company</th><th>Month</th><th>Created Companies</th><th>Stock Qty</th><th>Stock Cost</th><th>Commission 6%</th><th>Status</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${esc(r.company)}</b></td><td>${esc(r.month)}</td><td>${r.childCount}</td><td>${r.qty}</td><td>${money(r.total)}</td><td><strong>${money(r.commission)}</strong></td><td>${badge(r.status)}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">No commissions generated yet.</td></tr>'}</tbody></table></div></div>`;
    }
    document.querySelector('#content')?.appendChild(wrap);
  };

  // Company Admins can create companies under their own company; Owner-created companies have no parent.
  window.createCompanyNow=async function(){
    if(!['Owner','Admin'].includes(db.session?.role)) return toast('No access');
    const name=$('#cName')?.value.trim(), email=$('#cEmail')?.value.trim(), pass=$('#cPass')?.value||'', manager=$('#cManager')?.value.trim()||'', address=$('#cAddress')?.value.trim()||'', phone=$('#cPhone')?.value.trim()||'', file=$('#cDocument')?.files?.[0]||null;
    if(!name||!email||!pass||!manager||!address||!phone) return toast('Company Name, Manager Name with initials, Address, Phone and login details are required.');
    if(db.staff.some(s=>s.email.toLowerCase()===email.toLowerCase())) return toast('Email already exists');
    if(db.companies.some(c=>c.name.toLowerCase()===name.toLowerCase())) return toast('Company name already exists');
    let attachment=null;
    if(file){
      if(file.size>1024*1024)return toast('Attached document must be 1 MB or smaller');
      attachment=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve({name:file.name,type:file.type,data:reader.result});reader.onerror=()=>resolve({name:file.name,type:file.type,data:null});reader.readAsDataURL(file);});
    }
    const id='CMP-'+String(Date.now()).slice(-8);
    const parentId=db.session.role==='Admin'?currentCompanyId():null;
    const parentCompany=db.companies.find(x=>x.id===parentId);
    const c={id,name,manager,address,phone,attachment,sales:0,active:true,adminEmail:email,adminPassword:pass,created:today(),parentCompanyId:parentId,createdByAdminId:db.session.role==='Admin'?db.session.staffId:null,createdByCompanyName:parentCompany?.name||'APEX HOLDINGS (Owner)',catalogIsolated:true};
    db.companies.push(c); db.stock[id]=[];
    db.staff.push({id:'ST-'+String(Date.now()).slice(-8),name:manager+' Admin',type:'Admin',companyId:id,company:name,email,password:pass,phone});
    save();toast(`Company created: ${name}. Stock must be purchased from Owner.`);navTo('company-list');
  };

  // Company list is scoped for Admins; Owner sees all.
  const _v13CompanyList=companyList;
  companyList=function(){
    const filtered=db.session?.role==='Admin' ? db.companies.filter(c=>c.parentCompanyId===currentCompanyId()) : db.companies;
    const parentName=c=>{const p=db.companies.find(x=>x.id===c.parentCompanyId);return p?.name||c.createdByCompanyName||'APEX HOLDINGS (Owner)'};
    layout(`<div class="page-intro"><div><div class="eyebrow">COMPANY DIRECTORY</div><h2>Company List</h2><p>Owner can edit a company’s name, username and password, block or unblock it, or delete it. Admins see the companies created under them.</p></div><div class="mini-stat"><b>${filtered.length}</b><span>${db.session?.role==='Owner'?'All companies':'Companies created under your company'}</span></div></div><div class="toolbar">${['Owner','Admin'].includes(db.session.role)?'<button class="btn btn-primary" onclick="navTo(\'create-company\')">+ Create Company</button>':''}</div><div class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Company</th><th>Created Under / Parent Company</th><th>Admin</th><th>Phone</th><th>Address</th><th>Status</th>${db.session?.role==='Owner'?'<th>Actions</th>':''}</tr></thead><tbody>${filtered.map((c,i)=>`<tr><td>${i+1}</td><td><b>${esc(c.name)}</b><div class="note">${esc(c.id)}</div></td><td><span class="company-origin-pill">${esc(parentName(c))}</span><div class="note">${c.parentCompanyId?'Created by a Company Admin':'Owner-created / direct company'}</div></td><td>${esc(c.adminEmail||'')}</td><td>${esc(c.phone||'')}</td><td>${esc(c.address||'')}</td><td>${badge(c.active===false?'Blocked':'Active')}</td>${db.session?.role==='Owner'?`<td><div class="actions company-actions"><button class="btn btn-outline" onclick="editCompany('${esc(c.id)}')">Edit</button><button class="btn btn-outline" onclick="toggleCompany('${esc(c.id)}')">${c.active===false?'Unblock':'Block'}</button><button class="btn btn-danger" onclick="deleteCompany('${esc(c.id)}')">Delete</button></div></td>`:''}</tr>`).join('')||'<tr><td colspan="8" class="empty">No companies created under your account.</td></tr>'}</tbody></table></div></div>`);
  };

  // Owner/Admin commission page with monthly company-wise payable rows and Done button.
  function commissionPage(){
    if(!['Owner','Admin'].includes(db.session?.role)) return toast('No access');
    if(db.session.role==='Admin'){
      const rows=commissionMonthsForCompany(currentCompanyId());
      layout(`<div class="page-intro"><div><div class="eyebrow">COMMISSION</div><h2>My Monthly Commission</h2><p>Commission is 6% of approved stock purchases made by companies created under your company.</p></div><div class="mini-stat"><b>6%</b><span>Commission rate</span></div></div><div class="commission-cards">${rows.map(commissionCard).join('')||'<div class="card empty">No monthly commission has been generated yet.</div>'}</div>`);
      return;
    }
    const all=[];
    const currentMonth=today().slice(0,7);
    (db.companies||[]).forEach(c=>{
      const rows=commissionMonthsForCompany(c.id);
      const existing=rows.some(r=>r.month===currentMonth);
      rows.forEach(r=>all.push({company:c.name,companyId:c.id,...r}));
      if(!existing && !c.parentCompanyId){
        all.push({company:c.name,companyId:c.id,month:currentMonth,childCount:0,qty:0,total:0,requests:0,commission:0,status:'Pending'});
      } else if(!existing && c.parentCompanyId){
        all.push({company:c.name,companyId:c.id,month:currentMonth,childCount:0,qty:0,total:0,requests:0,commission:0,status:'Pending'});
      }
    });
    all.sort((a,b)=>b.month.localeCompare(a.month)||a.company.localeCompare(b.company));
    layout(`<div class="page-intro"><div><div class="eyebrow">OWNER CONTROL</div><h2>Company Commission</h2><p>Review the 6% commission payable to each Admin company for monthly stock purchases made by companies they created.</p></div><div class="mini-stat"><b>${all.filter(x=>x.status!=='Paid').length}</b><span>Pending payouts</span></div></div><div class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Admin Company</th><th>Month</th><th>Created Companies</th><th>Stock Qty</th><th>Stock Cost</th><th>Commission Rate</th><th>Commission Due</th><th>Status</th><th>Action</th></tr></thead><tbody>${all.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.company)}</b></td><td>${esc(r.month)}</td><td>${r.childCount}</td><td>${r.qty}</td><td>${money(r.total)}</td><td>6%</td><td><strong>${money(r.commission)}</strong></td><td>${badge(r.status)}</td><td>${r.status!=='Paid'?`<button class="btn btn-primary" onclick="markCommissionPaid('${esc(r.companyId)}','${esc(r.month)}')">Done</button>`:'<span class="note">Completed</span>'}</td></tr>`).join('')||'<tr><td colspan="10" class="empty">No commission records yet.</td></tr>'}</tbody></table></div></div>`);
  }
  window.markCommissionPaid=function(companyId,month){
    if(db.session?.role!=='Owner') return toast('Owner only');
    db.commissionPayouts=db.commissionPayouts||[];
    let p=db.commissionPayouts.find(x=>x.companyId===companyId&&x.month===month);
    if(!p){p={companyId,month,status:'Paid'};db.commissionPayouts.push(p)} else p.status='Paid';
    p.paidAt=new Date().toISOString();p.paidBy=owner.name;save();toast('Commission marked Done');commissionPage();
  };

  // Add route and page.
  routeTitles.commission='Commission';
  pages.commission=commissionPage;
  // Keep dashboard menu visible only for Owner/Admin. Other staff go straight to operational pages.
  permitted = function(r){
    const role=db.session?.role;
    if(r==='dashboard' && !['Owner','Admin'].includes(role)) return false;
    if(role==='Owner') return true;
    if(role==='Admin') return true;
    if(['Sales','Shipping'].includes(role) && ['dashboard','stock-list','stock-purchase','product-tools','staff-list','new-staff','commission-rate','create-company','company-list','commission','settings'].includes(r)) return false;
    if(role==='Shipping'&&['import-lead','lead-list','new-order'].includes(r)) return false;
    return true;
  };
  const _applyMenu=applyMenu;
  applyMenu=function(){
    _applyMenu();
    const role=db.session?.role;
    $$('.dashboard-role-only').forEach(x=>x.style.display=['Owner','Admin'].includes(role)?'':'none');
    $$('[data-route=company]').forEach(x=>x.style.display=['Owner','Admin'].includes(role)?'':'none');
  };
  pages.dashboard=dashboard;

  // Language labels for new Commission menu item.
  LANGS.en.Commission='Commission'; LANGS.si.Commission='කොමිස්'; LANGS.ta.Commission='கமிஷன்';
  const _applyLang=applyLanguage;
  applyLanguage=function(){
    _applyLang();
    $$('[data-route="commission"]').forEach(el=>{el.textContent=t('Commission')});
  };
})();

/* ===== v14 follow-up: allow Admin company creation UI and preserve page bindings ===== */
(function(){
  window.createCompany=function(){
    if(!['Owner','Admin'].includes(db.session?.role)) return toast('No access');
    layout(`<div class="card section-card" style="max-width:920px"><div class="panel-title">Create Company</div><p class="note">Create a company account. New companies receive no opening stock and must request stock from the Owner.</p><div class="form-grid"><div class="field"><label>Company Name</label><input id="cName" required></div><div class="field"><label>Admin Email / Username</label><input id="cEmail" type="email" required></div><div class="field"><label>Admin Password</label><input id="cPass" type="text" required></div><div class="field"><label>Manager Name (with initials) *</label><input id="cManager" required></div><div class="field"><label>Company Address *</label><input id="cAddress" required></div><div class="field"><label>Company Phone *</label><input id="cPhone" required></div><div class="field"><label>Attached Document (optional)</label><input id="cDocument" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"></div></div><div class="actions" style="margin-top:16px"><button class="btn btn-primary" onclick="createCompanyNow()">Create Company</button><button class="btn btn-outline" onclick="navTo('company-list')">Company List</button></div></div>`);
  };
  pages['create-company']=createCompany;
  pages['company-list']=companyList;
})();

/* ===== v15 requested commission/search refinement patch ===== */
(function(){
  db.staffCommissionRates = db.staffCommissionRates || {};
  (db.companies||[]).forEach(c=>{ if(!db.staffCommissionRates[c.id]) db.staffCommissionRates[c.id]={order:45,delivered:75}; });
  save();

  const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthKey=(y,m)=>`${y}-${String(m).padStart(2,'0')}`;
  const displayMonth=(key)=>{const [y,m]=(key||'').split('-').map(Number); return y&&m?`${monthNames[m-1]} ${y}`:key;};

  function commissionMonthsForCompanyAll(parentId){
    const childIds=new Set((db.companies||[]).filter(c=>c.parentCompanyId===parentId).map(c=>c.id));
    const currentYear=new Date().getFullYear();
    const by={};
    (db.stockRequests||[]).forEach(r=>{
      if(r.status!=='Approved' || !childIds.has(r.companyId)) return;
      const when=r.approvedAt||r.date||'';
      const d=new Date(when); if(isNaN(d)) return;
      const k=monthKey(d.getFullYear(),d.getMonth()+1);
      by[k] ||= {month:k,childCount:0,qty:0,total:0,requests:0,children:new Set()};
      const qty=Number(r.qty||0), total=Number(r.total||qty*Number(r.unitCost||45));
      by[k].qty += qty; by[k].total += total; by[k].requests += 1; by[k].children.add(r.companyId);
    });
    const keys=[];
    for(let m=1;m<=12;m++) keys.push(monthKey(currentYear,m));
    // Also include historical months from stored requests (so January-December of previous years remain visible).
    Object.keys(by).forEach(k=>{if(!keys.includes(k)) keys.push(k)});
    keys.sort((a,b)=>b.localeCompare(a));
    return keys.map(k=>({month:k,childCount:by[k]?.children?.size||0,qty:by[k]?.qty||0,total:by[k]?.total||0,requests:by[k]?.requests||0,commission:(by[k]?.total||0)*0.06,status:(db.commissionPayouts||[]).find(p=>p.companyId===parentId&&p.month===k)?.status||'Pending'}));
  }

  function commissionPageRefined(){
    if(!['Owner','Admin'].includes(db.session?.role)) return toast('No access');
    if(db.session.role==='Admin'){
      const rows=commissionMonthsForCompanyAll(currentCompanyId());
      const cards=rows.slice(0,12).map(r=>`<div class="commission-mini card"><div class="commission-month">${esc(displayMonth(r.month))}</div><div class="commission-amount">${money(r.commission)}</div><div class="commission-meta">${r.childCount} companies • ${r.qty} units • ${money(r.total)} purchases</div><span class="badge ${r.status==='Paid'?'delivered':'pending'}">${r.status}</span></div>`).join('');
      layout(`<div class="page-intro"><div><div class="eyebrow">COMMISSION</div><h2>Monthly Commission</h2><p>January to December commission earned from approved stock purchases made by companies created under your company.</p></div><div class="mini-stat"><b>6%</b><span>Company commission rate</span></div></div><div class="commission-cards">${cards||'<div class="card empty">No commission records yet.</div>'}</div>`);
      return;
    }
    const companies=(db.companies||[]).filter(c=>c.parentCompanyId || true);
    const rows=[];
    companies.forEach(c=>{
      const months=commissionMonthsForCompanyAll(c.id);
      months.forEach(r=>rows.push({company:c.name,companyId:c.id,...r}));
    });
    rows.sort((a,b)=>b.month.localeCompare(a.month)||a.company.localeCompare(b.company));
    layout(`<div class="page-intro"><div><div class="eyebrow">OWNER CONTROL</div><h2>Company Commission</h2><p>All company-wise commission amounts by month. Use Paid only after the commission payment has been completed.</p></div><div class="mini-stat"><b>${rows.filter(r=>r.commission>0&&r.status!=='Paid').length}</b><span>Unpaid commission rows</span></div></div><div class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Company</th><th>Month</th><th>Created Companies</th><th>Stock Qty</th><th>Stock Cost</th><th>Rate</th><th>Commission</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.company)}</b></td><td>${esc(displayMonth(r.month))}</td><td>${r.childCount}</td><td>${r.qty}</td><td>${money(r.total)}</td><td>6%</td><td><strong>${money(r.commission)}</strong></td><td>${badge(r.status)}</td><td>${r.commission>0&&r.status!=='Paid'?`<button class="btn btn-primary" onclick="markCommissionPaid('${esc(r.companyId)}','${esc(r.month)}')">Paid</button>`:''}</td></tr>`).join('')||'<tr><td colspan="10" class="empty">No commission records yet.</td></tr>'}</tbody></table></div></div>`);
  }

  function commissionRateRefined(){
    if(db.session.role!=='Admin') return toast('Only Company Admin can manage staff commission settings');
    const cid=currentCompanyId();
    db.staffCommissionRates[cid]=db.staffCommissionRates[cid]||{order:45,delivered:75};
    const rate=db.staffCommissionRates[cid];
    const currentMonth=today().slice(0,7);
    const team=db.staff.filter(s=>s.companyId===cid && s.type!=='Admin');
    const rows=team.map(s=>{
      const mine=db.orders.filter(o=>o.companyId===cid && ((o.createdById&&o.createdById===s.id) || (!o.createdById&&o.createdBy===s.name)) && String(o.date||'').startsWith(currentMonth));
      const orders=mine.length;
      const delivered=mine.filter(o=>o.status==='Delivered').length;
      const total=orders*Number(rate.order||45)+delivered*Number(rate.delivered||75);
      return {s,orders,delivered,total};
    });
    layout(`<div class="page-intro"><div><div class="eyebrow">STAFF COMMISSION</div><h2>Staff Commission Rate</h2><p>Set the commission rules for your staff and the system will calculate the current month's commission automatically.</p></div></div><div class="card section-card"><div class="form-grid"><div class="field"><label>Commission per Order (Rs)</label><input id="staffRateOrder" type="number" min="0" value="${Number(rate.order||45)}"></div><div class="field"><label>Commission per Delivered Order (Rs)</label><input id="staffRateDelivered" type="number" min="0" value="${Number(rate.delivered||75)}"></div><div class="actions" style="align-items:end"><button class="btn btn-primary" onclick="saveStaffCommissionRates()">Save & Calculate</button></div></div></div><div class="card table-card" style="margin-top:16px"><div class="panel-head"><div><div class="panel-title">${esc(displayMonth(currentMonth))}</div><div class="panel-sub">Automatic calculation: Orders × rate + Delivered × rate</div></div></div><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Staff</th><th>Orders</th><th>Delivered</th><th>Order Commission</th><th>Delivered Commission</th><th>Total</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.s.name)}</b></td><td>${r.orders}</td><td>${r.delivered}</td><td>${money(r.orders*Number(rate.order||45))}</td><td>${money(r.delivered*Number(rate.delivered||75))}</td><td><strong>${money(r.total)}</strong></td></tr>`).join('')||'<tr><td colspan="7" class="empty">No staff orders this month.</td></tr>'}</tbody></table></div></div>`);
  }
  window.saveStaffCommissionRates=function(){
    if(db.session?.role!=='Admin') return toast('Only Company Admin can change staff commission rates');
    const cid=currentCompanyId();
    db.staffCommissionRates[cid]={order:Math.max(0,Number($('#staffRateOrder')?.value||45)),delivered:Math.max(0,Number($('#staffRateDelivered')?.value||75))};
    save();toast('Staff commission rates updated');commissionRateRefined();
  };

  function searchOrdersRefined(){
    const role=db.session?.role;
    if(!['Owner','Admin','Sales','Shipping'].includes(role)) return toast('No access');
    layout(`<div class="page-intro"><div><div class="eyebrow">ORDER SEARCH</div><h2>Search Orders</h2><p>All historical orders are retained. Use date, staff and status filters to find records quickly.</p></div></div><div class="card section-card"><div class="form-grid"><div class="field"><label>Start Date</label><input id="soStart" type="date"></div><div class="field"><label>End Date</label><input id="soEnd" type="date"></div>${['Owner','Admin'].includes(role)?`<div class="field"><label>Staff</label><select id="soStaff"><option value="">All Staff</option>${db.staff.filter(s=>s.companyId===currentCompanyId()||role==='Owner').map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select></div>`:''}<div class="field"><label>Status</label><select id="soStatus"><option value="">All Statuses</option><option value="Pending">Act</option><option value="Shipped">Shipped</option><option value="Delivered">Delivered</option><option value="Returned">Returned</option><option value="OK">OK</option></select></div><div class="field span-2"><label>Search</label><input id="soSearch" placeholder="Order ID, customer, phone, product..."></div><div class="actions" style="align-items:end"><button class="btn btn-outline" onclick="clearOrderSearch()">Clear</button></div></div></div><div class="card table-card" style="margin-top:16px"><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Order ID</th><th>Date</th><th>Customer</th><th>Tel</th><th>Product</th><th>Qty</th><th>Price</th><th>Staff</th><th>Company</th><th>Status</th></tr></thead><tbody id="soBody"></tbody></table></div></div>`);
    ['soStart','soEnd','soStatus','soSearch','soStaff'].forEach(id=>{const el=$('#'+id);if(el){el.addEventListener('input',renderOrderSearchRefined);el.addEventListener('change',renderOrderSearchRefined)}});
    renderOrderSearchRefined();
  }
  function clearOrderSearch(){['soStart','soEnd','soStatus','soSearch','soStaff'].forEach(id=>{const el=$('#'+id);if(el)el.value=''});renderOrderSearchRefined()}
  function orderStatusLabel(s){return s==='Pending'?'Act':(s||'Act')}
  function renderOrderSearchRefined(){
    const role=db.session?.role, cid=currentCompanyId(), sd=$('#soStart')?.value||'', ed=$('#soEnd')?.value||'', st=$('#soStatus')?.value||'', q=($('#soSearch')?.value||'').toLowerCase().trim(), staffId=$('#soStaff')?.value||'';
    let a=(db.orders||[]).filter(o=>{
      if(cid && o.companyId!==cid) return false;
      if(role==='Sales'||role==='Shipping'){
        const u=currentUser(); if(!u) return false;
        if(o.createdById) { if(o.createdById!==u.id) return false; } else if(o.createdBy!==u.name) return false;
      }
      if(sd && String(o.date||'')<sd) return false;
      if(ed && String(o.date||'')>ed) return false;
      if(st && (st==='OK' ? o.status!=='OK' : o.status!==st)) return false;
      if(st==='Pending' && o.status!=='Pending') return false;
      if(st==='OK' && o.status!=='OK') return false;
      if(staffId){if((o.createdById||'')!==staffId){const u=db.staff.find(s=>s.id===staffId);if(!u||o.createdBy!==u.name)return false;}}
      if(q && !JSON.stringify(o).toLowerCase().includes(q)) return false;
      return true;
    });
    // Newest first, no date restriction by default.
    a.sort((x,y)=>String(y.createdAt||y.date||'').localeCompare(String(x.createdAt||x.date||'')));
    $('#soBody').innerHTML=a.map((o,i)=>{const stLabel=orderStatusLabel(o.status);const s=db.staff.find(s=>s.id===o.createdById)||db.staff.find(s=>s.name===o.createdBy);return `<tr><td>${i+1}</td><td><b>${esc(o.id)}</b></td><td>${esc(o.date||'')}</td><td>${esc(o.customer)}</td><td>${esc(o.tel)}</td><td>${esc(o.productSummary||'')}</td><td>${o.qty||0}</td><td>${money(o.price)}</td><td>${esc(s?.name||o.createdBy||'—')}</td><td>${esc(db.companies.find(c=>c.id===o.companyId)?.name||'—')}</td><td>${badge(stLabel)}</td></tr>`}).join('')||'<tr><td colspan="11" class="empty">No matching orders.</td></tr>';
  }

  searchOrders=searchOrdersRefined;
  renderOrderSearch=renderOrderSearchRefined;
  commissionPage=commissionPageRefined;
  commissionRate=commissionRateRefined;
  pages['search-orders']=searchOrdersRefined;
  pages.commission=commissionPageRefined;
  pages['commission-rate']=commissionRateRefined;
  routeTitles.commission='Commission';

  // Make sure Commission is in the Company dropdown, never Staff.
  const cmenu=document.querySelector('[data-group="company"] .submenu');
  const smenu=document.querySelector('[data-group="staff"] .submenu');
  if(cmenu && !cmenu.querySelector('[data-route="commission"]')) cmenu.insertAdjacentHTML('beforeend','<button data-route="commission">Commission</button>');
  if(smenu) smenu.querySelector('[data-route="commission"]')?.remove();

})();
/* ===== v16 FINAL COMMISSION CONTROLS ===== */
(function(){
  // --- Data migrations ---
  db.staffCommissionRates = db.staffCommissionRates || {};
  db.companyCommissionRates = db.companyCommissionRates || {};
  db.commissionPayouts = db.commissionPayouts || [];
  (db.staff||[]).forEach(s=>{
    if(!db.staffCommissionRates[s.id]){
      db.staffCommissionRates[s.id] = {mode:'both', order:45, delivered:75};
    } else {
      const r=db.staffCommissionRates[s.id];
      if(!['order','delivered','both'].includes(r.mode)) r.mode='both';
      if(!Number.isFinite(Number(r.order))) r.order=45;
      if(!Number.isFinite(Number(r.delivered))) r.delivered=75;
    }
  });
  (db.companies||[]).forEach(c=>{
    if(!Number.isFinite(Number(db.companyCommissionRates[c.id]))) db.companyCommissionRates[c.id]=6;
  });
  save();

  const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const mk=(y,m)=>`${y}-${String(m).padStart(2,'0')}`;
  const monthLabel=k=>{const [y,m]=(k||'').split('-').map(Number);return y&&m?`${monthNames[m-1]} ${y}`:k||''};
  const monthOptions=()=>{
    const y=new Date().getFullYear();
    const arr=[];
    for(let m=1;m<=12;m++) arr.push(mk(y,m));
    Object.keys(db.commissionPayouts||{}).forEach(()=>{});
    return arr;
  };

  function staffCommissionRate(staffId){
    const r=db.staffCommissionRates?.[staffId]||{mode:'both',order:45,delivered:75};
    return {mode:['order','delivered','both'].includes(r.mode)?r.mode:'both',order:Number(r.order||0),delivered:Number(r.delivered||0)};
  }

  function staffOrderCommission(o){
    const sid=o.createdById||o.staffId||db.staff.find(s=>s.name===o.createdBy)?.id;
    if(!sid) return 0;
    const r=staffCommissionRate(sid);
    const isDelivered=o.status==='Delivered';
    if(r.mode==='order') return r.order;
    if(r.mode==='delivered') return isDelivered?r.delivered:0;
    return r.order + (isDelivered?r.delivered:0);
  }
  window.staffOrderCommission=staffOrderCommission;

  // --- Staff Commission Rate: per-staff, individually configurable ---
  function commissionRatePerStaff(){
    if(db.session?.role!=='Admin') return toast('Only Company Admin can manage staff commission');
    const cid=currentCompanyId();
    const team=db.staff.filter(s=>s.companyId===cid && s.type!=='Admin');
    const currentMonth=today().slice(0,7);
    const rows=team.map(s=>{
      const rate=staffCommissionRate(s.id);
      const mine=db.orders.filter(o=>o.companyId===cid && (o.createdById===s.id || (!o.createdById && o.createdBy===s.name)) && String(o.date||o.createdAt||'').startsWith(currentMonth));
      const orders=mine.length, delivered=mine.filter(o=>o.status==='Delivered').length;
      const orderPart=(rate.mode==='order'||rate.mode==='both')?orders*rate.order:0;
      const deliveredPart=(rate.mode==='delivered'||rate.mode==='both')?delivered*rate.delivered:0;
      return {s,rate,orders,delivered,orderPart,deliveredPart,total:orderPart+deliveredPart};
    });
    layout(`<div class="page-intro"><div><div class="eyebrow">STAFF COMMISSION</div><h2>Commission Rate</h2><p>Each staff member can have their own commission method and rates.</p></div><div class="mini-stat"><b>${team.length}</b><span>Commissionable staff</span></div></div>
      <div class="card section-card commission-rule-card"><div class="panel-head"><div><div class="panel-title">Commission rules</div><div class="panel-sub">Choose Order only, Delivered only, or Both for each staff member.</div></div><span class="badge ok">Custom per staff</span></div>
      <div class="table-wrap" style="margin-top:14px"><table class="table"><thead><tr><th>#</th><th>Staff</th><th>Type</th><th>Commission Method</th><th>Order Rate</th><th>Delivered Rate</th><th>${esc(monthLabel(currentMonth))} Orders</th><th>Delivered</th><th>Month Total</th><th>Action</th></tr></thead><tbody>
      ${rows.map((r,i)=>`<tr>
        <td>${i+1}</td><td><b>${esc(r.s.name)}</b></td><td>${esc(r.s.type)}</td>
        <td><select class="staff-commission-mode" data-id="${esc(r.s.id)}"><option value="order" ${r.rate.mode==='order'?'selected':''}>Orders only</option><option value="delivered" ${r.rate.mode==='delivered'?'selected':''}>Delivered only</option><option value="both" ${r.rate.mode==='both'?'selected':''}>Both</option></select></td>
        <td><input class="staff-commission-order" data-id="${esc(r.s.id)}" type="number" min="0" step="1" value="${r.rate.order}"></td>
        <td><input class="staff-commission-delivered" data-id="${esc(r.s.id)}" type="number" min="0" step="1" value="${r.rate.delivered}"></td>
        <td>${r.orders}</td><td>${r.delivered}</td><td><strong>${money(r.total)}</strong></td>
        <td><button class="btn btn-primary" onclick="saveSingleStaffCommission('${esc(r.s.id)}')">Update</button></td>
      </tr>`).join('')||'<tr><td colspan="10" class="empty">No commissionable staff yet.</td></tr>'}
      </tbody></table></div></div>`);
  }
  window.saveSingleStaffCommission=function(staffId){
    if(db.session?.role!=='Admin') return toast('Only Company Admin can change staff commission');
    const s=db.staff.find(x=>x.id===staffId);
    if(!s||s.companyId!==currentCompanyId()||s.type==='Admin') return toast('Staff is outside your company');
    const mode=$(`.staff-commission-mode[data-id="${CSS.escape(staffId)}"]`)?.value||'both';
    const order=Math.max(0,Number($(`.staff-commission-order[data-id="${CSS.escape(staffId)}"]`)?.value||0));
    const delivered=Math.max(0,Number($(`.staff-commission-delivered[data-id="${CSS.escape(staffId)}"]`)?.value||0));
    db.staffCommissionRates[staffId]={mode,order,delivered};
    save();toast(`${s.name} commission updated`);commissionRatePerStaff();
  };

  // --- Company Commission: child-company stock purchases, per-admin-company rate ---
  function companyCommissionRows(parentCompanyId){
    const childIds=new Set((db.companies||[]).filter(c=>c.parentCompanyId===parentCompanyId).map(c=>c.id));
    const by={};
    (db.stockRequests||[]).forEach(r=>{
      if(r.status!=='Approved'||!childIds.has(r.companyId))return;
      const d=new Date(r.approvedAt||r.date||''); if(isNaN(d))return;
      const k=mk(d.getFullYear(),d.getMonth()+1);
      by[k] ||= {month:k,childCount:0,qty:0,total:0,children:new Set()};
      const qty=Number(r.qty||0), total=Number(r.total||qty*45);
      by[k].qty+=qty;by[k].total+=total;by[k].children.add(r.companyId);
    });
    const keys=[];
    const now=new Date();
    for(let m=1;m<=12;m++) keys.push(mk(now.getFullYear(),m));
    Object.keys(by).forEach(k=>{if(!keys.includes(k))keys.push(k)});
    keys.sort((a,b)=>b.localeCompare(a));
    const rate=Number(db.companyCommissionRates?.[parentCompanyId]??6);
    return keys.map(k=>({month:k,childCount:by[k]?.children?.size||0,qty:by[k]?.qty||0,total:by[k]?.total||0,rate,commission:(by[k]?.total||0)*rate/100,status:(db.commissionPayouts||[]).find(p=>p.companyId===parentCompanyId&&p.month===k)?.status||'Pending'}));
  }
  window.companyCommissionRows=companyCommissionRows;
  function monthEnded(key){
    const [y,m]=String(key||'').split('-').map(Number); if(!y||!m)return false;
    const last=new Date(y,m,0); last.setHours(23,59,59,999);
    return Date.now()>last.getTime();
  }
  window.monthEnded=monthEnded;

  function commissionPagePerSpec(){
    const role=db.session?.role;
    if(!['Owner','Admin'].includes(role)) return toast('No access');
    if(role==='Admin'){
      const cid=currentCompanyId();
      const rate=Number(db.companyCommissionRates?.[cid]??6);
      const rows=companyCommissionRows(cid).filter(r=>Number(r.commission||0)>0);
      const months=rows.map(r=>({key:r.month, label:monthLabel(r.month), commission:r.commission, qty:r.qty, total:r.total, childCount:r.childCount, status:r.status}));
      const total=months.reduce((a,r)=>a+Number(r.commission||0),0);
      const earnedText=months.length?`${months.length} earning month${months.length===1?'':'s'} recorded`:'No commission earned yet';
      const monthCells=months.map(r=>`<div class="commission-month-cell"><div class="cm-month">${esc(r.label)}</div><div class="cm-amount">${money(r.commission)}</div><div class="cm-meta">${r.qty} units • ${r.childCount} compan${r.childCount===1?'y':'ies'}</div></div>`).join('');
      layout(`<div class="page-intro"><div><div class="eyebrow">COMMISSION</div><h2>${esc(currentUser()?.company||'Company')} Monthly Commission</h2><p>Commission paid by the Owner for stock purchased by companies created under your company.</p></div><div class="mini-stat"><b>${rate}%</b><span>Current commission rate</span></div></div>
        <div class="commission-bonus-card card">
          <div class="commission-bonus-head"><div><div class="panel-title">${esc(currentUser()?.company||'Company')} Monthly Bonus</div><div class="panel-sub">${esc(earnedText)}</div></div><button class="link-button" onclick="navTo('commission')">View More <span>→</span></button></div>
          <div class="commission-earnings-bar"><span>Total Commission Earned</span><strong>${money(total)}</strong></div>
          <div class="commission-month-grid">${monthCells || '<div class="empty">No earned commission months yet.</div>'}<div class="commission-total-cell"><div class="cm-month">TOTAL</div><div class="cm-amount">${money(total)}</div><div class="cm-meta">All earned months</div></div></div>
        </div>`);
      return;
    }
    const companies=(db.companies||[]);
    const rows=[];
    companies.forEach(c=>companyCommissionRows(c.id).filter(r=>Number(r.commission||0)>0).forEach(r=>rows.push({company:c.name,companyId:c.id,...r})));
    rows.sort((a,b)=>b.month.localeCompare(a.month)||a.company.localeCompare(b.company));
    const months=[...new Set(rows.map(r=>r.month))];
    const totalCommission=rows.reduce((a,r)=>a+Number(r.commission||0),0);
    layout(`<div class="page-intro owner-commission-head"><div><div class="eyebrow">OWNER CONTROL</div><h2>Company Commission</h2><p>Review monthly commission for each Admin company based on stock purchased by the companies they created.</p></div><div class="owner-commission-summary"><div><span>Months with earnings</span><b>${months.length}</b></div><div><span>Total commission</span><b>${money(totalCommission)}</b></div></div></div>
      <div class="card section-card commission-filter-card"><div class="form-grid">
        <div class="field"><label>Company</label><select id="ocCompany"><option value="">All Companies</option>${companies.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></div>
        <div class="field"><label>Month</label><select id="ocMonth"><option value="">All Months</option>${months.map(m=>`<option value="${m}">${esc(monthLabel(m))}</option>`).join('')}</select></div>
        <div class="field"><label>Status</label><select id="ocStatus"><option value="">All Statuses</option><option value="Pending">Pending</option><option value="Paid">Paid</option></select></div>
        <div class="actions" style="align-items:end"><button class="btn btn-outline" onclick="clearOwnerCommissionFilters()">Clear</button></div>
      </div></div>
      <div class="card table-card owner-commission-table" style="margin-top:16px"><div class="table-wrap"><table class="table commission-source-table"><thead><tr><th>#</th><th>Date</th><th>Ref</th><th>Company</th><th>Qty</th><th>Total Products</th><th>Amount</th><th>Rate</th><th>Commission</th><th>Status</th><th>Action</th></tr></thead><tbody id="ownerCommissionBody"></tbody><tfoot><tr><td colspan="8"><strong>Grand Total</strong></td><td id="ownerCommissionTotal"><strong>${money(totalCommission)}</strong></td><td colspan="2"></td></tr></tfoot></table></div></div>`);
    ['ocCompany','ocMonth','ocStatus'].forEach(id=>$('#'+id)?.addEventListener('change',renderOwnerCommissionRows));
    renderOwnerCommissionRows();
  }
  function renderOwnerCommissionRows(){
    const company=$('#ocCompany')?.value||'',month=$('#ocMonth')?.value||'',status=$('#ocStatus')?.value||'';
    let rows=[]; 
    (db.companies||[]).forEach(c=>{
      const childIds=new Set((db.companies||[]).filter(x=>x.parentCompanyId===c.id).map(x=>x.id));
      (db.stockRequests||[]).filter(r=>r.status==='Approved'&&childIds.has(r.companyId)).forEach(r=>{
        const d=new Date(r.approvedAt||r.date||''); if(isNaN(d))return;
        const key=mk(d.getFullYear(),d.getMonth()+1); const rate=Number(db.companyCommissionRates?.[c.id]??6); const qty=Number(r.qty||0); const amount=Number(r.total||qty*45); const commission=amount*rate/100;
        const paid=(db.commissionPayouts||[]).find(p=>p.companyId===c.id&&p.month===key)?.status||'Pending';
        rows.push({parentCompany:c.name,companyId:c.id,month:key,date:d,ref:r.id,company:db.companies.find(x=>x.id===r.companyId)?.name||r.companyName||'—',qty,totalProducts:qty,amount,rate,commission,status:paid});
      });
    });
    rows=rows.filter(r=>(!company||r.companyId===company)&&(!month||r.month===month)&&(!status||r.status===status));
    rows.sort((a,b)=>b.date-a.date||a.company.localeCompare(b.company));
    const body=$('#ownerCommissionBody'); if(!body)return;
    const total=rows.reduce((a,r)=>a+r.commission,0);
    body.innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r.date.toISOString().slice(0,10)}</td><td><b>${esc(r.ref)}</b></td><td><b>${esc(r.company)}</b><div class="note">Admin: ${esc(r.parentCompany)}</div></td><td>${r.qty}</td><td>${r.totalProducts}</td><td>${money(r.amount)}</td><td>${Number(r.rate).toFixed(2)}%</td><td><strong>${money(r.commission)}</strong></td><td>${badge(r.status)}</td><td>${r.commission>0&&r.status!=='Paid'&&monthEnded(r.month)?`<button class="btn btn-primary" onclick="markCommissionPaid('${esc(r.companyId)}','${esc(r.month)}')">Paid</button>`:r.status==='Paid'?'<span class="note paid-note">Paid</span>':'<button class="btn btn-outline" disabled>Locked</button>'}</td></tr>`).join('')||'<tr><td colspan="11" class="empty">No matching commission records.</td></tr>';
    if($('#ownerCommissionTotal')) $('#ownerCommissionTotal').innerHTML=`<strong>${money(total)}</strong>`;
  }
  // --- Search Orders with per-order commission + bottom total ---
  function searchOrdersWithCommission(){
    const role=db.session?.role;
    if(!['Owner','Admin','Sales','Shipping'].includes(role))return toast('No access');
    layout(`<div class="page-intro"><div><div class="eyebrow">ORDER SEARCH</div><h2>Search Orders</h2><p>All historical orders. Filter by date, staff, status and keyword.</p></div><div class="mini-stat"><b id="soCount">0</b><span>Matching orders</span></div></div><div class="card section-card"><div class="form-grid"><div class="field"><label>Start Date</label><input id="soStart" type="date"></div><div class="field"><label>End Date</label><input id="soEnd" type="date"></div>${['Owner','Admin'].includes(role)?`<div class="field"><label>Staff</label><select id="soStaff"><option value="">All Staff</option>${db.staff.filter(s=>role==='Owner'||s.companyId===currentCompanyId()).map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select></div>`:''}<div class="field"><label>Status</label><select id="soStatus"><option value="">All Statuses</option><option value="Pending">Act</option><option value="Shipped">Shipped</option><option value="Delivered">Delivered</option><option value="Returned">Returned</option><option value="OK">OK</option></select></div><div class="field span-2"><label>Search</label><input id="soSearch" placeholder="Order ID, customer, phone, product..."></div><div class="actions" style="align-items:end"><button class="btn btn-outline" onclick="clearOrderSearchV16()">Clear</button></div></div></div><div class="card table-card" style="margin-top:16px"><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Order ID</th><th>Date</th><th>Customer</th><th>Tel</th><th>Product</th><th>Qty</th><th>Price</th><th>Commission</th><th>Staff</th><th>Company</th><th>Status</th></tr></thead><tbody id="soBody"></tbody><tfoot><tr class="search-order-total"><td colspan="6"><b>Total</b></td><td id="soQtyTotal"><b>0</b></td><td></td><td id="soCommTotal"><b>Rs. 0</b></td><td colspan="3"></td></tr></tfoot></table></div></div>`);
    ['soStart','soEnd','soStatus','soSearch','soStaff'].forEach(id=>{const el=$('#'+id);if(el){el.addEventListener('input',renderOrderSearchV16);el.addEventListener('change',renderOrderSearchV16)}});
    renderOrderSearchV16();
  }
  window.clearOrderSearchV16=function(){['soStart','soEnd','soStatus','soSearch','soStaff'].forEach(id=>{if($('#'+id))$('#'+id).value=''});renderOrderSearchV16()};
  function renderOrderSearchV16(){
    const role=db.session?.role,cid=currentCompanyId(),sd=$('#soStart')?.value||'',ed=$('#soEnd')?.value||'',st=$('#soStatus')?.value||'',q=($('#soSearch')?.value||'').toLowerCase().trim(),staffId=$('#soStaff')?.value||'';
    let a=(db.orders||[]).filter(o=>{
      if(cid&&o.companyId!==cid)return false;
      if(role==='Sales'||role==='Shipping'){const u=currentUser();if(!u)return false;if(o.createdById?o.createdById!==u.id:o.createdBy!==u.name)return false;}
      if(sd&&String(o.date||'')<sd)return false;if(ed&&String(o.date||'')>ed)return false;
      if(st&&o.status!==st)return false;
      if(staffId){if((o.createdById||'')!==staffId){const u=db.staff.find(s=>s.id===staffId);if(!u||o.createdBy!==u.name)return false;}}
      if(q&&!JSON.stringify(o).toLowerCase().includes(q))return false;return true;
    });
    a.sort((x,y)=>String(y.createdAt||y.date||'').localeCompare(String(x.createdAt||x.date||'')));
    const qty=a.reduce((s,o)=>s+Number(o.qty||0),0), comm=a.reduce((s,o)=>s+staffOrderCommission(o),0);
    if($('#soCount'))$('#soCount').textContent=String(a.length);if($('#soQtyTotal'))$('#soQtyTotal').innerHTML=`<b>${qty}</b>`;if($('#soCommTotal'))$('#soCommTotal').innerHTML=`<b>${money(comm)}</b>`;
    $('#soBody').innerHTML=a.map((o,i)=>{const s=db.staff.find(s=>s.id===o.createdById)||db.staff.find(s=>s.name===o.createdBy);return `<tr><td>${i+1}</td><td><b>${esc(o.id)}</b></td><td>${esc(o.date||'')}</td><td>${esc(o.customer)}</td><td>${esc(o.tel)}</td><td>${esc(o.productSummary||'')}</td><td>${o.qty||0}</td><td>${money(o.price)}</td><td><strong>${money(staffOrderCommission(o))}</strong></td><td>${esc(s?.name||o.createdBy||'—')}</td><td>${esc(db.companies.find(c=>c.id===o.companyId)?.name||'—')}</td><td>${badge(o.status==='Pending'?'Act':o.status||'Act')}</td></tr>`}).join('')||'<tr><td colspan="12" class="empty">No matching orders.</td></tr>';
  }

  // Bind final pages/routes and menu stays unchanged.
  commissionRate=commissionRatePerStaff;
  pages['commission-rate']=commissionRatePerStaff;
  commissionPage=commissionPagePerSpec;
  pages.commission=commissionPagePerSpec;
  searchOrders=searchOrdersWithCommission;
  pages['search-orders']=searchOrdersWithCommission;
})();

/* ===== COMMISSION V4 REFINEMENT — Dashboard + Admin/Owner pages ===== */
(function(){
  const MONTH_NAMES=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const monthName=k=>{const [y,m]=String(k||'').split('-').map(Number);return y&&m?`${MONTH_NAMES[m-1]} ${y}`:(k||'')};
  const reqAmount=r=>Number(r.total||((Number(r.qty)||0)*Number(r.unitCost||45))||0);
  const parentCompanies=()=> (db.companies||[]).filter(c=>(db.companies||[]).some(ch=>ch.parentCompanyId===c.id));
  const childOf=pid=>new Set((db.companies||[]).filter(c=>c.parentCompanyId===pid).map(c=>c.id));

  function adminCommissionRows(parentId){
    const children=childOf(parentId);
    const rate=Number(db.companyCommissionRates?.[parentId]??6);
    const rows=[];
    (db.stockRequests||[]).forEach(r=>{
      if(r.status!=='Approved'||!children.has(r.companyId)) return;
      const d=new Date(r.approvedAt||r.date||''); if(isNaN(d))return;
      const child=db.companies.find(c=>c.id===r.companyId);
      const qty=Number(r.qty||0), amount=reqAmount(r);
      rows.push({
        id:r.id,date:d,month:monthKey(d),company:child?.name||r.companyName||'—',
        companyId:r.companyId,qty,totalProducts:qty,amount,rate,
        commission:amount*rate/100,
        status:(db.commissionPayouts||[]).find(p=>p.companyId===parentId&&p.month===monthKey(d))?.status||'Pending',
        paymentRef:r.paymentRef||'', requestedBy:r.requestedBy||''
      });
    });
    rows.sort((a,b)=>b.date-a.date||a.company.localeCompare(b.company));
    return rows;
  }

  function monthlyAdminSummary(parentId){
    const by={};
    adminCommissionRows(parentId).forEach(r=>{
      by[r.month] ||= {month:r.month,qty:0,total:0,commission:0,companies:new Set(),requests:0,status:r.status};
      by[r.month].qty+=r.qty; by[r.month].total+=r.amount; by[r.month].commission+=r.commission;
      by[r.month].companies.add(r.companyId); by[r.month].requests+=1;
      if(r.status==='Paid') by[r.month].status='Paid';
    });
    return Object.values(by).sort((a,b)=>b.month.localeCompare(a.month)).map(x=>({...x,childCount:x.companies.size}));
  }

  function commissionDashboardCard(parentId){
    // Dashboard cards show only commission for months already paid by the Owner.
    const rows=monthlyAdminSummary(parentId).filter(r=>r.status==='Paid' && Number(r.commission||0)>0);
    const total=rows.reduce((s,r)=>s+r.commission,0);
    const monthCells=rows.map(r=>`<div class="cv4-month-cell"><div class="cv4-month">${esc(monthName(r.month))}</div><div class="cv4-amount">${money(r.commission).replace('Rs. ','')}</div><div class="cv4-meta">${r.qty} units • ${r.childCount} companies</div></div>`).join('');
    return `<div class="card cv4-bonus-card">
      <div class="cv4-bonus-head"><div><div class="panel-title">${esc(currentUser()?.company||'Company')} Monthly Commission</div><div class="panel-sub">Only Owner-paid commission from stock purchased by companies created under your company is shown here.</div></div><button class="link-button" onclick="navTo('commission')">View More <span>→</span></button></div>
      <div class="cv4-red-bar"><span>Total Paid Commission</span><strong>${money(total)}</strong></div>
      <div class="cv4-grid"><div class="cv4-label-cell"><span>#</span><b>Total Commission</b></div>${monthCells||'<div class="cv4-empty">No Owner-paid commission months yet.</div>'}<div class="cv4-total-cell"><div class="cv4-month">TOTAL</div><div class="cv4-amount">${money(total).replace('Rs. ','')}</div><div class="cv4-meta">Paid months only</div></div></div>
    </div>`;
  }

  // Refresh the dashboard commission block with the supplied compact reference style.
  const oldDashboard=dashboard;
  dashboard=function(){
    oldDashboard();
    if(db.session?.role!=='Admin') return;
    const host=document.querySelector('#content'); if(!host)return;
    const old=host.querySelector('.commission-dashboard-wrap'); if(old)old.remove();
    const wrap=document.createElement('div'); wrap.className='commission-dashboard-wrap';
    wrap.innerHTML=commissionDashboardCard(currentCompanyId());
    host.appendChild(wrap);
  };

  function renderAdminCommission(){
    const cid=currentCompanyId();
    if(db.session?.role!=='Admin') return toast('Company Admin only');
    const rate=Number(db.companyCommissionRates?.[cid]??6);
    const rows=adminCommissionRows(cid);
    const months=[...new Set(rows.map(r=>r.month))];
    const total=rows.reduce((s,r)=>s+r.commission,0);
    layout(`<div class="page-intro"><div><div class="eyebrow">COMPANY COMMISSION</div><h2>${esc(currentUser()?.company||'Company')} Commission</h2><p>Detailed monthly commission records from stock purchased by companies you created.</p></div><div class="mini-stat"><b>${rate}%</b><span>Commission rate</span></div></div>
      <div class="card cv4-admin-summary"><div class="cv4-admin-head"><div><div class="panel-title">Monthly Commission</div><div class="panel-sub">Only months with earned commission are shown.</div></div><div class="cv4-admin-total"><span>Total Earned</span><b>${money(total)}</b></div></div></div>
      <div class="card table-card cv4-admin-table-card"><div class="table-wrap"><table class="table cv4-admin-table"><thead><tr><th>#</th><th>Date</th><th>Ref</th><th>Company</th><th>Qty</th><th>Total Products</th><th>Amount</th><th>Lvl / Rate</th><th>Commission</th><th>Status</th></tr></thead><tbody id="adminCommissionBody"></tbody><tfoot><tr><td colspan="8"><strong>Total Commission</strong></td><td><strong id="adminCommissionTotal">${money(total)}</strong></td><td></td></tr></tfoot></table></div></div>`);
    if(rows.length && months.length){
      let idx=0, html='';
      months.forEach(m=>{
        const group=rows.filter(r=>r.month===m); if(!group.length)return;
        const monthTotal=group.reduce((s,r)=>s+r.commission,0);
        html+=`<tr class="cv4-month-row"><td colspan="10"><strong>${esc(monthName(m))}</strong><span>${group.length} purchase${group.length===1?'':'s'} · ${money(monthTotal)} commission</span></td></tr>`;
        group.forEach(r=>{ idx++; html+=`<tr><td>${idx}</td><td>${r.date.toISOString().slice(0,10)}</td><td><b>${esc(r.id)}</b></td><td><b>${esc(r.company)}</b></td><td>${r.qty}</td><td>${r.totalProducts}</td><td>${money(r.amount)}</td><td>${r.rate.toFixed(2)}%</td><td><strong>${money(r.commission)}</strong></td><td>${badge(r.status)}</td></tr>`; });
      });
      $('#adminCommissionBody').innerHTML=html;
    } else {
      $('#adminCommissionBody').innerHTML='<tr><td colspan="10" class="empty">No commission earned yet.</td></tr>';
    }
    // Keep screenshot-like month overview directly above the detailed table.
    const monthStrip=document.createElement('div'); monthStrip.className='card cv4-admin-months';
    monthStrip.innerHTML=months.map(m=>{const r=rows.filter(x=>x.month===m).reduce((s,x)=>s+x.commission,0);return `<div><span>${esc(monthName(m))}</span><b>${money(r)}</b></div>`}).join('')||'<div class="empty">No earning months.</div>';
    document.querySelector('#content')?.insertBefore(monthStrip,document.querySelector('.cv4-admin-table-card'));
  }

  function renderOwnerCommission(){
    if(db.session?.role!=='Owner') return toast('Owner only');
    const companies=parentCompanies();
    const earnedRows=[];
    companies.forEach(c=>monthlyAdminSummary(c.id).forEach(r=>earnedRows.push({admin:c,...r,rate:Number(db.companyCommissionRates?.[c.id]??6),status:(db.commissionPayouts||[]).find(p=>p.companyId===c.id&&p.month===r.month)?.status||'Pending'})));
    earnedRows.sort((a,b)=>b.month.localeCompare(a.month)||a.admin.name.localeCompare(b.admin.name));
    const months=[...new Set(earnedRows.map(r=>r.month))];
    const total=earnedRows.reduce((s,r)=>s+r.commission,0);
    const companiesOptions=companies.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    layout(`<div class="page-intro owner-commission-head"><div><div class="eyebrow">OWNER CONTROL</div><h2>Company Commission</h2><p>Monthly commission payable to each Admin company for stock purchased by the companies they created.</p></div><div class="owner-commission-summary"><div><span>Companies</span><b>${companies.length}</b></div><div><span>Total Due</span><b>${money(total)}</b></div></div></div>
      <div class="card cv4-owner-rate-card"><div><div class="panel-title">Commission Rate</div><div class="panel-sub">Change a company rate live; new calculations use the saved rate.</div></div><div class="cv4-rate-controls"><select id="cv4OwnerRateCompany"><option value="">Select company</option>${companiesOptions}</select><input id="cv4OwnerRateValue" type="number" min="0" step="0.01" value="6"><button class="btn btn-primary" onclick="saveOwnerCompanyRateV4()">Update Rate</button></div></div>
      <div class="card section-card cv4-owner-filter"><div class="form-grid"><div class="field"><label>Company</label><select id="ocCompany"><option value="">All Companies</option>${companiesOptions}</select></div><div class="field"><label>Month</label><select id="ocMonth"><option value="">All Months</option>${months.map(m=>`<option value="${esc(m)}">${esc(monthName(m))}</option>`).join('')}</select></div><div class="field"><label>Status</label><select id="ocStatus"><option value="">All Statuses</option><option value="Pending">Pending</option><option value="Paid">Paid</option></select></div><div class="actions" style="align-items:end"><button class="btn btn-outline" onclick="clearOwnerCommissionFiltersV4()">Clear</button></div></div></div>
      <div class="card table-card owner-commission-table"><div class="table-wrap"><table class="table cv4-owner-table"><thead><tr><th>#</th><th>Month</th><th>Company</th><th>Created Companies</th><th>Stock Qty</th><th>Stock Cost</th><th>Rate</th><th>Commission Due</th><th>Status</th><th>Action</th></tr></thead><tbody id="cv4OwnerBody"></tbody><tfoot><tr><td colspan="7"><strong>Grand Total</strong></td><td><strong id="cv4OwnerTotal">${money(total)}</strong></td><td colspan="2"></td></tr></tfoot></table></div></div>`);
    $('#cv4OwnerRateCompany')?.addEventListener('change',e=>{const v=e.target.value; if(v)$('#cv4OwnerRateValue').value=Number(db.companyCommissionRates?.[v]??6)});
    ['ocCompany','ocMonth','ocStatus'].forEach(id=>$('#'+id)?.addEventListener('change',renderOwnerCommissionRowsV4));
    renderOwnerCommissionRowsV4();
  }
  function renderOwnerCommissionRowsV4(){
    const cf=$('#ocCompany')?.value||'', mf=$('#ocMonth')?.value||'', sf=$('#ocStatus')?.value||'';
    const rows=[];
    parentCompanies().forEach(c=>monthlyAdminSummary(c.id).forEach(r=>{
      const status=(db.commissionPayouts||[]).find(p=>p.companyId===c.id&&p.month===r.month)?.status||'Pending';
      rows.push({admin:c, ...r, rate:Number(db.companyCommissionRates?.[c.id]??6), status});
    }));
    const filtered=rows.filter(r=>(!cf||r.admin.id===cf)&&(!mf||r.month===mf)&&(!sf||r.status===sf)).sort((a,b)=>b.month.localeCompare(a.month)||a.admin.name.localeCompare(b.admin.name));
    const body=$('#cv4OwnerBody'); if(!body)return;
    let i=0, total=0;
    body.innerHTML=filtered.map(r=>{i++; total+=r.commission; const locked=!monthEnded(r.month); return `<tr><td>${i}</td><td><b>${esc(monthName(r.month))}</b></td><td><b>${esc(r.admin.name)}</b></td><td>${r.childCount}</td><td>${r.qty}</td><td>${money(r.total)}</td><td>${r.rate.toFixed(2)}%</td><td><strong>${money(r.commission)}</strong></td><td>${badge(r.status)}</td><td>${r.status==='Paid'?'<span class="note paid-note">Paid</span>':locked?'<button class="btn btn-outline" disabled>Locked</button>':`<button class="btn btn-primary" onclick="markCommissionPaid('${esc(r.admin.id)}','${esc(r.month)}')">Paid</button>`}</td></tr>`}).join('')||'<tr><td colspan="10" class="empty">No matching commission months.</td></tr>';
    if($('#cv4OwnerTotal'))$('#cv4OwnerTotal').textContent=money(total);
  }
  window.saveOwnerCompanyRateV4=function(){
    if(db.session?.role!=='Owner')return toast('Owner only');
    const cid=$('#cv4OwnerRateCompany')?.value; const rate=Number($('#cv4OwnerRateValue')?.value);
    if(!cid||!Number.isFinite(rate)||rate<0)return toast('Select a company and valid rate');
    db.companyCommissionRates=db.companyCommissionRates||{}; db.companyCommissionRates[cid]=rate; save(); toast('Company commission rate updated'); renderOwnerCommission();
  };
  window.clearOwnerCommissionFiltersV4=function(){['ocCompany','ocMonth','ocStatus'].forEach(id=>{if($('#'+id))$('#'+id).value=''});renderOwnerCommissionRowsV4()};
  pages.commission=renderAdminCommission;
  // Route owner to owner page, admin to admin page.
  pages.commission=function(){ if(db.session?.role==='Owner')renderOwnerCommission(); else if(db.session?.role==='Admin')renderAdminCommission(); else toast('No access'); };
  routeTitles.commission='Commission';

  // Marking a payout is Owner-only and cannot be done before the earning month has ended.
  // Re-open the current V4 commission route afterwards so both status and the live rate
  // summaries refresh immediately instead of showing an older commission screen.
  window.markCommissionPaid=function(companyId,month){
    if(db.session?.role!=='Owner')return toast('Owner only');
    if(!window.monthEnded || !window.monthEnded(month))return toast('Paid is locked until the month has ended');
    db.commissionPayouts=db.commissionPayouts||[];
    let payout=db.commissionPayouts.find(p=>p.companyId===companyId&&p.month===month);
    if(!payout){payout={companyId,month,status:'Paid'};db.commissionPayouts.push(payout)}
    payout.status='Paid';payout.paidAt=new Date().toISOString();payout.paidBy=owner.name;
    save();toast('Commission marked Paid');navTo('commission');
  };
})();


/* ===== V22 LEAD WORKFLOW + TENANT SAFETY + COMPANY CHART TOGGLES ===== */
(function(){
  const previousPermittedV22 = permitted;
  permitted = function(route){
    if(route === 'import-lead' && !['Owner','Admin'].includes(db.session?.role)) return false;
    return previousPermittedV22(route);
  };

  const statusKeyV22 = value => {
    const s=String(value||'').trim().toLowerCase();
    if(s==='pending'||s==='pending lead') return 'Pending';
    if(s==='no answer'||s==='no-answer'||s==='noanswer') return 'No Answer';
    if(s==='rejected'||s==='reject') return 'Rejected';
    if(s==='ok'||s==='confirmed'||s==='confirm') return 'Confirmed';
    return String(value||'');
  };
  const leadCompanyV22 = l => {
    if(l?.companyId) return l.companyId;
    const assigned=db.staff.find(s=>s.id===l?.assignedStaffId) || db.staff.find(s=>s.name===l?.staff);
    return assigned?.companyId || '';
  };
  const leadStaffIdV22 = l => {
    if(l?.assignedStaffId) return l.assignedStaffId;
    return db.staff.find(s=>s.companyId===leadCompanyV22(l)&&s.name===l?.staff)?.id || '';
  };
  const companyUsersV22 = cid => db.staff.filter(s=>s.companyId===cid && (s.type==='Sales'||s.type==='Shipping'||s.type==='Admin'));
  const canManageLeadV22 = l => {
    if(db.session?.role==='Owner') return true;
    if(db.session?.role==='Admin') return leadCompanyV22(l)===currentCompanyId();
    return false;
  };
  const leadDayV22 = l => String(l?.date||l?.importedAt||'').slice(0,10);
  const leadOrderV22 = (a,b) => {
    const order={Pending:0,'No Answer':1,Rejected:2,Confirmed:3};
    const ra=order[statusKeyV22(a.status)] ?? 4, rb=order[statusKeyV22(b.status)] ?? 4;
    if(ra!==rb) return ra-rb;
    const date=leadDayV22(b).localeCompare(leadDayV22(a));
    if(date) return date;
    return String(b.importedAt||'').localeCompare(String(a.importedAt||'')) || String(a.no||'').localeCompare(String(b.no||''));
  };

  // Keep imports assigned to a real user, inside the target company. There is no unassigned import action.
  function importLeadV22(){
    if(!['Owner','Admin'].includes(db.session?.role)) return toast('Only Owner or Company Admin can import leads');
    layout(`<div class="page-intro"><div><div class="eyebrow">LEAD MANAGEMENT</div><h2>Import Leads</h2><p>Upload a CSV, XLS or XLSX file, then assign every lead to a user in the target company before saving.</p></div><div class="mini-stat"><b>Required</b><span>Company user assignment</span></div></div>
      <div class="card section-card"><div class="panel-head"><div><div class="panel-title">Upload Lead File</div><div class="panel-sub">Every row will be saved into that company's Lead List. Unassigned imports are disabled.</div></div><span id="leadCountBadge" class="badge pending">0 leads</span></div>
      <div class="toolbar"><div class="field grow"><label>Lead file</label><input id="leadFile" type="file" accept=".csv,.xls,.xlsx"></div><button class="btn btn-primary" onclick="readLeadImportFile()">Read File</button></div>
      <div class="callout"><b>Required file columns</b><div class="note">Customer Name • Address • Contact No • Contact No 2 • Other • Product Code</div><div class="note" style="margin-top:4px">Lead No, Lead Date, Status and assigned Staff are generated automatically.</div></div><div id="leadPreview" style="margin-top:15px"></div></div>`);
  }
  async function readLeadImportFileV22(){
    if(!['Owner','Admin'].includes(db.session?.role)) return toast('Only Owner or Company Admin can import leads');
    const f=$('#leadFile')?.files?.[0]; if(!f) return toast('Choose a CSV, XLS or XLSX file');
    const ext=(f.name.split('.').pop()||'').toLowerCase();
    if(!['csv','xls','xlsx'].includes(ext)) return toast('Supported files: CSV, XLS, XLSX');
    try{
      let rows;
      if(ext==='csv') rows=parseCsv(await f.text());
      else{
        if(location.protocol==='file:') return toast('For XLS/XLSX import, open this package with start_server.bat');
        const fd=new FormData();fd.append('file',f);
        const res=await fetch('/api/parse-excel',{method:'POST',body:fd});
        const payload=await res.json().catch(()=>null);
        if(!res.ok) throw new Error(payload?.error||`Excel parser unavailable (${res.status})`);
        if(!Array.isArray(payload)) throw new Error(payload?.error||'Excel file could not be parsed');
        rows=payload;
      }
      pendingLeadRows=mapLeadRows(rows);
      if(!pendingLeadRows.length) return toast('No valid rows found. Check the six required column headers.');
      $('#leadCountBadge').textContent=`${pendingLeadRows.length} leads ready`;
      $('#leadPreview').innerHTML=`<div class="mini-stat"><b>${pendingLeadRows.length}</b><span>Valid leads read. Assign all of them to users before importing.</span></div>
        <div class="table-wrap" style="margin-top:10px"><table class="table"><thead><tr><th>#</th><th>Customer</th><th>Contact</th><th>Product Code</th></tr></thead><tbody>${pendingLeadRows.slice(0,8).map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${esc(r.tel)}</td><td>${esc(r.product)}</td></tr>`).join('')}${pendingLeadRows.length>8?`<tr><td colspan="4" class="note">+ ${pendingLeadRows.length-8} more</td></tr>`:''}</tbody></table></div>
        <div class="actions" style="margin-top:14px"><button class="btn btn-primary" onclick="openLeadAssignmentModal()">Assign &amp; Import Leads</button></div>`;
    }catch(e){toast(e.message||'Could not read file')}
  }
  function openLeadAssignmentModalV22(){
    if(!['Owner','Admin'].includes(db.session?.role)) return toast('Only Owner or Company Admin can import leads');
    if(!pendingLeadRows.length) return toast('Read a lead file first');
    const isOwner=db.session.role==='Owner';
    window.__leadImportTargetCompanyIdV22=isOwner?'':currentCompanyId();
    window.__leadImportAllocationRowsV22=[];
    const companySelect=isOwner?`<div class="field" style="margin-top:12px"><label>Company *</label><select id="leadAssignCompanyV22" onchange="leadImportCompanyChangedV22(this.value)"><option value="">Select company</option>${db.companies.filter(c=>c.active!==false).map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></div>`:`<div class="callout" style="margin-top:12px"><b>Company</b><div>${esc(currentUser()?.company||'Your company')}</div><div class="note">All leads will be saved to this company only.</div></div>`;
    const m=document.createElement('div');m.className='modal-mask';m.id='leadAssignModalV22';m.style.display='flex';
    m.innerHTML=`<div class="modal" style="width:min(780px,96vw)"><div class="modal-head"><div><div class="eyebrow">LEAD DISTRIBUTION</div><div class="panel-title">Assign Imported Leads</div><div class="note">${pendingLeadRows.length} leads must be assigned. The total assigned count must equal the file row count.</div></div><button class="close" onclick="this.closest('.modal-mask').remove()">×</button></div>
      ${companySelect}<div id="leadAssignModalBodyV22" style="margin-top:14px"></div><div class="actions" style="justify-content:space-between;margin-top:14px"><div class="note" id="leadAssignmentTotalV22">0 / ${pendingLeadRows.length} leads assigned</div><div class="actions"><button class="btn btn-outline" onclick="addLeadImportAllocationV22()">+ Add User</button><button class="btn btn-primary" onclick="confirmLeadAssignment()">Import &amp; Assign</button></div></div></div>`;
    document.body.appendChild(m);
    if(!isOwner) leadImportCompanyChangedV22(currentCompanyId()); else renderLeadImportAllocationRowsV22();
  }
  function leadImportCompanyChangedV22(cid){
    const isOwner=db.session?.role==='Owner';
    if(!isOwner && cid!==currentCompanyId()) return toast('You can only import to your own company');
    window.__leadImportTargetCompanyIdV22=cid||'';
    const users=companyUsersV22(cid);
    window.__leadImportAllocationRowsV22=cid&&users.length?[{staffId:'',qty:pendingLeadRows.length}]:[];
    renderLeadImportAllocationRowsV22();
  }
  function collectLeadImportAllocationsV22(){
    const body=$('#leadAssignModalBodyV22'); if(!body) return [];
    return $$('.lead-import-allocation-v22',body).map(r=>({staffId:r.querySelector('.lead-import-user-v22')?.value||'',qty:Number(r.querySelector('.lead-import-qty-v22')?.value)}));
  }
  function renderLeadImportAllocationRowsV22(){
    const body=$('#leadAssignModalBodyV22'); if(!body)return;
    const cid=window.__leadImportTargetCompanyIdV22||'';
    const users=companyUsersV22(cid);
    let rows=window.__leadImportAllocationRowsV22||[];
    if(!cid){body.innerHTML='<div class="empty" style="padding:16px">Select a company first.</div>';updateLeadImportTotalV22();return}
    if(!users.length){body.innerHTML='<div class="empty" style="padding:16px">This company has no Sales or Shipping users. Create a company user before importing.</div>';updateLeadImportTotalV22();return}
    if(!rows.length){rows=[{staffId:'',qty:pendingLeadRows.length}];window.__leadImportAllocationRowsV22=rows}
    body.innerHTML=rows.map((r,i)=>`<div class="assignment-row lead-import-allocation-v22" style="display:grid;grid-template-columns:minmax(180px,1fr) 140px auto;gap:10px;align-items:end;margin-bottom:10px"><div class="field"><label>Company User ${i+1}</label><select class="lead-import-user-v22" onchange="updateLeadImportTotalV22()"><option value="">Select user *</option>${users.map(u=>`<option value="${esc(u.id)}" ${u.id===r.staffId?'selected':''}>${esc(u.name)} (${esc(u.type)})</option>`).join('')}</select></div><div class="field"><label>Lead Count</label><input class="lead-import-qty-v22" type="number" min="0" max="${pendingLeadRows.length}" value="${Number.isFinite(Number(r.qty))?Number(r.qty):0}" oninput="updateLeadImportTotalV22()"></div><button class="btn btn-danger" onclick="removeLeadImportAllocationV22(${i})">Remove</button></div>`).join('');
    updateLeadImportTotalV22();
  }
  function updateLeadImportTotalV22(){
    const total=collectLeadImportAllocationsV22().reduce((sum,r)=>sum+(Number.isFinite(r.qty)?r.qty:0),0);
    const el=$('#leadAssignmentTotalV22'); if(el)el.textContent=`${total} / ${pendingLeadRows.length} leads assigned`;
    if(el){el.classList.toggle('lead-allocation-match',total===pendingLeadRows.length);el.classList.toggle('lead-allocation-mismatch',total!==pendingLeadRows.length)}
  }
  function addLeadImportAllocationV22(){
    const cid=window.__leadImportTargetCompanyIdV22||'';if(!cid)return toast('Select a company first');
    const users=companyUsersV22(cid);if(!users.length)return toast('No Sales or Shipping users available');
    const rows=collectLeadImportAllocationsV22();rows.push({staffId:'',qty:0});window.__leadImportAllocationRowsV22=rows;renderLeadImportAllocationRowsV22();
  }
  function removeLeadImportAllocationV22(index){
    const rows=collectLeadImportAllocationsV22();rows.splice(index,1);window.__leadImportAllocationRowsV22=rows;renderLeadImportAllocationRowsV22();
  }
  function confirmLeadAssignmentV22(){
    if(!['Owner','Admin'].includes(db.session?.role))return toast('Only Owner or Company Admin can import leads');
    if(!pendingLeadRows.length)return toast('Read a lead file first');
    const companyId=window.__leadImportTargetCompanyIdV22||'';
    if(!db.companies.some(c=>c.id===companyId&&c.active!==false))return toast('Select a valid active company');
    if(db.session.role!=='Owner'&&companyId!==currentCompanyId())return toast('You can only import to your own company');
    const rows=collectLeadImportAllocationsV22();
    if(!rows.length)return toast('Select at least one company user');
    if(rows.some(r=>!Number.isInteger(r.qty)||r.qty<0))return toast('Lead counts must be whole numbers (zero or more)');
    const usedRows=rows.filter(r=>r.qty>0);
    if(usedRows.some(r=>!r.staffId))return toast('Select a user for every allocation row that has leads');
    const users=new Map(companyUsersV22(companyId).map(s=>[s.id,s]));
    if(usedRows.some(r=>!users.has(r.staffId)))return toast('Every selected user must belong to the target company');
    const total=rows.reduce((sum,r)=>sum+r.qty,0);
    if(total!==pendingLeadRows.length)return toast(`Assign exactly ${pendingLeadRows.length} leads before importing`);
    if(total===0)return toast('Assign at least one lead');
    const importAt=new Date().toISOString();
    const usedNos=new Set((db.leads||[]).map(l=>String(l.no)));
    const prefix=`L-${Date.now()}`;let seq=0;
    const nextNo=()=>{let no;do{no=`${prefix}-${String(++seq).padStart(4,'0')}`}while(usedNos.has(no));usedNos.add(no);return no};
    let cursor=0;const newLeads=[];
    for(const allocation of usedRows){
      const staff=users.get(allocation.staffId);
      for(let i=0;i<allocation.qty;i++){
        const r=pendingLeadRows[cursor++];
        newLeads.push({no:nextNo(),date:today(),importedAt:importAt,name:r.name||'',address:r.address||'',city:'',tel:r.tel||'',tel2:r.tel2||'',other:r.other||'',product:r.product||'',staff:staff.name,status:'Pending',note:'',companyId,assignedStaffId:staff.id});
      }
    }
    if(cursor!==pendingLeadRows.length)return toast('Import count mismatch; no leads were saved');
    db.leads.unshift(...newLeads);save();pendingLeadRows=[];
    $('#leadAssignModalV22')?.remove();document.querySelectorAll('.modal-mask').forEach(m=>{if(m.id==='leadAssignModalV22')m.remove()});
    toast(`${newLeads.length} leads imported and assigned to ${db.companies.find(c=>c.id===companyId)?.name||'company'}`);
    navTo('lead-list');
  }
  window.leadImportCompanyChangedV22=leadImportCompanyChangedV22;
  window.updateLeadImportTotalV22=updateLeadImportTotalV22;
  window.addLeadImportAllocationV22=addLeadImportAllocationV22;
  window.removeLeadImportAllocationV22=removeLeadImportAllocationV22;
  openLeadAssignmentModal=openLeadAssignmentModalV22;window.openLeadAssignmentModal=openLeadAssignmentModalV22;
  confirmLeadAssignment=confirmLeadAssignmentV22;window.confirmLeadAssignment=confirmLeadAssignmentV22;
  importLeadsUnassigned=function(){toast('Select a company user in “Assign & Import Leads” before importing')};window.importLeadsUnassigned=importLeadsUnassigned;
  importLead=importLeadV22;window.importLead=importLeadV22;pages['import-lead']=importLeadV22;
  readLeadImportFile=readLeadImportFileV22;window.readLeadImportFile=readLeadImportFileV22;

  function leadListV22(){
    const role=db.session?.role||'',isOwner=role==='Owner',isAdmin=role==='Admin',manager=isOwner||isAdmin;
    const initialCompany=isOwner?'':currentCompanyId();
    const companyOptions=isOwner?`<option value="">All companies</option>${db.companies.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}`:'';
    const visibleUsers=isOwner?db.staff.filter(s=>s.type==='Sales'||s.type==='Shipping'||s.type==='Admin'):db.staff.filter(s=>s.companyId===currentCompanyId()&&(s.type==='Sales'||s.type==='Shipping'||s.type==='Admin'));
    const userOptions=visibleUsers.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}${isOwner?' • '+esc(s.company):''}</option>`).join('');
    layout(`<div class="page-intro"><div><div class="eyebrow">LEAD MANAGEMENT</div><h2>Lead List</h2><p>Default view shows today’s leads and older Pending leads. Choose a date range (or a quick range) to see older leads of every status.</p></div><div class="mini-stat"><b id="leadVisibleCountV22">0</b><span>Visible leads</span></div></div>
      <div class="card section-card lead-filter-card"><div class="toolbar lead-toolbar">
      ${isOwner?`<div class="field"><label>Company</label><select id="leadCompanyFilterV22" onchange="syncLeadUserFiltersV22();renderLeadRows()">${companyOptions}</select></div>`:''}
      <div class="field"><label>Status</label><select id="leadStatus"><option value="">All visible statuses</option><option value="Pending">Pending Lead</option><option value="No Answer">No Answer</option><option value="Rejected">Rejected</option><option value="Confirmed">Confirmed</option></select></div>
      <div class="field"><label>User</label><select id="leadUser"><option value="">All users</option>${userOptions}</select></div>
      <div class="field"><label>Start Date</label><input id="leadStart" type="date" value=""></div><div class="field"><label>End Date</label><input id="leadEnd" type="date" value=""></div><div class="field grow"><label>Search</label><input id="leadSearch" placeholder="Name, contact, lead no, product..."></div>
      <div class="lead-quick-ranges"><button class="btn btn-outline" onclick="setLeadRangeV22(7)">Last 7 days</button><button class="btn btn-outline" onclick="setLeadRangeV22(30)">Last 30 days</button><button class="btn btn-outline" onclick="setLeadRangeV22(0)">All dates</button><button class="btn btn-outline" onclick="clearLeadDateRangeV22()">Clear Date Range</button></div></div>
      <div class="lead-bulk-toolbar"><div class="lead-selection-summary"><b id="leadSelectionCountV22">0 selected</b><span>Select leads using the checkboxes in the table.</span></div><div class="actions">
      ${manager?`<button class="btn btn-outline" onclick="bulkReassignSelectedLeadsV22()">Reassign Selected</button><button class="btn btn-danger" onclick="deleteSelectedLeadsV22()">Delete Selected</button>`:''}
      <button class="btn btn-outline" onclick="exportSelectedLeads()">Export Selected CSV</button></div></div></div>
      <div class="card table-card"><div class="table-wrap"><table class="table" id="leadTable"><thead><tr><th><input type="checkbox" id="leadAll" aria-label="Select all visible leads" onchange="toggleAllLeads(this.checked)"></th><th>#</th><th>Lead No</th><th>Lead Date</th><th>Customer Name</th><th>Address</th><th>Contact No</th><th>Contact No 2</th><th>Other</th><th>Product Code</th><th>Staff</th><th>View</th><th>Status</th><th>Note</th></tr></thead><tbody id="leadBody"></tbody></table></div></div>`);
    ['leadStatus','leadUser','leadStart','leadEnd','leadSearch'].forEach(id=>{const el=$('#'+id);if(el)el.addEventListener(id==='leadSearch'?'input':'change',renderLeadRows)});
    renderLeadRowsV22();
  }
  function syncLeadUserFiltersV22(){
    const el=$('#leadUser');if(!el)return;
    const role=db.session?.role,isOwner=role==='Owner',cid=isOwner?($('#leadCompanyFilterV22')?.value||''):currentCompanyId(),previous=el.value;
    const users=db.staff.filter(s=>(!cid||s.companyId===cid)&&(s.type==='Sales'||s.type==='Shipping'||s.type==='Admin'));
    el.innerHTML=`<option value="">All users</option>${users.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}${isOwner?' • '+esc(s.company):''}</option>`).join('')}`;
    if(users.some(s=>s.id===previous))el.value=previous;
  }
  function setLeadRangeV22(days){
    const iso=d=>d.toISOString().slice(0,10),end=new Date();
    let start;
    if(days>0){start=new Date();start.setDate(start.getDate()-(days-1));}
    else{const all=(db.leads||[]).map(leadDayV22).filter(Boolean).sort();start=all.length?new Date(all[0]+'T00:00:00'):new Date();}
    if($('#leadStart'))$('#leadStart').value=iso(start);if($('#leadEnd'))$('#leadEnd').value=iso(end);renderLeadRowsV22();
  }
  function clearLeadDateRangeV22(){if($('#leadStart'))$('#leadStart').value='';if($('#leadEnd'))$('#leadEnd').value='';renderLeadRowsV22()}
  function renderLeadRowsV22(){
    const body=$('#leadBody');if(!body)return;
    const role=db.session?.role||'',isOwner=role==='Owner',isAdmin=role==='Admin',me=currentUser(),cid=currentCompanyId();
    let sd=$('#leadStart')?.value||'',ed=$('#leadEnd')?.value||'';if(sd&&ed&&sd>ed)[sd,ed]=[ed,sd];const customDate=!!(sd||ed);
    const selectedCompany=isOwner?($('#leadCompanyFilterV22')?.value||''):cid;
    const statusFilter=statusKeyV22($('#leadStatus')?.value||''),userFilter=$('#leadUser')?.value||'',query=($('#leadSearch')?.value||'').toLowerCase().trim();
    let rows=(db.leads||[]).filter(l=>{
      const ownerCompany=leadCompanyV22(l);
      if(isOwner){if(selectedCompany&&ownerCompany!==selectedCompany)return false;}
      else{
        if(!cid||ownerCompany!==cid)return false;
        if(!isAdmin){const assigned=leadStaffIdV22(l);if(assigned!==me?.id&&l.staff!==me?.name)return false;}
      }
      const day=leadDayV22(l),key=statusKeyV22(l.status);
      const dateOk=customDate?((!sd||day>=sd)&&(!ed||day<=ed)):(day===today()||(key==='Pending'&&(!day||day<today())));
      const staffId=leadStaffIdV22(l),staffName=db.staff.find(s=>s.id===staffId)?.name||l.staff||'Unassigned';
      const statusOk=!statusFilter||key===statusFilter;
      const userOk=!userFilter||staffId===userFilter;
      const queryOk=!query||[l.no,l.name,l.address,l.tel,l.tel2,l.other,l.product,l.staff,l.status,l.note,staffName].some(v=>String(v||'').toLowerCase().includes(query));
      return dateOk&&statusOk&&userOk&&queryOk;
    });
    rows.sort(leadOrderV22);
    body.innerHTML=rows.map((l,i)=>{
      const staffId=leadStaffIdV22(l),staffName=db.staff.find(s=>s.id===staffId)?.name||l.staff||'Unassigned';
      const key=statusKeyV22(l.status),label=key==='Confirmed'?'Confirmed':key;
      const badgeClass=key==='Confirmed'?'ok':key==='Pending'?'pending':key==='No Answer'?'noanswer':key==='Rejected'?'rejected':'pending';
      return `<tr data-lead-no="${esc(l.no)}" class="lead-row-${key==='No Answer'?'noanswer':key==='Rejected'?'rejected':key==='Confirmed'?'confirmed':'pending'}"><td><input type="checkbox" class="lead-check" value="${esc(l.no)}" onchange="updateLeadSelectionCountV22()"></td><td>${i+1}</td><td><b>${esc(l.no)}</b></td><td>${esc(leadDayV22(l))}</td><td><button class="lead-customer-link" onclick="openLeadOrder('${esc(l.no)}')"><b>${esc(l.name)}</b></button></td><td>${esc(l.address)}</td><td>${esc(l.tel)}</td><td>${esc(l.tel2)}</td><td>${esc(l.other)}</td><td>${esc(l.product)}</td><td>${esc(staffName)}</td><td><button class="btn btn-primary" onclick="openLeadOrder('${esc(l.no)}')">View</button></td><td><span class="badge ${badgeClass}">${esc(label)}</span></td><td>${leadNoteBtn(l)}</td></tr>`;
    }).join('')||'<tr><td colspan="14" class="empty">No leads match this view. Choose a date range to view historical leads.</td></tr>';
    if($('#leadVisibleCountV22'))$('#leadVisibleCountV22').textContent=String(rows.length);
    if($('#leadAll'))$('#leadAll').checked=false;
    updateLeadSelectionCountV22();
  }
  function toggleAllLeadsV22(checked){$$('.lead-check').forEach(el=>el.checked=!!checked);updateLeadSelectionCountV22()}
  function selectedLeadNosV22(){return $$('.lead-check:checked').map(el=>el.value)}
  function updateLeadSelectionCountV22(){const n=selectedLeadNosV22().length;const el=$('#leadSelectionCountV22');if(el)el.textContent=`${n} selected`;const a=$('#leadAll'),checks=$$('.lead-check');if(a&&checks.length)a.checked=checks.every(c=>c.checked)}
  function selectedManageableLeadsV22(){
    const ids=selectedLeadNosV22();
    if(!ids.length){toast('Select leads first');return null}
    const byNo=new Map((db.leads||[]).map(l=>[String(l.no),l]));
    const rows=ids.map(id=>byNo.get(String(id))).filter(Boolean);
    if(rows.length!==ids.length){toast('Some selected leads could not be found');return null}
    if(!rows.every(canManageLeadV22)){toast('You can only manage leads inside your own company');return null}
    return rows;
  }
  function bulkReassignSelectedLeadsV22(){
    if(!['Owner','Admin'].includes(db.session?.role))return toast('Only Owner or Company Admin can reassign leads');
    const rows=selectedManageableLeadsV22();if(!rows)return;
    const companies=[...new Set(rows.map(leadCompanyV22))];
    if(companies.length!==1||!companies[0])return toast('Select leads from one company to reassign them together');
    const cid=companies[0],users=companyUsersV22(cid);if(!users.length)return toast('No Sales or Shipping users available in this company');
    window.__bulkLeadReassignIdsV22=rows.map(l=>String(l.no));window.__bulkLeadReassignCompanyV22=cid;
    const comp=db.companies.find(c=>c.id===cid);
    const m=document.createElement('div');m.className='modal-mask';m.id='bulkLeadReassignModalV22';m.style.display='flex';
    m.innerHTML=`<div class="modal" style="width:min(520px,94vw)"><div class="modal-head"><div><div class="eyebrow">BULK LEAD ACTION</div><div class="panel-title">Reassign ${rows.length} Selected Leads</div><div class="note">Company: ${esc(comp?.name||cid)}. All selected leads stay inside this company.</div></div><button class="close" onclick="this.closest('.modal-mask').remove()">×</button></div><div class="field" style="margin-top:14px"><label>Assign all selected leads to *</label><select id="bulkLeadReassignUserV22"><option value="">Select company user</option>${users.map(u=>`<option value="${esc(u.id)}">${esc(u.name)} (${esc(u.type)})</option>`).join('')}</select></div><div class="actions" style="margin-top:16px;justify-content:flex-end"><button class="btn btn-outline" onclick="this.closest('.modal-mask').remove()">Cancel</button><button class="btn btn-primary" onclick="confirmBulkLeadReassignV22()">Reassign Leads</button></div></div>`;document.body.appendChild(m);
  }
  function confirmBulkLeadReassignV22(){
    if(!['Owner','Admin'].includes(db.session?.role))return toast('Only Owner or Company Admin can reassign leads');
    const ids=window.__bulkLeadReassignIdsV22||[],cid=window.__bulkLeadReassignCompanyV22,staff=db.staff.find(s=>s.id===$('#bulkLeadReassignUserV22')?.value);
    if(!staff||staff.companyId!==cid||!['Sales','Shipping','Admin'].includes(staff.type))return toast('Select a valid user from the same company');
    const map=new Map((db.leads||[]).map(l=>[String(l.no),l]));const rows=ids.map(id=>map.get(String(id)));
    if(!rows.length||rows.some(l=>!l||!canManageLeadV22(l)||leadCompanyV22(l)!==cid))return toast('Selected leads are not in the same company');
    rows.forEach(l=>{l.companyId=cid;l.assignedStaffId=staff.id;l.staff=staff.name;l.updatedAt=new Date().toISOString()});
    save();$('#bulkLeadReassignModalV22')?.remove();toast(`${rows.length} leads reassigned to ${staff.name}`);renderLeadRowsV22();
  }
  function deleteSelectedLeadsV22(){
    if(!['Owner','Admin'].includes(db.session?.role))return toast('Only Owner or Company Admin can delete leads');
    const rows=selectedManageableLeadsV22();if(!rows)return;
    if(!window.confirm(`Delete ${rows.length} selected lead(s)? This cannot be undone.`))return;
    const ids=new Set(rows.map(l=>String(l.no)));
    db.leads=(db.leads||[]).filter(l=>!ids.has(String(l.no))||!canManageLeadV22(l));
    save();toast(`${rows.length} selected leads deleted`);renderLeadRowsV22();
  }
  window.syncLeadUserFiltersV22=syncLeadUserFiltersV22;
  window.clearLeadDateRangeV22=clearLeadDateRangeV22;window.setLeadRangeV22=setLeadRangeV22;
  window.toggleAllLeads=toggleAllLeadsV22;
  window.updateLeadSelectionCountV22=updateLeadSelectionCountV22;
  window.bulkReassignSelectedLeadsV22=bulkReassignSelectedLeadsV22;
  window.confirmBulkLeadReassignV22=confirmBulkLeadReassignV22;
  window.deleteSelectedLeadsV22=deleteSelectedLeadsV22;
  leadList=leadListV22;window.leadList=leadListV22;pages['lead-list']=leadListV22;
  renderLeadRows=renderLeadRowsV22;window.renderLeadRows=renderLeadRowsV22;

  // Clickable per-company chart series toggles below the All Company Comparison chart.
  window.__apexHiddenCompanySeriesV22=window.__apexHiddenCompanySeriesV22||new Set();
  function companyChartV22(){
    const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(6-i));return d.toISOString().slice(0,10)});
    const companies=db.companies||[],hidden=window.__apexHiddenCompanySeriesV22;
    const rows=companies.map((c,i)=>({id:c.id,company:c.name,color:companyChartColors(i),visible:!hidden.has(c.id),days:days.map(day=>{const os=(db.orders||[]).filter(o=>o.companyId===c.id&&String(o.date||o.createdAt||'').slice(0,10)===day);return {count:os.length,sales:os.reduce((sum,o)=>sum+Number(o.price||0),0)}})}));
    const visible=rows.filter(r=>r.visible),max=Math.max(1,...visible.flatMap(r=>r.days.map(d=>d.count))),w=980,h=340,padL=48,padR=20,padT=26,padB=48,iw=w-padL-padR,ih=h-padT-padB,xStep=iw/Math.max(days.length-1,1),y=v=>padT+ih-(v/max)*ih;
    const grid=[0,1,2,3,4].map(i=>{const val=Math.round(max-(i*max/4)),yy=y(val);return `<line x1="${padL}" y1="${yy}" x2="${w-padR}" y2="${yy}" class="chart-axis"/><text x="8" y="${yy+4}" class="chart-axis-label">${val}</text>`}).join('');
    const xlabels=days.map((d,i)=>`<text x="${padL+i*xStep}" y="${h-14}" text-anchor="middle" class="chart-label">${d.slice(5)}</text>`).join('');
    function smooth(points){if(points.length<2)return '';let d=`M ${points[0][0]} ${points[0][1]}`;for(let i=0;i<points.length-1;i++){const p0=points[i-1]||points[i],p1=points[i],p2=points[i+1],p3=points[i+2]||p2;const c1x=p1[0]+(p2[0]-p0[0])/6,c1y=p1[1]+(p2[1]-p0[1])/6,c2x=p2[0]-(p3[0]-p1[0])/6,c2y=p2[1]-(p3[1]-p1[1])/6;d+=` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`}return d}
    const series=visible.map(r=>{const pts=r.days.map((v,i)=>[padL+i*xStep,y(v.count)]);const dots=r.days.map((v,i)=>`<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="4" fill="#fff" stroke="${r.color}" stroke-width="2.5"><title>${esc(r.company)} • ${days[i]} • ${v.count} orders • ${money(v.sales)}</title></circle>`).join('');return `<path d="${smooth(pts)}" fill="none" stroke="${r.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dots}`}).join('');
    const toggles=rows.map(r=>`<button type="button" class="company-series-toggle ${r.visible?'active':'inactive'}" aria-pressed="${r.visible?'true':'false'}" onclick="toggleDashboardCompanySeriesV22('${esc(r.id)}')" style="--series-color:${r.color}"><i></i><span>${esc(r.company)}</span><b>${r.visible?'Shown':'Hidden'}</b></button>`).join('');
    return `<div class="chart-wrap"><svg viewBox="0 0 ${w} ${h}" aria-label="7-day company order comparison chart">${grid}${series}${xlabels}</svg></div><div class="company-series-toggle-wrap"><div class="panel-sub">Choose which companies to show on the chart</div><div class="company-series-toggles">${toggles||'<span class="note">No companies available</span>'}</div></div><div class="weekly-note"><span>Vertical axis: Orders</span><span>Horizontal axis: Day</span></div>`;
  }
  function toggleDashboardCompanySeriesV22(id){
    const hidden=window.__apexHiddenCompanySeriesV22;
    if(hidden.has(id))hidden.delete(id);else hidden.add(id);
    const host=document.querySelector('.chart-card .chart');if(host)host.innerHTML=companyChartV22();
  }
  chart=companyChartV22;window.chart=companyChartV22;window.toggleDashboardCompanySeriesV22=toggleDashboardCompanySeriesV22;
})();


/* ===== v24: payment receipt (image / PDF) on stock requests ===== */
(function(){
  const MAX_PDF=1.5*1024*1024;
  const fileToDataUrl=f=>new Promise((res,rej)=>{const fr=new FileReader();fr.onerror=()=>rej(new Error('Could not read the file'));fr.onload=()=>res(fr.result);fr.readAsDataURL(f)});
  function compressImage(f,max=1600,q=0.82){
    return new Promise((res,rej)=>{const url=URL.createObjectURL(f),im=new Image();
      im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('This image could not be read'))};
      im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);cx.drawImage(im,0,0,cv.width,cv.height);URL.revokeObjectURL(url);res(cv.toDataURL('image/jpeg',q))};
      im.src=url});
  }
  function checkReceiptFile(f){
    const isImg=/^image\//.test(f.type),isPdf=f.type==='application/pdf'||/\.pdf$/i.test(f.name);
    if(!isImg&&!isPdf) throw new Error('Receipt must be an image or a PDF');
    if(isPdf&&f.size>MAX_PDF) throw new Error('PDF is too large (max 1.5 MB). Attach an image or a smaller PDF');
    if(isImg&&f.size>15*1024*1024) throw new Error('Image is too large (max 15 MB)');
    return isPdf?'pdf':'image';
  }
  async function readReceipt(f){
    const kind=checkReceiptFile(f);
    const data=kind==='pdf'?await fileToDataUrl(f):await compressImage(f);
    return {name:f.name,type:kind==='pdf'?'application/pdf':'image/jpeg',data,size:Math.round(data.length*0.75),at:new Date().toISOString()};
  }
  window.pickStockReceipt=function(input){
    const box=$('#reqReceiptPreview');if(!box)return;const f=input.files?.[0];
    if(!f){box.innerHTML='<span class="note">Attach the bank slip / transfer screenshot. Required to send the request.</span>';return}
    try{checkReceiptFile(f)}catch(e){input.value='';box.innerHTML='<span class="note" style="color:#c62f2f">'+esc(e.message)+'</span>';return toast(e.message)}
    if(/^image\//.test(f.type)){const u=URL.createObjectURL(f);box.innerHTML=`<img class="receipt-thumb" src="${u}" alt="Receipt preview"><span class="note">${esc(f.name)}</span>`}
    else box.innerHTML=`<span class="receipt-pdf">PDF</span><span class="note">${esc(f.name)} • ${(f.size/1024).toFixed(0)} KB</span>`;
  };
  window.receiptCell=function(r){
    return r&&r.receipt?`<button class="btn btn-outline receipt-btn" onclick="viewStockReceipt('${esc(r.id)}')">${r.receipt.type==='application/pdf'?'📄 View PDF':'🧾 View'}</button>`:'<span class="note">No receipt</span>';
  };
  window.viewStockReceipt=async function(id){
    const r=(db.stockRequests||[]).find(x=>x.id===id);if(!r||!r.receipt)return toast('No receipt attached');
    const role=db.session?.role;if(role!=='Owner'&&r.companyId!==currentCompanyId())return toast('Not allowed');
    const rc=r.receipt,isPdf=rc.type==='application/pdf';
    let blobUrl=rc.data;try{const b=await (await fetch(rc.data)).blob();blobUrl=URL.createObjectURL(b)}catch(e){}
    $('#receiptModal')?.remove();
    const m=document.createElement('div');m.className='modal-mask';m.id='receiptModal';m.style.display='flex';
    m.innerHTML=`<div class="modal receipt-modal"><div class="modal-head"><div><div class="eyebrow">PAYMENT RECEIPT</div><div class="panel-title">${esc(r.id)} • ${esc(r.companyName)}</div><div class="note">${money(r.payment)} • ${esc(r.paymentRef||'No reference')} • ${esc(rc.name||'')}</div></div><button class="close" onclick="closeReceiptModal()">×</button></div>
      <div class="receipt-view">${isPdf?`<iframe src="${blobUrl}" title="Receipt PDF"></iframe>`:`<img src="${rc.data}" alt="Payment receipt">`}</div>
      <div class="actions" style="margin-top:12px"><a class="btn btn-outline" href="${blobUrl}" target="_blank" rel="noopener">Open in new tab</a><a class="btn btn-outline" href="${rc.data}" download="${esc((r.id||'receipt')+(isPdf?'.pdf':'.jpg'))}">Download</a><button class="btn btn-primary" onclick="closeReceiptModal()">Close</button></div></div>`;
    m.addEventListener('mousedown',e=>{if(e.target===m)closeReceiptModal()});
    document.body.appendChild(m);window.__receiptBlobUrl=blobUrl;
  };
  window.closeReceiptModal=function(){$('#receiptModal')?.remove();if(window.__receiptBlobUrl&&window.__receiptBlobUrl.startsWith('blob:'))URL.revokeObjectURL(window.__receiptBlobUrl);window.__receiptBlobUrl=null};
  const _send=sendStockRequest;
  let sending=false;
  sendStockRequest=async function(){
    if(db.session?.role==='Owner') return _send();
    if(sending) return;
    const f=$('#reqReceipt')?.files?.[0];
    if(!f) return toast('Attach the payment receipt (image or PDF) before sending the request');
    sending=true;
    try{
      let receipt;try{receipt=await readReceipt(f)}catch(e){return toast(e.message||'Could not read the receipt')}
      const before=db.stockRequests[0]?.id,count=db.stockRequests.length;
      _send();                                   // validates product/qty/payment, creates + saves the request
      const req=db.stockRequests[0];
      if(!req||db.stockRequests.length===count||req.id===before) return;   // validation failed, nothing created
      req.receipt=receipt;
      try{save()}catch(e){
        delete req.receipt;db.stockRequests=db.stockRequests.filter(x=>x.id!==req.id);try{save()}catch(_){}
        toast('Browser storage is full — attach a smaller receipt or ask the Owner to clear old stock requests');
        render();return;
      }
      toast('Stock request sent to Owner with receipt');render();
    }finally{sending=false}
  };
  window.sendStockRequest=sendStockRequest;
})();


/* ===== v25: bulk approve for the Owner ===== */
window.ownerReqApproveSelected=function(){
  if(db.session?.role!=='Owner') return toast('Owner only');
  const ids=ownerReqIds(); if(!ids.length) return toast('Select requests first');
  let ok=0,skipped=0; window.__bulkApprove=true;
  try{ids.forEach(id=>{const r=db.stockRequests.find(x=>x.id===id);if(r&&r.status==='Pending'&&approveStockRequest(id)===true)ok++;else skipped++;})}finally{window.__bulkApprove=false}
  toast(`${ok} request(s) approved${skipped?`, ${skipped} skipped (not pending or payment short)`:''}`); render();
};


/* ===== v26: order note, lead note popup, save order note ===== */
window.saveOrderNote=function(leadNo){
  const v=($('#oNote')?.value||'').trim();
  if(!leadNo){toast('Note will be saved together with the order');return}
  const l=db.leads.find(x=>x.no===leadNo);if(!l)return toast('Lead not found');
  l.note=v;l.updatedAt=new Date().toISOString();save();toast(v?'Note saved to the lead':'Note cleared');
};
window.leadNoteBtn=function(l){
  const n=String(l.note||'').trim();
  const short=n.length>22?n.slice(0,22)+'…':n;
  return `<button type="button" class="note-btn ${n?'has':''}" onclick="openLeadNote('${esc(l.no)}')" title="${esc(n||'Add note')}">${n?'📝 '+esc(short):'＋ Add note'}</button>`;
};
window.openLeadNote=function(no){
  const l=db.leads.find(x=>x.no===no);if(!l)return;
  $('#leadNoteModal')?.remove();
  const m=document.createElement('div');m.className='modal-mask';m.id='leadNoteModal';m.style.display='flex';
  m.innerHTML=`<div class="modal lead-note-modal"><div class="modal-head"><div><div class="eyebrow">LEAD NOTE</div><div class="panel-title">${esc(l.no)} • ${esc(l.name||'')}</div></div><button class="close" onclick="closeLeadNote()">×</button></div><textarea id="leadNoteText" rows="6" placeholder="Write a note...">${esc(l.note||'')}</textarea><div class="actions" style="margin-top:12px"><button class="btn btn-primary" onclick="saveLeadNotePopup('${esc(l.no)}')">Save</button><button class="btn btn-outline" onclick="closeLeadNote()">Close</button></div></div>`;
  m.addEventListener('mousedown',e=>{if(e.target===m)closeLeadNote()});
  document.body.appendChild(m);$('#leadNoteText').focus();
};
window.closeLeadNote=function(){$('#leadNoteModal')?.remove()};
window.saveLeadNotePopup=function(no){
  const l=db.leads.find(x=>x.no===no);if(!l)return;
  l.note=($('#leadNoteText').value||'').trim();l.updatedAt=new Date().toISOString();save();closeLeadNote();toast('Note saved');
  if((location.hash.slice(1)||'')==='lead-list'&&typeof renderLeadRows==='function')renderLeadRows();
};


/* ===== v27: Add Return by waybill / tracking numbers, Returned List with dates, staff edit/delete, admin name ===== */
(function(){
  const key=v=>String(v||'').trim().toUpperCase();
  const role=()=>db.session?.role;
  const nowTime=()=>new Date().toLocaleTimeString('en-LK',{hour:'2-digit',minute:'2-digit'});
  function findOrders(token){
    const t=key(token),cid=currentCompanyId(),mine=o=>role()==='Owner'||o.companyId===cid;
    let hit=db.orders.filter(o=>o.waybill&&(key(o.waybill)===t||key(o.waybill)==='WB-'+t));
    if(!hit.length){const o=db.orders.find(x=>key(x.id)===t);if(o)hit=[o]}
    if(!hit.length){const s=db.shipped.find(x=>key(x.id)===t);if(s)hit=shipmentOrders(s)}
    return hit.filter(mine);
  }
  function returnOne(o){
    o.status='Returned';o.returnedAt=new Date().toISOString();
    (o.items||[]).forEach(r=>addCompanyStock(o.companyId,r.productId,Number(r.qty)||0));
    const s=db.shipped.find(x=>(x.orderIds||[]).includes(o.id));
    const record={orderId:o.id,tracking:o.waybill||(s&&s.id)||'',waybill:o.waybill||'',shipmentId:s?s.id:'',customer:o.customer||'',product:o.productSummary,date:today(),time:nowTime(),returnedAt:o.returnedAt,price:o.price,qty:o.qty,companyId:o.companyId,by:currentUser()?.name||''};
    db.returned.unshift(record);
    return record;
  }
  const recentReturnsThisSessionV33=[];
  function renderInlineReturnHistoryV32(){
    const body=$('#returnInlineRowsV32');if(!body)return;
    const card=$('#recentReturnCardV33');
    const rows=recentReturnsThisSessionV33.filter(r=>role()==='Owner'||r.companyId===currentCompanyId()).slice(0,50);
    if(card)card.style.display=rows.length?'':'none';
    body.innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.tracking||r.waybill||'')}</b></td><td>${esc(r.product||'')}</td><td>${money(r.price)}</td><td>${Number(r.qty||0)}</td><td>${esc(r.date||'')}</td></tr>`).join('');
    const summary=$('#returnInlineSummaryV32');if(summary)summary.textContent=`Showing ${rows.length} recent return(s) from this session.`;
  }
  window.addReturn=function(){
    layout(`<div class="card section-card" style="max-width:100%"><div class="panel-title">Add Return</div><p class="note">Type one waybill / tracking number and press Enter. The order is marked Returned and the returned stock is restored automatically.</p>
      <div class="toolbar"><div class="field grow"><label>Waybill / Tracking No</label><input id="returnWaybill" type="text" autocomplete="off" placeholder="WB-5001" onkeydown="if(event.key==='Enter'){event.preventDefault();processReturn()}"></div><button class="btn btn-primary" type="button" onclick="processReturn()">Add Return</button><button class="btn btn-outline" type="button" onclick="navTo('returned-list')">View Returned List</button></div>
      <div id="returnResult" style="margin-top:14px"></div></div>
      <div class="card table-card" id="recentReturnCardV33" style="display:none;margin-top:16px"><div class="panel-head" style="padding:16px 18px 8px"><div><div class="panel-title">Recently Added Returns</div><div class="panel-sub" id="returnInlineSummaryV32">Your latest return records appear here.</div></div></div><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Waybill Number</th><th>Product</th><th>Price</th><th>Qty</th><th>Return Date</th></tr></thead><tbody id="returnInlineRowsV32"></tbody></table></div></div>`);
    renderInlineReturnHistoryV32();
    setTimeout(()=>$('#returnWaybill')?.focus(),50);
  };
  window.processReturn=function(){
    const tokens=[...new Set(String($('#returnWaybill').value||'').split(/[\s,;]+/).map(x=>x.trim()).filter(Boolean))];
    if(!tokens.length)return toast('Enter at least one waybill / tracking number');
    const ok=[],bad=[];
    tokens.forEach(tok=>{
      const orders=findOrders(tok);
      if(!orders.length)return bad.push([tok,'Waybill not found']);
      let did=0;
      orders.forEach(o=>{
        if(o.status==='Returned'){if(orders.length===1)bad.push([tok,'Already returned']);return}
        if(o.status!=='Shipped'){if(orders.length===1)bad.push([tok,'Not shipped yet ('+o.status+')']);return}
        const returnRecord=returnOne(o);recentReturnsThisSessionV33.unshift(returnRecord);did++;ok.push([tok,o]);
      });
      if(!did&&orders.length>1)bad.push([tok,'No shipped orders to return']);
    });
    if(ok.length)save();
    $('#returnResult').innerHTML=
      (ok.length?`<div class="return-ok"><b>✓ ${ok.length===1?'Return Added Successfully':ok.length+' Returns Added Successfully'}</b>${ok.map(([t,o])=>`<div class="return-row ok"><span>${esc(o.waybill||t)}</span><span>${esc(o.id)} • ${esc(o.customer||'')}</span><span>Status: Returned • Stock restored (+${o.qty})</span></div>`).join('')}</div>`:'')+
      (bad.length?`<div class="return-bad"><b>✕ Not returned</b>${bad.map(([t,m])=>`<div class="return-row bad"><span>${esc(t)}</span><span>${esc(m)}</span></div>`).join('')}</div>`:'');
    if(ok.length){toast(ok.length===1?'Return Added Successfully':ok.length+' Returns Added Successfully');$('#returnWaybill').value=bad.map(b=>b[0]).join(' ');renderInlineReturnHistoryV32();$('#returnWaybill')?.focus()}
    else toast('No return added');
  };
  const rs={start:null,end:null,q:''};
  window.returnedList=function(){
    const owner=role()==='Owner';
    rs.start=rs.end=today();
    layout(`<div class="card ret-filter-card"><div class="toolbar lead-toolbar"><div class="field grow"><label>Search</label><input id="retSearch" oninput="renderReturnRows()" placeholder="Order ID, tracking, customer, product..."></div><div class="field"><label>Start Date</label><input id="retStart" type="date" value="${rs.start}" onchange="renderReturnRows()"></div><div class="field"><label>End Date</label><input id="retEnd" type="date" value="${rs.end}" onchange="renderReturnRows()"></div><div class="lead-quick-ranges"><button class="btn btn-outline" onclick="setReturnRange(0)">Today</button><button class="btn btn-outline" onclick="setReturnRange(7)">Last 7 days</button><button class="btn btn-outline" onclick="setReturnRange(30)">Last 30 days</button><button class="btn btn-outline" onclick="setReturnRange(-1)">All dates</button></div></div><div class="note" id="retSummary" style="margin-top:6px"></div></div>
    <div class="card table-card"><div class="table-wrap"><table class="table" id="retTable"><thead><tr><th>#</th><th>Order ID</th><th>Waybill / Tracking No</th><th>Customer</th><th>Product Name</th>${owner?'<th>Company</th>':''}<th>Returned Date &amp; Time</th><th>Price</th><th>Qty</th><th>Status</th></tr></thead><tbody id="retBody"></tbody></table></div></div>`);
    renderReturnRows();
  };
  window.setReturnRange=function(days){
    const iso=d=>d.toISOString().slice(0,10);
    if(days<0){const all=db.returned.map(r=>r.date).filter(Boolean).sort();$('#retStart').value=all[0]||today();$('#retEnd').value=today()}
    else{const s=new Date();s.setDate(s.getDate()-days);$('#retStart').value=days?iso(s):today();$('#retEnd').value=today()}
    renderReturnRows();
  };
  window.renderReturnRows=function(){
    const body=$('#retBody');if(!body)return;
    const owner=role()==='Owner',cid=currentCompanyId();
    let sd=$('#retStart').value,ed=$('#retEnd').value;if(sd&&ed&&sd>ed)[sd,ed]=[ed,sd];
    const q=($('#retSearch').value||'').toLowerCase().trim();
    const all=db.returned.filter(r=>owner||r.companyId===cid);
    const rows=all.filter(r=>(!sd||String(r.date)>=sd)&&(!ed||String(r.date)<=ed)&&(!q||[r.orderId,r.tracking,r.waybill,r.customer,r.product].join(' ').toLowerCase().includes(q)));
    body.innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.orderId)}</b></td><td>${esc(r.tracking||r.waybill||'')}</td><td>${esc(r.customer||'—')}</td><td>${esc(r.product||'')}</td>${owner?`<td>${esc(db.companies.find(c=>c.id===r.companyId)?.name||'')}</td>`:''}<td>${esc(r.date)}${r.time?` • ${esc(r.time)}`:''}</td><td>${money(r.price)}</td><td>${r.qty}</td><td>${badge('Returned')}</td></tr>`).join('')||`<tr><td colspan="${owner?10:9}" class="empty">No returns in this date range.</td></tr>`;
    $('#retSummary').textContent=`${rows.length} return(s) shown${all.length>rows.length?` of ${all.length} total — change the dates or choose All dates to see older returns`:''}`;
  };
  pages['add-return']=window.addReturn;pages['returned-list']=window.returnedList;

  /* ---- staff: edit / delete, admin can rename himself ---- */
  const renameEverywhere=(oldName,newName,id)=>{
    if(!oldName||oldName===newName)return;
    ['leads','orders','shipped','returned'].forEach(k=>(db[k]||[]).forEach(x=>{
      ['staff','user','createdBy','by'].forEach(f=>{if(x[f]===oldName)x[f]=newName});
    }));
  };
  const isSelfAdmin=s=>role()==='Admin'&&s&&s.type==='Admin'&&s.id===currentUser()?.id;
  const _edit=editStaff;
  window.editStaff=function(id){
    const s=db.staff.find(x=>x.id===id);
    if(!isSelfAdmin(s))return _edit(id);
    layout(`<div class="card section-card" style="max-width:760px"><div class="panel-title">Edit My Name</div><p class="note">You can change your own name and phone. Your username and password can only be changed by the Owner.</p><div class="form-grid"><div class="field"><label>Name</label><input id="esName" value="${esc(s.name)}"></div><div class="field"><label>User Type</label><input value="${esc(s.type)}" disabled></div><div class="field"><label>Email / Username</label><input value="${esc(s.email)}" disabled></div><div class="field"><label>Phone</label><input id="esPhone" value="${esc(s.phone||'')}"></div></div><div class="actions" style="margin-top:15px"><button class="btn btn-primary" onclick="saveStaffEdit('${s.id}')">Save Changes</button><button class="btn btn-outline" onclick="navTo('staff-list')">Cancel</button></div></div>`);
  };
  const _save=saveStaffEdit;
  window.saveStaffEdit=function(id){
    const s=db.staff.find(x=>x.id===id);
    if(isSelfAdmin(s)){
      const name=$('#esName').value.trim();if(!name)return toast('Name is required');
      const old=s.name;s.name=name;s.phone=$('#esPhone').value.trim();renameEverywhere(old,name,id);
      save();toast('Staff login updated');return staffList();
    }
    const s0=s&&s.name;const r=_save(id);
    if(s&&s.name!==s0)renameEverywhere(s0,s.name,id),save();
    return r;
  };
  window.deleteStaff=function(id){
    const r=role(),s=db.staff.find(x=>x.id===id);if(!s)return;
    if(!['Owner','Admin'].includes(r))return toast('No access');
    if(s.type==='Admin')return toast('Admin logins are managed by the Owner (edit or delete the company)');
    if(r==='Admin'&&s.companyId!==currentCompanyId())return toast('Not allowed');
    if(s.id===currentUser()?.id)return toast('You cannot delete your own login');
    if(!confirm(`Delete ${s.name}? Their leads will move to the company Admin. Past orders stay in the system.`))return;
    const admin=db.staff.find(x=>x.companyId===s.companyId&&x.type==='Admin');
    (db.leads||[]).forEach(l=>{if(l.assignedStaffId===s.id||(!l.assignedStaffId&&l.staff===s.name)){if(admin){l.assignedStaffId=admin.id;l.staff=admin.name}}});
    db.staff=db.staff.filter(x=>x.id!==id);save();toast('Staff login deleted');staffList();
  };
  window.staffList=function(){
    if(!['Owner','Admin'].includes(role()))return toast('No access');
    const owner=role()==='Owner',a=owner?db.staff:db.staff.filter(s=>s.companyId===currentCompanyId());
    layout(`<div class="toolbar"><button class="btn btn-primary" onclick="navTo('new-staff')">+ New Staff</button></div><div class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Staff ID</th><th>Name</th><th>User Type</th><th>Company</th><th>Email / Username</th><th>Action</th></tr></thead><tbody>${a.map((s,i)=>{
      let act;
      if(s.type!=='Admin')act=`<div class="actions" style="gap:6px;flex-wrap:nowrap"><button class="btn btn-outline" onclick="editStaff('${s.id}')">Edit Login</button><button class="btn btn-outline danger" onclick="deleteStaff('${s.id}')">Delete</button></div>`;
      else if(owner)act=`<button class="btn btn-outline" onclick="editStaff('${s.id}')">Edit Login</button>`;
      else if(isSelfAdmin(s))act=`<button class="btn btn-outline" onclick="editStaff('${s.id}')">Edit My Name</button>`;
      else act='<span class="note">Owner controls</span>';
      return `<tr><td>${i+1}</td><td>${s.id}</td><td><b>${esc(s.name)}</b></td><td>${badge(s.type)}</td><td>${esc(s.company)}</td><td>${esc(s.email)}</td><td>${act}</td></tr>`}).join('')}</tbody></table></div></div>`);
  };
  pages['staff-list']=window.staffList;
})();

/* ===== v28 global price/rate controls, reliable lead import and announcements ===== */
(function installV28Updates(){
  // Migrate the commission setting to a single Owner-controlled global value.
  db.companyCommissionRates = db.companyCommissionRates || {};
  const existingGlobalRate = Number(db.globalCompanyCommissionRate);
  const firstCompanyRate = Number(db.companyCommissionRates?.[db.companies?.[0]?.id]);
  const globalRate = Number.isFinite(existingGlobalRate) && existingGlobalRate >= 0
    ? existingGlobalRate
    : (Number.isFinite(firstCompanyRate) && firstCompanyRate >= 0 ? firstCompanyRate : 6);
  db.globalCompanyCommissionRate = globalRate;
  (db.companies || []).forEach(c => { db.companyCommissionRates[c.id] = globalRate; });
  db.announcement = db.announcement || {enabled:false,title:'',tickerText:'',imageData:'',timerEnabled:false,timerTarget:'',updatedAt:''};
  save();

  // Compact owner-side commission control: the selected value now applies globally.
  const oldCommissionPageV28 = pages.commission;
  function decorateOwnerCommissionRateCardV28(){
    if(db.session?.role !== 'Owner') return;
    const sel = $('#cv4OwnerRateCompany');
    const rate = $('#cv4OwnerRateValue');
    if(sel) sel.style.display = 'none';
    if(rate) rate.value = String(Number(db.globalCompanyCommissionRate ?? 6));
    const sub = document.querySelector('.cv4-owner-rate-card .panel-sub');
    if(sub) sub.textContent = 'This single rate applies to every company. A saved change updates all company commission calculations.';
  }
  pages.commission = function(){ oldCommissionPageV28(); decorateOwnerCommissionRateCardV28(); };
  routeTitles.commission = 'Commission';
  window.saveOwnerCompanyRateV4 = function(){
    if(db.session?.role !== 'Owner') return toast('Owner only');
    const rate = Number($('#cv4OwnerRateValue')?.value);
    if(!Number.isFinite(rate) || rate < 0) return toast('Enter a valid commission rate');
    db.globalCompanyCommissionRate = rate;
    db.companyCommissionRates = db.companyCommissionRates || {};
    (db.companies || []).forEach(c => { db.companyCommissionRates[c.id] = rate; });
    save();
    toast(`Commission rate updated to ${rate}% for all companies`);
    pages.commission();
  };

  // Owner can update the shared stock-unit price directly from Stock List.
  const originalStockListV28 = pages['stock-list'];
  pages['stock-list'] = function(){
    originalStockListV28();
    if(db.session?.role !== 'Owner') return;
    const toolbar = $('#content .toolbar');
    if(!toolbar) return;
    const card = document.createElement('div');
    card.className = 'card section-card global-stock-unit-control';
    card.style.margin = '0 0 14px';
    card.innerHTML = `<div class="panel-head"><div><div class="panel-title">Global Stock Unit Price</div><div class="panel-sub">One price for every company stock request and purchase.</div></div><span class="badge ok">Live shared value</span></div><div class="toolbar" style="margin:0;align-items:end"><div class="field" style="min-width:180px;max-width:260px"><label>Stock Unit Price (Rs.)</label><input id="globalStockUnitPriceV28" type="number" min="0.01" step="0.01" value="${Number(currentStockUnitCost()).toFixed(2)}"></div><button class="btn btn-primary" onclick="saveGlobalStockUnitPriceV28()">Save for All Companies</button></div>`;
    toolbar.insertAdjacentElement('afterend', card);
  };
  window.saveGlobalStockUnitPriceV28 = function(){
    if(db.session?.role !== 'Owner') return toast('Owner only');
    const value = Number($('#globalStockUnitPriceV28')?.value);
    if(!Number.isFinite(value) || value <= 0) return toast('Enter a valid stock unit price');
    db.stockUnitCost = value;
    (db.products || []).forEach(p => { p.cost = value; });
    (db.stockRequests || []).forEach(r => {
      if(r.status === 'Pending') { r.unitCost = value; r.total = Number(r.qty || 0) * value; }
    });
    save();
    toast(`Stock unit price updated to ${money(value)} for all companies`);
    pages['stock-list']();
  };
  window.refreshGlobalPriceIndicators = function(){
    const unit = Number(db.stockUnitCost || 45), qty = Number($('#reqQty')?.value || 0), total = qty * unit;
    if($('#reqUnit')) $('#reqUnit').value = money(unit);
    if($('#reqTotal')) $('#reqTotal').value = money(total);
    if($('#reqSummaryTotal')) $('#reqSummaryTotal').textContent = money(total);
    if($('#reqSummaryQty')) $('#reqSummaryQty').textContent = String(qty);
    if($('#reqSummaryPay')) $('#reqSummaryPay').textContent = money(Number($('#reqPay')?.value || 0));
    const card = document.querySelector('.global-stock-unit-control #globalStockUnitPriceV28');
    if(card && document.activeElement !== card) card.value = unit.toFixed(2);
  };

  // CSV / XLS / XLSX import with direct, persistent insertion into the Lead List.
  window.importLead = importLeadV28;
  importLead = importLeadV28;
  pages['import-lead'] = importLeadV28;
  routeTitles['import-lead'] = 'Import Lead';
  window.readLeadImportFile = readLeadImportFileV28;
  readLeadImportFile = readLeadImportFileV28;
  function importLeadV28(){
    if(!['Owner','Admin'].includes(db.session?.role)) return toast('Only Owner or Company Admin can import leads');
    const ownerMode = db.session.role === 'Owner';
    const companyOptions = (db.companies || []).filter(c=>c.active!==false).map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    layout(`<div class="page-intro"><div><div class="eyebrow">LEAD MANAGEMENT</div><h2>Import Leads</h2><p>Read CSV, XLS or XLSX and save every valid row directly into the Lead List table.</p></div><div class="mini-stat"><b>CSV / XLS / XLSX</b><span>Supported formats</span></div></div>
      <div class="card section-card"><div class="panel-head"><div><div class="panel-title">Upload Lead File</div><div class="panel-sub">Only six source columns are needed. Lead No, date, status, staff and note are filled in by OMS.</div></div><span id="leadCountBadge" class="badge pending">0 leads</span></div>
      ${ownerMode?`<div class="field" style="max-width:440px;margin-bottom:12px"><label>Company to receive imported leads</label><select id="leadImportCompanyV28"><option value="">Select company</option>${companyOptions}</select></div>`:`<div class="callout" style="margin-bottom:12px"><b>Target Company</b><div>${esc(currentUser()?.company||'Your company')}</div><div class="note">Imported leads will be saved to this company's Lead List.</div></div>`}
      <div class="toolbar"><div class="field grow"><label>Lead file</label><input id="leadFile" type="file" accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"></div><button class="btn btn-primary" onclick="readLeadImportFile()">Read File</button></div>
      <div class="callout"><b>Required columns</b><div class="note">Customer Name • Address • Contact No • Contact No 2 • Other • Product Code</div><div class="note" style="margin-top:4px">Lead No, Lead Date, Staff, View, Status and Note are automatically generated / managed by OMS.</div></div><div id="leadPreview" style="margin-top:15px"></div></div>`);
  }
  function normalizeImportRowsV28(input){
    if(!Array.isArray(input)) return [];
    const rows = input.filter(row => Array.isArray(row) && row.some(v=>String(v??'').trim()!==''));
    if(!rows.length) return [];
    const hasHeader = row => {
      const h=row.map(normalizeHeader);
      return h.some(x=>['customer name','customer','name'].includes(x)) &&
        h.some(x=>x==='address'||x.endsWith(' address')) &&
        h.some(x=>/^(contact no|contact no 1|contact no 2|contact number|contact number 2|phone|phone number|phone number 2|tel|telephone)$/.test(x));
    };
    let idx=rows.findIndex((r,i)=>i<10&&hasHeader(r));
    if(idx<0) idx=0;
    return rows.slice(idx);
  }
  async function readLeadImportFileV28(){
    if(!['Owner','Admin'].includes(db.session?.role)) return toast('Only Owner or Company Admin can import leads');
    const file=$('#leadFile')?.files?.[0]; if(!file) return toast('Choose a CSV, XLS or XLSX file');
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(!['csv','xls','xlsx'].includes(ext)) return toast('Supported files: CSV, XLS, XLSX');
    try{
      let raw;
      if(ext==='csv') raw=parseCsv(await file.text());
      else{
        if(location.protocol==='file:') return toast('For XLS/XLSX import, start OMS with start_server.bat or start_server.sh');
        const fd=new FormData(); fd.append('file',file);
        const response=await fetch('/api/parse-excel',{method:'POST',body:fd});
        const payload=await response.json().catch(()=>null);
        if(!response.ok) throw new Error(payload?.error||`Excel parser unavailable (${response.status})`);
        if(!Array.isArray(payload)) throw new Error(payload?.error||'Excel file could not be parsed');
        raw=payload;
      }
      const rows=normalizeImportRowsV28(raw);
      pendingLeadRows=mapLeadRows(rows);
      if(!pendingLeadRows.length) return toast('No lead rows found. Check the six column headers and the file data.');
      $('#leadCountBadge').textContent=`${pendingLeadRows.length} leads ready`;
      $('#leadPreview').innerHTML=`<div class="mini-stat"><b>${pendingLeadRows.length}</b><span>Rows read successfully. Use Import to Lead List to save them now.</span></div><div class="table-wrap" style="margin-top:10px"><table class="table"><thead><tr><th>#</th><th>Customer</th><th>Address</th><th>Contact No</th><th>Contact No 2</th><th>Product Code</th></tr></thead><tbody>${pendingLeadRows.slice(0,8).map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${esc(r.address)}</td><td>${esc(r.tel)}</td><td>${esc(r.tel2)}</td><td>${esc(r.product)}</td></tr>`).join('')}${pendingLeadRows.length>8?`<tr><td colspan="6" class="note">+ ${pendingLeadRows.length-8} more leads</td></tr>`:''}</tbody></table></div><div class="actions" style="margin-top:14px"><button class="btn btn-primary" onclick="confirmDirectLeadImportV28()">Import to Lead List</button><button class="btn btn-outline" onclick="openLeadAssignmentModal()">Assign &amp; Import Instead</button></div>`;
    }catch(err){console.error(err);toast(err?.message||'Could not read the lead file');}
  }
  window.confirmDirectLeadImportV28 = function(){
    if(!['Owner','Admin'].includes(db.session?.role)) return toast('Only Owner or Company Admin can import leads');
    if(!pendingLeadRows.length) return toast('Read a lead file first');
    const companyId=db.session.role==='Owner'?($('#leadImportCompanyV28')?.value||''):currentCompanyId();
    if(!companyId) return toast('Select a company to receive the leads');
    const company=db.companies.find(c=>c.id===companyId&&c.active!==false);
    if(!company) return toast('Select a valid active company');
    if(db.session.role!=='Owner'&&companyId!==currentCompanyId()) return toast('You can only import into your own company');
    const used=new Set((db.leads||[]).map(l=>String(l.no))), prefix=`L-${Date.now()}`; let seq=0;
    const nextNo=()=>{let n;do{n=`${prefix}-${String(++seq).padStart(4,'0')}`}while(used.has(n));used.add(n);return n};
    const now=new Date().toISOString(), day=today();
    const inserted=pendingLeadRows.map(r=>({no:nextNo(),date:day,importedAt:now,name:r.name||'',address:r.address||'',city:'',tel:r.tel||'',tel2:r.tel2||'',other:r.other||'',product:r.product||'',staff:'Unassigned',assignedStaffId:'',status:'Pending',note:'',companyId,source:'CSV/XLS import',updatedAt:now}));
    db.leads=Array.isArray(db.leads)?db.leads:[];
    db.leads.unshift(...inserted);
    save();
    pendingLeadRows=[];
    if($('#leadCountBadge')) $('#leadCountBadge').textContent='0 leads';
    if($('#leadPreview')) $('#leadPreview').innerHTML=`<div class="callout"><b>✓ ${inserted.length} leads saved successfully.</b><div class="note">Company: ${esc(company.name)}. They have been added to the Lead List as Pending / Unassigned.</div></div>`;
    document.querySelectorAll('.modal-mask').forEach(m=>m.remove());
    toast(`${inserted.length} leads imported to Lead List`);
    location.hash='lead-list';
    render();
  };

  // V29 Owner announcement studio: multiple saved banners, media, text styling, crop controls and timer themes.
  const ANNOUNCEMENT_FONT_OPTIONS_V30 = [
    ['Inter', 'Inter, Arial, sans-serif'], ['Arial', 'Arial, Helvetica, sans-serif'],
    ['Trebuchet MS', 'Trebuchet MS, Arial, sans-serif'], ['Verdana', 'Verdana, sans-serif'],
    ['Georgia', 'Georgia, serif'], ['Tahoma', 'Tahoma, Arial, sans-serif'],
    ['Segoe UI', '"Segoe UI", Arial, sans-serif'], ['Roboto', 'Roboto, Arial, sans-serif'],
    ['Open Sans', '"Open Sans", Arial, sans-serif'], ['Lato', 'Lato, Arial, sans-serif'],
    ['Montserrat', 'Montserrat, Arial, sans-serif'], ['Poppins', 'Poppins, Arial, sans-serif'],
    ['Nunito', 'Nunito, Arial, sans-serif'], ['Raleway', 'Raleway, Arial, sans-serif'],
    ['Playfair Display', '"Playfair Display", Georgia, serif'], ['Merriweather', 'Merriweather, Georgia, serif'],
    ['Oswald', 'Oswald, Impact, sans-serif'], ['Impact', 'Impact, Haettenschweiler, sans-serif'],
    ['Courier New', '"Courier New", monospace'], ['Times New Roman', '"Times New Roman", Times, serif']
  ];
  const ANNOUNCEMENT_FONTS_V29 = ANNOUNCEMENT_FONT_OPTIONS_V30.map(x => x[1]);
  const ANNOUNCEMENT_TIMER_THEMES_V29 = ['glass', 'pill', 'square', 'circle', 'minimal', 'neon', 'gradient', 'outline', 'flip', 'compact'];
  const ANNOUNCEMENT_TIMER_ANIMATIONS_V30 = ['none','pulse','bounce','float','shake','flip','glow','heartbeat','slide','zoom'];
  const announcementClampV29 = (value, min, max, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };
  const announcementColorV29 = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback;
  const announcementFontV29 = value => ANNOUNCEMENT_FONTS_V29.includes(value) ? value : ANNOUNCEMENT_FONTS_V29[0];
  function normalizeAnnouncementV29(source = {}) {
    const a = source && typeof source === 'object' ? source : {};
    const mediaUrl = a.mediaUrl || '';
    const imageData = a.imageData || '';
    return {
      id: a.id || '',
      enabled: !!a.enabled,
      companyIds: Array.isArray(a.companyIds) ? a.companyIds.map(String) : [],
      showAllCompanies: Object.prototype.hasOwnProperty.call(a, 'showAllCompanies') ? !!a.showAllCompanies : !(Array.isArray(a.companyIds) && a.companyIds.length),
      bannerHeight: announcementClampV29(a.bannerHeight, 70, 360, 104),
      bannerWidth: announcementClampV29(a.bannerWidth, 50, 100, 100),
      titleX: announcementClampV29(a.titleX, 0, 100, 3), titleY: announcementClampV29(a.titleY, 0, 100, 32), titleScale: announcementClampV29(a.titleScale, 50, 200, 100),
      tickerX: announcementClampV29(a.tickerX, 0, 100, 3), tickerY: announcementClampV29(a.tickerY, 0, 100, 76), tickerScale: announcementClampV29(a.tickerScale, 50, 200, 100),
      timerX: announcementClampV29(a.timerX, 0, 100, 88), timerY: announcementClampV29(a.timerY, 0, 100, 50), timerScale: announcementClampV29(a.timerScale, 50, 200, 100),
      title: String(a.title || ''),
      tickerText: String(a.tickerText || ''),
      titleFont: announcementFontV29(a.titleFont),
      titleSize: announcementClampV29(a.titleSize, 12, 40, 18),
      titleColor: announcementColorV29(a.titleColor, '#ffffff'),
      titleBold: a.titleBold !== false,
      tickerFont: announcementFontV29(a.tickerFont),
      tickerSize: announcementClampV29(a.tickerSize, 9, 28, 13),
      tickerColor: announcementColorV29(a.tickerColor, '#f7e5ad'),
      tickerBold: a.tickerBold !== false,
      mediaUrl,
      mediaType: a.mediaType === 'video' || (!mediaUrl && imageData.startsWith('data:video/')) ? 'video' : 'image',
      imageData: mediaUrl ? '' : imageData,
      imageScale: announcementClampV29(a.imageScale, 50, 200, 100),
      imageX: announcementClampV29(a.imageX, 0, 100, 50),
      imageY: announcementClampV29(a.imageY, 0, 100, 50),
      contentX: announcementClampV29(a.contentX, -30, 30, 0),
      contentY: announcementClampV29(a.contentY, -30, 30, 0),
      timerEnabled: !!a.timerEnabled,
      timerTarget: String(a.timerTarget || ''),
      timerLabel: String(a.timerLabel || 'COUNTDOWN'),
      timerTheme: ANNOUNCEMENT_TIMER_THEMES_V29.includes(a.timerTheme) ? a.timerTheme : 'glass',
      timerFont: announcementFontV29(a.timerFont),
      timerAnimation: ANNOUNCEMENT_TIMER_ANIMATIONS_V30.includes(a.timerAnimation) ? a.timerAnimation : 'none',
      timerTimeOnly: !!a.timerTimeOnly,
      updatedAt: a.updatedAt || ''
    };
  }
  function ensureAnnouncementSchemaV29() {
    let changed = false;
    if (!db.companyCommissionRates) { db.companyCommissionRates = {}; changed = true; }
    let rate = Number(db.globalCompanyCommissionRate);
    if (!Number.isFinite(rate) || rate < 0) {
      const first = Number(db.companyCommissionRates?.[db.companies?.[0]?.id]);
      rate = Number.isFinite(first) && first >= 0 ? first : 6;
      db.globalCompanyCommissionRate = rate;
      changed = true;
    }
    (db.companies || []).forEach(c => {
      if (Number(db.companyCommissionRates[c.id]) !== rate) { db.companyCommissionRates[c.id] = rate; changed = true; }
    });
    if (!Array.isArray(db.announcements)) {
      const old = db.announcement;
      const oldHasContent = old && (old.enabled || old.title || old.tickerText || old.imageData || old.mediaUrl || old.timerEnabled);
      db.announcements = oldHasContent ? [normalizeAnnouncementV29({ ...old, id: old.id || 'ANN-LEGACY' })] : [];
      if (Object.prototype.hasOwnProperty.call(db, 'announcement')) delete db.announcement;
      changed = true;
    } else {
      const fixed = db.announcements.map(a => normalizeAnnouncementV29(a));
      if (JSON.stringify(fixed) !== JSON.stringify(db.announcements)) { db.announcements = fixed; changed = true; }
      if (Object.prototype.hasOwnProperty.call(db, 'announcement')) { delete db.announcement; changed = true; }
    }
    if (changed) save();
  }
  ensureAnnouncementSchemaV29();
  routeTitles.announcement = 'Announcement';
  pages.announcement = announcementPageV29;
  const originalPermittedAnnouncementV29 = permitted;
  permitted = function(route) {
    if (route === 'announcement') return db.session?.role === 'Owner';
    return originalPermittedAnnouncementV29(route);
  };

  function announcementPageV29(editId = '') {
    if (db.session?.role !== 'Owner') return toast('Owner only');
    ensureAnnouncementSchemaV29();
    const banners = db.announcements || [];
    const selected = editId ? banners.find(a => a.id === editId) : null;
    const a = normalizeAnnouncementV29(selected || {});
    window.__announcementEditingIdV29 = selected?.id || '';
    window.__announcementLayoutDraftV29 = selected ? {x:announcementClampV29(selected.contentX,-30,30,0),y:announcementClampV29(selected.contentY,-30,30,0)} : {x:0,y:0};
    window.__announcementMediaDraftV29 = undefined;
    const fontOptions = selectedFont => ANNOUNCEMENT_FONT_OPTIONS_V30.map(([label,f]) => `<option value="${esc(f)}" ${f === selectedFont ? 'selected' : ''}>${esc(label)}</option>`).join('');
    const timerOptions = selectedTheme => [
      ['glass','Glass'], ['pill','Pill'], ['square','Square'], ['circle','Circle'], ['minimal','Minimal'], ['neon','Neon'], ['gradient','Gradient'], ['outline','Outline'], ['flip','Flip Card'], ['compact','Compact']
    ].map(([v,label]) => `<option value="${v}" ${v === selectedTheme ? 'selected' : ''}>${label}</option>`).join('');
    const timerAnimationOptions = selected => [['none','None'],['pulse','Pulse'],['bounce','Bounce'],['float','Float'],['shake','Shake'],['flip','Flip'],['glow','Glow'],['heartbeat','Heartbeat'],['slide','Slide'],['zoom','Zoom']].map(([v,label]) => `<option value="${v}" ${v===selected?'selected':''}>${label}</option>`).join('');
    const recent = banners.slice().sort((x,y) => String(y.updatedAt || '').localeCompare(String(x.updatedAt || '')));
    layout(`<div class="page-intro"><div><div class="eyebrow">OWNER CONTROL</div><h2>Announcement</h2><p>Design and rotate shared banners across all company screens.</p></div><div class="actions"><button class="btn btn-primary" onclick="newAnnouncementV29()">+ New Banner</button><button class="btn btn-outline" onclick="navTo('dashboard')">Back to Dashboard</button></div></div>
      <div class="card section-card announcement-editor-v29"><div class="panel-head"><div><div class="panel-title">${selected ? 'Edit Saved Banner' : 'Create New Banner'}</div><div class="panel-sub">Every enabled banner stays in the list below. Enabled banners rotate automatically, one per minute.</div></div><span class="badge ${selected?.enabled ? 'ok' : 'pending'}">${selected ? (selected.enabled ? 'Enabled' : 'Disabled') : 'Draft'}</span></div>
      <div class="announcement-admin-preview"><div class="panel-sub" style="padding:10px 12px">Live Preview</div><div id="announcementAdminPreviewV29"></div></div>
      <div id="announcementFormV29" class="form-grid">
        <div class="field span-2"><label>Banner Headline</label><input id="announcementTitleV29" maxlength="160" value="${esc(a.title)}" placeholder="Special Event • New Update • Limited Offer"></div>
        <div class="field"><label>Headline Font</label><select id="announcementTitleFontV29">${fontOptions(a.titleFont)}</select></div>
        <div class="field"><label>Headline Size (px)</label><input id="announcementTitleSizeV29" type="number" min="12" max="40" value="${a.titleSize}"></div>
        <div class="field"><label>Headline Color</label><input id="announcementTitleColorV29" type="color" value="${a.titleColor}"></div>
        <div class="field announcement-check-field"><label><input id="announcementTitleBoldV29" type="checkbox" ${a.titleBold ? 'checked' : ''}> Headline Bold</label></div>
        <div class="field span-2"><label>Animated Scrolling Text</label><textarea id="announcementTickerV29" rows="2" maxlength="1000" placeholder="Write the message that should scroll smoothly...">${esc(a.tickerText)}</textarea></div>
        <div class="field"><label>Scrolling Text Font</label><select id="announcementTickerFontV29">${fontOptions(a.tickerFont)}</select></div>
        <div class="field"><label>Scrolling Text Size (px)</label><input id="announcementTickerSizeV29" type="number" min="9" max="28" value="${a.tickerSize}"></div>
        <div class="field"><label>Scrolling Text Color</label><input id="announcementTickerColorV29" type="color" value="${a.tickerColor}"></div>
        <div class="field announcement-check-field"><label><input id="announcementTickerBoldV29" type="checkbox" ${a.tickerBold ? 'checked' : ''}> Scrolling Text Bold</label></div>
        <div class="field span-2"><label>Poster / Banner Image</label><input id="announcementImageUploadV29" type="file" accept="image/*"><div class="announcement-form-help">Recommended: wide landscape image around 1600 × 450 px. Keep important wording near the centre. Adjust scale and position below.</div></div>
        <div class="field span-2"><label>Video Clip (optional)</label><input id="announcementVideoUploadV29" type="file" accept="video/mp4,video/webm,video/ogg"><div class="announcement-form-help">MP4 or WebM, under 25 MB. The video will autoplay muted and loop continuously. Uploading a new image or video replaces the current media for this banner.</div></div>
        <div class="field span-2"><div id="announcementMediaStatusV29" class="announcement-media-status-v29">${(a.mediaUrl || a.imageData) ? `Current media: ${a.mediaType === 'video' ? 'Video clip' : 'Image'}` : 'No image or video selected yet.'}</div><div id="announcementMediaPreviewWrapV29"></div><div class="actions" style="margin-top:8px"><button type="button" class="btn btn-outline" onclick="clearAnnouncementMediaV29()">Remove Media</button></div></div>
        <div class="field"><label>Image / Video Scale</label><input id="announcementImageScaleV29" type="range" min="50" max="200" step="5" value="${a.imageScale}"><span id="announcementImageScaleValueV29" class="announcement-range-value-v29">${a.imageScale}%</span></div>
        <div class="field"><label>Horizontal Position</label><input id="announcementImageXV29" type="range" min="0" max="100" step="1" value="${a.imageX}"><span id="announcementImageXValueV29" class="announcement-range-value-v29">${a.imageX}%</span></div>
        <div class="field"><label>Vertical Position</label><input id="announcementImageYV29" type="range" min="0" max="100" step="1" value="${a.imageY}"><span id="announcementImageYValueV29" class="announcement-range-value-v29">${a.imageY}%</span></div>
        <div class="field announcement-check-field"><label><input id="announcementTimerEnabledV29" type="checkbox" ${a.timerEnabled ? 'checked' : ''}> Show Countdown Timer</label></div>
        <div class="field"><label>Countdown Text</label><input id="announcementTimerLabelV29" maxlength="80" value="${esc(a.timerLabel)}" placeholder="Countdown / Offer ends in"></div>
        <div class="field"><label>Timer Target Date &amp; Time</label><input id="announcementTimerTargetV29" type="datetime-local" value="${esc(a.timerTarget)}"><div class="announcement-form-help">Uses each user's device local time.</div></div>
        <div class="field"><label>Countdown Theme / Shape</label><select id="announcementTimerThemeV29">${timerOptions(a.timerTheme)}</select></div>
        <div class="field"><label>Countdown Font</label><select id="announcementTimerFontV30">${fontOptions(a.timerFont)}</select></div>
        <div class="field"><label>Countdown Animation</label><select id="announcementTimerAnimationV30">${timerAnimationOptions(a.timerAnimation)}</select></div>
        <div class="field announcement-check-field"><label><input id="announcementTimerTimeOnlyV29" type="checkbox" ${a.timerTimeOnly ? 'checked' : ''}> Show time only (HH:MM:SS)</label></div>
        <div class="field"><label>Banner Width (%)</label><input id="announcementBannerWidthV30" type="range" min="50" max="100" step="1" value="${a.bannerWidth}"><span id="announcementBannerWidthValueV30" class="announcement-range-value-v30">${a.bannerWidth}%</span></div>
        <div class="field"><label>Banner Height (px)</label><input id="announcementBannerHeightV30" type="range" min="70" max="360" step="2" value="${a.bannerHeight}"><span id="announcementBannerHeightValueV30" class="announcement-range-value-v29">${a.bannerHeight}px</span></div>
        <div class="field span-2 announcement-layout-controls-v30"><div class="panel-title">Manual Banner Layout</div><div class="announcement-layout-grid-v30">
          <div class="announcement-layout-item-v30"><b>Headline</b><label>Horizontal Position</label><input id="announcementTitleXV30" type="range" min="0" max="100" value="${a.titleX}"><label>Vertical Position</label><input id="announcementTitleYV30" type="range" min="0" max="100" value="${a.titleY}"><label>Scale / Size</label><input id="announcementTitleScaleV30" type="range" min="50" max="200" step="5" value="${a.titleScale}"></div>
          <div class="announcement-layout-item-v30"><b>Scrolling Text</b><label>Horizontal Position</label><input id="announcementTickerXV30" type="range" min="0" max="100" value="${a.tickerX}"><label>Vertical Position</label><input id="announcementTickerYV30" type="range" min="0" max="100" value="${a.tickerY}"><label>Scale / Size</label><input id="announcementTickerScaleV30" type="range" min="50" max="200" step="5" value="${a.tickerScale}"></div>
          <div class="announcement-layout-item-v30"><b>Countdown Timer</b><label>Horizontal Position</label><input id="announcementTimerXV30" type="range" min="0" max="100" value="${a.timerX}"><label>Vertical Position</label><input id="announcementTimerYV30" type="range" min="0" max="100" value="${a.timerY}"><label>Scale / Size</label><input id="announcementTimerScaleV30" type="range" min="50" max="200" step="5" value="${a.timerScale}"></div>
        </div><div class="announcement-form-help">You can use these controls or drag each headline, scrolling-text and timer item directly in the live preview. Resize handles are available on each item in the preview.</div></div>
        <div class="field span-2"><div class="panel-title">Company Visibility</div><div class="announcement-check-field" style="margin:8px 0"><label><input id="announcementAllCompaniesV30" type="checkbox" ${a.showAllCompanies ? 'checked' : ''}> Show this banner to ALL companies</label></div><div id="announcementCompaniesV29" class="announcement-company-checks-v30">${db.companies.map(c=>`<label><input type="checkbox" data-ann-company-v30 value="${esc(c.id)}" ${!a.showAllCompanies && a.companyIds.includes(String(c.id))?'checked':''} ${a.showAllCompanies?'disabled':''}> ${esc(c.name)}</label>`).join('') || '<span class="note">Create a company first.</span>'}</div><div class="announcement-form-help">Tick “ALL companies” to show it to every company. Untick it and tick only the companies that should see this banner.</div></div>
        <div class="field announcement-check-field span-2"><label><input id="announcementEnabledV29" type="checkbox" ${a.enabled ? 'checked' : ''}> Enable this banner</label><div class="announcement-form-help">Enabled banners rotate automatically, one per minute.</div></div>
      </div>
      <div class="actions" style="margin-top:16px"><button class="btn btn-primary" onclick="saveAnnouncementBannerV29()">Save Banner</button>${selected ? `<button class="btn btn-outline" onclick="newAnnouncementV29()">New Banner</button>` : ''}</div>
      </div>
      <div class="card section-card announcement-archive-v29"><div class="panel-head"><div><div class="panel-title">Saved Banners</div><div class="panel-sub">Previously created banners remain here. Enable or disable each one at any time.</div></div><span class="badge">${banners.length} saved</span></div><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Headline</th><th>Media</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${recent.map((b,i)=>`<tr><td>${i+1}</td><td><b>${esc(b.title || 'Untitled Banner')}</b><br><small>${esc((b.tickerText || '').slice(0,80))}</small></td><td>${(b.mediaUrl || b.imageData) ? esc(b.mediaType === 'video' ? 'Video' : 'Image') : 'Text only'}</td><td><span class="badge ${b.enabled ? 'ok' : 'pending'}">${b.enabled ? 'Enabled' : 'Disabled'}</span></td><td>${esc(b.updatedAt ? new Date(b.updatedAt).toLocaleString() : '—')}</td><td><div class="actions announcement-row-actions-v29"><button class="btn btn-outline" onclick="editAnnouncementV29('${esc(b.id)}')">Edit</button><button class="btn btn-outline" onclick="toggleAnnouncementV29('${esc(b.id)}')">${b.enabled ? 'Turn Off' : 'Turn On'}</button><button class="btn btn-danger" onclick="deleteAnnouncementV29('${esc(b.id)}')">Delete</button></div></td></tr>`).join('') || '<tr><td colspan="6" class="empty">No saved banners yet. Create your first banner above.</td></tr>'}</tbody></table></div></div>`);
    wireAnnouncementEditorV29(a);
    renderAnnouncementPreviewAdminV29();
  }
  function newAnnouncementV29() { window.__announcementEditingIdV29 = ''; window.__announcementLayoutDraftV29={x:0,y:0}; window.__announcementMediaDraftV29 = undefined; announcementPageV29(); }
  function editAnnouncementV29(id) { announcementPageV29(id); }
  function wireAnnouncementEditorV29(a) {
    const image = $('#announcementImageUploadV29'), video = $('#announcementVideoUploadV29');
    image?.addEventListener('change', () => uploadAnnouncementMediaV29(image, 'image'));
    video?.addEventListener('change', () => uploadAnnouncementMediaV29(video, 'video'));
    const form = $('#announcementFormV29');
    const allCompanies = $('#announcementAllCompaniesV30');
    const syncCompanySelection = () => { const all=!!allCompanies?.checked; $$('#announcementCompaniesV29 [data-ann-company-v30]').forEach(x=>{x.disabled=all;if(all)x.checked=false;}); };
    allCompanies?.addEventListener('change', syncCompanySelection);
    syncCompanySelection();
    form?.addEventListener('input', e => {
      if (e.target?.type === 'range') updateAnnouncementRangeLabelsV29();
      renderAnnouncementPreviewAdminV29();
    });
    form?.addEventListener('change', e => {
      if (e.target?.type === 'range') updateAnnouncementRangeLabelsV29();
      renderAnnouncementPreviewAdminV29();
    });
    renderAnnouncementMediaPreviewV29(a);
    wireAnnouncementDragDropV29();
    updateAnnouncementRangeLabelsV29();
  }
  function wireAnnouncementDragDropV29(){
    const host=$('#announcementAdminPreviewV29');
    const fieldMap={title:['announcementTitleXV30','announcementTitleYV30','announcementTitleScaleV30'],ticker:['announcementTickerXV30','announcementTickerYV30','announcementTickerScaleV30'],timer:['announcementTimerXV30','announcementTimerYV30','announcementTimerScaleV30']};
    host?.querySelectorAll('[data-layout-part]').forEach(item=>{
      if(item.dataset.dragReady)return;item.dataset.dragReady='1';item.title='Drag to move. Drag a corner or edge handle to resize.';
      const part=item.dataset.layoutPart,ids=fieldMap[part];if(!ids)return;
      item.addEventListener('pointerdown',e=>{
        const handle=e.target.closest('[data-layout-resize]');const rect=host.getBoundingClientRect();
        const xInput=$('#'+ids[0]),yInput=$('#'+ids[1]),scaleInput=$('#'+ids[2]);
        const baseX=Number(xInput?.value||0),baseY=Number(yInput?.value||0),baseScale=Number(scaleInput?.value||100);
        item.setPointerCapture?.(e.pointerId);e.preventDefault();e.stopPropagation();
        const startX=e.clientX,startY=e.clientY;
        const apply=(x,y,scale)=>{if(xInput)xInput.value=String(Math.round(announcementClampV29(x,0,100,baseX)));if(yInput)yInput.value=String(Math.round(announcementClampV29(y,0,100,baseY)));if(scaleInput)scaleInput.value=String(Math.round(announcementClampV29(scale,50,200,baseScale)/5)*5);item.style.left=(xInput?.value||baseX)+'%';item.style.top=(yInput?.value||baseY)+'%';const sc=Number(scaleInput?.value||baseScale)/100;item.style.transform=(part==='timer'?'translate(-50%,-50%)':'translate(0,-50%)')+` scale(${sc})`;};
        const move=ev=>{const dx=ev.clientX-startX,dy=ev.clientY-startY;if(handle){const delta=(dx+dy)*.30;apply(baseX,baseY,baseScale+delta)}else apply(baseX+dx/Math.max(1,rect.width)*100,baseY+dy/Math.max(1,rect.height)*100,baseScale);};
        const up=()=>{item.removeEventListener('pointermove',move);item.removeEventListener('pointerup',up);item.removeEventListener('pointercancel',up);renderAnnouncementPreviewAdminV29();updateAnnouncementRangeLabelsV29();};
        item.addEventListener('pointermove',move);item.addEventListener('pointerup',up);item.addEventListener('pointercancel',up);
      });
    });
    const stage=$('#announcementMediaPreviewWrapV29 .announcement-media-preview-stage-v29');const media=stage?.querySelector('img,video');
    stage?.querySelectorAll('[data-resize-handle]').forEach(handle=>{if(handle.dataset.ready)return;handle.dataset.ready='1';handle.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();const startX=e.clientX,startY=e.clientY,base=Number($('#announcementImageScaleV29')?.value||100);handle.setPointerCapture?.(e.pointerId);const move=ev=>{const dx=ev.clientX-startX,dy=ev.clientY-startY;const h=handle.dataset.resizeHandle||'';const delta=h==='n'?-dy:h==='s'?dy:h==='e'?dx:h==='w'?-dx:((h.includes('e')?dx:-dx)+(h.includes('s')?dy:-dy))/2;const scale=announcementClampV29(base+delta*.35,50,200,100);if($('#announcementImageScaleV29'))$('#announcementImageScaleV29').value=scale;updateAnnouncementRangeLabelsV29();};const up=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',up);handle.removeEventListener('pointercancel',up);renderAnnouncementPreviewAdminV29();wireAnnouncementDragDropV29();};handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',up);handle.addEventListener('pointercancel',up);});});
    if(stage&&media&&!stage.dataset.dragReady){stage.dataset.dragReady='1';stage.title='Drag image/video to adjust crop position';let start=null;stage.addEventListener('pointerdown',e=>{if(e.target.closest('[data-resize-handle]'))return;start={x:e.clientX,y:e.clientY,px:Number($('#announcementImageXV29')?.value||50),py:Number($('#announcementImageYV29')?.value||50)};stage.setPointerCapture?.(e.pointerId);e.preventDefault()});stage.addEventListener('pointermove',e=>{if(!start)return;const r=stage.getBoundingClientRect();const x=announcementClampV29(start.px-(e.clientX-start.x)/Math.max(1,r.width)*100,0,100,50),y=announcementClampV29(start.py-(e.clientY-start.y)/Math.max(1,r.height)*100,0,100,50);if($('#announcementImageXV29'))$('#announcementImageXV29').value=x;if($('#announcementImageYV29'))$('#announcementImageYV29').value=y;updateAnnouncementRangeLabelsV29();media.style.objectPosition=`${x}% ${y}%`;});const end=()=>{start=null;renderAnnouncementPreviewAdminV29();wireAnnouncementDragDropV29()};stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);}
  }
  function currentAnnouncementMediaV29(a = {}) {
    const draft = window.__announcementMediaDraftV29;
    if (draft !== undefined) return { url: draft?.url || '', type: draft?.type || 'image', imageData: '' };
    return { url: a.mediaUrl || '', type: a.mediaType || 'image', imageData: a.imageData || '' };
  }
  async function uploadAnnouncementMediaV29(input, requestedType) {
    const file = input?.files?.[0]; if (!file) return;
    const isVideo = file.type.startsWith('video/') || requestedType === 'video';
    const allowed = isVideo ? ['video/mp4','video/webm','video/ogg'] : ['image/jpeg','image/png','image/webp','image/gif','image/avif'];
    if (file.type && !allowed.includes(file.type)) { input.value = ''; return toast(isVideo ? 'Choose an MP4, WebM or OGG video' : 'Choose a JPG, PNG, WebP or GIF image'); }
    if (file.size > (location.protocol === 'file:' && (file.type.startsWith('video/') || requestedType === 'video') ? 2 * 1024 * 1024 : 25 * 1024 * 1024)) { input.value = ''; return toast(location.protocol === 'file:' && (file.type.startsWith('video/') || requestedType === 'video') ? 'When opening without the server, choose a video under 2 MB so it can be saved locally.' : 'Media must be smaller than 25 MB'); }
    if (isVideo) { const objectUrl=URL.createObjectURL(file); try { const duration=await new Promise((resolve,reject)=>{const v=document.createElement('video');v.preload='metadata';v.onloadedmetadata=()=>resolve(v.duration);v.onerror=()=>reject(new Error('Could not read video duration'));v.src=objectUrl;}); if(!Number.isFinite(duration)||duration>30.05){input.value='';URL.revokeObjectURL(objectUrl);return toast('Choose a video clip that is 30 seconds or shorter');} } catch(e) { input.value='';URL.revokeObjectURL(objectUrl);return toast(e.message||'Could not validate video clip'); } URL.revokeObjectURL(objectUrl); }
    const status = $('#announcementMediaStatusV29'); if (status) status.textContent = 'Uploading media…';
    try {
      if (location.protocol === 'file:') {
        const source = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
        if (isVideo) { window.__announcementMediaDraftV29 = {url:source,type:'video'}; }
        else { const image = await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=source;}); const scale = Math.min(1, 2400/image.width, 1600/image.height); const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height); window.__announcementMediaDraftV29 = {url:canvas.toDataURL('image/jpeg',0.94),type:'image'}; }
      } else {
        const fd = new FormData(); fd.append('file', file, file.name);
        const response = await fetch('/api/announcement-media', { method:'POST', body:fd });
        const result = await response.json().catch(()=>({error:'Could not read upload response'}));
        if (!response.ok || !result.url) throw new Error(result.error || 'Media upload failed');
        window.__announcementMediaDraftV29 = {url:result.url,type:isVideo?'video':'image'};
      }
      renderAnnouncementMediaPreviewV29({}); renderAnnouncementPreviewAdminV29();
      if (status) status.textContent = `${isVideo ? 'Video clip' : 'Image'} uploaded. Save Banner to publish it.`;
      toast(`${isVideo ? 'Video' : 'Image'} uploaded`);
    } catch (error) {
      if (status) status.textContent = 'Media upload failed. Please try a smaller file or start the OMS server.';
      toast(error?.message || 'Media upload failed');
    }
  }
  function clearAnnouncementMediaV29() {
    window.__announcementMediaDraftV29 = {url:'',type:'image'};
    const image = $('#announcementImageUploadV29'), video = $('#announcementVideoUploadV29'); if(image)image.value=''; if(video)video.value='';
    const status = $('#announcementMediaStatusV29'); if(status)status.textContent='Media removed from this banner draft.';
    renderAnnouncementMediaPreviewV29({}); renderAnnouncementPreviewAdminV29();
  }
  function renderAnnouncementMediaPreviewV29(a = {}) {
    const wrap = $('#announcementMediaPreviewWrapV29'); if(!wrap)return;
    const media = currentAnnouncementMediaV29(a);
    if (!media.url && !media.imageData) { wrap.innerHTML = '<div class="announcement-media-empty-v29">No image or video. A clean gradient background will be used.</div>'; return; }
    const scale = announcementClampV29($('#announcementImageScaleV29')?.value ?? a.imageScale,50,200,100)/100;
    const x = announcementClampV29($('#announcementImageXV29')?.value ?? a.imageX,0,100,50);
    const y = announcementClampV29($('#announcementImageYV29')?.value ?? a.imageY,0,100,50);
    const src = media.url || media.imageData;
    const mediaStyle=`object-position:${x}% ${y}%;transform:scale(${scale});transform-origin:center center`;
    wrap.innerHTML = `<div class="announcement-media-preview-stage-v29">${media.type==='video' ? `<video src="${esc(src)}" autoplay muted loop playsinline style="${mediaStyle}"></video>` : `<img src="${esc(src)}" alt="Banner media preview" style="${mediaStyle}">`}<span>Drag image/video to crop • drag any corner/edge handle to resize</span>${['nw','n','ne','e','se','s','sw','w'].map(h=>`<i class=\"announcement-resize-handle-v29 handle-${h}\" data-resize-handle=\"${h}\"></i>`).join('')}</div>`;
  }
  function updateAnnouncementRangeLabelsV29() {
    const scale = $('#announcementImageScaleV29')?.value, x=$('#announcementImageXV29')?.value, y=$('#announcementImageYV29')?.value;
    if($('#announcementImageScaleValueV29')&&scale!==undefined)$('#announcementImageScaleValueV29').textContent=`${scale}%`;
    if($('#announcementImageXValueV29')&&x!==undefined)$('#announcementImageXValueV29').textContent=`${x}%`;
    if($('#announcementImageYValueV29')&&y!==undefined)$('#announcementImageYValueV29').textContent=`${y}%`;
    const h=$('#announcementBannerHeightV30')?.value;if($('#announcementBannerHeightValueV30')&&h!==undefined)$('#announcementBannerHeightValueV30').textContent=`${h}px`;const bw=$('#announcementBannerWidthV30')?.value;if($('#announcementBannerWidthValueV30')&&bw!==undefined)$('#announcementBannerWidthValueV30').textContent=`${bw}%`;
    const st = $('#announcementMediaPreviewWrapV29');
    if(st && window.__announcementMediaDraftV29 !== undefined) renderAnnouncementMediaPreviewV29({});
    else if(st) renderAnnouncementMediaPreviewV29((db.announcements||[]).find(b=>b.id===window.__announcementEditingIdV29)||{});
  }
  function collectAnnouncementFormV29(old = {}) {
    const media = currentAnnouncementMediaV29(old);
    return normalizeAnnouncementV29({
      ...old,
      id: old.id || window.__announcementEditingIdV29 || '',
      enabled: !!$('#announcementEnabledV29')?.checked,
      showAllCompanies: !!$('#announcementAllCompaniesV30')?.checked,
      companyIds: $('#announcementAllCompaniesV30')?.checked ? [] : Array.from($$('#announcementCompaniesV29 [data-ann-company-v30]:checked')).map(x=>x.value),
      bannerHeight: announcementClampV29($('#announcementBannerHeightV30')?.value,70,360,104),
      bannerWidth: announcementClampV29($('#announcementBannerWidthV30')?.value,50,100,100),
      titleX: announcementClampV29($('#announcementTitleXV30')?.value,0,100,3), titleY: announcementClampV29($('#announcementTitleYV30')?.value,0,100,32), titleScale: announcementClampV29($('#announcementTitleScaleV30')?.value,50,200,100),
      tickerX: announcementClampV29($('#announcementTickerXV30')?.value,0,100,3), tickerY: announcementClampV29($('#announcementTickerYV30')?.value,0,100,76), tickerScale: announcementClampV29($('#announcementTickerScaleV30')?.value,50,200,100),
      timerX: announcementClampV29($('#announcementTimerXV30')?.value,0,100,88), timerY: announcementClampV29($('#announcementTimerYV30')?.value,0,100,50), timerScale: announcementClampV29($('#announcementTimerScaleV30')?.value,50,200,100),
      title: $('#announcementTitleV29')?.value?.trim() || '',
      tickerText: $('#announcementTickerV29')?.value?.trim() || '',
      titleFont: $('#announcementTitleFontV29')?.value || old.titleFont,
      titleSize: announcementClampV29($('#announcementTitleSizeV29')?.value,12,40,18),
      titleColor: $('#announcementTitleColorV29')?.value || old.titleColor,
      titleBold: !!$('#announcementTitleBoldV29')?.checked,
      tickerFont: $('#announcementTickerFontV29')?.value || old.tickerFont,
      tickerSize: announcementClampV29($('#announcementTickerSizeV29')?.value,9,28,13),
      tickerColor: $('#announcementTickerColorV29')?.value || old.tickerColor,
      tickerBold: !!$('#announcementTickerBoldV29')?.checked,
      mediaUrl: media.url,
      mediaType: media.type,
      imageData: media.imageData,
      imageScale: announcementClampV29($('#announcementImageScaleV29')?.value,50,200,100),
      imageX: announcementClampV29($('#announcementImageXV29')?.value,0,100,50),
      imageY: announcementClampV29($('#announcementImageYV29')?.value,0,100,50),
      contentX: announcementClampV29(window.__announcementLayoutDraftV29?.x ?? old.contentX, -30, 30, 0),
      contentY: announcementClampV29(window.__announcementLayoutDraftV29?.y ?? old.contentY, -30, 30, 0),
      timerEnabled: !!$('#announcementTimerEnabledV29')?.checked,
      timerTarget: $('#announcementTimerTargetV29')?.value || '',
      timerLabel: $('#announcementTimerLabelV29')?.value?.trim() || 'COUNTDOWN',
      timerTheme: $('#announcementTimerThemeV29')?.value || 'glass',
      timerFont: $('#announcementTimerFontV30')?.value || old.timerFont,
      timerAnimation: $('#announcementTimerAnimationV30')?.value || old.timerAnimation,
      timerTimeOnly: !!$('#announcementTimerTimeOnlyV29')?.checked,
      updatedAt: old.updatedAt || ''
    });
  }
  window.saveAnnouncementBannerV29 = function() {
    if (db.session?.role !== 'Owner') return toast('Owner only');
    const id = window.__announcementEditingIdV29 || `ANN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
    const old = (db.announcements || []).find(b=>b.id===id) || {};
    const b = collectAnnouncementFormV29(old);
    b.id = id; b.updatedAt = new Date().toISOString();
    if (b.enabled && !b.title && !b.tickerText && !b.mediaUrl && !b.imageData) return toast('Add a headline, scrolling text or image/video before enabling this banner');
    if (!b.showAllCompanies && !b.companyIds.length) return toast('Tick ALL companies or select at least one company');
    if (b.timerEnabled && !b.timerTarget) return toast('Select a countdown target date and time');
    db.announcements = db.announcements || [];
    const index = db.announcements.findIndex(x=>x.id===id);
    if(index>=0) db.announcements[index]=b; else db.announcements.unshift(b);
    window.__announcementEditingIdV29 = id;
    window.__announcementLayoutDraftV29 = {x:b.contentX||0,y:b.contentY||0};
    window.__announcementMediaDraftV29 = undefined;
    save();
    renderAnnouncementStripV29(true);
    announcementPageV29(id);
    toast(b.enabled ? 'Banner saved and enabled' : 'Banner saved and disabled');
  };
  window.newAnnouncementV29 = newAnnouncementV29;
  window.editAnnouncementV29 = editAnnouncementV29;
  window.toggleAnnouncementV29 = function(id) {
    if(db.session?.role!=='Owner')return toast('Owner only');
    const b=(db.announcements||[]).find(x=>x.id===id); if(!b)return;
    b.enabled=!b.enabled; b.updatedAt=new Date().toISOString(); save(); renderAnnouncementStripV29(true); announcementPageV29(window.__announcementEditingIdV29||''); toast(b.enabled?'Banner enabled':'Banner disabled');
  };
  window.deleteAnnouncementV29 = function(id) {
    if(db.session?.role!=='Owner')return toast('Owner only');
    const b=(db.announcements||[]).find(x=>x.id===id);if(!b)return;
    if(!confirm(`Delete saved banner "${b.title||'Untitled Banner'}"?`))return;
    db.announcements=db.announcements.filter(x=>x.id!==id);if(window.__announcementEditingIdV29===id)window.__announcementEditingIdV29='';save();renderAnnouncementStripV29(true);announcementPageV29(window.__announcementEditingIdV29||'');toast('Banner deleted');
  };

  function announcementBannerHtmlV29(a, preview=false) {
    const media = a.mediaUrl || a.imageData || '';
    const scale = announcementClampV29(a.imageScale,50,200,100)/100;
    const x = announcementClampV29(a.imageX,0,100,50), y = announcementClampV29(a.imageY,0,100,50);
    const background = media ? '#e9eef4' : 'linear-gradient(110deg,#091d37 0%,#16466d 58%,#6b5423 100%)';
    const mediaStyle=`object-position:${x}% ${y}%;transform:scale(${scale});transform-origin:center center`;
    const mediaEl = media ? (a.mediaType === 'video'
      ? `<video class="announcement-media-v29" src="${esc(media)}" autoplay muted loop playsinline style="${mediaStyle}"></video>`
      : `<img class="announcement-media-v29" src="${esc(media)}" alt="" style="${mediaStyle}">`) : '';
    const titleFont = announcementFontV29(a.titleFont), tickerFont = announcementFontV29(a.tickerFont);
    const titleSize = announcementClampV29(a.titleSize,12,40,18), tickerSize = announcementClampV29(a.tickerSize,9,28,13);
    const titleColor = announcementColorV29(a.titleColor,'#ffffff'), tickerColor = announcementColorV29(a.tickerColor,'#f7e5ad');
    const ticker = a.tickerText || '';
    const titleScale=announcementClampV29(a.titleScale,50,200,100)/100,tickerScale=announcementClampV29(a.tickerScale,50,200,100)/100,timerScale=announcementClampV29(a.timerScale,50,200,100)/100;
    const handles = part => preview ? ['nw','n','ne','e','se','s','sw','w'].map(h=>`<i class="announcement-layout-handle-v30 handle-${h}" data-layout-resize="${part}" aria-hidden="true"></i>`).join('') : '';
    const title = a.title ? `<strong class="announcement-title-v29 announcement-layout-part-v30" data-layout-part="title" style="left:${announcementClampV29(a.titleX,0,100,3)}%;top:${announcementClampV29(a.titleY,0,100,32)}%;transform:translate(0,-50%) scale(${titleScale});transform-origin:left center;font-family:${esc(titleFont)};font-size:${titleSize}px;font-weight:${a.titleBold?800:400};color:${titleColor}">${esc(a.title)}${handles('title')}</strong>` : '';
    const tickerHtml = ticker ? `<div class="announcement-ticker-v29 announcement-layout-part-v30" data-layout-part="ticker" style="left:${announcementClampV29(a.tickerX,0,100,3)}%;top:${announcementClampV29(a.tickerY,0,100,76)}%;transform:translate(0,-50%) scale(${tickerScale});transform-origin:left center"><span style="font-family:${esc(tickerFont)};font-size:${tickerSize}px;font-weight:${a.tickerBold?700:400};color:${tickerColor}">${esc(ticker)}</span>${handles('ticker')}</div>` : '';
    const timerClass=ANNOUNCEMENT_TIMER_ANIMATIONS_V30.includes(a.timerAnimation)?` anim-${a.timerAnimation}`:' anim-none';
    const timer = a.timerEnabled && a.timerTarget ? `<div class="announcement-countdown-v29 theme-${esc(a.timerTimeOnly?'time-only':(ANNOUNCEMENT_TIMER_THEMES_V29.includes(a.timerTheme)?a.timerTheme:'glass'))} ${timerClass}" data-layout-part="timer" style="left:${announcementClampV29(a.timerX,0,100,88)}%;top:${announcementClampV29(a.timerY,0,100,50)}%;transform:translate(-50%,-50%) scale(${timerScale});transform-origin:center center;font-family:${esc(announcementFontV29(a.timerFont))}"><small>${esc(a.timerLabel||'COUNTDOWN')}</small><strong data-countdown-value-v29="1" data-target="${esc(a.timerTarget)}" id="${preview?'announcementPreviewTimerValueV29':'announcementLiveTimerValueV29'}">Calculating…</strong>${handles('timer')}</div>` : '';
    return `<div class="announcement-banner-v29${preview?' announcement-banner-preview-v30':''}" style="width:${announcementClampV29(a.bannerWidth,50,100,100)}%;height:${announcementClampV29(a.bannerHeight,70,360,104)}px;min-height:${announcementClampV29(a.bannerHeight,70,360,104)}px;margin-left:auto;margin-right:auto;background:${background}">${mediaEl}${title}${tickerHtml}${timer}</div>`;
  }
  function renderAnnouncementPreviewAdminV29() {
    const host=$('#announcementAdminPreviewV29');if(!host)return;
    const old=(db.announcements||[]).find(b=>b.id===window.__announcementEditingIdV29)||{};
    const preview=collectAnnouncementFormV29(old);preview.enabled=true;
    host.innerHTML=announcementBannerHtmlV29(preview,true);
    renderAnnouncementMediaPreviewV29(old); wireAnnouncementDragDropV29(); updateAnnouncementCountdownsV29();
  }
  let announcementRenderKeyV29 = '';
  function currentRotatingAnnouncementV29() {
    const cid=currentCompanyId();const enabled=(db.announcements||[]).filter(a=>a.enabled&&(a.showAllCompanies!==false||(a.companyIds||[]).map(String).includes(String(cid))));
    if(!enabled.length)return null;
    const slot=Math.floor(Date.now()/60000)%enabled.length;
    return enabled[slot];
  }
  function renderAnnouncementStripV29(force=false) {
    const host=$('#announcementStrip');if(!host)return;
    const route=(location.hash.slice(1)||'dashboard');if(['new-order','shipped-list'].includes(route)){host.hidden=true;host.innerHTML='';announcementRenderKeyV29='';return;}
    const a=currentRotatingAnnouncementV29();
    if(!a){host.hidden=true;host.innerHTML='';announcementRenderKeyV29='';return;}
    const src=a.mediaUrl||a.imageData||'';
    const key=JSON.stringify([a.id,a.updatedAt,a.title,a.tickerText,src.length,src.slice(0,48),a.mediaType,a.imageScale,a.imageX,a.imageY,a.bannerHeight,a.bannerWidth,a.titleX,a.titleY,a.titleScale,a.tickerX,a.tickerY,a.tickerScale,a.timerX,a.timerY,a.timerScale,a.titleFont,a.titleSize,a.titleColor,a.titleBold,a.tickerFont,a.tickerSize,a.tickerColor,a.tickerBold,a.timerEnabled,a.timerTarget,a.timerLabel,a.timerTheme,a.timerFont,a.timerAnimation,a.companyIds,a.showAllCompanies,a.timerTimeOnly]);
    host.hidden=false;
    if(force||key!==announcementRenderKeyV29){host.innerHTML=announcementBannerHtmlV29(a,false);announcementRenderKeyV29=key;}
    host.classList.toggle('announcement-scroll-hidden-v30', window.scrollY > 5);
    updateAnnouncementCountdownsV29();
  }
  function updateAnnouncementCountdownsV29() {
    document.querySelectorAll('[data-countdown-value-v29]').forEach(el=>{
      const target=new Date(el.dataset.target||'').getTime(), diff=target-Date.now();
      let label='';
      if(!Number.isFinite(target))label='Set date';
      else if(diff<=0)label='00d 00:00:00';
      else {const sec=Math.floor(diff/1000),days=Math.floor(sec/86400),hours=Math.floor((sec%86400)/3600),mins=Math.floor((sec%3600)/60),secs=sec%60;label=el.closest('.announcement-countdown-v29')?.classList.contains('theme-time-only') ? `${String(days*24+hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}` : `${String(days).padStart(2,'0')}d ${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;}
      if(el.textContent!==label)el.textContent=label;
    });
  }
  window.refreshAnnouncementBannerV29 = renderAnnouncementStripV29;
  // The banner occupies only the very top of the page; it never sticks over content.
  window.addEventListener('scroll',()=>{const host=$('#announcementStrip');if(host)host.classList.toggle('announcement-scroll-hidden-v30',window.scrollY>5);},{passive:true});
  // Keep the preview and all users' banners refreshed through the existing shared state sync.
  window.setInterval(()=>{
    ensureAnnouncementSchemaV29();
    renderAnnouncementStripV29();
    updateAnnouncementCountdownsV29();
    window.refreshGlobalPriceIndicators?.();
  },1000);
  renderAnnouncementStripV29();
})();
/* ================================================================
   V36 — Sales intelligence, product cost master, PCS-aware orders,
   delivered/returned accounting and two-up A4 invoice waybill.
   All records are kept in the existing OMS database/local sync flow.
   ================================================================ */
(function(){
  const ROLE_OK = ['Owner','Admin'];
  const moneyN = n => 'Rs. ' + Number(n||0).toLocaleString('en-LK',{maximumFractionDigits:2});
  const localDate = d => { const x=new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; };
  const shiftDate = (n) => { const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+n); return localDate(d); };
  const reportDefaultStart = () => shiftDate(-14);
  const roleAllowed = () => ROLE_OK.includes(db.session?.role);
  const companyName = id => db.companies.find(c=>c.id===id)?.name || 'Company';
  const itemProductId = it => it.productId ?? it.id;
  const orderTime = o => o.createdAt || o.orderedAt || `${o.date||today()}T00:00:00`;
  const orderDate = o => String(o.date || orderTime(o).slice(0,10)).slice(0,10);
  const orderDateTimeLabel = o => { const d=new Date(orderTime(o)); return Number.isNaN(d.getTime()) ? `${orderDate(o)}` : `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-LK',{hour:'2-digit',minute:'2-digit'})}`; };
  // PCS count is used for sales/reporting; stock movement for new orders is Qty-only.
  // Keep saved stockUnits on older orders so their historical restore/edit operations
  // reverse the exact amount that was deducted before this V43 correction.
  const pcsUnitsForItem = it => Math.max(0,Number(it.qty||0)) * Math.max(1,Number(it.pcs||1));
  const stockUnitsForItem = it => {
    const saved=it?.stockUnits;
    return saved!==undefined && saved!==null && Number.isFinite(Number(saved))
      ? Math.max(0,Number(saved)) : pcsUnitsForItem(it);
  };
  const stockUnitsForOrder = o => (o.items||[]).reduce((n,it)=>n+stockUnitsForItem(it),0);

  db.productCostSettings = db.productCostSettings || {};
  db.orders = db.orders || [];
  db.returned = db.returned || [];
  db.orders.forEach(o=>{
    if(o.deliveryCharge===undefined || o.deliveryCharge===null) o.deliveryCharge=350;
    if(o.otherExpense===undefined || o.otherExpense===null) o.otherExpense=0;
    (o.items||[]).forEach(it=>{
      if(!Number(it.pcs)) it.pcs=1;
      if(it.cost===undefined || it.cost===null){
        const p=db.products.find(x=>x.id===itemProductId(it));
        it.cost=Number(p?.cost ?? db.stockUnitCost ?? 45)*Number(it.pcs||1);
      }
    });
    if(o.status==='Returned' && o.stockRestored===undefined) o.stockRestored=true;
  });
  save();

  function settingsFor(companyId, productId){
    return db.productCostSettings?.[companyId]?.[String(productId)] || null;
  }
  function productById(id){return db.products.find(p=>String(p.id)===String(id))||null;}
  function defaultProductSettings(companyId, product){
    const saved=settingsFor(companyId,product.id);
    if(saved) return saved;
    const base=Number(product.cost ?? db.stockUnitCost ?? 45);
    const sell=Number(product.sell||0);
    return {wholesaleCost:base,companyStockPrice:0,deliveryPerPiece:0,otherPerPiece:0,tiers:[1,2,3,4].map(pcs=>({pcs,salePrice:sell*pcs,realCost:base*pcs}))};
  }
  // One fixed company-stock, inbound-delivery and other charge is applied per pack.
  // Only wholesale price is multiplied by the number of PCS in the pack.
  function packCostBreakdown(companyId, productId, pcs){
    const product=productById(productId);
    const cfg=product?defaultProductSettings(companyId,product):{wholesaleCost:Number(db.stockUnitCost||45),companyStockPrice:0,deliveryPerPiece:0,otherPerPiece:0};
    const n=Math.max(1,Number(pcs)||1);
    return {
      wholesale:Math.max(0,Number(cfg.wholesaleCost||0))*n,
      companyStock:Math.max(0,Number(cfg.companyStockPrice||0)),
      inbound:Math.max(0,Number(cfg.deliveryPerPiece||0)),
      other:Math.max(0,Number(cfg.otherPerPiece||0))
    };
  }
  function getTier(companyId, productId, pcs){
    const p=productById(productId); if(!p)return {pcs:Number(pcs)||1,salePrice:0,realCost:0,costBreakdown:{wholesale:0,companyStock:0,inbound:0,other:0}};
    const cfg=defaultProductSettings(companyId,p);
    const n=Math.max(1,Number(pcs)||1),found=(cfg.tiers||[]).find(x=>Number(x.pcs)===n);
    const costBreakdown=packCostBreakdown(companyId,productId,n);
    const realCost=costBreakdown.wholesale+costBreakdown.companyStock+costBreakdown.inbound+costBreakdown.other;
    return {pcs:n,salePrice:found?Number(found.salePrice||0):Number(p.sell||0)*n,realCost,costBreakdown};
  }
  function orderItemBreakdown(o){
    const totals={wholesale:0,companyStock:0,inbound:0,other:0};
    (o.items||[]).forEach(it=>{
      const qty=Math.max(0,Number(it.qty||0));
      const saved=it.costBreakdown;
      const b=saved&&['wholesale','companyStock','inbound','other'].every(k=>Number.isFinite(Number(saved[k])))
        ? saved : packCostBreakdown(o.companyId,itemProductId(it),it.pcs||1);
      Object.keys(totals).forEach(k=>{totals[k]+=Math.max(0,Number(b[k]||0))*qty;});
    });
    if(o.masterDeliveryCharge!==undefined && o.masterDeliveryCharge!==null){
      const override=Number(o.masterDeliveryCharge);
      if(Number.isFinite(override) && override>=0) totals.inbound=override;
    }
    totals.total=totals.wholesale+totals.companyStock+totals.inbound+totals.other;
    return totals;
  }
  function orderItemCost(o){return orderItemBreakdown(o).total;}
  function orderSalePcs(o){return (o.items||[]).reduce((sum,it)=>sum+pcsUnitsForItem(it),0) || Number(o.totalPcs||o.pcsCount||o.qty||0);}
  function accounting(o){
    const status=o.status||'Pending';
    const quoted=Math.max(0,Number(o.price||0));
    const delivery=Math.max(0,Number(o.deliveryCharge??350));
    const other=Math.max(0,Number(o.otherExpense||0));
    const costs=orderItemBreakdown(o);
    const itemCost=costs.total;
    const recognised=['Shipped','Delivered','Returned'].includes(status);
    const sales=recognised?quoted:0;
    // Standard orders: Wholesale Cost + Company Stock Price + Master Delivery
    // Charge + product-master Other Expense + order-level Other Cost.
    // Returned orders retain only Master Delivery Charge + Other Expense + Other Cost.
    const returnExpenses=costs.inbound+costs.other+other;
    const standardExpenses=costs.wholesale+costs.companyStock+costs.inbound+costs.other+other;
    const expenses=recognised?(status==='Returned'?returnExpenses:standardExpenses):0;
    const profit=status==='Delivered'?sales-itemCost:0;
    return {quoted,sales,delivery,other,itemCost,costs,expenses,profit,pcs:orderSalePcs(o),qty:Number(o.qty||0),status};
  }
  function expenseColumns(o){
    const a=accounting(o),active=['Shipped','Delivered','Returned'].includes(a.status),ret=a.status==='Returned';
    return {
      wholesale:active&&!ret?a.costs.wholesale:0,
      companyStock:active&&!ret?a.costs.companyStock:0,
      inbound:active?a.costs.inbound:0,
      masterOther:active?a.costs.other:0,
      delivery:active?a.delivery:0,
      other:active?a.other:0,
      total:a.expenses
    };
  }
  function expenseTotals(list){
    return list.reduce((t,o)=>{const x=expenseColumns(o);Object.keys(t).forEach(k=>t[k]+=Number(x[k]||0));return t;},{wholesale:0,companyStock:0,inbound:0,masterOther:0,delivery:0,other:0,total:0});
  }
  function scopedOrders(companyId=''){
    const cid=companyId || (db.session?.role==='Owner' ? '' : currentCompanyId());
    return (db.orders||[]).filter(o=>!cid || o.companyId===cid);
  }
  function totalsForOrders(list){
    return list.reduce((t,o)=>{const a=accounting(o);t.sales+=a.sales;t.profit+=a.profit;t.expenses+=a.expenses;t.pcs+=['Shipped','Delivered','Returned'].includes(a.status)?a.pcs:0;t.orders++;return t;},{sales:0,profit:0,expenses:0,pcs:0,orders:0});
  }
  function dayMetrics(list,start,end){
    const map={};
    const a=new Date(`${start}T00:00:00`),b=new Date(`${end}T00:00:00`);
    if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime())||a>b)return [];
    for(const d=new Date(a);d<=b;d.setDate(d.getDate()+1)){
      const key=localDate(d);map[key]={date:key,sales:0,profit:0,expenses:0,pcs:0};
    }
    list.forEach(o=>{
      const key=orderDate(o);if(!map[key])return;
      const x=accounting(o);map[key].sales+=x.sales;map[key].profit+=x.profit;map[key].expenses+=x.expenses;
      if(['Shipped','Delivered','Returned'].includes(x.status))map[key].pcs+=x.pcs;
    });
    return Object.values(map);
  }
  function companyOptions(selected, fixed){
    if(fixed)return `<option value="${esc(fixed)}" selected>${esc(companyName(fixed))}</option>`;
    return `<option value="" ${!selected?'selected':''}>All Companies</option>`+db.companies.filter(c=>c.active!==false).map(c=>`<option value="${esc(c.id)}" ${c.id===selected?'selected':''}>${esc(c.name)}</option>`).join('');
  }
  function miniLineChart(rows,key,formatter){
    const vals=rows.map(x=>Number(x[key]||0));
    if(!rows.length)return '<div class="v36-chart-empty">No data for this date range</div>';
    const w=760,h=142,pl=12,pr=12,pt=12,pb=24,ih=h-pt-pb,iw=w-pl-pr,min=Math.min(0,...vals),max=Math.max(1,...vals),range=Math.max(1,max-min),zeroY=pt+ih-((0-min)/range)*ih;
    const pts=vals.map((v,i)=>[pl+(rows.length===1?iw/2:i*iw/(rows.length-1)),pt+ih-((v-min)/range)*ih]);
    const line=pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area=`${line} L ${pts[pts.length-1][0].toFixed(1)},${zeroY.toFixed(1)} L ${pts[0][0].toFixed(1)},${zeroY.toFixed(1)} Z`;
    const dots=pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.1"><title>${esc(rows[i].date)} • ${esc(formatter(vals[i]))}</title></circle>`).join('');
    const axis=[0,Math.floor((rows.length-1)/2),rows.length-1].filter((x,i,a)=>a.indexOf(x)===i).map(i=>`<text x="${pts[i][0]}" y="${h-4}" text-anchor="${i===0?'start':i===rows.length-1?'end':'middle'}">${esc(rows[i].date.slice(5))}</text>`).join('');
    return `<svg class="v36-spark" viewBox="0 0 ${w} ${h}" role="img"><path class="v36-area" d="${area}"/><path class="v36-line" d="${line}"/>${dots}<line class="v36-axis" x1="${pl}" y1="${pt+ih}" x2="${w-pr}" y2="${pt+ih}"/>${axis}</svg>`;
  }

  function dashboardAnalyticsMarkup(){
    return `<section class="card v36-dashboard-analytics" id="v36DashboardAnalytics">
      <div class="v36-section-head"><div><div class="eyebrow">BUSINESS PERFORMANCE</div><h3>Sales, Profit &amp; Expense Analytics</h3><p>Daily Sales, Profit, Expenses and PCS trends • Rs. and PCS Y-axis scales • default: last 15 days</p></div><div class="v36-live-pill">LIVE DATA</div></div>
      <div class="v36-filter-row"><div class="field"><label>Start Date</label><input id="v36DashStart" type="date" value="${reportDefaultStart()}"></div><div class="field"><label>End Date</label><input id="v36DashEnd" type="date" value="${today()}"></div>${db.session?.role==='Owner'?`<div class="field"><label>Company</label><select id="v36DashCompany">${companyOptions('',false)}</select></div>`:''}</div>
      <div class="v37-chart-toggles" id="v37ChartToggles"><label><input type="checkbox" data-metric="sales" checked> <i style="--metric-color:#2563eb"></i> Sales</label><label><input type="checkbox" data-metric="profit" checked> <i style="--metric-color:#16a34a"></i> Profit</label><label><input type="checkbox" data-metric="expenses" checked> <i style="--metric-color:#f97316"></i> Expenses</label><label><input type="checkbox" data-metric="pcs" checked> <i style="--metric-color:#9333ea"></i> Sale Quantity (PCS)</label></div>
      <div id="v36DashCharts" class="v37-combined-chart"></div>
      <div class="v36-see-more-row"><span class="note">View order-wise sales, profit and expense details.</span><button class="btn btn-primary" type="button" onclick="openV36SalesReport()">See More <span aria-hidden="true">→</span></button></div>
    </section>`;
  }
  function renderDashboardAnalytics(){
    const host=$('#v36DashCharts');if(!host)return;
    const start=$('#v36DashStart')?.value||reportDefaultStart(),end=$('#v36DashEnd')?.value||today();
    const company=$('#v36DashCompany')?.value||'';
    const rows=dayMetrics(scopedOrders(company),start,end);
    if(start>end){host.innerHTML='<div class="v36-empty-state">Start Date must be before End Date.</div>';return;}
    const defs=[['sales','Sales','#2563eb',v=>moneyN(v)],['profit','Profit','#16a34a',v=>moneyN(v)],['expenses','Expenses','#f97316',v=>moneyN(v)],['pcs','Sale Quantity (PCS)','#9333ea',v=>`${Number(v||0).toLocaleString()} PCS`]];
    const active=defs.filter(([key])=>$('#v37ChartToggles input[data-metric="'+key+'"]')?.checked);
    if(!rows.length||!active.length){host.innerHTML='<div class="v36-chart-empty">Select at least one metric and a valid date range.</div>';return;}
    const w=1160,h=360,pl=154,pr=112,pt=30,pb=52,iw=w-pl-pr,ih=h-pt-pb;
    const x=i=>pl+(rows.length===1?iw/2:i*iw/(rows.length-1));
    // Currency series share an actual Rs. scale; quantity uses the right PCS axis.
    const currencyValues=rows.flatMap(r=>[r.sales,r.profit,r.expenses].map(v=>Number(v||0)));
    const moneyMin=Math.min(0,...currencyValues),moneyMax=Math.max(1,...currencyValues),moneySpan=Math.max(1,moneyMax-moneyMin);
    const pcsMax=Math.max(1,...rows.map(r=>Number(r.pcs||0)));
    const yMetric=(v,key)=>{const min=key==='pcs'?0:moneyMin,max=key==='pcs'?pcsMax:moneyMax,span=Math.max(1,max-min);return pt+ih-((Number(v||0)-min)/span)*ih;};
    const grid=[0,0.25,0.5,0.75,1].map(fr=>{const yy=pt+ih-ih*fr,rupees=moneyMin+moneySpan*fr,pcs=pcsMax*fr;return `<line x1="${pl}" y1="${yy}" x2="${w-pr}" y2="${yy}" stroke="#e8edf4"/><text x="${pl-12}" y="${yy+4}" text-anchor="end" fill="#8491a4" font-size="11">Rs. ${Math.round(rupees).toLocaleString('en-LK')}</text><text x="${w-pr+12}" y="${yy+4}" text-anchor="start" fill="#8491a4" font-size="11">${Math.round(pcs).toLocaleString('en-LK')} PCS</text>`}).join('')+`<text x="${pl}" y="15" fill="#64748b" font-size="11" font-weight="700">Rs. Price</text><text x="${w-pr}" y="15" fill="#64748b" font-size="11" font-weight="700">Quantity (PCS)</text>`;
    const smoothPath=pts=>{
      if(pts.length<2)return '';
      let d=`M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
      for(let i=0;i<pts.length-1;i++){
        const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];
        const c1x=p1[0]+(p2[0]-p0[0])/6,c1y=p1[1]+(p2[1]-p0[1])/6;
        const c2x=p2[0]-(p3[0]-p1[0])/6,c2y=p2[1]-(p3[1]-p1[1])/6;
        d+=` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
      }
      return d;
    };
    const lines=active.map(([key,label,color,fmt])=>{
      const pts=rows.map((r,i)=>[x(i),yMetric(Number(r[key]||0),key)]);
      const path=smoothPath(pts);
      const dots=pts.map((pt,i)=>`<circle cx="${pt[0]}" cy="${pt[1]}" r="3.6" fill="${color}" stroke="white" stroke-width="1.6"><title>${esc(rows[i].date)} · ${label}: ${esc(fmt(rows[i][key]))}</title></circle>`).join('');
      return `<path d="${path}" fill="none" stroke="${color}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>${dots}`
    }).join('');
    const labelStep=Math.max(1,Math.ceil(rows.length/15));
    const labelIndexes=rows.map((_,i)=>i).filter(i=>i%labelStep===0||i===rows.length-1);
    const labels=labelIndexes.map(i=>`<text x="${x(i)}" y="${h-14}" text-anchor="${i===0?'start':i===rows.length-1?'end':'middle'}" fill="#8491a4" font-size="10.5"><title>${esc(rows[i].date)}</title>${esc(rows[i].date.slice(5))}</text>`).join('');
    const totals=totalsForOrders(scopedOrders(company).filter(o=>orderDate(o)>=start&&orderDate(o)<=end));
    const legend=active.map(([key,label,color,fmt])=>`<span class="v37-legend-item"><i style="background:${color}"></i><b>${label}</b><strong>${esc(fmt(totals[key]||0))}</strong></span>`).join('');
    host.innerHTML=`<div class="v37-chart-legend">${legend}</div><svg class="v37-line-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Daily sales, gross profit, expenses in rupees and sale quantity in pieces">${grid}${lines}${labels}<text x="${pl+iw/2}" y="${h-1}" text-anchor="middle" fill="#697586" font-size="11">Date</text></svg>`;
  }
  const originalDashboardV36=dashboard;
  dashboard=function(){
    originalDashboardV36();
    const root=$('#content');if(!root)return;
    // Keep the commission card as the final dashboard section.
    const commission=root.querySelector('.commission-dashboard-wrap');if(commission)commission.remove();
    const old=$('#v36DashboardAnalytics');if(old)old.remove();
    root.insertAdjacentHTML('beforeend',dashboardAnalyticsMarkup());
    $('#v36DashStart')?.addEventListener('change',renderDashboardAnalytics);
    $('#v36DashEnd')?.addEventListener('change',renderDashboardAnalytics);
    $('#v36DashCompany')?.addEventListener('change',renderDashboardAnalytics);
    $$('#v37ChartToggles input').forEach(el=>el.addEventListener('change',renderDashboardAnalytics));
    renderDashboardAnalytics();
    if(commission){
      // Month and commission only: compact dashboard card, without company/stock detail columns.
      const rows=db.session?.role==='Admin'?commissionMonthsForCompany(currentCompanyId()):(()=>{const map={};(db.companies||[]).forEach(c=>commissionMonthsForCompany(c.id).forEach(r=>{map[r.month]=(map[r.month]||0)+Number(r.commission||0)}));return Object.entries(map).sort((a,b)=>b[0].localeCompare(a[0])).map(([month,commission])=>({month,commission}));})();
      commission.innerHTML=`<div class="card panel commission-dashboard-card v37-commission-card"><div class="panel-head"><div><div class="panel-title">Company Commission</div><div class="panel-sub">Monthly commission overview</div></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Month</th><th>Commission</th></tr></thead><tbody>${rows.slice(0,12).map(r=>`<tr><td>${esc(r.month)}</td><td><strong>${money(r.commission)}</strong></td></tr>`).join('')||'<tr><td colspan="2" class="empty">No commission records yet.</td></tr>'}</tbody></table></div></div>`;
      root.appendChild(commission);
    }
  };
  pages.dashboard=dashboard;

  // ----- Master data: company-specific landed costs and PCS selling tiers -----
  let masterCompanyId = '';
  function masterScopeCompany(){return db.session?.role==='Owner'?(masterCompanyId||db.companies.find(c=>c.active!==false)?.id||''):currentCompanyId();}
  function masterProductList(cid){
    if(!cid)return [];
    const stockIds=(db.stock[cid]||[]).map(r=>String(r.productId));
    return (db.products||[]).filter(p=>stockIds.includes(String(p.id)) && (!p.companyId || p.companyId===cid));
  }
  function productMasterPage(){
    if(!roleAllowed())return toast('Owner / Admin access only');
    if(db.session.role==='Owner'&&!masterCompanyId)masterCompanyId=db.companies.find(c=>c.active!==false)?.id||'';
    const cid=masterScopeCompany(),products=masterProductList(cid);
    const selector=db.session.role==='Owner'?`<div class="field"><label>Company</label><select id="v36MasterCompany">${companyOptions(cid,false)}</select></div>`:'';
    layout(`<div class="page-intro"><div><div class="eyebrow">PRODUCT COST CONTROL</div><h2>Product Cost &amp; Pricing Master</h2><p>Set wholesale price, mandatory company stock price, delivery and other expenses. Real Cost is calculated automatically for 1, 2, 3 and 4 PCS packs.</p></div><div class="actions"><button class="btn btn-outline" onclick="navTo('sales-report')">Back to Sales Report</button></div></div>
      <div class="card section-card v36-master-intro"><div class="v36-filter-row">${selector}<div class="v36-master-help"><b>How it works</b><span>Saved prices are used automatically in New Order. Stock is deducted by Qty only; PCS / Pack affects pack pricing and reported PCS totals.</span></div></div></div>
      <div class="card table-card v36-master-table"><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Stock Item</th><th>Code</th><th>Wholesale / PCS</th><th>Company Stock / PCS</th><th>Delivery / PCS</th><th>Other / PCS</th><th>PCS Tiers</th><th>Action</th></tr></thead><tbody>${products.map((p,i)=>{const x=defaultProductSettings(cid,p);return `<tr><td>${i+1}</td><td><b>${esc(p.name)}</b></td><td>${esc(p.code||'')}</td><td>${moneyN(x.wholesaleCost)}</td><td>${moneyN(x.companyStockPrice||0)}</td><td>${moneyN(x.deliveryPerPiece)}</td><td>${moneyN(x.otherPerPiece)}</td><td>${(x.tiers||[]).map(t=>`${Number(t.pcs)} PCS`).join(' • ')}</td><td><button class="btn btn-primary btn-small" onclick="openV36ProductMaster('${esc(cid)}','${esc(p.id)}')">${settingsFor(cid,p.id)?'Edit Details':'Add Details'}</button></td></tr>`}).join('')||'<tr><td colspan="9" class="empty">No stock items are available for this company yet.</td></tr>'}</tbody></table></div></div>`);
    $('#v36MasterCompany')?.addEventListener('change',e=>{masterCompanyId=e.target.value;productMasterPage()});
  }
  window.openV36ProductMaster=function(cid,pid){
    window.__v36CurrentProductId=pid;
    if(!roleAllowed())return toast('Owner / Admin access only');
    const companyId=db.session.role==='Owner'?cid:currentCompanyId();
    const p=productById(pid);if(!p||!companyId)return toast('Product or company not found');
    const cfg=defaultProductSettings(companyId,p);
    const mask=document.createElement('div');mask.className='modal-mask v36-modal-mask';mask.style.display='flex';mask.id='v36ProductMasterModal';
    mask.innerHTML=`<div class="modal v36-master-modal"><div class="modal-head"><div><div class="eyebrow">MASTER DATA • ${esc(companyName(companyId))}</div><div class="panel-title">${esc(p.name)}</div><div class="note">${esc(p.code||'')}</div></div><button class="close" onclick="this.closest('.modal-mask').remove()">×</button></div>
      <div class="v36-form-section"><h4>Base purchase costs</h4><div class="form-grid"><div class="field"><label>Wholesale Price (Rs. / PCS)</label><input id="v36Wholesale" type="number" min="0" step="0.01" value="${Number(cfg.wholesaleCost||0)}" oninput="refreshV36TierCosts()"></div><div class="field"><label>Company Stock Price (Rs. / PCS) <span style="color:#dc3545">*</span></label><input id="v36CompanyStockPrice" type="number" min="0.01" step="0.01" value="${Number(cfg.companyStockPrice||0)}" required oninput="refreshV36TierCosts()"></div><div class="field"><label>Delivery Charge (Rs. / PCS)</label><input id="v36Inbound" type="number" min="0" step="0.01" value="${Number(cfg.deliveryPerPiece||0)}" oninput="refreshV36TierCosts()"></div><div class="field"><label>Other Expense (Rs. / PCS)</label><input id="v36OtherBase" type="number" min="0" step="0.01" value="${Number(cfg.otherPerPiece||0)}" oninput="refreshV36TierCosts()"></div></div><p class="note">Real Cost = (Wholesale Price × PCS) + Company Stock Price + Delivery Charge + Other Expense. Company Stock Price, Inbound Delivery Charge and Other Expense are each added once per pack, regardless of PCS.</p></div>
      <div class="v36-form-section"><div class="v36-tier-head"><div><h4>PCS-wise real cost &amp; sale price</h4><p class="note">Set a separate price for 1, 2, 3, 4 PCS and any additional pack size.</p></div><button class="btn btn-outline btn-small" type="button" onclick="addV36PricingTier()">+ Add PCS Tier</button></div><div class="table-wrap"><table class="table v36-tier-table"><thead><tr><th>PCS</th><th>Real Cost (Rs.)</th><th>Sale Price (Rs.)</th><th></th></tr></thead><tbody id="v36TierRows">${(cfg.tiers||[]).map(t=>`<tr><td><input type="number" min="1" step="1" class="v36-tier-pcs" value="${Number(t.pcs)}" oninput="refreshV36TierCosts()"></td><td><input type="number" min="0" step="0.01" class="v36-tier-cost" value="${Number(t.realCost||0)}" readonly></td><td><input type="number" min="0" step="0.01" class="v36-tier-sale" value="${Number(t.salePrice||0)}"></td><td><button class="btn btn-danger btn-small" type="button" onclick="this.closest('tr').remove()">Remove</button></td></tr>`).join('')}</tbody></table></div></div>
      <div class="actions v36-modal-actions"><button class="btn btn-outline" onclick="this.closest('.modal-mask').remove()">Cancel</button><button class="btn btn-primary" onclick="saveV36ProductMaster('${esc(companyId)}','${esc(p.id)}')">Save Master Details</button></div></div>`;
    document.body.appendChild(mask);
    window.refreshV36TierCosts();
  };
  window.refreshV36TierCosts=function(){
    const wholesale=Number($('#v36Wholesale')?.value||0),fixed=Number($('#v36CompanyStockPrice')?.value||0)+Number($('#v36Inbound')?.value||0)+Number($('#v36OtherBase')?.value||0);
    $$('#v36TierRows tr').forEach(tr=>{const pcs=Math.max(1,Number($('.v36-tier-pcs',tr)?.value)||1),cost=$('.v36-tier-cost',tr);if(cost)cost.value=(wholesale*pcs+fixed).toFixed(2);});
  };
  window.addV36PricingTier=function(){
    const body=$('#v36TierRows');if(!body)return;
    const nums=$$('.v36-tier-pcs',body).map(x=>Number(x.value)||0);let next=1;while(nums.includes(next))next++;
    const p=productById(window.__v36CurrentProductId||'');
    const cfgBase=Number($('#v36Wholesale')?.value||0)*next+Number($('#v36CompanyStockPrice')?.value||0)+Number($('#v36Inbound')?.value||0)+Number($('#v36OtherBase')?.value||0);
    const tr=document.createElement('tr');tr.innerHTML=`<td><input type="number" min="1" step="1" class="v36-tier-pcs" value="${next}" oninput="refreshV36TierCosts()"></td><td><input type="number" min="0" step="0.01" class="v36-tier-cost" value="${cfgBase}" readonly></td><td><input type="number" min="0" step="0.01" class="v36-tier-sale" value="${Number(p?.sell||0)*next}"></td><td><button class="btn btn-danger btn-small" type="button" onclick="this.closest('tr').remove()">Remove</button></td>`;body.appendChild(tr);
  };
  window.saveV36ProductMaster=function(cid,pid){
    if(!roleAllowed())return toast('Owner / Admin access only');
    const companyId=db.session.role==='Owner'?cid:currentCompanyId(),p=productById(pid);if(!p||!companyId)return;
    const wholesale=Number($('#v36Wholesale')?.value),companyStockPrice=Number($('#v36CompanyStockPrice')?.value),delivery=Number($('#v36Inbound')?.value),other=Number($('#v36OtherBase')?.value);
    if(!Number.isFinite(companyStockPrice)||companyStockPrice<=0)return toast('Company Stock Price is mandatory. Enter a value greater than zero.');
    if([wholesale,delivery,other].some(v=>!Number.isFinite(v)||v<0))return toast('Enter valid cost values');
    const rows=$$('#v36TierRows tr').map(tr=>({pcs:Number($('.v36-tier-pcs',tr)?.value),realCost:Number($('.v36-tier-cost',tr)?.value),salePrice:Number($('.v36-tier-sale',tr)?.value)}));
    if(!rows.length||rows.some(r=>!Number.isInteger(r.pcs)||r.pcs<1||!Number.isFinite(r.realCost)||r.realCost<0||!Number.isFinite(r.salePrice)||r.salePrice<0))return toast('Check every PCS tier and its prices');
    if(new Set(rows.map(r=>r.pcs)).size!==rows.length)return toast('PCS values must be unique');
    rows.sort((a,b)=>a.pcs-b.pcs);
    db.productCostSettings[companyId]=db.productCostSettings[companyId]||{};
    rows.forEach(r=>{r.realCost=wholesale*r.pcs+companyStockPrice+delivery+other;});
    db.productCostSettings[companyId][String(pid)]={wholesaleCost:wholesale,companyStockPrice,deliveryPerPiece:delivery,otherPerPiece:other,tiers:rows,updatedAt:new Date().toISOString(),updatedBy:currentUser()?.name||owner.name};
    save();$('#v36ProductMasterModal')?.remove();toast('Product master details saved');productMasterPage();
  };
  window.openV36MasterFromReport=function(){
    if(db.session?.role==='Owner')masterCompanyId=window.__v36ReportFilters?.company||masterCompanyId||db.companies.find(c=>c.active!==false)?.id||'';
    navTo('product-costs');
  };
  routeTitles['product-costs']='Product Cost & Pricing Master';
  pages['product-costs']=productMasterPage;

  // ----- PCS-aware order entry and stock deduction -----
  function activeOrderCompany(){return currentCompanyId() || db.session?.companyId || ''}
  function productTierRows(companyId,productId){const p=productById(productId);return p?(defaultProductSettings(companyId,p).tiers||[]):[];}
  reservedOrderQty=function(productId){
    const id=window.__editingPendingOrderId;if(!id)return 0;
    const original=db.orders.find(x=>x.id===id&&x.companyId===currentCompanyId());
    return (original?.items||[]).filter(x=>String(itemProductId(x))===String(productId)).reduce((n,x)=>n+stockUnitsForItem(x),0);
  };
  selectProduct=function(id){
    const p=companyProducts().find(x=>String(x.id)===String(id));if(!p)return;
    const existing=orderProducts.find(x=>String(x.id)===String(id));
    if(Number(p.qty||0)<=0&&!p.isUnlimited&&!reservedOrderQty(id))return toast('Out of Stock');
    if(existing)existing.qty+=1;
    else {const cid=activeOrderCompany(),tier=getTier(cid,id,1);orderProducts.push({id:p.id,productId:p.id,code:p.code,name:p.name,qty:1,pcs:1,price:tier.salePrice,cost:tier.realCost,costBreakdown:tier.costBreakdown});}
    renderProductRows();$('#productSearch').value='';$('#productResults').innerHTML='';
  };
  renderProductRows=function(){
    const wrap=$('#productRows');if(!wrap)return;
    wrap.innerHTML=orderProducts.map((r,i)=>{
      const p=companyProducts().find(x=>String(x.id)===String(r.id||r.productId));
      const tiers=productTierRows(activeOrderCompany(),r.id||r.productId);
      const opts=tiers.some(t=>Number(t.pcs)===Number(r.pcs))?tiers:tiers.concat([{pcs:Number(r.pcs)||1,salePrice:r.price,realCost:r.cost||0}]);
      const maxUnits=(p?.isUnlimited?999999:(Number(p?.qty)||0)+reservedOrderQty(r.id||r.productId));
      const maxQty=Math.max(1,Math.floor(maxUnits));
      return `<div class="product-row v36-product-row"><div class="v36-product-name"><label>Product</label><input value="${esc(r.name)}" readonly></div><div><label>Qty</label><input type="number" min="1" max="${maxQty}" value="${Number(r.qty)||1}" onchange="changeOrderQty(${i},this.value)"></div><div><label>PCS / Pack</label><select onchange="changeOrderPcs(${i},this.value)">${opts.sort((a,b)=>Number(a.pcs)-Number(b.pcs)).map(t=>`<option value="${Number(t.pcs)}" ${Number(t.pcs)===Number(r.pcs)?'selected':''}>${Number(t.pcs)} PCS</option>`).join('')}</select></div><div><label>Sale Price / Pack (Rs.)</label><input type="number" min="0" step="0.01" value="${Number(r.price)||0}" onchange="changeOrderPrice(${i},this.value)"></div><div class="v36-pack-cost">Real cost: <b>${moneyN(r.cost||0)}</b></div><button class="btn btn-danger" onclick="removeOrderProduct(${i})">Remove</button></div>`;
    }).join('')||'<div class="callout">Search a product above and press Enter to add. Set Qty and PCS / Pack separately.</div>';
  };
  changeOrderPcs=function(i,value){
    const r=orderProducts[i];if(!r)return;
    const tier=getTier(activeOrderCompany(),r.id||r.productId,Number(value));
    const p=companyProducts().find(x=>String(x.id)===String(r.id||r.productId));
    const available=(p?.isUnlimited?Infinity:(Number(p?.qty)||0)+reservedOrderQty(r.id||r.productId));
    if(Number(r.qty)>available){toast(`Only ${available} stock units are available. Reduce Qty.`);return;}
    r.pcs=tier.pcs;r.price=tier.salePrice;r.cost=tier.realCost;r.costBreakdown=tier.costBreakdown;
    const row=$$('#productRows .product-row')[i];
    if(row){const priceInput=row.children[3]?.querySelector('input');if(priceInput)priceInput.value=String(r.price);const costLabel=row.querySelector('.v36-pack-cost b');if(costLabel)costLabel.textContent=moneyN(r.cost);const qtyInput=row.children[1]?.querySelector('input');if(qtyInput)qtyInput.max=String(Math.max(1,Math.floor(available)));}
  };
  changeOrderQty=function(i,value){
    const r=orderProducts[i];if(!r)return;const n=Math.max(1,Math.floor(Number(value)||1));
    const p=companyProducts().find(x=>String(x.id)===String(r.id||r.productId));
    const available=p?.isUnlimited?Infinity:(Number(p?.qty)||0)+reservedOrderQty(r.id||r.productId);
    if(n>available){toast(`Not enough stock. Available Qty: ${available}.`);return;}
    r.qty=n;
  };
  changeOrderPrice=function(i,value){if(!orderProducts[i])return;const n=Number(value);if(!Number.isFinite(n)||n<0)return toast('Enter a valid selling price');orderProducts[i].price=n;};
  renderProductSearch=function(){
    const input=$('#productSearch');if(!input)return;const q=input.value.toLowerCase().trim();
    const ps=companyProducts().filter(p=>!q||`${p.name} ${p.code}`.toLowerCase().includes(q));productActiveIndex=-1;
    $('#productResults').innerHTML=q?ps.map((p,i)=>{const tier=getTier(activeOrderCompany(),p.id,1);return (p.isUnlimited||Number(p.qty)>0||reservedOrderQty(p.id)>0)?`<button class="product-result" data-index="${i}" onclick="selectProduct('${esc(p.id)}')"><span><b>${esc(p.name)}</b><small>${esc(p.code)} • Available ${p.isUnlimited?'Unlimited':p.qty+' stock units'}</small></span><strong>${moneyN(tier.salePrice)}</strong></button>`:`<div class="product-result out-stock" aria-disabled="true"><span><b>${esc(p.name)}</b><small>${esc(p.code)} • Available 0</small></span><strong>Out of Stock</strong></div>`;}).join('')||'<div class="empty">No matching products</div>':'';
  };
  function mappedOrderItems(){return orderProducts.map(r=>({productId:r.id||r.productId,code:r.code,name:r.name,qty:Number(r.qty)||1,pcs:Number(r.pcs)||1,price:Number(r.price)||0,cost:Number(r.cost)||0,costBreakdown:r.costBreakdown||packCostBreakdown(activeOrderCompany(),r.id||r.productId,r.pcs||1),stockUnits:Math.max(0,Number(r.qty)||0)}));}
  function validateOrderProducts(){
    const errs=[];if(!orderProducts.length)errs.push('Add at least one product.');
    orderProducts.forEach(r=>{
      if(Number(r.qty)<1||!Number.isInteger(Number(r.qty)))errs.push(`${r.name}: enter a valid Qty.`);
      if(Number(r.pcs)<1||!Number.isInteger(Number(r.pcs)))errs.push(`${r.name}: enter a valid PCS value.`);
      if(Number(r.price)<0||!Number.isFinite(Number(r.price)))errs.push(`${r.name}: enter a valid sale price.`);
      const p=companyProducts().find(x=>String(x.id)===String(r.id||r.productId));
      const available=p?.isUnlimited?Infinity:(Number(p?.qty)||0)+reservedOrderQty(r.id||r.productId);
      if(!p)errs.push(`${r.name}: product not found.`);else if(Number(r.qty)>available)errs.push(`${r.name}: only ${available} stock units are available.`);
    });
    return errs;
  }
  function adjustStockForOrder(o, direction){
    if(!o.companyId)return;
    (o.items||[]).forEach(it=>{
      const units=stockUnitsForItem(it),st=(db.stock[o.companyId]||[]).find(x=>String(x.productId)===String(itemProductId(it)));
      if(direction<0){if(st)st.qty-=units;}
      else addCompanyStock(o.companyId,itemProductId(it),units);
    });
  }
  createOrder=function(leadNo){
    const validation=[];
    const name=$('#oName')?.value.trim()||'',address=$('#oAddress')?.value.trim()||'',city=$('#oCity')?.value.trim()||'',phone=$('#oTel')?.value.trim()||'';
    if(!name)validation.push('Customer name is required.');if(!address)validation.push('Address is required.');if(!city)validation.push('Town / City is required.');if(!phone)validation.push('Contact number is required.');
    validation.push(...validateOrderProducts());
    if(validation.length){$('#orderValidation').innerHTML=validation.map(v=>`<div>• ${esc(v)}</div>`).join('');$('#orderValidation').classList.add('show');return;}
    $('#orderValidation').classList.remove('show');
    const items=mappedOrderItems(),comp=currentCompanyId(),now=new Date();
    const totalQty=items.reduce((n,r)=>n+r.qty,0),totalPcs=items.reduce((n,r)=>n+r.qty*r.pcs,0),price=items.reduce((n,r)=>n+r.qty*r.price,0);
    const o={id:'ORD-'+db.nextOrder++,lead:leadNo||'',date:localDate(now),createdAt:now.toISOString(),companyId:comp,customer:name,address,city,tel:phone,tel2:$('#oTel2')?.value.trim()||'',other:$('#oOther')?.value.trim()||'',variant:$('#oVariant')?.value.trim()||'',note:$('#oNote')?.value.trim()||'',due:$('#oDue')?.value||today(),status:'Pending',createdBy:currentUser()?.name||owner.name,items,productSummary:items.map(r=>`${r.name} × ${r.qty} (${r.pcs} PCS each)`).join(', '),qty:totalQty,totalPcs,pcsCount:totalPcs,price,deliveryCharge:350,otherExpense:0,stockRestored:false};
    db.orders.unshift(o);adjustStockForOrder(o,-1);
    if(leadNo){const l=db.leads.find(x=>x.no===leadNo);if(l){l.status='OK';l.updatedAt=now.toISOString();}}
    save();window.__editingPendingOrderId='';orderProducts=[];
    const dest=leadNo?'lead-list':'pending-orders';showLogoLoader(520,()=>{location.hash=dest;render();});
  };
  window.editOrder=function(id){
    const o=db.orders.find(x=>x.id===id&&x.companyId===currentCompanyId()&&x.status==='Pending');if(!o)return toast('Pending order not found');
    window.__editingPendingOrderId=o.id;newOrder(o.lead||'');
    $('#oName').value=o.customer||'';$('#oAddress').value=o.address||'';$('#oCity').value=o.city||'';$('#oTel').value=o.tel||'';$('#oTel2').value=o.tel2||'';$('#oOther').value=o.other||'';$('#oVariant').value=o.variant||'';$('#oDue').value=o.due||today();$('#oNote').value=o.note||'';
    orderProducts=(o.items||[]).map(it=>{const id=itemProductId(it),p=productById(id),tier=getTier(o.companyId,id,Number(it.pcs||1)),b=it.costBreakdown||tier.costBreakdown;return {id,productId:id,code:it.code||p?.code||'',name:it.name||p?.name||'Product',qty:Number(it.qty)||1,pcs:Number(it.pcs)||1,price:Number(it.price??tier.salePrice),cost:Number(b.wholesale||0)+Number(b.companyStock||0)+Number(b.inbound||0)+Number(b.other||0),costBreakdown:b};});
    renderProductRows();const btn=$('.order-form-card .order-main-actions .btn-primary');if(btn){btn.textContent='Update';btn.setAttribute('onclick',`updatePendingOrder('${o.id}')`);}const title=$('.order-form-card .panel-title');if(title)title.textContent='Edit Pending Order';
  };
  window.updatePendingOrder=function(id){
    const o=db.orders.find(x=>x.id===id&&x.companyId===currentCompanyId()&&x.status==='Pending');if(!o)return toast('Pending order not found');
    const name=$('#oName')?.value.trim()||'',address=$('#oAddress')?.value.trim()||'',city=$('#oCity')?.value.trim()||'',tel=$('#oTel')?.value.trim()||'';
    if(!name||!address||!city||!tel)return toast('Customer name, address, town and phone are required');
    const errs=validateOrderProducts();if(errs.length)return toast(errs.join(' '));
    const oldItems=o.items||[];const availableByPid={};oldItems.forEach(it=>{const id=String(itemProductId(it));availableByPid[id]=(availableByPid[id]||0)+stockUnitsForItem(it);});
    for(const r of orderProducts){const p=companyProducts().find(x=>String(x.id)===String(r.id||r.productId));const available=(p?.isUnlimited?Infinity:(Number(p?.qty)||0))+(availableByPid[String(r.id||r.productId)]||0);if(Number(r.qty)>available)return toast(`${r.name}: insufficient stock`);}
    adjustStockForOrder(o,1);
    const items=mappedOrderItems(),totalQty=items.reduce((n,r)=>n+r.qty,0),totalPcs=items.reduce((n,r)=>n+r.qty*r.pcs,0);
    const price=items.reduce((n,r)=>n+r.qty*r.price,0);
    Object.assign(o,{customer:name,address,city,tel,tel2:$('#oTel2').value.trim(),other:$('#oOther').value.trim(),variant:$('#oVariant').value.trim(),note:$('#oNote').value.trim(),due:$('#oDue').value,items,productSummary:items.map(r=>`${r.name} × ${r.qty} (${r.pcs} PCS each)`).join(', '),qty:totalQty,totalPcs,pcsCount:totalPcs,price,updatedAt:new Date().toISOString()});
    adjustStockForOrder(o,-1);save();window.__editingPendingOrderId='';orderProducts=[];toast('Order updated');location.hash='pending-orders';render();
  };
  window.deletePendingOrder=function(id){
    const o=db.orders.find(x=>x.id===id&&x.companyId===currentCompanyId()&&x.status==='Pending');if(!o)return toast('Pending order not found');if(!confirm(`Delete pending order ${o.id}?`))return;
    adjustStockForOrder(o,1);db.orders=db.orders.filter(x=>x.id!==id);save();toast('Order deleted');pendingOrders();
  };

  // ----- Status changes and the financial accounting rules -----
  function updateOrderStatus(id,newStatus){
    if(!roleAllowed())return toast('Owner / Admin access only');
    const o=db.orders.find(x=>x.id===id);if(!o)return toast('Order not found');
    if(db.session.role!=='Owner'&&o.companyId!==currentCompanyId())return toast('You cannot update another company order');
    const old=o.status||'Pending';if(!['Pending','Shipped','Delivered','Returned'].includes(newStatus))return toast('Invalid order status');
    if(newStatus==='Returned'&&old!=='Returned'&&!o.stockRestored){adjustStockForOrder(o,1);o.stockRestored=true;o.returnedAt=new Date().toISOString();
      if(!(db.returned||[]).some(r=>r.orderId===o.id)){db.returned.unshift({orderId:o.id,tracking:o.waybill||'',waybill:o.waybill||'',customer:o.customer||'',product:o.productSummary||'',date:today(),time:new Date().toLocaleTimeString('en-LK',{hour:'2-digit',minute:'2-digit'}),price:o.price,qty:o.qty,companyId:o.companyId,by:currentUser()?.name||owner.name});}}
    if(old==='Returned'&&newStatus!=='Returned'&&o.stockRestored){const stRows=db.stock[o.companyId]||[];for(const it of o.items||[]){const st=stRows.find(x=>String(x.productId)===String(itemProductId(it)));if(st&&st.qty<stockUnitsForItem(it))return toast('Not enough stock to reverse this return');}adjustStockForOrder(o,-1);o.stockRestored=false;o.returnedAt='';db.returned=(db.returned||[]).filter(r=>r.orderId!==o.id);}
    o.status=newStatus;if(newStatus==='Delivered'&&!o.deliveredAt)o.deliveredAt=new Date().toISOString();if(newStatus==='Shipped'&&!o.shippedAt)o.shippedAt=new Date().toISOString();
    save();toast(`Order ${o.id} updated to ${newStatus}`);renderSalesReport();
  }
  window.updateV36OrderStatus=updateOrderStatus;
  window.setV36OrderExpense=function(id,field,value){
    if(!roleAllowed())return toast('Owner / Admin access only');
    const o=db.orders.find(x=>x.id===id);if(!o)return;
    if(db.session.role!=='Owner'&&o.companyId!==currentCompanyId())return toast('You cannot update another company order');
    if(!['deliveryCharge','otherExpense'].includes(field))return;
    const n=Number(value);if(!Number.isFinite(n)||n<0)return toast('Enter a valid expense value');
    o[field]=n;save();renderSalesReport();
  };
  window.setV36MasterDeliveryCharge=function(id,value){
    if(!roleAllowed())return toast('Owner / Admin access only');
    const o=db.orders.find(x=>x.id===id);if(!o)return toast('Order not found');
    if(db.session.role!=='Owner'&&o.companyId!==currentCompanyId())return toast('You cannot update another company order');
    const n=Number(value);if(!Number.isFinite(n)||n<0)return toast('Enter a valid Master Delivery Charge');
    o.masterDeliveryCharge=n;save();toast('Master Delivery Charge updated');renderSalesReport();
  };
  function reportPage(){
    if(!roleAllowed())return toast('Owner / Admin access only');
    const f=window.__v36ReportFilters||(window.__v36ReportFilters={start:reportDefaultStart(),end:today(),q:'',company:''});
    const fixed=db.session.role==='Admin'?currentCompanyId():'';if(fixed)f.company=fixed;
    const select=db.session.role==='Owner'?`<div class="field"><label>Company</label><select id="v36ReportCompany">${companyOptions(f.company,false)}</select></div>`:'';
    layout(`<div class="page-intro"><div><div class="eyebrow">BUSINESS INTELLIGENCE</div><h2>Sales &amp; Profit Report</h2><p>Order-wise financial results. Returned orders include only Master Delivery Charge, Other Expense and Other Cost, with zero profit.</p></div><div class="actions"><button class="btn btn-primary" onclick="openV36MasterFromReport()">+ Add Master Details</button><button class="btn btn-outline" onclick="navTo('dashboard')">Dashboard</button></div></div>
      <div class="card section-card v36-report-filters"><div class="v36-filter-row"><div class="field"><label>Start Date</label><input id="v36ReportStart" type="date" value="${esc(f.start||reportDefaultStart())}"></div><div class="field"><label>End Date</label><input id="v36ReportEnd" type="date" value="${esc(f.end||today())}"></div>${select}<div class="field v36-search-field"><label>Search Orders</label><input id="v36ReportSearch" value="${esc(f.q||'')}" placeholder="Order number, customer, phone, product, waybill..."></div></div></div>
      <div class="v37-table-toggle card section-card"><span class="note">Table columns</span><div class="v37-toggle-buttons"><button type="button" class="btn btn-primary" data-table-mode="all" onclick="setV37TableMode('all')">All</button><button type="button" class="btn btn-outline" data-table-mode="profit" onclick="setV37TableMode('profit')">Profit only</button><button type="button" class="btn btn-outline" data-table-mode="expenses" onclick="setV37TableMode('expenses')">Expenses only</button></div></div><div id="v36ReportBody"></div>`);
    ['v36ReportStart','v36ReportEnd','v36ReportCompany'].forEach(id=>$('#'+id)?.addEventListener('change',()=>{
      f.start=$('#v36ReportStart')?.value||'';f.end=$('#v36ReportEnd')?.value||'';f.company=$('#v36ReportCompany')?.value||fixed;renderSalesReport();
    }));
    $('#v36ReportSearch')?.addEventListener('input',e=>{f.q=e.target.value;filterSalesReport();});
    renderSalesReport();
  }
  function filterSalesReport(){
    const q=String(window.__v36ReportFilters?.q||'').trim().toLowerCase();
    $$('#v36ReportTable tbody tr[data-order-id]').forEach(tr=>{tr.style.display=!q||tr.dataset.search.includes(q)?'':'none';});
  }
  window.setV37TableMode=function(mode){
    window.__v37TableMode=mode;
    const table=$('#v36ReportTable');if(!table)return;
    const profitIndexes=new Set([16]),expenseIndexes=new Set([8,9,10,11,12,15]);
    [...table.querySelectorAll('tbody tr')].forEach(tr=>[...tr.children].forEach((cell,i)=>{
      if(profitIndexes.has(i))cell.style.display=mode==='expenses'?'none':'';
      if(expenseIndexes.has(i))cell.style.display=mode==='profit'?'none':'';
    }));
    [...table.querySelectorAll('tfoot tr')].forEach(tr=>{
      const cells=[...tr.children];
      if(cells[2])cells[2].style.display=mode==='profit'?'none':'';
      if(cells[3])cells[3].style.display=mode==='expenses'?'none':'';
    });
    $$('[data-table-mode]').forEach(b=>{b.classList.toggle('btn-primary',b.dataset.tableMode===mode);b.classList.toggle('btn-outline',b.dataset.tableMode!==mode);});
  };
  function renderSalesReport(){
    const body=$('#v36ReportBody');if(!body)return;
    const f=window.__v36ReportFilters||(window.__v36ReportFilters={start:reportDefaultStart(),end:today(),q:'',company:''});
    const fixed=db.session?.role==='Admin'?currentCompanyId():'';
    const company=fixed||f.company||'';const start=f.start||reportDefaultStart(),end=f.end||today();
    let orders=scopedOrders(company).filter(o=>(!start||orderDate(o)>=start)&&(!end||orderDate(o)<=end));
    orders.sort((a,b)=>new Date(orderTime(b))-new Date(orderTime(a)));
    const sums=totalsForOrders(orders),expenseSums=expenseTotals(orders);
    const totalRows=orders.map((o,i)=>{
      const a=accounting(o),ex=expenseColumns(o),created=orderDateTimeLabel(o);
      const itemSummary=(o.items||[]).map(it=>`${it.name||productById(itemProductId(it))?.name||'Product'} × ${it.qty} (${it.pcs||1} PCS)`).join(', ')||o.productSummary||'';
      const search=[o.id,o.customer,o.tel,o.tel2,o.address,o.waybill,itemSummary,companyName(o.companyId),o.status].join(' ').toLowerCase();
      const ret=a.status==='Returned';
      const expCell=(value)=>`<td class="num v38-expense-cell">${value}</td>`;
      return `<tr data-order-id="${esc(o.id)}" data-search="${esc(search)}"><td>${i+1}</td><td><b>${esc(o.id)}</b><small class="v36-subcell">${esc(o.waybill||'')}</small></td><td><b>${esc(created)}</b><small class="v36-subcell">${esc(o.date||'')}</small></td><td><b>${esc(o.customer||'')}</b><small class="v36-subcell">${esc(o.tel||'')}${o.tel2?' / '+esc(o.tel2):''}</small><small class="v36-subcell">${esc(o.address||'')}</small></td><td>${esc(itemSummary)}</td><td class="num">${Number(o.qty||0)}</td><td class="num">${a.pcs}</td><td class="num">${moneyN(a.quoted)}</td>
        ${expCell(ret?'—':moneyN(ex.wholesale))}${expCell(ret?'—':moneyN(ex.companyStock))}${expCell(`<input class="v36-expense-input" aria-label="Master Delivery Charge" title="Edit Master Delivery Charge" type="number" min="0" step="0.01" value="${ex.inbound}" onchange="setV36MasterDeliveryCharge('${esc(o.id)}',this.value)">`)}${expCell(moneyN(ex.masterOther))}
        ${expCell(`<input class="v36-expense-input" aria-label="Other cost" type="number" min="0" step="0.01" value="${a.other}" onchange="setV36OrderExpense('${esc(o.id)}','otherExpense',this.value)">`)}<td><select class="v36-status-select" onchange="updateV36OrderStatus('${esc(o.id)}',this.value)"><option ${o.status==='Pending'?'selected':''} value="Pending">Pending</option><option ${o.status==='Shipped'?'selected':''} value="Shipped">Shipped</option><option ${o.status==='Delivered'?'selected':''} value="Delivered">Delivered</option><option ${o.status==='Returned'?'selected':''} value="Returned">Returned</option></select>${ret?'<small class="v36-subcell v38-return-note">Profit: Rs. 0</small>':''}</td><td class="num ${a.sales?'v36-positive':''}">${moneyN(a.sales)}</td><td class="num v38-expense-cell"><b>${moneyN(a.expenses)}</b></td><td class="num v38-profit-cell"><b>${moneyN(a.profit)}</b></td></tr>`;
    }).join('');
    body.innerHTML=`<div class="v36-report-kpis"><article><span>Recognised Sales</span><strong>${moneyN(sums.sales)}</strong></article><article><span>Total Expenses</span><strong>${moneyN(sums.expenses)}</strong></article><article><span>Profit</span><strong>${moneyN(sums.profit)}</strong></article><article><span>Sale Quantity (PCS)</span><strong>${Number(sums.pcs).toLocaleString()} PCS</strong></article></div>
      <div class="card table-card v36-report-table-card"><div class="v36-table-caption"><div><b>Order Financial Details</b><span>${orders.length} orders • ${start||'All dates'} to ${end||'Today'}</span></div><span class="v36-accounting-note">Total Expenses = Wholesale Cost + Company Stock Price + Master Delivery Charge + Other Expense + Other Cost. Returned orders count only Master Delivery Charge, Other Expense and Other Cost. Profit = Sales − product master costs.</span></div><div class="table-wrap"><table class="table v36-report-table" id="v36ReportTable"><thead><tr><th>#</th><th>Order No.</th><th>Date &amp; Time</th><th>Customer</th><th>Products</th><th>Qty</th><th>PCS</th><th>Sale Price</th><th class="v38-expense-cell">Wholesale Cost</th><th class="v38-expense-cell">Company Stock Price</th><th class="v38-expense-cell">Master Delivery Charge</th><th class="v38-expense-cell">Other Expense</th><th class="v38-expense-cell">Other Cost</th><th>Status</th><th class="v36-positive">Sales</th><th class="v38-expense-cell">Total Expenses</th><th class="v38-profit-cell">Profit</th></tr></thead><tbody>${totalRows||'<tr><td colspan="17" class="empty">No orders found for this date range.</td></tr>'}</tbody><tfoot><tr><td colspan="14"><b>Totals</b></td><td class="num v36-positive"><b>${moneyN(sums.sales)}</b></td><td class="num v38-expense-cell"><b>${moneyN(sums.expenses)}</b></td><td class="num v38-profit-cell"><b>${moneyN(sums.profit)}</b></td></tr></tfoot></table></div></div>`;
    filterSalesReport();
    window.setV37TableMode(window.__v37TableMode||'all');
  }
  window.filterSalesReport=filterSalesReport;
  window.renderSalesReport=renderSalesReport;
  window.openV36SalesReport=function(){
    window.__v36ReportFilters={start:$('#v36DashStart')?.value||reportDefaultStart(),end:$('#v36DashEnd')?.value||today(),q:'',company:$('#v36DashCompany')?.value||''};
    navTo('sales-report');
  };
  routeTitles['sales-report']='Sales, Profit & Expense Analytics';
  pages['sales-report']=reportPage;
  const previousPermittedV36=permitted;
  permitted=function(r){if(['sales-report','product-costs'].includes(r))return roleAllowed();return previousPermittedV36(r);};

  // Keep return-by-waybill and manual return status aligned with PCS-aware stock units.
  window.processReturn=function(){
    const tokens=[...new Set(String($('#returnWaybill')?.value||'').split(/[\s,;]+/).map(x=>x.trim()).filter(Boolean))];
    if(!tokens.length)return toast('Enter at least one waybill / tracking number');
    const ok=[],bad=[];
    tokens.forEach(token=>{
      const t=token.toUpperCase();let found=db.orders.filter(o=>String(o.waybill||'').toUpperCase()===t||String(o.waybill||'').toUpperCase()==='WB-'+t);
      if(!found.length){const sh=db.shipped.find(s=>String(s.id||'').toUpperCase()===t);if(sh)found=shipmentOrders(sh);}
      found=found.filter(o=>db.session.role==='Owner'||o.companyId===currentCompanyId());
      if(!found.length){bad.push([token,'Waybill not found']);return;}
      let added=0;
      found.forEach(o=>{
        if(o.status==='Returned'){bad.push([token,`${o.id} is already returned`]);return;}
        if(o.status!=='Shipped'){bad.push([token,`${o.id} is not shipped`]);return;}
        updateOrderStatus(o.id,'Returned');added++;ok.push(o);
      });
      if(!added&&found.length>1)bad.push([token,'No shipped orders available to return']);
    });
    if(ok.length){save();$('#returnResult').innerHTML=`<div class="return-ok"><b>✓ ${ok.length} return(s) added successfully</b>${ok.map(o=>`<div class="return-row ok"><span>${esc(o.waybill||o.id)}</span><span>${esc(o.id)} • ${esc(o.customer||'')}</span><span>Status: Returned • ${stockUnitsForOrder(o)} stock units restored</span></div>`).join('')}</div>`;$('#returnWaybill').value='';toast('Return added and stock restored');}
    else {$('#returnResult').innerHTML=bad.map(([t,m])=>`<div class="return-row bad"><span>${esc(t)}</span><span>${esc(m)}</span></div>`).join('');toast('No return added');}
  };

  // ----- Layout 3: clean A4 portrait invoice, exactly two invoices per page -----
  function invoiceCard(o,s){
    const c=db.companies.find(x=>x.id===o.companyId)||{};
    const items=(o.items||[]).map(it=>`<tr><td><b>${esc(it.name||productById(itemProductId(it))?.name||'Product')}</b><small>${esc(it.code||'')}</small></td><td>${Number(it.qty||0)}</td><td>${Number(it.pcs||1)}</td><td>${moneyN(it.price||0)}</td><td>${moneyN(Number(it.qty||0)*Number(it.price||0))}</td></tr>`).join('');
    const waybill=o.waybill||s?.id||'—';
    return `<article class="v36-invoice-card"><div class="v36-invoice-top"><div class="v36-invoice-brand"><img src="assets/apex-logo.png"><div><b>${esc(c.name||s?.company||'APEX HOLDINGS')}</b><small>${esc(c.address||'Sri Lanka')} ${c.phone?' • '+esc(c.phone):''}</small></div></div><div class="v36-invoice-title"><strong>INVOICE</strong><span>DELIVERY NOTE</span></div></div>
      <div class="v36-invoice-meta"><div><small>ORDER NUMBER</small><b>${esc(o.id||'')}</b></div><div><small>ORDER DATE &amp; TIME</small><b>${esc(orderDateTimeLabel(o))}</b></div><div><small>WAYBILL NUMBER</small><b>${esc(waybill)}</b></div></div>
      <div class="v36-invoice-customer"><div><small>DELIVER TO</small><h3>${esc(o.customer||'Customer')}</h3><p>${esc(o.address||'')}${o.city?', '+esc(o.city):''}</p><p><b>Phone 1:</b> ${esc(o.tel||'—')} ${o.tel2?`<span>• <b>Phone 2:</b> ${esc(o.tel2)}</span>`:''}</p></div><div class="v36-invoice-courier"><small>DELIVERY COMPANY</small><b>${esc(s?.company||o.deliveryCompany||'Courier')}</b><small>PAYMENT METHOD</small><b>Cash on Delivery</b></div></div>
      <div class="v36-invoice-products"><table><thead><tr><th>PRODUCT / DESCRIPTION</th><th>QTY</th><th>PCS</th><th>UNIT PRICE</th><th>AMOUNT</th></tr></thead><tbody>${items||`<tr><td>${esc(o.productSummary||'Order items')}</td><td>${Number(o.qty||1)}</td><td>${Number(o.totalPcs||o.qty||1)}</td><td>${moneyN(o.price||0)}</td><td>${moneyN(o.price||0)}</td></tr>`}</tbody></table></div>
      <div class="v36-invoice-total"><div><small>ORDER NOTES</small><p>${esc(o.note||'Thank you for your order.')}</p></div><div class="v36-cod-box"><small>COLLECT FROM CUSTOMER (COD)</small><strong>${moneyN(o.price||0)}</strong><span>Delivery fee may be handled by courier separately.</span></div></div>
      <div class="v36-invoice-bottom"><div class="v36-invoice-barcode">${typeof barcodeSvg==='function'?barcodeSvg(waybill):`<b>${esc(waybill)}</b>`}</div><div><b>${esc(c.name||'APEX HOLDINGS')}</b><small>Thank you for choosing us.</small><small>Goods checked and packed with care.</small></div></div>
      <div class="v36-invoice-foot"><span>Customer Copy</span><span>${esc(waybill)}</span><span>${esc(o.id||'')}</span></div></article>`;
  }
  function printLayout3(orders,shipment){
    const chunks=[];for(let i=0;i<orders.length;i+=2)chunks.push(orders.slice(i,i+2));
    if(!chunks.length)return toast('No orders available for printing');
    const pages=chunks.map((chunk,i)=>`<section class="v36-invoice-sheet">${chunk.map(o=>invoiceCard(o,shipment)).join('')}</section>`).join('');
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>Invoice Waybill — Layout 3</title><style>
      @page{size:A4 portrait;margin:6mm}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#172033;font-family:Arial,Helvetica,sans-serif}.v36-invoice-sheet{width:198mm;height:285mm;display:grid;grid-template-columns:1fr;grid-template-rows:repeat(2,minmax(0,1fr));gap:4mm;break-after:page;page-break-after:always}.v36-invoice-sheet:last-child{break-after:auto;page-break-after:auto}.v36-invoice-card{border:1px solid #cbd5e1;border-radius:3mm;height:100%;min-height:0;padding:5mm 6mm;display:flex;flex-direction:column;overflow:hidden;background:#fff}.v36-invoice-top{display:flex;justify-content:space-between;align-items:center;padding-bottom:3mm;border-bottom:1.2px solid #1d3557}.v36-invoice-brand{display:flex;align-items:center;gap:3mm;min-width:0}.v36-invoice-brand img{width:18mm;height:15mm;object-fit:contain}.v36-invoice-brand b{font-size:12pt;display:block;color:#122b4a}.v36-invoice-brand small{display:block;font-size:7pt;color:#566579;margin-top:1mm}.v36-invoice-title{text-align:right}.v36-invoice-title strong{font-size:21pt;display:block;letter-spacing:1.4px;color:#17365c}.v36-invoice-title span{font-size:7pt;letter-spacing:1.6px;color:#63748a;font-weight:700}.v36-invoice-meta{display:grid;grid-template-columns:1fr 1.25fr 1.2fr;gap:3mm;padding:3mm 0;border-bottom:1px solid #e1e7ef}.v36-invoice-meta div{min-width:0}.v36-invoice-meta small,.v36-invoice-customer small,.v36-cod-box small,.v36-invoice-total>div>small{display:block;font-size:6.5pt;font-weight:700;color:#718096;letter-spacing:.7px;margin-bottom:1.1mm}.v36-invoice-meta b{font-size:9pt;overflow-wrap:anywhere}.v36-invoice-customer{display:grid;grid-template-columns:1.6fr 1fr;gap:5mm;padding:3.5mm 0;border-bottom:1px solid #e1e7ef}.v36-invoice-customer h3{font-size:14pt;margin:0 0 1mm;color:#132d4d}.v36-invoice-customer p{margin:1mm 0;font-size:9pt;line-height:1.25}.v36-invoice-courier{background:#f5f8fc;border:1px solid #e0e7f0;border-radius:2mm;padding:3mm}.v36-invoice-courier b{display:block;font-size:9pt;margin-bottom:3mm}.v36-invoice-products{padding:3mm 0;min-height:0}.v36-invoice-products table{width:100%;border-collapse:collapse;font-size:8pt}.v36-invoice-products th{background:#edf3f9;color:#30435a;text-align:left;padding:2.2mm 1.6mm;font-size:6.7pt;letter-spacing:.3px}.v36-invoice-products td{padding:2.3mm 1.6mm;border-bottom:1px solid #e8edf3;vertical-align:top}.v36-invoice-products td:first-child{width:42%}.v36-invoice-products td small{display:block;font-size:6.5pt;color:#78879a}.v36-invoice-products td:not(:first-child),.v36-invoice-products th:not(:first-child){text-align:right;white-space:nowrap}.v36-invoice-total{display:grid;grid-template-columns:1fr .9fr;gap:4mm;margin-top:auto;padding:3mm 0}.v36-invoice-total p{font-size:8pt;color:#536176;line-height:1.3;margin:0}.v36-cod-box{background:#f2f7fc;border:1px solid #b9cce0;border-radius:2mm;padding:3mm;text-align:right}.v36-cod-box strong{font-size:19pt;color:#123b67;display:block}.v36-cod-box span{font-size:6.5pt;color:#64748b}.v36-invoice-bottom{display:flex;align-items:center;justify-content:space-between;gap:5mm;border-top:1px solid #e0e7ef;padding-top:2.5mm}.v36-invoice-barcode{width:48%;max-width:85mm;height:17mm}.v36-invoice-barcode svg{width:100%;height:100%}.v36-invoice-bottom>div:last-child{text-align:right}.v36-invoice-bottom>div:last-child b{font-size:8pt;display:block}.v36-invoice-bottom>div:last-child small{display:block;font-size:6.5pt;color:#64748b;margin-top:1mm}.v36-invoice-foot{display:flex;justify-content:space-between;border-top:1px dashed #cbd5e1;margin-top:2mm;padding-top:1.6mm;font-size:6.5pt;color:#718096;font-weight:700}@media screen{body{padding:18mm 10mm;background:#e9edf2}.v36-invoice-sheet{margin:0 auto 12mm;background:#fff;box-shadow:0 7px 26px #17203320}.v36-print-controls{position:fixed;top:10px;right:12px;display:flex;gap:8px;z-index:99}.v36-print-controls button{border:0;border-radius:7px;padding:10px 15px;background:#153c67;color:#fff;font-weight:700;cursor:pointer}.v36-print-controls button+button{background:#64748b}}@media print{html,body{background:#fff}.v36-print-controls{display:none}}
      </style></head><body>${pages}<div class="v36-print-controls"><button onclick="window.print()">Print Invoice Waybills</button><button onclick="window.close()">Close</button></div></body></html>`;
    const w=window.open('','_blank','width=1100,height=950');if(!w)return toast('Allow popups to print');w.document.open();w.document.write(html);w.document.close();
  }
  const previousPrintSelectedV36=window.printSelectedWaybills;
  const previousPrintShipmentV36=window.printShipment;
  window.printSelectedWaybills=function(layoutNo=1){
    if(Number(layoutNo)!==3)return previousPrintSelectedV36?.(layoutNo);
    const ids=$$('.ship-file-check:checked').map(x=>x.value);if(!ids.length)return toast('Select at least one shipped file');
    const orders=[];let firstShipment=null;ids.forEach(id=>{const sh=db.shipped.find(x=>x.id===id);if(!sh)return;if(!firstShipment)firstShipment=sh;shipmentOrders(sh).forEach(o=>orders.push(o));});
    if(!orders.length)return toast('No orders available for printing');printLayout3(orders,firstShipment||{});
  };
  window.printShipment=function(id,layoutNo=1){
    const sh=db.shipped.find(x=>x.id===id);if(!sh)return;
    if(Number(layoutNo)!==3)return previousPrintShipmentV36?.(id,layoutNo);
    printLayout3(shipmentOrders(sh),sh);
  };

  // Add polished styles without changing the existing themes or older waybill layouts.
  const style=document.createElement('style');style.id='v36-analytics-styles';style.textContent=`
    .v36-dashboard-analytics{margin-top:18px;padding:22px;border:1px solid var(--line,#e5eaf1);border-radius:18px}.v36-section-head,.v36-tier-head,.v36-table-caption{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.v36-section-head h3{margin:5px 0 4px;font-size:20px}.v36-section-head p{margin:0;color:var(--muted,#697586);font-size:13px}.v36-live-pill{font-size:10px;font-weight:800;letter-spacing:1px;padding:7px 10px;border-radius:20px;background:#eaf5ef;color:#16734a;white-space:nowrap}.v36-filter-row{display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin:16px 0}.v36-filter-row .field{min-width:155px;flex:0 1 190px}.v36-filter-row input,.v36-filter-row select{width:100%}.v36-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.v36-chart-tile{border:1px solid var(--line,#e5eaf1);border-radius:13px;padding:14px 15px;background:var(--card,#fff);min-width:0}.v36-chart-tile-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;color:var(--muted,#617087);font-weight:700}.v36-chart-tile-head strong{font-size:17px;color:var(--text,#172033);white-space:nowrap}.v36-spark{width:100%;height:112px;display:block;margin-top:7px;overflow:visible}.v36-spark .v36-area{fill:rgba(37,99,235,.09)}.v36-spark .v36-line{fill:none;stroke:#2563eb;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.v36-spark circle{fill:#fff;stroke:#2563eb;stroke-width:2}.v36-spark .v36-axis{stroke:#e7edf4;stroke-width:1}.v36-spark text{font-size:11px;fill:#8a96a8}.v36-chart-empty,.v36-empty-state{padding:26px;text-align:center;color:var(--muted,#697586)}.v36-see-more-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;padding-top:15px;border-top:1px solid var(--line,#e5eaf1)}.v36-master-intro{margin-bottom:14px}.v36-master-help{flex:1;display:flex;flex-direction:column;gap:4px;padding:10px 14px;background:var(--soft,#f5f7fb);border-radius:10px;font-size:13px}.v36-master-table{margin-top:12px}.v36-master-modal{width:min(900px,96vw);max-height:90vh;overflow:auto}.v36-form-section{padding:15px 0;border-bottom:1px solid var(--line,#e5eaf1)}.v36-form-section h4{margin:0 0 12px;font-size:15px}.v36-form-section .note{margin:7px 0 0}.v36-tier-head{align-items:center;margin-bottom:10px}.v36-tier-head .note{margin:3px 0}.v36-tier-table input{width:100%;min-width:75px}.v36-modal-actions{justify-content:flex-end;margin-top:15px}.v36-report-filters{margin-bottom:14px}.v36-search-field{flex:1 1 240px!important}.v36-report-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0}.v36-report-kpis article{padding:15px;border:1px solid var(--line,#e5eaf1);border-radius:12px;background:var(--card,#fff);min-width:0}.v36-report-kpis span{display:block;font-size:12px;color:var(--muted,#697586);margin-bottom:7px}.v36-report-kpis strong{font-size:18px;overflow-wrap:anywhere}.v36-report-table-card{overflow:hidden}.v36-table-caption{padding:15px 17px 11px;align-items:center}.v36-table-caption>div{display:flex;flex-direction:column;gap:4px}.v36-table-caption>div span,.v36-accounting-note,.v36-subcell{font-size:11px;color:var(--muted,#728096)}.v36-report-table{min-width:1500px}.v36-report-table th{white-space:nowrap}.v36-report-table td{vertical-align:middle}.v36-expense-input{width:100px;min-width:80px;padding:7px;border:1px solid var(--line,#dbe2ea);border-radius:7px;background:var(--input,#fff);color:var(--text,#172033)}.v36-status-select{min-width:105px;padding:7px;border:1px solid var(--line,#dbe2ea);border-radius:7px;background:var(--input,#fff);color:var(--text,#172033)}.v36-report-table .num{text-align:right;white-space:nowrap}.v36-subcell{display:block;margin-top:3px;max-width:220px;overflow-wrap:anywhere}.v36-positive{color:#13834f!important}.v36-negative{color:#c33b48!important}.v36-product-row{grid-template-columns:minmax(180px,2fr) minmax(70px,.6fr) minmax(110px,.8fr) minmax(140px,1fr) minmax(130px,.8fr) auto;align-items:end}.v36-product-row select,.v36-product-row input{width:100%}.v36-pack-cost{font-size:11px;color:var(--muted,#68778b);padding:8px 0}.v36-pack-cost b{color:var(--text,#172033)}.v36-product-name{min-width:0}.v36-invoice-card{break-inside:avoid}
    @media(max-width:900px){.v36-chart-grid{grid-template-columns:1fr}.v36-report-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.v36-section-head{align-items:flex-start}.v36-product-row{grid-template-columns:1fr 1fr}.v36-product-name{grid-column:1/-1}.v36-pack-cost{padding:8px}.v36-see-more-row{align-items:flex-start;flex-direction:column}}

    .v37-chart-toggles{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0 8px}.v37-chart-toggles label{display:flex;align-items:center;gap:7px;padding:8px 12px;border:1px solid var(--line,#e2e8f0);border-radius:999px;background:var(--card,#fff);font-size:12px;font-weight:700;cursor:pointer}.v37-chart-toggles input{accent-color:#2563eb}.v37-chart-toggles i,.v37-legend-item i{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--metric-color)}.v37-combined-chart{width:100%;min-width:0}.v37-chart-legend{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0 5px}.v37-legend-item{display:flex;align-items:center;gap:7px;padding:8px 10px;background:var(--soft,#f6f8fb);border-radius:9px;font-size:12px}.v37-legend-item strong{margin-left:5px}.v37-line-chart{width:100%;height:auto;display:block;min-height:220px;overflow:visible}.v37-table-toggle{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.v37-toggle-buttons{display:flex;gap:8px;flex-wrap:wrap}.v37-commission-card{margin-top:18px}.v37-commission-card .table{min-width:300px}
    .v36-report-table{min-width:2050px}.v36-report-table th.v38-expense-cell,.v36-report-table td.v38-expense-cell{background:#fff0f0!important;color:#a13c46!important}.v36-report-table .v38-expense-cell .v36-expense-input{background:#fff8f8!important;border-color:#efc2c6!important;color:#91343e!important}.v36-report-table th.v38-profit-cell,.v36-report-table td.v38-profit-cell{background:#eaf7ee!important;color:#137447!important;font-weight:800}.v36-report-table tfoot .v38-expense-cell{font-weight:800}.v38-kpi-profit{color:#13834f!important}.v38-return-note{color:#b63e4a!important;font-weight:700}.v36-report-table tfoot td{font-weight:700}
    @media(max-width:600px){.v37-table-toggle{align-items:flex-start;flex-direction:column}.v37-chart-legend{gap:6px}.v37-legend-item{flex-wrap:wrap}}
    @media(max-width:540px){.v36-dashboard-analytics{padding:14px}.v36-report-kpis{grid-template-columns:1fr 1fr}.v36-report-kpis strong{font-size:15px}.v36-section-head h3{font-size:17px}.v36-live-pill{display:none}.v36-filter-row .field{flex:1 1 100%}.v36-tier-head{align-items:flex-start;flex-direction:column}}
  `;document.head.appendChild(style);
})();


/* ===== V40 requested refinements: cost label, staff dashboard, company details ===== */
(function(){
  // Dashboard menu is available to staff as their own personal dashboard.
  const _applyMenuV40=applyMenu;
  applyMenu=function(){
    _applyMenuV40();
    $$('.dashboard-role-only').forEach(el=>el.style.display='');
  };
  const _permittedV40=permitted;
  permitted=function(route){
    if(route==='dashboard') return true;
    return _permittedV40(route);
  };
  const _renderV40=render;
  render=function(){
    if(!db.session)return loginScreen();
    let route=location.hash.slice(1)||'dashboard';
    if(!routeTitles[route]||!permitted(route)) route='dashboard';
    setPage(route);(pages[route]||pages.dashboard)();
  };

  const _dashboardV40=dashboard;
  dashboard=function(){
    const role=db.session?.role;
    if(!['Sales','Shipping','Staff'].includes(role)){_dashboardV40();return;}
    const staff=currentUser(),sid=staff?.id,companyId=currentCompanyId();
    const ownOrders=(db.orders||[]).filter(o=>o.companyId===companyId&&(o.createdById===sid||o.staffId===sid||o.createdBy===staff?.name||o.staff===staff?.name));
    const total=ownOrders.length,confirmed=ownOrders.filter(o=>['Confirmed','Shipped','Delivered','Returned','Packed'].includes(o.status)).length;
    const delivered=ownOrders.filter(o=>o.status==='Delivered').length,returned=ownOrders.filter(o=>o.status==='Returned').length;
    const pct=(n,d)=>d?Math.round(n/d*100):0;
    const leads=(db.leads||[]).filter(l=>l.companyId===companyId&&(l.assignedStaffId===sid||l.staff===staff?.name)).length;
    const company=companyName(companyId);
    const donut=(label,value,color,sub)=>`<div class="v40-donut-card"><div class="v40-donut" style="--v40-value:${value};--v40-color:${color}"><span>${value}%</span></div><div><b>${label}</b><small>${sub}</small></div></div>`;
    layout(`<div class="v40-staff-hero"><div><span class="eyebrow">PERSONAL PERFORMANCE</span><h2>Staff Dashboard</h2><p>${esc(staff?.name||'Staff')} · ${esc(company)}</p></div><div class="v40-staff-badge">My performance</div></div>
      <div class="grid kpi-grid v40-staff-kpis">
       <div class="card kpi gradient-blue"><div class="label">MY ORDERS</div><div class="value">${total}</div><div class="meta">Orders created by me</div></div>
       <div class="card kpi gradient-purple"><div class="label">MY LEADS</div><div class="value">${leads}</div><div class="meta">Assigned leads</div></div>
       <div class="card kpi gradient-green"><div class="label">CONFIRMED</div><div class="value">${confirmed}</div><div class="meta">${pct(confirmed,total)}% confirm rate</div></div>
       <div class="card kpi gradient-cyan"><div class="label">DELIVERED</div><div class="value">${delivered}</div><div class="meta">${pct(delivered,total)}% delivered rate</div></div>
       <div class="card kpi gradient-red"><div class="label">RETURNED</div><div class="value">${returned}</div><div class="meta">${pct(returned,total)}% return rate</div></div>
      </div>
      <div class="v40-staff-charts">
       <section class="card v40-staff-chart"><div class="panel-title">My Order Status</div><p class="note">Live order status distribution</p><div class="v40-status-donut" style="--pending:${total?ownOrders.filter(o=>o.status==='Pending').length/total*100:0}%;--confirmed:${total?confirmed/total*100:0}%;--delivered:${total?delivered/total*100:0}%;--returned:${total?returned/total*100:0}%"><div><strong>${total}</strong><small>Total Orders</small></div></div><div class="v40-chart-legend"><span><i style="background:#f59e0b"></i>Pending ${ownOrders.filter(o=>o.status==='Pending').length}</span><span><i style="background:#2563eb"></i>Confirmed ${confirmed}</span><span><i style="background:#16a34a"></i>Delivered ${delivered}</span><span><i style="background:#ef4444"></i>Returned ${returned}</span></div></section>
       <section class="card v40-staff-chart"><div class="panel-title">My Performance Rates</div><p class="note">Order conversion and delivery results</p><div class="v40-rate-grid">${donut('Confirm Rate',pct(confirmed,total),'#2563eb',`${confirmed} / ${total} orders`)}${donut('Delivered Rate',pct(delivered,total),'#16a34a',`${delivered} / ${total} orders`)}${donut('Return Rate',pct(returned,total),'#ef4444',`${returned} / ${total} orders`)}</div></section>
      </div>
      <div class="v40-staff-actions"><button class="btn btn-primary" onclick="navTo('new-order')">＋ Create Order</button><button class="btn btn-outline" onclick="navTo('pending-orders')">My Orders</button><button class="btn btn-outline" onclick="navTo('settings')">Settings</button></div>`);
  };

  // Company details modal for Owner: required manager/address/phone and optional uploaded document.
  window.showCompanyDetailsV40=function(id){
    const c=db.companies.find(x=>x.id===id);if(!c)return;
    const mask=document.createElement('div');mask.className='modal-mask';
    mask.innerHTML=`<div class="modal v40-company-modal"><div class="panel-head"><div><div class="eyebrow">COMPANY PROFILE</div><h3>${esc(c.name)}</h3></div><button class="btn btn-outline" onclick="this.closest('.modal-mask').remove()">Close</button></div><div class="v40-company-detail-grid"><div><small>Manager Name (with initials)</small><b>${esc(c.manager||'—')}</b></div><div><small>Company Address</small><b>${esc(c.address||'—')}</b></div><div><small>Phone Number</small><b>${esc(c.phone||'—')}</b></div><div><small>Admin Login</small><b>${esc(c.adminEmail||'—')}</b></div><div><small>Attached Document</small><b>${c.attachment?.name?esc(c.attachment.name):'Not attached'}</b>${c.attachment?.data?`<a class="btn btn-outline btn-small" download="${esc(c.attachment.name)}" href="${c.attachment.data}">View / Download</a>`:''}</div></div></div>`;
    document.body.appendChild(mask);
  };
  const _companyListV40=companyList;
  companyList=function(){
    _companyListV40();
    if(db.session?.role!=='Owner')return;
    $$('#content tbody tr').forEach(tr=>{
      const cell=tr.children[1];if(!cell||cell.querySelector('.v40-company-info'))return;
      const name=cell.querySelector('b')?.textContent||'';
      const c=db.companies.find(x=>x.name===name);if(!c)return;
      const btn=document.createElement('button');btn.className='v40-company-info';btn.type='button';btn.title='View company details';btn.textContent='ⓘ';btn.onclick=()=>showCompanyDetailsV40(c.id);
      cell.insertBefore(btn,cell.firstChild);
    });
  };
})();


(function(){
 const st=document.createElement('style');st.id='v40-staff-company-styles';st.textContent=`
 .v40-staff-hero{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:24px 28px;border-radius:20px;margin-bottom:18px;background:linear-gradient(120deg,#172554,#2563eb 55%,#7c3aed);color:#fff;box-shadow:0 12px 30px #1e40af20}.v40-staff-hero h2{margin:7px 0;font-size:27px}.v40-staff-hero p{margin:0;color:#dbeafe}.v40-staff-badge{padding:10px 14px;border-radius:999px;background:#ffffff22;border:1px solid #ffffff45;font-weight:700}.v40-staff-kpis{margin-bottom:18px}.v40-staff-charts{display:grid;grid-template-columns:1fr 1fr;gap:16px}.v40-staff-chart{padding:22px;min-width:0}.v40-staff-chart .panel-title{font-size:17px}.v40-status-donut{width:190px;height:190px;margin:20px auto;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#f59e0b 0 var(--pending),#2563eb var(--pending) calc(var(--pending) + var(--confirmed)),#16a34a calc(var(--pending) + var(--confirmed)) calc(var(--pending) + var(--confirmed) + var(--delivered)),#ef4444 calc(var(--pending) + var(--confirmed) + var(--delivered)) 100%);position:relative}.v40-status-donut:before{content:"";position:absolute;inset:22px;background:var(--card,#fff);border-radius:50%}.v40-status-donut>div{z-index:1;text-align:center;display:flex;flex-direction:column}.v40-status-donut strong{font-size:30px}.v40-status-donut small{color:var(--muted,#64748b)}.v40-chart-legend{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;font-size:12px}.v40-chart-legend span{display:flex;align-items:center;gap:6px}.v40-chart-legend i{width:9px;height:9px;border-radius:50%;display:inline-block}.v40-rate-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:20px}.v40-donut-card{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:12px 5px;background:var(--soft,#f7f9fc);border-radius:13px}.v40-donut{width:105px;height:105px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--v40-color) calc(var(--v40-value)*1%),#e5eaf1 0);position:relative}.v40-donut:before{content:"";position:absolute;inset:10px;border-radius:50%;background:var(--card,#fff)}.v40-donut span{z-index:1;font-weight:800;font-size:18px}.v40-donut-card b{font-size:13px}.v40-donut-card small{font-size:11px;color:var(--muted,#64748b);display:block}.v40-staff-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.v40-company-info{border:0;background:#e8f1ff;color:#1d4ed8;border-radius:7px;width:25px;height:25px;font-weight:900;cursor:pointer;margin-right:6px}.v40-company-modal{width:min(700px,95vw);padding:22px}.v40-company-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}.v40-company-detail-grid>div{padding:14px;border-radius:12px;background:var(--soft,#f6f8fb);display:flex;flex-direction:column;gap:6px;overflow-wrap:anywhere}.v40-company-detail-grid small{color:var(--muted,#64748b);font-size:11px}.v40-company-detail-grid b{font-size:14px}.v40-company-detail-grid a{align-self:flex-start;margin-top:5px}
 @media(max-width:760px){.v40-staff-charts{grid-template-columns:1fr}.v40-rate-grid{grid-template-columns:1fr 1fr}.v40-company-detail-grid{grid-template-columns:1fr}.v40-staff-hero{align-items:flex-start;flex-direction:column}.v40-staff-hero h2{font-size:22px}}
 `;
 document.head.appendChild(st);
})();


/* ================================================================
   V41 — Staff dashboard visibility and finance refinements
   ================================================================ */
(function(){
  const _dashboardV41 = dashboard;
  dashboard = function(){
    const role = db.session?.role;
    if(!['Sales','Shipping','Staff'].includes(role)) return _dashboardV41();
    const companyId = currentCompanyId();
    const orders = (db.orders||[]).filter(o=>!companyId || o.companyId===companyId);
    const count = status => orders.filter(o=>o.status===status).length;
    const sales = orders.reduce((sum,o)=>sum+Number(o.price||0),0);
    layout(`<div class="v41-staff-dashboard">
      <div class="v41-staff-heading"><div><span class="eyebrow">APEX HOLDINGS • OPERATIONS</span><h2>Staff Dashboard</h2></div><span class="v41-staff-company">${esc(currentUser()?.company||'Company')}</span></div>
      <div class="grid kpi-grid dashboard-kpis v41-staff-kpis">
        <div class="card kpi gradient-blue"><div class="label">TOTAL ORDERS</div><div class="value">${orders.length}</div><div class="meta">All created orders</div></div>
        <div class="card kpi gradient-amber"><div class="label">PENDING ORDERS</div><div class="value">${count('Pending')}</div><div class="meta">Waiting to ship</div></div>
        <div class="card kpi gradient-cyan"><div class="label">SHIPPED</div><div class="value">${count('Shipped')}</div><div class="meta">Shipped orders</div></div>
        <div class="card kpi gradient-red"><div class="label">RETURNED</div><div class="value">${count('Returned')}</div><div class="meta">Received back</div></div>
        <div class="card kpi gradient-green"><div class="label">DELIVERED</div><div class="value">${count('Delivered')}</div><div class="meta">Completed orders</div></div>
        <div class="card kpi gradient-purple"><div class="label">SALES</div><div class="value small-money">${money(sales)}</div><div class="meta">${esc(currentUser()?.company||'This company')}</div></div>
      </div>
      <div class="card panel chart-card premium-panel v41-staff-comparison"><div class="panel-head"><div><div class="panel-title">All Company Comparison</div><div class="panel-sub">7-day order comparison • each company has a separate color</div></div><div class="chart-live-badge">LIVE</div></div><div class="chart">${chart()}</div></div>
    </div>`);
  };
  pages.dashboard=dashboard;
})();

(function(){
  const style=document.createElement('style');
  style.id='v41-staff-dashboard-styles';
  style.textContent=`
    .v36-report-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}
    .v37-line-chart{overflow:visible}
    .v41-staff-dashboard{display:block;min-width:0}
    .v41-staff-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 18px;padding:4px 2px}
    .v41-staff-heading h2{margin:5px 0 0;font-size:25px;color:var(--text,#172033)}
    .v41-staff-company{font-size:13px;font-weight:700;color:var(--muted,#64748b);background:var(--soft,#f5f7fb);border:1px solid var(--line,#e5eaf1);padding:9px 13px;border-radius:999px}
    .v41-staff-kpis{margin-bottom:18px}
    .v41-staff-comparison{padding:20px;min-width:0}
    .v36-expense-input[aria-label="Master Delivery Charge"]{min-width:112px;width:118px}
    @media(max-width:900px){.v36-report-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:540px){.v36-report-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:680px){.v41-staff-heading{align-items:flex-start;flex-direction:column}.v41-staff-heading h2{font-size:22px}.v41-staff-comparison{padding:14px}}
  `;
  document.head.appendChild(style);
})();

/* ================================================================
   V43 — Finance cleanup and role-specific order-rate dashboards
   ================================================================ */
(function(){
  function v43Pct(n,total){return total?Math.round((n/total)*100):0;}
  function v43Confirmed(o){return ['Confirmed','Shipped','Delivered','Returned','Packed','Completed'].includes(o.status);}
  function v43Rates(orders){
    const total=orders.length;
    const confirmed=orders.filter(v43Confirmed).length;
    const delivered=orders.filter(o=>o.status==='Delivered').length;
    const returned=orders.filter(o=>o.status==='Returned').length;
    return {total,confirmed,delivered,returned,confirmRate:v43Pct(confirmed,total),deliveredRate:v43Pct(delivered,total),returnedRate:v43Pct(returned,total)};
  }
  function v43RateCards(r){
    const card=(label,value,color,count)=>`<div class="v40-donut-card v43-donut-card"><div class="v40-donut" style="--v40-value:${value};--v40-color:${color}"><span>${value}%</span></div><div><b>${label}</b><small>${count} / ${r.total} orders</small></div></div>`;
    return `<div class="v43-rates-grid">${card('Confirm Rate',r.confirmRate,'#2563eb',r.confirmed)}${card('Delivered Rate',r.deliveredRate,'#16a34a',r.delivered)}${card('Returned Rate',r.returnedRate,'#ef4444',r.returned)}</div>`;
  }
  function v43StaffOrders(staff){return (db.orders||[]).filter(o=>staffOrderOwnerMatch(o,staff));}
  function v43StaffBoard(companyId){
    const staff=(db.staff||[]).filter(s=>String(s.companyId)===String(companyId)&&s.type==='Sales');
    const leads=(db.leads||[]).filter(l=>String(l.companyId)===String(companyId));
    const best=staff.map(s=>{
      const leadCount=leads.filter(l=>l.assignedStaffId===s.id||(!l.assignedStaffId&&l.staff===s.name)).length;
      const orders=v43StaffOrders(s);const delivered=orders.filter(o=>o.status==='Delivered').length;
      return {name:s.name,leads:leadCount,orders:orders.length,delivered,score:leadCount+orders.length+delivered};
    }).sort((a,b)=>b.score-a.score||b.delivered-a.delivered||b.orders-a.orders).slice(0,5);
    const sales=staff.map(s=>{
      const orders=v43StaffOrders(s);const delivered=orders.filter(o=>o.status==='Delivered');
      return {name:s.name,value:delivered.reduce((sum,o)=>sum+Number(o.price||0),0),orders:delivered.length};
    }).sort((a,b)=>b.value-a.value).slice(0,5);
    const rows=(list,kind)=>list.map((x,i)=>`<tr><td><span class="rank-badge">${i+1}</span></td><td><b>${esc(x.name)}</b></td><td>${kind==='best'?`${x.leads} leads · ${x.orders} orders · ${x.delivered} delivered`:`${x.orders} delivered orders`}</td><td><strong>${kind==='best'?x.score:money(x.value)}</strong></td></tr>`).join('')||`<tr><td colspan="4" class="empty">No data available</td></tr>`;
    return `<section class="v43-staff-leaderboard"><div class="card panel v43-board-card"><div class="panel-head"><div><div class="panel-title">Best Call Centre</div><div class="panel-sub">Top staff in your company</div></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Rank</th><th>Staff</th><th>Activity</th><th>Score</th></tr></thead><tbody>${rows(best,'best')}</tbody></table></div></div><div class="card panel v43-board-card"><div class="panel-head"><div><div class="panel-title">Sales Performance</div><div class="panel-sub">Delivered sales by staff</div></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Rank</th><th>Staff</th><th>Orders</th><th>Sales</th></tr></thead><tbody>${rows(sales,'sales')}</tbody></table></div></div></section>`;
  }
  function v43StaffExtras(){
    const staff=currentUser(),companyId=currentCompanyId();if(!staff)return;
    const orders=v43StaffOrders(staff),rates=v43Rates(orders);
    const root=document.getElementById('content');if(!root)return;
    root.insertAdjacentHTML('beforeend',`<section class="card panel v43-staff-rates"><div class="panel-head"><div><div class="panel-title">My Order Performance</div><div class="panel-sub">Your orders and live order conversion rates</div></div><div class="v43-order-total"><strong>${rates.total}</strong><span>My Orders</span></div></div>${v43RateCards(rates)}</section>${v43StaffBoard(companyId)}`);
  }
  function v43DashboardRateMarkup(role){
    const isOwner=role==='Owner';
    const opts=isOwner
      ?(db.companies||[]).map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')
      :(db.staff||[]).filter(s=>String(s.companyId)===String(currentCompanyId())&&['Sales','Shipping'].includes(s.type)).map(s=>`<option value="${esc(s.id)}">${esc(s.name)} (${esc(s.type)})</option>`).join('');
    const first=isOwner?db.companies?.[0]?.id:db.staff?.find(s=>String(s.companyId)===String(currentCompanyId())&&['Sales','Shipping'].includes(s.type))?.id;
    const root=document.getElementById('content');if(!root)return;
    root.insertAdjacentHTML('beforeend',`<section class="card panel v43-role-rates"><div class="panel-head"><div><div class="panel-title">${isOwner?'Company Order Rates':'Staff Order Rates'}</div><div class="panel-sub">Select ${isOwner?'a company':'a staff member'} to view confirmation, delivery and return performance</div></div></div><div class="v43-rate-filter field"><label>${isOwner?'Company':'Staff Member'}</label><select id="v43DashboardRateSelect" onchange="renderV43DashboardRates(this.value)">${opts||'<option value="">No data available</option>'}</select></div><div id="v43DashboardRatesChart"></div></section>`);
    if(first!==undefined&&first!==null)window.renderV43DashboardRates(String(first));
  }
  window.renderV43DashboardRates=function(selected){
    const host=document.getElementById('v43DashboardRatesChart');if(!host)return;
    const role=db.session?.role;let orders=[],subject='';
    if(role==='Owner'){
      const c=(db.companies||[]).find(x=>String(x.id)===String(selected));if(!c){host.innerHTML='<div class="v36-empty-state">No companies available.</div>';return;}
      subject=c.name;orders=(db.orders||[]).filter(o=>String(o.companyId)===String(c.id));
    }else if(role==='Admin'){
      const st=(db.staff||[]).find(x=>String(x.id)===String(selected)&&String(x.companyId)===String(currentCompanyId())&&['Sales','Shipping'].includes(x.type));
      if(!st){host.innerHTML='<div class="v36-empty-state">No staff members available.</div>';return;}
      subject=st.name;orders=v43StaffOrders(st);
    }else return;
    const rates=v43Rates(orders);
    host.innerHTML=`<div class="v43-rate-summary"><div class="v43-order-total"><strong>${rates.total}</strong><span>${esc(subject)} · Orders</span></div></div>${v43RateCards(rates)}`;
  };
  const _dashboardV43=dashboard;
  dashboard=function(){
    const role=db.session?.role;
    _dashboardV43();
    if(['Sales','Shipping','Staff'].includes(role))v43StaffExtras();
    else if(['Owner','Admin'].includes(role))v43DashboardRateMarkup(role);
  };
  pages.dashboard=dashboard;
  const style=document.createElement('style');style.id='v43-dashboard-finance-styles';style.textContent=`
    .v36-report-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}
    .v36-report-table{min-width:1950px}
    .v36-report-table th.v38-expense-cell,.v36-report-table td.v38-expense-cell{background:#fff0f0!important;color:#a13c46!important}
    .v36-report-table th.v38-profit-cell,.v36-report-table td.v38-profit-cell{background:#eaf7ee!important;color:#137447!important;font-weight:800}
    .v43-role-rates,.v43-staff-rates{margin-top:16px;padding:18px;min-width:0}
    .v43-rate-filter{width:min(340px,100%);margin:14px 0 8px}
    .v43-rate-filter select{width:100%}
    .v43-rates-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
    .v43-donut-card{padding:9px 6px;min-width:0}
    .v43-donut-card .v40-donut{width:86px;height:86px}
    .v43-donut-card .v40-donut:before{inset:9px}
    .v43-donut-card .v40-donut span{font-size:16px}
    .v43-order-total{display:flex;align-items:center;gap:9px;padding:8px 12px;border-radius:12px;background:#eff6ff;color:#1d4ed8}
    .v43-order-total strong{font-size:22px}.v43-order-total span{font-size:12px;font-weight:700}
    .v43-rate-summary{margin-top:10px}
    .v43-staff-leaderboard{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px}
    .v43-board-card{padding:16px;min-width:0}
    .v43-board-card .table{min-width:460px}
    .v43-staff-rates .panel-head{align-items:center}
    @media(max-width:760px){.v43-staff-leaderboard{grid-template-columns:1fr}.v43-rates-grid{gap:6px}.v43-donut-card{padding:8px 2px}.v43-donut-card b{font-size:11px}.v43-donut-card small{font-size:10px}.v43-order-total strong{font-size:19px}}
    @media(max-width:540px){.v36-report-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.v43-rates-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
  `;document.head.appendChild(style);
})();



/* ===== V44 OWNER MONTHLY STOCK INCOME DASHBOARD ===== */
(function(){
  const style=document.createElement('style');
  style.id='v44-owner-stock-income-style';
  style.textContent=`
    .v44-stock-income{margin:0 0 18px;padding:20px;min-width:0}
    .v44-stock-income-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}
    .v44-stock-income-head h3{margin:4px 0 5px;font-size:19px;color:var(--text,#172033)}
    .v44-stock-income-head p{margin:0;color:var(--muted,#718096);font-size:12px}
    .v44-stock-income-total{min-width:190px;padding:13px 16px;border:1px solid #ccebd9;border-radius:13px;background:linear-gradient(135deg,#f0fff6,#e7f8ef)}
    .v44-stock-income-total span{display:block;color:#32734f;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
    .v44-stock-income-total strong{display:block;margin-top:4px;color:#137447;font-size:25px;line-height:1.2}
    .v44-stock-income-filters{display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin:16px 0}
    .v44-stock-income-filters .field{min-width:160px;max-width:220px;flex:1}
    .v44-stock-income-filters input{width:100%}
    .v44-stock-income-chart-wrap{overflow-x:auto;overflow-y:hidden;padding:8px 0 12px;border-bottom:1px solid var(--line,#e8edf4)}
    .v44-stock-income-chart{display:flex;align-items:stretch;gap:12px;min-width:max-content;height:218px;padding:0 4px}
    .v44-stock-income-month{width:76px;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:7px}
    .v44-stock-income-bar-area{height:165px;width:100%;display:flex;align-items:flex-end;justify-content:center;border-bottom:1px solid #dce5ed;position:relative}
    .v44-stock-income-bar{width:34px;min-height:2px;border-radius:7px 7px 2px 2px;background:linear-gradient(180deg,#35b779,#168452);position:relative}
    .v44-stock-income-bar:hover{filter:brightness(.94)}
    .v44-stock-income-bar-label{font-size:10px;font-weight:800;color:#168452;white-space:nowrap;position:absolute;bottom:calc(100% + 5px);left:50%;transform:translateX(-50%)}
    .v44-stock-income-month-label{font-size:11px;font-weight:700;color:var(--muted,#64748b);white-space:nowrap}
    .v44-stock-income-history{margin-top:14px}
    .v44-stock-income-history-title{font-size:13px;font-weight:800;margin-bottom:8px}
    .v44-stock-income-history-scroll{max-height:260px;overflow:auto;border:1px solid var(--line,#e8edf4);border-radius:10px}
    .v44-stock-income-history table{width:100%;border-collapse:collapse;min-width:360px}
    .v44-stock-income-history th,.v44-stock-income-history td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--line,#edf0f5);font-size:12px}
    .v44-stock-income-history th{position:sticky;top:0;background:var(--soft,#f7f9fc);z-index:1;color:var(--muted,#64748b)}
    .v44-stock-income-history td:last-child,.v44-stock-income-history th:last-child{text-align:right}
    .v44-stock-income-positive{color:#137447;font-weight:800}
    @media(max-width:640px){.v44-stock-income{padding:14px}.v44-stock-income-total{width:100%}.v44-stock-income-filters .field{min-width:calc(50% - 8px)}}
  `;
  document.head.appendChild(style);

  const v44Money=value=>typeof money==='function'?money(Number(value||0)):`Rs. ${Number(value||0).toLocaleString('en-LK',{maximumFractionDigits:2})}`;
  const v44MonthLabel=key=>{
    const [y,m]=key.split('-').map(Number);
    return new Date(y,m-1,1).toLocaleDateString('en-GB',{month:'short',year:'numeric'});
  };
  const v44DateKey=value=>{
    if(!value)return '';
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return '';
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const v44MonthKey=value=>value.slice(0,7);
  const v44DefaultStart=()=>{
    const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-11);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;
  };
  function v44ApprovedStockRows(){
    return (db.stockRequests||[]).filter(r=>String(r.status||'').toLowerCase()==='approved').map(r=>{
      const date=v44DateKey(r.approvedAt||r.date);
      const amount=Number(r.total??(Number(r.qty||0)*Number(r.unitCost||45)));
      return {date,month:date?v44MonthKey(date):'',amount:Number.isFinite(amount)?amount:0,request:r};
    }).filter(x=>x.date);
  }
  function v44StockIncomeMarkup(){
    const todayKey=v44DateKey(new Date());
    return `<section class="card v44-stock-income" id="v44OwnerStockIncome">
      <div class="v44-stock-income-head">
        <div><div class="eyebrow">OWNER FINANCIAL OVERVIEW</div><h3>Monthly Stock Income</h3><p>Income from company stock requests approved by the Owner</p></div>
        <div class="v44-stock-income-total"><span>Stock Income · Selected Period</span><strong id="v44StockIncomeTotal">Rs. 0.00</strong></div>
      </div>
      <div class="v44-stock-income-filters">
        <div class="field"><label for="v44StockIncomeStart">Start Date</label><input id="v44StockIncomeStart" type="date" value="${v44DefaultStart()}" max="${todayKey}"></div>
        <div class="field"><label for="v44StockIncomeEnd">End Date</label><input id="v44StockIncomeEnd" type="date" value="${todayKey}" max="${todayKey}"></div>
        <button class="btn btn-outline" type="button" id="v44StockIncomeReset">Last 12 Months</button>
      </div>
      <div class="v44-stock-income-chart-wrap"><div class="v44-stock-income-chart" id="v44StockIncomeChart"></div></div>
      <div class="v44-stock-income-history"><div class="v44-stock-income-history-title">Monthly Stock Income History</div>
        <div class="v44-stock-income-history-scroll"><table><thead><tr><th>Month</th><th>Approved Requests</th><th>Stock Income</th></tr></thead><tbody id="v44StockIncomeHistory"></tbody></table></div>
      </div>
    </section>`;
  }
  function renderV44StockIncome(){
    const root=$('#v44OwnerStockIncome');if(!root||db.session?.role!=='Owner')return;
    const start=$('#v44StockIncomeStart')?.value||v44DefaultStart();
    const end=$('#v44StockIncomeEnd')?.value||v44DateKey(new Date());
    const totalEl=$('#v44StockIncomeTotal'),chart=$('#v44StockIncomeChart'),history=$('#v44StockIncomeHistory');
    if(!chart||!history)return;
    if(start>end){if(totalEl)totalEl.textContent='Invalid date range';chart.innerHTML='<div class="v36-empty-state">Start Date must be before End Date.</div>';history.innerHTML='';return;}
    const rows=v44ApprovedStockRows().filter(x=>x.date>=start&&x.date<=end);
    const monthly=new Map();
    rows.forEach(x=>{
      const old=monthly.get(x.month)||{month:x.month,total:0,count:0};
      old.total+=x.amount;old.count++;monthly.set(x.month,old);
    });
    const [sy,sm]=start.slice(0,7).split('-').map(Number),[ey,em]=end.slice(0,7).split('-').map(Number);
    const months=[];
    for(let y=sy,m=sm;y<ey||(y===ey&&m<=em);){const key=`${y}-${String(m).padStart(2,'0')}`;months.push(monthly.get(key)||{month:key,total:0,count:0});m++;if(m>12){m=1;y++;}}
    const total=rows.reduce((sum,x)=>sum+x.amount,0);
    if(totalEl)totalEl.textContent=v44Money(total);
    const max=Math.max(1,...months.map(x=>x.total));
    chart.innerHTML=months.map(x=>{
      const height=x.total?Math.max(4,Math.round(x.total/max*132)):0;
      return `<div class="v44-stock-income-month"><div class="v44-stock-income-bar-area">${x.total?`<div class="v44-stock-income-bar" style="height:${height}px"><span class="v44-stock-income-bar-label">${esc(v44Money(x.total))}</span></div>`:''}</div><div class="v44-stock-income-month-label">${esc(v44MonthLabel(x.month))}</div></div>`;
    }).join('');
    history.innerHTML=months.slice().reverse().map(x=>`<tr><td><b>${esc(v44MonthLabel(x.month))}</b>${x.month===v44MonthKey(v44DateKey(new Date()))?'<div class="note">Current month · ongoing</div>':''}</td><td>${x.count}</td><td class="v44-stock-income-positive">${v44Money(x.total)}</td></tr>`).join('')||'<tr><td colspan="3" class="empty">No approved stock income in this date range.</td></tr>';
  }
  const _dashboardV44=dashboard;
  dashboard=function(){
    _dashboardV44();
    if(db.session?.role!=='Owner')return;
    const root=$('#content');
    if(!root||$('#v44OwnerStockIncome'))return;
    const analytics=root.querySelector('#v36DashboardAnalytics');
    if(analytics)analytics.insertAdjacentHTML('beforebegin',v44StockIncomeMarkup());
    else root.insertAdjacentHTML('beforeend',v44StockIncomeMarkup());
    $('#v44StockIncomeStart')?.addEventListener('change',renderV44StockIncome);
    $('#v44StockIncomeEnd')?.addEventListener('change',renderV44StockIncome);
    $('#v44StockIncomeReset')?.addEventListener('click',()=>{
      const a=$('#v44StockIncomeStart'),b=$('#v44StockIncomeEnd');
      if(a)a.value=v44DefaultStart();if(b)b.value=v44DateKey(new Date());renderV44StockIncome();
    });
    renderV44StockIncome();
  };
  pages.dashboard=dashboard;
})();
