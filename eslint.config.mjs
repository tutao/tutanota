import typescriptEslint from "@typescript-eslint/eslint-plugin"
import unicorn from "eslint-plugin-unicorn"
import globals from "globals"
import tsParser from "@typescript-eslint/parser"
import path from "node:path"
import {fileURLToPath} from "node:url"
import js from "@eslint/js"
import {FlatCompat} from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
})

export default [
	{
		ignores: [
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
		],
	},
	...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"),
	{
		plugins: {
			"@typescript-eslint": typescriptEslint,
			unicorn,
		},

		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},

			parser: tsParser,
			ecmaVersion: 2022,
			sourceType: "module",
		},

		rules: {
			"no-control-regex": 0,
			"@typescript-eslint/no-non-null-asserted-optional-chain": 0,
			"@typescript-eslint/no-this-alias": 0,
			"no-async-promise-executor": 2,
			"no-empty-pattern": 0,
			"no-inner-declarations": 0,
			"no-irregular-whitespace": 0,
			"no-constant-condition": 0,
			"prefer-rest-params": 2,
			"prefer-spread": 0,
			"no-prototype-builtins": 2,
			"no-var": 2,
			// does not take into account declared globals, not useful with ts
			"no-undef": 0,
			"no-fallthrough": 2,
			"no-case-declarations": 2,
			// enable it separately
			"prefer-const": 0,
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
	},
]
