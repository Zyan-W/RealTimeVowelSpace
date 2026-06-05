# RealTimeVowelSpace

## License / ライセンス

This project is licensed under the Apache License 2.0. See `LICENSE`.
Third-party dependency and data-source notes are listed in `THIRD_PARTY_NOTICES.md`.
AI-assisted development notes are listed in `AI_USAGE.md`.

このプロジェクトは Apache License 2.0 で公開されています。詳細は `LICENSE` を参照してください。
第三者ライブラリとデータソースの情報は `THIRD_PARTY_NOTICES.md` に、AI 支援開発に関する情報は `AI_USAGE.md` に記載しています。

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

バックエンドは FastAPI と NumPy を使っています。音声全体からエネルギーの高い有声区間を探し、その中央付近の短い安定窓で、プロジェクト内の短い WAV 読み込み・LPC 実装により F1/F2/F3 を推定します。現在の測定値は、その窓内の複数時点の中央値です。これは教育・デモ用の推定であり、Praat などの専門ツールと完全に同じ測定値になることは保証しません。

参照楕円は手作業で描いたものではありません。Hillenbrand et al. 1995、Deterding 1997、Mokhtari and Tanaka 2000 などの公開データをもとに、話者ごとの Lobanov z-score 正規化を行い、各母音の 68% F1/F2 共分散楕円として生成しています。

このツールは教育・デモ用です。研究発表用の厳密な音響分析を完全に置き換えるものではありません。

### コード・データソースとライセンス

このリポジトリ内のアプリケーションコードは、このプロジェクト用に書いた短い実装です。特定のオープンソースプロジェクト、ブログ、Stack Overflow、論文からソースコードをコピーしたものではありません。実装は Web Audio API、Fetch API、FastAPI などの公開 API と、WAV ヘッダー生成、CSV エスケープ、エネルギー窓選択、中央値、LPC、Lobanov 正規化、共分散楕円、Bark 変換などの一般的なアルゴリズム・数式に基づいています。

参照母音データは `scripts/generate_reference_ellipses.py` で公開データから生成しています。元の生データやダウンロードキャッシュはリポジトリには含めていません。

| 用途 | ソース | ライセンス・利用条件 |
| --- | --- | --- |
| American English reference | Hillenbrand et al. 1995 data via CRAN [`phonTools` `h95`](https://cran.r-project.org/package=phonTools) | `phonTools` is BSD_2_clause + file LICENSE |
| British English reference | [David Deterding 1997 JIPA vowel measurements](https://fass.ubd.edu.bn/data/JIPA-vowels/index.htm) | Source page says the measurements may be used in any useful way; no SPDX software license is declared |
| Japanese reference | [Mokhtari and Tanaka 2000 ETL Japanese vowel formant data](https://isd.pu-toyama.ac.jp/~parham/sp_FormantDataETL.html) | Publicly available research data; no SPDX software license is declared on the source page |

Japanese reference の派生値は現在も corpus JSON に含まれています。厳密に license が明示されたデータだけを使う方針にする場合、このデータ源は公開前に明示的に承認するか、別のデータ源に置き換える必要があります。

直接使用している Python ライブラリ:

| ライブラリ | 用途 | ライセンス |
| --- | --- | --- |
| FastAPI | backend API | MIT |
| Uvicorn | ASGI server | BSD-3-Clause |
| python-multipart | upload form parsing | Apache-2.0 |
| NumPy | numerical arrays and statistics | BSD-3-Clause; binary wheels may bundle additional compatible runtime libraries |
| pytest | backend tests | MIT |
| HTTPX | tests and reference-data download script | BSD-3-Clause |
| pandas, rdata, xlrd | optional reference-data regeneration only | BSD-3-Clause / MIT / BSD-style |

直接使用している Node.js ライブラリ:

| ライブラリ | 用途 | ライセンス |
| --- | --- | --- |
| React, React DOM | frontend UI | MIT |
| Vite, @vitejs/plugin-react | dev server and build | MIT |
| TypeScript | frontend type checking | Apache-2.0 |
| lucide-react | button icons | ISC |
| Vitest, jsdom, Testing Library packages, React type packages | frontend tests | MIT |

`frontend/package-lock.json` に含まれる現在の伝播依存の license 集合は Apache-2.0、BSD-2-Clause、BSD-3-Clause、BlueOak-1.0.0、CC-BY-4.0、CC0-1.0、ISC、MIT、MIT-0 です。このプロジェクト自身のコードは Apache License 2.0 で公開する想定で、`LICENSE`、`NOTICE`、`THIRD_PARTY_NOTICES.md`、`AI_USAGE.md` を同梱しています。以前の GPLv3 runtime dependency である `praat-parselmouth` は削除済みです。

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

The backend is built with FastAPI and NumPy. It finds a high-energy voiced region in the recording, selects a short stable window around the center of that region, and estimates F1/F2/F3 with a short project-owned WAV reader and LPC implementation. The returned measurement is the median across several time points in that window. This is a teaching/demo estimate and is not guaranteed to match specialist tools such as Praat exactly.

The reference ellipses are not hand-drawn. They are generated from public formant datasets, including Hillenbrand et al. 1995, Deterding 1997, and Mokhtari and Tanaka 2000. The generator applies speaker-level Lobanov z-score normalization and calculates a 68% F1/F2 covariance ellipse for each vowel.

This tool is intended for teaching and demonstration. It is not a full replacement for publication-grade acoustic analysis.

### Code, Data Sources, and Licenses

The application code in this repository was written for this project as short, generic implementation code. It does not copy source code from a specific open-source project, blog, Stack Overflow answer, or paper. The implementation uses public API documentation for Web Audio API, Fetch API, FastAPI, and general algorithms or formulas such as WAV header writing, CSV escaping, energy-window selection, medians, LPC, Lobanov normalization, covariance ellipses, and Bark conversion.

Reference vowel data is generated from public data sources by `scripts/generate_reference_ellipses.py`. Raw source data and download caches are not included in the repository.

| Purpose | Source | License or use statement |
| --- | --- | --- |
| American English reference | Hillenbrand et al. 1995 data via CRAN [`phonTools` `h95`](https://cran.r-project.org/package=phonTools) | `phonTools` is BSD_2_clause + file LICENSE |
| British English reference | [David Deterding 1997 JIPA vowel measurements](https://fass.ubd.edu.bn/data/JIPA-vowels/index.htm) | Source page says the measurements may be used in any useful way; no SPDX software license is declared |
| Japanese reference | [Mokhtari and Tanaka 2000 ETL Japanese vowel formant data](https://isd.pu-toyama.ac.jp/~parham/sp_FormantDataETL.html) | Publicly available research data; no SPDX software license is declared on the source page |

Derived Japanese reference values are still present in the corpus JSON files. If the release policy requires only explicitly licensed data, this source needs explicit owner approval before release or replacement with another data source.

Direct Python libraries:

| Library | Used for | License |
| --- | --- | --- |
| FastAPI | backend API | MIT |
| Uvicorn | ASGI server | BSD-3-Clause |
| python-multipart | upload form parsing | Apache-2.0 |
| NumPy | numerical arrays and statistics | BSD-3-Clause; binary wheels may bundle additional compatible runtime libraries |
| pytest | backend tests | MIT |
| HTTPX | tests and reference-data download script | BSD-3-Clause |
| pandas, rdata, xlrd | optional reference-data regeneration only | BSD-3-Clause / MIT / BSD-style |

Direct Node.js libraries:

| Library | Used for | License |
| --- | --- | --- |
| React, React DOM | frontend UI | MIT |
| Vite, @vitejs/plugin-react | dev server and build | MIT |
| TypeScript | frontend type checking | Apache-2.0 |
| lucide-react | button icons | ISC |
| Vitest, jsdom, Testing Library packages, React type packages | frontend tests | MIT |

The current license set among transitive packages in `frontend/package-lock.json` is Apache-2.0, BSD-2-Clause, BSD-3-Clause, BlueOak-1.0.0, CC-BY-4.0, CC0-1.0, ISC, MIT, and MIT-0. This project's own code is intended for release under the Apache License 2.0, and the repository includes `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES.md`, and `AI_USAGE.md`. The previous GPLv3 runtime dependency `praat-parselmouth` has been removed.

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
