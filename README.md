# DayTrack

Minimalist bir gunluk aktivite takip uygulamasi. Kendi rutinlerini olustur, her gun takip et, istatistiklerini gor.

## Ozellikler

- **Bugun Ekrani** — Gunun aktivitelerini listele, tamamla, ilerleme cubugunu takip et
- **Aktivite Olusturma** — Ad, emoji, renk, tekrar sikligi (gunluk / haftanin belirli gunleri) ve hatirlatici
- **Istatistikler** — Haftalik/aylik grafik, seri sayaclari, 12 haftalik isi haritasi
- **Yonetim** — Aktiviteleri duzenle, arsivle veya sil

## Teknoloji

| | |
|---|---|
| Framework | React Native + Expo (SDK 54) |
| Navigasyon | Expo Router |
| Depolama | AsyncStorage (yerel) |
| Grafikler | react-native-chart-kit |
| Bildirimler | expo-notifications |
| Dil | TypeScript |

## Kurulum

```bash
git clone https://github.com/cetinnyigit/RutinTracker.git
cd RutinTracker
npm install
npx expo start
```

Expo Go uygulamasindan QR kodu taratarak test edebilirsin.

## Notlar

- Tum veriler cihazda yerel olarak saklanir, backend gerektirmez
- Tamamen cevrimdisi calisir
- iOS ve Android uyumlu
