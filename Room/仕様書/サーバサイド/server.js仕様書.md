# server.js 仕様書

## 概要
このファイルは、Socket.IOを使用したリアルタイム通信を実現するためのサーバーサイドの実装です。Express.jsとSocket.IOを組み合わせて、WebSocket通信を提供し、1対1のマッチング機能を実現します。

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

### 1. データ構造

#### 1.1 グローバル変数
```javascript
let connectedUsers = 0;           // 接続中のユーザー数
const rooms = new Map();          // 部屋情報の管理
const userStates = new Map();     // ユーザーの状態管理
```

#### 1.2 部屋の構造
```javascript
{
  name: string,           // 部屋名
  createdAt: Date,        // 作成日時
  createdBy: string,      // 作成者のsocket.id
  status: string,         // 'waiting' または 'in_progress'
  players: string[]       // 参加者のsocket.id配列
}
```

#### 1.3 ユーザーの状態
- `online`: 接続中で部屋に参加していない
- `in_room`: 部屋に参加中

### 2. 主要機能

#### 2.1 ユーティリティ関数
```javascript
// 接続状態のログ出力
const logConnectionStatus = (action) => { ... }

// 部屋状態のログ出力
const logRoomStatus = (action) => { ... }

// 参加可能な部屋一覧の取得
const getRoomsList = () => { ... }

// ユーザー状態の更新
const updateUserState = (socketId, state) => { ... }
```

#### 2.2 部屋管理機能
- 部屋の作成
  - 部屋名とIDの検証
  - 重複チェック
  - 作成者の参加
- 部屋への参加
  - 部屋の存在確認
  - 満員チェック
  - 状態の更新
- 部屋からの退出
  - プレイヤーの削除
  - 空き部屋の削除
  - 残りプレイヤーへの通知

### 3. Socket.IOイベント

#### 3.1 接続管理
```javascript
io.on('connection', (socket) => {
  // 接続時の処理
  connectedUsers++;
  updateUserState(socket.id, 'online');
  socket.emit('roomsList', getRoomsList());

  // 切断時の処理
  socket.on('disconnect', () => {
    // 部屋からの退出処理
    // ユーザー状態の更新
    // 接続数の更新
  });
});
```

#### 3.2 部屋関連イベント
```javascript
// 部屋作成
socket.on('createRoom', (data) => {
  // バリデーション
  // 部屋の作成
  // 状態の更新
  // 通知の送信
});

// 部屋参加
socket.on('joinRoom', (data) => {
  // バリデーション
  // プレイヤーの追加
  // 状態の更新
  // 通知の送信
});

// 部屋退出
socket.on('leaveRoom', (data) => {
  // プレイヤーの削除
  // 部屋の状態更新
  // 通知の送信
});
```

### 4. エラー処理
- 無効な部屋情報
- 重複する部屋ID
- 存在しない部屋への参加
- 満員の部屋への参加
- 既に部屋に参加している場合

### 5. 通知システム
- 部屋一覧の更新通知
- 部屋状態の変更通知
- 対戦相手の退出通知
- エラー通知

## 動作確認方法
1. サーバーの起動
```bash
node server.js
```
2. ブラウザで `http://localhost:3000` にアクセス
3. 複数のブラウザウィンドウを開いてテスト
4. 部屋の作成と参加を試行
5. マッチングの成立を確認
6. 部屋からの退出をテスト

## 注意事項
- ポート3000が他のプロセスで使用されている場合は変更が必要
- 本番環境では適切なセキュリティ設定を追加
- エラー発生時は適切なエラーメッセージを返す
- 部屋の状態は常に同期を維持

## 今後の拡張性
- 部屋のパスワード保護
- ユーザー認証の追加
- 部屋の設定機能
- マッチング履歴の保存
- チャット機能の実装
- 部屋の最大人数設定
- 部屋の種類（公開/非公開）の追加 