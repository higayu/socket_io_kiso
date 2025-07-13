# Socket.IO の `io.on('connection')` の役割

`io.on('connection', (socket) => { ... })` の中は、サーバーとクライアントの**リアルタイム通信処理の中心**となる場所です。

---

## ✅ このブロックの意味

```js
io.on('connection', (socket) => {
  // この中にクライアントとのやりとりを記述
});
```

- Socket.IO でクライアントが `const socket = io();` によって接続すると、`connection` イベントがサーバー側で発火します。
- `socket` は「その接続された1人のクライアント」と通信するためのオブジェクトです。

---

## 🔄 ここに書く主な処理

| 処理内容 | 書き方例 | 備考 |
|----------|----------|------|
| メッセージ受信 | `socket.on('chat', msg => {...})` | クライアントからのデータ受信 |
| クライアントに送信 | `socket.emit('message', data)` | 特定のクライアントに送信 |
| 全員に送信 | `io.emit('message', data)` | 全クライアントにブロードキャスト |
| 切断処理 | `socket.on('disconnect', () => {...})` | 接続終了時の処理 |

---

## ✅ 例：チャット機能

```js
io.on('connection', (socket) => {
  console.log('クライアントが接続:', socket.id);

  // チャットメッセージを受信して全員に配信
  socket.on('chat', (msg) => {
    io.emit('chat', msg);
  });

  // クライアントの切断処理
  socket.on('disconnect', () => {
    console.log('切断:', socket.id);
  });
});
```

---

## 🎯 ポイントまとめ

- `io.on('connection', ...)` の中は **1クライアントとのリアルタイムなやりとり**を書く場所
- クライアントごとの `socket` インスタンスを使って通信
- WebSocket 通信の入口として最も重要な部分です

