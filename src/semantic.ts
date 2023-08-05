import { ASTNode, NodeType } from "./parser";
import fs from "fs";
import path from "path";

const modules = fs.readFileSync(
    path.join(__dirname, "../resources/module/blocks.json")
);

function semantic(ast: ASTNode) {}

export { semantic };
