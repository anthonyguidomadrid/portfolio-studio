# Agent Orchestration Workflow

The **coordinator** is the planning orchestrator, not an implementation agent or an autonomous GitHub bot. It reads the repository, returns issue-ready work, and delegates bounded implementation/review tasks when asked. A human creates issues, branches, and PRs and approves every merge/deployment.

## 1. Turn a request into issues

1. Open Copilot Chat and select **coordinator** from the agent picker. If mentions are supported, use `@coordinator`.
2. Describe the outcome, constraints, known CMS/API decisions, and ask it to inspect the current repo and return issue-ready tasks with owner, files, dependencies, acceptance criteria, verification, and handoff evidence.
3. The coordinator checks the worktree, `.github/copilot-instructions.md`, `docs/architecture.md`, `docs/backlog.md`, package scripts, and relevant implementation before planning. It identifies existing behavior so an issue does not duplicate completed work.
4. Review its baseline and plan. Confirm product expansions such as adding public routes/content types explicitly; the current shipped frontend scope is one Coming Soon Home page reading public site settings from WordPress.
5. Agree the WordPress API contract before frontend work depends on new fields or events. For the current app, the active public read contract is `/wp-json/portfolio-studio/v1/settings`; the plugin also has future portfolio capabilities that the frontend does not currently consume.
6. Create one GitHub issue per approved implementation task using `.github/ISSUE_TEMPLATE/feature.yml`. The coordinator returns text only; it does not create issues or branches.

## 2. Implement on separate branches or pull requests

- Start one branch and one pull request per issue. Branch names may use `issue/<number>-short-name`; do not share a writable branch between agents.
- Assign one implementation owner: **frontend** for `apps/web/**`, **wordpress** for `apps/wordpress/**`. The coordinator can plan parallel work only when files and contracts do not overlap.
- Each agent must inspect current instructions, code, and worktree before editing. If unexpected user edits overlap the task, preserve them and ask only if the work is blocked.
- Keep frontend and WordPress file ownership separate. Cross-boundary work is split into contract and implementation issues rather than concurrent edits to the same files.
- Every handoff records changed files, commands actually run and results, unresolved risks, assumptions, and CMS/deployment impact.

## 3. Review and integrate

1. Open the PR and compare the diff to its issue acceptance criteria.
2. Ask **reviewer** to independently inspect the actual diff and verification evidence. Reviewer has no edit tool; findings go back to the owning agent as a focused follow-up commit.
3. Run or confirm `npm --prefix apps/web run test`, `npm --prefix apps/web run typecheck`, `npm --prefix apps/web run lint`, and `npm --prefix apps/web run build` when frontend files changed. Confirm plugin-specific checks where PHP/Docker tooling is available.
4. Recheck the updated diff and the changed files/verification report; use the PR template to record UI screenshots and CMS/deployment impact.
5. Merge only after human review and required checks pass. Agents do not automatically merge, deploy, change production domains, or modify secrets.

## Coordination rules

- One issue and one branch/PR per implementation task.
- Agree on API routes, field names/types, permissions, media representation, and revalidation events before frontend integration depends on them.
- Never let two agents edit the same file concurrently. If a task crosses boundaries, sequence the work through a reviewed contract or assign a single owner for the integration change.
- Reviewer verifies the code diff and available check evidence, not just the implementation summary.
- No autonomous daemon, paid orchestration service, production deploy, secret change, or private portfolio content is introduced by this workflow.

## Example coordinator request

> @coordinator Inspect the current repository and plan an issue to verify the WordPress site-name integration end to end. Do not assume portfolio routes are in scope. Return the verified baseline, one issue-ready task with owned files, dependencies, acceptance criteria and checks, any safe parallel work, and unresolved risks. Do not edit code or claim an issue was created.
