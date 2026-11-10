const emailInput=document.getElementById("email");
const consentInput=document.getElementById("consent");
const scanBtn=document.getElementById("scanBtn");
const message=document.getElementById("message");
const sourceResults=document.getElementById("sourceResults");
const copyStatus=document.getElementById("copyStatus");

function showMessage(text,error=false){message.textContent=text;message.className=error?"message error":"message";}
function validEmail(email){return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)&&email.length<=254;}
scanBtn.addEventListener("click",()=>{
 const email=emailInput.value.trim();
 if(!email)return showMessage("أدخل عنوان البريد الإلكتروني أولاً.",true);
 if(!validEmail(email))return showMessage("يرجى التأكد من صيغة البريد الإلكتروني.",true);
 if(!consentInput.checked)return showMessage("يرجى تأكيد أنك تملك هذا البريد أو لديك إذن بفحصه.",true);
 sourceResults.classList.remove("hidden");
 showMessage("تم تجهيز قائمة المصادر. افتح كل مصدر وألصق البريد بنفسك؛ لم نرسل بريدك تلقائياً.");
 sourceResults.scrollIntoView({behavior:"smooth",block:"start"});
});
emailInput.addEventListener("keydown",e=>{if(e.key==="Enter")scanBtn.click();});
document.getElementById("copyEmail").addEventListener("click",async()=>{
 const email=emailInput.value.trim();
 if(!validEmail(email)){copyStatus.textContent="أدخل بريداً صحيحاً أولاً.";return;}
 try{await navigator.clipboard.writeText(email);copyStatus.textContent="تم نسخ البريد؛ الصقه في صفحة المصدر.";}
 catch{copyStatus.textContent="تعذر النسخ تلقائياً؛ حدّد البريد وانسخه يدوياً.";}
});
