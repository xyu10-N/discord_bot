# ベースイメージとしてNode.js 20の軽量版を利用
FROM node:22-slim

# pnpmを有効化
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# コンテナ内の作業ディレクトリを指定
WORKDIR /app

# パッケージ定義ファイルをコピー
# （後でpnpm-lock.yamlを生成することを見越してワイルドカードで指定）
COPY package.json pnpm-lock.yaml* ./

# 依存パッケージのインストール
RUN pnpm install

# その他のソースコードをコピー
COPY . .

# Botの起動コマンド
CMD ["node", "index.js"]
