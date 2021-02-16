// @flow

import o from "ospec"
import {GENERATED_MAX_ID, GENERATED_MIN_ID} from "../../../src/api/common/utils/EntityUtils"
import {mailIdToFileName} from "../../../src/desktop/DesktopFileExport"

o.spec("DesktopFileExport", function () {

	o("test generated filenames will be non-clobbering when case insensitivity is involved", function () {
		const inputOutputs = [
			[[GENERATED_MIN_ID, GENERATED_MIN_ID], GENERATED_MIN_ID + GENERATED_MIN_ID + ".msg"],
			[[GENERATED_MIN_ID, GENERATED_MAX_ID], GENERATED_MIN_ID + GENERATED_MAX_ID + ".msg"],
			[[GENERATED_MAX_ID, GENERATED_MIN_ID], GENERATED_MAX_ID + GENERATED_MIN_ID + ".msg"],
			[[GENERATED_MAX_ID, GENERATED_MAX_ID], GENERATED_MAX_ID + GENERATED_MAX_ID + ".msg"],
			[["____________", "____________"], "________________________.msg"],
			[["0123456789Ab", "0123456789aB"], "0123456789$Ab0123456789a$B.msg"],
			[["asdfghjklzxc", "QWERTYUIOPAS"], "asdfghjklzxc$Q$W$E$R$T$Y$U$I$O$P$A$S.msg"]
		]

		for (let [input, output] of inputOutputs) {
			o(mailIdToFileName(input, "msg")).equals(output)
		}
	})
})