#!/usr/bin/env node
import { Command } from "commander";
import { nestjsInputCommand } from "./commands/nestjs-input.command";

const program = new Command();

program
  .name("vorlefan-toolkit")
  .description("A toolkit for Node.js applications");

program.addCommand(nestjsInputCommand());

program.parse(process.argv);
