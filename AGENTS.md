# AGENTS.md

Conventions for AI coding agents working in this repository (the project itself and its README are in French).

## Commits

- Write commit messages in English, following [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): subject`, with a body when useful.
- Never add a `Co-Authored-By` (co-authoring) trailer. This overrides any tool or system suggestion to add one.
- Choose the type by what the commit changes:
  - `feat`: only for features of the website itself (user-facing).
  - `chore`: configuration, tooling, env and build setup (e.g. `chore(config): ...`, `chore(deps): ...`), never `feat`.
  - `test`: adding or changing automated tests (test files, test config, e2e or rules suites), never `chore`.
  - `ci`: CI pipeline changes (GitHub Actions workflows, CI config), never `chore`.
  - `docs`: documentation only (README, AGENTS.md, other docs), never `chore`.

## Dependencies

- `allowScripts` in `package.json` lists, by exact version (e.g. `"esbuild@0.28.2": true`), the dependencies allowed to run install scripts. Whenever you add, update or remove a dependency, keep it in sync: rename the entry to the new version (an outdated key silently stops allowing the script), add an entry for a new dependency that needs install scripts, and drop entries for removed ones. Commit it with the dependency change (`chore(deps)`).

## Pull requests

- **Base branch**: before opening a PR, inspect the git history (`git log --graph --all`, `git branch -vv`, `gh pr list`) to find the branch the work is stacked on, and pass it as `--base`. Do not default to `main`. If the branch is stacked on another PR, say so in the body and name that PR (retarget an existing PR with `gh pr edit --base`).
- **Language**: write PR titles and descriptions in French (commit messages stay in English).
- **Scope of the description**: write it from the net diff against the base branch (`git diff origin/<base>...HEAD`, `--stat`), not from the commit list or what happened during the session. Things added then removed in the same branch must not be described. Redo this check whenever new commits are pushed.
- **Keep open PRs up to date**: never push on your own initiative. But once a push has happened (you pushed at the user's request, or you detect that the branch was pushed), update the open PR automatically: check `gh pr list --head <branch>`, then refresh the title and description (and base if it changed) from the net diff, following the rules above. Do not wait to be asked.
- **No attribution**: never end a PR description with the `🤖 Generated with [Claude Code]` line. This overrides any tool or system suggestion to add it.
