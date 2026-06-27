# MovieDen App

🎬 MovieDen — Your ultimate movie destination

## Setup

### ১. GAS URL বসাও
`src/utils/constants.js` খোলো এবং:
- `APPS_SCRIPT_URL` → তোমার Settings GAS deploy URL দাও
- `API_URL` → তোমার Content GAS deploy URL দাও (অথবা admin panel থেকে `content_api_url` দাও)

### ২. GitHub এ push করো
সব ফাইল GitHub repo তে upload করো।

### ৩. APK Build
GitHub Actions নিজেই APK build করবে। `Actions` tab এ দেখো।

### ৪. নতুন Version Release
```bash
# app.json এ version বাড়াও
# src/utils/constants.js এ APP_VERSION বাড়াও
git add .
git commit -m "v1.1.0"
git tag v1.1.0
git push origin main --tags
```
Tag push হলে GitHub Actions APK build করে Release তৈরি করবে।
APK link টা Admin Panel এ `apk_download_url` এ দাও।

## Admin Panel
`admin.html` browser এ খোলো → GAS URL দাও → সব control করো।

- App নাম, Logo, Splash screen — GitHub ছাড়াই বদলাও
- Maintenance mode, Force Update, Banner — সব admin থেকে
