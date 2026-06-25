import { ClientTypeModel, ServerTypeModel } from "../../../src/platform-kit/meta"
import o, { assertThrows } from "@tutao/otest"
import { EncryptedParsedInstance, TypeModelResolver } from "../../../src/platform-kit/instance-pipeline"
import { ProgrammingError } from "../../../src/platform-kit/app-env"
import { DummyTypeModelResolver, testAggregateModel, testTypeModel } from "./InstancePipelineTestUtils"
import { IncomingServerJson, TypeMapper } from "../../../src/platform-kit/instance-pipeline/TypeMapper"
import { ParsedValue } from "../../../src/platform-kit/instance-pipeline/ParsedValue"

const networkDebuggedIncomingJson = `{
	"1:testValue": "test string",
	"3:testAssociation": [
		{
			"2:testNumber": "123",
			"9:testSecondLevelAssociation": [],
			"10:testZeroOrOneAggregation": [],
		},
	],
	"4:testListAssociation": ["assocId"],
	"5:testDate": "1735736415000",
	"7:testBoolean": "encryptedBool",
	"15:testFinalBoolean": "encryptedFinalBool",
}`

const incomingJson = `{
	"1": "test string",
	"4": ["assocId"],
	"5": "1735736415000",
	"7": "encryptedBool",
	"15": "encryptedFinalBool",
	"3": [{ "2": "123", "9": [], "10": [] }],
}`
const incomingParsedInstance = EncryptedParsedInstance.incomingFromServer(testTypeModel as ServerTypeModel)
	.addAttributeById(1, ParsedValue.fromString("test string"))
	.addAttributeById(4, ParsedValue.fromIdList(["assocId"]))
	.addAttributeById(5, ParsedValue.fromString("1735736415000"))
	.addAttributeById(7, ParsedValue.fromString("encryptedBool"))
	.addAttributeById(15, ParsedValue.fromString("encryptedFinalBool"))
	.addAttributeById(
		3,
		ParsedValue.fromNestedItems([
			EncryptedParsedInstance.incomingFromServer(testAggregateModel as ServerTypeModel)
				.addAttributeById(2, ParsedValue.fromString("123"))
				.addAttributeById(9, ParsedValue.fromIdList([]))
				.addAttributeById(10, ParsedValue.fromIdList([])),
		]),
	)

const outgoingJson = `{
	"1": "base64EncodedString",
	"2": "base64EncodedString",
	"3": [{ "2": "123", "9": [], "10": [] }],
	"4": ["assocId"],
	"5": ${new Date("2025-01-01T13:00:15Z").getTime().toString()},
	"7": "encryptedBool",
	"15": "encryptedFinalBool",
}`
const outgoingParsedInstance = EncryptedParsedInstance.outgoingToServer(testTypeModel as ClientTypeModel)
	.addAttributeById(1, ParsedValue.fromString("base64EncodedString"))
	.addAttributeById(2, ParsedValue.fromString("base64EncodedString"))
	.addAttributeById(4, ParsedValue.fromIdList(["assocId"]))
	.addAttributeById(5, ParsedValue.fromString(new Date("2025-01-01T13:00:15Z").getTime().toString()))
	.addAttributeById(15, ParsedValue.fromString("encryptedFinalBool"))
	.addAttributeById(
		3,
		ParsedValue.fromNestedItems([
			EncryptedParsedInstance.outgoingToServer(testAggregateModel as ClientTypeModel)
				.addAttributeById(2, ParsedValue.fromString("123"))
				.addAttributeById(9, ParsedValue.fromIdList([]))
				.addAttributeById(10, ParsedValue.fromIdList([])),
		]),
	)

const faultyOutgoingJson = `{
	"1": new Uint8Array(2),
	"3": [{ "2": "123", "9": [], "10": [] }],
	"4": ["assocId"],
	"5": ${new Date("2025-01-01T13:00:15Z").getTime().toString()},
}`
const faultyOutgoingParsedInstance = EncryptedParsedInstance.outgoingToServer(testTypeModel as ClientTypeModel)
	.addAttributeById(1, ParsedValue.fromByteArray(new Uint8Array(2)))
	.addAttributeById(4, ParsedValue.fromIdList(["assocId"]))
	.addAttributeById(5, ParsedValue.fromString(new Date("2025-01-01T13:00:15Z").getTime().toString()))
	.addAttributeById(
		3,
		ParsedValue.fromNestedItems([
			EncryptedParsedInstance.outgoingToServer(testAggregateModel as ClientTypeModel)
				.addAttributeById(2, ParsedValue.fromString("123"))
				.addAttributeById(9, ParsedValue.fromIdList([]))
				.addAttributeById(10, ParsedValue.fromIdList([])),
		]),
	)

o.spec("TypeMapperTest", function () {
	let typeMapper: TypeMapper
	o.beforeEach(() => {
		typeMapper = new TypeMapper(new DummyTypeModelResolver() as TypeModelResolver)
	})

	o.spec("applyJsTypes", function () {
		o("can handle associations and aggregations", async function () {
			const resultingParsedInstance = await typeMapper.parseServerJson(
				IncomingServerJson.expectSingleInstance(incomingJson, testTypeModel as ServerTypeModel),
			)
			const resultingParsedInstanceNetDebug = await typeMapper.parseServerJson(
				IncomingServerJson.expectSingleInstance(networkDebuggedIncomingJson, testTypeModel as ServerTypeModel),
			)

			o(resultingParsedInstance).deepEquals(resultingParsedInstanceNetDebug)
			o(resultingParsedInstance).deepEquals(incomingParsedInstance)
		})
	})

	o.spec("applyDbTypes", function () {
		o("throws error for invalid encrypted values", async function () {
			await assertThrows(ProgrammingError, () => typeMapper.makeServerJson(faultyOutgoingParsedInstance))
		})

		o("can apply db types", async function () {
			const instance = await typeMapper.makeServerJson(outgoingParsedInstance)
			const instanceAsJson = instance.getInnerJsonForTest()
			o(instanceAsJson["1"]).equals("base64EncodedString")
			o(instanceAsJson["3"]![0]["2"]).equals("123")
			o(instanceAsJson["5"]).equals("1735736415000")
		})
	})

	o.spec("networkDebugging works", function () {
		o.before(() => {
			env.networkDebugging = true
		})

		o.after(() => {
			env.networkDebugging = false
		})

		o("can apply db types with network debugging enabled", async function () {
			const instance = await typeMapper.makeServerJson(outgoingParsedInstance)
			const instanceAsJson = instance.getInnerJsonForTest()
			o(instanceAsJson["1:testValue"]).equals("base64EncodedString")
			o(instanceAsJson["3:testAssociation"]![0]["2:testNumber"]).equals("123")
			o(instanceAsJson["5:testDate"]).equals("1735736415000")
		})
	})
})
