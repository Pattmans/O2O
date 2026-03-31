# O2O Marketing Dashboard

AI-powered 30-day Online-to-Offline campaign planner powered by Google Gemini.

## 🚀 Quick Start (Local)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/o2o-marketing-dashboard.git
cd o2o-marketing-dashboard

# 2. Install dependencies
npm install

# 3. Set up your API key
cp .env.example .env
# Edit .env and add your Gemini API key

# 4. Run dev server
npm run dev
```

Open http://localhost:5173

## 🔑 Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Copy the key into your `.env` file:
   ```
   VITE_GEMINI_API_KEY=AIza...
   ```

## 📦 Deploy to GitHub Pages

### Automatic (GitHub Actions)

1. Push this project to a GitHub repository
2. Go to **Settings → Secrets and variables → Actions**
3. Add secret: `VITE_GEMINI_API_KEY` = your key
4. Go to **Settings → Pages** → Source: **GitHub Actions**
5. Push to `main` branch — it deploys automatically!

### Manual

```bash
npm run build
npm run deploy  # requires gh-pages package
```

### ⚠️ Update vite.config.js

Change the `base` to your **actual repo name**:

```js
base: '/your-repo-name/',
```

## 🛠 Tech Stack

- React 18 + Vite
- Tailwind CSS
- Lucide React icons
- Google Gemini API (gemini-2.0-flash-exp)
- localStorage for persistence

## 📁 Structure

```
src/
  App.jsx       # Main component (all-in-one)
  main.jsx      # React entry point
  index.css     # Tailwind directives
```
