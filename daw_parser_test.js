// daw_parser_test.js

import fs from "fs";
import peg from "pegjs";

// PEG.js grammar を読み込む
const grammar = fs.readFileSync("./daw_language_grammar.pegjs", "utf8");
const parser = peg.generate(grammar);

// テスト用 .daw ファイルを読み込む
const input = fs.readFileSync("./example.daw", "utf8");

try {
  const result = parser.parse(input);
  console.log("✅ パース成功！JSON 出力:");
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.error("❌ パース失敗:", e.message);
  process.exit(1);
}
