import o from "@tutao/otest"
import { routeMatchesPrefix } from "../../../src/common/gui/ScopedRouter.js"

o.spec("ScopedRouter", function () {
	o.spec("route matches prefix", function () {
		o("matches exact prefix", function () {
			o(routeMatchesPrefix("contact", "/contact")).equals(true)
		})

		o("matches with list id", function () {
			o(routeMatchesPrefix("contact", "/contact/teuckeon")).equals(true)
		})

		o("matches with list and element id", function () {
			o(routeMatchesPrefix("contact", "/contact/teuckeon/onteuckoec")).equals(true)
		})

		o("does not match another prefix", function () {
			o(routeMatchesPrefix("contact", "/contactlist")).equals(false)
		})

		o("does not match with id", function () {
			o(routeMatchesPrefix("contact", "/contactlist/teuckeon")).equals(false)
		})

		o("does not match empty", function () {
			o(routeMatchesPrefix("contact", "/")).equals(false)
		})

		o("route with query matches prefix", function () {
			o(routeMatchesPrefix("contact", "/contact?test=1")).equals(true)
		})
	})
})
