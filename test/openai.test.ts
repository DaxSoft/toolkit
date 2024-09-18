import { Configuration, OpenAIApi } from "openai";
import { OPENAI_KEY } from "./const";

describe("OpenAI API Integration Test", () => {
  let openai: OpenAIApi;

  beforeAll(() => {
    const apiKey = OPENAI_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in environment variables.");
    }

    const configuration = new Configuration({
      apiKey,
    });
    openai = new OpenAIApi(configuration);
  });

  test("should successfully call createChatCompletion and receive a response", async () => {
    try {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello, world!" }],
        max_tokens: 5,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("choices");
      expect(response.data.choices.length).toBeGreaterThan(0);
      expect(response.data.choices[0].message).toHaveProperty("content");
      console.log("OpenAI API response:", response.data);
    } catch (error: any) {
      console.error(
        "Error calling OpenAI API:",
        error.response?.data || error.message
      );
      throw error; // Fail the test if an error occurs
    }
  });
});
