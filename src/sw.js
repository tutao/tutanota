//@flow

const CACHE = "cache-and-update-code"

// set by the build script
declare var filesToCache: () => Array<string>;

const selfLocation = self.location.href.substring(0, self.location.href.indexOf("sw.js"))
const urlsToCache = filesToCache().map(file => selfLocation + file)

console.log("requests to add", JSON.stringify(urlsToCache))

const precache = () => caches.open(CACHE).then(cache => cache.addAll(urlsToCache))

const fromCache = (request) => caches.open(CACHE).then(cache => {
	console.log("SW: from cache:", request)
	return cache.match(request)
})

const fromNetwork = (request) => {
	console.log("SW: from network:", request)
	return fetch(request)
}

// const update = (request) => caches.open(CACHE)
//                                   .then(cache => fetch(request).then(response => cache.put(request, response)))

self.addEventListener("install", (evt) => {
	console.log("SW: being installed")
	evt.waitUntil(precache())
})

self.addEventListener('fetch', (evt) => {
	evt.respondWith(urlsToCache.includes(evt.request.url) ? fromCache(evt.request) : fromNetwork(evt.request))
})