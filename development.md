# とりあえず起動させる方法

1. 依存パッケージをインストールする
```bash
npm install
```

2. .envファイルをコピーする
```bash
cp .env.example .env
```

3. DBを初期化する
```bash
npx prisma migrate dev
```

4. アプリ起動
```bash
npm run dev
```
