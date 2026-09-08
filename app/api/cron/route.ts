import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Tracker } from '@/lib/models/Tracking';

export async function GET(request: Request) {
  try {
    // 1. הגנת אבטחה: מוודאים שרק הכרון שלנו יכול להפעיל את הראוט הזה
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // מחפשים את כל המעקבים הפעילים
    const activeTrackers = await Tracker.find({ hasActiveCycle: true }).lean();
    
    // משיגים את השעה הנוכחית בפורמט HH:00 (לפי שעון ישראל)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jerusalem'
    });
    const currentHour = formatter.format(now).split(':')[0]; // למשל: "08" או "20"

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    let sentCount = 0;

    // עוברים על המעקבים
    for (const tracker of activeTrackers) {
      // בודקים אילו תרופות צריך לקחת עכשיו
      const medsToTakeNow = tracker.medications.filter((med: any) => {
        // בודקים אם אחת משעות התזכורת מתחילה בשעה הנוכחית
        return med.hours.some((h: string) => h.startsWith(currentHour));
      });

      for (const med of medsToTakeNow) {
        const text = `היי יעלי אהובה שלי ❤️\nתזכורת אוטומטית לקחת ${med.name} (${med.dosage}).\n${med.notes ? 'הערה: ' + med.notes : ''}\nאוהב המון! ✨`;
        
        // שליחה לטלגרם
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text }),
        });
        
        sentCount++;
      }
    }

    return NextResponse.json({ success: true, messagesSent: sentCount });
  } catch (error: any) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}