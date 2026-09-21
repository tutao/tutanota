import { registerHooks } from "node:module"

/** removing this? also remove the dependency overrides in the package.json. **/
console.warn("⚠️ replacing typescript imports with typescript-6.")
console.warn("⚠️ remove this preload script once typescript-eslint and @rollup/plugin-typescript support TS7.")

function resolve(specifier, context, nextResolve) {
	if (specifier === "typescript") {
		specifier = "typescript-6"
	} else if (specifier === "typescript/lib/tsserverlibrary") {
		specifier = "typescript-6/lib/tsserverlibrary"
	}
	return nextResolve(specifier, context)
}

registerHooks({ resolve })
