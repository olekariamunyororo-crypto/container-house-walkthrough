# 40ft Container House – Expo + Three.js Walkthrough

First-person walkthrough of the Thrixel **1-bedroom 40ft container house** model.

Works as:
- Local Expo app (iOS / Android / Web)
- **Static website** (deployable to Render, Vercel, Netlify, Cloudflare Pages, etc.)

## Quick Start (local)

```bash
git clone https://github.com/olekariamunyororo-crypto/container-house-walkthrough.git
cd container-house-walkthrough
npm install   # or yarn
```

### Add the 3D model (required)

The GLB (~41 MB) is not in the repo (GitHub size limits).

1. Open https://thrixel.com/create/share/T9ABSuHN5J  
2. Download icon → **GLB**
3. Save as:
   ```
   assets/container_house.glb
   ```

Then:

```bash
npx expo start
# press w for browser
```

## Deploy as static site on Render

1. Push this repo (with `assets/container_house.glb` included, or use a Git LFS / external host).
2. In Render Dashboard → **New → Static Site**
3. Connect the GitHub repo
4. Settings (or use the included `render.yaml`):
   - **Build Command:** `yarn install && yarn build:web`
   - **Publish Directory:** `dist`
5. Deploy

Or manually:

```bash
yarn install
yarn build:web          # creates ./dist
npx serve dist          # test locally
```

## Controls

| Platform | Look | Move |
|----------|------|------|
| **Web**  | Click scene to lock mouse | WASD / Arrow keys |
| **Mobile** | Drag anywhere | Virtual joystick (bottom-left) |

Press **Exit** (top-right) or `Esc` (web) to leave.

## Project Structure

```
├── App.tsx
├── assets/
│   └── container_house.glb   ← required (download from Thrixel)
├── src/components/
│   └── HouseWalkthrough.tsx
├── render.yaml               ← Render static site config
├── package.json
└── README.md
```

## Tech

- Expo SDK 52
- expo-gl + expo-three + three
- Pure Three.js first-person camera
- Static web export (`expo.web.output: "single"`)

## Model credit

https://thrixel.com/create/share/T9ABSuHN5J  
“1 bedroom 40ft container house” by Pewter Gauge 24
