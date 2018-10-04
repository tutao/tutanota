//@flow

// set by the build script
declare var filesToCache: () => Array<string | URL>;
declare var version: () => string;
declare var customDomainCacheExclusions: () => Array<string>;

const isTutanotaDomain = () =>
	// *.tutanota.com or without dots (e.g. localhost). otherwise it is a custom domain
	self.location.hostname.endsWith("tutanota.com") || self.location.hostname.indexOf(".") === -1

type RequestHandler = (Request | string) => Promise<?Response>

const fromNetwork: RequestHandler = (request: string | Request) => fetch(request)

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
	_fromNetwork: RequestHandler
	_isTutanotaDomain: boolean

	constructor(caches: CacheStorage, cacheName: string, selfLocation: string, applicationPaths: string[],
	            fromNetwork: RequestHandler, isTutanotaDomain: boolean) {
		this._caches = caches
		this._cacheName = cacheName
		this._selfLocation = selfLocation
		this._possibleRest = selfLocation + "rest"
		this._applicationPaths = applicationPaths
		this._fromNetwork = fromNetwork
		this._isTutanotaDomain = isTutanotaDomain
	}

	respond(request: Request): Promise<?Response> {
		const withoutQuery = urlWithoutQuery(request.url)
		return this._fromCache(withoutQuery)
		           .then(response => response || (this._shouldRedirectToDefaultPage(request.url)
			           ? this._redirectToDefaultPage(request.url)
			           : this._fromNetwork(request)))
	}


	precache(urlsToCache: string[]): Promise<*> {
		return this._caches.open(this._cacheName).then(cache =>
			this._addAllToCache(cache, urlsToCache)
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

	_fromCache(requestUrl: string): Promise<?Response> {
		return this._caches.open(this._cacheName)
		           .then(cache => cache.match(requestUrl))
		           .then(cached => {
			           cached && console.log("SW: found in cache: ", requestUrl)
			           return cached
		           })
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
		const withoutBasePath = url.substring(this._selfLocation.length)
		const params = new URLSearchParams({r: withoutBasePath})
		return Response.redirect(`${this._selfLocation}?${params.toString()}`)
	}


	_shouldRedirectToDefaultPage(url: string): boolean {
		return !url.startsWith(this._possibleRest)
			&& url.startsWith(this._selfLocation)
			&& urlWithoutQuery(url) !== this._selfLocation // if we are already on the page we need				S
			&& this._applicationPaths.includes(this._getFirstPathComponent(url))
	}

	_getFirstPathComponent(url: string): string {
		const pathElements = url.substring(this._selfLocation.length).split("/")
		return pathElements.length > 0 ? pathElements[0] : ""
	}


}

const init = (sw: ServiceWorker, urlsToCache: string[]) => {
	self.addEventListener("install", (evt) => {
		console.log("SW: being installed")
		evt.waitUntil(sw.precache(urlsToCache))
	})
	self.addEventListener('activate', (event) => {
		event.waitUntil(sw.deleteOldCaches().then(() => self.clients.claim()))
	})
	self.addEventListener('fetch', (evt) => {
		evt.respondWith(sw.respond(evt.request))
	})
}

// do not add listeners for Node tests
if (!(env && env.mode === "Test")) {
	const cacheName = "CODE_CACHE-v" + version()
	const selfLocation = self.location.href.substring(0, self.location.href.indexOf("sw.js"))
	const exclusions = customDomainCacheExclusions()
	const urlsToCache = (isTutanotaDomain()
		? filesToCache()
		: filesToCache().filter(file => !exclusions.includes(file)))
		.map(file => selfLocation + file)
	const applicationPaths = ["login", "signup", "mail", "contact", "settings", "search", "contactform"]
	const sw = new ServiceWorker(caches, cacheName, selfLocation, applicationPaths, fromNetwork,
		isTutanotaDomain())
	init(sw, urlsToCache)
} else {
	module.exports = {ServiceWorker}
}