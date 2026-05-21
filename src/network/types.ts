/**
 * Runtime version of the const enum from types.d.ts.
 * esbuild cannot inline const enums across module boundaries, so this .ts file provides
 * a regular enum that is safe to bundle. The corresponding types.d.ts is still used by tsc.
 */

export enum CredentialType {
	Internal = "internal",
	External = "external",
}
