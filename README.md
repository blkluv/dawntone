
# dawntone 概要ドキュメント

## 🎵 アプリ概要：**dawntone**

コードで音楽を記述し、即時再生・編集・エクスポートできるWebアプリ。  
`.daw`という独自の音楽記法を用いて、VSCodeのように楽曲をプログラミング的に構築できます。

---

## 🧩 主な特徴（機能概要）

| 機能 | 説明 |
|------|------|
| 🎹 音楽スクリプト記法 `.daw` | 音・コード・テンポ・トラック構成を簡潔な記法で記述可能 |
| 🧠 パース（PEG.js） | `.daw`ファイルをリアルタイムで構文解析し、JSON形式に変換 |
| 🔊 リアルタイム再生（Tone.js） | 記述した内容をその場でWeb Audioで再生可能 |
| 💾 自動保存 | 編集内容をブラウザのローカルストレージに自動保存 |
| 📂 ファイル保存・読み込み | `.dawproj`形式でプロジェクト全体を保存・再読込可能 |
| 🎼 MIDIエクスポート | 書いた曲を`.mid`に変換し、LogicやDAWに引き継ぎ可能 |
| ✏️ Monacoエディタ統合 | VSCode互換の高性能コードエディタで快適な編集体験 |
| 📱 スマホ対応 | Vercel上にデプロイ可能なPWAとして設計、モバイル編集可 |

---

## 🛠 機能一覧（詳述）

### 編集
- `.daw`スクリプトの構文ハイライト
- 自動補完（今後対応）
- undo/redo対応（エディタ由来）

### 構文サポート（言語仕様）
- `@key`, `@tempo`, `@velocity`, `@synth`
- `track <name>:` による複数トラック定義
- 和音 `(1,3,5)` や休符 `x`、スケール相対音 `3b`, `4#`
- マクロ定義 `!i = (...)` と再利用
- ループ: `@loop` でパターンを定義し、`@use` で挿入
- 名前空間 `@namespace`

### `.daw` ファイルの構文

`.daw` ファイルはヘッダ、トラック、ノート／コード、マクロ、コメントなどから構成されます。

#### ヘッダディレクティブ

```daw
@key A_minor
@tempo 100
@velocity 90
@synth analog
```

`@` で始まる行で調やテンポなどを設定します。

#### トラック定義

```daw
track bass:
  1-0-1-3-4n-90
  2-0-x-0-4n
```

`track <name>:` に続けてノートやコード行を記述します。

#### ノート行

```
bar-beat-note-octave-duration[-velocity]
```

- `note` は `1`〜`7` に `#`/`b` を付けて指定し、休符は `x`
- `duration` は `4n` や `8t` のように数値＋`n`/`t`
- `velocity` は任意

#### コード行

```
bar-beat-(note1,note2,...)-octave-duration[-velocity]
```

括弧内に複数のノートをカンマ区切りで並べます。

#### マクロ

```daw
!ch = (1,3,5)
1-0-!ch-4-4n
```

`!` で定義・呼び出しができます。

#### ループ

```daw
@loop riff {
  1-0-1-4-4n
  1-2-3-4-4n
}

track bass:
  @use riff
  @use riff
```

`@loop` で繰り返しパターンを名前付きで定義し、`@use` によってそのパターンを任意の位置に挿入します。

#### コメント

```
# コメントは行末まで無視されます
```

### 再生
- Tone.js による再生エンジン
- テンポ／ベロシティ対応
- 複数トラック同時再生（ポリフォニック）
- Play / Stop ボタン
- ループ再生切り替え

### ストレージ
- localStorageによる自動保存
- `.dawproj`（JSON）で保存・読み込み

### エクスポート
- `tonejs/midi` によるMIDIファイル生成とDL

---

## 💻 動作環境

| 項目 | 内容 |
|------|------|
| フロントエンド | Next.js (App Router), React |
| エディタ | Monaco Editor |
| パーサー | PEG.js（ブラウザ内/Node.js双方） |
| 音声エンジン | Tone.js（Web Audio API） |
| ストレージ | localStorage / ファイルDL |
| 対応ブラウザ | Chrome / Firefox / Edge / Safari（モバイル含む） |
| デプロイ | Vercel, localhost:3000 でも動作 |

### Monaco Editor について

Monaco のアセットは npm インストール時に自動的に `public/vs` へコピーされ、アプリは `/vs` から読み込みます。オフライン環境でも動作します。

もし `vs/*` の取得で 404 エラーが出る場合は、`public/vs` フォルダが存在するか確認してください。`npm install` を実行すると `postinstall` スクリプトによって自動作成されます。

Network タブで `loader.js` などが 200 で返るかどうかを確認すると原因の特定に役立ちます。

もし `vs/*` の取得で 404 エラーが出る場合は次の点を確認してください。

1. **CDN を利用する**
   `components/DawEditor.tsx` の `loader.config` で `vs` を CDN パスに設定します（デフォルト）。
   例: `vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'`

2. **オフラインで利用する**
   Monaco のディストリビューションを `public/vs/` に配置し、`loader.config({ paths: { vs: '/vs' } })` とします。
   `public/vs` 以下に `loader.js`, `editor/editor.main.js`, `worker/editor.worker.js` などが揃っているか確認してください。

Network タブで `loader.js` などが 200 で返るかどうかを確認すると原因の特定に役立ちます。


## 🛠 環境構築

1. Node.js 18 以上をインストール
2. `npm run deploy` を実行して依存関係のインストールとビルドを行う
3. `npm test` でサンプル `.daw` ファイルがパースできるか確認
4. `npm run dev` を実行し http://localhost:3000 を開く

## CLI 利用方法

グローバルインストールせずに `npx` から実行できます。

```bash
npx dawrun parse <path/to/file.daw>
```

指定した `.daw` ファイルを解析し、AST(JSON) を標準出力に出力します。

