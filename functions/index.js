const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');

initializeApp();
const db = getFirestore();

exports.sendDailyReminders = onSchedule(
  {
    schedule: '0 12 * * *',
    timeZone: 'Asia/Tokyo',
  },
  async (event) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`明日の予約を検索: ${tomorrowStr}`);

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

      const flexMessage = {
        type: 'flex',
        altText: `【予約リマインド】明日 ${booking.slot} ${booking.menu}のご予約があります`,
        contents: {
          type: 'bubble',
          size: 'mega',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '予約リマインド',
                color: '#ffffff',
                size: 'sm',
                weight: 'bold',
              },
              {
                type: 'text',
                text: '明日のご予約のお知らせ',
                color: '#ffffff',
                size: 'xl',
                weight: 'bold',
                margin: 'sm',
              },
            ],
            backgroundColor: '#3B82F6',
            paddingAll: '20px',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                margin: 'md',
                spacing: 'sm',
                contents: [
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: 'メニュー',
                        color: '#6B7280',
                        size: 'sm',
                        flex: 2,
                      },
                      {
                        type: 'text',
                        text: booking.menu,
                        size: 'sm',
                        weight: 'bold',
                        flex: 3,
                        wrap: true,
                      },
                    ],
                  },
                  {
                    type: 'separator',
                    margin: 'sm',
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: '日付',
                        color: '#6B7280',
                        size: 'sm',
                        flex: 2,
                      },
                      {
                        type: 'text',
                        text: booking.date,
                        size: 'sm',
                        weight: 'bold',
                        flex: 3,
                      },
                    ],
                  },
                  {
                    type: 'separator',
                    margin: 'sm',
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: '時間',
                        color: '#6B7280',
                        size: 'sm',
                        flex: 2,
                      },
                      {
                        type: 'text',
                        text: booking.slot,
                        size: 'sm',
                        weight: 'bold',
                        flex: 3,
                      },
                    ],
                  },
                  {
                    type: 'separator',
                    margin: 'sm',
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'text',
                        text: '料金',
                        color: '#6B7280',
                        size: 'sm',
                        flex: 2,
                      },
                      {
                        type: 'text',
                        text: booking.price,
                        size: 'sm',
                        weight: 'bold',
                        color: '#3B82F6',
                        flex: 3,
                      },
                    ],
                  },
                ],
              },
            ],
            paddingAll: '20px',
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'button',
                style: 'primary',
                color: '#3B82F6',
                action: {
                  type: 'uri',
                  label: 'マイページで予約を確認',
                  uri: 'https://miniapp.line.me/2010454791-miMuAYxd/mypage',
                },
              },
              {
                type: 'button',
                style: 'secondary',
                action: {
                  type: 'uri',
                  label: 'キャンセルはこちら',
                  uri: 'https://miniapp.line.me/2010454791-miMuAYxd/mypage',
                },
              },
            ],
            paddingAll: '20px',
          },
        },
      };

      try {
        await axios.post(
          'https://api.line.me/v2/bot/message/push',
          {
            to: booking.lineUserId,
            messages: [flexMessage],
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
        console.error(`送信失敗: ${booking.lineUserId}`, e.message);
      }
    }

    console.log(`${snapshot.docs.length}件のリマインドを送信しました`);
  }
);