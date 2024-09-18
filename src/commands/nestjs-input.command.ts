import { Command } from "commander";
import { isNestProject } from "../utils/isNestProject";
import { scanFiles } from "../utils/scanFiles";
import { InputTransformer } from "../nestjs/inputTransformer";

export function transformCommand() {
  const command = new Command("transform");

  command
    .description("Transform InputType classes into Zod schemas")
    .requiredOption("-p, --project <path>", "Path to the NestJS project")
    .requiredOption("-o, --output <path>", "Output directory for schemas")
    .requiredOption("-k, --apikey <key>", "OpenAI API Key")
    .action(async (opts) => {
      const { project, output, apikey } = opts;

      if (!isNestProject(project)) {
        console.error("The specified directory is not a NestJS project.");
        process.exit(1);
      }

      const filesMap = scanFiles(project);
      const inputFiles = new Map(
        Array.from(filesMap).filter(([, info]) => info.type === "input")
      );

      const transformer = new InputTransformer(apikey);
      await transformer.transformInputs(inputFiles, output);

      console.log("Transformation complete.");
    });

  return command;
}
