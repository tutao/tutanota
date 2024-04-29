/**
 * @file Common declarations across packages. Should be included in each package.
 */

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

declare module "*.wasm" {
	const loadWasm: (options?: { forceFallback?: boolean }) => Promise<WASMExports>

	export { loadWasm }
}
