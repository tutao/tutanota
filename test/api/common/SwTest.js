// @flow
import o from "ospec/ospec.js"
import {ServiceWorker} from "../../../src/serviceworker/sw.js"

const fromNetwork = (url: string) => ({}: any)

o.spec("ServiveWorkerTest ", node(function () {
	const root = "https://test/"
	let caches: CacheStorage = ({}: any)
	let sw: ServiceWorker
	let exclusions

	o.before((done, timeout) => {
		exclusions = []
		sw = new ServiceWorker(caches, "testCache", root, exclusions, fromNetwork,
			true)
		done()
	})


	o("shouldRedirectWithHttp", function () {
		o(sw._shouldRedirectToDefaultPage(root + "index.html")).equals(true)
	})

	o("shouldNotRedirectRoot", function () {
		o(sw._shouldRedirectToDefaultPage(root)).equals(false)
	})

	o("shouldRedirectWithPath", function () {
		o(sw._shouldRedirectToDefaultPage(root + "mail/blah/someId")).equals(true)
	})

	o("shouldNotRedirectRestRequests", function () {
		o(sw._shouldRedirectToDefaultPage(root + "rest/draftservice")).equals(false)
	})

	o("shouldNotRedirectExclusionOnCustonDomain", function () {
		sw = new ServiceWorker(caches, "testCache", root, exclusions, fromNetwork, false)
		exclusions.push("index.html")
		exclusions.push("index.js")
		o(sw._shouldRedirectToDefaultPage(root + "index.html")).equals(false)
		o(sw._shouldRedirectToDefaultPage(root + "index.js")).equals(false)
	})

	o("shouldRedirectOnCustonDomain", function () {
		sw = new ServiceWorker(caches, "testCache", root, exclusions, fromNetwork,
			false)
		exclusions.push("index.html")
		o(sw._shouldRedirectToDefaultPage(root + "mail/blah")).equals(true)
	})
}))