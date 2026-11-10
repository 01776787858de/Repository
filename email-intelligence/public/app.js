const emailInput=document.getElementById("email");
const consentInput=document.getElementById("consent");
const scanBtn=document.getElementById("scanBtn");
const message=document.getElementById("message");
scanBtn.addEventListener("click",openOfficialCheck);
emailInput.addEventListener("keydown",e=>{if(e.key==="Enter")openOfficialCheck();});
function showMessage(text,error=false){message.textContent=text;message.className=error?"message error":"message";}
function openOfficialCheck(){
 const email=emailInput.value.trim();
 if(!email)return showMessage("أدخل عنوان البريد الإلكتروني أولاً.",true);
 if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email))return showMessage("يرجى التأكد من صيغة البريد الإلكتروني.",true);
 if(!consentInput.checked)return showMessage("يرجى تأكيد أنك تملك هذا البريد أو لديك إذن بفحصه.",true);
 const tab=window.open("https://haveibeenpwned.com/","_blank","noopener,noreferrer");
 if(!tab)return showMessage("تعذّر فتح نافذة جديدة. اسمح بفتح النوافذ المنبثقة أو افتح haveibeenpwned.com يدوياً.",true);
 showMessage("فتحنا المصدر الرسمي في صفحة جديدة. أدخل بريدك هناك لإجراء الفحص. لم نرسل البريد تلقائياً ولم نخزّنه.");
}