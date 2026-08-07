#!/usr/bin/env bash
# Déploie le site sur GitHub Pages (https://boumedienesaidi.github.io/caribian-samui/)
# Usage : ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

BASE="/caribian-samui"
REPO="git@github.com:BoumedieneSaidi/caribian-samui.git"

npm run build

# GitHub Pages sert le site sous /caribian-samui : on préfixe les URLs internes absolues.
# (À supprimer le jour où le site sera servi à la racine d'un vrai domaine.)
find dist \( -name '*.html' -o -name '*.css' \) -print0 | xargs -0 sed -i \
  -e "s|href=\"/|href=\"$BASE/|g" \
  -e "s|src=\"/|src=\"$BASE/|g" \
  -e "s|url('/|url('$BASE/|g" \
  -e "s|url(/|url($BASE/|g"

touch dist/.nojekyll

cd dist
git init -q
git checkout -q -b gh-pages
git add -A
git commit -qm "Deploy $(date +%F_%H%M)"
git push -f "$REPO" gh-pages
cd ..
rm -rf dist/.git

echo "✅ Déployé : https://boumedienesaidi.github.io/caribian-samui/"
