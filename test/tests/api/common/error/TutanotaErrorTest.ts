import o from "ospec"
import {ProgrammingError} from "../../../../../src/api/common/error/ProgrammingError.js"
import {TutanotaError} from "../../../../../src/api/common/error/TutanotaError.js"
o.spec("TutanotaErrorTest", function () {
    o("error name should be correct", () => {
        o(new ProgrammingError().name).equals("ProgrammingError")
        o(new ProgrammingError() instanceof ProgrammingError).equals(true)
        o(new ProgrammingError() instanceof TutanotaError).equals(true)
    })
})