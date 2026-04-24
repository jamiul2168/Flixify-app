# 🎬 Flixify Android App

Flixify ওয়েবসাইটের হুবহু Android APK version — Google Apps Script API দিয়ে চালিত।

---

## 📱 Features

- ✅ সব মুভি/সিরিজ গ্রিড layout-এ দেখাবে
- ✅ Category filter chips
- ✅ Live Search with suggestions
- ✅ Movie details modal (screenshot, trailer, episodes)
- ✅ Download flow (countdown + 2-step unlock)
- ✅ 18+ toggle (blurred content protection)
- ✅ Share & Copy link
- ✅ Telegram & Request buttons
- ✅ Pull-to-refresh
- ✅ Domain block detection
- ✅ No internet detection

---

## 🚀 GitHub Actions দিয়ে APK Build করার পদ্ধতি

### Step 1: Expo Account তৈরি করুন
1. [expo.dev](https://expo.dev) এ গিয়ে account তৈরি করুন
2. প্রয়োজনে একটি নতুন project তৈরি করুন

### Step 2: EAS Project Setup
```bash
npm install -g eas-cli
eas login
eas build:configure
```
এটি run করলে `app.json` এ `extra.eas.projectId` automatically set হবে।

### Step 3: GitHub Secrets সেট করুন
GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Value |
|-------------|-------|
| `EXPO_TOKEN` | Expo dashboard থেকে Access Token (Settings > Access Tokens) |
| `EXPO_USERNAME` | আপনার Expo username |
| `EXPO_PASSWORD` | আপনার Expo password |

### Step 4: Repository-তে Push করুন
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/flixify-app.git
git push -u origin main
```

### Step 5: APK Download করুন
- Push করার পর GitHub Actions automatically build শুরু হবে
- **Actions** tab → latest workflow run → **Artifacts** section থেকে APK download করুন
- অথবা EAS Dashboard: [expo.dev/builds](https://expo.dev/builds) থেকেও download করতে পারবেন

---

## 🏷️ Version Release APK বানাতে
```bash
git tag v1.0.0
git push origin v1.0.0
```
এটি push করলে GitHub Release-এ APK automatically attach হবে।

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Android emulator-এ run করুন
npx expo run:android
```

---

## 📁 Project Structure

```
flixify-app/
├── .github/
│   └── workflows/
│       └── build-apk.yml        ← GitHub Actions workflow
├── src/
│   ├── screens/
│   │   └── HomeScreen.js        ← Main movie listing page
│   ├── components/
│   │   ├── MovieCard.js         ← Individual movie card
│   │   └── MovieModal.js        ← Movie details popup
│   └── utils/
│       ├── constants.js         ← API URL, colors, config
│       └── api.js               ← API fetch functions
├── App.js                       ← Entry point
├── app.json                     ← Expo config
├── eas.json                     ← EAS Build config
├── package.json
└── babel.config.js
```

---

## ⚙️ Configuration পরিবর্তন করতে

**`src/utils/constants.js`** ফাইলে:
```js
export const API_URL = 'your-google-apps-script-url';
export const DOMAIN = 'flixify.app';         // আপনার domain
export const TELEGRAM_URL = 'your-telegram'; // Telegram link
export const REQUEST_URL = 'your-request-url';
export const AD_URL = 'your-ad-url';         // Ad URL
```

**`app.json`** ফাইলে:
```json
{
  "expo": {
    "name": "Flixify",
    "android": {
      "package": "com.flixify.app"  ← আপনার unique package name
    }
  }
}
```

---

## 📝 Notes

- EAS Build **free tier**-এ মাসে ৩০টি build করা যায়
- APK size সাধারণত 20–40MB হয়
- Build time: প্রায় 5–15 মিনিট

---

**Developed by [Jamiul Hasan](https://web.facebook.com/jamiul2168)**
