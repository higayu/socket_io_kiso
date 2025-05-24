# public/index.html 仕様書

## 概要
このファイルは、Socket.IOを使用したリアルタイム通信のクライアント側のテスト用HTMLファイルです。サーバーとのWebSocket接続を確立し、基本的な接続状態の確認が可能です。

## ファイル配置
```
socket-demo/
└── public/
    └── index.html  # クライアント側のテスト用HTMLファイル
```

## 実装詳細

### 1. 基本構造
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>Socket.IO テスト</title>
</head>
<body>
  <h1>Socket.IO テストページ</h1>
  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    console.log('サーバーに接続しました');
  </script>
</body>
</html>
```

### 2. 主要コンポーネント

#### 2.1 Socket.IOクライアントライブラリ
```html
<script src="/socket.io/socket.io.js"></script>
```
- Socket.IOのクライアントライブラリを読み込み
- サーバー側のSocket.IOが自動的にこのファイルを提供

#### 2.2 Socket接続
```javascript
const socket = io();
console.log('サーバーに接続しました');
```
- `io()`でサーバーへの接続を確立
- 接続成功時にコンソールにメッセージを表示

#### 2.3 Socket.onイベントリスナー
```javascript
socket.on('イベント名', (データ) => {
  // データを受け取った時の処理
});
```
- サーバーからのイベントとデータを受け取るためのイベントリスナー
- 主なイベント：
  - `connect`: サーバーとの接続が確立された時に発火
  - `disconnect`: サーバーとの接続が切断された時に発火
  - `userCount`: サーバーから接続ユーザー数を受け取る
  - `error`: エラーが発生した時に発火
- サーバー側で`socket.emit('イベント名', データ)`を実行すると、対応するイベントリスナーが実行される
- 複数のイベントを同時にリッスン可能
- イベントごとに異なる処理を実装可能

#### 2.4 サーバー・クライアント間の通信関係
```javascript
// サーバー側（server.js）
io.emit('userCount', connectedUsers);  // データを送信

// クライアント側（index.html）
socket.on('userCount', (count) => {    // データを受信
  // 受信したデータの処理
});
```
- `io.emit`（サーバー側）と`socket.on`（クライアント側）は送受信の関係
- 通信の流れ：
  1. サーバー側で`io.emit('イベント名', データ)`を実行
  2. クライアント側の対応する`socket.on('イベント名', (データ) => { ... })`が実行
- 主な通信パターン：
  - サーバー→全クライアント: `io.emit()`
  - サーバー→特定クライアント: `socket.emit()`
  - クライアント→サーバー: `socket.emit()`
- 現在の実装では、接続ユーザー数の更新を全クライアントに通知するために`io.emit`を使用

#### 2.5 データの受け渡しの詳細
```javascript
// サーバー側（server.js）
let connectedUsers = 0;  // 接続ユーザー数を管理
connectedUsers++;        // 接続時に増加
io.emit('userCount', connectedUsers);  // 値を送信

// クライアント側（index.html）
socket.on('userCount', (count) => {    // 値を受信
  // countには、サーバーから送られてきたconnectedUsersの値が入る
  addDebugLog(`userCountイベントを受信: ${count}`);
  userCountElement.textContent = count;
});
```

- データの流れ：
  1. サーバー側で`connectedUsers`の値が更新される
  2. `io.emit('userCount', connectedUsers)`でその値が送信される
  3. クライアント側の`socket.on('userCount', (count) => { ... })`の`count`パラメータに値が渡される
  4. クライアント側で受け取った値を使って表示を更新

- 具体例：
  - サーバー側で`connectedUsers`が`2`の場合
  - `io.emit('userCount', 2)`が実行され
  - クライアント側で`count`に`2`が入り
  - 画面に「2」と表示される

- この仕組みにより：
  - サーバー側の`connectedUsers`の値が
  - リアルタイムでクライアント側に反映される
  - 接続/切断時に自動的に表示が更新される

## 動作確認方法
1. サーバー（server.js）を起動
2. ブラウザで `http://localhost:3000` にアクセス
3. ブラウザの開発者ツール（F12）を開く
4. コンソールタブで「サーバーに接続しました」のメッセージを確認

## 注意事項
- サーバーが起動していない状態でアクセスすると、接続エラーが発生します
- ブラウザのコンソールで接続状態を確認できます
- 本番環境では、適切なエラーハンドリングとユーザーインターフェースの実装を推奨します

## 今後の拡張性
- メッセージ送受信機能の追加
- 接続状態の表示UIの実装
- エラーハンドリングの強化
- スタイリングの追加 