# @vorlefan/toolkit

A general-purpose toolkit for Node.js applications, focusing on NestJS projects. This toolkit allows you to scan a NestJS project for `.input` and `.entity` files, transform `InputType` classes into Zod schemas using OpenAI's API, and generate a consolidated `input-forms.tsx` file.

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Usage](#usage)
  - [CLI Usage](#cli-usage)
  - [Programmatic Usage](#programmatic-usage)
- [Configuration](#configuration)
- [Examples](#examples)
  - [CLI Example](#cli-example)
  - [Programmatic Example](#programmatic-example)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install -g @vorlefan/toolkit
```

Or, if you prefer to use it as a dependency in your project:

```bash
npm install @vorlefan/toolkit
```

## Features

- **NestJS Project Detection**: Automatically detects if a directory is a NestJS project.
- **File Scanning**: Scans for `.input` and `.entity` files within the project.
- **OpenAI Integration**: Uses OpenAI's API to transform `InputType` classes into Zod schemas.
- **Schema Generation**: Generates a consolidated `input-forms.tsx` file with all the Zod schemas.
- **CLI and Programmatic Usage**: Can be used as a CLI tool or imported into your Node.js application.

## Usage

### CLI Usage

#### Commands

- **`transform`**: Transforms `InputType` classes into Zod schemas.

#### Options

- `-p, --project <path>`: **(Required)** Path to the NestJS project.
- `-o, --output <path>`: **(Required)** Output directory for the generated schemas.
- `-k, --apikey <key>`: **(Required)** Your OpenAI API key.

#### Help

To see all available commands and options:

```bash
vorlefan-toolkit --help
```

### Programmatic Usage

You can also use the toolkit within your Node.js application by importing the necessary functions and classes.

## Configuration

### Setting Up OpenAI API Key

To use the OpenAI integration, you need an API key. You can obtain one by signing up at [OpenAI](https://beta.openai.com/).

**Security Note**: Never commit your API keys to version control. Consider using environment variables or a configuration file that's excluded from version control.

## Examples

### CLI Example

Transform `InputType` classes into Zod schemas:

```bash
vorlefan-toolkit nestjsInputCommand \
  --project /path/to/nestjs/project \
  --output /desired/output/directory \
  --apikey your_openai_api_key
```

#### Explanation

- **`--project`**: Specifies the path to your NestJS project.
- **`--output`**: The directory where the `input-forms.tsx` file will be generated. If the directory doesn't exist, it will be created.
- **`--apikey`**: Your OpenAI API key.

### Programmatic Example

```typescript
import { isNestProject, scanFiles, InputTransformer } from '@vorlefan/toolkit';

const projectPath = '/path/to/nestjs/project';
const outputDir = '/desired/output/directory';
const apiKey = 'your_openai_api_key';

(async () => {
  if (isNestProject(projectPath)) {
    const filesMap = scanFiles(projectPath);
    const inputFiles = new Map(
      Array.from(filesMap).filter(([, info]) => info.type === 'input')
    );

    const transformer = new InputTransformer(apiKey);
    await transformer.transformInputs(inputFiles, outputDir);

    console.log('Transformation complete.');
  } else {
    console.error('The specified directory is not a NestJS project.');
  }
})();
```

#### Explanation

- **`isNestProject`**: Checks if the specified directory is a NestJS project.
- **`scanFiles`**: Scans the project directory for `.input` and `.entity` files.
- **`InputTransformer`**: Class that handles the transformation of `InputType` classes into Zod schemas.
- **`transformInputs`**: Method that performs the transformation and writes the output to the specified directory.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/my-new-feature`.
3. Commit your changes: `git commit -am 'Add some feature'`.
4. Push to the branch: `git push origin feature/my-new-feature`.
5. Submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*This README was generated to help you understand how to use the `@vorlefan/toolkit` package both via the command line and programmatically in your Node.js applications.*