// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 接続中のユーザー数を管理
let connectedUsers = 0;

// デバッグ用：現在の接続数を表示する関数
const logConnectionStatus = (action) => {
  console.log(`[DEBUG] ${action} - connectedUsers: ${connectedUsers}`);
};

io.on('connection', (socket) => {
  // ユーザー数を増やす
  connectedUsers++;
  logConnectionStatus('接続時');
  
  // 接続ログを出力（接続時刻とユーザー数を表示）
  const now = new Date().toLocaleString('ja-JP');
  console.log(`[${now}] クライアントが接続しました (現在の接続数: ${connectedUsers})`);
  
  // 接続時に全クライアントに現在のユーザー数を通知
  io.emit('userCount', connectedUsers);
  console.log(`[DEBUG] userCountイベントを送信: ${connectedUsers}`);

  socket.on('disconnect', () => {
    // ユーザー数を減らす
    connectedUsers--;
    logConnectionStatus('切断時');
    
    // 切断ログを出力
    const now = new Date().toLocaleString('ja-JP');
    console.log(`[${now}] クライアントが切断されました (現在の接続数: ${connectedUsers})`);
    
    // 切断時も全クライアントに現在のユーザー数を通知
    io.emit('userCount', connectedUsers);
    console.log(`[DEBUG] userCountイベントを送信: ${connectedUsers}`);
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// プライベートアドレスでサーバーを起動
const PORT = 3000;
const HOST = '0.0.0.0';  // すべてのネットワークインターフェースでリッスン

server.listen(PORT, HOST, () => {
  console.log(`サーバーが起動しました: http://${HOST}:${PORT}`);
  console.log('注意: プライベートアドレス（例：192.168.x.x）でアクセスしてください');
  console.log('[DEBUG] サーバー起動時の接続数: 0');
});