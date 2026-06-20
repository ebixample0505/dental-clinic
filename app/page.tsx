'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initLiff, getUserProfile } from '@/lib/liff';

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initLiff()
      .then(async () => {
        const profile = await getUserProfile();
        setUserName(profile.displayName);
        setLoading(false);
      })
      .catch(() => {
        // ローカル環境ではLINEログイン不可のため仮名で表示
        setUserName('テストユーザー');
        setLoading(false);
      });
  }, []);

  const menus = [
    { id: 1, name: 'カット', time: '60分', price: '¥4,000' },
    { id: 2, name: 'カット + カラー', time: '120分', price: '¥10,000' },
    { id: 3, name: 'クリーニング', time: '30分', price: '¥3,000' },
    { id: 4, name: '検診', time: '30分', price: '¥2,000' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">読み込み中...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-6">
        <h1 className="text-xl font-bold">市川デンタルクリニック</h1>
        <p className="text-sm mt-1">こんにちは、{userName}さん</p>
      </div>

      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">メニューを選択してください</h2>
        <div className="space-y-3">
          {menus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => router.push(`/booking?menu=${menu.name}&time=${menu.time}&price=${menu.price}`)}
              className="w-full bg-white rounded-xl p-4 shadow flex justify-between items-center"
            >
              <div className="text-left">
                <p className="font-bold">{menu.name}</p>
                <p className="text-sm text-gray-500">{menu.time}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-600 font-bold">{menu.price}</p>
                <p className="text-gray-400 text-xs">›</p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => router.push('/mypage')}
          className="w-full mt-6 border border-blue-600 text-blue-600 rounded-xl p-4 font-bold"
        >
          予約確認・キャンセル
        </button>
      </div>
    </div>
  );
}