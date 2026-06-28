import o from "@tutao/otest"
import { desktopAgentOptions } from "../../../../src/applications/common/desktop/net/NetAgent.js"

o.spec("NetAgent", function () {
	o("sets an explicit autoSelectFamilyAttemptTimeout when autoSelectFamily is enabled", function () {
		if (desktopAgentOptions.autoSelectFamily) {
			o(typeof desktopAgentOptions.autoSelectFamilyAttemptTimeout).equals("number")
			o(desktopAgentOptions.autoSelectFamilyAttemptTimeout > 250).equals(true)
		}
	})
})
