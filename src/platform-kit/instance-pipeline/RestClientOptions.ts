import { Nullable } from "@tutao/utils"
import { AesKey, VersionedKey } from "@tutao/crypto"
import { OwnerKeyProvider } from "./index"
import { RestClientOptions, SuspensionBehavior } from "@tutao/rest-client/types"

export interface EntityRestClientSetupOptions {
	baseUrl: Nullable<string>
	/** Use this key to encrypt session key instead of trying to resolve the owner key based on the ownerGroup. */
	ownerKey: Nullable<VersionedKey>
}

export interface EntityRestClientUpdateOptions {
	baseUrl: Nullable<string>
	/** Use this key to encrypt session key instead of trying to resolve the owner key based on the ownerGroup. */
	ownerKey: Nullable<VersionedKey>
}

export interface EntityRestClientEraseOptions {
	extraHeaders: Nullable<Dict>
}

/**
 * Determines how to handle caching behavior (i.e. reading/writing).
 *
 * Use {@link getCacheModeBehavior} to programmatically check the behavior of the cache mode.
 */
export const enum CacheMode {
	/** Prefer cached value if it's there, or fall back to network and write it to cache. */
	ReadAndWrite,

	/**
	 * Always retrieve from the network, but still save to cache.
	 *
	 * NOTE: This cannot be used with ranged requests.
	 */
	WriteOnly,

	/** Prefer cached value, but in case of a cache miss, retrieve the value from network without writing it to cache. */
	ReadOnly,
}

/**
 * Get the behavior of the cache mode for the options
 * @param cacheMode cache mode to check, or if `undefined`, check the default cache mode ({@link CacheMode.ReadAndWrite})
 */
export function getCacheModeBehavior(cacheMode: Nullable<CacheMode> = null): {
	readsFromCache: boolean
	writesToCache: boolean
} {
	switch (cacheMode ?? CacheMode.ReadAndWrite) {
		case CacheMode.ReadAndWrite:
			return { readsFromCache: true, writesToCache: true }
		case CacheMode.WriteOnly:
			return { readsFromCache: false, writesToCache: true }
		case CacheMode.ReadOnly:
			return { readsFromCache: true, writesToCache: false }
	}
}

export interface EntityRestClientLoadOptions {
	queryParams: Nullable<Dict>
	extraHeaders: Nullable<Dict>
	/** Use the key provided by this to decrypt the existing ownerEncSessionKey instead of trying to resolve the owner key based on the ownerGroup. */
	ownerKeyProvider: Nullable<OwnerKeyProvider>
	/** Defaults to {@link CacheMode.ReadAndWrite }*/
	cacheMode: Nullable<CacheMode>
	baseUrl: Nullable<string>
	suspensionBehavior: Nullable<SuspensionBehavior>
}

export const DEFAULT_REST_CLIENT_OPTIONS: RestClientOptions = {
	body: null,
	responseType: null,
	progressListener: null,
	baseUrl: null,
	headers: null,
	queryParams: null,
	noCORS: null,
	abortSignal: null,
	suspensionBehavior: SuspensionBehavior.Suspend,
}
export const DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS: EntityRestClientLoadOptions = {
	...DEFAULT_REST_CLIENT_OPTIONS,
	extraHeaders: null,
	ownerKeyProvider: null,
	cacheMode: CacheMode.ReadAndWrite,
}

export interface ExtraServiceParams {
	queryParams: Nullable<Dict>
	sessionKey: Nullable<AesKey>
	extraHeaders: Nullable<Dict>
	suspensionBehavior: Nullable<SuspensionBehavior>
	/** override origin for the request */
	baseUrl: Nullable<string>
	ownerKey: Nullable<VersionedKey>
}

export const DEFAULT_EXTRA_SERVICE_PARAMS: ExtraServiceParams = {
	queryParams: null,
	sessionKey: null,
	extraHeaders: null,
	suspensionBehavior: null,
	baseUrl: null,
	ownerKey: null,
}
