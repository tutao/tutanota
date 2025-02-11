import o from "@tutao/otest"
import { ServiceWorker } from "../../../src/common/serviceworker/sw.js"
import { object, when } from "testdouble"

o.spec(
	"ServiveWorkerTest ",
	node(function () {
		const root = "https://test/"
		let caches: CacheStorage = {} as any
		let sw: ServiceWorker
		let exclusions
		let applicationPaths = ["mail", "login"]
		o.before(function () {
			exclusions = []
			sw = new ServiceWorker([], caches, "testCache", root, applicationPaths, true)
		})
		o("shouldNotRedirectRootFile", function () {
			o(sw._shouldRedirectToDefaultPage(root + "index.html")).equals(false)
		})
		o("shouldNotRedirectOtherResource", function () {
			o(sw._shouldRedirectToDefaultPage(root + "images/test.png")).equals(false)
		})
		o("shouldNotRedirectRoot", function () {
			o(sw._shouldRedirectToDefaultPage(root)).equals(false)
		})
		o("shouldRedirectWithPath", function () {
			o(sw._shouldRedirectToDefaultPage(root + "mail/blah/someId")).equals(true)
		})
		o("shouldRedirectWithMailPathComponent", function () {
			o(sw._shouldRedirectToDefaultPage(root + "mail")).equals(true)
		})
		o("shouldNotRedirectWithUnknownPath", function () {
			o(sw._shouldRedirectToDefaultPage(root + "otherpath/blah/someId")).equals(false)
		})
		o("shouldNotRedirectRestRequests", function () {
			o(sw._shouldRedirectToDefaultPage(root + "rest/draftservice")).equals(false)
		})
		o("shouldNotRedirectExclusionOnCustonDomain", function () {
			sw = new ServiceWorker([], caches, "testCache", root, applicationPaths, false)
			exclusions.push("index.html")
			exclusions.push("index.js")
			o(sw._shouldRedirectToDefaultPage(root + "index.html")).equals(false)
			o(sw._shouldRedirectToDefaultPage(root + "index.js")).equals(false)
		})
		o("shouldRedirectOnCustonDomain", function () {
			sw = new ServiceWorker([], caches, "testCache", root, applicationPaths, false)
			exclusions.push("index.html")
			o(sw._shouldRedirectToDefaultPage(root + "mail/blah")).equals(true)
		})

		o("shouldTakeOverImmediately - empty cache", async function () {
			sw = new ServiceWorker([], caches, "CODE_CACHE-v267.250206.0", root, applicationPaths, false)
			const cacheStorage: CacheStorage = object()
			when(cacheStorage.keys()).thenResolve([])
			o(await sw.shouldTakeOverImmediately(cacheStorage)).equals(false)
		})

		o("shouldTakeOverImmediately - version is below or equal minim installation version", async function () {
			sw = new ServiceWorker([], caches, "CODE_CACHE-v267.250206.0", root, applicationPaths, false)
			const cacheStorage: CacheStorage = object()
			when(cacheStorage.keys()).thenResolve(["CODE_CACHE-v266.250202.0", "CODE_CACHE-v267.250206.0"])
			o(await sw.shouldTakeOverImmediately(cacheStorage)).equals(true)
		})

		o("shouldTakeOverImmediately - version higher than minimum installation version", async function () {
			sw = new ServiceWorker([], caches, "CODE_CACHE-v267.250208.0", root, applicationPaths, false)
			const cacheStorage: CacheStorage = object()
			when(cacheStorage.keys()).thenResolve(["CODE_CACHE-v267.250207.0", "CODE_CACHE-v267.250208.0"])
			o(await sw.shouldTakeOverImmediately(cacheStorage)).equals(false)
		})

		o("shouldTakeOverImmediately - invalid cache name", async function () {
			sw = new ServiceWorker([], caches, "testCache", root, applicationPaths, false)
			const cacheStorage: CacheStorage = object()
			when(cacheStorage.keys()).thenResolve(["invalidName", "testCache"])
			o(await sw.shouldTakeOverImmediately(cacheStorage)).equals(false)
		})
	}),
)
