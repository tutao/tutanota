import o from "@tutao/otest"
import { ProgrammingError, TutanotaError } from "../../../src/platform-kit/app-env"

o.spec("TutanotaErrorTest", function () {
	o("error name should be correct", () => {
		o(new ProgrammingError().name).equals("ProgrammingError")
		o(new ProgrammingError() instanceof ProgrammingError).equals(true)
		o(new ProgrammingError() instanceof TutanotaError).equals(true)
	})
})
