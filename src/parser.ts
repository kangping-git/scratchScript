import { TokenType, Token } from "./lexer";

type parseLineReturn = {
    token: Token[];
};

// MEMO:すべてのコードのパーサー
function parser(token: Token[]) {}

// MEMO:一命令ごとのパーサー
function parseLine(token: Token[]) {}

export { parser };
