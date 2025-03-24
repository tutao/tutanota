import { EncryptedParsedInstance, UntypedInstance } from "../../../../../src/common/api/common/EntityTypes"
import { assertNotNull, TypeRef } from "@tutao/tutanota-utils"
import o from "@tutao/otest"
import { TypeMapper } from "../../../../../src/common/api/worker/crypto/TypeMapper"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError"
import { testAggregateModel, testTypeModel } from "./InstancePipelineTestUtils"

const untypedInstance: UntypedInstance = { "1": "test string", "3": [{ "2": "123" }], "4": ["assocId"], "5": "1735736415000", "7": "encryptedBool" }
const encryptedParsedInstance: EncryptedParsedInstance = {
	"1": "base64EncodedString",
	"3": [{ "2": "123" }],
	"4": ["assocId"],
	"5": new Date("2025-01-01T13:00:15Z"),
	"7": "encryptedBool",
}

const faultyEncryptedParsedInstance: EncryptedParsedInstance = {
	"1": new Uint8Array(2),
	"3": [{ "2": "123" }],
	"4": ["assocId"],
	"5": new Date("2025-01-01T13:00:15Z"),
}

o.spec("TypeMapper", function () {
	let typeMapper: TypeMapper
	o.beforeEach(() => {
		const dummyResolver = (tr: TypeRef<unknown>) => {
			const model = tr.typeId === 42 ? testTypeModel : testAggregateModel
			return Promise.resolve(model)
		}
		typeMapper = new TypeMapper(dummyResolver)
	})

	o.spec("applyJsTypes", function () {
		o("can handle associations and aggregations", async function () {
			const encryptedParsedInstance = await typeMapper.applyJsTypes(testTypeModel, untypedInstance)
			o(encryptedParsedInstance["1"]).equals("test string")
			const listAssociation = assertNotNull(encryptedParsedInstance["4"])
			const aggregation = assertNotNull(encryptedParsedInstance["3"])
			o(aggregation[0]["2"]).equals("123")
			o(listAssociation[0]).equals("assocId")
			o((encryptedParsedInstance["5"] as Date).toISOString()).equals(new Date("2025-01-01T13:00:15Z").toISOString())
		})
	})

	o.spec("applyDbTypes", function () {
		o("throws error for invalid encrypted values", async function () {
			await assertThrows(ProgrammingError, () => typeMapper.applyDbTypes(testTypeModel, faultyEncryptedParsedInstance))
		})

		o("can apply db types", async function () {
			const instance = await typeMapper.applyDbTypes(testTypeModel, encryptedParsedInstance)
			o(instance["1"]).equals("base64EncodedString")
			o(instance["3"]![0]["2"]).equals("123")
			o(instance["5"]).equals("1735736415000")
		})
	})
})
