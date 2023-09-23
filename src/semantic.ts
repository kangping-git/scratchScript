import { ASTNode, NodeType } from "./parser";
import { message } from "./util";
import fs from "fs";
import path from "path";

const modules = JSON.parse(fs.readFileSync(path.join(__dirname, "../resources/module/blocks.json"), "utf-8"));

function semantic(ast: ASTNode, $vars: { [keys: string]: string } = {}) {
    switch (ast.type) {
        case NodeType.ArrowFunction:
            for (let i in ast.func) {
                let a = semantic(ast.func[i], $vars);
                $vars = a.var;
            }
            return { r: "function", var: $vars };
        case NodeType.GetVar:
            if (!ast.varName) {
                message("ERR14");
                return { r: "", var: $vars };
            }
            return { r: $vars[ast.varName], var: $vars };
        case NodeType.InitVar:
            if (semantic(ast.varData.value, $vars).r != ast.varData.type) {
                message("ERR012");
                return { r: "", var: $vars };
            }
            $vars[ast.varData.name] = ast.varData.type;
            return { r: "", var: $vars };
        case NodeType.Number:
            return { r: "number", var: $vars };
        case NodeType.String:
            return { r: "string", var: $vars };
        case NodeType.FunctionCaller:
            if (ast.callFunctionName in modules) {
                if (modules[ast.callFunctionName].args) {
                    let args: string[] = modules[ast.callFunctionName].args;
                    let inputArgs = ast.args.map((val) => semantic(val, $vars).r, $vars);
                    if (args.length == inputArgs.length) {
                        if (args.filter((val, ind) => val != inputArgs[ind] && val != "any").length == 0) {
                            return {
                                r: modules[ast.callFunctionName].return,
                                var: $vars,
                            };
                        } else {
                            message("ERR012");
                            return { r: "", var: $vars };
                        }
                    } else {
                        message("ERR012");
                        return { r: "", var: $vars };
                    }
                } else {
                    for (let i in modules[ast.callFunctionName]) {
                        let args: string[] = modules[ast.callFunctionName][i].args;
                        let inputArgs = ast.args.map((val) => semantic(val, $vars).r, $vars);
                        if (args.length == inputArgs.length) {
                            if (args.filter((val, ind) => val != inputArgs[ind] && val != "any").length == 0) {
                                return {
                                    r: modules[ast.callFunctionName][i].return,
                                    var: $vars,
                                };
                            }
                        }
                    }
                    message("ERR012");
                    return { r: "", var: $vars };
                }
            } else {
                message("ERR013");
                return { r: "", var: $vars };
            }
    }
}

export { semantic };
