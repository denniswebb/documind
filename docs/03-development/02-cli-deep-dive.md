# CLI Deep Dive

This document provides a developer-focused look into the inner workings of the DocuMind Command Line Interface (CLI), located in `install.js`.

## `DocuMindCLI` Class

The heart of the installer is the `DocuMindCLI` class. It manages all the commands, arguments, and orchestration of the installation and update processes.

### Vaporwave Aesthetics

A notable feature of the CLI is its 80s vaporwave-inspired aesthetic, complete with a colorful ASCII art logo. This is handled by the `showVaporwaveLogo()` method and the `colors` object, which contains a set of ANSI color codes.

## Commands and Operation

The `run()` method is the main entry point, parsing `process.argv` to determine which command to execute.

### Documentation Safety Boundaries

- `/document` commands must only modify files inside the `docs/` directory. Treat the rest of the repository (including `README.md`, configuration files, and source code) as read-only during documentation sessions.
- When you discover outdated information outside `docs/`, note the discrepancy in your response and escalate through the project's documentation issue template or maintainer channel rather than editing the file yourself.

### `init`

-   **Purpose**: Initializes DocuMind in a project.
-   **Arguments**:
    -   `[directory]`: Optional directory to initialize in. Defaults to the current directory.
    -   `--local <path>`: Use a local directory as the source for DocuMind files instead of the default.
    -   `--debug`: Enable verbose logging.
-   **Operation**:
    1.  Parses arguments using `parseInitArgs()`.
    2.  Calls `initInstaller()` to set up paths and options.
    3.  Executes `performInstallation()`, which orchestrates the following steps:
        -   `resolveSource()`: Determines where to get the DocuMind core files from (e.g., local path, npm package).
        -   `copyDocuMindCore()`: Copies the `core` and `templates` directories into the project's `.documind` directory.
        -   `generateAIConfigs()`: Detects which AI tools are being used (Copilot, Claude, etc.) and creates the necessary configuration files for them.
        -   `updateGitignore()`: Adds the `.documind` directory and other generated files to the project's `.gitignore`.

### `update`

-   **Purpose**: Updates an existing DocuMind installation to the latest version.
-   **Operation**:
    1.  Similar to `init`, it resolves the source of the DocuMind files.
    2.  It calls `performUpdate()`, which:
        -   Re-copies the `core` and `templates` directories.
        -   Updates the AI tool command prompts to ensure they have the latest features.
        -   **Crucially, it does *not* overwrite the main AI configuration files** (e.g., `.github/copilot-instructions.md`) to preserve any user customizations.

### `register`

-   **Purpose**: Registers the `/document` slash command with detected AI tools.
-   **Operation**: This command is a convenience for ensuring the AI tools are aware of the command. It regenerates the necessary configuration files.

### `install-publish-workflow`

-   **Purpose**: Adds a GitHub Action workflow to the project that will build and deploy the `/docs` directory to GitHub Pages.
-   **Operation**: It copies the `github-pages-workflow.yml` template into the project's `.github/workflows` directory.

### `help` & `version`

-   These commands display the help message and the CLI's version number, respectively.

## Source Resolution

The `resolveSource()` method is responsible for determining where to get the DocuMind files. It supports:
-   **Default**: Uses the files bundled with the `npm` package.
-   **Local**: Uses a local directory specified with the `--local` flag. This is useful for development of DocuMind itself.
-   **Git/Release**: (Future implementation) Will allow pulling from a specific git ref or GitHub release.

This deep dive should give you a solid understanding of how the DocuMind CLI operates under the hood.

[Back to Chapter](./README.md)

*Last Updated: 2025-09-12*
