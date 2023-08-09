import { ASTNode, NodeType } from "./parser";
import { message } from "./util";
import fs from "fs";
import path from "path";

const modules = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, "../resources/module/blocks.json"),
        "utf-8"
    )
);

function semantic(ast: ASTNode, $vars: { [keys: string]: string } = {}) {
    switch (ast.type) {
        case NodeType.ArrowFunction:
            return "function";
        case NodeType.GetVar:
            return $vars[ast.varName];
        case NodeType.InitVar:
            if (semantic(ast.varData.value) != ast.varData.type) {
                message("ERR012");
                return "";
            }
            $vars[ast.varData.name] = ast.varData.type;
            return "";
        case NodeType.Number:
            return "number";
        case NodeType.String:
            return "string";
        case NodeType.FunctionCaller:
            if (ast.callFunctionName in modules) {
                let args: string[] = modules[ast.callFunctionName].args;
                let inputArgs = ast.args.map((val) => semantic(val));
                if (args.length == inputArgs.length) {
                    if (
                        args.filter(
                            (val, ind) => val != inputArgs[ind] && val != "any"
                        ).length == 0
                    ) {
                        return modules[ast.callFunctionName].return;
                    } else {
                        message("ERR012");
                        return "";
                    }
                } else {
                    message("ERR012");
                    return "";
                }
            } else {
                message("ERR013");
                return "";
            }
    }
}

export { semantic };
