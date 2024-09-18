import { InputTransformer } from "./../../src/nestjs/inputTransformer";
import * as fs from "fs";
import * as path from "path";
import { FileInfo } from "../../src/utils/scanFiles";
import { OpenAIApi } from "openai";
import { OPENAI_KEY } from "../const";

jest.mock("openai");

describe("InputTransformer", () => {
  const outputDir = path.join(__dirname, "output");
  const mockApiKey = OPENAI_KEY;

  const mockInputFiles = new Map<string, FileInfo>();

  beforeAll(() => {
    // Create mock input files
    const inputContent = `
      import { InputType, Field, Int } from '@nestjs/graphql';

      @InputType()
      export class CreateUserInput {
        @Field()
        name: string;

        @Field({ nullable: true })
        email?: string;

        @Field(() => Int)
        age: number;
      }
    `;

    const filePath = path.join(__dirname, "CreateUserInput.input.ts");
    fs.writeFileSync(filePath, inputContent);

    mockInputFiles.set(filePath, {
      filename: "CreateUserInput.input.ts",
      filepath: filePath,
      type: "input",
    });
  });

  afterAll(() => {
    // Clean up
    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.rmSync(path.join(__dirname, "CreateUserInput.input.ts"));
  });

  test("should transform input files into Zod schemas using createChatCompletion", async () => {
    // Mock the OpenAI API response
    const mockOpenAIResponse = {
      data: {
        choices: [
          {
            message: {
              content: `
export const CreateUserInputSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  age: z.number(),
});

export type CreateUserInputSchemaContext = z.infer<typeof CreateUserInputSchema>;
              `,
            },
          },
        ],
      },
    };

    (OpenAIApi.prototype.createChatCompletion as jest.Mock).mockResolvedValue(
      mockOpenAIResponse
    );

    const transformer = new InputTransformer({ apiKey: mockApiKey });

    await transformer.transformInputs(mockInputFiles, outputDir);

    // Check that the output file exists
    const outputFile = path.join(outputDir, "input-forms.tsx");
    expect(fs.existsSync(outputFile)).toBe(true);

    // Read and check the content
    const outputContent = fs.readFileSync(outputFile, "utf-8");
    expect(outputContent).toContain(
      "export const CreateUserInputSchema = z.object"
    );
    expect(outputContent).toContain(
      "export type CreateUserInputSchemaContext = z.infer<typeof CreateUserInputSchema>;"
    );
  });
});
