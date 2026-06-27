const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');

initializeApp();
const db = getFirestore();

exports.sendDailyReminders = onSchedule(
  {
    schedule: '0 12 * * *', // 毎日UTC12:00（日本時間21:00）
    timeZone: 'Asia/Tokyo',
  },
  async (event) => {
    // 明日の日付を取得
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`明日の予約を検索: ${tomorrowStr}`);

    // 明日の予約を取得
    const snapshot = await db.collection('bookings')
      .where('date', '==', tomorrowStr)
      .where('status', '==', 'confirmed')
      .get();

    if (snapshot.empty) {
      console.log('明日の予約はありません');
      return;
    }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    for (const doc of snapshot.docs) {
      const booking = doc.data();
      const message = `【予約リマインド】\n\n明日のご予約のお知らせです。\n\nメニュー: ${booking.menu}\n日付: ${booking.date}\n時間: ${booking.slot}\n料金: ${booking.price}\n\nご来店をお待ちしております！\n\nキャンセルはこちら\nhttps://dental-clinic-indol-pi.vercel.app/mypage`;

      try {
        await axios.post(
          'https://api.line.me/v2/bot/message/push',
          {
            to: booking.lineUserId,
            messages: [{ type: 'text', text: message }],
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        console.log(`送信完了: ${booking.lineUserId}`);
      } catch (e) {
        console.error(`送信失敗: ${booking.lineUserId}`, e);
      }
    }

    console.log(`${snapshot.docs.length}件のリマインドを送信しました`);
  }
);