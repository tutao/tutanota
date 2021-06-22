declare function unescape(s: string): string;

declare function escape(s: string): string;


declare class Crypto {
	subtle: Subtle;
	getRandomValues(array: Uint8Array | Uint32Array): void;
}

declare class Subtle {
	importKey(format: string, keyData: Uint8Array, algo: string, extractable: boolean, usages: string[]): Promise<CryptoKey>;
	encrypt(algo: Object, key: CryptoKey, cleartext: Uint8Array): Promise<Uint8Array>;
	decrypt(algo: Object, key: CryptoKey, ciphertext: Uint8Array): Promise<Uint8Array>;
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

type Bluebird$ConcurrencyOption = {
	concurrency: number,
};

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
	isFulfilled(): boolean;
	isRejected(): boolean;
	isPending(): boolean;
	value(): R;

	static fromCallback<T>(resolver: ((error?: ?any, value?: T) => void) => mixed): Promise<T>;
	static map<T, U>(array: $Promisable<Iterable<T>>,
	                 mapper: (item: T, index: number, arrayLength: number) => Promise<U> | U,
	                 options?: Bluebird$ConcurrencyOption): Promise<U[]>;
	static mapSeries<T, U>(array: $Promisable<Iterable<T>>,
	                       mapper: (item: T, index: number, arrayLength: number) => Promise<U> | U
	): Promise<U[]>;
	static reduce<T, U>(array: $Promisable<Iterable<T>>, mapper: (accumulator: U, item: T, index: number, arrayLength: number) => (Promise<U> | U), initialValue: U): Promise<U>;
	static filter<T>(array: Promise<Array<T>> | Array<T>, iterator: (item: T, index: number, arrayLength: number) => Promise<boolean> | boolean): Promise<T[]>;
	static config(configuration: Object): void;

	static onPossiblyUnhandledRejection(errorHandler: Function): void;
}

declare type $Promisable<+T> = Promise<T> | T;
