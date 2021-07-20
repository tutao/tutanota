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

declare type $Promisable<+T> = Promise<T> | T;
