# Tic Tac Toe - Frontend

This is the frontend for a real-time multiplayer Tic Tac Toe game built with Next.js, Socket.io, and Tailwind CSS.

## Features

- Real-time multiplayer gameplay using Socket.io
- Online matchmaking/queue system
- Local multiplayer mode
- Custom room creation with shareable codes
- Responsive design with dark/light mode support
- Modern UI with animations using Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Backend service running (see backend README)

### Environment Setup

Create a `.env` file in the root of the frontend directory with the following variables:

```
# Required: URL to your backend service
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000

# Optional: Analytics (if using Umami)
NEXT_PUBLIC_UMAMI_URL=
NEXT_PUBLIC_UMAMI_WEBSITE_ID=
```

Copy the `.env.example` file to create your `.env`:

```bash
cp .env.example .env
```

### Installation

```bash
# Install dependencies
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Development

```bash
# Start development server
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the game.

## Tech Stack

- [Next.js](https://nextjs.org) - React framework
- [Socket.io Client](https://socket.io/docs/v4/client-api/) - Real-time communication
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [ShadcnUI](https://ui.shadcn.com/) - UI components

## Project Structure

- `/src/app` - Main application pages
- `/src/components` - Reusable UI components
- `/src/lib` - Utility libraries and configuration
- `/src/utils` - Helper functions
