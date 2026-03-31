import o from "@tutao/otest"
import "./UtilsTest"
import "./MapUtilsTest"
import "./ArrayUtilsTest"
import "./CollectionUtilsTest"
import "./EncodingTest"
import "./PromiseUtilTest"
import "./SortedArrayTest"
import "./MathUtilsTest"
import "./LazyLoadedTest"
import "./CsvTest"
import "./TokenizerTest"
import "./TimeUtilsTest"

const result = await o.run()
o.printReport(result)
