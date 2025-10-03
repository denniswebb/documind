# CLI System

The core of DocuMind is its powerful Command Line Interface (CLI) system, which is designed to be used within your IDE. The primary command is `/document`.

## Command Structure

The `/document` command can be used in several ways:

1.  **Interactive Mode**: Running `/document` with no arguments initiates an interactive session where DocuMind will guide you based on the state of your documentation.
2.  **Predefined Commands**: Specific commands for common actions, such as:
    *   `bootstrap`: Generate documentation from scratch.
    *   `expand [concept]`: Add detail to a specific concept.
    *   `update [section]`: Refresh an existing section.
    *   `review [scope]`: Audit docs against the implementation and stage follow-up fixes.
    *   `analyze [integration]`: Document an external service.
    *   `index`: Rebuild the navigation.
    *   `search [query]`: Search the documentation.
3.  **Free-Form Requests**: You can provide a natural language request, and DocuMind will interpret your intent and take the appropriate action. For example: `/document explain the auth flow`.

## Processing Logic

When a `/document` command is executed, the system follows these steps:

1.  **Parse Arguments**: The system first determines if the command is interactive, predefined, or a free-form request.
2.  **Interpret Intent**: For free-form requests, the AI analyzes the message to understand the user's goal.
3.  **Confirm Action Plan**: Before making changes, DocuMind presents a clear plan of action.
4.  **Research**: The system may research the codebase or existing documentation to gather context.
5.  **Execute**: The appropriate action is performed, such as creating or updating documentation files.

During a `/document review` run, DocuMind inspects the relevant code, compares its findings with the statements inside `docs/`, and produces a findings report. The review itself does not modify files; instead, it recommends targeted `/document update …` prompts that are restricted to documentation files so you can apply corrections safely.

This system is designed to be a "living documentation" that evolves with your codebase.

[Back to Chapter](./README.md)

*Last Updated: 2025-09-12*
