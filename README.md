# 40ft Container House – Expo + Three.js Walkthrough

First-person walkthrough of the Thrixel **1-bedroom 40ft container house** model.

## Quick Start

```bash
git clone https://github.com/olekariamunyororo-crypto/container-house-walkthrough.git
cd container-house-walkthrough
npm install
```

### Get the 3D model (required)

The GLB (~41 MB) is **not** stored in this repo (GitHub file size limits).

1. Open the original model: https://thrixel.com/create/share/T9ABSuHN5J
2. Click the download icon → choose **GLB**
3. Place the file at:
   ```
   assets/container_house.glb
   ```

Then run:

```bash
npx expo start
```

- Press `w` for browser (best controls)
- Or scan the QR with Expo Go

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
│   └── container_house.glb   ← add this yourself
├── src/components/
│   └── HouseWalkthrough.tsx
├── package.json
└── README.md
```

## Tech

- Expo SDK 52
- expo-gl + expo-three + three
- Pure Three.js first-person camera (no R3F required)

## Model credit

Shared from Thrixel:  
https://thrixel.com/create/share/T9ABSuHN5J  
“1 bedroom 40ft container house” by Pewter Gauge 24
