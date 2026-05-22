
## الهدف

تحويل عدّاد النقرات الحالي (`clicks_count` رقم واحد فقط) إلى نظام تتبع تفصيلي يسجّل كل نقرة على حدة، ويعرض للمستخدم تحليلات قابلة للاستخدام (الزمن، الجهاز، المتصفح، الدولة، المصدر) مع إمكانية التصدير.

---

## ما الذي سيُبنى

### 1. جدول `clicks` جديد في قاعدة البيانات

سجل منفصل لكل نقرة بدلاً من مجرد عدّاد:

```text
clicks
├── id (uuid)
├── link_id (uuid → links.id, on delete cascade)
├── clicked_at (timestamptz)
├── ip_country (text, مثل "SA")  -- من Cloudflare/edge headers
├── ip_city (text, اختياري)
├── device_type (text: mobile | desktop | tablet)
├── browser (text: Chrome, Safari, …)
├── os (text: iOS, Android, Windows, …)
├── referrer (text)
└── user_agent (text)
```

- RLS: المالك فقط يقرأ نقرات روابطه (`exists` على `links.user_id = auth.uid()`).
- INSERT مسموح بـ `anon` (التسجيل يحدث وقت التحويل).
- فهارس على `link_id` و `clicked_at` للأداء.

### 2. Edge Function: `track-click`

بدل ما الـ frontend يستدعي `increment_clicks` ثم يحوّل، نستخدم Edge Function:

- Input: `short_code`
- يستخرج: country (من `cf-ipcountry`), user-agent, referrer.
- يـ parse الـ UA لاستخراج (device_type, browser, os) باستخدام مكتبة خفيفة (`ua-parser-js` عبر npm specifier).
- Insert في `clicks` + UPDATE `links.clicks_count` (للحفاظ على التوافق مع المخطط الحالي).
- Returns: `original_url` النهائي + UTM params المحقونة.

هذا يجعل التتبع موثوق ولا يعتمد على الـ browser.

### 3. تحديث `RedirectPage.tsx`

استبدال الاستدعاء المباشر لـ Supabase باستدعاء Edge Function، ثم `window.location.href = data.final_url`.

### 4. صفحة تفاصيل الرابط `/dashboard/links/:id`

صفحة جديدة لكل رابط تعرض:

- **بطاقات إحصائيات**: إجمالي نقرات، نقرات اليوم، نقرات هذا الأسبوع، أعلى دولة.
- **رسم بياني زمني** (Line/Area Chart): النقرات لكل يوم آخر 30 يوم.
- **توزيع الأجهزة** (Pie/Donut): mobile/desktop/tablet.
- **أعلى الدول** (Bar أفقي): top 5.
- **أعلى المتصفحات والـ Referrers**: قوائم بسيطة.
- **زر تصدير CSV**: تنزيل كل النقرات الخام للرابط.

الوصول من جدول الروابط: زر "View Analytics" بجانب كل صف.

### 5. تحسين `ClicksChart` الموجود في الـ Dashboard

إضافة Toggle: "By Link" (الحالي) ↔ "Over Time" (timeline يجمع كل النقرات حسب اليوم) للاستفادة من البيانات الجديدة.

### 6. تصدير CSV

زر تنزيل في صفحة التفاصيل يستخدم `Papa.unparse` على عميل client-side.

---

## تفاصيل تقنية

- **مكتبات جديدة**: `ua-parser-js` (في Edge Function عبر `npm:`), `papaparse` (للـ CSV على الـ frontend).
- **التوافق العكسي**: `clicks_count` يبقى يُحدَّث، فالـ Dashboard الحالي يستمر يعمل بدون تعديل أثناء النشر.
- **الأداء**: فهارس على `(link_id, clicked_at desc)` لجعل استعلامات الـ timeline سريعة.
- **الخصوصية**: لا نخزّن IP خام — فقط الدولة والمدينة المشتقة من header، مما يقلل مخاوف GDPR.
- **الـ Routing**: إضافة `<Route path="/dashboard/links/:id">` في `App.tsx` داخل `ProtectedRoute`.

---

## الترتيب

1. Migration: إنشاء جدول `clicks` + RLS + فهارس.
2. Edge Function `track-click` + deploy.
3. تحديث `RedirectPage` لاستخدامها.
4. صفحة التفاصيل + الراوت + زر "View Analytics" في الجدول.
5. زر التصدير CSV.
6. Toggle "By Link / Over Time" في الـ Dashboard.

---

## ما لن يتغير

- صفحة الـ Landing وحدّ الـ 3 روابط للزوار.
- نظام الـ Auth و RLS الحالي.
- شكل الـ Dashboard العام (نفس الـ UI، نضيف فقط).
