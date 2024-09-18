import * as fs from "fs";
import { Configuration, OpenAIApi } from "openai";
import * as path from "path";
import { FileInfo } from "../utils/scanFiles";
import { PathRoute } from "@vorlefan/path";

export class InputTransformer {
  private openai: OpenAIApi;
  protected outputFilename: string = "input-forms.tsx";
  protected model: string = "gpt-4o-mini";
  protected delayBetweenCalls: number = 1000; // default to 1 second
  protected route: PathRoute = new PathRoute();

  constructor({
    apiKey,
    outputFilename,
    model = "gpt-4o-mini",
    delayBetweenCalls = 1000, // delay in milliseconds
  }: {
    apiKey: string;
    outputFilename?: string;
    model?: string;
    delayBetweenCalls?: number;
  }) {
    if (!apiKey) {
      throw new Error("OpenAI API key is required.");
    }
    if (outputFilename) {
      this.outputFilename = outputFilename;
    }
    if (model) {
      this.model = model;
    }
    if (delayBetweenCalls !== undefined) {
      this.delayBetweenCalls = delayBetweenCalls;
    }

    const configuration = new Configuration({ apiKey });
    this.openai = new OpenAIApi(configuration);
  }

  public async generate(nestjsDir: string, outputDir: string) {
    this.route.add("root", nestjsDir);
    const rootRoute = this.route.get("root");
    if (!rootRoute?.routePath) {
      throw new Error("Error in finding the nestjs dir");
    }
    const files = await this.route.allFilepaths(rootRoute.routePath);

    const inputFiles = files.filter(
      (d) => !d.includes("node_modules\\") && !d.includes("dist\\")
    );

    if (inputFiles.length === 0) {
      throw new Error("No input files found");
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let enumsContent: string = "";
    let combinedContent = "import { z } from 'zod'";
    combinedContent += "\n\n";
    console.log("[InputTransformer]", "total to generate", inputFiles);

    for (const filepath of inputFiles) {
      const content = await this.route.stream().read(filepath); // fs.readFileSync(filepath, "utf-8");
      if (!content) {
        continue;
      }

      const isInputType = content.includes("@InputType");
      if (!isInputType) {
        continue;
      }

      const className = this.extractClassName(content);

      if (className) {
        console.log("[InputTransformer]", filepath, className);
        const schema = await this.generateZodSchema(
          content,
          className,
          enumsContent
        );
        combinedContent += schema + "\n\n";

        // Wait between API calls to avoid rate limits
        await this.sleep(this.delayBetweenCalls);
      }
    }

    await this.route
      .io()
      .write(
        path.join(outputDir, this.outputFilename),
        enumsContent + "\n" + combinedContent,
        true
      );
  }

  public async transformInputs(
    inputs: Map<string, FileInfo>,
    outputDir: string
  ): Promise<void> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let enumsContent = "";
    let combinedContent = "";
    console.log("[InputTransformer]", "total to generate", inputs.size);

    for (const [filepath, fileInfo] of inputs) {
      const content = fs.readFileSync(filepath, "utf-8");
      const className = this.extractClassName(content);

      if (className) {
        console.log("[InputTransformer]", filepath, className);
        const schema = await this.generateZodSchema(
          content,
          className,
          enumsContent
        );
        combinedContent += schema + "\n\n";

        // Wait between API calls to avoid rate limits
        await this.sleep(this.delayBetweenCalls);
      }
    }

    fs.writeFileSync(
      path.join(outputDir, this.outputFilename),
      enumsContent + "\n" + combinedContent,
      "utf-8"
    );
  }

  private extractClassName(content: string): string | null {
    const match = content.match(/export\s+class\s+(\w+)/);
    return match ? match[1] : null;
  }

  private async generateZodSchema(
    content: string,
    className: string,
    enumsContent: string,
    retryCount = 0
  ): Promise<string> {
    const prompt = `
Convert the following TypeScript InputType class into an equivalent Zod schema. Return only the TypeScript code for the schema without any explanations, comments, or markdown formatting.

If the schema uses any enums, include them in an import statement at the beginning, importing from 'src/graphql/generated/graphql' as:

import { Enum1, Enum2 } from 'src/graphql/generated/graphql';

TypeScript Class:
${content}

Provide the Zod schema in the following format:

export const ${className}Schema = z.object({ /* fields */ });
export type ${className}SchemaContext = z.infer<typeof ${className}Schema>;
`;

    try {
      const response = await this.openai.createChatCompletion({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      });

      let assistantMessage = response.data.choices[0].message?.content;

      // Remove code fences if any
      let code =
        assistantMessage
          ?.replace(/^```typescript\s*/, "")
          .replace(/^```\s*/, "")
          .replace(/```$/, "")
          .trim() || "";

      // Extract enums used in the schema
      const enumRegex = /z\.nativeEnum\((\w+)\)/g;
      const enumsUsed = new Set<string>();
      let match;
      while ((match = enumRegex.exec(code)) !== null) {
        enumsUsed.add(match[1]);
      }

      if (enumsUsed.size > 0) {
        const importStatement = `import { ${Array.from(enumsUsed).join(
          ", "
        )} } from 'src/graphql/generated/graphql';\n`;
        enumsContent += importStatement;
        // code = importStatement + code;
      }

      return code;
    } catch (error: any) {
      const status = error.response?.status;
      const errorMessage =
        error.response?.data?.error?.message || error.message;

      if (status === 429 && retryCount < 5) {
        // Rate limit exceeded, wait and retry
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.warn(
          `Rate limit exceeded. Waiting ${delay}ms before retrying...`
        );
        await this.sleep(delay);
        return this.generateZodSchema(
          content,
          className,
          enumsContent,
          retryCount + 1
        );
      } else {
        console.error("OpenAI API error:", errorMessage);
        throw error;
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
