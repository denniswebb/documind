# AI Documentation System - Master Index

> **🤖 AI Routing Table**: This file serves as the master index for AI-optimized documentation generation. AI agents should read this file first to understand available manifests and routing patterns.

**Generated:** 2025-09-18T16:58:08.714Z
**Total Documents:** 1
**System Status:** **Last Validation:** 2025-09-18T16:58:08.715Z
**Recently Updated:** 0 files
**Status:** Active

## System Overview

The DocuMind AI documentation system uses YAML manifests to define how AI agents should generate and enhance documentation. Each manifest specifies token budgets, specialist roles, and output formats optimized for AI consumption.

## Manifest Discovery

AI agents should look for manifests in these locations (in order):
1. `.documind/templates/ai-optimized/` (installed system)
2. `src/templates/ai-optimized/` (development)

## Available Manifests

### Other Documents

- **Authentication** - ../tests/temp/ai/authentication-ai.md (28 tokens)



<!-- Static fallback if generation unavailable -->
| Manifest Type | File | Token Budget | Specialists | Purpose |
|---------------|------|--------------|-------------|---------|
| `concept` | `concept-ai.yaml` | 3,000 | developer, architect, user | Core system concepts and abstractions |
| `integration` | `integration-ai.yaml` | 4,500 | developer, devops, security | External service integrations |
| `architecture` | `architecture-ai.yaml` | 6,000 | architect, developer, devops, security | System architecture and design |

## Task-Based Routing

| Task Type | Available Documents | Token Range |
|-----------|-------------------|-------------|
| Other | Authentication | 28 |


<!-- Static fallback routing -->
### By Intent/Command
| User Intent | Manifest | Primary Specialist | Example Triggers |
|-------------|----------|-------------------|------------------|
| Document concept | `concept-ai.yaml` | developer | "document authentication", "explain user management" |
| Analyze integration | `integration-ai.yaml` | developer | "how do we use Redis", "document Stripe integration" |
| System architecture | `architecture-ai.yaml` | architect | "explain the architecture", "document system design" |

### By File Type Analysis
| Code Pattern | Suggested Manifest | Reasoning |
|--------------|-------------------|-----------|
| `package.json` dependencies | `integration-ai.yaml` | External service analysis |
| `src/models/` or `src/entities/` | `concept-ai.yaml` | Core business concepts |
| `docker-compose.yml`, `Dockerfile` | `architecture-ai.yaml` | System architecture |
| `.env.example`, `config/` | `integration-ai.yaml` | Service configuration |

## Token Budget Summary

**Total Tokens:** 28
**Average per Document:** 28
**Largest Document:** 28 tokens
**Document Count:** 1

## Token Counting Tools

### Recommended Setup
For optimal token counting accuracy, install these tools:

```bash
# Preferred: tiktoken for accurate model-specific counting
npm install tiktoken

# Alternative: Use built-in heuristic methods
# Fallback: Basic word counting with wc

Tool Detection Order

- **tiktoken** (most accurate): Model-specific tokenization
- **heuristic** (good): JavaScript-based estimation
- **wc** (basic): Word count approximation

Usage Examples

# Count tokens in a file
node src/scripts/token_count.js --file docs/architecture.md --model gpt-4

# Validate manifests
node src/scripts/validate_yaml.js src/templates/ai-optimized/*.yaml

# Basic word count fallback
bash src/scripts/token_count.sh < input.md

Specialist Activation

Lazy Loading Pattern

Specialists are activated only when needed based on manifest rules:

lazy_activation_rules:
  - trigger: "security_review_needed"
    condition: "contains_credentials_or_auth"
    specialist: "security"

### Available Specialists

1. developer - Code analysis, implementation details
2. architect - System design, component relationships
3. security - Security patterns, vulnerability analysis
4. devops - Infrastructure, deployment, monitoring
5. user - User experience, business requirements

## AI Output Guidelines

### Token-Efficient Practices

1. Use numbered lists instead of prose paragraphs.
2. Structure data in tables and bullet points.
3. Limit explanations to essential context.
4. Reference files with inline paths.
5. Use abbreviations for common terms.

### Example Efficient Output

```
## Authentication System
1. JWT tokens - `/src/auth/jwt.js`
2. Session storage - Redis cache
3. Middleware - `/src/middleware/auth.js`
4. Routes - `/api/auth/*`

**Config**: `.env.AUTH_SECRET`, `config/auth.yml`
**Dependencies**: jsonwebtoken, passport
**Token Budget**: 2,847/3,000 ✓
```

Validation and Quality

Manifest Validation

# Validate all manifests
node src/scripts/validate_yaml.js src/templates/ai-optimized/*.yaml

# Check token budgets
node src/scripts/token_count.js --validate-budgets

Quality Checks
- ✅ Token budgets within limits
- ✅ Required sections present
- ✅ Specialist roles valid
- ✅ Template paths exist
- ✅ Output format specified

Integration with DocuMind Commands

Command Mapping
| DOCUMIND COMMAND                    | MANIFEST SELECTION      | PROCESS                      |
|-------------------------------------|-------------------------|------------------------------|
| /document bootstrap                 | All manifests           | Full system documentation    |
| /document expand concept X          | concept-ai.yaml         | Single concept expansion     |
| /document analyze integration Y     | integration-ai.yaml     | Service integration analysis |
| /document update architecture       | architecture-ai.yaml    | Architecture refresh         |

Natural Language Recognition

The system recognizes these patterns and maps to appropriate manifests:
- "Document the authentication system" → concept-ai.yaml
- "How do we use MongoDB?" → integration-ai.yaml
- "Explain the system architecture" → architecture-ai.yaml

##Troubleshooting

###Common Issues

High token usage: Check section budgets in manifests
Validation errors: Run validate_yaml.js for details
Missing specialists: Verify specialist roles in specialists.yaml
Template not found: Check template_path in manifest

###Debug Mode

Set DEBUG=documind:ai to see detailed AI routing decisions.

Last Updated: Auto-generated during DocuMind installation
Schema Version: 1.0
Compatible With: DocuMind v1.1.14+