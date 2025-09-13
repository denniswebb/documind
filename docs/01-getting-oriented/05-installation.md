# Installation

DocuMind is a command-line tool that you can run in your project's repository to set up and manage your documentation.

## Quick Install

The easiest way to run DocuMind is by using `npx`, which will download and run the latest version without a global installation.

```bash
npx @documind/core init
```

This command will initialize DocuMind in your current project, creating a `.documind` directory with the core system and templates.

## CLI Commands

Here are the basic commands you can use with the `documind` CLI:

| Command                      | Description                                                 |
| ---------------------------- | ----------------------------------------------------------- |
| `init [directory]`           | Initialize DocuMind in the current or a specified directory. |
| `update`                     | Update your project's DocuMind system to the latest version.  |
| `register [--tool]`          | Register slash commands for your AI tools (e.g., Copilot).    |
| `install-publish-workflow`   | Adds a GitHub Action to publish your docs to GitHub Pages.  |
| `help`                       | Shows the help message with all available commands.         |
| `version`                    | Displays the current version of the DocuMind CLI.           |

## After Installation

Once DocuMind is initialized, you can start using `/document` commands with your AI assistant in your IDE. The best way to start is by bootstrapping your documentation:

**/document bootstrap**

This will scan your entire project and generate a complete set of documentation in the `/docs` directory.

[Back to Chapter](./README.md)

*Last Updated: 2025-09-12*
