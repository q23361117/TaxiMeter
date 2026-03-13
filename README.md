TaxiMeterApp/
├─ App.js
├─ package.json
├─ assets/
│  └─ icon.png
├─ components/
│  ├─ MeterDisplay.js
│  └─ StartStopButton.js
├─ screens/
│  ├─ HomeScreen.js
│  └─ HistoryScreen.js
├─ utils/
│  └─ calculateFare.js
└─ README.md

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
    "expo": "~50.0.0",
    "expo-location": "~16.0.0",
    "react": "18.2.0",
    "react-native": "0.72.3"
  }
}

export const calculateFare = (distanceKm, waitingMinutes) => {
  const baseFare = 70;      // 起跳價
  const perKm = 20;         // 每公里費
  const perMinuteWait = 5;  // 每分鐘等候費

  const distanceFare = distanceKm * perKm;
  const waitingFare = waitingMinutes * perMinuteWait;

  const totalFare = baseFare + distanceFare + waitingFare;
  return totalFare;
};

import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { calculateFare } from '../utils/calculateFare';

export default function MeterDisplay({ onSaveRecord }) {
  const [running, setRunning] = useState(false);
  const [distance, setDistance] = useState(0);
  const [waiting, setWaiting] = useState(0);
  const [fare, setFare] = useState(0);
  const [prevLocation, setPrevLocation] = useState(null);

  useEffect(() => {
    let timer;
    let locWatcher;

    const startMeter = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locWatcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, timeInterval: 1000, distanceInterval: 1 },
        (location) => {
          if (prevLocation) {
            const dx = location.coords.latitude - prevLocation.latitude;
            const dy = location.coords.longitude - prevLocation.longitude;
            const km = Math.sqrt(dx*dx + dy*dy) * 111; // 粗略換算 km
            setDistance(prev => prev + km);
            setFare(calculateFare(distance + km, waiting));
          }
          setPrevLocation(location.coords);
        }
      );

      timer = setInterval(() => {
        setWaiting(prev => prev + 1/60); // 每秒增加分鐘
        setFare(calculateFare(distance, waiting + 1/60));
      }, 1000);
    };

    if (running) startMeter();
    else {
      if (locWatcher) locWatcher.remove();
      if (timer) clearInterval(timer);
    }

    return () => {
      if (locWatcher) locWatcher.remove();
      if (timer) clearInterval(timer);
    };
  }, [running, prevLocation, distance, waiting]);

  const stopMeter = () => {
    setRunning(false);
    onSaveRecord && onSaveRecord({ distance, waiting, fare, timestamp: new Date() });
    setDistance(0);
    setWaiting(0);
    setFare(0);
    setPrevLocation(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>距離: {distance.toFixed(2)} km</Text>
      <Text style={styles.text}>等候: {waiting.toFixed(2)} 分鐘</Text>
      <Text style={styles.text}>計費: NT$ {fare.toFixed(0)}</Text>
      <Button title={running ? "停止" : "開始"} onPress={() => running ? stopMeter() : setRunning(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  text: { fontSize: 18, marginVertical: 5 }
});

import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import MeterDisplay from '../components/MeterDisplay';

export default function HomeScreen() {
  const [history, setHistory] = useState([]);

  const saveRecord = (record) => setHistory(prev => [record, ...prev]);

  return (
    <ScrollView style={styles.container}>
      <MeterDisplay onSaveRecord={saveRecord} />
      <Text style={styles.header}>歷史紀錄</Text>
      {history.map((h, i) => (
        <View key={i} style={styles.record}>
          <Text>{h.timestamp.toLocaleString()}</Text>
          <Text>距離: {h.distance.toFixed(2)} km | 等候: {h.waiting.toFixed(2)} 分鐘 | NT$ {h.fare.toFixed(0)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 20, marginTop: 20, marginLeft: 10 },
  record: { padding: 10, borderBottomWidth: 1, borderColor: '#ccc' }
});

import React from 'react';
import { SafeAreaView } from 'react-native';
import HomeScreen from './screens/HomeScreen';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <HomeScreen />
    </SafeAreaView>
  );
}

# TaxiMeterApp

一個 iOS / Android 跳錶計程車計費範例程式，使用 React Native + Expo 開發。

## 功能
- GPS 路程計算
- 跳錶計費
- 等候時間計費
- 歷史紀錄

## 開發 & 測試
1. 安裝依賴
```bash
npm install

npm start
