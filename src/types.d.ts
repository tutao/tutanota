/**
 * File for global declarations which are used *in the app* (not in packages).
 *
 * Hey you! Don't import anything in this file, or all these declarations will cease to be global!
 */

declare type NumberString = string
declare type Dict = { [key: string]: string }

/** Requests from main web thread to worker */
declare type WorkerRequestType =
	| "setup"
	| "reset"
	| "testEcho"
	| "testError"
	| "restRequest"
	| "getLog"
	| "urlify"
	| "generateSsePushIdentifer"
	| "facade"

/** Requests from worker web thread to main web thread */
declare type MainRequestType =
	| "facade"
	| "execNative"
	| "error"
	| "updateIndexState"
	| "infoMessage"

/** Requests from web to native */
declare type NativeRequestType = "ipc" | "facade"

/** Requests from native to web */
declare type JsRequestType = "ipc"

// see https://bitwiseshiftleft.github.io/sjcl/doc/symbols/sjcl.bitArray.html
// type that is used by sjcl for any encryption/decryption operation
// TODO these should be exported by tutanota-crypto
declare type BitArray = number[]
declare type Aes128Key = BitArray
declare type Aes256Key = BitArray
declare type SignedBytes = number[]
declare type Base32 = string

declare type EnvMode = "Browser" | "App" | "Test" | "Playground" | "Desktop" | "Admin"
declare type PlatformId = "ios" | "android" | "darwin" | "linux" | "win32"

declare var env: {
	staticUrl?: string // if null the url from the browser is used
	mode: EnvMode
	platformId: PlatformId | null
	dist: boolean
	versionNumber: string
	timeout: number
	systemConfig: any
}

type EventRedraw<T extends Event> = T & { redraw?: boolean }
