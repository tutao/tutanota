// set by the build script
import { getPathBases } from "../../mail-app/ApplicationPaths.js"

declare var filesToCache: () => Array<string>
declare var version: () => string
declare var customDomainCacheExclusions: () => Array<string>
declare var shouldTakeOverImmediately: () => boolean
// test case
var versionString = typeof version === "undefined" ? "test" : version()

// either tuta.com or tutanota.com without or with a subdomain or a domain without dots (e.g. localhost).
// otherwise it is a custom domain
const isTutanotaDomain = () => {
	const hostname = self.location.hostname
	return (
		hostname === "tutanota.com" ||
		hostname === "tuta.com" ||
		hostname.endsWith(".tutanota.com") ||
		hostname.endsWith(".tuta.com") ||
		hostname.indexOf(".") === -1
	)
}

const urlWithoutQuery = (urlString: string) => {
	const queryIndex = urlString.indexOf("?")
	return queryIndex !== -1 ? urlString.substring(0, queryIndex) : urlString
}

export class ServiceWorker {
	_caches: CacheStorage
	_cacheName: string
	_selfLocation: string
	_possibleRest: string
	_applicationPaths: string[]
	_isTutanotaDomain: boolean
	_urlsToCache: string[]
	_isBuggyChrome: boolean

	constructor(urlsToCache: string[], caches: CacheStorage, cacheName: string, selfLocation: string, applicationPaths: string[], isTutanotaDomain: boolean) {
		this._urlsToCache = urlsToCache
		this._caches = caches
		this._cacheName = cacheName
		this._selfLocation = selfLocation
		this._possibleRest = selfLocation + "rest"
		this._applicationPaths = applicationPaths
		this._isTutanotaDomain = isTutanotaDomain
		this._isBuggyChrome = false

		if (typeof navigator !== "undefined") {
			const results = navigator.userAgent.match(/Chrome\/([0-9]*)\./)

			if (results != null && results.length > 0) {
				const numberVersion = Number(results[1])

				if (!isNaN(numberVersion) && numberVersion < 50) {
					// Chrome 44-49 has weird bug where ByteStreams from cache are not interpreted correctly
					console.log("Buggy Chrome version detected. Deferring to no-op sw.js")
					this._isBuggyChrome = true
				}
			}
		}
	}

	respond(evt: FetchEvent): void {
		if (this._isBuggyChrome) {
			// Defer to default browser behavior
			return
		}

		const urlWithoutParams = urlWithoutQuery(evt.request.url)

		if (this._urlsToCache.indexOf(urlWithoutParams) !== -1 || (this._isTutanotaDomain && this._selfLocation === urlWithoutParams)) {
			evt.respondWith(this._fromCache(urlWithoutParams))
		} else if (/translation-.+-.+\.js/.test(urlWithoutParams)) {
			evt.respondWith(this.fromCacheOrFetchAndCache(evt.request))
		} else if (this._shouldRedirectToDefaultPage(urlWithoutParams)) {
			evt.respondWith(this._redirectToDefaultPage(evt.request.url))
		}
	}

	precache(): Promise<any> {
		return this._caches.open(this._cacheName).then((cache) =>
			this._addAllToCache(cache, this._urlsToCache)
				.then(() => cache.match("index.html"))
				.then((r: Response) => {
					if (!r) {
						return
					}

					// Reconstructing response to 1. Save it under different url 2. Get rid of redirect in response<<
					const clonedResponse: Response = r.clone()
					const bodyPromise = clonedResponse.body != null ? Promise.resolve(clonedResponse.body) : clonedResponse.blob()
					return bodyPromise
						.then(
							(body: ReadableStream | Blob) =>
								new Response(body, {
									headers: clonedResponse.headers,
									status: clonedResponse.status,
									statusText: clonedResponse.statusText,
								}),
						)
						.then((r: Response) => cache.put(this._selfLocation, r))
						.then(() => cache.delete("index.html"))
				}),
		)
	}

	deleteOldCaches(): Promise<any> {
		return this._caches
			.keys()
			.then((cacheNames) => Promise.all(cacheNames.map((cacheName) => (cacheName !== this._cacheName ? caches.delete(cacheName) : Promise.resolve()))))
			.catch((e) => {
				console.log("error while deleting old caches", e)
				throw e
			})
	}

	fromCacheOrFetchAndCache(request: Request): Promise<Response> {
		return this._caches.open(this._cacheName).then((cache) => {
			return cache.match(request.url).then((response) => {
				if (response) {
					return response
				} else {
					return fetch(request, {
						redirect: "error",
					}).then((networkResponse) => {
						return cache.put(request, networkResponse.clone()).then(() => networkResponse)
					})
				}
			})
		})
	}

	_fromCache(requestUrl: string): Promise<Response> {
		return (
			this._caches
				.open(this._cacheName)
				.then((cache) => cache.match(requestUrl)) // Cache magically disappears on iOS 12.1 after the browser restart.
				// See #758. See https://bugs.webkit.org/show_bug.cgi?id=190269
				.then((r) => r || fetch(requestUrl))
		)
	}

	// needed because FF fails to cache.addAll()
	_addAllToCache(cache: Cache, urlsToCache: string[]): Promise<any> {
		return Promise.all(
			urlsToCache.map((url) =>
				cache.add(url).catch((e) => {
					console.log("failed to add", url, e)
					throw e
				}),
			),
		)
	}

	_redirectToDefaultPage(url: string): Response {
		// We keep the hash in the url. This might lead to a situation where the client
		// has the hash twice (once encoded in "r" part and once in the url directly) but
		// the webapp has been trained to deal with it (see getStartUrl() in app.ts)
		const withoutBasePath = url.substring(this._selfLocation.length)
		const params = new URLSearchParams({
			r: withoutBasePath,
		})
		return Response.redirect(`${this._selfLocation}?${params.toString()}`)
	}

	_shouldRedirectToDefaultPage(urlWithout: string): boolean {
		return (
			!urlWithout.startsWith(this._possibleRest) &&
			urlWithout.startsWith(this._selfLocation) &&
			urlWithout !== this._selfLocation && // if we are already on the page we need
			this._applicationPaths.includes(this._getFirstPathComponent(urlWithout))
		)
	}

	_getFirstPathComponent(url: string): string {
		const pathElements = url.substring(this._selfLocation.length).split("/")
		return pathElements.length > 0 ? pathElements[0] : ""
	}
}

const init = (sw: ServiceWorker) => {
	console.log("sw init", versionString)
	const scope = self as unknown as ServiceWorkerGlobalScope

	scope.addEventListener("install", (evt: ExtendableEvent) => {
		console.log("SW: being installed", versionString)
		evt.waitUntil(
			sw.precache().then(() => {
				if (shouldTakeOverImmediately()) {
					scope.skipWaiting()
				}
			}),
		)
	})
	scope.addEventListener("activate", (event) => {
		console.log("sw activate", versionString)
		event.waitUntil(sw.deleteOldCaches().then(() => scope.clients.claim()))
	})
	scope.addEventListener("fetch", (evt: FetchEvent) => {
		sw.respond(evt)
	})
	scope.addEventListener("message", (event) => {
		console.log("sw message", versionString, event)

		if (event.data === "update") {
			scope.skipWaiting()
		}
	})
	scope.addEventListener("error", ({ error }) => {
		const serializedError = {
			name: error.name,
			message: error.message,
			stack: error.stack,
			data: error.data,
		}
		return scope.clients.matchAll().then((allClients) => {
			for (const c of allClients) {
				c.postMessage({
					type: "error",
					value: serializedError,
				})
			}
		})
	})
}

// Only exported for tests.
// We export it like this because this file is standalone and not wrapped into module loader context when bundled.
// With normal import Babel generates code which tries to set __esModule on exports but we have no exports in standalone.
// We hack module in dist.js by prepending `self.module` = {} so that the line below actually works.
// We should probably split the class and the actual content into separate files and just bundle them together during the build.
// module.exports = {ServiceWorker}-
// do not add listeners for Node tests. env is not set for production
if (typeof env === "undefined" || env.mode !== "Test") {
	const cacheName = "CODE_CACHE-v" + versionString
	const selfLocation = self.location.href.substring(0, self.location.href.indexOf("sw.js"))
	const exclusions = customDomainCacheExclusions()
	const urlsToCache = (isTutanotaDomain() ? filesToCache() : filesToCache().filter((file) => !exclusions.includes(file))).map((file) => selfLocation + file)
	const applicationPaths = getPathBases()
	const sw = new ServiceWorker(urlsToCache, caches, cacheName, selfLocation, applicationPaths, isTutanotaDomain())
	init(sw)
}
