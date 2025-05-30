# public/index.html 仕様書

## 概要
このファイルは、Socket.IOを使用したリアルタイム通信のクライアント側のテスト用HTMLファイルです。サーバーとのWebSocket接続を確立し、1対1のマッチング機能を提供します。

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
  <!-- スタイル定義 -->
</head>
<body>
  <h1>Socket.IO テストページ</h1>
  <!-- 接続数・部屋数表示 -->
  <!-- マッチング状態表示 -->
  <!-- 部屋作成フォーム -->
  <!-- 部屋一覧 -->
  <!-- デバッグログ -->
  <script src="/socket.io/socket.io.js"></script>
  <script>
    // Socket.IOクライアント実装
  </script>
</body>
</html>
```

### 2. 主要コンポーネント

#### 2.1 接続状態表示
- 現在の接続ユーザー数表示
- 現在の部屋数表示
- デバッグログ表示

#### 2.2 マッチング機能
- 部屋の作成
  - 部屋名入力フォーム
  - 部屋作成ボタン
  - 作成後の待機状態表示
- 部屋一覧表示
  - 参加可能な部屋のリスト
  - 各部屋の状態（待機中/進行中）
  - 参加ボタン
- マッチング状態表示
  - 部屋の状態表示
  - 対戦相手情報
  - 退出ボタン

#### 2.3 Socket.IOイベント
```javascript
// 接続関連
socket.on('connect', () => { ... });        // 接続確立時
socket.on('disconnect', () => { ... });     // 切断時
socket.on('userCount', (count) => { ... }); // ユーザー数更新

// 部屋関連
socket.on('roomsList', (rooms) => { ... });     // 部屋一覧更新
socket.on('roomCreated', (data) => { ... });    // 部屋作成成功
socket.on('roomJoined', (data) => { ... });     // 部屋参加成功
socket.on('roomStatusChanged', (data) => { ... }); // 部屋状態変更
socket.on('opponentLeft', (data) => { ... });   // 対戦相手退出
socket.on('roomError', (error) => { ... });     // エラー通知

// クライアント→サーバー
socket.emit('createRoom', { ... });  // 部屋作成
socket.emit('joinRoom', { ... });    // 部屋参加
socket.emit('leaveRoom', { ... });   // 部屋退出
```

### 3. マッチングフロー

#### 3.1 部屋の作成
1. ユーザーが部屋名を入力
2. 「部屋を作成」ボタンをクリック
3. サーバーに部屋作成リクエストを送信
4. 部屋作成成功時：
   - マッチング状態パネルを表示
   - 「相手の参加を待っています...」と表示
   - 部屋作成/一覧表示を非表示

#### 3.2 部屋への参加
1. 部屋一覧から参加可能な部屋を選択
2. 「参加」ボタンをクリック
3. サーバーに参加リクエストを送信
4. 参加成功時：
   - マッチング状態パネルを表示
   - 「ホストの準備を待っています...」と表示
   - 部屋作成/一覧表示を非表示

#### 3.3 マッチング成立
1. 2人が揃うと自動的にマッチング成立
2. 両者に「マッチングが成立しました！」と表示
3. 対戦相手の情報を表示

#### 3.4 部屋からの退出
1. 「部屋を退出」ボタンをクリック
2. サーバーに退出リクエストを送信
3. 退出成功時：
   - マッチング状態パネルを非表示
   - 部屋作成/一覧表示を表示

### 4. エラー処理
- 既に部屋に参加している場合
- 満員の部屋への参加試行
- 存在しない部屋への参加試行
- 無効な部屋情報での作成試行
- エラーメッセージをアラートで表示

### 5. UI/UX
- 部屋の状態に応じた表示の切り替え
- 対戦相手の情報表示
- デバッグログによる状態確認
- エラー時のフィードバック
- レスポンシブなデザイン

## 動作確認方法
1. サーバー（server.js）を起動
2. ブラウザで `http://localhost:3000` にアクセス
3. 複数のブラウザウィンドウを開いてテスト
4. 部屋の作成と参加を試行
5. マッチングの成立を確認
6. 部屋からの退出をテスト

## 注意事項
- サーバーが起動していない状態でアクセスすると接続エラー
- 1つのブラウザで複数の部屋に同時参加は不可
- 部屋の作成者は退出すると部屋が削除される
- 対戦相手が退出すると通知が表示される

## 今後の拡張性
- チャット機能の追加
- 部屋のパスワード保護
- ユーザー名の設定
- 部屋の設定（最大人数など）
- マッチング履歴の保存
- より詳細な対戦相手情報の表示 