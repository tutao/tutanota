/**
 * Runtime versions of the const enums from types.d.ts.
 * esbuild cannot inline const enums across module boundaries, so this .ts file provides
 * regular enums that are safe to bundle. The corresponding types.d.ts is still used by tsc.
 */

export enum MediaType {
	Json = "application/json",
	Binary = "application/octet-stream",
	Text = "text/plain",
}

export enum HttpMethod {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	PATCH = "PATCH",
	DELETE = "DELETE",
}

export enum SuspensionBehavior {
	Suspend,
	Throw,
}
