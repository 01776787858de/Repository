const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const HIBP_API_KEY = process.env.HIBP_API_KEY;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "تم تجاوز عدد المحاولات. حاول لاحقاً." }
});

app.post("/api/check-email", limiter, async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (req.body?.consent !== true)
    return res.status(400).json({ error: "يجب تأكيد أنك تملك هذا البريد أو لديك إذن بفحصه." });
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: "يرجى إدخال عنوان بريد إلكتروني صحيح." });
  if (!HIBP_API_KEY)
    return res.status(503).json({ error: "خدمة الفحص غير مفعّلة بعد. أضف مفتاح HIBP_API_KEY إلى إعدادات الخادم." });

  try {
    const response = await fetch(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
      { headers: { "hibp-api-key": HIBP_API_KEY, "user-agent": "MarkazEmailIntelligence/1.0", "accept": "application/json" } }
    );
    if (response.status === 404) return res.json({ email, count: 0, breaches: [] });
    if (response.status === 429) return res.status(429).json({ error: "المصدر يطلب الانتظار قبل إعادة المحاولة." });
    if (!response.ok) return res.status(502).json({ error: `تعذر إكمال الفحص حالياً (رمز ${response.status}).` });
    const data = await response.json();
    const breaches = data.map(item => ({
      name: item.Name, domain: item.Domain, breachDate: item.BreachDate,
      addedDate: item.AddedDate, dataClasses: item.DataClasses || [],
      isVerified: item.IsVerified, isSensitive: item.IsSensitive
    }));
    res.set("Cache-Control", "no-store");
    res.json({ email, count: breaches.length, breaches });
  } catch {
    res.status(502).json({ error: "حدث خطأ أثناء الاتصال بمصدر الفحص. حاول مرة أخرى لاحقاً." });
  }
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`يعمل الموقع على المنفذ ${PORT}`));