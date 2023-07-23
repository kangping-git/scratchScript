// スプライトに対応するイベントハンドラ
whenSpriteClicked("Sprite1", () => {
    // スプライト（キャラクター）の名前を取得して変数に代入
    let name: string = getSpriteName();

    // メッセージを表示する関数を呼び出し
    say("Hello, " + name + "!");
});