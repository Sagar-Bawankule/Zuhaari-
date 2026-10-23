// ─── Socket.IO Event Names ───────────────────────────────

/** Client → Server events */
export enum ClientEvent {
  CreateRoom = 'room:create',
  JoinRoom = 'room:join',
  LeaveRoom = 'room:leave',
  ToggleReady = 'room:toggle_ready',
  SelectSeat = 'room:select_seat',
  StartGame = 'room:start_game',
  Reconnect = 'room:reconnect',

  CuttBid = 'game:cutt_bid',
  PlayCard = 'game:play_card',
  PlayAgain = 'game:play_again',
}

/** Server → Client events */
export enum ServerEvent {
  RoomCreated = 'room:created',
  RoomJoined = 'room:joined',
  RoomUpdated = 'room:updated',
  RoomError = 'room:error',
  PlayerJoined = 'room:player_joined',
  PlayerLeft = 'room:player_left',
  PlayerReconnected = 'room:player_reconnected',
  PlayerDisconnected = 'room:player_disconnected',

  GameStarted = 'game:started',
  FirstDeal = 'game:first_deal',
  SecondDeal = 'game:second_deal',
  CuttTurn = 'game:cutt_turn',
  CuttDeclared = 'game:cutt_declared',
  GameStateUpdate = 'game:state_update',
  CardPlayed = 'game:card_played',
  HandComplete = 'game:hand_complete',
  RoundComplete = 'game:round_complete',
  GameError = 'game:error',
  TurnUpdate = 'game:turn_update',
}

// ─── Client → Server Payloads ────────────────────────────

export interface CreateRoomPayload {
  playerName: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}

export interface SelectSeatPayload {
  seatIndex: number;
}

export interface ReconnectPayload {
  roomCode: string;
  sessionToken: string;
}

export interface CuttBidPayload {
  action: 'declare' | 'pass';
  suit?: string; // Suit enum value, required if action='declare'
}

export interface PlayCardPayload {
  cardId: string;
}

// ─── Server → Client Payloads ────────────────────────────

export interface RoomCreatedPayload {
  roomCode: string;
  sessionToken: string;
  seatIndex: number;
}

export interface RoomJoinedPayload {
  roomCode: string;
  sessionToken: string;
  seatIndex: number;
}

export interface RoomErrorPayload {
  message: string;
  code?: string;
}

export interface GameErrorPayload {
  message: string;
  code?: string;
}
