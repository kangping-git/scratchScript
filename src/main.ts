#! /usr/bin/env node
import * as path from "path";
import * as fs from "fs";
import { alreadyError, lang, message } from "./util";
import * as lexer from "./lexer";
import * as parser from "./parser";
import * as semantic from "./semantic";

// MEMO:引数がないときに出力するテキスト
let CLI = {
    en: `Usage: scl <command> [options]

Commands:
    compile <input-file>.ss [-o <output-file>.sb3]  Compile a ScratchScript file and output a Scratch project.
    create <project-name>                           Create a new ScratchScript project.

Options:
    -h, --help     Show help
    -v, --version  Show version number

Examples:
    scl compile myscript.ss -o output.sb3
    scl create my-project`,
    ja: `使用方法: scl <コマンド> [オプション]

コマンド:
    compile <input-file>.ss [-o <output-file>.sb3]  ScratchScriptファイルをコンパイルしてScratchプロジェクトを出力します。
    create <project-name>                           新しいScratchScriptプロジェクトを作成します。

オプション:
    -h, --help     ヘルプを表示する
    -v, --version  バージョン番号を表示する

例:
    scl compile myscript.ss -o output.sb3
    scl create my-project`,
};

// MEMO:コマンド解析
function main(args: string[]) {
    if (args.length == 0) {
        console.log(CLI[lang]);
        return;
    }
    if (args.length == 1) {
        switch (args[0]) {
            case "-v":
            case "--version":
                console.log(
                    "ScratchScript Compiler " +
                        fs.readFileSync(
                            path.join(__dirname, "../resources/version.txt"),
                            "utf-8"
                        )
                );
                return;
            case "-h":
            case "--help":
                console.log(CLI[lang]);
                return;
        }
    } else {
        switch (args[0]) {
            case "compile":
                let inputFile: string = args[1];
                let outputFile: string;
                if (args.length > 3) {
                    if (args[2] !== "-o") {
                        message("ERR007");
                        return;
                    }
                    outputFile = args[3];
                } else {
                    outputFile =
                        inputFile.split(".").slice(0, -1).join(".") + ".sb3";
                }
                if (!fs.existsSync(inputFile)) {
                    message("ERR007");
                    return;
                }
                if (!fs.statSync(inputFile).isFile()) {
                    message("ERR007");
                    return;
                }
                if (args.includes("--debug")) {
                    process.stdout.write("\x1bc");
                }
                let code = fs.readFileSync(inputFile, "utf-8");
                let tokens = lexer.lexer(code);
                if (!alreadyError) {
                    let ast = parser.parser(tokens, code);
                    if (!alreadyError) {
                        let astTemp: parser.ASTNode[] = [];
                        let variable = {};
                        for (let i in ast) {
                            let a = semantic.semantic(ast[i], variable);
                            if (a.r == null) {
                                astTemp.push(ast[i]);
                            }
                            variable = a.var;
                        }
                    }
                }
                return;
            case "create":
                fs.mkdirSync(
                    path.join(process.cwd(), args[1], "./src/library/"),
                    {
                        recursive: true,
                    }
                );
                fs.mkdirSync(
                    path.join(process.cwd(), args[1], "./assets/images/"),
                    {
                        recursive: true,
                    }
                );
                fs.mkdirSync(
                    path.join(process.cwd(), args[1], "./assets/sounds/"),
                    {
                        recursive: true,
                    }
                );
                fs.writeFileSync(
                    path.join(process.cwd(), args[1], "./src/main.ss"),
                    `whenSpriteClicked("Sprite1", () => {
    let name: string = getSpriteName();
    say("Hello, " + name + "!");
});`
                );
                return;
        }
    }
    message("ERR007");
}

main(process.argv.slice(2));
