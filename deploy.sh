#!/usr/bin/env sh

# Publish dist/ to the gh-pages branch.
#
# This replaces what was published rather than adding to it. Overlaying was the
# first answer to a cached page asking for files a deploy had deleted — every
# script 404s and the app comes up black — but it never removes anything, and
# after a few dozen deploys the branch had grown to 26 MB across 618 files,
# which is a lot for Pages to build and hand over on every push.
#
# Two things make replacing safe now. index.html carries a guard that reloads
# under a fresh URL when one of its own scripts fails to load, so a stale page
# repairs itself instead of sitting there black. And the running app compares
# its build stamp against build.json on start, so it picks up a new deploy
# without being asked.

# abort on errors
set -e

REPO="git@github.com:barnholdy/nvc.git"
BRANCH="gh-pages"

# build
npm run build

WORK="$(mktemp -d)"
mkdir -p "$WORK/live"

# Just this build. .nojekyll rides along from public/, so Pages hands the files
# over as they are instead of running them through Jekyll first.
cp -R dist/. "$WORK/live/"

cd "$WORK/live"

git init
git add -A
git commit -m 'deploy'
git push -f "$REPO" "master:$BRANCH"

echo "Successfully deployed $(find . -type f -not -path './.git/*' | wc -l) files to https://barnholdy.github.io/nvc/"

cd -
rm -rf "$WORK"
