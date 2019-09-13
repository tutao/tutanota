import o from "ospec"
import {sanitizeFilename} from "../../../../src/api/common/utils/FileUtils"

o.spec("sanitizeFilename Test", function () {
	o(sanitizeFilename("hello")).equals("hello")
	o(sanitizeFilename("foo/bar")).equals("foo_bar")
	o(sanitizeFilename("\x001/./  ")).equals("_1_.___")
})

