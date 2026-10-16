# Backend Review

This review covers the backend files only. UX issues and React best practices are intentionally excluded.

---

## Bugs

### 1) Activity service reads and writes the same JSON file through duplicated loaders

- File: [backend/src/modules/activity/services/activity.service.js](backend/src/modules/activity/services/activity.service.js)
- What is wrong:
  - The service defines two nearly identical functions, `loadDataA` and `loadDataB`, both reading the same file and returning the same data.
  - The functions are then used inconsistently: `getAllActivity` calls `loadDataA`, while `createNewActivity` calls `loadDataB`.
- Why it matters:
  - This creates duplicated logic and makes maintenance harder.
  - If one path is changed later, the two loaders can drift apart and cause inconsistent behavior.
  - It also makes debugging harder because the same operation is implemented twice with no clear reason.
- How to improve it:
  - Replace both with a single shared loader function.
  - Keep one consistent file access pattern, such as `loadActivityData()`.

### 2) Activity file path is tied to the process working directory

- File: [backend/src/modules/activity/services/activity.service.js](backend/src/modules/activity/services/activity.service.js)
- What is wrong:
  - The service uses `path.join(process.cwd(), 'data', 'activity.json')`.
  - This assumes the backend is always started from the correct folder.
- Why it matters:
  - If the app is started from a different directory, the app may read/write the wrong file or fail to initialize.
  - This is fragile in production, CI, Docker, or when launching from a parent process.
- How to improve it:
  - Resolve the file relative to the project root or the current module file.
  - Use a single shared path helper so all modules resolve data files consistently.

### 3) Activity creation has no validation and can fail on malformed input

- Files: [backend/src/modules/activity/services/activity.service.js](backend/src/modules/activity/services/activity.service.js), [backend/src/modules/activity/controllers/activity.controller.js](backend/src/modules/activity/controllers/activity.controller.js)
- What is wrong:
  - `createNewActivity(b)` blindly reads `b.action` and `b.info`.
  - If `req.body` is missing or malformed, this can throw an exception.
- Why it matters:
  - Invalid payloads can crash request handling.
  - The operation becomes unreliable for clients sending empty or malformed JSON.
- How to improve it:
  - Validate that the body is an object and contains the required fields.
  - Return a clean 400 error if the payload is invalid instead of letting a crash bubble up.

### 4) JSON parsing is not guarded against malformed data

- File: [backend/src/modules/activity/services/activity.service.js](backend/src/modules/activity/services/activity.service.js)
- What is wrong:
  - The service calls `JSON.parse(raw)` without checking whether the file contents are valid.
- Why it matters:
  - If the file is corrupted or partially written, the service can crash and break the API.
  - This is especially risky because the app stores state on disk.
- How to improve it:
  - Wrap parsing in try/catch.
  - Return an empty array or fail with a structured error if the file is corrupted.

### 5) Activity writes are vulnerable to race conditions

- File: [backend/src/modules/activity/services/activity.service.js](backend/src/modules/activity/services/activity.service.js)
- What is wrong:
  - The service reads the array, appends a new item, and writes back using a non-atomic sequence.
  - If two requests happen at the same time, one write can override the other.
- Why it matters:
  - Data loss is possible when multiple clients create activity entries concurrently.
  - This is a classic file-based race condition.
- How to improve it:
  - Use a write lock or a single shared mutation function for file updates.
  - Prefer a database or a transactional storage model for production traffic.

### 6) Activity IDs are not guaranteed unique

- File: [backend/src/modules/activity/services/activity.service.js](backend/src/modules/activity/services/activity.service.js)
- What is wrong:
  - The ID is generated as `String(Date.now())`.
- Why it matters:
  - Multiple requests within the same millisecond can produce duplicate IDs.
  - Duplicate IDs can cause collisions when the frontend later expects each item to be unique.
- How to improve it:
  - Use a UUID generator such as `crypto.randomUUID()`.
  - This is already used in the task service via the shared helper.

### 7) Reports summary hardcodes the in-progress count to zero

- File: [backend/src/modules/reports/services/reports.service.js](backend/src/modules/reports/services/reports.service.js)
- What is wrong:
  - `byStatus` contains `"in-progress": 0` with no calculation from actual task data.
- Why it matters:
  - The returned report is inaccurate because it claims there are no tasks in progress even if some tasks exist in a non-complete state.
  - A dashboard using this summary would show wrong metrics.
- How to improve it:
  - Compute the in-progress value from task state, or add an explicit status field to the task model if that is the intended domain model.
  - If the app does not support progress states, do not return an in-progress bucket at all.

### 8) Task update flow can mutate protected fields

- File: [backend/src/modules/tasks/services/tasks.service.js](backend/src/modules/tasks/services/tasks.service.js)
- What is wrong:
  - `updateTask` spreads `...updates` on top of the existing task.
  - That allows callers to modify fields like `id`, `createdAt`, or other internal metadata.
- Why it matters:
  - API clients can overwrite fields that should be read-only.
  - This weakens data integrity and makes the task model harder to trust.
- How to improve it:
  - Build a whitelist of allowed update fields.
  - Explicitly ignore or reject unknown keys.

### 9) Controller patch validation does not reject whitespace-only titles after trimming

- File: [backend/src/modules/tasks/controllers/tasks.controller.js](backend/src/modules/tasks/controllers/tasks.controller.js)
- What is wrong:
  - After trimming, the controller checks whether the title is empty, but the logic is not consistently enforced across all update paths.
- Why it matters:
  - A client can send a title that becomes empty after trimming, weakening input validation.
  - This creates inconsistent behavior between create and update endpoints.
- How to improve it:
  - Add a common validation helper for title normalization and reuse it in both create and update flows.

---

## Performance

### 1) Full JSON files are read on every request

- Files: [backend/src/modules/tasks/services/tasks.service.js](backend/src/modules/tasks/services/tasks.service.js), [backend/src/modules/reports/services/reports.service.js](backend/src/modules/reports/services/reports.service.js), [backend/src/modules/activity/services/activity.service.js](backend/src/modules/activity/services/activity.service.js)
- What is wrong:
  - The app reads entire JSON files from disk for simple reads and writes.
- Why it matters:
  - This is inefficient under load and scales poorly as the dataset grows.
  - Every request performs disk I/O and serialization of the full payload.
- How to improve it:
  - Use a lightweight database or in-memory cache for frequently accessed data.
  - At minimum, centralize storage access and avoid redundant reads.

### 2) File writes are synchronous in the activity service

- File: [backend/src/modules/activity/services/activity.service.js](backend/src/modules/activity/services/activity.service.js)
- What is wrong:
  - `fs.writeFileSync` blocks the Node.js event loop during each write.
- Why it matters:
  - A single slow write can delay all other requests.
  - This becomes increasingly significant when multiple clients are interacting with the API.
- How to improve it:
  - Use async file writes (`fs.promises.writeFile`) so the event loop remains responsive.

### 3) Reports summary reads large files even for a small dashboard summary

- File: [backend/src/modules/reports/services/reports.service.js](backend/src/modules/reports/services/reports.service.js)
- What is wrong:
  - The summary reads the entire task list and activity list just to compute counts.
- Why it matters:
  - The app does more work than necessary for a simple summary endpoint.
  - This is not a severe bug, but it is wasteful and will worsen with data growth.
- How to improve it:
  - Store summary/pre-aggregated metrics or compute them incrementally.
  - If file storage remains, read only the minimal necessary data and avoid full-array processing when possible.

---

## Security

### 1) No authentication or authorization checks on write endpoints

- Files: [backend/src/modules/tasks/controllers/tasks.controller.js](backend/src/modules/tasks/controllers/tasks.controller.js), [backend/src/modules/activity/controllers/activity.controller.js](backend/src/modules/activity/controllers/activity.controller.js), [backend/src/src/app.js](backend/src/app.js)
- What is wrong:
  - The API exposes create, update, delete, and activity-write routes without any auth layer.
- Why it matters:
  - Anyone who can reach the server can change task data or create activity entries.
  - This is an immediate security risk for any real application.
- How to improve it:
  - Add authentication and authorization checks at the router or middleware layer.
  - Restrict write access to trusted users or authenticated roles.

### 2) Unvalidated request payloads allow data poisoning

- Files: [backend/src/modules/activity/controllers/activity.controller.js](backend/src/modules/activity/controllers/activity.controller.js), [backend/src/modules/tasks/controllers/tasks.controller.js](backend/src/modules/tasks/controllers/tasks.controller.js)
- What is wrong:
  - The app accepts arbitrary objects and writes them to disk.
- Why it matters:
  - Malicious or malformed payloads can pollute stored data and compromise downstream behavior.
  - It also makes the application harder to secure and reason about.
- How to improve it:
  - Define a strict schema for accepted payloads.
  - Validate type, allowed keys, and required fields before persisting data.

### 3) No rate limiting or abuse protection on state-changing endpoints

- Files: [backend/src/modules/tasks/controllers/tasks.controller.js](backend/src/modules/tasks/controllers/tasks.controller.js), [backend/src/modules/activity/controllers/activity.controller.js](backend/src/modules/activity/controllers/activity.controller.js)
- What is wrong:
  - There is no rate limiting or abuse protection for endpoints that write files.
- Why it matters:
  - A client can spam create/update requests and degrade performance or fill disk space.
- How to improve it:
  - Add request throttling or rate limiting middleware.
  - Consider request size limits and abuse detection.

---

## Maintainability

### 1) Inconsistent naming conventions between modules

- Files: [backend/src/modules/activity/routes/activity.routes.js](backend/src/modules/activity/routes/activity.routes.js), [backend/src/modules/activity/controllers/activity.controller.js](backend/src/modules/activity/controllers/activity.controller.js), [backend/src/modules/tasks/controllers/tasks.controller.js](backend/src/modules/tasks/controllers/tasks.controller.js)
- What is wrong:
  - Some functions use `snake_case` such as `get_activity`, while other files use `camelCase` such as `addActivity` and `listTasks`.
- Why it matters:
  - Mixed naming patterns reduce readability and make the codebase feel inconsistent.
  - This increases mental overhead during onboarding and maintenance.
- How to improve it:
  - Standardize on one style, ideally `camelCase` for JavaScript functions.
  - Use the same naming pattern across routes, controllers, and services.

### 2) Duplicate file-loading logic across the activity service

- File: [backend/src/modules/activity/services/activity.service.js](backend/src/modules/activity/services/activity.service.js)
- What is wrong:
  - There are two separate loader functions doing the same work.
- Why it matters:
  - It increases maintenance cost and the chance of hidden bugs.
  - It also makes the file harder to read and review.
- How to improve it:
  - Consolidate into one helper method and reuse it throughout the service.

### 3) Validation logic is repeated and inconsistent across layers

- Files: [backend/src/modules/tasks/controllers/tasks.controller.js](backend/src/modules/tasks/controllers/tasks.controller.js), [backend/src/modules/tasks/services/tasks.service.js](backend/src/modules/tasks/services/tasks.service.js)
- What is wrong:
  - The controller and service both validate similar inputs.
  - The rules are also not perfectly aligned.
- Why it matters:
  - Maintaining both sets of validation increases the chance of drift.
  - Future changes are likely to fix one layer but forget the other.
- How to improve it:
  - Create a shared validation helper or central schema validation layer.
  - Validate at one boundary and keep service methods assuming valid input.

### 4) Path resolution is duplicated and fragile across modules

- Files: [backend/src/modules/activity/services/activity.service.js](backend/src/modules/activity/services/activity.service.js), [backend/src/modules/tasks/services/tasks.service.js](backend/src/modules/tasks/services/tasks.service.js), [backend/src/modules/reports/services/reports.service.js](backend/src/modules/reports/services/reports.service.js)
- What is wrong:
  - Different modules calculate their JSON file paths independently using `process.cwd()`.
- Why it matters:
  - This makes deployment and startup environment assumptions implicit.
  - It reduces portability and makes debugging configuration issues harder.
- How to improve it:
  - Move all file path resolution into one utility module.
  - Resolve against a known project root rather than the current runtime shell directory.

---

## Code quality

### 1) Non-descriptive variable names reduce readability

- File: [backend/src/modules/activity/controllers/activity.controller.js](backend/src/modules/activity/controllers/activity.controller.js)
- What is wrong:
  - Variables like `aSvc` and `x` are too abbreviated and unclear.
- Why it matters:
  - This lowers readability and makes the code harder to understand for new contributors.
- How to improve it:
  - Use descriptive names such as `activityService` and `activities`.

### 2) The activity service is too minimal and inconsistent with the tasks service

- Files: [backend/src/modules/activity/services/activity.service.js](backend/src/modules/activity/services/activity.service.js), [backend/src/modules/tasks/services/tasks.service.js](backend/src/modules/tasks/services/tasks.service.js)
- What is wrong:
  - The activity module does not have the same consistent validation, error handling, or file utility abstraction as the task module.
- Why it matters:
  - The codebase feels uneven and harder to maintain.
  - Different modules behave differently even when they solve similar problems.
- How to improve it:
  - Align the activity service with the task service pattern.
  - Reuse shared helpers and consistent validation/error behavior.

### 3) Error handling is inconsistent across modules

- Files: [backend/src/modules/activity/services/activity.service.js](backend/src/modules/activity/services/activity.service.js), [backend/src/modules/tasks/services/tasks.service.js](backend/src/modules/tasks/services/tasks.service.js), [backend/src/modules/reports/services/reports.service.js](backend/src/modules/reports/services/reports.service.js)
- What is wrong:
  - Some modules throw `HttpError`, some rely on validation in controllers, and some do not handle malformed JSON at all.
- Why it matters:
  - The application is harder to reason about because errors are not handled uniformly.
- How to improve it:
  - Standardize on a single error-handling flow: validate at boundaries, normalize errors at the service layer, and let middleware format them consistently.

### 4) The reports service is too rigid for a real summary model

- File: [backend/src/modules/reports/services/reports.service.js](backend/src/modules/reports/services/reports.service.js)
- What is wrong:
  - The summary object assumes a fixed bucket model and hardcodes `in-progress` to zero.
- Why it matters:
  - This is brittle and likely to drift from the actual data model.
- How to improve it:
  - Define the actual task statuses or model fields explicitly.
  - If the app only supports `todo` and `done`, remove the `in-progress` bucket rather than returning a misleading value.

### 5) The activity route/controller pair is not aligned in naming conventions

- Files: [backend/src/modules/activity/routes/activity.routes.js](backend/src/modules/activity/routes/activity.routes.js), [backend/src/modules/activity/controllers/activity.controller.js](backend/src/modules/activity/controllers/activity.controller.js)
- What is wrong:
  - The route file exports `get_activity` while the controller uses `addActivity` and `get_activity` in a mixed style.
- Why it matters:
  - It makes the API surface harder to follow and inconsistent with the rest of the codebase.
- How to improve it:
  - Use one consistent naming convention across routes, controllers, and exports.

---

## Summary

The backend is workable as a small demo, but several issues reduce robustness and maintainability. The biggest concerns are:

- activity data storage is fragile and prone to race conditions,
- validation is inconsistent and incomplete,
- the reports summary includes a misleading hardcoded status bucket,
- and the codebase needs a stronger standard for naming, shared validation, and path handling.

The task-related modules are the most polished and provide the clearest pattern to follow. The activity module is the weakest part and should be refactored first for reliability and consistency.

---

# Frontend Review

This section covers the frontend pages, API routes, task components, and `useTasks` hook reviewed so far. The shared `.stack` class defines `display: grid`, so the home page's `gridTemplateColumns` style is active and is not listed as a layout bug.

## Bugs

### 1) Activity page maintains redundant lists and artificial timer-driven state

- File: [frontend/app/activity/page.tsx](frontend/app/activity/page.tsx)
- What is wrong:
  - `allActivity`, `shownActivity`, and `forcedList` represent overlapping versions of the same activity data.
  - An interval updates `tick` every 1.4 seconds, which triggers filtering and copies/clones the list even when the data has not changed.
- Why it matters:
  - This creates unnecessary state transitions and makes it easier for displayed data to become stale or inconsistent.
  - The timer does not fetch new activity, so it gives no useful refresh behavior.
- How to improve it:
  - Keep `allActivity` as the source of truth and derive the filtered list from it and `query`.
  - Remove `tick` and `forcedList`; introduce polling only if live refresh is a real requirement.

### 2) Malformed JSON requests return 500 from the task update route

- File: [frontend/app/api/tasks/[id]/route.ts](frontend/app/api/tasks/%5Bid%5D/route.ts)
- What is wrong:
  - Invalid or empty JSON makes `request.json()` throw, and a JSON `null` payload throws when `payload.completed` is read. Both reach the catch block and return `500`.
- Why it matters:
  - Invalid client input is reported as a server failure, so callers cannot interpret the response correctly.
- How to improve it:
  - Handle JSON parsing separately and return `400 Bad Request`; verify the parsed payload is a non-null object before reading `completed`.

### 3) Proxy routes misreport backend failures as internal server errors

- Files: [frontend/app/api/activity/route.ts](frontend/app/api/activity/route.ts), [frontend/app/api/tasks/[id]/route.ts](frontend/app/api/tasks/%5Bid%5D/route.ts), [frontend/app/api/tasks/route.ts](frontend/app/api/tasks/route.ts)
- What is wrong:
  - Each route returns `500` for every caught error. The task update route therefore also reports backend `400` validation errors and `404` missing-task errors as `500`.
- Why it matters:
  - Clients cannot distinguish invalid requests, missing resources, upstream failures, and failures in the Next.js route itself.
- How to improve it:
  - Preserve known backend status codes in a typed helper error, and return `502 Bad Gateway` for upstream communication failures.

### 4) Task update busy state cannot represent concurrent requests

- File: [frontend/hooks/useTasks.ts](frontend/hooks/useTasks.ts)
- What is wrong:
  - `updatingTaskId` stores only one ID. A second update replaces the first ID; when either request finishes, its `finally` block clears the state even if the other request is still pending.
- Why it matters:
  - A pending task may appear idle and its control may be enabled before its request completes.
- How to improve it:
  - Track pending IDs in a `Set` or map, or serialize updates so only one can run at a time.

### 5) Task-list empty state does not distinguish an empty dataset from an empty filter result

- File: [frontend/components/tasks/TaskList.tsx](frontend/components/tasks/TaskList.tsx)
- What is wrong:
  - The component always displays “No tasks match this filter,” even when there are no tasks at all.
- Why it matters:
  - The message can mislead users about why the list is empty.
- How to improve it:
  - Pass the unfiltered task count or an explicit empty-state reason, and show different messages for no tasks and no filter matches.

### 6) API responses are trusted without runtime validation

- File: [frontend/hooks/useTasks.ts](frontend/hooks/useTasks.ts)
- What is wrong:
  - `requestJson<T>` casts parsed JSON to `T`; TypeScript does not verify that the received data actually matches `TasksResponse` or `TaskResponse`.
- Why it matters:
  - A malformed response can enter state and cause rendering or filtering to fail at runtime.
- How to improve it:
  - Validate response payloads at the API boundary with explicit checks or a schema validator before storing them.

## Performance

### 1) Activity page performs recurring work without new data

- File: [frontend/app/activity/page.tsx](frontend/app/activity/page.tsx)
- What is wrong:
  - The 1.4-second interval triggers state updates, filtering, and list cloning despite no change to the source activity data.
- Why it matters:
  - It causes avoidable rendering and array work, which grows with the size of the activity list.
- How to improve it:
  - Remove the interval-driven updates. If periodic refresh is required, fetch new data on that schedule and update state only when appropriate.

### 2) Filtering activity is duplicated

- File: [frontend/app/activity/page.tsx](frontend/app/activity/page.tsx)
- What is wrong:
  - `applyFilterA` and `applyFilterB` perform the same search using different string methods, and both are applied in sequence.
- Why it matters:
  - Each pass scans the list, doing redundant work on every query or timer tick.
- How to improve it:
  - Use one filter function and derive the filtered result once from the source list and query.

## Security

### 1) Proxy routes return backend error details to the client

- Files: [frontend/app/api/activity/route.ts](frontend/app/api/activity/route.ts), [frontend/app/api/tasks/[id]/route.ts](frontend/app/api/tasks/%5Bid%5D/route.ts), [frontend/app/api/tasks/route.ts](frontend/app/api/tasks/route.ts)
- What is wrong:
  - The catch blocks include `error.message` in the client response. The shared backend helper also uses upstream error messages when constructing errors.
- Why it matters:
  - Unexpected backend or infrastructure errors may expose internal implementation details.
- How to improve it:
  - Return stable, public-facing error messages and log diagnostic details server-side. Preserve only intentionally client-safe validation messages.

## Maintainability

### 1) Repeated activity-page helpers and derived state obscure the actual behavior

- File: [frontend/app/activity/page.tsx](frontend/app/activity/page.tsx)
- What is wrong:
  - `formatTimeA` and `formatTimeB` are identical, as are the two filter helpers, while several state values hold derived copies of the activity list.
- Why it matters:
  - Duplicate implementations and state synchronization make the component harder to change safely.
- How to improve it:
  - Keep one formatter and one filter implementation; derive visible activity from source data and query rather than storing copies.

### 2) Stable layout styles are embedded across components

- Files: [frontend/app/page.tsx](frontend/app/page.tsx), [frontend/app/activity/page.tsx](frontend/app/activity/page.tsx), [frontend/components/tasks/StatusFilter.tsx](frontend/components/tasks/StatusFilter.tsx), [frontend/components/tasks/TaskDashboard.tsx](frontend/components/tasks/TaskDashboard.tsx), [frontend/components/tasks/TaskItem.tsx](frontend/components/tasks/TaskItem.tsx), [frontend/components/tasks/TaskList.tsx](frontend/components/tasks/TaskList.tsx)
- What is wrong:
  - Spacing, layout, and presentation styles are frequently defined inline in JSX.
- Why it matters:
  - Repeated visual changes are harder to keep consistent and JSX is noisier to scan.
- How to improve it:
  - Move stable styles into CSS classes, keeping inline styles for genuinely dynamic values.

## Code quality

### 1) Home-page module links provide little context

- File: [frontend/app/page.tsx](frontend/app/page.tsx)
- What is wrong:
  - Each card contains only a heading and no description or other detail about the destination.
- Why it matters:
  - The landing page feels like a placeholder and gives little context for choosing a module.
- How to improve it:
  - Add a concise description for the task dashboard and activity feed.

### 2) Activity page formats and renders the same timestamp twice

- File: [frontend/app/activity/page.tsx](frontend/app/activity/page.tsx)
- What is wrong:
  - `formatTimeA` and `formatTimeB` return the same localized timestamp, and both are rendered for each activity item.
- Why it matters:
  - The duplicated display adds noise and makes the feed look incorrect.
- How to improve it:
  - Render the timestamp once through a single `formatTime` helper.

### 3) Activity stats memoization tracks artificial state

- File: [frontend/app/activity/page.tsx](frontend/app/activity/page.tsx)
- What is wrong:
  - The stats object includes `tick` as `everySecondTick`, even though the timer does not represent a meaningful activity statistic.
- Why it matters:
  - It exposes implementation-only state in the component and creates memo recalculations without useful data changes.
- How to improve it:
  - Remove the tick-based statistic and memoize only meaningful, sufficiently expensive derived values.

## UX issues

### 1) Home-page cards do not explain their destinations

- File: [frontend/app/page.tsx](frontend/app/page.tsx)
- What is wrong:
  - The Task Dashboard and Activity Feed links have headings but no descriptions.
- Why it matters:
  - Users get little indication of what each module contains before navigating.
- How to improve it:
  - Add short descriptions that explain the content of each destination.

### 2) Activity page performs a confusing periodic visual refresh

- File: [frontend/app/activity/page.tsx](frontend/app/activity/page.tsx)
- What is wrong:
  - The list is recreated every 1.4 seconds even though no new activity is fetched; the same timestamp is also displayed twice.
- Why it matters:
  - The feed appears to refresh without changing and includes redundant information.
- How to improve it:
  - Update the list only when new activity arrives and display each activity field once.

### 3) Status filter has no visible label

- File: [frontend/components/tasks/StatusFilter.tsx](frontend/components/tasks/StatusFilter.tsx)
- What is wrong:
  - The filter group has an accessible label but no visible heading.
- Why it matters:
  - Sighted users may not understand the purpose of the buttons if the surrounding context is not clear.
- How to improve it:
  - Add a visible “Status” label when the surrounding page does not already make the filter purpose clear.

### 4) Task dashboard hides useful context after a mutation failure

- Files: [frontend/components/tasks/TaskDashboard.tsx](frontend/components/tasks/TaskDashboard.tsx), [frontend/hooks/useTasks.ts](frontend/hooks/useTasks.ts)
- What is wrong:
  - A status-update error is stored in the shared error state, and the dashboard renders `TaskList` only when there is no error. Its Retry button calls `fetchTasks`, not the failed update.
- Why it matters:
  - The user loses the list after a single failed update, and Retry reloads data instead of retrying the action that failed.
- How to improve it:
  - Keep loaded tasks visible when a mutation fails, show the error near the affected item, and provide an appropriate retry action or clearly label a list reload.

### 5) Saving feedback can be incorrect when task updates overlap

- Files: [frontend/components/tasks/TaskDashboard.tsx](frontend/components/tasks/TaskDashboard.tsx), [frontend/components/tasks/TaskList.tsx](frontend/components/tasks/TaskList.tsx), [frontend/hooks/useTasks.ts](frontend/hooks/useTasks.ts)
- What is wrong:
  - The list marks a row busy by comparing its ID with one `updatingTaskId`, which cannot represent multiple pending updates.
- Why it matters:
  - A task may stop showing “Saving...” and become actionable before its request completes.
- How to improve it:
  - Track pending task IDs individually or prevent overlapping updates.

## React best practices

### 1) Activity page stores derived values and synchronizes them with effects

- File: [frontend/app/activity/page.tsx](frontend/app/activity/page.tsx)
- What is wrong:
  - `shownActivity` and `forcedList` are derived from `allActivity` and `query`, but are separately stored and updated through effects.
- Why it matters:
  - Multiple sources of truth can become stale and require extra render cycles to synchronize.
- How to improve it:
  - Derive the filtered list during render, or use `useMemo` only if filtering cost warrants it.

### 2) Activity page uses timer state to force rerenders

- File: [frontend/app/activity/page.tsx](frontend/app/activity/page.tsx)
- What is wrong:
  - An interval updates state solely to recreate list arrays and trigger rendering.
- Why it matters:
  - Renders should follow meaningful state changes; artificial updates complicate effects and consume resources.
- How to improve it:
  - Remove the interval unless it drives actual data refresh, and update the UI in response to real data changes.

### 3) `useTasks` memoizes derived filtering appropriately

- File: [frontend/hooks/useTasks.ts](frontend/hooks/useTasks.ts)
- Review note:
  - `filteredTasks` is derived from `tasks` and `filter`; its `useMemo` dependencies cover both inputs. `fetchTasks` is stabilized for the effect dependency. No issue was identified here.

### 4) Task components remain appropriately small

- Files: [frontend/components/tasks/StatusFilter.tsx](frontend/components/tasks/StatusFilter.tsx), [frontend/components/tasks/TaskItem.tsx](frontend/components/tasks/TaskItem.tsx), [frontend/components/tasks/TaskList.tsx](frontend/components/tasks/TaskList.tsx)
- Review note:
  - The reviewed components use stable list keys, typed props, and appropriate button semantics. No additional React-specific issue was identified beyond the state and rendering concerns documented above.

## Frontend summary

The most significant frontend concerns are the activity page's artificial timer-driven updates and redundant derived state, task-update errors hiding the task list, and incorrect error/status handling in the API proxy routes. The task components are generally small and typed; the main opportunities there are clearer empty/error states and moving repeated inline styling into CSS classes.
