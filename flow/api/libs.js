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

declare var __moduleName: string;

// see https://developer.mozilla.org/en-US/docs/Web/API/DedicatedWorkerGlobalScope
declare class DedicatedWorkerGlobalScope {
	onmessage: Function;
	navigator: Navigator;
	postMessage(message: Object): void;
}

type Bluebird$ConcurrencyOption = {
	concurrency: number,
};

declare type $Promisable<T> = Promise<T> | T;

declare class Promise<+R> {
	constructor(callback: (resolve: (result: Promise<R> | R) => void,
	                       reject: (error: any) => void) => mixed): void;

	then<U>(onFulfill?: (value: R) => Promise<U> | U, onReject?: (error: any) => Promise<U> | U): Promise<U>;

	catch<U>(onReject?: (error: any) => ?Promise<U> | U): Promise<U>;
	catch<U, ErrorT: Error>(err: Class<ErrorT>, onReject: (error: ErrorT) => ?Promise<U> | U): Promise<U>;

	finally<U>(onDone?: () => mixed): Promise<U>;

	each<T, U>(iterator: (item: T, index: number, arrayLength: number) => Promise<U> | U): Promise<T[]>;

	map<T, U>(mapper: (item: T, index: number, arrayLength: number) => Promise<U> | U, options?: Bluebird$ConcurrencyOption): Promise<Array<U>>;

	filter<T>(iterator: (item: T, index: number, arrayLength: number) => Promise<boolean> | boolean): Promise<T[]>;

	isFulfilled(): boolean;
	isPending(): boolean;

	return<T>(returnValue: T): Promise<T>;

	reduce<T>(mapper: (accumulator: any, item: T, index: number, arrayLength: number) => any, initialValue: any): Promise<any>;

	spread<T>(...args: Array<T>): Promise<*>;

	delay<T>(millis: number): Promise<T>;

	tap(handler: (R => $Promisable<mixed>)): Promise<R>;

	static resolve<T>(object?: Promise<T> | T): Promise<T>;
	static reject<T>(error?: any): Promise<T>;
	static all<T, Elem: $Promisable<T>>(elements: Array<Elem>): Promise<Array<T>>;
	static try<T>(fn: () => $Promisable<T>): Promise<T>;
	static race<T, Elem: Promise<T> | T>(promises: Array<Elem>): Promise<T>;
	static fromCallback<T>(resolver: ((error?: ?any, value?: T) => void) => mixed): Promise<T>;
	static map<T, U>(array: Promise<Iterable<T>> | Iterable<T>,
	                 mapper: (item: T, index: number, arrayLength: number) => Promise<U> | U,
	                 options?: Bluebird$ConcurrencyOption): Promise<U[]>;
	static each<T, U>(array: Promise<Iterable<T>> | Iterable<T>, mapper: (item: T, index: number, arrayLength: number) => Promise<U> | U): Promise<T[]>;

	static join<T, A, B>(value1: $Promisable<A>, value2: $Promisable<B>, handler: (a: A, b: B) => $Promisable<T>): Promise<any>;
	static join<T, A, B, C>(value1: $Promisable<A>, value2: $Promisable<B>, value3: $Promisable<C>, handler: (a: A, b: B, c: C) => $Promisable<T>): Promise<any>;
	static join<T, A, B, C, D>(value1: $Promisable<A>, value2: $Promisable<B>, value3: $Promisable<C>, value4: $Promisable<D>, handler: (a: A, b: B, c: C, d: D) => $Promisable<T>): Promise<any>;
	static join<T, A, B, C, D, E>(value1: $Promisable<A>, value2: $Promisable<B>, value3: $Promisable<C>, value4: $Promisable<D>, value5: $Promisable<E>, handler: (a: A, b: B, c: C, d: D, e: E) => $Promisable<T>): Promise<any>;
	static join<T, A, B, C, D, E, F>(value1: $Promisable<A>, value2: $Promisable<B>, value3: $Promisable<C>, value4: $Promisable<D>, value5: $Promisable<E>, value6: $Promisable<F>, handler: (a: A, b: B, c: C, d: D, e: E, f: F) => $Promisable<T>): Promise<any>;

	static reduce<T, U>(array: Promise<Array<T>> | Array<T>, mapper: (accumulator: U, item: T, index: number, arrayLength: number) => (Promise<U> | U), initialValue: U): Promise<U>;
	static filter<T>(array: Promise<Array<T>> | Array<T>, iterator: (item: T, index: number, arrayLength: number) => Promise<boolean> | boolean): Promise<T[]>;
	static delay<T>(millis: number, value: ?T | Promise<T>): Promise<T>;
	static any<T>(array: Array<Promise<T>>): Promise<T>;
	static config(configuration: Object): void;

	static onPossiblyUnhandledRejection(errorHandler: Function): void;
}
