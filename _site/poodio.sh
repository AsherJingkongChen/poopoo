#!/usr/bin/env sh

set -euo pipefail

log() {
  _TAG="$1"; shift; _MSG="$@"
  _COLOR='\033[1;34m'; _RESET='\033[0m'
  [ -t 2 ] || { _COLOR=""; _RESET=""; }
  printf '%b%s%b %s\n' "${_COLOR}" "${_TAG}" "${_RESET}" "${_MSG}" >&2
}

# Check required commands
for c in 'curl' 'mktemp' 'openssl' 'sudo' 'tar'; do
  (command -v "${c}" > /dev/null 2>&1) \
  || { log 'ERROR:' "Required command: '${c}'"; exit 1; }
done

# Making a temporary directory
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

# Basic metadata
NAME='poodio'
REPO='AsherJingkongChen/poopoo'
log 'NAME:' "${NAME}"
log 'REPO:' "${REPO}"

# Fetching the release tag
TAG="${NAME}@${1:-"$(
  log 'TAG:' 'Fetching ...'
  curl -fsSL \
    -H 'Accept: application/vnd.github+json' \
    -H 'X-GitHub-Api-Version: 2022-11-28' \
    "https://api.github.com/repos/${REPO}/git/matching-refs/tags/${NAME}@" \
  | sed -n 's|.*"ref": "refs/tags/'"${NAME}"'@\(.*\)".*|\1|p' \
  | sort -nt. -r -k1,1 -k2,2 -k3,3 \
  | head -n 1 )"}"
log 'TAG:' "${TAG}"

# Detecting the target platform
OS="$(uname -s)"; case "${OS}" in
  'Darwin') OS='apple-darwin' ;;
  'Linux') OS='unknown-linux-gnu' ;;
  # TODO: Add support for 'windows'
  # 'MINGW'*|'MSYS'*|'CYGWIN'*) OS='pc-windows-msvc' ;;
  *) log 'ERROR:' "Invalid os: '${OS}'"; exit 2 ;;
esac
ARCH="$(uname -m)"; case "${ARCH}" in
  'aarch64'|'arm64') ARCH='aarch64' ;;
  'x86_64') ARCH='x86_64' ;;
  *) log 'ERROR:' "Invalid arch: '${ARCH}'"; exit 3 ;;
esac
TARGET="${ARCH}-${OS}"
log 'TARGET:' "${TARGET}"

# Fetching the distribution with the hash
DIST="https://github.com/${REPO}/releases/download/${TAG}/${TAG}-${TARGET}.tgz"
log 'DIST:' "${DIST}"
log 'DIST:' 'Fetching ...'
log 'HASH:' 'Fetching ...'
curl -fsLo "${TMP}/dist.tgz" "${DIST}" &PID="$!"
curl -fsLo "${TMP}/dist.tgz.meta.json" "${DIST}.meta.json" &PID="$! ${PID}"
for p in ${PID}; do
  wait "${p}" || \
  { log 'ERROR:' "Fetching failure"; exit 4; }
done

# Verifying the hash
HASH_DIST="$(openssl dgst -r -sha256 "${TMP}/dist.tgz" | cut -d' ' -f1)"
HASH="$(sed -n 's|.*:"\(.*\)".*|\1|p' "${TMP}/dist.tgz.meta.json")"
log 'DIST:' "${HASH_DIST}"
log 'HASH:' "${HASH}"
[ "${HASH_DIST}" = "${HASH}" ] \
|| { log 'ERROR:' 'Hash mismatch'; exit 5; }

# Extract the distribution
DST_DIR='/usr/local/bin'
TAR='tar'; [ -w "${DST_DIR}" ] \
|| { TAR='sudo tar'; }
log 'EXTRACT:' "${DST_DIR}/${NAME}"
${TAR} -xzf "${TMP}/dist.tgz" -C "${DST_DIR}" --no-same-owner \
|| { log 'ERROR:' "Extraction failure"; exit 6; }
log 'EXTRACT:' 'Finished!'
