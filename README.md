# Ultimate Tic Tac Toe

This is a Turborepo project containing a real-time multiplayer Ultimate Tic Tac Toe game.

## Demo

Live demo available at: [ttt.luggapugga.dev](https://ttt.luggapugga.dev)

## What's in the Project

The project contains:

- **Applications**:

  - `frontend`: TanStack Start with SolidJS application for the game UI
  - `backend`: Elysia server with native WebSockets for real-time gameplay

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
   bun install
   ```

3. **Run the development servers**:

   ```sh
   bun run dev
   ```

4. **Build everything**:
   ```sh
   bun run build
   ```

## Tech Stack

- **Frontend**: TanStack Start, SolidJS, TanStack Router, Tailwind CSS, Solid-UI
- **Backend**: Elysia, Native WebSockets, TypeScript, Bun

For more detailed information about each application, please see the README files in their respective directories:

- [Frontend README](apps/frontend/README.md)
- [Backend README](apps/backend/README.md)
