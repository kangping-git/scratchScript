import { TokenType, Token } from "./lexer";
import { alreadyError, lang, message } from "./util";

enum NodeType {
    FunctionCaller,
    String,
    Number,
    InitVar,
    ArrowFunction,
    Operator,
    GetVar,
}
type ASTNode =
    | {
          type: NodeType.FunctionCaller;
          callFunctionName: string;
          args: ASTNode[];
          x1: number;
          y1: number;
          x2: number;
          y2: number;
      }
    | {
          type: NodeType.String;
          value: string;
          x1: number;
          y1: number;
          x2: number;
          y2: number;
      }
    | {
          type: NodeType.Number;
          value: number;
          x1: number;
          y1: number;
          x2: number;
          y2: number;
      }
    | {
          type: NodeType.InitVar;
          varData: {
              type: string;
              name: string;
              value: ASTNode;
          };
          x1: number;
          y1: number;
          x2: number;
          y2: number;
      }
    | {
          type: NodeType.ArrowFunction;
          args: {
              type: string;
              name: string;
          }[];
          func: ASTNode[];
          x1: number;
          y1: number;
          x2: number;
          y2: number;
      }
    | {
          type: NodeType.Operator;
          left: ASTNode;
          expression: { op: string; right: ASTNode }[];
          x1: number;
          y1: number;
          x2: number;
          y2: number;
      }
    | {
          type: NodeType.GetVar;
          varName: string;
          x1: number;
          y1: number;
          x2: number;
          y2: number;
      };

type parseLineReturn = {
    token: Token[];
    ast: ASTNode | null;
};

let $code: string[] = [];
let $$code: string = "";

let varTypes: { [key: string]: ASTNode } = {
    string: {
        type: NodeType.String,
        value: "",
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
    },
    number: {
        type: NodeType.Number,
        value: 0,
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
    },
};

// MEMO:すべてのコードのパーサー
function parser(token: Token[], code: string) {
    let asts: ASTNode[] = [];
    $code = code.split(/\r\n|\r|\n/);
    $$code = code;
    while (token.length > 0) {
        let r = parseLine(token);
        token = r.token;
        if (r.ast != null) {
            asts.push(r.ast);
        }
    }
    return asts;
}

// MEMO:一命令ごとのパーサー
function parseLine(
    token: Token[],
    mustSemi: boolean = true,
    NoOperator: boolean = false
) {
    let returnAst: parseLineReturn = {
        token: token.slice(1),
        ast: null,
    };
    function TokenIF(minTokenLength: number, ...checkToken: TokenType[]) {
        return (
            minTokenLength <= token.length &&
            checkToken.reduce(
                (
                    previousValue: boolean,
                    currentValue: TokenType,
                    currentIndex: number
                ) => {
                    if (currentValue !== token[currentIndex].type) {
                        return false;
                    }
                    return previousValue;
                },
                true
            )
        );
    }
    function AutoTokenIF(...checkToken: TokenType[]) {
        return (
            checkToken.length <= token.length &&
            checkToken.reduce(
                (
                    previousValue: boolean,
                    currentValue: TokenType,
                    currentIndex: number
                ) => {
                    if (currentValue !== token[currentIndex].type) {
                        return false;
                    }
                    return previousValue;
                },
                true
            )
        );
    }
    function tokenError(errorCode: string, errorToken: Token) {
        message(
            errorCode,
            {},
            $code,
            errorToken.y,
            errorToken.x,
            errorToken.value.length
        );
    }

    if (TokenIF(3, TokenType.identifier, TokenType.leftParentheses)) {
        // MEMO:関数
        let args = [];
        let depth = 1;
        let i: number;
        for (i = 2; i < token.length; ++i) {
            if (token[i].type == TokenType.leftParentheses) {
                depth += 1;
            } else if (token[i].type == TokenType.rightParentheses) {
                depth -= 1;
                if (depth == 0) {
                    returnAst.token.shift();
                    returnAst.token.shift();
                    break;
                }
            }
            args.push(token[i]);
            returnAst.token.shift();
        }
        let argsMain: ASTNode[] = [];
        while (args.length > 0) {
            let r = parseLine(args, false);
            if (r.ast == null) {
                args = r.token;
                continue;
            }
            args = r.token;
            argsMain.push(r.ast);
            if (args.length > 0) {
                if (args[0].type !== TokenType.comma) {
                    // MEMO:コンマが存在しない時のエラー
                    tokenError("ERR011", args[0]);
                    continue;
                }
                args.shift();
            }
        }
        returnAst.ast = {
            type: NodeType.FunctionCaller,
            args: argsMain,
            callFunctionName: token[0].value,
            x1: token[0].x,
            y1: token[0].y,
            x2: token[0].x + token[0].value.length,
            y2: token[0].y,
        };
    } else if (AutoTokenIF(TokenType.string)) {
        // MEMO:文字列
        returnAst.ast = {
            type: NodeType.String,
            value: token[0].value.slice(1, -1),
            x1: token[0].x,
            y1: token[0].y,
            x2: token[0].x + token[0].value.length,
            y2: token[0].y,
        };
    } else if (
        AutoTokenIF(
            TokenType.variableDeclaration,
            TokenType.identifier,
            TokenType.colon,
            TokenType.type
        )
    ) {
        if (
            TokenIF(
                6,
                TokenType.variableDeclaration,
                TokenType.identifier,
                TokenType.colon,
                TokenType.type,
                TokenType.substitutionOperator
            )
        ) {
            // 初期化値がある変数宣言
            let r = parseLine(token.slice(5));
            if (r.ast !== null) {
                returnAst.ast = {
                    type: NodeType.InitVar,
                    varData: {
                        type: token[3].value,
                        name: token[1].value,
                        value: r.ast,
                    },
                    x1: token[0].x,
                    y1: token[0].y,
                    x2:
                        token[token.length - r.token.length - 1].x +
                        token[token.length - r.token.length - 1].value.length -
                        1,
                    y2: token[token.length - r.token.length - 1].y,
                };
            }
            returnAst.token = r.token;
        } else {
            returnAst.ast = {
                type: NodeType.InitVar,
                varData: {
                    type: token[3].value,
                    name: token[1].value,
                    value: varTypes[token[3].value],
                },
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0,
            };
            returnAst.token = token.slice(4);
        }
    } else if (AutoTokenIF(TokenType.semi)) {
        return returnAst;
    } else if (TokenIF(5, TokenType.leftParentheses)) {
        let argsRaw = [];
        let depth = 1;
        let i: number = 1;
        for (; i < token.length; ++i) {
            if (token[i].type == TokenType.leftParentheses) {
                depth += 1;
            } else if (token[i].type == TokenType.rightParentheses) {
                depth -= 1;
                if (depth == 0) {
                    break;
                }
            }
            argsRaw.push(token[i]);
        }
        if (
            token[i + 1].type == TokenType.arrow &&
            token[i + 2].type == TokenType.leftBraces
        ) {
            if (![2, 3].includes(i % 4)) {
                let args = [];
                for (let j = 0; j < argsRaw.length; j += 4) {
                    if (
                        token[j + 3].type == TokenType.type &&
                        token[j + 1].type == TokenType.identifier
                    ) {
                        args.push({
                            type: token[j + 3].value,
                            name: token[j + 1].value,
                        });
                    } else {
                        tokenError("ERR011", token[j + 1]);
                        break;
                    }
                }
                let functionToken: Token[] = [];
                i += 3;
                depth = 1;
                for (; i < token.length; ++i) {
                    if (token[i].type == TokenType.leftBraces) {
                        depth += 1;
                    } else if (token[i].type == TokenType.rightBraces) {
                        depth -= 1;
                        if (depth == 0) {
                            break;
                        }
                    }
                    functionToken.push(token[i]);
                }
                let asts = parser(functionToken, $$code);
                returnAst.ast = {
                    type: NodeType.ArrowFunction,
                    args: args,
                    func: asts,
                    x1: token[0].x,
                    y1: token[0].y,
                    x2: token[0].x + token[0].value.length,
                    y2: token[0].y,
                };
                returnAst.token = token.slice(i + 1);
            }
        }
    } else if (AutoTokenIF(TokenType.identifier)) {
        returnAst.ast = {
            type: NodeType.GetVar,
            varName: token[0].value,
            x1: token[0].x,
            y1: token[0].y,
            x2: token[0].x + token[0].value.length,
            y2: token[0].y,
        };
    }
    if (returnAst.ast == null) {
        // MEMO:構文が存在しない時のエラー
        message(
            "ERR009",
            {},
            $code,
            token[0].y,
            token[0].x,
            token[0].value.length
        );
    } else if (
        mustSemi &&
        (returnAst.token.length == 0 ||
            returnAst.token[0].type !== TokenType.semi)
    ) {
        // MEMO:セミコロンがないときのエラー
        message(
            "ERR001",
            {},
            $code,
            token[0].y,
            token[0].x,
            token[0].value.length
        );
    } else {
        if (mustSemi) {
            returnAst.token.shift();
        } else {
            if (
                !NoOperator &&
                returnAst.token.length > 1 &&
                returnAst.token[0].type == TokenType.operator
            ) {
                let astTemp = { ...returnAst.ast };
                let tt: Token[] = [...returnAst.token];
                returnAst.ast = {
                    type: NodeType.Operator,
                    left: astTemp,
                    expression: [],
                    x1: astTemp.x1,
                    y1: astTemp.y1,
                    x2: 0,
                    y2: 0,
                };
                while (tt.length > 0) {
                    if (tt[0].type != TokenType.operator) {
                        break;
                    }
                    let op = tt[0].value;
                    tt.shift();
                    let r = parseLine(tt, false, true);
                    tt = r.token;
                    if (r.ast == null) {
                        returnAst.ast.expression = [];
                        break;
                    }
                    returnAst.ast.expression.push({
                        op: op,
                        right: r.ast,
                    });
                    returnAst.ast.x2 = r.ast.x2;
                    returnAst.ast.y2 = r.ast.y2;
                }
                returnAst.token = tt;
            }
        }
    }
    if (returnAst.ast != null) {
        returnAst.ast.x1 = token[0].x;
        returnAst.ast.y1 = token[0].y;
        returnAst.ast.x2 =
            token[token.length - returnAst.token.length - 1].x +
            token[token.length - returnAst.token.length - 1].value.length -
            1;
        returnAst.ast.y2 = token[token.length - returnAst.token.length - 1].y;
    }
    return returnAst;
}

export { parser };
