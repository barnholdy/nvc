#!/usr/bin/env sh

# Publish dist/ to the gh-pages branch.
#
# The new build is laid *on top of* what is already published rather than
# replacing it. Every build gives its files new hashed names, so a page still
# sitting in a browser cache asks for the previous build's files — and if the
# deploy deleted them, every script 404s and the app comes up black. Keeping the
# old files costs a few hundred KB per deploy and lets a stale page keep working
# until it picks up the new index.html.

# abort on errors
set -e

REPO="git@github.com:barnholdy/nvc.git"
BRANCH="gh-pages"

# build
npm run build

WORK="$(mktemp -d)"

# Start from what is published today, if anything is.
if git clone -q --depth 1 --branch "$BRANCH" "$REPO" "$WORK/live" 2>/dev/null; then
  rm -rf "$WORK/live/.git"
else
  mkdir -p "$WORK/live"
fi

# Overlay: index.html, manifest and favicons are overwritten, hashed assets
# simply join the ones already there.
cp -R dist/. "$WORK/live/"

cd "$WORK/live"

git init
git add -A
git commit -m 'deploy'
git push -f "$REPO" "master:$BRANCH"

echo "Successfully deployed $(find . -type f -not -path './.git/*' | wc -l) files to https://barnholdy.github.io/nvc/"

cd -
rm -rf "$WORK"
