// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

//----フィールド----------------//
// 接続中のユーザー数を管理
let connectedUsers = 0;
// 作成された部屋を管理
const rooms = new Map();
// ユーザーの状態を管理
const userStates = new Map();
//-------------------------------//


// デバッグ用：現在の接続数を表示する関数
const logConnectionStatus = (action) => {
  console.log(`[DEBUG] ${action} - connectedUsers: ${connectedUsers}`);
};

// デバッグ用：現在の部屋数を表示する関数
const logRoomStatus = (action) => {
  console.log(`[DEBUG] ${action} - 現在の部屋数: ${rooms.size}`);
};



// 部屋の一覧を取得する関数（参加可能な部屋のみ）
const getRoomsList = () => {
  return Array.from(rooms.entries())
    .filter(([_, room]) => room.status === 'waiting')
    .map(([roomId, room]) => ({
      roomId,
      roomName: room.name,
      roomCreator: room.roomCreator,
      createdAt: room.createdAt,
      createdBy: room.createdBy,
      status: room.status
    }));
};

// ユーザーの状態を更新する関数
const updateUserState = (socketId, state) => {
  userStates.set(socketId, state);
  console.log(`[DEBUG] ユーザー状態を更新: ${socketId} -> ${state}`);
};


//----localhost:3000に接続してwebページを表示
io.on('connection', (socket) => {
  // ユーザー数を増やす
  connectedUsers++;
  logConnectionStatus('接続時');
  updateUserState(socket.id, 'online');
  
  // 接続時に部屋一覧を送信
  socket.emit('roomsList', getRoomsList());
  console.log('[DEBUG] 接続時に部屋一覧を送信:', getRoomsList());

  // 接続時に全クライアントに接続数を送信
  io.emit('userCount', connectedUsers);

  // ------クライアントからの部屋作成リクエストを処理-----//
  socket.on('createRoom', (data) => {

    // 既に部屋に参加している場合はエラー
    if (userStates.get(socket.id) === 'in_room') {
      socket.emit('roomError', {
        message: 'エラー: 既に部屋に参加しています'
      });
      return;
    }

    const now = new Date().toLocaleString('ja-JP');
    console.log(`[${now}] 部屋作成リクエストを受信:`, data);

    // データの検証
    if (!data.roomName || typeof data.roomName !== 'string' || !data.roomId) {
      console.log('[DEBUG] 無効な部屋作成リクエスト');
      socket.emit('roomError', {
        message: 'エラー: 無効な部屋情報です'
      });
      return;
    }

    // 部屋名の長さチェック
    if (data.roomName.length > 50) {
      console.log('[DEBUG] 部屋名が長すぎます');
      socket.emit('roomError', {
        message: 'エラー: 部屋名は50文字以内で入力してください'
      });
      return;
    }

    // 部屋IDの重複チェック
    if (rooms.has(data.roomId)) {
      console.log('[DEBUG] 部屋IDが重複しています');
      socket.emit('roomError', {
        message: 'エラー: この部屋IDは既に使用されています'
      });
      return;
    }

    console.log('[DEBUG] 部屋を作成します:', {
      roomId: data.roomId,
      roomName: data.roomName,
      currentRoomCount: rooms.size
    });

    // 部屋を作成
    rooms.set(data.roomId, {
      name: data.roomName,
      roomCreator: data.roomCreator,
      createdAt: new Date(),
      createdBy: socket.id,
      status: 'waiting',
      players: [socket.id] // 作成者をプレイヤーとして追加
    });

    // ユーザーの状態を更新
    updateUserState(socket.id, 'in_room');

    logRoomStatus('部屋作成後');
    console.log('[DEBUG] 部屋一覧を送信します:', getRoomsList());

    // 作成者に成功を通知
    socket.emit('roomCreated', {
      roomId: data.roomId,
      roomName: data.roomName,
      roomCreator: data.roomCreator,
      status: 'waiting',
      isHost: true
    });

    // 全クライアントに部屋一覧を送信
    io.emit('roomsList', getRoomsList());

    console.log(`[DEBUG] 部屋を作成しました: ${data.roomName} (ID: ${data.roomId})`);
  });
  //-------------------------------------------------//

  // 部屋への参加リクエストを処理
  socket.on('joinRoom', (data) => {
    // 既に部屋に参加している場合はエラー
    if (userStates.get(socket.id) === 'in_room') {
      socket.emit('roomError', {
        message: 'エラー: 既に部屋に参加しています'
      });
      return;
    }

    const room = rooms.get(data.roomId);
    if (!room) {
      socket.emit('roomError', {
        message: 'エラー: 指定された部屋が存在しません'
      });
      return;
    }

    if (room.status !== 'waiting') {
      socket.emit('roomError', {
        message: 'エラー: この部屋は既に開始されています'
      });
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('roomError', {
        message: 'エラー: この部屋は満員です'
      });
      return;
    }

    // 部屋に参加者を追加
    room.players.push(socket.id);
    room.status = room.players.length === 2 ? 'in_progress' : 'waiting';
    
    // 参加者の名前を保存
    if (!room.playerNames) {
      room.playerNames = new Map();
    }
    room.playerNames.set(socket.id, data.playerName);

    // ユーザーの状態を更新
    updateUserState(socket.id, 'in_room');

    // 部屋の作成者と参加者に通知
    const hostSocket = io.sockets.sockets.get(room.createdBy);
    if (hostSocket) {
      const opponentName = room.playerNames.get(socket.id);  // 参加者の名前を取得
      hostSocket.emit('roomStatusChanged', {
        roomId: data.roomId,
        status: room.status,
        opponent: socket.id,
        roomCreator: room.roomCreator,
        opponentName: opponentName,  // 参加者の名前を送信
        playerName: room.playerNames.get(room.createdBy)  // ホストの名前も送信
      });
    }

    socket.emit('roomJoined', {
      roomId: data.roomId,
      roomName: room.name,
      status: room.status,
      isHost: false,
      opponent: room.createdBy,
      roomCreator: room.roomCreator,
      playerName: data.playerName  // 参加者の名前を追加
    });

    // 全クライアントに部屋一覧を更新
    io.emit('roomsList', getRoomsList());
  });

  // 部屋からの退出リクエストを処理
  socket.on('leaveRoom', (data) => {
    const room = rooms.get(data.roomId);
    if (!room) return;

    // 部屋からプレイヤーを削除
    room.players = room.players.filter(id => id !== socket.id);
    // プレイヤーの名前も削除
    if (room.playerNames) {
      room.playerNames.delete(socket.id);
    }
    
    // 部屋が空になった場合は削除
    if (room.players.length === 0) {
      rooms.delete(data.roomId);
      logRoomStatus('部屋削除後');
    } else {
      // 残りのプレイヤーに通知
      const remainingPlayer = room.players[0];
      const remainingSocket = io.sockets.sockets.get(remainingPlayer);
      if (remainingSocket) {
        remainingSocket.emit('opponentLeft', {
          roomId: data.roomId
        });
      }
      room.status = 'waiting';
    }

    // ユーザーの状態を更新
    updateUserState(socket.id, 'online');

    // 全クライアントに部屋一覧を更新
    io.emit('roomsList', getRoomsList());
  });

  // --------------切断時の処理-------------//
  socket.on('disconnect', () => {
    // ユーザーが参加している部屋を探して処理
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.includes(socket.id)) {
        // 部屋からプレイヤーを削除
        room.players = room.players.filter(id => id !== socket.id);
        
        // 部屋が空になった場合は削除
        if (room.players.length === 0) {
          rooms.delete(roomId);
          logRoomStatus('部屋削除後');
        } else {
          // 残りのプレイヤーに通知
          const remainingPlayer = room.players[0];
          const remainingSocket = io.sockets.sockets.get(remainingPlayer);
          if (remainingSocket) {
            remainingSocket.emit('opponentLeft', {
              roomId: roomId
            });
          }
          room.status = 'waiting';
        }
      }
    }

    // ユーザー状態を削除
    userStates.delete(socket.id);

    // 既存の切断処理
    connectedUsers--;
    logConnectionStatus('切断時');
    
    const now = new Date().toLocaleString('ja-JP');
    console.log(`[${now}] クライアントが切断されました (現在の接続数: ${connectedUsers})`);
    
    io.emit('userCount', connectedUsers);
    io.emit('roomsList', getRoomsList());
  });
  //--------------------------------------//


  // クライアントからのメッセージを受信
  socket.on('clientMessage', (data) => {
    const now = new Date().toLocaleString('ja-JP');
    console.log(`[${now}] メッセージを受信:`, data);

    // メッセージの検証
    if (!data.message || typeof data.message !== 'string') {
      console.log('[DEBUG] 無効なメッセージ形式');
      socket.emit('serverResponse', {
        message: 'エラー: 無効なメッセージ形式です'
      });
      return;
    }

    // メッセージの長さチェック
    if (data.message.length > 1000) {
      console.log('[DEBUG] メッセージが長すぎます');
      socket.emit('serverResponse', {
        message: 'エラー: メッセージは1000文字以内で入力してください'
      });
      return;
    }

    // 正常なメッセージの場合、応答を送信
    socket.emit('serverResponse', {
      message: `メッセージを受信しました: "${data.message}"`
    });

    // 全クライアントに通知（オプション）
    socket.broadcast.emit('serverResponse', {
      message: `新しいメッセージ: "${data.message}"`
    });
  });
});
//----------------------------------------------------//


//--------表示するwebページの参照元------//
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});
//-------------------------------------//


//-------プライベートアドレスでサーバーを起動------//
//const PORT = 3000;
const PORT = 3001;
const HOST = '0.0.0.0';  // すべてのネットワークインターフェースでリッスン

server.listen(PORT, HOST, () => {
  console.log(`サーバーが起動しました: http://${HOST}:${PORT}`);
  console.log('注意: プライベートアドレス（例：192.168.x.x）でアクセスしてください');
  console.log('[DEBUG] サーバー起動時の接続数: 0');
  logRoomStatus('サーバー起動時');
});
//----------------------------------------//