# server.js 仕様書

## 概要
このファイルは、Socket.IOを使用したリアルタイム通信を実現するためのサーバーサイドの実装です。Express.jsとSocket.IOを組み合わせて、WebSocket通信を提供します。

## 技術スタック
- Node.js
- Express.js
- Socket.IO

## プロジェクト構造
```
socket-demo/
├── node_modules/
├── public/
│   └── index.html  # クライアント側のテスト用HTMLファイル
├── package.json
├── package-lock.json
└── server.js
```

## 依存関係
```json
{
  "dependencies": {
    "express": "^4.x.x",
    "socket.io": "^4.x.x"
  }
}
```

## 実装詳細

### 1. モジュールのインポート
```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
```
- `express`: Webアプリケーションフレームワーク
- `http`: HTTPサーバー機能を提供
- `socket.io`: WebSocket通信を実現するためのライブラリ

### 2. サーバーの初期化
```javascript
const app = express();
const server = http.createServer(app);
const io = new Server(server);
```
- Expressアプリケーションの作成
- HTTPサーバーの作成
- Socket.IOサーバーの初期化

### 3. Socket.IOイベントハンドリング
```javascript
// 接続中のユーザー数を管理
let connectedUsers = 0;

io.on('connection', (socket) => {
  // ユーザー数を増やす
  connectedUsers++;
  
  // 接続ログを出力（接続時刻とユーザー数を表示）
  const now = new Date().toLocaleString('ja-JP');
  console.log(`[${now}] クライアントが接続しました (現在の接続数: ${connectedUsers})`);
  
  // 接続時に全クライアントに現在のユーザー数を通知
  io.emit('userCount', connectedUsers);

  socket.on('disconnect', () => {
    // ユーザー数を減らす
    connectedUsers--;
    
    // 切断ログを出力
    const now = new Date().toLocaleString('ja-JP');
    console.log(`[${now}] クライアントが切断されました (現在の接続数: ${connectedUsers})`);
    
    // 切断時も全クライアントに現在のユーザー数を通知
    io.emit('userCount', connectedUsers);
  });
});
```

#### 3.3 接続ログとユーザー数管理
- サーバー側で接続中のユーザー数を `connectedUsers` 変数で管理
- 接続/切断時に以下の処理を実行：
  1. ユーザー数の増減
  2. タイムスタンプ付きの接続/切断ログの出力
  3. 全クライアントへの現在のユーザー数の通知（`userCount` イベント）
- クライアント側では：
  1. `userCount` イベントを受け取って表示を更新
  2. 接続数の表示はスタイリングされたUIで提供
- これにより、リアルタイムで接続状態を監視・表示可能

#### 3.1 Socket.IO接続の仕組み
- `io.on('connection')` は `app.get('/')` の有無に関係なく動作します
- これは、Socket.IOが独自の接続ハンドリングメカニズムを持っているためです
- 具体的な動作の流れ：
  1. クライアントが `http://localhost:3000` にアクセス
  2. Socket.IOクライアントライブラリ（`/socket.io/socket.io.js`）が自動的にロード
  3. クライアント側で `io()` が実行されると、WebSocket接続が確立
  4. 接続が確立されると、サーバー側の `io.on('connection')` が実行
- `app.get('/')` は主にHTMLファイルの提供を担当し、Socket.IOの接続とは独立して動作
- ただし、通常は `app.get('/')` でHTMLファイルを提供し、その中でSocket.IOクライアントを初期化する実装が一般的

#### 3.2 app.get('/')がコメントアウトされた場合の動作
- `app.get('/')` をコメントアウトすると、クライアントが `http://localhost:3000` にアクセスした際に：
  1. HTMLファイルが提供されないため、ブラウザは404エラーを表示
  2. その結果、Socket.IOクライアントライブラリ（`/socket.io/socket.io.js`）が読み込まれない
  3. クライアント側で `io()` が実行されないため、WebSocket接続が確立されない
  4. サーバー側の `io.on('connection')` のコールバックが実行されない
- つまり、`app.get('/')` は直接Socket.IOの接続には影響しないが、クライアント側のSocket.IO初期化に必要なHTMLファイルの提供を担当している
- このため、`app.get('/')` をコメントアウトすると、結果的にSocket.IOの接続が確立されなくなる

### 4. HTTPルーティング
```javascript
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});
```
- ルートパス（'/'）へのアクセス時に`public/index.html`を返す
sendFileで **/public/index.htmlへのパス** を指定しているからルートディレクトリにindex.htmlが表示されている
- クライアント側のファイルは`public`ディレクトリに配置し、セキュリティと管理の観点から分離

### 5. サーバー起動
```javascript
server.listen(3000, () => {
  console.log('http://localhost:3000 でサーバー起動');
});
```
- ポート3000でサーバーを起動
- 起動完了時にコンソールにメッセージを表示

## 動作確認方法
1. サーバーの起動
```bash
node server.js
```
2. ブラウザで `http://localhost:3000` にアクセス
3. ブラウザのコンソールで接続メッセージを確認
4. サーバーのコンソールで接続ログを確認

## 注意事項
- ポート3000が他のプロセスで使用されている場合は、別のポート番号に変更する必要があります
- 本番環境では適切なセキュリティ設定（CORS、認証など）を追加することを推奨します 