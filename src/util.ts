import * as fs from "fs";
import * as path from "path";

interface LanguageMessages {
    [keys: string]: string;
}

interface ErrorMessagesJson {
    ja: LanguageMessages;
    en: LanguageMessages;
}

let errorMessagesData: ErrorMessagesJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../resources/messages.json"), "utf-8")
);

let lang: "ja" | "en" =
    Intl.NumberFormat().resolvedOptions().locale.split("-")[0] == "ja"
        ? "ja"
        : "en";
let alreadyError: boolean = false;

function message(
    id: string,
    rps: { [keys: string]: string } = {},
    ...args: any[]
) {
    let m = "";
    if (args.length > 0) {
        let code: string[] = args[0];
        let line = Number(args[1]);
        let char = Number(args[2]);
        let len = Number(args[3]);
        m = line + 1 + "| " + code[line] + "\n";
        m += " ".repeat((line + 1 + "| ").length + char) + "~".repeat(len);
    }
    if (id in errorMessagesData[lang]) {
        let MSG = errorMessagesData[lang][id];
        for (let i in rps) {
            MSG = MSG.replace(new RegExp(i, "g"), rps[i]);
        }
        if (id.slice(0, 3) == "ERR") {
            console.error(id + ":" + MSG);
            if (m) {
                console.error(m);
            }
            alreadyError = true;
        } else {
            console.warn(id + ":" + MSG);
            if (m) {
                console.warn(m);
            }
        }
        console.log();
    } else {
        message("ERR006");
    }
}

export { message, lang, alreadyError };
