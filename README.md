# RealTimeVowelSpace

## 日本語

RealTimeVowelSpace は、母音空間を授業・デモ用に可視化するための Web ツールです。ブラウザで単語または仮名を 1 つずつ読み上げると、録音された音声から F1/F2/F3 を抽出し、結果をすぐに母音図に表示します。

### 主な機能

- American English、British English、日本語の母音課題に対応しています。
- 各トークンを録音すると、F1/F2/F3 と分析品質スコアを表示します。
- F1/F2 の母音図を Hz または Bark で表示できます。
- 公開フォルマントデータに基づく正規化済み参照楕円を表示します。
- 選択した語リストをすべて録音すると、話者自身の母音空間ポリゴンを描画します。
- セッション結果を CSV として保存できます。
- 音声ファイルはサーバー側に保存されません。短い録音を処理して結果を返した後、音声データは破棄されます。

### 実装の概要

フロントエンドは React/Vite で作られています。ブラウザ上でマイク録音を行い、WAV 音声を backend API に送信します。

バックエンドは FastAPI と Praat/Parselmouth を使っています。音声全体からエネルギーの高い有声区間を探し、その中央付近の短い安定窓で複数の時点からフォルマントを取得します。現在の測定値は、その窓内の F1/F2/F3 値の中央値です。

参照楕円は手作業で描いたものではありません。Hillenbrand et al. 1995、Deterding 1997、Mokhtari and Tanaka 2000 などの公開データをもとに、話者ごとの Lobanov z-score 正規化を行い、各母音の 68% F1/F2 共分散楕円として生成しています。

このツールは教育・デモ用です。研究発表用の厳密な音響分析を完全に置き換えるものではありません。

### GitHub からダウンロードする方法

Git を使う場合:

```bash
git clone https://github.com/Zyan-W/RealTimeVowelSpace.git
cd RealTimeVowelSpace
```

Git を使わない場合:

1. GitHub のリポジトリページを開きます。
2. `Code` ボタンを押します。
3. `Download ZIP` を選びます。
4. ZIP ファイルを展開します。
5. 展開した `RealTimeVowelSpace` フォルダを開きます。

### 必要なもの

- Python 3.12 以上
- Node.js LTS
- マイクを使えるブラウザ

Python と Node.js 本体が見つからない場合、起動スクリプトはインストールするかどうかを確認します。Windows では `winget`、macOS では Homebrew が使える場合に自動インストールできます。

初回起動時には、このプロジェクトに必要な Python パッケージと Node.js パッケージも自動でインストールします。

### Windows での使い方

1. `RealTimeVowelSpace` フォルダを開きます。
2. `start-dev.cmd` をダブルクリックします。
3. `RealTimeVowelSpace is ready` と表示されるまで待ちます。
4. 自動で開いたブラウザページを使います。

停止するには、起動したウィンドウで `Ctrl+C` を押すか、そのウィンドウを閉じます。

### macOS での使い方

ターミナルで `RealTimeVowelSpace` フォルダに移動し、次を実行します。

```bash
bash start-dev.sh
```

`RealTimeVowelSpace is ready` と表示されるまで待ち、自動で開いたブラウザページを使います。

停止するには、ターミナルで `Ctrl+C` を押します。

### ページ上での操作

1. `American`、`British`、`Japanese` のいずれかを選びます。
2. 必要に応じて `Hz` または `Bark` を選びます。
3. `Record` を押して、表示された単語または仮名を読みます。
4. `Stop` を押すと、F1/F2/F3 と母音図上の点が表示されます。
5. リストの最後まで録音すると、話者の母音空間ポリゴンが表示されます。
6. ダウンロードボタンで CSV を保存できます。

---

## English

RealTimeVowelSpace is a web-based teaching tool for visualizing vowel space. Users read one word or kana prompt at a time in the browser; the tool extracts F1/F2/F3 from the recording and immediately plots the result on a vowel chart.

### Main Features

- Supports American English, British English, and Japanese vowel tasks.
- Shows F1/F2/F3 and an analysis-quality score for each recorded token.
- Displays the F1/F2 vowel chart in either Hz or Bark.
- Shows normalized reference ellipses derived from public formant datasets.
- Draws the speaker's own vowel-space polygon after the full selected word list has been recorded.
- Exports the browser session as CSV.
- Does not store uploaded audio on the server. Each short recording is processed, returned as formant values, and discarded.

### How It Works

The frontend is built with React/Vite. It records microphone audio in the browser and sends a WAV clip to the backend API.

The backend is built with FastAPI and Praat/Parselmouth. It finds a high-energy voiced region in the recording, selects a short stable window around the center of that region, samples formants at multiple time points, and returns the median F1/F2/F3 values from that window.

The reference ellipses are not hand-drawn. They are generated from public formant datasets, including Hillenbrand et al. 1995, Deterding 1997, and Mokhtari and Tanaka 2000. The generator applies speaker-level Lobanov z-score normalization and calculates a 68% F1/F2 covariance ellipse for each vowel.

This tool is intended for teaching and demonstration. It is not a full replacement for publication-grade acoustic analysis.

### Download From GitHub

With Git:

```bash
git clone https://github.com/Zyan-W/RealTimeVowelSpace.git
cd RealTimeVowelSpace
```

Without Git:

1. Open the repository page on GitHub.
2. Click `Code`.
3. Choose `Download ZIP`.
4. Unzip the file.
5. Open the extracted `RealTimeVowelSpace` folder.

### Requirements

- Python 3.12 or newer
- Node.js LTS
- A browser with microphone access

If Python or Node.js is missing, the launcher asks whether to install the missing runtime. On Windows it uses `winget`; on macOS it can use Homebrew if Homebrew is already installed.

On first launch, it also installs the required project Python and Node.js packages automatically.

### Windows Usage

1. Open the `RealTimeVowelSpace` folder.
2. Double-click `start-dev.cmd`.
3. Wait until the launcher prints `RealTimeVowelSpace is ready`.
4. Use the browser page that opens automatically.

To stop the tool, press `Ctrl+C` in the launcher window or close that window.

### macOS Usage

Open Terminal, move into the `RealTimeVowelSpace` folder, and run:

```bash
bash start-dev.sh
```

Wait until the launcher prints `RealTimeVowelSpace is ready`, then use the browser page that opens automatically.

To stop the tool, press `Ctrl+C` in the terminal.

### Using the Page

1. Choose `American`, `British`, or `Japanese`.
2. Choose `Hz` or `Bark` if needed.
3. Click `Record` and read the displayed word or kana.
4. Click `Stop` to show F1/F2/F3 and plot the vowel point.
5. Continue through the list; after all tokens are recorded, the speaker vowel-space polygon appears.
6. Use the download button to export the CSV.
