/** @fileoverview build packages programmatically. */

// it would be faster to just run from "../node_modules/.bin/tsc" because we wouldn't need to wait for the (sluggish) npm to start
// but since we are imported from other places (like admin client) we don't have a luxury of knowing where our node_modules will end up.
import { $ } from "zx"

// packages that we actually need to build the app
const RUNTIME_PACKAGES = ["tutanota-utils", "tutanota-crypto", "tutanota-usagetests"]

export async function buildRuntimePackages(pathPrefix = ".") {
	const packagesArg = RUNTIME_PACKAGES.map((p) => `${pathPrefix}/packages/${p}`)
	await $`npx tsc -b ${packagesArg}`
}

export async function buildPackages(pathPrefix = ".") {
	await $`npx tsc -b ${pathPrefix}/packages/*`
}
