// @flow
import o from "ospec/ospec.js"
import n from "../nodemocker"

o.spec("ApplicationWindow Test", () => {
	o.beforeEach(n.enable)
	o.afterEach(n.disable)

	n.allow([
		'../api/Env'
	])

	o("construction", () => {
		o(1).equals(1)
	})
})
