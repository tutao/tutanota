import typescriptEslint from "typescript-eslint"
import unicorn from "eslint-plugin-unicorn"
import globals from "globals"
import { defineConfig, globalIgnores } from "eslint/config"

/** Only T | null is allowed as a union type (maps cleanly to Nullable<T> in Kotlin/Swift transpilation). */
const noUnionExceptNullable = {
	meta: {
		type: "problem",
		docs: { description: "Disallow union types except T | null (Nullable<T>)" },
		messages: {
			noUnion: "Union types are not allowed except 'T | null'. Use classes instead.",
		},
		schema: [],
	},
	create(context) {
		return {
			TSUnionType(node) {
				const isNullable = node.types.length === 2 && node.types.some((t) => t.type === "TSNullKeyword")
				if (!isNullable) {
					context.report({ node, messageId: "noUnion" })
				}
			},
		}
	},
}
const noUnnamedTypes = {
	meta: {
		type: "problem",
		docs: { description: "Do not allow anonymous types" },
		messages: {
			noUnion: "Anonymous types are discouraged. Rather create a type alias and use that alias here",
		},
	},
	create(context) {
		return {
			TSTypeLiteral(node) {
				const parent = node.parent
				if (parent?.type === "TSTypeAliasDeclaration" || parent?.type === "TSInterfaceDeclaration") {
					// ok
				} else {
					context.report({ node, messageId: "noUnion" })
				}
			},
		}
	},
}
export default defineConfig([
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
			"no-self-compare": "error",
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
			eqeqeq: ["error", "always", { null: "ignore" }],
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
			"no-with": "error",
			"require-yield": "error",
		},
	},
	{
		files: ["**/*.ts"],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							group: ["**platform-kit/crypto/**", "../crypto/**", "**/../crypto/**"],
							message:
								"Do not import from crypto internals directly. Use the public api under @tutao/crypto such as the `SymmetricCipherFacade` instead.",
						},
					],
				},
			],
		},
	},
	{
		files: ["test/**/*.ts"],
		rules: {
			"no-restricted-imports": 0,
		},
	},
	...typescriptEslint.configs.recommended,
	{
		rules: {
			"no-control-regex": 0,
			"@typescript-eslint/no-non-null-asserted-optional-chain": 0,
			"@typescript-eslint/no-this-alias": 0,
			// "no-empty-pattern": 0,
			"prefer-rest-params": 2,
			"prefer-spread": 0,
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
			ecmaVersion: 2022,
			sourceType: "module",
		},
	},
	{
		files: ["src/platform-kit/**/*.ts"],
		plugins: { local: { rules: { noUnionExceptNullable, noUnnamedTypes } } },
		extends: [],
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
		rules: {
			"@typescript-eslint/strict-boolean-expressions": [
				"error",
				{
					allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
					allowAny: false,
					allowNullableBoolean: false,
					allowNullableEnum: false,
					allowNullableNumber: false,
					allowNullableObject: false,
					allowNullableString: false,
					allowNumber: false,
					allowString: false,
				},
			],
			"@typescript-eslint/no-non-null-assertion": "error",
			"@typescript-eslint/explicit-function-return-type": "error",
			"local/noUnionExceptNullable": "error",
			"local/noUnnamedTypes": "error",
			"no-restricted-syntax": [
				"error",
				{
					selector: "PropertyDefinition[key.name='__brand'][accessibility!='protected']",
					message:
						"If you are extending TsBrand, make sure __brand is always protected. Else two brand with public __brand field will be same from type level",
				},
				{
					selector: "UnaryExpression[operator='typeof']",
					message:
						"Do not use `typeof` check directly. Use helper functions in src/platform-kit/app-env/boot/TypeChecks.ts instead",
				},
				{
					selector: "TSTypeQuery",
					message: "Do not use TypeScript `typeof` queries directly. Use explicit types instead",
				},
				{
					selector: "Identifier[name='undefined']",
					message: "Use null instead of undefined.",
				},
				{
					selector: "TSPropertySignature[optional=true]",
					message: "Optional properties are not allowed.",
				},
				{
					selector: "PropertyDefinition[optional=true]",
					message: "Optional class properties are not allowed.",
				},
				{
					selector: "Identifier[optional=true]",
					message: "Optional parameters are not allowed.",
				},
				{
					selector: "TSMethodSignature[optional=true]",
					message: "Optional methods are not allowed.",
				},
			],
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
			"src/app-kit/mimimi/",
			"src/platform-kit/crypto/internal/",
			"src/platform-kit/crypto/crypto-primitives/",
			"resources/",
			"schemas/",
			"tuta-sdk/",
			"**/entities/",
			"**/translations/",
			"**/node_modules/",
			"**/build/",
			"**/build-calendar-app/",
			"**/build-drive-app/",
			"**/dist/",
			"**/libs/",
		]),
	],
])
