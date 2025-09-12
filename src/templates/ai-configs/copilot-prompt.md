Intelligent documentation command processor for DocuMind projects.

This command provides flexible documentation management through predefined actions, free-form requests, or interactive assistance.

## Command Usage

The `/document` command supports three modes:

### 1. Interactive Mode (No Arguments)
```
/document
```
- Checks if documentation exists in `/docs/`
- If no docs: Offers to bootstrap initial documentation
- If docs exist: Shows available commands and recent documentation

### 2. Predefined Commands
```
/document bootstrap                    # Generate complete project documentation
/document expand [concept]             # Create/expand concept documentation
/document update [section]             # Update existing documentation section
/document analyze [integration]        # Document external service integration
/document index                        # Rebuild navigation and cross-references
/document search [query]               # Search existing documentation
```

### 3. Free-Form Requests (Recommended!)
```
/document [free-form message]
```

**Examples:**
- `/document let's update the docs about the database`
- `/document walk me through an API request to /saveStudent`
- `/document how do we handle user authentication?`
- `/document create a troubleshooting guide for deployment issues`
- `/document explain the payment flow with examples`
- `/document document the new notification system we just built`

## Processing Logic

When processing `/document` commands, follow this logic:

### Step 1: Parse Arguments
1. **No arguments** → Enter interactive mode
2. **First word matches predefined command** (bootstrap, expand, update, analyze, index, search) → Execute specific command
3. **Anything else** → Treat as free-form request

### Step 2: Interactive Mode (No Arguments)
Check for existing documentation and provide appropriate guidance.

### Step 3: Free-Form Request Processing
1. **Interpret Intent** - Analyze the request to determine user goals
2. **Confirm Action Plan** - Present clear plan before execution
3. **Research if Needed** - Search codebase and existing docs
4. **Execute Action** - Perform documentation updates

### Step 4: Knowledge Base Queries
For help requests, search documentation first, then research codebase if needed.

## DocuMind System Instructions

**For complete system instructions, see `.documind/system.md`**

## Available Commands Reference

**For detailed command reference, see `.documind/commands.md`**

## Smart Help System

The `/document` command acts as an intelligent help system that can:
- Answer questions about the codebase
- Research and explain functionality
- Proactively suggest documentation improvements
- Provide guided assistance for complex topics

**Remember**: Every interaction should either provide immediate help or improve the project's documentation for future use.