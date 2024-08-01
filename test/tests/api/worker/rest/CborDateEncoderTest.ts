import o from "@tutao/otest"
import * as cborg from "cborg"
import { customTypeDecoders, customTypeEncoders } from "../../../../../src/common/api/worker/offline/OfflineStorage.js"

o.spec("CborDateEncoder", function () {
	o("encode and decode date", function () {
		const date = new Date(2022, 0, 24, 10, 54)
		const obj = { field: date }
		const encoded = cborg.encode(obj, { typeEncoders: customTypeEncoders })
		const decoded = cborg.decode(encoded, { tags: customTypeDecoders })
		o(decoded).deepEquals(obj)
	})
})
