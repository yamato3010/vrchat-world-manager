# 開発ガイド

このドキュメントでは、VRChat World Managerの開発環境のセットアップ、ビルド方法、開発フローについて説明します。

## 目次

- [必要な環境](#必要な環境)
- [セットアップ](#セットアップ)
- [開発](#開発)
- [ビルド](#ビルド)
- [技術スタック詳細](#技術スタック詳細)
- [プロジェクト構成](#プロジェクト構成)
- [開発のヒント](#開発のヒント)

## 必要な環境

- **Node.js**: 22.x 以上
- **npm**: 10.x 以上（Node.jsに付属）
- **Git**: バージョン管理用

## セットアップ

### 1. リポジトリのクローン

```bash
git clone [repository-url]
cd vrchat-world-manager
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env
```

### 4. データベースのセットアップ

```bash
# Prismaクライアントの生成
npx prisma generate

# データベースのマイグレーション
npx prisma migrate dev
```

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

このコマンドは以下を実行します
- Viteの開発サーバーを起動（ホットリロード有効）
- Electronアプリケーションを起動
- TypeScriptのコンパイル

### データベースの管理

```bash
# Prisma Studioでデータベースを視覚的に確認・編集
npx prisma studio

# スキーマの変更後、マイグレーション
npx prisma db push

# 新しいマイグレーションファイルを作成
npx prisma migrate dev --name [migration-name]
```

### コミット

このプロジェクトは Commitizen を使用しています

```bash
# 変更をステージング
git add .

# Commitizenでコミット
git cz
```

コミットタイプ
- `✨ feat`: 新機能の実装
- `🐛 fix`: バグ修正
- `🔀 update`: 機能修正（バグではないもの）
- `📝 docs`: ドキュメントのみの変更
- `🎨 style`: コードの意味に影響しない変更
- `♻️ refactor`: リファクタリング
- `⚡️ perf`: パフォーマンス改善
- `✅ test`: テストの追加・修正
- `🤖 chore`: ビルドプロセスやツールの変更

## ビルド

### プロダクションビルド

```bash
npm run build
```

ビルド成果物は以下のディレクトリに出力されます
- `dist/`: フロントエンドのビルド済みファイル
- `dist-electron/`: Electronメインプロセスのビルド済みファイル

## 技術スタック詳細

### フロントエンド

- React 19
- TypeScript 5
- Tailwind CSS 4
- Vite 7

### バックエンド (Electron)

- Electron 39
- Prisma 5
- SQLite
- Axios
- png-metadata

### 開発ツール

- @vitejs/plugin-react
- vite-plugin-electron
- Commitizen

## プロジェクト構成

```
vrchat-world-manager/
├── electron/              # Electronメインプロセス
│   ├── main.ts           # Electronエントリーポイント
│   ├── preload.ts        # プリロードスクリプト
│   ├── ipcHandlers.ts    # IPCハンドラー（API層）
│   └── utils/
│       └── pngMetadata.ts # PNG解析ユーティリティ
├── src/                   # Reactアプリケーション
│   ├── components/       # Reactコンポーネント
│   │   ├── AddPhotoModal.tsx
│   │   ├── AddWorldModal.tsx
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── WorldList.tsx
│   │   └── ...
│   ├── pages/            # ページコンポーネント
│   │   └── WorldDetail.tsx
│   ├── types.d.ts        # 型定義
│   ├── App.tsx           # アプリケーションルート
│   └── index.css         # グローバルスタイル
├── prisma/
│   └── schema.prisma     # データベーススキーマ
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## アプリケーション設定ファイル

アプリケーションの設定は、ユーザーのデータディレクトリに JSON ファイルとして保存されます。

### 設定ファイルの場所

```
macOS: ~/Library/Application Support/vrchat-world-manager/config.json
Windows: %APPDATA%/vrchat-world-manager/config.json
Linux: ~/.config/vrchat-world-manager/config.json
```

### 設定ファイルの構造

```json
{
  "photoDirectoryPath": "/path/to/vrchat/photos",
  "scanPeriodDays": 14,
  "dismissedWorldIds": [
    "wrld_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "wrld_yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"
  ]
}
```

#### フィールド説明

- **`photoDirectoryPath`** (string, optional)
  - VRChatの写真が保存されているディレクトリのパス
  - 設定されている場合、アプリ起動時に自動的にスキャンされます

- **`scanPeriodDays`** (number, optional, default: 14)
  - 写真スキャンの対象期間（日数）
  - この期間内に撮影された写真のみがスキャン対象になります

- **`dismissedWorldIds`** (array of strings, optional)
  - ユーザーが「無視」したワールドIDのリスト
  - このリストに含まれるワールドは、提案リストに表示されなくなります
  - 再度提案を受けたい場合は、このリストから手動で削除できます

### 設定の管理

設定ファイルは以下の方法で管理されます

1. **GUI経由**: アプリのヘッダーにある歯車アイコンから設定画面を開く
2. **手動編集**: 上記のパスにある `config.json` を直接編集（アプリ再起動で反映）
3. **リセット**: ファイルを削除すると、次回起動時にデフォルト設定が適用されます

### 実装詳細

設定ファイルの読み書きは `electron/configManager.ts` で管理されています

- `loadConfig()`: 設定ファイルを読み込み、デフォルト値とマージ
- `saveConfig(config)`: 設定をJSONファイルに保存

```typescript
// 設定の読み込み例
const config = await window.electronAPI.getConfig()

// 設定の保存例
await window.electronAPI.updateConfig({
  photoDirectoryPath: '/path/to/photos',
  scanPeriodDays: 30
})
```


## 開発のヒント

### IPC通信の追加

新しいIPC通信を追加する場合

1. `electron/ipcHandlers.ts` にハンドラーを追加
2. `electron/preload.ts` に公開する関数を追加
3. `src/types.d.ts` の `ElectronAPI` インターフェースを更新

例
```typescript
// electron/ipcHandlers.ts
ipcMain.handle('my-new-handler', async (_, arg) => {
  return await someOperation(arg)
})

// electron/preload.ts
myNewHandler: (arg: string) => ipcRenderer.invoke('my-new-handler', arg)

// src/types.d.ts
interface ElectronAPI {
  myNewHandler: (arg: string) => Promise<Result>
}
```

### データベーススキーマの変更

1. `prisma/schema.prisma` を編集
2. `npx prisma db push` でデータベースに反映
3. `npx prisma generate` でクライアントを再生成

### デバッグ

#### Electron メインプロセス
- `console.log()` の出力はターミナルに表示されます

#### React レンダラープロセス
- DevToolsを `Cmd+Option+I` (macOS) で開く
- `console.log()` の出力はDevToolsのConsoleタブに表示されます

### トラブルシューティング

#### `npm run dev` が失敗する

```bash
# node_modulesとビルドファイルを削除して再インストール
rm -rf node_modules dist dist-electron
npm install
npx prisma generate
```

#### データベースエラー

```bash
# データベースをリセット（データが削除されます！）
rm -f prisma/dev.db
npx prisma db push
```

## パフォーマンス最適化

- 画像の読み込みは遅延ロードを使用
- 大量のワールドを扱う場合、仮想スクロールの導入を検討
- データベースクエリは適切にインデックスを使用

## セキュリティ

- 外部リンクは `shell.openExternal` を使用（IPC経由）
- ユーザー入力は適切にサニタイズ
- VRChat APIの認証情報は環境変数で管理

## テスト

このプロジェクトでは、Vitest、React Testing Libraryを使用したテスト体制を構築しています。

### テストの種類

1. **ユニットテスト**: 個別の関数やコンポーネントをテスト
2. **統合テスト**: 複数のモジュールの連携をテスト（DB操作、IPC通信など）


### テストの実行

```bash
# 全てのユニット・統合テストを実行
npm test

# ウォッチモードで実行（開発中）
npm run test:watch

# カバレッジレポート付きで実行
npm run test:coverage

# UIモードで実行（インタラクティブ）
npm run test:ui

```

### テストの書き方

#### ユニットテスト例

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '@/utils/myFunction'

describe('myFunction', () => {
  it('正しい値を返す', () => {
    const result = myFunction(10)
    expect(result).toBe(20)
  })
})
```

#### Reactコンポーネントテスト例

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('正しくレンダリングされる', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

### テストカバレッジ

カバレッジレポートは `coverage/` ディレクトリに生成されます

```bash
npm run test:coverage
open coverage/index.html  # レポートをブラウザで開く
```

### モックの使い方

ElectronAPIやデータベースのモックは `__tests__/mocks/` に用意されています

```typescript
import { mockElectronAPI } from '../../mocks/electronAPI'

// テスト内でモックの動作を設定
mockElectronAPI.getWorlds.mockResolvedValue([...])
```

### CI/CD統合

（将来的にGitHub Actionsなどで自動実行予定）

## ドキュメント

- [Electron ドキュメント](https://www.electronjs.org/docs/latest)
- [React ドキュメント](https://react.dev/)
- [Prisma ドキュメント](https://www.prisma.io/docs)
- [Tailwind CSS ドキュメント](https://tailwindcss.com/docs)

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
