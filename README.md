# Ultimate Tic Tac Toe

This is a Turborepo project containing a real-time multiplayer Ultimate Tic Tac Toe game.

## Demo

Live demo available at: [ttt.luggapugga.dev](https://ttt.luggapugga.dev)

## What's in the Project

The project contains:

- **Applications**:

  - `frontend`: Next.js application with the game UI
  - `backend`: Socket.IO/Express server for real-time gameplay

- **Shared Packages**:
  - `@repo/eslint-config`: Shared ESLint configurations
  - `@repo/typescript-config`: Shared TypeScript configurations

## Features

- Real-time multiplayer gameplay
- Online matchmaking system
- Custom room creation with shareable codes
- Responsive design with dark/light mode
- Modern UI with animations

## Getting Started

To start working with this project:

1. **Clone the repository**:

   ```sh
   git clone https://github.com/luggapugga/tictactoe.git
   cd tictactoe
   ```

2. **Install dependencies**:

   ```sh
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**:

   ```sh
   # For the frontend
   cp apps/frontend/.env.example apps/frontend/.env
   ```

4. **Run the development servers**:

   ```sh
   npm run dev
   # or
   bun run dev
   ```

5. **Build everything**:
   ```sh
   npm run build
   # or
   bun run build
   ```

## Tech Stack

- **Frontend**: Next.js, Socket.IO Client, Tailwind CSS, ShadcnUI
- **Backend**: Express, Socket.IO, TypeScript, Bun

For more detailed information about each application, please see the README files in their respective directories:

- [Frontend README](apps/frontend/README.md)
- [Backend README](apps/backend/README.md)
