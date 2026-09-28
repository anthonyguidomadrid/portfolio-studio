# Agent Workflow

## 1. Turn a request into issues

1. Open Copilot Chat and select the **coordinator** custom agent (or type `@coordinator` if the agent is available by mention).
2. Give it the outcome, constraints, relevant route/CMS assumptions, and ask for bounded issues with dependencies, acceptance criteria, verification, and agent ownership.
3. The coordinator inspects repository instructions, architecture, and relevant code, then returns a proposed issue/dependency plan. It does not edit the product or claim issues were created.
4. Review API/schema decisions yourself. The WordPress content contract must be agreed before frontend work depends on it.
5. Create one GitHub issue per implementation task from `.github/ISSUE_TEMPLATE/feature.yml`, or copy the coordinator's issue text into your issue tracker. Keep each task small enough for one branch/PR.

## 2. Implement on separate branches or pull requests

- Start one branch and one pull request per issue. Branch names may use `issue/<number>-short-name`; do not share a writable branch between agents.
- Assign one implementation owner: **frontend** for `apps/web/**`, **wordpress** for `apps/wordpress/**`. The coordinator can plan parallel work only when files and contracts do not overlap.
- Each agent must inspect current instructions, code, and worktree before editing. If unexpected user edits overlap the task, preserve them and ask only if the work is blocked.
- Keep frontend and WordPress file ownership separate. Cross-boundary work is split into contract and implementation issues rather than concurrent edits to the same files.
- Every handoff records changed files, commands actually run and results, unresolved risks, assumptions, and CMS/deployment impact.

## 3. Review and integrate

1. Open the PR and compare the diff to its issue acceptance criteria.
2. Ask **reviewer** to independently inspect the actual diff and verification evidence. Reviewer has no edit tool; findings go back to the owning agent as a focused follow-up commit.
3. Run or confirm `npm --prefix apps/web run typecheck`, `npm --prefix apps/web run lint`, and `npm --prefix apps/web run build` when frontend files changed. Confirm plugin-specific checks where PHP/Docker tooling is available.
4. Recheck the updated diff and the changed files/verification report; use the PR template to record UI screenshots and CMS/deployment impact.
5. Merge only after human review and required checks pass. Agents do not automatically merge, deploy, change production domains, or modify secrets.

## Coordination rules

- One issue and one branch/PR per implementation task.
- Agree on API routes, field names/types, permissions, media representation, and revalidation events before frontend integration depends on them.
- Never let two agents edit the same file concurrently. If a task crosses boundaries, sequence the work through a reviewed contract or assign a single owner for the integration change.
- Reviewer verifies the code diff and available check evidence, not just the implementation summary.
- No autonomous daemon, paid orchestration service, production deploy, secret change, or private portfolio content is introduced by this workflow.
