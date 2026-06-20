'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const menu = searchParams.get('menu') || '';
  const time = searchParams.get('time') || '';
  const price = searchParams.get('price') || '';

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30',
  ];

  const handleNext = () => {
    if (!selectedDate || !selectedTime) {
      alert('日付と時間を選択してください');
      return;
    }
    router.push(
      `/confirm?menu=${menu}&time=${time}&price=${price}&date=${selectedDate}&slot=${selectedTime}`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-6">
        <button onClick={() => router.back()} className="text-sm mb-2">← 戻る</button>
        <h1 className="text-xl font-bold">日時を選択</h1>
        <p className="text-sm mt-1">{menu} / {time} / {price}</p>
      </div>

      <div className="p-4">
        <h2 className="font-bold mb-2">日付</h2>
        <input
          type="date"
          className="w-full border rounded-xl p-3 mb-6 text-lg"
          value={selectedDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={e => setSelectedDate(e.target.value)}
        />

        <h2 className="font-bold mb-2">時間帯</h2>
        <div className="grid grid-cols-4 gap-2 mb-8">
          {timeSlots.map(slot => (
            <button
              key={slot}
              onClick={() => setSelectedTime(slot)}
              className={`p-2 rounded-lg text-sm font-bold border ${
                selectedTime === slot
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full bg-blue-600 text-white rounded-xl p-4 font-bold text-lg"
        >
          次へ（予約確認）
        </button>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense>
      <BookingContent />
    </Suspense>
  );
}