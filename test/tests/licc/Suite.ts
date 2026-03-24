import o from "@tutao/otest"

import "./ParserTest"

const result = await o.run()
o.printReport(result)
o.terminateProcess(result)
