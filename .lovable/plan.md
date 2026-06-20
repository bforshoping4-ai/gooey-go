# خطة: إصلاح Google OAuth على Vercel + linkjoy.co

## المشكلة الجذرية

المشروع مستضاف على **Vercel** (عبر GitHub) مع دومين `linkjoy.co`. الـ Backend هو Lovable Cloud (Supabase).

`lovable.auth.signInWithOAuth("google")` يفشل بـ 404 لأنه يحتاج إلى مسار `/~oauth/initiate` الخاص بخوادم Lovable — وهذا المسار **غير موجود** على Vercel. Lovable OAuth proxy يعمل فقط على دومينات `.lovable.app` أو دومينات مخصصة مسجلة رسمياً في إعدادات Lovable.

## الحل: Supabase Auth OAuth المباشر

Supabase يوفر OAuth flow أصلي (`supabase.auth.signInWithOAuth`) يعمل على **أي دومين** بدون الحاجة إلى Lovable proxy. التغييرات:

### 1. `src/pages/AuthPage.tsx` — استبدال Lovable Auth بـ Supabase Auth

- استبدال استيراد `lovable` بـ `supabase`
- تغيير `handleGoogleSignIn` لاستخدام `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })`
- إعادة التوجيه إلى `data.url` (Google consent screen)

### 2. `src/hooks/useAuth.tsx` — التقاط OAuth callback

- إضافة معالجة لـ `code` parameter في query string عند العودة من Google
- استدعاء `supabase.auth.exchangeCodeForSession(code)` إذا وجدنا `code`
- ضمان تحديث `user` و `session` بعد إكمال OAuth

### 3. كيف يعمل التدفق الجديد

```
المستخدم ←→ linkjoy.co/auth
        ينقر "Sign in with Google"
        ↓
supabase.auth.signInWithOAuth() ←→ Google OAuth
        ↓
Google يعيد التوجيه إلى ←→ linkjoy.co/auth?code=xxx
        ↓
useAuth() يكتشف code ويستدعي exchangeCodeForSession()
        ↓
Session جديدة ←→ user مُحدَّث ←→ توجيه إلى Dashboard
```

## ما لا نغيره

- Email/Password auth يبقى كما هو (يعمل بالفعل عبر Supabase)
- Lovable managed auth يُحتفظ به كملف (`src/integrations/lovable/index.ts`) دون استخدامه حالياً
- إعدادات Supabase Auth (Google provider) تبقى كما هي — لقد فُعلت سابقاً

## البدائل المرفوضة

| البديل | السبب |
|--------|-------|
| إضافة الدومين في Lovable | يتطلب اشتراك مدفوع (المستخدم رفض) |
| إخفاء زر Google | سيئ لتجربة المستخدم — الحل الحقيقي أفضل |
| إعادة توجيه إلى `.lovable.app` | يكسر تجربة العلامة التجارية |
| Edge Function مخصص | معقد دون داعٍ — Supabase Auth يكفي |

## التحقق بعد التنفيذ

1. فتح `https://linkjoy.co/auth`
2. النقر على "Continue with Google"
3. اختيار حساب Google
4. العودة إلى `linkjoy.co` والتحقق من تسجيل الدخول

هل تُوافق على تنفيذ هذه الخطة؟