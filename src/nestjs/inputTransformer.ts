import * as fs from "fs";
import { Configuration, OpenAIApi } from "openai";
import * as path from "path";
import { FileInfo } from "../utils/scanFiles";

export class InputTransformer {
  private openai: OpenAIApi;
  protected outputFilename: string = "input-forms.tsx";
  protected model: string = "gpt-4o-mini";
  protected delayBetweenCalls: number = 1000; // default to 1 second

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

  public async transformInputs(
    inputs: Map<string, FileInfo>,
    outputDir: string
  ): Promise<void> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let combinedContent = "";

    for (const [filepath, fileInfo] of inputs) {
      const content = fs.readFileSync(filepath, "utf-8");
      const className = this.extractClassName(content);

      if (className) {
        const schema = await this.generateZodSchema(content, className);
        combinedContent += schema + "\n\n";

        // Wait between API calls to avoid rate limits
        await this.sleep(this.delayBetweenCalls);
      }
    }

    fs.writeFileSync(
      path.join(outputDir, this.outputFilename),
      combinedContent,
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
    retryCount = 0
  ): Promise<string> {
    const prompt = `
Convert the following TypeScript InputType class into a Zod schema.

TypeScript Class:
\`\`\`typescript
${content}
\`\`\`

Zod Schema should be in the format:

export const ${className}Schema = z.object({ /* fields */ });
export type ${className}SchemaContext = z.infer<typeof ${className}Schema>;
`;

    try {
      const response = await this.openai.createChatCompletion({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      });

      const assistantMessage = response.data.choices[0].message?.content;
      return assistantMessage || "";
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
        return this.generateZodSchema(content, className, retryCount + 1);
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
