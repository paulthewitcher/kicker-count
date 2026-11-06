# Fix build Vercel: Rollup native Linux package missing

## Cause found in the repository commit ea4b5bf

The `package.json` declares Firebase 10, React 18 and Vite 5, while the committed
`package-lock.json` describes Firebase 13, React 19 and Vite 8. The lockfile is
therefore stale and inconsistent with the actual project manifest. Vercel's
installation ends up without Rollup's Linux x64 native optional package.

## Required action in GitHub

1. Delete `package-lock.json` from the repository (it must not remain alongside
   this `package.json`).
2. Commit and push that deletion together with the project files.
3. In Vercel, redeploy using **Redeploy without cache** / clear the build cache.

With no stale lockfile, Vercel resolves dependencies from this `package.json`
for its Linux build environment. The `.npmrc` in this project explicitly keeps
optional dependencies included, which is needed for Rollup's platform binary.

## Important

- No Firebase configuration or data needs to be changed.
- Do not upload `node_modules` to GitHub.
- Do not restore the old `package-lock.json` from the previous project version.
- If a lockfile is later regenerated locally, verify it matches this
  `package.json` and includes `@rollup/rollup-linux-x64-gnu` for Linux x64.
