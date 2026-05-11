# Deploy patched UI-TARS to /Applications

Branch `jhy/fix` — 3 commits against upstream `main`.

## Prerequisites

- Built app at: `apps/ui-tars/out/UI TARS-darwin-arm64/UI TARS.app`
- Entitlements at: `apps/ui-tars/entitlements.plist`
- If not yet built: `cd apps/ui-tars && UI_TARS_APP_PRIVATE_KEY_BASE64="dummy" pnpm run build:dist && pnpm run package`

## Install

```bash
# ═══ 1. Kill any running UI-TARS ═══
killall UI-TARS 2>/dev/null; sleep 1


# ═══ 2. Backup the original asar ═══
sudo cp \
  "/Applications/UI TARS.app/Contents/Resources/app.asar" \
  "/Applications/UI TARS.app/Contents/Resources/app.asar.bak-$(date +%Y%m%d-%H%M%S)"


# ═══ 3. Deploy the patched asar ═══
sudo cp \
  "apps/ui-tars/out/UI TARS-darwin-arm64/UI TARS.app/Contents/Resources/app.asar" \
  "/Applications/UI TARS.app/Contents/Resources/app.asar"


# ═══ 4. Re-sign with JIT entitlement ═══
sudo codesign --force --deep --sign - \
  --entitlements "apps/ui-tars/entitlements.plist" \
  "/Applications/UI TARS.app"


# ═══ 5. Launch ═══
open "/Applications/UI TARS.app"
```

## Fallback (if app crashes on Apple Silicon)

```bash
sudo codesign --remove-signature "/Applications/UI TARS.app"

sudo codesign --force --deep --sign - \
  --entitlements "apps/ui-tars/entitlements.plist" \
  "/Applications/UI TARS.app"
```

## Changes in this branch

1. **`packages/ui-tars/sdk/src/Model.ts`** — `thinking` param only sent for Doubao models; removed null params from API body
2. **`apps/ui-tars/src/main/store/types.ts`** — added minimax, copilot, mlx to VLMProviderV2 (7 providers total)
3. **`apps/ui-tars/src/main/utils/agent.ts`** — route new providers to V1_0 system prompt
4. **`apps/ui-tars/src/main/services/runAgent.ts`** — Copilot editor headers injected automatically

## Sync upstream

```bash
git remote add upstream https://github.com/bytedance/UI-TARS-desktop.git

git fetch upstream

git rebase upstream/main

git push personal jhy/fix --force-with-lease
```
