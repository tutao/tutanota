import o from "@tutao/otest"
import "./UtilsTest.js"
import "./MapUtilsTest.js"
import "./ArrayUtilsTest.js"
import "./CollectionUtilsTest.js"
import "./EncodingTest.js"
import "./PromiseUtilTest.js"
import "./SortedArrayTest.js"
import "./MathUtilsTest.js"
import "./LazyLoadedTest.js"
import "./CsvTest.js"
import "./TokenizerTest.js"

const result = await o.run()
o.printReport(result)
o.terminateProcess(result)
