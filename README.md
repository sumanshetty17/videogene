# Reelmind — cinematic 3D explainer studio

Paste a lesson. The studio plays a cinematic 3D teardown: living characters, a real brushed DC motor exploded along the shaft, and narration that locks the camera onto the named part.

## Stack

- TanStack Start + React 19 + Tailwind v4
- three.js via React Three Fiber
- Optional xAI voice (`XAI_API_KEY`) for narration

## Run locally

```bash
npm install
npm run dev
```

## Push to GitHub

1. Unzip this folder.
2. Create a new empty GitHub repo.
3. From the unzipped folder:

```bash
git init
git add .
git commit -m "Reelmind cinematic studio"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

## Deploy on Render

1. Open [Render](https://render.com) → **New** → **Blueprint**.
2. Connect the GitHub repo. Render reads `render.yaml`.
3. Or create a **Web Service** by hand:
   - **Runtime:** Node
   - **Build command:** `npm ci && npm run build`
   - **Start command:** `npm start`
   - **Node version:** 22
4. Add env var `XAI_API_KEY` if you want generated lessons and spoken narration. Without it, the built-in motor lesson still plays and the browser voice is used.

The production server is Nitro (`node-server`) and listens on Render’s `PORT`.

## What the motor model is

A brushed DC motor, exploded to the right:

| Part | Real component |
| --- | --- |
| Stator housing | Drawn-steel yoke / can |
| Ferrite magnet tiles | Curved ceramic arc magnets |
| Laminated armature | Silicon-steel stack + enamelled copper |
| Copper commutator | Segmented barrel with mica gaps |
| Carbon brushes | Graphite blocks, brass cages, springs |
| Steel shaft | Output shaft + end-bell bearings |
