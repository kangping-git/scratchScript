import { TokenType, Token } from "./lexer";
import { alreadyError, lang, message } from "./util";

enum NodeType {
    FunctionCaller,
    String,
    Number,
    InitVar,
    ArrowFunction,
}
type ASTNode =
    | {
          type: NodeType.FunctionCaller;
          callFunctionName: string;
          args: ASTNode[];
      }
    | {
          type: NodeType.String;
          value: string;
      }
    | {
          type: NodeType.Number;
          value: number;
      }
    | {
          type: NodeType.InitVar;
          varData: {
              type: string;
              name: string;
              value: ASTNode;
          };
      }
    | {
          type: NodeType.ArrowFunction;
          args: {
              type: string;
              name: string;
          }[];
          func: ASTNode[];
      };

type parseLineReturn = {
    token: Token[];
    ast: ASTNode | null;
};

let $code: string[] = [];
let $$code: string = "";

let varTypes: string[] = ["number", "string"];

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
function parseLine(token: Token[], mustSemi = true) {
    let returnAst: parseLineReturn = {
        token: token.slice(1),
        ast: null,
    };
    let firstToken = token[0];
    switch (firstToken.type) {
        case TokenType.semi:
            // MEMO:セミコロンの時はスキップ
            return returnAst;
        case TokenType.identifier:
            if (token.length > 1) {
                if (token[1].type == TokenType.leftParentheses) {
                    let depth: number = 1;
                    let t = [];
                    returnAst.token.shift();
                    for (let i = 2; i < token.length; ++i) {
                        if (token[i].type == TokenType.leftParentheses) {
                            depth += 1;
                        } else if (
                            token[i].type == TokenType.rightParentheses
                        ) {
                            depth -= 1;
                            if (depth == 0) {
                                returnAst.token.shift();
                                break;
                            }
                        }
                        t.push(token[i]);
                        returnAst.token.shift();
                    }
                    if (depth !== 0) {
                        message(
                            "ERR010",
                            {},
                            $code,
                            token[0].y,
                            token[0].x,
                            token[0].value.length
                        );
                    } else {
                        let args: ASTNode[] = [];
                        while (t.length > 0) {
                            let r = parseLine(t, false);
                            t = r.token;
                            if (t.length > 0) {
                                if (t[0].type !== TokenType.comma) {
                                    message(
                                        "ERR011",
                                        {},
                                        $code,
                                        t[0].y,
                                        t[0].x,
                                        t[0].value.length
                                    );
                                } else {
                                    t.shift();
                                }
                            }
                            if (r.ast != null) {
                                args.push(r.ast);
                            }
                        }
                        returnAst.ast = {
                            type: NodeType.FunctionCaller,
                            callFunctionName: firstToken.value,
                            args: args,
                        };
                    }
                }
            }
            break;
        case TokenType.string:
            // MEMO:文字列
            returnAst.ast = {
                type: NodeType.String,
                value: firstToken.value.slice(1, -1),
            };
            break;
        case TokenType.number:
            // MEMO:数値
            returnAst.ast = {
                type: NodeType.Number,
                value: Number(firstToken.value),
            };
            break;
        case TokenType.keyword:
            // MEMO:変数初期化
            if (
                token.length > 5 &&
                token[1].type == TokenType.identifier &&
                token[2].type == TokenType.colon &&
                token[3].type == TokenType.type &&
                token[4].type == TokenType.substitutionOperator
            ) {
                // MEMO:変数初期化 引数あり
                let r = parseLine(token.slice(5), false);
                returnAst.token = r.token;
                if (r.ast == null) {
                    message(
                        "ERR011",
                        {},
                        $code,
                        token[5].y,
                        token[5].x,
                        token[5].value.length
                    );
                } else {
                    returnAst.ast = {
                        type: NodeType.InitVar,
                        varData: {
                            name: token[1].value,
                            type: token[3].value,
                            value: r.ast,
                        },
                    };
                    returnAst.token = r.token;
                }
            } else if (token.length > 3) {
                if (
                    token[1].type == TokenType.identifier &&
                    token[2].type == TokenType.colon &&
                    token[3].type == TokenType.type
                ) {
                    // MEMO:変数初期化 引数なし
                    returnAst.ast = {
                        type: NodeType.InitVar,
                        varData: {
                            name: token[1].value,
                            type: token[3].value,
                            value:
                                token[3].value == "string"
                                    ? { type: NodeType.String, value: "" }
                                    : { type: NodeType.Number, value: 0 },
                        },
                    };
                    returnAst.token = token.slice(4);
                }
            }
            break;
        case TokenType.leftParentheses:
            // MEMO:アロー関数
            let r: ASTNode = {
                type: NodeType.ArrowFunction,
                args: [],
                func: [],
            };
            // MEMO:アロー関数の引数解析
            let depth = 1;
            let $args: Token[] = [];
            let i: number;
            returnAst.token.shift();
            for (i = 1; i < token.length; ++i) {
                if (token[i].type == TokenType.leftParentheses) {
                    depth += 1;
                } else if (token[i].type == TokenType.rightParentheses) {
                    depth -= 1;
                    if (depth == 0) {
                        returnAst.token.shift();
                        break;
                    }
                }
                $args.push(token[i]);
                returnAst.token.shift();
            }
            let c = 0;
            for (let i in $args) {
                if (c >= 2) {
                    if ($args[i].type == TokenType.comma) {
                        c += 1;
                        continue;
                    } else if ($args[i].type == TokenType.identifier) {
                        if (c >= 3) {
                            c = 0;
                            r.args.push({
                                type: "",
                                name: $args[i].value,
                            });
                            continue;
                        } else {
                            message(
                                "ERR011",
                                {},
                                $code,
                                token[0].y,
                                token[0].x,
                                token[0].value.length
                            );
                            return returnAst;
                        }
                    }
                } else if (c == 0) {
                    if ($args[i].type == TokenType.colon) {
                        c += 1;
                        continue;
                    }
                } else if (c == 1) {
                    if ($args[i].type == TokenType.type) {
                        r.args[r.args.length - 1].type = $args[i].value;
                        c += 1;
                        continue;
                    }
                }
                message(
                    "ERR009",
                    {},
                    $code,
                    token[0].y,
                    token[0].x,
                    token[0].value.length
                );
                return returnAst;
            }
            if (token[i + 1].type == TokenType.arrow) {
                if (token[i + 2].type == TokenType.leftBraces) {
                    let j;
                    let depth = 1;
                    let t: Token[] = [];
                    for (j = i + 3; j < token.length; ++j) {
                        if (token[j].type == TokenType.leftBraces) {
                            depth += 1;
                        } else if (token[j].type == TokenType.rightBraces) {
                            depth -= 1;
                            if (depth == 0) {
                                break;
                            }
                        }
                        t.push(token[j]);
                        returnAst.token.shift();
                    }
                    returnAst.token.shift();
                    returnAst.token.shift();
                    if (j == token.length) {
                        message(
                            "ERR009",
                            {},
                            $code,
                            token[0].y,
                            token[0].x,
                            token[0].value.length
                        );
                        return returnAst;
                    } else {
                        let R = parser(t, $$code);
                        r.func = R;
                        returnAst.ast = r;
                    }
                }
            }
            break;
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
    }
    return returnAst;
}

export { parser };
