# Socket.IO データ送受信方法 完全ガイド

## 📋 目次

1. [基本的なデータ送受信](#基本的なデータ送受信)
2. [イベントベース vs 手動リクエスト](#イベントベース-vs-手動リクエスト)
3. [データ送受信のパターン](#データ送受信のパターン)
4. [実用的な使用例](#実用的な使用例)
5. [ベストプラクティス](#ベストプラクティス)

---

## 基本的なデータ送受信

### Socket.IOでのデータ送受信の基本

Socket.IOでは、クライアントとサーバー間でデータをやり取りする方法がいくつかあります。

#### 1. イベントベース（推奨）

```javascript
// サーバー側
io.on('connection', (socket) => {
  // データを送信
  socket.emit('userData', { id: socket.id, name: 'User1' });
  
  // データを受信
  socket.on('clientData', (data) => {
    console.log('受信したデータ:', data);
  });
});

// クライアント側
const socket = io();

// データを受信
socket.on('userData', (data) => {
  console.log('サーバーからのデータ:', data);
});

// データを送信
socket.emit('clientData', { message: 'Hello Server!' });
```

#### 2. 接続時の初期データ送信

```javascript
// サーバー側
io.on('connection', (socket) => {
  // 接続直後に初期データを送信
  socket.emit('initialData', {
    userId: socket.id,
    serverTime: new Date(),
    userCount: connectedUsers,
    serverVersion: '1.0.0'
  });
});

// クライアント側
socket.on('initialData', (data) => {
  console.log('初期データ:', data);
  // アプリケーションの初期化処理
});
```

---

## イベントベース vs 手動リクエスト

### イベントベース（プッシュ型）

**特徴**: サーバーが自動的にデータを送信

```javascript
// サーバー側
io.on('connection', (socket) => {
  // 接続時に自動送信
  socket.emit('userCount', connectedUsers);
  
  // データ変更時に全員に通知
  socket.on('clientMessage', (data) => {
    io.emit('message', `ユーザー: ${data.message}`);
  });
});

// クライアント側
socket.on('userCount', (count) => {
  updateUserCount(count);
});

socket.on('message', (message) => {
  displayMessage(message);
});
```

**メリット**:
- ✅ リアルタイム性が高い
- ✅ サーバー主導でデータ更新
- ✅ クライアント側の実装がシンプル
- ✅ 自動的に最新データを取得

**デメリット**:
- ❌ 不要なデータ送信の可能性
- ❌ クライアント側でデータ取得タイミングを制御できない

### 手動リクエスト（プル型）

**特徴**: クライアントが要求した時にデータを送信

```javascript
// サーバー側
io.on('connection', (socket) => {
  // リクエスト待ち受け
  socket.on('getUserCount', () => {
    socket.emit('userCount', connectedUsers);
  });
  
  socket.on('getServerTime', () => {
    socket.emit('serverTime', new Date());
  });
  
  socket.on('getMessages', () => {
    socket.emit('messages', messageHistory);
  });
});

// クライアント側
// 必要な時に手動でリクエスト
function updateUserCount() {
  socket.emit('getUserCount');
}

function getServerTime() {
  socket.emit('getServerTime');
}

function loadMessages() {
  socket.emit('getMessages');
}

// イベントリスナー
socket.on('userCount', (count) => {
  updateUserCountDisplay(count);
});

socket.on('serverTime', (time) => {
  updateServerTime(time);
});

socket.on('messages', (messages) => {
  displayMessages(messages);
});
```

**メリット**:
- ✅ 必要な時だけデータを取得
- ✅ クライアント側で取得タイミングを制御
- ✅ ネットワーク負荷を軽減
- ✅ 細かい制御が可能

**デメリット**:
- ❌ 実装が複雑になる
- ❌ リアルタイム性が低い
- ❌ クライアント側で定期的なリクエストが必要

---

## 📤 socket.emit vs io.emit vs socket.broadcast.emit

### 送信範囲の違い

Socket.IOには3つの主要な送信方法があります：

#### 1. socket.emit（1対1通信）

**送信先**: 接続したクライアントのみ

```javascript
// サーバー側
io.on('connection', (socket) => {
  // 接続したクライアントにのみ送信
  socket.emit('userCount', connectedUsers);
  socket.emit('welcomeMessage', 'ようこそ！');
  socket.emit('privateData', { userId: socket.id });
});

// クライアント側
socket.on('userCount', (count) => {
  console.log('ユーザー数:', count);
});

socket.on('welcomeMessage', (message) => {
  console.log('メッセージ:', message);
});

socket.on('privateData', (data) => {
  console.log('プライベートデータ:', data);
});
```

**使用場面**:
- 接続時の初期データ送信
- プライベートメッセージ
- 個人設定情報
- 認証結果

#### 2. io.emit（全員送信）

**送信先**: 接続している全クライアント（送信者含む）

```javascript
// サーバー側
io.on('connection', (socket) => {
  // 全員（送信者含む）に送信
  io.emit('userCount', connectedUsers);
  io.emit('systemMessage', 'システムメッセージ');
  
  socket.on('globalMessage', (data) => {
    // 全員にメッセージを送信
    io.emit('message', `ユーザー: ${data.message}`);
  });
});

// クライアント側
socket.on('userCount', (count) => {
  updateUserCount(count);
});

socket.on('systemMessage', (message) => {
  displaySystemMessage(message);
});

socket.on('message', (message) => {
  displayMessage(message);
});
```

**使用場面**:
- 全員に共有すべき情報
- システム通知
- グローバルチャット
- 全員参加のゲーム状態

#### 3. socket.broadcast.emit（ブロードキャスト）

**送信先**: 接続している全クライアント（送信者以外）

```javascript
// サーバー側
io.on('connection', (socket) => {
  // 送信者以外の全員に送信
  socket.broadcast.emit('userJoined', '新しいユーザーが参加しました');
  
  socket.on('userMessage', (data) => {
    // 送信者以外の全員にメッセージを送信
    socket.broadcast.emit('message', `ユーザー: ${data.message}`);
  });
  
  socket.on('disconnect', () => {
    // 切断時に他のユーザーに通知
    socket.broadcast.emit('userLeft', 'ユーザーが退出しました');
  });
});

// クライアント側
socket.on('userJoined', (message) => {
  displaySystemMessage(message);
});

socket.on('message', (message) => {
  displayMessage(message);
});

socket.on('userLeft', (message) => {
  displaySystemMessage(message);
});
```

**使用場面**:
- ユーザー参加/退出通知
- 他のユーザーのアクション通知
- 送信者以外への通知

---

### 実際の使用例比較

#### ユーザーカウント機能

```javascript
// サーバー側
io.on('connection', (socket) => {
  connectedUsers++;
  
  // 方法1: 接続したクライアントのみに送信
  socket.emit('userCount', connectedUsers);
  
  // 方法2: 全員（送信者含む）に送信
  io.emit('userCount', connectedUsers);
  
  // 方法3: 送信者以外の全員に送信
  socket.broadcast.emit('userCount', connectedUsers);
  
  // 方法4: 組み合わせ（推奨）
  socket.emit('userCount', connectedUsers); // 接続者に送信
  socket.broadcast.emit('userCount', connectedUsers); // 他の全員に送信
});
```

#### チャット機能

```javascript
// サーバー側
io.on('connection', (socket) => {
  // 接続時の処理
  socket.emit('welcomeMessage', 'チャットに参加しました'); // 接続者のみ
  socket.broadcast.emit('userJoined', '新しいユーザーが参加しました'); // 他の全員
  
  // メッセージ送信
  socket.on('sendMessage', (data) => {
    // 送信者に確認メッセージ
    socket.emit('messageSent', { success: true });
    
    // 他の全員にメッセージを送信
    socket.broadcast.emit('newMessage', {
      userId: socket.id,
      message: data.message,
      timestamp: new Date()
    });
  });
  
  // 切断時の処理
  socket.on('disconnect', () => {
    socket.broadcast.emit('userLeft', 'ユーザーが退出しました');
  });
});

// クライアント側
socket.on('welcomeMessage', (message) => {
  displaySystemMessage(message);
});

socket.on('userJoined', (message) => {
  displaySystemMessage(message);
});

socket.on('messageSent', (data) => {
  if (data.success) {
    console.log('メッセージを送信しました');
  }
});

socket.on('newMessage', (data) => {
  displayMessage(data);
});

socket.on('userLeft', (message) => {
  displaySystemMessage(message);
});
```

---

### 送信方法の選択基準

| 送信方法 | 送信先 | 使用場面 | 例 |
|----------|--------|----------|-----|
| `socket.emit` | 接続したクライアントのみ | 個人向けデータ | 認証結果、個人設定 |
| `io.emit` | 全クライアント（送信者含む） | 全員共有データ | システム通知、グローバルチャット |
| `socket.broadcast.emit` | 全クライアント（送信者以外） | 他ユーザー通知 | ユーザー参加/退出、他ユーザーのアクション |

### パフォーマンスの考慮

```javascript
// 効率的な実装例
io.on('connection', (socket) => {
  connectedUsers++;
  
  // 接続者には即座に送信
  socket.emit('userCount', connectedUsers);
  
  // 他のユーザーには一括で送信
  socket.broadcast.emit('userCount', connectedUsers);
  
  // 全員に送る必要がある場合は
  // io.emit('userCount', connectedUsers);
});
```

---

## データ送受信のパターン

### 1. 1対1通信

```javascript
// サーバー側
io.on('connection', (socket) => {
  // 特定のクライアントにのみ送信
  socket.emit('privateMessage', 'あなた専用のメッセージ');
  
  // 特定のクライアントからのメッセージを受信
  socket.on('privateResponse', (data) => {
    console.log(`${socket.id}からの返信:`, data);
  });
});

// クライアント側
socket.on('privateMessage', (message) => {
  console.log('プライベートメッセージ:', message);
});

socket.emit('privateResponse', { status: 'received' });
```

### 2. 1対多通信（ブロードキャスト）

```javascript
// サーバー側
io.on('connection', (socket) => {
  // 送信者以外の全員に送信
  socket.on('broadcastMessage', (data) => {
    socket.broadcast.emit('message', `ユーザー: ${data.message}`);
  });
});

// クライアント側
socket.emit('broadcastMessage', { message: 'Hello everyone!' });

socket.on('message', (message) => {
  displayMessage(message);
});
```

### 3. 多対多通信

```javascript
// サーバー側
io.on('connection', (socket) => {
  // 全員（送信者含む）に送信
  socket.on('globalMessage', (data) => {
    io.emit('message', `ユーザー: ${data.message}`);
  });
});

// クライアント側
socket.emit('globalMessage', { message: 'Hello world!' });

socket.on('message', (message) => {
  displayMessage(message);
});
```

### 4. ルーム機能

```javascript
// サーバー側
io.on('connection', (socket) => {
  // ルームに参加
  socket.on('joinRoom', (roomName) => {
    socket.join(roomName);
    socket.emit('roomJoined', roomName);
  });
  
  // ルーム内でメッセージ送信
  socket.on('roomMessage', (data) => {
    io.to(data.room).emit('message', `[${data.room}] ${data.message}`);
  });
  
  // ルームから退出
  socket.on('leaveRoom', (roomName) => {
    socket.leave(roomName);
    socket.emit('roomLeft', roomName);
  });
});

// クライアント側
socket.emit('joinRoom', 'general');

socket.emit('roomMessage', { 
  room: 'general', 
  message: 'Hello room!' 
});

socket.on('message', (message) => {
  displayMessage(message);
});
```

---

## 実用的な使用例

### チャットアプリケーション

```javascript
// サーバー側
const messages = [];

io.on('connection', (socket) => {
  // 接続時の処理
  socket.emit('messageHistory', messages);
  socket.broadcast.emit('userJoined', `${socket.id}が参加しました`);
  
  // メッセージ送信
  socket.on('sendMessage', (data) => {
    const message = {
      id: Date.now(),
      userId: socket.id,
      message: data.message,
      timestamp: new Date()
    };
    
    messages.push(message);
    io.emit('newMessage', message);
  });
  
  // 切断時の処理
  socket.on('disconnect', () => {
    socket.broadcast.emit('userLeft', `${socket.id}が退出しました`);
  });
});

// クライアント側
const socket = io();

// メッセージ履歴を受信
socket.on('messageHistory', (history) => {
  displayMessageHistory(history);
});

// 新しいメッセージを受信
socket.on('newMessage', (message) => {
  displayMessage(message);
});

// ユーザー参加/退出通知
socket.on('userJoined', (message) => {
  displaySystemMessage(message);
});

socket.on('userLeft', (message) => {
  displaySystemMessage(message);
});

// メッセージ送信
function sendMessage(text) {
  socket.emit('sendMessage', { message: text });
}
```

### リアルタイムカウンター

```javascript
// サーバー側
let counter = 0;

io.on('connection', (socket) => {
  // 現在の値を送信
  socket.emit('counterValue', counter);
  
  // カウンター増加
  socket.on('increment', () => {
    counter++;
    io.emit('counterValue', counter);
  });
  
  // カウンター減少
  socket.on('decrement', () => {
    counter--;
    io.emit('counterValue', counter);
  });
  
  // カウンターリセット
  socket.on('reset', () => {
    counter = 0;
    io.emit('counterValue', counter);
  });
});

// クライアント側
socket.on('counterValue', (value) => {
  updateCounter(value);
});

function increment() {
  socket.emit('increment');
}

function decrement() {
  socket.emit('decrement');
}

function reset() {
  socket.emit('reset');
}
```

### ファイルアップロード進捗

```javascript
// サーバー側
io.on('connection', (socket) => {
  socket.on('uploadProgress', (data) => {
    // 特定のユーザーに進捗を送信
    socket.emit('progressUpdate', {
      fileId: data.fileId,
      progress: data.progress,
      status: data.status
    });
  });
  
  socket.on('uploadComplete', (data) => {
    socket.emit('uploadFinished', {
      fileId: data.fileId,
      url: data.url
    });
  });
});

// クライアント側
function uploadFile(file) {
  const fileId = Date.now();
  
  // ファイルアップロード処理
  const formData = new FormData();
  formData.append('file', file);
  
  fetch('/upload', {
    method: 'POST',
    body: formData
  }).then(response => {
    socket.emit('uploadComplete', { fileId, url: response.url });
  });
  
  // 進捗更新（実際の実装ではXMLHttpRequestを使用）
  socket.emit('uploadProgress', { fileId, progress: 50, status: 'uploading' });
}

socket.on('progressUpdate', (data) => {
  updateProgressBar(data.progress);
});

socket.on('uploadFinished', (data) => {
  showUploadComplete(data.url);
});
```

---

## ベストプラクティス

### 1. エラーハンドリング

```javascript
// サーバー側
io.on('connection', (socket) => {
  socket.on('clientMessage', (data) => {
    try {
      // データ検証
      if (!data.message || data.message.trim() === '') {
        socket.emit('error', { message: 'メッセージが空です' });
        return;
      }
      
      // 処理実行
      io.emit('message', `ユーザー: ${data.message}`);
      socket.emit('success', { message: 'メッセージを送信しました' });
      
    } catch (error) {
      socket.emit('error', { message: 'サーバーエラーが発生しました' });
      console.error('エラー:', error);
    }
  });
});

// クライアント側
socket.on('error', (error) => {
  showError(error.message);
});

socket.on('success', (data) => {
  showSuccess(data.message);
});
```

### 2. データ検証

```javascript
// サーバー側
io.on('connection', (socket) => {
  socket.on('userAction', (data) => {
    // データ型チェック
    if (typeof data.action !== 'string') {
      socket.emit('error', { message: '無効なアクションです' });
      return;
    }
    
    // データ長チェック
    if (data.action.length > 100) {
      socket.emit('error', { message: 'アクションが長すぎます' });
      return;
    }
    
    // 許可されたアクションかチェック
    const allowedActions = ['start', 'stop', 'pause'];
    if (!allowedActions.includes(data.action)) {
      socket.emit('error', { message: '許可されていないアクションです' });
      return;
    }
    
    // 処理実行
    processAction(data.action);
  });
});
```

### 3. 接続状態管理

```javascript
// クライアント側
const socket = io({
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

socket.on('connect', () => {
  console.log('接続しました');
  updateConnectionStatus('connected');
});

socket.on('disconnect', () => {
  console.log('切断されました');
  updateConnectionStatus('disconnected');
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`再接続しました (試行回数: ${attemptNumber})`);
  updateConnectionStatus('reconnected');
});

socket.on('reconnect_failed', () => {
  console.log('再接続に失敗しました');
  updateConnectionStatus('failed');
});

function updateConnectionStatus(status) {
  const statusElement = document.getElementById('connectionStatus');
  statusElement.textContent = `接続状態: ${status}`;
  
  switch (status) {
    case 'connected':
      statusElement.className = 'status connected';
      break;
    case 'disconnected':
      statusElement.className = 'status disconnected';
      break;
    case 'reconnected':
      statusElement.className = 'status reconnected';
      break;
    case 'failed':
      statusElement.className = 'status failed';
      break;
  }
}
```

### 4. パフォーマンス最適化

```javascript
// サーバー側
io.on('connection', (socket) => {
  // デバウンス処理
  let updateTimeout;
  
  socket.on('frequentUpdate', (data) => {
    clearTimeout(updateTimeout);
    
    updateTimeout = setTimeout(() => {
      // 実際の更新処理
      io.emit('update', data);
    }, 100); // 100ms待機
  });
  
  // 大量データの分割送信
  socket.on('requestLargeData', () => {
    const largeData = generateLargeData();
    const chunkSize = 1000;
    
    for (let i = 0; i < largeData.length; i += chunkSize) {
      const chunk = largeData.slice(i, i + chunkSize);
      socket.emit('dataChunk', {
        chunk: chunk,
        index: i / chunkSize,
        total: Math.ceil(largeData.length / chunkSize)
      });
    }
  });
});

// クライアント側
let receivedChunks = [];

socket.on('dataChunk', (data) => {
  receivedChunks[data.index] = data.chunk;
  
  if (receivedChunks.length === data.total) {
    // 全チャンクを受信完了
    const completeData = receivedChunks.flat();
    processCompleteData(completeData);
    receivedChunks = []; // リセット
  }
});
```

---

## まとめ

Socket.IOでのデータ送受信には複数の方法があります：

1. **イベントベース**: リアルタイム性が高く、実装がシンプル
2. **手動リクエスト**: 細かい制御が可能で、ネットワーク負荷を軽減
3. **ハイブリッド**: 両方の利点を組み合わせた実装

用途に応じて適切な方法を選択し、エラーハンドリング、データ検証、パフォーマンス最適化を考慮した実装を行うことが重要です。 