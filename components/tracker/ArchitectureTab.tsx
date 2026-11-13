"use client";


export default function ArchitectureTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs space-y-6">

        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>🛠️</span>
            <span>ארכיטקטורה מומלצת, Netlify, מסד נתונים וסמס/וואטסאפ</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            התשובה המלאה והמקצועית לשאלת הארכיטקטורה והסטאק שלך כדי שהמערכת תעלה בשבריר שנייה ליעלי.
          </p>
        </div>

        {/* Stack Recommendation Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-200 space-y-3">
            <h3 className="font-bold text-rose-900 text-base flex items-center gap-2">
              <span>⚡</span>
              <span>1. הפרונטאנד והאחסון (Netlify או Vercel)</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              <strong>המלצה:</strong> בנה את הפרויקט ב-<strong>Vite + React</strong> (או Next.js App Router).
              <br />
              בניגוד ל-Render (שם בתוכנית חינמית השרת נכנס למצב שינה ומתעורר תוך 50 שניות!), ב-<strong>Netlify</strong> או <strong>Vercel</strong> האתר מוגש מ-Edge CDN גלובלי.
              <br />
              <strong>התוצאה:</strong> יעלי פותחת את האפליקציה בטלפון והיא נטענת ב-<strong>200 מילי-שניות</strong> מיידית.
            </p>
          </div>

          <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-200 space-y-3">
            <h3 className="font-bold text-blue-900 text-base flex items-center gap-2">
              <span>🍃</span>
              <span>2. חיבור למונגו (MongoDB Atlas) או Supabase</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              ב-Netlify אין שרת Express שרץ 24/7, אבל יש <strong>Netlify Serverless Functions</strong> (נמצאות בתיקיית <code>/netlify/functions</code>).
              <br />
              פונקציית Serverless מתחברת ל-<strong>MongoDB Atlas</strong> (Mongoose / MongoClient עם חיבור cached), שומרת ומחזירה את המחזור והתרופות ב-JSON פשוט.
            </p>
          </div>

          <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-3">
            <h3 className="font-bold text-emerald-900 text-base flex items-center gap-2">
              <span>📲</span>
              <span>3. שליחת תזכורות בוואטסאפ ו-SMS אוטומטית</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              <strong>אופציה א' (ללא עלות):</strong> שליחה בלחיצת כפתור (כמו המודל שמוטמע כאן באפליקציה עם <code>api.whatsapp.com/send</code>).
              <br />
              <strong>אופציה ב' (אוטומטי לחלוטין ברקע לפי שעה):</strong>
              מחברים שירות Cron חינמי (כמו <strong>Upstash QStash</strong> או <strong>Cron-Job.org</strong>) שקורא כל שעה ל-Netlify Function.
              הפונקציה בודקת מה צריך לקחת ושולחת דרך <strong>Green API</strong> / <strong>Twilio WhatsApp</strong> ישירות לנייד של יעלי ולנייד שלך.
            </p>
          </div>

          <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 space-y-3">
            <h3 className="font-bold text-amber-900 text-base flex items-center gap-2">
              <span>🔒</span>
              <span>4. שמירה מקומית ואבטחה</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              הנתונים נשמרים אוטומטית ב-MongoDB Atlas דרך <code>/api/tracker</code>. כך גם אתה וגם יעלי יכולים לגשת לאותם נתונים מכל מכשיר.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
