'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import liff from '@line/liff';

type Booking = {
  id: string;
  menu: string;
  date: string;
  slot: string;
  price: string;
  time: string;
  status: string;
};

export default function MyPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('temp-user');

  useEffect(() => {
    const init = async () => {
      let uid = 'temp-user';
      try {
        await liff.init({ liffId: '2010454791-miMuAYxd' });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          uid = profile.userId;
          setUserId(uid);
        }
      } catch (e) {
        console.log('LIFF初期化エラー:', e);
      } finally {
        fetchBookings(uid);
      }
    };
    init();
  }, []);

  const fetchBookings = async (uid: string = 'temp-user') => {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('lineUserId', '==', uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Booking[];
      data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('予約をキャンセルしますか？')) return;
    try {
      await updateDoc(doc(db, 'bookings', id), {
        status: 'cancelled',
      });
      fetchBookings(userId);
      alert('予約をキャンセルしました');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">読み込み中...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-6">
        <button onClick={() => router.push('/')} className="text-sm mb-2">← 戻る</button>
        <h1 className="text-xl font-bold">予約確認・キャンセル</h1>
      </div>

      <div className="p-4">
        {bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">📅</p>
            <p>予約はありません</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 bg-blue-600 text-white rounded-xl px-6 py-3 font-bold"
            >
              予約する
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking.id} className="bg-white rounded-xl shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-lg">{booking.menu}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                    booking.status === 'confirmed'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-500'
                  }`}>
                    {booking.status === 'confirmed' ? '予約済み' : 'キャンセル済み'}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p>📅 {booking.date}</p>
                  <p>🕐 {booking.slot}（{booking.time}）</p>
                  <p>💴 {booking.price}</p>
                </div>
                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="w-full border border-red-400 text-red-400 rounded-lg py-2 text-sm font-bold"
                  >
                    キャンセルする
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}