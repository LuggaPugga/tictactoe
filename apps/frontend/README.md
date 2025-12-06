# Ultimate Tic Tac Toe - Frontend

A real-time multiplayer Ultimate Tic-Tac-Toe game client built with TanStack Start and SolidJS.

## Tech Stack

- **Framework**: TanStack Start with SolidJS
- **Routing**: TanStack Router (file-based)
- **Styling**: Tailwind CSS v4
- **UI Components**: Solid-UI (Kobalte)
- **Animations**: solid-motionone
- **WebSocket Client**: Elysia Eden

## Getting Started

```bash
bun install
bun run dev
```

## Building For Production

```bash
bun run build
bun run start
```

## Project Structure

- `src/routes/` - File-based routing with TanStack Router
- `src/components/` - Reusable UI components
- `src/lib/` - Utilities, stores, and WebSocket client
- `src/hooks/` - Custom hooks

## Features

- Real-time multiplayer gameplay via WebSockets
- Local multiplayer mode
- Dark/light theme toggle
- Responsive design
- Game state persistence
