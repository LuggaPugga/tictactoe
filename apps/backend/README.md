# Tic Tac Toe - Backend

A real-time multiplayer Ultimate Tic-Tac-Toe game server using Socket.IO, Express, and Bun.

## Features

- Real-time Gameplay
- Matchmaking
- Room Management
- Spectator Mode
- Reconnection Support
- Score Tracking
- Game State Management

## Game Rules

Ultimate Tic-Tac-Toe is played on a 3x3 grid of 3x3 Tic-Tac-Toe boards.

1.  First player can play anywhere.
2.  Subsequent players play in the small board corresponding to the previous move's cell.
3.  If sent to a won/full board, player can play on any open cell.
4.  Win a small board by getting three in a row.
5.  Win the game by getting three small boards in a row.

## Environment Variables

- `PORT`: Server port (default: 5000)

## API Documentation

### HTTP Endpoints

#### Create a Room

```
POST /api/create-room
```

#### Response:

```json
{
  "roomCode": "ABC123"
}
```

### Socket.IO Events

#### Client to Server

- **joinQueue**: Join matchmaking queue.
- **leaveQueue**: Leave matchmaking queue.
- **joinRoom**: Join a room.
- **makeMove**: Make a move.
- **requestGameReset**: Reset the game.
- **reconnect**: Reconnect to a game.

#### Server to Client

- **lobbyCreated**: Lobby created notification.
- **gameStart**: Game starts with initial state.
- **updateGame**: Game state update.
- **gameOver**: Game over with results.
- **waitingForOpponent**: Waiting for player.
- **playerReconnected**: Player reconnected.
- **playerDisconnected**: Player disconnected.
- **joinedQueue**: Joined queue confirmation.
- **leftQueue**: Left queue confirmation.
- **queueUpdate**: Queue position update.
- **queueFull**: Queue full.
- **joinedAsSpectator**: Joined as spectator.
- **spectatorJoined**: Spectator joined.
- **spectatorLeft**: Spectator left.
- **reconnected**: Reconnected with game state.
- **gameReset**: Game reset.
- **sessionCode**: Session code provided.
- Error events: **roomNotFound**, **gameNotReady**, **notYourTurn**, **invalidMove**, etc.

## Technical Details

- **Socket.IO**: Real-time communication
- **Express**: HTTP routing
- **Node.js**: HTTP server
- **TypeScript**: Type checking
