import * as fs from "fs";
import * as path from "path";

export function isNestProject(projectPath: string): boolean {
  const packageJsonPath = path.join(projectPath, "package.json");
  if (!fs.existsSync(packageJsonPath)) return false;

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  return Object.keys(dependencies).includes("@nestjs/core");
}
