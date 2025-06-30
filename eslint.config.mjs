import typescriptEslint from "typescript-eslint"
import unicorn from "eslint-plugin-unicorn"
import globals from "globals"
import { defineConfig, globalIgnores } from "eslint/config"
import eslintPluginPrettierRecommended from "eslint-config-prettier/flat"

export default defineConfig([
	// js.configs.recommended,
	{
		rules: {
			"for-direction": "error",
			"no-async-promise-executor": "error",
			"no-compare-neg-zero": "warn",
			"no-cond-assign": "error",
			"no-constant-binary-expression": "warn",
			"no-debugger": "error",
			"no-dupe-else-if": "warn",
			"no-duplicate-case": "error",
			"no-empty-character-class": "warn",
			"no-empty-pattern": "warn",
			"no-ex-assign": "warn",
			"no-fallthrough": "error",
			"no-invalid-regexp": "error",
			"no-irregular-whitespace": "error",
			"no-loss-of-precision": "error",
			"no-misleading-character-class": "warn",
			"no-prototype-builtins": "error",
			"no-self-assign": "error",
			// TODO: would be cool to enable
			// "no-self-compare": "error",
			"no-setter-return": "error",
			"no-sparse-arrays": "error",
			"no-unexpected-multiline": "error",
			"no-unreachable": "error",
			"no-unsafe-finally": "error",
			"no-unsafe-negation": "error",
			"no-unused-private-class-members": "warn",
			"no-useless-backreference": "warn",
			"use-isnan": "error",
			"valid-typeof": "error",
			// TODO: would be cool to enable
			// eqeqeq: ["error", "always", { null: "ignore" }],
			"no-case-declarations": "error",
			"no-delete-var": "error",
			"no-empty": "warn",
			"no-empty-static-block": "error",
			"no-eval": "error",
			"no-global-assign": "error",
			"no-implied-eval": "error",
			"no-nonoctal-decimal-escape": "error",
			"no-octal": "error",
			"no-octal-escape": "error",
			"no-proto": "error",
			"no-regex-spaces": "error",
			"no-shadow-restricted-names": "error",
			"no-unused-labels": "warn",
			"no-useless-catch": "warn",
			"no-useless-escape": "error",
			"no-var": "error",
			// TODO: would be cool to enable
			// "no-void": "error",
			"no-with": "error",
			"require-yield": "error",
		},
	},
	// FIXME
	...typescriptEslint.configs.recommended,
	// // this one just disables some rules so it makes sense to put it after
	// eslintPluginPrettierRecommended,
	{
		rules: {
			"no-control-regex": 0,
			"@typescript-eslint/no-non-null-asserted-optional-chain": 0,
			"@typescript-eslint/no-this-alias": 0,
			// "no-empty-pattern": 0,
			"prefer-rest-params": 2,
			"prefer-spread": 0,
			// FIXME: where it comes from?
			"prefer-const": 0,
			// does not take into account declared globals, not useful with ts
			// enable it separately
			"@typescript-eslint/no-empty-function": 0,
			"@typescript-eslint/no-non-null-assertion": 0,
			"@typescript-eslint/ban-ts-comment": 0,
			"@typescript-eslint/no-explicit-any": 0,
			"@typescript-eslint/no-unused-vars": 0,
			"@typescript-eslint/no-inferrable-types": 0,
			"unicorn/prefer-node-protocol": 2,
			"unicorn/no-array-for-each": 2,
			"unicorn/prefer-array-some": 2,
		},
		plugins: {
			unicorn,
		},
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},

			// parser: tsParser,
			ecmaVersion: 2022,
			sourceType: "module",
		},
	},
	[
		globalIgnores([
			"buildSrc/",
			".github/",
			".rollup.cache/",
			".run",
			"app-android/",
			"app-ios/",
			"artifacts/",
			"cache/",
			"ci/",
			"doc",
			"fdroid-metadata-workaround/",
			"githooks/",
			"native-cache/",
			"packages/node-mimimi/",
			"packages/tutanota-crypto/lib/internal/",
			"resources/",
			"schemas/",
			"tuta-sdk/",

			"**/entities/",
			"**/translations/",
			"**/node_modules/",
			"**/build/",
			"**/build-calendar-app/",
			"**/dist/",
			"**/libs/",
		]),
	],
])

// const oldConfig = [
// 	{
// 		ignores: [
// 			"buildSrc/",
// 			".github/",
// 			".rollup.cache/",
// 			".run",
// 			"app-android/",
// 			"app-ios/",
// 			"artifacts/",
// 			"cache/",
// 			"ci/",
// 			"doc",
// 			"fdroid-metadata-workaround/",
// 			"githooks/",
// 			"native-cache/",
// 			"packages/node-mimimi/",
// 			"packages/tutanota-crypto/lib/internal/",
// 			"resources/",
// 			"schemas/",
// 			"tuta-sdk/",
//
// 			"**/entities/",
// 			"**/translations/",
// 			"**/node_modules/",
// 			"**/build/",
// 			"**/build-calendar-app/",
// 			"**/dist/",
// 			"**/libs/",
// 		],
// 	},
// 	...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"),
// 	{
// 		plugins: {
// 			"@typescript-eslint": typescriptEslint,
// 			unicorn,
// 		},
//
// 		languageOptions: {
// 			globals: {
// 				...globals.browser,
// 				...globals.node,
// 			},
//
// 			parser: tsParser,
// 			ecmaVersion: 2022,
// 			sourceType: "module",
// 		},
//
// 		rules: {
// 			"no-control-regex": 0,
// 			"@typescript-eslint/no-non-null-asserted-optional-chain": 0,
// 			"@typescript-eslint/no-this-alias": 0,
// 			"no-async-promise-executor": 2,
// 			"no-empty-pattern": 0,
// 			"no-inner-declarations": 0,
// 			"no-irregular-whitespace": 0,
// 			"no-constant-condition": 0,
// 			"prefer-rest-params": 2,
// 			"prefer-spread": 0,
// 			"no-prototype-builtins": 2,
// 			"no-var": 2,
// 			// does not take into account declared globals, not useful with ts
// 			"no-undef": 0,
// 			"no-fallthrough": 2,
// 			"no-case-declarations": 2,
// 			// enable it separately
// 			"prefer-const": 0,
// 			"@typescript-eslint/no-empty-function": 0,
// 			"@typescript-eslint/no-non-null-assertion": 0,
// 			"@typescript-eslint/ban-ts-comment": 0,
// 			"@typescript-eslint/no-explicit-any": 0,
// 			"@typescript-eslint/no-unused-vars": 0,
// 			"@typescript-eslint/no-inferrable-types": 0,
// 			"unicorn/prefer-node-protocol": 2,
// 			"unicorn/no-array-for-each": 2,
// 			"unicorn/prefer-array-some": 2,
// 		},
// 	},
// ]
