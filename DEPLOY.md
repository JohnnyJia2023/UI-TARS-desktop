# Deploy patched UI-TARS to /Applications

Branch `jhy/fix` — 3 commits against upstream `main`.

## Prerequisites

- Built app at: `apps/ui-tars/out/UI TARS-darwin-arm64/UI TARS.app`
- Entitlements at: `apps/ui-tars/entitlements.plist`
- If not yet built: `cd apps/ui-tars && UI_TARS_APP_PRIVATE_KEY_BASE64="dummy" pnpm run build:dist && pnpm run package`

## Important note

Do **not** deploy this patch by replacing only `Contents/Resources/app.asar`.

Electron validates the packaged `app.asar` against integrity metadata stored in
the app bundle. Replacing only the archive triggers a startup failure like:

```text
FATAL:asar_util.cc(...) Integrity check failed for asar archive
```

The working deployment path is to replace the entire `UI TARS.app` bundle with
the packaged output from this branch.

## Install

```bash
set -e

APP="/Applications/UI TARS.app"
SRC_APP="apps/ui-tars/out/UI TARS-darwin-arm64/UI TARS.app"
TS="$(date +%Y%m%d-%H%M%S)"

# ═══ 1. Kill any running UI-TARS ═══
killall "UI TARS" 2>/dev/null || true
sleep 1

# ═══ 2. Backup the existing installed app bundle ═══
mv "$APP" "/Applications/UI TARS.app.bak-$TS"

# ═══ 3. Copy the full patched app bundle ═══
cp -R "$SRC_APP" "$APP"

# ═══ 4. Clear quarantine on the copied bundle ═══
xattr -dr com.apple.quarantine "$APP" || true

# ═══ 5. Verify the copied bundle signature ═══
codesign --verify --deep --strict --verbose=2 "$APP"

# ═══ 6. Launch ═══
open -a "$APP"
```

If the target app bundle is root-owned on a different machine, add `sudo` to
the `mv`, `cp -R`, and `xattr` commands above.

## Verification

```bash
codesign --verify --deep --strict --verbose=2 "/Applications/UI TARS.app"

open -a "/Applications/UI TARS.app"

pgrep -fl "UI TARS|UI-TARS|ui-tars"
```

In-app verification used for this branch:

1. Open `Settings` -> `VLM Settings`.
2. Confirm the provider dropdown includes `MiniMax`.
3. Confirm the saved MiniMax config uses:
   - base URL: `https://api.minimax.io/v1`
   - model: `MiniMax-M2.7`
4. Click `Check Model Availability`.
5. Expected result: the model works, but `Use Responses API` is reported as not
   supported for `MiniMax-M2.7`.

For GitHub Copilot on this branch:

1. Set provider to `GitHub Copilot`.
2. Use base URL `https://api.githubcopilot.com`.
3. Use model `gpt-5-mini`.
4. Keep `Use Responses API` off.
5. `Check Model Availability` should succeed. This branch patches the settings
   validation path to send the same Copilot headers used by the runtime agent.

## Recovery

```bash
killall "UI TARS" 2>/dev/null || true

rm -rf "/Applications/UI TARS.app"

mv "/Applications/UI TARS.app.bak-<timestamp>" "/Applications/UI TARS.app"

open -a "/Applications/UI TARS.app"
```

## Changes in this branch

1. **`packages/ui-tars/sdk/src/Model.ts`** — `thinking` param only sent for Doubao models; removed null params from API body
2. **`apps/ui-tars/src/main/store/types.ts`** — added minimax, copilot, mlx to VLMProviderV2 (7 providers total)
3. **`apps/ui-tars/src/main/utils/agent.ts`** — route new providers to V1_0 system prompt
4. **`apps/ui-tars/src/main/services/runAgent.ts`** — Copilot editor headers injected automatically
5. **`apps/ui-tars/entitlements.plist`** — ad-hoc signing entitlement file with `com.apple.security.cs.allow-jit`

## Sync upstream

```bash
git remote add upstream https://github.com/bytedance/UI-TARS-desktop.git

git fetch upstream

git rebase upstream/main

git push personal jhy/fix --force-with-lease
```
