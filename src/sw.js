//@flow

// set by the build script
declare var filesToCache: () => Array<string | URL>;
declare var version: () => string;
declare var customDomainCacheExclusions: () => Array<string>;

const CACHE = "CODE_CACHE-v" + version()

const fail = (assert?: string): any => {
	throw new Error(assert)
}

const selfLocation = self.location.href.substring(0, self.location.href.indexOf("sw.js"))

const isTutanotaDomain = () =>
	// *.tutanota.com or without dots (e.g. localhost). otherwise it is a custom domain
	self.location.hostname.endsWith("tutanota.com") || self.location.hostname.indexOf(".") === -1

const exclusions = customDomainCacheExclusions()
const urlsToCache = (isTutanotaDomain()
	? filesToCache()
	: filesToCache().filter(file => !exclusions.includes(file)))
	.map(file => selfLocation + file)

// needed because FF fails to cache.addAll()
const addAllToCache = (cache) => {
	return Promise.all(urlsToCache.map(url =>
		cache.add(url)
		     .catch(e => {
			     console.log("failed to add", url, e)
			     throw e
		     })
	))
}

const precache = () => caches.open(CACHE).then(cache =>
	addAllToCache(cache)
		.then(() => cache.match("index.html"))
		.then((r: ?Response) => {
			if (!r) {
				return
			}
			// Reconstructing response to 1. Save it under different url 2. Get rid of redirect in response
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
				})).then((r) => cache.put(selfLocation, r)).then(() => cache.delete("index.html"))
		})
)

const fromCache = (request) => caches.open(CACHE)
                                     .then(cache => cache.match(request))
                                     .then(cached => {
	                                     cached && console.log("SW: found in cache: ", request)
	                                     return cached
                                     })

const fromNetwork = (request) => fetch(request)

self.addEventListener("install", (evt) => {
	console.log("SW: being installed")
	evt.waitUntil(precache())
})

const deleteOldCaches = (): Promise<*> => caches.keys().then((cacheNames) => Promise.all(cacheNames.map((cacheName) =>
	cacheName !== CACHE ? caches.delete(cacheName) : Promise.resolve())))
                                                .catch(e => {
	                                                console.log("error while deleting old caches", e)
	                                                throw e
                                                })

self.addEventListener('activate', (event) => {
	event.waitUntil(deleteOldCaches().then(() => self.clients.claim()))
})

const urlWithoutQuery = (urlString) => {
	const queryIndex = urlString.indexOf("?")
	return queryIndex !== -1 ? urlString.substring(0, queryIndex) : urlString
}

const possibleRest = selfLocation + "rest"
const shouldServeDefaultPage = (request: Request) => {
	const withoutQuery = urlWithoutQuery(request.url)
	return withoutQuery.startsWith(selfLocation)
		&& withoutQuery !== selfLocation
		&& !withoutQuery.startsWith(possibleRest)
		&& !withoutQuery.endsWith(".html")
		&& !exclusions.includes(withoutQuery.substring(selfLocation.length))
}


const serveDefaultPage = (url: string) => {
	const withoutBasePath = url.substring(selfLocation.length)
	const params = new URLSearchParams({r: withoutBasePath})
	return Response.redirect(`${selfLocation}?${params.toString()}`)
}

self.addEventListener('fetch', (evt) => {
	const url = evt.request.url
	const withoutQuery = urlWithoutQuery(url)
	evt.respondWith(fromCache(withoutQuery).then(response => response || (shouldServeDefaultPage(evt.request)
		? serveDefaultPage(url)
		: fromNetwork(evt.request)))
	)
})