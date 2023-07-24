import * as util from "./util";

// MEMO:TokenType宣言
enum TokenType {
    keyword = "keyword",
    identifier = "identifier",
    colon = "colon",
    comma = "comma",
    string = "string",
    operator = "operator",
    number = "number",
    semi = "semi",
    arrow = "arrow",
    type = "type",
    leftParentheses = "leftParentheses",
    rightParentheses = "rightParentheses",
    leftBraces = "leftBraces",
    rightBraces = "rightBraces",
    substitutionOperator = "substitutionOperator",
}

// MEMO:Token宣言
type Token =
    | { type: TokenType.keyword; value: string; x: number; y: number }
    | { type: TokenType.type; value: string; x: number; y: number }
    | { type: TokenType.identifier; value: string; x: number; y: number }
    | { type: TokenType.colon; value: string; x: number; y: number }
    | { type: TokenType.string; value: string; x: number; y: number }
    | { type: TokenType.operator; value: string; x: number; y: number }
    | { type: TokenType.number; value: string; x: number; y: number }
    | { type: TokenType.semi; value: string; x: number; y: number }
    | { type: TokenType.comma; value: string; x: number; y: number }
    | { type: TokenType.arrow; value: string; x: number; y: number }
    | { type: TokenType.leftParentheses; value: string; x: number; y: number }
    | { type: TokenType.rightParentheses; value: string; x: number; y: number }
    | { type: TokenType.leftBraces; value: string; x: number; y: number }
    | { type: TokenType.rightBraces; value: string; x: number; y: number }
    | {
          type: TokenType.substitutionOperator;
          value: string;
          x: number;
          y: number;
      };

function lexer(code: string) {
    // MEMO:Tokenに分解
    let tokens: string[] = code.split(
        /(\r\n|\r|\n|\/\/[^(\r\n|\r|\n)]*(\r\n|\r|\n)| +|let|number|:|=>|=|-?\d+\.\d+|-?\d+|[a-zA-Z_]\w*|;|"[^"]*"|\(|\)|\[|\]|{|})/
    );
    function addToken(token: {
        type: TokenType;
        value: string;
        x?: number;
        y?: number;
    }) {
        token.x = char - token.value.length;
        token.y = line;
        t.push(token as Token);
    }
    let t: Token[] = [];
    let line: number = 0;
    let char: number = 0;
    let keyword: string[] = "if,else,for,function,let".split(",");
    let types: string[] = "number,string".split(",");
    for (let i in tokens) {
        let token = tokens[i];

        // MEMO:空白の時の対処
        if (token == void 0 || token[0] == " " || token == "") {
            if (token != void 0) {
                char += token.length;
            }
            continue;
        }
        // MEMO:改行の時の対処
        if (["\r\n", "\r", "\n"].includes(token)) {
            char = 0;
            line += 1;
            continue;
        }
        // MEMO:それぞれのトークン
        char += token.length;
        // MEMO:コメントアウトの処理
        if (token.slice(0, 2) == "//") {
            continue;
        }
        // MEMO:セミコロン
        if (token == ";") {
            addToken({
                type: TokenType.semi,
                value: token,
            });
            continue;
        }
        // MEMO:キーワード
        if (keyword.includes(token)) {
            addToken({
                type: TokenType.keyword,
                value: token,
            });
            continue;
        }
        // MEMO:型
        if (types.includes(token)) {
            addToken({
                type: TokenType.type,
                value: token,
            });
            continue;
        }
        // MEMO:識別子
        if (token.match(/^[a-zA-Z_]\w*$/)) {
            addToken({
                type: TokenType.identifier,
                value: token,
            });
            continue;
        }
        // MEMO:数値型
        if (token.match(/^-?\d+\.\d+|-?\d+$/)) {
            addToken({
                type: TokenType.number,
                value: token,
            });
            continue;
        }
        // MEMO:文字列型
        if (token[0] == '"' && token.slice(-1)[0] == '"') {
            addToken({
                type: TokenType.string,
                value: token,
            });
            continue;
        }
        // MEMO:コロン
        if (token == ":") {
            addToken({
                type: TokenType.colon,
                value: token,
            });
            continue;
        }
        // MEMO:演算子
        if (["+", "-", "*", "/", "**"].includes(token)) {
            addToken({
                type: TokenType.operator,
                value: token,
            });
            continue;
        }
        // MEMO:代入演算子
        if (token == "=") {
            addToken({
                type: TokenType.substitutionOperator,
                value: token,
            });
            continue;
        }
        // MEMO:括弧
        if (["(", ")"].includes(token)) {
            addToken({
                type:
                    token == "("
                        ? TokenType.leftParentheses
                        : TokenType.rightParentheses,
                value: token,
            });
            continue;
        }
        // MEMO:中括弧
        if (["{", "}"].includes(token)) {
            addToken({
                type:
                    token == "{" ? TokenType.leftBraces : TokenType.rightBraces,
                value: token,
            });
            continue;
        }
        // MEMO:コンマ
        if (token == ",") {
            addToken({
                type: TokenType.comma,
                value: token,
            });
            continue;
        }
        // MEMO:矢印
        if (token == "=>") {
            addToken({
                type: TokenType.arrow,
                value: token,
            });
            continue;
        }

        // MEMO:エラー
        util.message(
            "ERR008",
            {},
            code.split(/\r\n|\r|\n/),
            line,
            char - token.length,
            token.length
        );
    }
    return t;
}

export { lexer, TokenType, Token };
