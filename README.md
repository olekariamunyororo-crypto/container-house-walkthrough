# 40ft Container House – Expo + Three.js Walkthrough

First-person walkthrough of the Thrixel 1-bedroom 40ft container house.

## Local

```bash
git clone https://github.com/olekariamunyororo-crypto/container-house-walkthrough.git
cd container-house-walkthrough
npm install
npx expo start
# press w for browser
```

The 3D model is loaded at runtime from Thrixel (no large file in the repo).

## Deploy on Render (Static Site)

1. New → **Static Site** → connect this GitHub repo  
2. Settings:
   - **Build Command:** `npm install && npx expo export --platform web`
   - **Publish Directory:** `dist`
3. Deploy

Or use the included `render.yaml` (Blueprint).

### Manual static build

```bash
npm install
npm run build:web    # creates ./dist
npx serve dist
```

## Controls

| Platform | Look | Move |
|----------|------|------|
| Web | Click scene (pointer lock) | WASD / arrows |
| Mobile | Drag | Virtual joystick |

## Tech

Expo SDK 52 · expo-gl · expo-three · three · static web export

Model: https://thrixel.com/create/share/T9ABSuHN5J
