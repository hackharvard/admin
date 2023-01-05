#

## Setup

Once you've installed dependencies with `npm install`, start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Changes

```bash
git checkout -B branch_name
```

The `branch_name` should be concise but descriptive. E.g., if making a page for profile settings, a branch name can be `profile_settings`.

After completing the objective of the branch, create a pull request on GitHub. Never commit directly to the main branch. Also, no need to merge unless you are used to working on a team with various branches and have merged with complex conflicts before.

## Ignore

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
