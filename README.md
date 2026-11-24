# 555DEM 二手選物商店

解壓後，直接將本資料夾內的檔案上傳到 GitHub repository 的根目錄。首頁是 `index.html`，賣家頁是 `seller.html`。兩頁都使用相對路徑，支援網站放在子目錄。這個版本無需 ChatGPT 登入或託管。

## 在 GitHub Pages 展示

適合非商業展示或作業。到 GitHub repository 的 **Settings → Pages**，選 **Deploy from a branch → main → /(root)**，儲存後從 Pages 設定頁取得網址。若看不到 `.nojekyll`，仍可上傳其他檔案。

GitHub Pages 的 [使用限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) 不允許用它經營電商。若要正式販售，GitHub 可保管原始碼，公開店面請用下面的 Firebase Hosting。

## 啟用 Google 登入和上架

從店面可選「訪客瀏覽」或「賣家登入」。設定完成後，賣家按 Google 登入會開啟官方驗證小視窗，完成後回到原本的賣家中心。若已有可用的 firebase-config.js，更新網站時請保留該檔。

1. 在 [Firebase Console](https://console.firebase.google.com/) 建立一個專供商店使用的專案，新增 Web App。複製其 `firebaseConfig` 物件，貼進 `firebase-config.js`，取代 `null`。使用 Web App 設定即可，請勿把服務帳戶金鑰放入 GitHub。
2. 到 **Authentication → Sign-in method** 啟用 **Google**。在 **Authentication → Settings → Authorized domains** 加上實際網站網域（例如 `你的帳號.github.io`，不要加 `https://` 或路徑）。若用 Firebase Hosting 預設網域，請確認已在清單中。
3. 建立 **Cloud Firestore** 資料庫，選正式模式。到 **Firestore Database → Rules** 貼入 `firestore.rules` 全文並按 **Publish**。規則讓訪客讀商品，只有指定 Gmail 經 Google 驗證後可新增商品。
4. 將更新後的 `firebase-config.js` 提交到 GitHub，或執行下方 Firebase Hosting 部署。開啟店面右上角的 **賣家中心**，以 `Mrnobodyspreownedmarketplace@gmail.com` 登入並新增商品。用無痕視窗開首頁，確認免登入也能看到商品。

一件商品可上傳一張 JPG、PNG 或 WebP。瀏覽器會先壓縮照片，再把照片和商品資料一併寫入 Firestore。這個版本提供商品展示和上架，沒有結帳或付款功能。

## 部署到 Firebase Hosting

在已安裝 Node.js 的電腦上開啟終端機，切換到解壓後的網站檔案目錄，再執行以下指令。把 `YOUR_PROJECT_ID` 換成 Firebase 的專案 ID。

```sh
npx firebase-tools login
npx firebase-tools deploy --only hosting,firestore --project YOUR_PROJECT_ID
```

部署會套用商品安全規則與索引設定，並在終端機列出公開網址。[Firebase Hosting 官方說明](https://firebase.google.com/docs/hosting/quickstart)
