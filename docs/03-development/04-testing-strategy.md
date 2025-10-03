# Testing Strategy

DocuMind relies on the Node.js test runner (`node --test`) and a focused suite of unit and integration tests to protect the documentation pipeline.

## Test layout

- **Unit tests** live in `tests/unit/` and cover foundational modules such as the CLI, generator, template processor, and AI orchestration scripts.
- **Integration tests** in `tests/integration/` exercise higher-level behaviors, ensuring commands work end-to-end against fixture workspaces.
- Additional directories (`tests/performance/`, if present) can plug into the same runner via dedicated npm scripts.

## npm scripts

The `package.json` scripts expose common combinations:

| Script | Purpose |
| --- | --- |
| `npm test` | Runs all unit tests (`node --test tests/unit/*.test.js`). |
| `npm run test:integration` | Executes integration specs (`node --test tests/integration/*.test.js`). |
| `npm run test:all` | Runs unit tests, then integration tests in sequence. |
| `npm run test:coverage` | Enables coverage instrumentation for every test file. |
| `npm run coverage:report` | Generates coverage, validates thresholds, and invokes `tests/coverage-validation.js`. |
| `npm run test:watch` | Watches unit tests for rapid feedback during development. |

For cross-version assurance, the `test:matrix` script chains Node 16/18/20/21 executions by reusing `test:all` with a `NODE_VERSION` environment variable.

## Coverage validation

`tests/coverage-validation.js` enforces minimum coverage (90% lines/functions/statements, 80% branches) and regenerates reports if they are missing. The validator also verifies dual-purpose generation flows by invoking the coverage suite before evaluating thresholds.

## Local tips

- Run `npm run test:coverage:html` to produce a browsable report in `coverage/` when auditing token-heavy changes.
- If tests intermittently fail, re-run `npm run test:integration` with `DOCUMIND_TEST_CWD` pointed at a clean temp directory to isolate filesystem side effects.
- Prefer adding new tests alongside the module they exercise to keep the unit/integration split intuitive for reviewers.
