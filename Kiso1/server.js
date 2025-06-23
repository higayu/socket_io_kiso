// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 接続中のユーザー数を管理
let connectedUsers = 0;

// Socket.IO接続処理
io.on('connection', (socket) => {
  // ユーザー数を増やす
  connectedUsers++;
  console.log(`ユーザーが接続しました。現在の接続数: ${connectedUsers}`);
  
  // 接続時のメッセージを送信
  socket.emit('message', 'サーバーに接続しました！');
  
  // 接続中のユーザー数をクライアントに送信
  socket.emit('userCount', connectedUsers);
  
  // 全ユーザーに新しい接続を通知
  socket.broadcast.emit('message', '新しいユーザーが接続しました');
  
  // 全ユーザーに更新されたユーザー数を送信
  io.emit('userCount', connectedUsers);
  
  // クライアントからのメッセージを受信
  socket.on('clientMessage', (data) => {
    console.log(`受信したメッセージ: ${data.message}`);
    
    // 全ユーザーにメッセージを送信
    io.emit('message', `ユーザー: ${data.message}`);
  });
  
  // 切断時の処理
  socket.on('disconnect', () => {
    connectedUsers--;
    console.log(`ユーザーが切断しました。現在の接続数: ${connectedUsers}`);
    socket.broadcast.emit('message', 'ユーザーが切断しました');
    
    // 全ユーザーに更新されたユーザー数を送信
    io.emit('userCount', connectedUsers);
  });
});

// 静的ファイルの提供
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/page2', (req, res) => {
  res.sendFile(__dirname + '/public/page2.html');
});

app.get('/page3', (req, res) => {
  res.sendFile(__dirname + '/public/page3.html');
});

// サーバー起動
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});