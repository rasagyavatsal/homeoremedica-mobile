## Commit Messages

Follow Conventional Commits v1.0.0.

- Use `<type>[optional scope]: <description>` as the first line.
- Use `fix:` for bug fixes; it maps to a patch release.
- Use `feat:` for new features; it maps to a minor release.
- Mark breaking changes with `!` after the type/scope or a `BREAKING CHANGE:` footer; it maps to a major release.
- Use lowercase types such as `docs:`, `test:`, `refactor:`, `perf:`, `build:`, `ci:`, and `chore:` when they fit the change.
- Keep the description imperative, concise, and specific.
- Use Conventional Commits for PR titles so squash merges preserve release metadata.

## PR Messages

Keep PR messages limited to a short summary of the change.

- Include only the essential summary needed to explain what changed.
- Do not add detailed implementation notes, exhaustive change lists, validation steps or unnecessary boilerplate unless explicitly requested.

## Validation

After every task completion where code is changed, run the relevant validation scripts and fix all errors before finishing.

Run these root scripts:
- `typecheck`
- `test`

Run the scripts only on a connected device, no emulators. If there is no connected device, mention it in the output message.

## Test-Driven Development

Use TDD for functional changes where behavior can be specified with automated tests.

- Start with Red: write one focused failing test for the new behavior or bug fix before implementing it.
- Move to Green: add the simplest functional code needed to make that test pass.
- Refactor after the test passes: remove duplication, improve structure, and keep all tests green.
- Treat tests as living documentation for expected behavior and as a safety net against regressions.
- Let test-first usage shape simpler, decoupled interfaces, but do not add unnecessary abstractions just to satisfy a test.

## Write Less Code

Reduce clutter by building only what is strictly necessary.

- Reuse existing libraries, APIs, framework helpers, and built-in language features before writing custom solutions; use web search when it helps find those options, and mention when you do.
- Keep implementations DRY: extract shared logic into small reusable helpers or components when duplication appears.
- Prefer clear higher-order functions such as `map`, `filter`, and `reduce` when they make code shorter and easier to read.
- Delete unused code, stale variables, abandoned scripts, and outdated feature paths instead of preserving dead weight.
- Avoid clever one-liners when a small, readable helper communicates the intent better.

## Prefer Deep Modules

Follow the "modules should be deep" principle: a module is its interface plus its implementation, and it earns its place when the implementation it hides is much richer than the interface callers use.

- Optimize for simple interfaces, not tiny implementations. A narrow public surface is valuable when it hides meaningful logic, data structures, sequencing, or operational details.
- Encapsulate validation, state handling, permissions, caching, persistence, retries, concurrency, and edge cases inside the module instead of forcing callers to coordinate them.
- Keep public methods, parameters, and configuration minimal; expose only what callers need to use the capability correctly.
- Avoid shallow wrappers that merely rename one call, mirror another API, or add files and methods without reducing caller knowledge.
- Do not equate deep with large. Small functions can still be useful when their names express domain meaning, create real semantic distance from the implementation, or protect callers from internals.
- Favor stable interfaces that can survive implementation changes; callers should not need to change because internal algorithms, data structures, or storage choices evolve.
- Use the deletion test: if deleting a module only removes indirection, it is probably too shallow; if deleting it spreads complexity across multiple callers, it is likely earning its place.
- Prefer deeper, clearer abstractions over excessive decomposition, but do not hide important domain semantics just to make an API smaller.