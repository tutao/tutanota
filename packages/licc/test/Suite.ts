import o from "@tutao/otest"

import "./ParserTest.js"

const result = await o.run()
o.printReport(result)
o.terminateProcess(result)
