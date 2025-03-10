import { ClientModelEncryptedParsedInstance, ServerModelUntypedInstance } from "../../../../../src/common/api/common/EntityTypes"
import { assertNotNull, TypeRef } from "@tutao/tutanota-utils"
import o from "@tutao/otest"
import { TypeMapper } from "../../../../../src/common/api/worker/crypto/TypeMapper"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { ProgrammingError } from "../../../../../src/common/api/common/error/ProgrammingError"
import { testAggregateModel, testTypeModel } from "./InstancePipelineTestUtils"
import { TypeReferenceResolver } from "../../../../../src/common/api/common/EntityFunctions"

const serverModelUntypedInstanceNetworkDebugging: ServerModelUntypedInstance = {
	"1:testValue": "test string",
	"3:testAssociation": [{ "2:testNumber": "123" }],
	"4:testListAssociation": ["assocId"],
	"5:testDate": "1735736415000",
	"7:testBoolean": "encryptedBool",
} as unknown as ServerModelUntypedInstance

const serverModelUntypedInstance: ServerModelUntypedInstance = {
	"1": "test string",
	"3": [{ "2": "123" }],
	"4": ["assocId"],
	"5": "1735736415000",
	"7": "encryptedBool",
} as unknown as ServerModelUntypedInstance

const clientModelEncryptedParsedInstance: ClientModelEncryptedParsedInstance = {
	"1": "base64EncodedString",
	"3": [{ "2": "123" }],
	"4": ["assocId"],
	"5": new Date("2025-01-01T13:00:15Z"),
	"7": "encryptedBool",
} as unknown as ClientModelEncryptedParsedInstance

const faultyEncryptedParsedInstance: ClientModelEncryptedParsedInstance = {
	"1": new Uint8Array(2),
	"3": [{ "2": "123" }],
	"4": ["assocId"],
	"5": new Date("2025-01-01T13:00:15Z"),
} as unknown as ClientModelEncryptedParsedInstance

o.spec("TypeMapper", function () {
	let typeMapper: TypeMapper
	o.beforeEach(() => {
		const dummyResolver = (tr: TypeRef<unknown>) => {
			const model = tr.typeId === 42 ? testTypeModel : testAggregateModel
			return Promise.resolve(model)
		}
		typeMapper = new TypeMapper(dummyResolver as TypeReferenceResolver, dummyResolver as TypeReferenceResolver)
	})

	o.spec("applyJsTypes", function () {
		o("can handle associations and aggregations", async function () {
			const encryptedParsedInstance = await typeMapper.applyJsTypes(testTypeModel, serverModelUntypedInstance)
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
			const instance = await typeMapper.applyDbTypes(testTypeModel, clientModelEncryptedParsedInstance)
			o(instance["1"]).equals("base64EncodedString")
			o(instance["3"]![0]["2"]).equals("123")
			o(instance["5"]).equals("1735736415000")
		})
	})

	o.spec("networkDebugging works", function () {
		o.before(() => {
			env.networkDebugging = true
		})

		o.after(() => {
			env.networkDebugging = false
		})

		o("can handle associations and aggregations with network debugging enabled", async function () {
			const encryptedParsedInstance = await typeMapper.applyJsTypes(testTypeModel, serverModelUntypedInstanceNetworkDebugging)
			o(encryptedParsedInstance["1"]).equals("test string")
			const listAssociation = assertNotNull(encryptedParsedInstance["4"])
			const aggregation = assertNotNull(encryptedParsedInstance["3"])
			o(aggregation[0]["2"]).equals("123")
			o(listAssociation[0]).equals("assocId")
			o((encryptedParsedInstance["5"] as Date).toISOString()).equals(new Date("2025-01-01T13:00:15Z").toISOString())
		})

		o("can apply db types with network debugging enabled", async function () {
			const instance = await typeMapper.applyDbTypes(testTypeModel, clientModelEncryptedParsedInstance)
			o(instance["1:testValue"]).equals("base64EncodedString")
			o(instance["3:testAssociation"]![0]["2:testNumber"]).equals("123")
			o(instance["5:testDate"]).equals("1735736415000")
		})
	})
})
