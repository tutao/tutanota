//@flow

// set by the build script
declare var filesToCache: () => Array<string | URL>;
declare var version: () => string;
declare var customDomainCacheExclusions: () => Array<string>;

const isTutanotaDomain = () =>
	// *.tutanota.com or without dots (e.g. localhost). otherwise it is a custom domain
	self.location.hostname.endsWith("tutanota.com") || self.location.hostname.indexOf(".") === -1

const urlWithoutQuery = (urlString) => {
	const queryIndex = urlString.indexOf("?")
	return queryIndex !== -1 ? urlString.substring(0, queryIndex) : urlString
}


class ServiceWorker {
	_caches: CacheStorage
	_cacheName: string
	_selfLocation: string
	_possibleRest: string
	_applicationPaths: string[]
	_isTutanotaDomain: boolean
	_urlsToCache: string[]

	constructor(urlsToCache: string[], caches: CacheStorage, cacheName: string, selfLocation: string, applicationPaths: string[],
	            isTutanotaDomain: boolean) {
		this._urlsToCache = urlsToCache
		this._caches = caches
		this._cacheName = cacheName
		this._selfLocation = selfLocation
		this._possibleRest = selfLocation + "rest"
		this._applicationPaths = applicationPaths
		this._isTutanotaDomain = isTutanotaDomain
	}

	respond(evt: FetchEvent): void {
		const urlWithoutParams = urlWithoutQuery(evt.request.url)
		if (this._urlsToCache.indexOf(urlWithoutParams) !== -1 || (this._isTutanotaDomain && this._selfLocation === urlWithoutParams)) {
			evt.respondWith(this._fromCache(urlWithoutParams))
		} else if (this._shouldRedirectToDefaultPage(urlWithoutParams)) {
			evt.respondWith(this._redirectToDefaultPage(evt.request.url))
		}
	}


	precache(): Promise<*> {
		return this._caches.open(this._cacheName).then(cache =>
			this._addAllToCache(cache, this._urlsToCache)
			    .then(() => cache.match("index.html"))
			    .then((r: ?Response) => {
				    if (!r) {
					    return
				    }
				    // Reconstructing response to 1. Save it under different url 2. Get rid of redirect in response<<
				    const clonedResponse = r.clone()
				    const bodyPromise = 'body' in clonedResponse
					    ? Promise.resolve(clonedResponse.body)
					    : clonedResponse.blob();
				    // Casting body to "any" because Flow is missing ReadableStream option for response constructor
				    // see: https://github.com/facebook/flow/issues/6824
				    return bodyPromise.then(body =>
					    new Response((body: any), {
						    headers: clonedResponse.headers,
						    status: clonedResponse.status,
						    statusText: clonedResponse.statusText
					    })).then((r) => cache.put(this._selfLocation, r)).then(() => cache.delete("index.html"))
			    }))
	}

	deleteOldCaches(): Promise<*> {
		return this._caches.keys()
		           .then((cacheNames) => Promise.all(cacheNames.map((cacheName) =>
			           cacheName
			           !== this._cacheName ? caches.delete(cacheName) : Promise.resolve())))
		           .catch(e => {
			           console.log("error while deleting old caches", e)
			           throw e
		           })
	}

	_fromCache(requestUrl: string): Promise<Response> {
		return this._caches
		           .open(this._cacheName)
		           .then(cache => cache.match(requestUrl))
		           // Cache magically disappears on iOS 12.1 after the browser restart.
		           // See #758. See https://bugs.webkit.org/show_bug.cgi?id=190269
		           .then(r => r || fetch(requestUrl))
	}

	// needed because FF fails to cache.addAll()
	_addAllToCache(cache: Cache, urlsToCache: string[]): Promise<*> {
		return Promise.all(urlsToCache.map(url =>
			cache.add(url)
			     .catch(e => {
				     console.log("failed to add", url, e)
				     throw e
			     })
		))
	}

	_redirectToDefaultPage(url: string): Response {
		let hash = url.indexOf('#')
		const withoutBasePath = url.substring(this._selfLocation.length, hash != -1 ? hash : url.length)
		const params = new URLSearchParams({r: withoutBasePath})
		return Response.redirect(`${this._selfLocation}?${params.toString()}`)
	}


	_shouldRedirectToDefaultPage(urlWithout: string): boolean {
		return !urlWithout.startsWith(this._possibleRest)
			&& urlWithout.startsWith(this._selfLocation)
			&& urlWithout !== this._selfLocation // if we are already on the page we need
			&& this._applicationPaths.includes(this._getFirstPathComponent(urlWithout))
	}

	_getFirstPathComponent(url: string): string {
		const pathElements = url.substring(this._selfLocation.length).split("/")
		return pathElements.length > 0 ? pathElements[0] : ""
	}
}

const init = (sw: ServiceWorker) => {
	self.addEventListener("install", (evt) => {
		console.log("SW: being installed")
		evt.waitUntil(sw.precache())
	})
	self.addEventListener('activate', (event) => {
		event.waitUntil(sw.deleteOldCaches().then(() => self.clients.claim()))
	})
	self.addEventListener('fetch', (evt) => {
		sw.respond(evt)
	})
	self.addEventListener("message", (event) => {
		console.log("sw message", event)
		if (event.data === "update") {
			self.skipWaiting()
		}
	})

	self.addEventListener("error", ({error}) => {
		const serializedError = {
			name: error.name,
			message: error.message,
			stack: error.stack,
			data: error.data
		}
		return self.clients.matchAll()
		           .then((allClients) => allClients.forEach((c) => c.postMessage({type: "error", value: serializedError})))
	})
}

// do not add listeners for Node tests
if (typeof env !== "undefined" && env.mode === "Test") {
	module.exports = {ServiceWorker}
} else {
	const cacheName = "CODE_CACHE-v" + version()
	const selfLocation = self.location.href.substring(0, self.location.href.indexOf("sw.js"))
	const exclusions = customDomainCacheExclusions()
	const urlsToCache = (isTutanotaDomain()
		? filesToCache()
		: filesToCache().filter(file => !exclusions.includes(file)))
		.map(file => selfLocation + file)
	const applicationPaths = ["login", "signup", "mail", "contact", "settings", "search", "contactform"]
	const sw = new ServiceWorker(urlsToCache, caches, cacheName, selfLocation, applicationPaths, isTutanotaDomain())
	init(sw)
}