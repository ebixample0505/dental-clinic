'use client';
import { useRouter } from 'next/navigation';

export default function CompletePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="text-6xl mb-6">✅</div>
      <h1 className="text-2xl font-bold mb-2">予約が完了しました</h1>
      <p className="text-gray-500 text-center mb-8">
        LINEメッセージに予約内容を送信しました
      </p>

      <button
        onClick={() => router.push('/')}
        className="w-full bg-blue-600 text-white rounded-xl p-4 font-bold text-lg"
      >
        トップに戻る
      </button>
    </div>
  );
}