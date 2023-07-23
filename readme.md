# ScratchScript

ScratchScript は、高級言語で Scratch プロジェクトを作成するためのコンパイラです。Typescript に似た文法を持ち、Scratch のプロジェクトファイル（sb3）にコンパイルすることができます。CLI を利用して簡単にコンパイルが行えます。

## インストール

```bash
npm install -g scratchscript
```

## 使い方

ScratchScript コンパイラを CLI として利用できます。以下のコマンドを使用して、ScratchScript ファイル（.ss ファイル）をコンパイルして Scratch プロジェクト（sb3 ファイル）を出力します。

```bash
scl compile <input-file>.ss -o <output-file>.sb3
```

## コード例

以下は ScratchScript の簡単なコード例です。これは"Hello, Scratch!"というメッセージを表示するプログラムです。

```typescript
// スプライトに対応するイベントハンドラ
whenSpriteClicked("Scratch", () => {
    // スプライト（キャラクター）の名前を取得して変数に代入
    let name: string = getSpriteName();

    // メッセージを表示する関数を呼び出し
    say("Hello, " + name + "!");
});
```

## コマンド一覧

`compile <input-file>.ss [-o <output-file>.sb3]`: ScratchScript ファイルをコンパイルして Scratch プロジェクトを出力します。
`create <project-name>`: 新しい ScratchScript プロジェクトを作成します。デフォルトのスクリプトファイル（main.ss）が生成されます。

## 共同開発者募集

ScratchScript はまだ開発中であり、新しいアイデアとコントリビューションを歓迎します！もしあなたが興味を持ってくれたら、ぜひプロジェクトに参加してください。共同開発者としてのあなたの力を借りて、より優れた ScratchScript を作り上げていきましょう。

## ライセンス

MIT ライセンスのもとで公開されています。詳細は LICENSE ファイルをご確認ください。
