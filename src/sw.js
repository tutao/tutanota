//@flow

// set by the build script
declare var filesToCache: () => Array<string | URL>;
declare var version: () => string;

const CACHE = "CODE_CACHE-v" + version()

const fail = (assert?: string): any => {
	throw new Error(assert)
}

const selfLocation = self.location.href.substring(0, self.location.href.indexOf("sw.js"))
const urlsToCache = filesToCache().map(file => selfLocation + file)

console.log("requests to add", JSON.stringify(filesToCache()))

const precache = () => caches.open(CACHE).then(cache =>
	cache.addAll(urlsToCache)
	     .then(() => cache.match("index.html"))
	     .then((r: Response) => {
		     const {
			     headers,
			     status,
			     statusText,
			     body = fail("Request for index.html had no body or stream is not supported")
		     } = r.clone()
		     // Casting body to "any" because Flow is missing ReadableStream option for response constructor
		     // see: https://github.com/facebook/flow/issues/6824
		     return new Response((body: any), {
			     headers,
			     status,
			     statusText
		     })
	     })
	     .then((r) => cache.put(selfLocation, r))
	     .then(() => cache.delete("index.html"))
)

const fromCache = (request) => caches.open(CACHE)
                                     .then(cache => cache.match(request))
                                     .then(cached => {
	                                     cached && console.log("SW: found in cache: ", request)
	                                     return cached
                                     })

const fromNetwork = (request) => {
	console.log(`SW: from network: ${request.url || request }`)
	return fetch(request)
}

self.addEventListener("install", (evt) => {
	console.log("SW: being installed")
	evt.waitUntil(precache())
})

const deleteOldCaches = (): Promise<*> => caches.keys().then((cacheNames) => Promise.all(cacheNames.map((cacheName) =>
	cacheName === CACHE ? caches.delete(cacheName) : Promise.resolve())))

self.addEventListener('activate', (event) => {
	event.waitUntil(deleteOldCaches())
});

const urlWithoutQuery = (urlString) => {
	const queryIndex = urlString.indexOf("?")
	return queryIndex > 0 ? urlString.substring(0, urlString.indexOf("?")) : urlString
}

const possibleRest = selfLocation + "rest"
const shouldServeDefaultPage = (request: Request) => request.url.startsWith(selfLocation)
	&& !request.url.startsWith(possibleRest)

self.addEventListener('fetch', (evt) => {
	const url = evt.request.url
	const withoutQuery = urlWithoutQuery(url)
	evt.respondWith(fromCache(withoutQuery).then(response => response || (shouldServeDefaultPage(evt.request)
		? (() => {
			console.log("serving default page for ", url)
			const withoutBasePath = url.substring(selfLocation.length)
			const params = new URLSearchParams({r: withoutBasePath})
			return Response.redirect(`${selfLocation}?${params.toString()}`) //fromCache(selfLocation)
		})()
		: fromNetwork(evt.request)))
	)
})