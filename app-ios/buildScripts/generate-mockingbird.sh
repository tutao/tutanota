#!/usr/bin/env bash
set -eu

# Prevent Xcode 13 from running this script while indexing.
[[ "${ACTION}" == "indexbuild" ]] && exit 0

# Infer the derived data location from the build environment.
[[ -z "${DERIVED_DATA+x}" ]] && DERIVED_DATA="$(echo "${BUILD_ROOT}" | sed -n 's|\(.*\)/Build/.*|\1|p')"

"${DERIVED_DATA}/SourcePackages/checkouts/mockingbird/mockingbird" generate --targets "TutanotaSharedFramework" --outputs "${SRCROOT}/MockingbirdMocks/TutanotaSharedTests-TutanotaSharedFrameworkMocks.generated.swift"
