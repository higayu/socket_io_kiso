const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();//Get Post などの処理
const server = http.createServer(app);//サーバーを構築
const io = socketIO(server);

app.get('/', (req, res) => {// express
  res.sendFile(__dirname + '/index.html');//サーバーのルートにindex.htmlをレスポンス
 // res.send('Hello World');文字をレスポンス
});

// Socket.IO でクライアントとの接続を監視
io.on('connection', (socket) => {// const socket = io();このタイミング
  console.log('ユーザーが接続しました');

  // クライアント側から 'chat' イベントが来たら、それを全員に配信
  socket.on('chat', (msg) => {
    // emit は 発するという意味
    io.emit('chat', msg);  // すべての接続中クライアントにメッセージを送信
  });

    // 切断時
  socket.on('disconnect', () => {
    console.log('切断:', socket.id);
  });
});


server.listen(3000, () => {//Node.js サーバー（http.createServer(...) で作られたもの）を起動し、起動が完了したタイミング
    //サーバの起動処理直後の出力
    console.log('http://localhost:3000 でサーバー起動中');
});
