TaxiMeterApp/
├─ app/
│   └─ (tabs)/index.tsx        # 主頁面跳錶 UI
├─ components/
│   └─ TimerDisplay.tsx         # 跳錶顯示元件
├─ constants/
│   └─ rates.ts                 # 費率設定
├─ hooks/
│   └─ useTimer.ts              # 跳錶邏輯
├─ assets/                      # 圖片資源（可留空）
├─ package.json
├─ package-lock.json
├─ app.json
├─ tsconfig.json
└─ eas.json
export const Rates = {
  baseFare: 70,   // 起跳價
  perKm: 25,      // 每公里
  perMin: 5,      // 每分鐘
  kmExtra: 10     // 超過公里加成
};
import { useState, useRef, useEffect } from 'react';

export function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timer | null>(null);

  const start = () => {
    if (!running) {
      setRunning(true);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    }
  };

  const pause = () => {
    if (running) {
      setRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const reset = () => {
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setSeconds(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { seconds, running, start, pause, reset };
}
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  seconds: number;
};

export const TimerDisplay: React.FC<Props> = ({ seconds }) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <View style={styles.container}>
      <Text style={styles.time}>{`${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', margin: 20 },
  time: { fontSize: 48, fontWeight: 'bold' }
});
import React from 'react';
import { View, Button } from 'react-native';
import { useTimer } from '../../hooks/useTimer';
import { TimerDisplay } from '../../components/TimerDisplay';

export default function MainScreen() {
  const { seconds, running, start, pause, reset } = useTimer();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <TimerDisplay seconds={seconds} />
      <Button title={running ? "暫停" : "開始"} onPress={running ? pause : start} />
      <Button title="重置" onPress={reset} />
    </View>
  );
}
{
  "name": "TaxiMeterApp",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~48.0.0",
    "expo-status-bar": "~1.4.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-native": "0.71.8",
    "react-native-web": "~0.19.12"
  },
  "devDependencies": {
    "typescript": "^5.2.2"
  }
}
{
  "expo": {
    "name": "TaxiMeterApp",
    "slug": "TaxiMeterApp",
    "platforms": ["ios","android","web"],
    "version": "1.0.0",
    "sdkVersion": "48.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "updates": { "fallbackToCacheTimeout": 0 },
    "ios": { "supportsTablet": true }
  }
}
git clone https://github.com/q23361117@gmail.com/TaxiMeterApp.git
cd TaxiMeterApp
npm install
npm run web
npm run android
