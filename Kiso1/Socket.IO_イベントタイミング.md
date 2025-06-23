# Socket.IO イベントタイミング 完全ガイド

## 📋 目次

1. [socket.on('userCount')の出力タイミング](#socketonusercountの出力タイミング)
2. [Socket.IOイベントの実行順序](#socketioイベントの実行順序)
3. [実際の動作確認](#実際の動作確認)
4. [デバッグ方法](#デバッグ方法)
5. [よくある問題と解決策](#よくある問題と解決策)

---

## socket.on('userCount')の出力タイミング

### 基本的な出力タイミング

`socket.on('userCount')`は、サーバー側で`socket.emit('userCount', data)`または`io.emit('userCount', data)`が実行された時に出力されます。

#### 現在のプロジェクトでの設定

```javascript
// サーバー側 (server.js)
io.on('connection', (socket) => {
  // ユーザー数を増やす
  connectedUsers++;
  console.log(`ユーザーが接続しました。現在の接続数: ${connectedUsers}`);
  
  // 接続時に自動送信
  socket.emit('userCount', connectedUsers);
  
  // 全員に自動通知
  io.emit('userCount', connectedUsers);
  
  // 切断時の処理
  socket.on('disconnect', () => {
    connectedUsers--;
    console.log(`ユーザーが切断しました。現在の接続数: ${connectedUsers}`);
    
    // 全ユーザーに更新されたユーザー数を送信
    io.emit('userCount', connectedUsers);
  });
});

// クライアント側 (index.html)
socket.on('userCount', (count) => {
  userCountDiv.textContent = `接続中のユーザー数: ${count}人`;
  console.log('ユーザー数が更新されました:', count);
});
```

### 具体的な出力タイミング

#### 1. ユーザーが接続した時

```javascript
// サーバー側で実行される処理
io.on('connection', (socket) => {
  connectedUsers++; // ユーザー数を増やす
  
  // この時点でuserCountイベントが送信される
  socket.emit('userCount', connectedUsers); // 接続者に送信
  io.emit('userCount', connectedUsers);     // 全員に送信
});
```

**クライアント側の出力**:
```
ユーザー数が更新されました: 1
ユーザー数が更新されました: 1  // 2回出力される（socket.emit + io.emit）
```

#### 2. ユーザーが切断した時

```javascript
// サーバー側で実行される処理
socket.on('disconnect', () => {
  connectedUsers--; // ユーザー数を減らす
  
  // この時点でuserCountイベントが送信される
  io.emit('userCount', connectedUsers);
});
```

**クライアント側の出力**:
```
ユーザー数が更新されました: 0
```

#### 3. 手動でユーザー数を更新した時

```javascript
// サーバー側で手動更新
app.post('/api/update-user-count', (req, res) => {
  connectedUsers = req.body.count;
  io.emit('userCount', connectedUsers); // 手動で送信
  res.json({ success: true });
});
```

---

## Socket.IOイベントの実行順序

### 接続時の実行順序

```javascript
// 1. クライアントがサーバーに接続
const socket = io();

// 2. サーバー側でconnectionイベントが発火
io.on('connection', (socket) => {
  console.log('接続開始');
  
  // 3. 接続処理
  connectedUsers++;
  
  // 4. 初期データ送信
  socket.emit('userCount', connectedUsers);
  socket.emit('message', 'サーバーに接続しました！');
  
  // 5. 全員に通知
  io.emit('userCount', connectedUsers);
  socket.broadcast.emit('message', '新しいユーザーが接続しました');
});

// 6. クライアント側でイベントを受信
socket.on('connect', () => {
  console.log('接続完了');
});

socket.on('userCount', (count) => {
  console.log('ユーザー数受信:', count);
});

socket.on('message', (message) => {
  console.log('メッセージ受信:', message);
});
```

### 実際の実行順序例

```
1. クライアント接続開始
2. サーバー: connectionイベント発火
3. サーバー: connectedUsers++ (1)
4. サーバー: socket.emit('userCount', 1) 送信
5. クライアント: userCountイベント受信 → "ユーザー数受信: 1"
6. サーバー: io.emit('userCount', 1) 送信
7. クライアント: userCountイベント受信 → "ユーザー数受信: 1"
8. サーバー: socket.emit('message', 'サーバーに接続しました！') 送信
9. クライアント: messageイベント受信 → "メッセージ受信: サーバーに接続しました！"
```

---

## 実際の動作確認

### デバッグ用のコード

```javascript
// サーバー側 (server.js)
io.on('connection', (socket) => {
  console.log(`[SERVER] 新しい接続: ${socket.id}`);
  
  connectedUsers++;
  console.log(`[SERVER] ユーザー数更新: ${connectedUsers}`);
  
  // 接続者に送信
  socket.emit('userCount', connectedUsers);
  console.log(`[SERVER] socket.emit('userCount', ${connectedUsers}) 送信完了`);
  
  // 全員に送信
  io.emit('userCount', connectedUsers);
  console.log(`[SERVER] io.emit('userCount', ${connectedUsers}) 送信完了`);
  
  socket.on('disconnect', () => {
    console.log(`[SERVER] 切断: ${socket.id}`);
    connectedUsers--;
    console.log(`[SERVER] ユーザー数更新: ${connectedUsers}`);
    
    io.emit('userCount', connectedUsers);
    console.log(`[SERVER] io.emit('userCount', ${connectedUsers}) 送信完了`);
  });
});

// クライアント側 (index.html)
const socket = io();

socket.on('connect', () => {
  console.log('[CLIENT] 接続完了:', socket.id);
});

socket.on('userCount', (count) => {
  console.log(`[CLIENT] userCount受信: ${count}`);
  userCountDiv.textContent = `接続中のユーザー数: ${count}人`;
});

socket.on('disconnect', () => {
  console.log('[CLIENT] 切断されました');
});
```

### 期待される出力

#### 1つ目のタブを開いた時
```
[SERVER] 新しい接続: abc123def456
[SERVER] ユーザー数更新: 1
[SERVER] socket.emit('userCount', 1) 送信完了
[SERVER] io.emit('userCount', 1) 送信完了
[CLIENT] 接続完了: abc123def456
[CLIENT] userCount受信: 1
[CLIENT] userCount受信: 1
```

#### 2つ目のタブを開いた時
```
[SERVER] 新しい接続: xyz789uvw012
[SERVER] ユーザー数更新: 2
[SERVER] socket.emit('userCount', 2) 送信完了
[SERVER] io.emit('userCount', 2) 送信完了
[CLIENT] 接続完了: xyz789uvw012
[CLIENT] userCount受信: 2
[CLIENT] userCount受信: 2
```

#### タブを閉じた時
```
[SERVER] 切断: abc123def456
[SERVER] ユーザー数更新: 1
[SERVER] io.emit('userCount', 1) 送信完了
[CLIENT] userCount受信: 1
[CLIENT] 切断されました
```

---

## デバッグ方法

### 1. コンソールログの確認

```javascript
// サーバー側
io.on('connection', (socket) => {
  console.log('=== 接続処理開始 ===');
  console.log('接続前のユーザー数:', connectedUsers);
  
  connectedUsers++;
  console.log('接続後のユーザー数:', connectedUsers);
  
  socket.emit('userCount', connectedUsers);
  console.log('userCountイベント送信完了');
  
  console.log('=== 接続処理終了 ===');
});

// クライアント側
socket.on('userCount', (count) => {
  console.log('=== userCount受信 ===');
  console.log('受信したユーザー数:', count);
  console.log('現在の時刻:', new Date().toISOString());
  console.log('=== 受信処理終了 ===');
});
```

### 2. イベントリスナーの確認

```javascript
// イベントリスナーが正しく設定されているか確認
console.log('userCountイベントリスナー設定状況:', socket.hasListeners('userCount'));

// 全てのイベントリスナーを確認
console.log('設定済みイベント:', socket.eventNames());
```

### 3. ネットワークタブでの確認

ブラウザの開発者ツール → Networkタブ → WS（WebSocket）で通信を確認

---

## よくある問題と解決策

### 問題1: userCountイベントが受信されない

**原因**: イベントリスナーが設定される前にイベントが送信されている

**解決策**:
```javascript
// クライアント側
const socket = io();

// 接続完了後にイベントリスナーを設定
socket.on('connect', () => {
  console.log('接続完了、イベントリスナー設定開始');
  
  socket.on('userCount', (count) => {
    console.log('ユーザー数受信:', count);
  });
});
```

### 問題2: 重複して受信される

**原因**: `socket.emit`と`io.emit`の両方が実行されている

**解決策**:
```javascript
// サーバー側
io.on('connection', (socket) => {
  connectedUsers++;
  
  // 接続者には即座に送信
  socket.emit('userCount', connectedUsers);
  
  // 他のユーザーには一括で送信（接続者には送信しない）
  socket.broadcast.emit('userCount', connectedUsers);
});
```

### 問題3: タイミングの問題

**原因**: 非同期処理によるタイミングのずれ

**解決策**:
```javascript
// サーバー側
io.on('connection', (socket) => {
  // 接続処理を同期的に実行
  connectedUsers++;
  
  // 即座にイベントを送信
  setTimeout(() => {
    io.emit('userCount', connectedUsers);
  }, 0);
});
```

### 問題4: 接続状態の確認

```javascript
// クライアント側
socket.on('connect', () => {
  console.log('接続状態:', socket.connected);
  console.log('接続ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('接続状態:', socket.connected);
});

// 手動で接続状態を確認
function checkConnection() {
  console.log('現在の接続状態:', socket.connected);
  if (socket.connected) {
    console.log('接続ID:', socket.id);
  }
}
```

---

## まとめ

`socket.on('userCount')`は以下のタイミングで出力されます：

1. **ユーザー接続時**: `socket.emit('userCount')`と`io.emit('userCount')`が実行される
2. **ユーザー切断時**: `io.emit('userCount')`が実行される
3. **手動更新時**: サーバー側で手動でイベントを送信した時

イベントの実行順序を理解し、適切なデバッグを行うことで、期待通りの動作を確認できます。 