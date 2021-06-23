declare function unescape(s: string): string;

declare function escape(s: string): string;


declare class Crypto {
	subtle: Subtle;
	getRandomValues(array: Uint8Array | Uint32Array): void;
}

interface Algorithm {
	name: string;
}

type AlgorithmIdentifier = string | Algorithm;

declare class Subtle {
	importKey(format: string, keyData: Uint8Array, algo: string, extractable: boolean, usages: string[]): Promise<CryptoKey>;
	encrypt(algo: Object, key: CryptoKey, cleartext: Uint8Array): Promise<Uint8Array>;
	decrypt(algo: Object, key: CryptoKey, ciphertext: Uint8Array): Promise<Uint8Array>;
	digest(algorithm: AlgorithmIdentifier, data: Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer): Promise<ArrayBuffer>;
}

declare class CryptoKey {
}

declare var crypto: Crypto;
declare var msCrypto: Crypto;

declare class SystemType {
	baseURL: string;
	babelOptions: Object;
	paths: Object;
	loads: Object;
	import(moduleName: string, normalizedParentName: ?string): Promise<*>;
	normalizeSync(moduleName: string): string;
	config(config: Object): void;
	getConfig(): Object;
	resolveSync(moduleName: string): string;
}

declare var System: SystemType

declare function importScripts(...urls: string[]): void;


// // see https://developer.mozilla.org/en-US/docs/Web/API/DedicatedWorkerGlobalScope
// declare class DedicatedWorkerGlobalScope {
// 	onmessage: Function;
// 	navigator: Navigator;
// 	postMessage(message: Object): void;
// }

declare class Promise<+R> {
	// standard
	constructor(callback: (resolve: (result: Promise<R> | R) => void,
	                       reject: (error: any) => void) => mixed): void;
	then<U>(onFulfill?: (value: R) => Promise<U> | U, onReject?: (error: any) => Promise<U> | U): Promise<U>;
	catch<U>(onReject?: (error: any) => ?Promise<U> | U): Promise<U | R>;
	finally<R>(onDone?: () => mixed): Promise<R>;

	static resolve<T>(object: Promise<T> | T): Promise<T>;
	static reject<T>(error?: any): Promise<T>;
	static all<T: Iterable<mixed>>(promises: T): Promise<$TupleMap<T, typeof $await>>;
	static race<T, Elem: Promise<T> | T>(promises: Array<Elem>): Promise<T>;

	// non-standard
	static fromCallback<T>(resolver: ((error?: ?any, value?: T) => void) => mixed): Promise<T>;
	static config(configuration: Object): void;

	static onPossiblyUnhandledRejection(errorHandler: Function): void;
}

declare type $Promisable<+T> = Promise<T> | T;
