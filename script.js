const KEY="gustagumi_v3_data";
let data=JSON.parse(localStorage.getItem(KEY)||'{"pedidos":[],"clientes":[],"custos":[]}');
let currentMonth=new Date(),selectedDate=null,currentPhoto="";
const $=id=>document.getElementById(id);
const brl=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const total=p=>Math.max(0,(+p.qtd||0)*(+p.unit||0)-(+p.descR||0));
const rest=p=>Math.max(0,total(p)-(+p.pago||0));
const lucro=p=>total(p)-(+p.custo||0);
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function dateBR(s){return s?new Date(s+"T00:00:00").toLocaleDateString("pt-BR"):""}
function showSection(id){
 document.querySelectorAll(".section").forEach(s=>s.classList.toggle("active",s.id===id));
 document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.section===id));
 $("pageTitle").textContent={inicio:"Olá! 👋",pedidos:"Pedidos",clientes:"Clientes",agenda:"Agenda de entregas",financeiro:"Controle financeiro",calculadora:"Calculadora de preço"}[id];
 if(id==="inicio")renderHome(); if(id==="pedidos")renderPedidos(); if(id==="clientes")renderClientes(); if(id==="agenda")renderCalendar(); if(id==="financeiro")renderFinance();
}
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>showSection(b.dataset.section));
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>showSection(b.dataset.go));
$("quickNew").onclick=()=>openPedido();$("newPedido").onclick=()=>openPedido();$("newCliente").onclick=()=>openCliente();$("newExpense").onclick=()=>openExpense();

function renderHome(){
 const ps=data.pedidos, received=ps.reduce((a,p)=>a+(+p.pago||0),0), receivable=ps.reduce((a,p)=>a+rest(p),0), profit=ps.reduce((a,p)=>a+lucro(p),0);
 $("stats").innerHTML=`<div class="stat"><small>Pedidos</small><strong>${ps.length}</strong></div><div class="stat"><small>Em produção</small><strong>${ps.filter(p=>p.status==="Em produção").length}</strong></div><div class="stat"><small>Prontos</small><strong>${ps.filter(p=>p.status==="Pronto").length}</strong></div><div class="stat"><small>Lucro estimado</small><strong>${brl(profit)}</strong></div>`;
 const upcoming=ps.filter(p=>p.prazo&&p.status!=="Entregue").sort((a,b)=>a.prazo.localeCompare(b.prazo)).slice(0,5);
 $("homeAgenda").innerHTML=upcoming.length?upcoming.map(p=>`<div class="item-card"><b>${esc(p.cliente)}</b> — ${esc(p.produto)}<p>📅 ${dateBR(p.prazo)} · ${esc(p.status)}</p></div>`).join(""):'<div class="empty">Nenhuma entrega próxima.</div>';
 $("homeFinance").innerHTML=`<div class="money-card"><span>Recebido</span><strong>${brl(received)}</strong></div><div class="money-card"><span>A receber</span><strong>${brl(receivable)}</strong></div>`;
}
function renderPedidos(){
 let q=$("searchPedido").value.toLowerCase(),f=$("filterPedido").value;
 let ps=data.pedidos.filter(p=>(!q||`${p.cliente} ${p.produto} ${p.desc}`.toLowerCase().includes(q))&&(!f||p.status===f));
 $("pedidoList").innerHTML=ps.length?ps.map(p=>`<article class="item-card"><div class="item-top"><div><h3>${esc(p.cliente)}</h3><p><b>${p.qtd}x ${esc(p.produto)}</b>${p.detalhes?" — "+esc(p.detalhes):""}</p></div><span class="badge">${esc(p.status)}</span></div>${p.foto?`<img src="${p.foto}" style="width:110px;height:80px;object-fit:cover;border-radius:10px;margin-top:8px">`:""}${p.desc?`<p>${esc(p.desc)}</p>`:""}<p>💰 Total <b>${brl(total(p))}</b> · Pago ${brl(p.pago)} · Restante <b>${brl(rest(p))}</b></p><p>📈 Lucro estimado: <b>${brl(lucro(p))}</b></p>${p.prazo?`<p>📅 Entrega: ${dateBR(p.prazo)}</p>`:""}<div class="actions"><button class="secondary" onclick="editPedido('${p.id}')">Editar</button><button class="secondary" onclick="quotePedido('${p.id}')">Orçamento</button>${p.whats?`<button class="secondary" onclick="sendWhats('${p.id}')">WhatsApp</button>`:""}<button class="danger" onclick="deletePedido('${p.id}')">Excluir</button></div></article>`).join(""):'<div class="panel empty">Nenhum pedido encontrado.</div>';
}
$("searchPedido").oninput=renderPedidos;$("filterPedido").onchange=renderPedidos;

function openPedido(p=null){
 $("modal").classList.remove("hidden");$("modalTitle").textContent=p?"Editar pedido":"Novo pedido";$("pedidoForm").reset();currentPhoto=p?.foto||"";
 if(p){$("pedidoId").value=p.id;$("pCliente").value=p.cliente;$("pWhats").value=p.whats;$("pProduto").value=p.produto;$("pQtd").value=p.qtd;$("pDetalhes").value=p.detalhes;$("pPrazo").value=p.prazo;$("pDesc").value=p.desc;$("pUnit").value=p.unit;$("pDescR").value=p.descR;$("pCusto").value=p.custo;$("pPago").value=p.pago;$("pStatus").value=p.status;$("pPagamento").value=p.pagamento||"Não informado"}else{$("pQtd").value=1;$("pDescR").value=0;$("pCusto").value=0;$("pPago").value=0;$("pStatus").value="Aguardando";$("pPagamento").value="Não informado"}
 showPhoto();calcForm()
}
function closePedido(){$("modal").classList.add("hidden")}
$("closeModal").onclick=closePedido;$("modal").onclick=e=>{if(e.target===$("modal"))closePedido()};
["pQtd","pUnit","pDescR","pCusto","pPago"].forEach(id=>$(id).oninput=calcForm);
function calcForm(){let t=Math.max(0,(+$("pQtd").value||0)*(+$("pUnit").value||0)-(+$("pDescR").value||0)),r=Math.max(0,t-(+$("pPago").value||0)),l=t-(+$("pCusto").value||0);$("pTotal").textContent=brl(t);$("pRestante").textContent="Restante: "+brl(r);$("pLucro").textContent="Lucro estimado: "+brl(l);$("pLucro").className=l>=0?"profit-good":""}
$("pFoto").onchange=e=>{let f=e.target.files[0];if(!f)return;let reader=new FileReader();reader.onload=()=>{currentPhoto=reader.result;showPhoto()};reader.readAsDataURL(f)};
function showPhoto(){$("photoPreview").innerHTML=currentPhoto?`<img src="${currentPhoto}" alt="Foto do produto">`:""}
$("pedidoForm").onsubmit=e=>{e.preventDefault();let id=$("pedidoId").value||crypto.randomUUID();let p={id,cliente:$("pCliente").value.trim(),whats:$("pWhats").value.trim(),produto:$("pProduto").value,qtd:+$("pQtd").value,detalhes:$("pDetalhes").value,prazo:$("pPrazo").value,desc:$("pDesc").value.trim(),unit:+$("pUnit").value,descR:+$("pDescR").value||0,custo:+$("pCusto").value||0,pago:+$("pPago").value||0,status:$("pStatus").value,pagamento:$("pPagamento").value,foto:currentPhoto};let i=data.pedidos.findIndex(x=>x.id===id);i>=0?data.pedidos[i]=p:data.pedidos.unshift(p);save();closePedido();renderPedidos();renderHome();};
function editPedido(id){let p=data.pedidos.find(x=>x.id===id);if(p)openPedido(p)}
function deletePedido(id){if(confirm("Excluir este pedido?")){data.pedidos=data.pedidos.filter(p=>p.id!==id);save();renderPedidos();renderHome()}}
function sendWhats(id){let p=data.pedidos.find(x=>x.id===id);if(!p)return;let msg=`Olá, ${p.cliente}! 🧶%0A%0ASeu pedido: ${p.qtd}x ${p.produto}%0AValor total: ${brl(total(p))}%0AValor pago: ${brl(p.pago)}%0ARestante: ${brl(rest(p))}${p.prazo?`%0AEntrega: ${dateBR(p.prazo)}`:""}`;let phone=(p.whats||"").replace(/\D/g,"");window.open(`https://wa.me/${phone}?text=${msg}`,"_blank")}

function renderClientes(){let q=$("searchCliente").value.toLowerCase(),cs=data.clientes.filter(c=>c.nome.toLowerCase().includes(q));$("clienteList").innerHTML=cs.length?cs.map(c=>`<article class="item-card"><div class="item-top"><div><h3>${esc(c.nome)}</h3><p>📱 ${esc(c.whats||"Não informado")}</p>${c.instagram?`<p>📷 ${esc(c.instagram)}</p>`:""}${c.obs?`<p>${esc(c.obs)}</p>`:""}</div><span class="badge">${data.pedidos.filter(p=>p.cliente.toLowerCase()===c.nome.toLowerCase()).length} pedido(s)</span></div><div class="actions"><button class="secondary" onclick="editCliente('${c.id}')">Editar</button><button class="danger" onclick="deleteCliente('${c.id}')">Excluir</button></div></article>`).join(""):'<div class="panel empty">Nenhum cliente cadastrado.</div>'}
$("searchCliente").oninput=renderClientes;
function openCliente(c=null){$("clienteModal").classList.remove("hidden");$("clienteForm").reset();if(c){$("cId").value=c.id;$("cNome").value=c.nome;$("cWhats").value=c.whats;$("cInstagram").value=c.instagram;$("cObs").value=c.obs}}
$("closeCliente").onclick=()=>$("clienteModal").classList.add("hidden");$("clienteModal").onclick=e=>{if(e.target===$("clienteModal"))$("clienteModal").classList.add("hidden")};
$("clienteForm").onsubmit=e=>{e.preventDefault();let id=$("cId").value||crypto.randomUUID(),c={id,nome:$("cNome").value.trim(),whats:$("cWhats").value.trim(),instagram:$("cInstagram").value.trim(),obs:$("cObs").value.trim()};let i=data.clientes.findIndex(x=>x.id===id);i>=0?data.clientes[i]=c:data.clientes.unshift(c);save();$("clienteModal").classList.add("hidden");renderClientes()};
function editCliente(id){let c=data.clientes.find(x=>x.id===id);if(c)openCliente(c)}
function deleteCliente(id){if(confirm("Excluir este cliente?")){data.clientes=data.clientes.filter(c=>c.id!==id);save();renderClientes()}}

function renderCalendar(){
 let y=currentMonth.getFullYear(),m=currentMonth.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),start=first.getDay();
 $("monthLabel").textContent=first.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});
 let h=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(x=>`<div class="cal-head">${x}</div>`).join(""),cells="";
 for(let i=0;i<start;i++)cells+='<div class="day muted"></div>';
 for(let d=1;d<=days;d++){let iso=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`,events=data.pedidos.filter(p=>p.prazo===iso&&p.status!=="Entregue");cells+=`<div class="day ${selectedDate===iso?"selected":""}" onclick="selectDay('${iso}')"><div class="day-num">${d}</div>${events.slice(0,3).map(p=>`<div class="event">${esc(p.cliente)} · ${esc(p.produto)}</div>`).join("")}</div>`}
 $("calendar").innerHTML=h+cells;renderDayDetails()
}
function selectDay(iso){selectedDate=iso;renderCalendar()}
function renderDayDetails(){if(!selectedDate){$("dayDetails").innerHTML="<h3>Selecione um dia</h3><p>Clique em uma data para ver as entregas.</p>";return}let ps=data.pedidos.filter(p=>p.prazo===selectedDate);$("dayDetails").innerHTML=`<h3>Entregas de ${dateBR(selectedDate)}</h3>`+(ps.length?ps.map(p=>`<p>🧶 <b>${esc(p.cliente)}</b> — ${p.qtd}x ${esc(p.produto)} · ${brl(total(p))} <span class="badge">${esc(p.status)}</span></p>`).join(""):"<p>Nenhuma entrega cadastrada.</p>")}
$("prevMonth").onclick=()=>{currentMonth.setMonth(currentMonth.getMonth()-1);renderCalendar()};$("nextMonth").onclick=()=>{currentMonth.setMonth(currentMonth.getMonth()+1);renderCalendar()};

function renderFinance(){
 let ps=data.pedidos,sales=ps.reduce((a,p)=>a+total(p),0),received=ps.reduce((a,p)=>a+(+p.pago||0),0),receivable=ps.reduce((a,p)=>a+rest(p),0),costs=ps.reduce((a,p)=>a+(+p.custo||0),0)+data.custos.reduce((a,e)=>a+(+e.valor||0),0),profit=sales-costs;
 $("financeCards").innerHTML=`<div class="money-card"><span>Vendas</span><strong>${brl(sales)}</strong></div><div class="money-card"><span>Recebido</span><strong>${brl(received)}</strong></div><div class="money-card"><span>A receber</span><strong>${brl(receivable)}</strong></div><div class="money-card"><span>Lucro estimado</span><strong>${brl(profit)}</strong></div>`;
 $("financeList").innerHTML=ps.length?ps.slice(0,15).map(p=>`<div class="item-card"><b>${esc(p.cliente)}</b><p>${esc(p.produto)} · Total ${brl(total(p))}</p><p>Pago ${brl(p.pago)} · A receber ${brl(rest(p))} · Lucro ${brl(lucro(p))}</p></div>`).join(""):"<div class='empty'>Nenhum pedido ainda.</div>";
 $("expenseList").innerHTML=data.custos.length?data.custos.slice().reverse().map(e=>`<div class="item-card"><b>${esc(e.desc)}</b><p>${e.data?dateBR(e.data):"Sem data"} · <strong>${brl(e.valor)}</strong></p><button class="danger" onclick="deleteExpense('${e.id}')">Excluir</button></div>`).join(""):"<div class='empty'>Nenhum custo registrado.</div>"
}
function openExpense(){$("expenseModal").classList.remove("hidden");$("expenseForm").reset();$("eData").value=new Date().toISOString().slice(0,10)}
$("closeExpense").onclick=()=>$("expenseModal").classList.add("hidden");$("expenseModal").onclick=e=>{if(e.target===$("expenseModal"))$("expenseModal").classList.add("hidden")};
$("expenseForm").onsubmit=e=>{e.preventDefault();data.custos.push({id:crypto.randomUUID(),desc:$("eDesc").value.trim(),valor:+$("eValor").value,data:$("eData").value});save();$("expenseModal").classList.add("hidden");renderFinance();renderHome()};
function deleteExpense(id){if(confirm("Excluir este custo?")){data.custos=data.custos.filter(x=>x.id!==id);save();renderFinance();renderHome()}}

function quotePedido(id){
 let p=data.pedidos.find(x=>x.id===id);if(!p)return;
 $("quoteContent").innerHTML=`<img class="quote-logo" src="logo.png.jpeg" alt="Gustagumi"><h2>Gustagumi Amigurumi</h2><p>Orçamento de encomenda</p><hr><div class="quote-line"><span>Cliente</span><b>${esc(p.cliente)}</b></div><div class="quote-line"><span>Produto</span><b>${p.qtd}x ${esc(p.produto)}</b></div>${p.detalhes?`<div class="quote-line"><span>Detalhes</span><b>${esc(p.detalhes)}</b></div>`:""}${p.prazo?`<div class="quote-line"><span>Entrega</span><b>${dateBR(p.prazo)}</b></div>`:""}<div class="quote-line"><span>Valor total</span><b>${brl(total(p))}</b></div><div class="quote-line"><span>Pago</span><b>${brl(p.pago)}</b></div><div class="quote-line"><span>Restante</span><b>${brl(rest(p))}</b></div><p style="margin-top:25px">Obrigada por escolher um trabalho feito à mão! 🧶💗</p>`;
 $("quoteModal").classList.remove("hidden")
}
$("closeQuote").onclick=()=>$("quoteModal").classList.add("hidden");$("printQuote").onclick=()=>window.print();$("quoteModal").onclick=e=>{if(e.target===$("quoteModal"))$("quoteModal").classList.add("hidden")};

showSection("inicio");


/* ===== Calculadora de preço V4 ===== */
const calcKey="gustagumi_v4_calculos";
let calcMaterials=[];
let savedCalcs=JSON.parse(localStorage.getItem(calcKey)||"[]");

function addMaterialRow(material={nome:"",preco:0,qtd:0,unidade:"g"}) {
  const id=crypto.randomUUID();
  calcMaterials.push({...material,id});
  renderMaterialRows();
  calculatePrice();
}
function renderMaterialRows(){
  const box=$("materialRows");
  box.innerHTML=calcMaterials.map((m,i)=>`
    <div class="material-row" data-id="${m.id}">
      <label>Material
        <input class="m-nome" value="${esc(m.nome)}" placeholder="Ex.: Barbante">
      </label>
      <label>Preço do rolo/pacote
        <input class="m-preco" type="number" min="0" step=".01" value="${m.preco}">
      </label>
      <label>Quantidade do rolo
        <input class="m-qtd" type="number" min="0.01" step=".01" value="${m.qtd}">
      </label>
      <label>Usado na peça
        <input class="m-uso" type="number" min="0" step=".01" value="${m.uso||0}">
      </label>
      <button type="button" class="remove-material" onclick="removeMaterial('${m.id}')">×</button>
      <div class="material-total">Custo: <span class="m-total">${brl(materialCost(m))}</span></div>
    </div>
  `).join("") || '<div class="empty">Adicione barbante, fio, cola, enchimento ou outro material.</div>';
  box.querySelectorAll("input").forEach(input=>input.oninput=()=>{
    const row=input.closest(".material-row"), id=row.dataset.id, m=calcMaterials.find(x=>x.id===id);
    m.nome=row.querySelector(".m-nome").value;
    m.preco=+row.querySelector(".m-preco").value||0;
    m.qtd=+row.querySelector(".m-qtd").value||0;
    m.uso=+row.querySelector(".m-uso").value||0;
    row.querySelector(".m-total").textContent=brl(materialCost(m));
    calculatePrice();
  });
}
function materialCost(m){return m.qtd>0?(m.preco/m.qtd)*(m.uso||0):0}
function removeMaterial(id){calcMaterials=calcMaterials.filter(m=>m.id!==id);renderMaterialRows();calculatePrice()}
function calculatePrice(){
  const materials=calcMaterials.reduce((s,m)=>s+materialCost(m),0);
  const labor=(+$("calcHoras").value||0)*(+$("calcHoraValor").value||0);
  const fees=+$("calcTaxas").value||0;
  const cost=materials+labor+fees;
  const pct=Math.max(0,(+$("calcLucroPct").value||0))/100;
  const price=cost*(1+pct);
  const profit=price-cost;
  $("calcMaterials").textContent=brl(materials);
  $("calcLabor").textContent=brl(labor);
  $("calcFees").textContent=brl(fees);
  $("calcCost").textContent=brl(cost);
  $("calcPrice").textContent=brl(price);
  $("calcProfit").textContent=brl(profit);
  $("calcProfitPct").textContent=((price>0?profit/price:0)*100).toFixed(1)+"%";
  return {materials,labor,fees,cost,price,profit,pct:pct*100};
}
function clearCalc(){
  calcMaterials=[];
  $("calcHoras").value=1;$("calcHoraValor").value=15;$("calcLucroPct").value=30;$("calcTaxas").value=0;
  renderMaterialRows();calculatePrice();
}
function renderSavedCalcs(){
  const box=$("savedCalcList");
  box.innerHTML=savedCalcs.length?savedCalcs.slice().reverse().map(c=>`
    <div class="calc-saved-item">
      <div><b>${esc(c.nome||"Cálculo")}</b><div class="muted">${c.date} · Custo ${brl(c.result.cost)} · Preço ${brl(c.result.price)}</div></div>
      <button class="secondary" onclick="reuseCalc('${c.id}')">Reutilizar</button>
    </div>`).join(""):'<div class="empty">Nenhum cálculo salvo ainda.</div>';
}
function saveCalc(){
  const r=calculatePrice();
  const nome=prompt("Nome deste cálculo:",calcMaterials.find(m=>m.nome)?.nome||"Peça de crochê");
  if(nome===null)return;
  savedCalcs.push({id:crypto.randomUUID(),nome,date:new Date().toLocaleDateString("pt-BR"),result:r,materials:calcMaterials,horas:+$("calcHoras").value||0,hora:+$("calcHoraValor").value||0,lucro:+$("calcLucroPct").value||0,taxas:+$("calcTaxas").value||0});
  localStorage.setItem(calcKey,JSON.stringify(savedCalcs));renderSavedCalcs();
}
function reuseCalc(id){
  const c=savedCalcs.find(x=>x.id===id);if(!c)return;
  calcMaterials=c.materials.map(m=>({...m,id:crypto.randomUUID()}));
  $("calcHoras").value=c.horas;$("calcHoraValor").value=c.hora;$("calcLucroPct").value=c.lucro;$("calcTaxas").value=c.taxas;
  renderMaterialRows();calculatePrice();
}
function useCalcInOrder(){
  const r=calculatePrice();
  openPedido();
  $("pUnit").value=r.price.toFixed(2);
  $("pCusto").value=r.cost.toFixed(2);
  $("pDesc").value=`Preço calculado pela Calculadora V4. Materiais: ${brl(r.materials)} | Mão de obra: ${brl(r.labor)} | Taxas: ${brl(r.fees)}.`;
  calcForm();
}
$("addMaterial").onclick=()=>addMaterialRow({nome:"",preco:0,qtd:1000,uso:0,unidade:"g"});
$("clearCalc").onclick=clearCalc;
$("saveCalc").onclick=saveCalc;
$("useCalcInOrder").onclick=useCalcInOrder;
["calcHoras","calcHoraValor","calcLucroPct","calcTaxas"].forEach(id=>$(id).oninput=calculatePrice);
addMaterialRow({nome:"Barbante",preco:20,qtd:1000,uso:100,unidade:"g"});
renderSavedCalcs();

const originalShowSection = showSection;
showSection = function(id){
  originalShowSection(id);
  if(id==="calculadora"){renderMaterialRows();calculatePrice();renderSavedCalcs();}
};

/* ===== Melhorias V5: backup, financeiro, WhatsApp e cálculos salvos ===== */
function toast(msg){
  const old=document.querySelector('.toast'); if(old) old.remove();
  const el=document.createElement('div'); el.className='toast'; el.textContent=msg; document.body.appendChild(el);
  setTimeout(()=>el.remove(),2600);
}
function downloadText(filename,text){
  const blob=new Blob([text],{type:'application/json;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function exportBackup(){
  const backup={version:'Gustagumi V5',exportadoEm:new Date().toISOString(),data,savedCalcs};
  downloadText(`gustagumi-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(backup,null,2));
  toast('Backup criado com sucesso! 💾');
}
function importBackup(file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const b=JSON.parse(reader.result);
      if(!b.data || !Array.isArray(b.data.pedidos) || !Array.isArray(b.data.clientes) || !Array.isArray(b.data.custos)) throw new Error('Formato inválido');
      if(!confirm('Restaurar este backup? Os dados atuais serão substituídos.')) return;
      data={pedidos:b.data.pedidos,clientes:b.data.clientes,custos:b.data.custos};
      savedCalcs=Array.isArray(b.savedCalcs)?b.savedCalcs:[];
      save(); localStorage.setItem(calcKey,JSON.stringify(savedCalcs));
      renderHome(); renderPedidos(); renderClientes(); renderFinance(); renderSavedCalcs();
      toast('Backup restaurado com sucesso! ✨');
    }catch(e){alert('Não foi possível restaurar o backup. Verifique se o arquivo é um backup do Gustagumi.');}
  };
  reader.readAsText(file);
}
if($('exportData')) $('exportData').onclick=exportBackup;
if($('importDataBtn')) $('importDataBtn').onclick=()=>$('importData').click();
if($('importData')) $('importData').onchange=e=>{importBackup(e.target.files[0]);e.target.value='';};

function renderFinanceV5(){
  renderFinance();
  const ps=data.pedidos;
  const delivered=ps.filter(p=>p.status==='Entregue').length;
  const pending=ps.filter(p=>p.status!=='Entregue').length;
  const avg=ps.length?ps.reduce((a,p)=>a+total(p),0)/ps.length:0;
  $('financeSummary').innerHTML=`<div class="summary-grid">
    <div class="summary-mini"><span>Pedidos entregues</span><strong>${delivered}</strong></div>
    <div class="summary-mini"><span>Pedidos em andamento</span><strong>${pending}</strong></div>
    <div class="summary-mini"><span>Ticket médio</span><strong>${brl(avg)}</strong></div>
  </div>`;
}
const oldRenderFinance=renderFinance;
renderFinance=renderFinanceV5;

/* WhatsApp com mensagem mais completa e compatível */
function sendWhats(id){
  const p=data.pedidos.find(x=>x.id===id); if(!p)return;
  const lines=[
    `Olá, ${p.cliente}! 🧶💗`,
    '',
    `Seu pedido: ${p.qtd}x ${p.produto}`,
    p.detalhes?`Detalhes: ${p.detalhes}`:'',
    `Valor total: ${brl(total(p))}`,
    `Valor pago: ${brl(p.pago)}`,
    `Restante: ${brl(rest(p))}`,
    p.prazo?`Data de entrega: ${dateBR(p.prazo)}`:'',
    '',
    'Obrigada por escolher a Gustagumi! ✨'
  ].filter(Boolean).join('\n');
  const phone=(p.whats||'').replace(/\D/g,'');
  const url=phone?`https://wa.me/${phone}?text=${encodeURIComponent(lines)}`:`https://wa.me/?text=${encodeURIComponent(lines)}`;
  window.open(url,'_blank');
}

let currentQuoteId=null;
const oldQuotePedido=quotePedido;
quotePedido=function(id){currentQuoteId=id;oldQuotePedido(id);};
if($('quoteWhats')) $('quoteWhats').onclick=()=>{if(currentQuoteId)sendWhats(currentQuoteId)};

function deleteCalc(id){
  if(!confirm('Excluir este cálculo salvo?'))return;
  savedCalcs=savedCalcs.filter(c=>c.id!==id);
  localStorage.setItem(calcKey,JSON.stringify(savedCalcs));
  renderSavedCalcs(); toast('Cálculo excluído.');
}

/* Inicialização V5 */
showSection('inicio');
