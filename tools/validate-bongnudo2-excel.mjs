import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { readBongnudo2Excel } from "./bongnudo2-excel-data.mjs";

const workbookPath = resolve(
  process.argv[2] ?? "data/봉누도2_데이터.xlsx",
);

if (!existsSync(workbookPath)) {
  throw new Error(`Excel 파일을 찾지 못함: ${workbookPath}`);
}

const data = await readBongnudo2Excel(workbookPath);
console.log(JSON.stringify(data.summary, null, 2));