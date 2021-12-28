declare module "global" {
	interface Class<T> {
		new(...args: any[]): T;
	}
	type TypedArray =
			| Int8Array
			| Uint8Array
			| Uint8ClampedArray
			| Int16Array
			| Uint16Array
			| Int32Array
			| Uint32Array
			| Float32Array
			| Float64Array;
}
type Values<T> = T[keyof T]
type PropertyType<T, K> = K extends keyof T ? T[K] : never;