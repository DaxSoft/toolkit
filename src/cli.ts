#!/usr/bin/env node
import { Command } from "commander";
import { transformCommand } from "./commands/nestjs-input.command";

const program = new Command();

program
  .name("vorlefan-toolkit")
  .description("A toolkit for Node.js applications");

program.addCommand(transformCommand());

program.parse(process.argv);
