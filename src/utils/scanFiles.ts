import * as fs from "fs";
import * as path from "path";

export interface FileInfo {
  filename: string;
  type: "input" | "entity";
  filepath: string;
}

export function scanFiles(projectPath: string): Map<string, FileInfo> {
  const fileMap = new Map<string, FileInfo>();

  function walk(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filepath = path.join(dir, file);
      const stat = fs.statSync(filepath);

      if (stat.isDirectory()) {
        walk(filepath);
      } else if (file.endsWith(".ts")) {
        if (file.includes(".input") || file.includes(".entity")) {
          const type = file.includes(".input") ? "input" : "entity";
          fileMap.set(filepath, {
            filename: file,
            type,
            filepath,
          });
        }
      }
    }
  }

  walk(projectPath);
  return fileMap;
}
