import { Command } from "commander";
import { isNestProject } from "../utils/isNestProject";
import { scanFiles } from "../utils/scanFiles";
import { InputTransformer } from "../nestjs/inputTransformer";

export function nestjsInputCommand() {
  const command = new Command("nestjs-input-command");

  command
    .description("Transform InputType classes into Zod schemas")
    .requiredOption("-p, --project <path>", "Path to the NestJS project")
    .requiredOption("-o, --output <path>", "Output directory for schemas")
    .requiredOption("-k, --apikey <key>", "OpenAI API Key")
    .action(async (opts) => {
      const { project, output, apikey } = opts;

      console.log("Starting transformation process...");
      console.log(`Project path: ${project}`);
      console.log(`Output directory: ${output}`);

      if (!isNestProject(project)) {
        console.error("The specified directory is not a NestJS project.");
        process.exit(1);
      }

      console.log("Confirmed NestJS project. Scanning files...");

      const filesMap = scanFiles(project);
      console.log(`Found ${filesMap.size} relevant files.`);

      const inputFiles = new Map(
        Array.from(filesMap).filter(([, info]) => info.type === "input")
      );

      console.log(`Found ${inputFiles.size} input files.`);

      console.log("Initializing InputTransformer...");
      const transformer = new InputTransformer(apikey);

      console.log("Transforming input files...");
      await transformer.transformInputs(inputFiles, output);

      console.log("Transformation complete.");
    });

  return command;
}
