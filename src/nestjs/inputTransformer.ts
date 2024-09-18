import * as fs from "fs";
import { Configuration, OpenAIApi } from "openai";
import * as path from "path";
import { FileInfo } from "../utils/scanFiles";

export class InputTransformer {
  private openai: OpenAIApi;
  protected outputFilename: string = "input-forms.tsx";
  protected model: string = "gpt-4o";

  constructor({
    apiKey,
    outputFilename,
    model = "gpt-4o",
  }: {
    apiKey: string;
    outputFilename?: string;
    model?: string;
  }) {
    if (outputFilename) {
      this.outputFilename = outputFilename;
    }
    if (model) {
      this.model = model;
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
      }
    }

    fs.writeFileSync(
      path.join(outputDir, "input-forms.tsx"),
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
    className: string
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
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      });

      const assistantMessage = response.data.choices[0].message?.content;
      return assistantMessage || "";
    } catch (error: any) {
      console.error("OpenAI API error:", error.response?.data || error.message);
      throw error;
    }
  }
}
