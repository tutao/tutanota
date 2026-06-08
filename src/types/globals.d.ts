/**
 * @file Common declarations across packages. Should be included in each package.
 */

declare type IntervalID = ReturnType<setInterval>
declare type TimeoutID = ReturnType<setTimeout>
declare type AnimationFrameID = ReturnType<requestAnimationFrame>

declare interface Class<T> {
	new (...args: any[]): T
}

declare type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array

declare type Values<T> = T[keyof T]
declare type PropertyType<T, K> = K extends keyof T ? T[K] : never

declare type Id = string
declare type IdTuple = Readonly<[Id, Id]>

declare type Writeable<T> = { -readonly [P in keyof T]: T[P] }

declare type None = null | undefined

/* eslint-disable no-var */
declare type NumberString = string
declare type Dict = { [key: string]: string }
declare type NonEmptyString = `${any}${string}`

/** Requests from main web thread to worker */
declare type WorkerRequestType = "setup" | "reset" | "testEcho" | "testError" | "restRequest" | "facade"

/** Requests from worker web thread to main web thread */
declare type MainRequestType = "facade" | "execNative" | "error"

/** Requests from web to native */
declare type NativeRequestType = "ipc" | "facade"

/** Requests from native to web */
declare type JsRequestType = "ipc"

declare type EnvMode = Mode

/** A map from hostname to parameters for that domain. */
type DomainConfigMap = Record<string, DomainConfig>

declare type Env = EnvType
declare var env: Env

type EventRedraw<T extends Event> = T & { redraw?: boolean }

/**
 * See Env.ts for explanation.
 */
declare var LOAD_ASSERTIONS: boolean

interface NativeApp {
	// In desktop, we can pass whole objects
	// In app, we can only pass strings
	invoke(message: any)

	attach(handler: (JsMessage) => unknown)

	getPathForFile(file: File): string

	startWebMessageChannel() // Available in android
}

// AppType is defined in @tutao/app-env
// Do not import the enum here since this will break globals.d.ts

declare const APP_TYPE: AppType

declare type Base64 = string
declare type Base64Ext = string
declare type Base64Url = string
declare type Hex = string
