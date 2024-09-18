import dotenv from "dotenv";
dotenv.config();

export const OPENAI_KEY = process?.env?.OPENAI_KEY as string;
