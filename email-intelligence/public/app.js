const emailInput=document.getElementById("email");
const consentInput=document.getElementById("consent");
const scanBtn=document.getElementById("scanBtn");
const message=document.getElementById("message");
const results=document.getElementById("results");
scanBtn.addEventListener("click",scan);
emailInput.addEventListener("keydown",e=>{if(e.key==="Enter")scan();});
document.getElementById("printBtn").addEventListener("click",()=>window.print());
function showMessage(text,error=false){message.textContent=text;message.className=error?"message error":"message";}
function dateText(value){if(!value)return"غير متوفر";const d=new Date(value);return Number.isNaN(d.getTime())?value:new Intl.DateTimeFormat("ar",{year:"numeric",month:"long",day:"numeric"}).format(d);}
async function scan(){
 const email=emailInput.value.trim();
 if(!email)return showMessage("أدخل عنوان البريد الإلكتروني أولاً.",true);
 if(!consentInput.checked)return showMessage("يرجى تأكيد ملكية البريد أو وجود إذن بفحصه.",true);
 scanBtn.disabled=true;scanBtn.textContent="جارٍ الفحص…";results.classList.add("hidden");showMessage("يتم الآن فحص قواعد بيانات التسريبات المعروفة…");
 try{
  const response=await fetch("/api/check-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,consent:true})});
  const data=await response.json();if(!response.ok)throw new Error(data.error||"تعذر إكمال الفحص.");
  renderResults(data);showMessage("اكتمل الفحص.");
 }catch(err){showMessage(err.message||"حدث خطأ غير متوقع.",true);}
 finally{scanBtn.disabled=false;scanBtn.innerHTML='ابدأ الفحص <span>←</span>';}
}
function renderResults(data){
 document.getElementById("resultTitle").textContent="نتائج البريد: "+data.email;
 document.getElementById("summary").textContent=data.count
 ?`عُثر على ${data.count} حادثة تسريب مرتبطة بهذا البريد في المصدر الذي تم فحصه. راجع التفاصيل أدناه.`
 :"لم يعثر المصدر الذي تم فحصه على تسريبات مرتبطة بهذا البريد. هذه النتيجة لا تضمن عدم وجود تسريبات في مصادر أخرى.";
 const list=document.getElementById("breachList");list.replaceChildren();
 for(const item of data.breaches){
  const card=document.createElement("article");card.className="breach";
  const title=document.createElement("h3");title.textContent=item.name||"حادثة غير مسماة";
  const domain=document.createElement("div");domain.className="domain";domain.textContent=item.domain||"النطاق غير متوفر";
  const meta=document.createElement("div");meta.className="meta";meta.textContent=`تاريخ الحادثة: ${dateText(item.breachDate)} · تاريخ الإضافة للمصدر: ${dateText(item.addedDate)}`;
  card.append(title,domain,meta);
  if(item.dataClasses?.length){const label=document.createElement("p");label.textContent="أنواع البيانات المعلنة في الحادثة:";label.style.color="#9eb0c6";label.style.fontSize="12px";const chips=document.createElement("div");chips.className="chips";for(const cls of item.dataClasses){const chip=document.createElement("span");chip.className="chip";chip.textContent=cls;chips.append(chip);}card.append(label,chips);}
  list.append(card);
 }
 results.classList.remove("hidden");results.scrollIntoView({behavior:"smooth",block:"start"});
}