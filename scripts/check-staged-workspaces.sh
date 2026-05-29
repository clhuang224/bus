#!/usr/bin/env sh

set -eu

staged_files="$(git diff --cached --name-only)"

if [ -z "$staged_files" ]; then
  echo "No staged files. Skipping workspace checks."
  exit 0
fi

run_all=false
run_web=false
run_api=false
run_tdx_proxy=false
docs_only=true

while IFS= read -r file; do
  case "$file" in
    *.md|docs/*)
      ;;
    package.json|pnpm-lock.yaml|pnpm-workspace.yaml|.husky/*|.github/*|scripts/*)
      run_all=true
      docs_only=false
      ;;
    apps/web/*)
      run_web=true
      docs_only=false
      ;;
    apps/api/*)
      run_api=true
      docs_only=false
      ;;
    apps/tdx-proxy/*)
      run_tdx_proxy=true
      docs_only=false
      ;;
    packages/shared/*)
      run_all=true
      docs_only=false
      ;;
    *)
      run_all=true
      docs_only=false
      ;;
  esac
done <<EOF
$staged_files
EOF

run_workspace_checks() {
  workspace="$1"

  echo "Running checks for $workspace..."
  pnpm --filter "$workspace" --if-present lint
  pnpm --filter "$workspace" --if-present typecheck
}

if [ "$docs_only" = true ]; then
  echo "Only documentation files staged. Skipping workspace checks."
  exit 0
fi

if [ "$run_all" = true ]; then
  echo "Running checks for all workspaces..."
  pnpm -r --if-present lint
  pnpm -r --if-present typecheck
  exit 0
fi

if [ "$run_web" = true ]; then
  run_workspace_checks "@bus/web"
fi

if [ "$run_api" = true ]; then
  run_workspace_checks "@bus/api"
fi

if [ "$run_tdx_proxy" = true ]; then
  run_workspace_checks "@bus/tdx-proxy"
fi
