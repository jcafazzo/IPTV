# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TeleArgentina is a retro-styled IPTV streaming application that displays Argentine TV channels in a nostalgic CRT television interface. The app scans channel streams to determine availability and allows users to browse and watch live content.

## Development Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # TypeScript build + Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
npx convex dev   # Start Convex backend in development mode
```

## Architecture

### Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Convex (realtime database)
- **Video**: hls.js for HLS stream playback
- **Styling**: Tailwind CSS

### Key Components

**[App.tsx](src/App.tsx)** - Root component that:
- Fetches channels from Convex
- Manages power/volume/channel state
- Sorts channels by working > unknown > failed status
- Coordinates between TV and ChannelGuide components

**[TV.tsx](src/components/TV.tsx)** - The retro TV display with:
- HLS video playback via hls.js (with Safari native fallback)
- YouTube iframe support for `youtube_video` and `youtube_live` types
- Cross-platform fullscreen handling (standard API + webkit fallbacks for iOS)
- Physical knob controls for channel/volume (click left/right to adjust)

**[useChannelScanner.ts](src/hooks/useChannelScanner.ts)** - Background channel scanner that:
- Tests each channel URL to determine if it's working
- Runs 3 concurrent workers with 8s timeout per channel
- Persists results to localStorage (`argentina_tv_working`, `argentina_tv_failed`)
- Skips unsupported protocols (rtsp, rtmp, mms)

### Convex Backend

**[schema.ts](convex/schema.ts)** - Channels table with types: `m3u8`, `youtube_video`, `youtube_live`, `iframe`

**[channels.ts](convex/channels.ts)** - Contains:
- `get` query: Returns active channels ordered by index
- `seed` mutation: Clears and repopulates channel list from hardcoded data

### Channel Types
- `m3u8`: HLS streams played via hls.js
- `youtube_video` / `youtube_live`: Embedded via iframe
- `iframe`: Generic iframe embed

## Environment

This project uses **Convex Cloud** (not local dev). The `.env.local` file contains:
- `CONVEX_DEPLOYMENT` - The Convex cloud deployment name
- `VITE_CONVEX_URL` - The Convex cloud URL for the frontend

### Deploying Convex Functions

**Important:** This app uses the DEV deployment (`admired-tiger-5`), not production.

To push updated Convex functions:
```bash
npx convex dev --once    # Push to dev deployment (what the app uses)
npx convex deploy        # Push to prod deployment (NOT used by app currently)
```

This is required whenever you modify files in the `convex/` directory (like `channels.ts` or `schema.ts`).

### Development

For local development with hot-reload of Convex functions:
```bash
npx convex dev
```

Note: `npm convex dev` does NOT work - must use `npx`.
