//@flow

import o from "ospec/ospec.js"
import {mapInCallContext, thenOrApply} from "../../../src/api/common/utils/PromiseUtils"


o.spec("PromiseUtils", function () {
	o.spec("mapInCallContexnt", function () {
		o("works for values", function () {
			o(mapInCallContext([1, 2, 3, 4], (v) => v + 1))
				.deepEquals([2, 3, 4, 5])
		})

		o("works for promises", async function () {
			o(await mapInCallContext([1, 2, 3, 4], (v) => Promise.resolve(v + 1)))
				.deepEquals([2, 3, 4, 5])
		})

		o("works for mix of promises & values", async function () {
			o(await mapInCallContext([1, 2, 3, 4], (v) => v % 2 === 0 ? Promise.resolve(v + 1) : v + 1))
				.deepEquals([2, 3, 4, 5])
		})
	})

	o.spec("thenOrApply", function () {
		o("works for values", function () {
			o(thenOrApply("Tuta", (v) => v + "nota")).equals("Tutanota")
		})

		o("works for promises", async function () {
			o(await thenOrApply("Encrypted", (v) => v + " mails"))
				.equals("Encrypted mails")
		})
	})
})