import { ClientTypeModel, ServerTypeModel } from "../../../src/platform-kit/meta"
import o from "@tutao/otest"
import { EncryptedParsedInstance, TypeModelResolver } from "../../../src/platform-kit/instance-pipeline"
import { DummyTypeModelResolver, testAggregateModel, testTypeModel } from "./InstancePipelineTestUtils"
import { IncomingServerJson, TypeMapper } from "../../../src/platform-kit/instance-pipeline/TypeMapper"
import { InstanceDirection, ParsedValue } from "../../../src/platform-kit/instance-pipeline/ParsedValue"

o.spec("TypeMapperTest", function () {
	let typeMapper: TypeMapper
	let jsonInstanceNetDebugged: string
	let jsonInstance: string
	let encryptedParsedInstance: EncryptedParsedInstance

	o.beforeEach(() => {
		typeMapper = new TypeMapper(new DummyTypeModelResolver() as TypeModelResolver)

		jsonInstanceNetDebugged = `{
	"13:_id": ["listId", "listElementId"],
	"1:testValue": "test string",
	"2:testValueZeroOrOne": null,
	"3:testAssociation": [
		{
			"2:testNumber": "123",
			"6:_id": "someCustomId",
			"9:testSecondLevelAssociation": [],
			"10:testZeroOrOneAggregation": []
		}
	],
	"4:testElementAssociation": ["assocId"],
	"5:testDate": "1735736415000",
	"7:testBoolean": "encryptedBool",
	"8:testListElementAssociation": [],
	"12:testGeneratedId": "some-id",
	"14:_ownerEncSessionKey": null,
	"16:_kdfNonce": null,
	"17:testZeroOrOneListElementAssociation": [],
	"15:testFinalBoolean": "encryptedFinalBool"
}`

		jsonInstance = `{
	"1": "test string",
	"2": null,
	"3": [
		{
			"6": "someCustomId",
			"2": "123",
			"9": [],
			"10": []
		}
	],
	"4": ["assocId"],
	"5": "1735736415000",
	"7": "encryptedBool",
	"8": [],
	"12": "some-id",
	"13": ["listId", "listElementId"],
	"14": null,
	"16": null,
	"17": [],
	"15": "encryptedFinalBool"
}`

		encryptedParsedInstance = EncryptedParsedInstance.outgoingToServer(testTypeModel as ClientTypeModel)
			.addAttributeById(1, ParsedValue.fromString("test string"))
			.addAttributeById(2, ParsedValue.fromNull())
			.addAttributeById(
				3,
				ParsedValue.fromNestedItems([
					EncryptedParsedInstance.outgoingToServer(testAggregateModel as ClientTypeModel)
						.addAttributeById(2, ParsedValue.fromString("123"))
						.addAttributeById(6, ParsedValue.fromString("someCustomId"))
						.addAttributeById(9, ParsedValue.fromIdList([]))
						.addAttributeById(10, ParsedValue.fromIdList([])),
				]),
			)
			.addAttributeById(4, ParsedValue.fromIdList(["assocId"]))
			.addAttributeById(5, ParsedValue.fromString("1735736415000"))
			.addAttributeById(7, ParsedValue.fromString("encryptedBool"))
			.addAttributeById(8, ParsedValue.fromIdList([]))
			.addAttributeById(12, ParsedValue.fromString("some-id"))
			.addAttributeById(13, ParsedValue.fromIdTuple(["listId", "listElementId"]))
			.addAttributeById(14, ParsedValue.fromNull())
			.addAttributeById(16, ParsedValue.fromNull())
			.addAttributeById(15, ParsedValue.fromString("encryptedFinalBool"))
			.addAttributeById(17, ParsedValue.fromIdTupleList([]))
	})

	function changeDirectionOfParsedInstance(instance: EncryptedParsedInstance, direction: InstanceDirection) {
		const aggregateedInstance = instance.getAttributeById(3).asNestedObjList()[0]
		// @ts-ignore
		instance.direction = direction
		// @ts-ignore
		aggregateedInstance.direction = direction
	}

	o("read incoming instances", async function () {
		const resultingParsedInstance = await typeMapper.parseServerJson(
			IncomingServerJson.expectSingleInstance(jsonInstance, testTypeModel as ServerTypeModel),
		)
		const resultingParsedInstanceNetDebug = await typeMapper.parseServerJson(
			IncomingServerJson.expectSingleInstance(jsonInstanceNetDebugged, testTypeModel as ServerTypeModel),
		)

		changeDirectionOfParsedInstance(encryptedParsedInstance, InstanceDirection.IncomingFromServer)
		o(resultingParsedInstance).deepEquals(encryptedParsedInstance)
		o(resultingParsedInstance).deepEquals(resultingParsedInstanceNetDebug)
	})

	o.spec("jsonify outgoing instances", () => {
		o("jsonify outgoing instances", async function () {
			const outgoingJson = await typeMapper.makeServerJson(encryptedParsedInstance)

			const instanceAsRecord = outgoingJson.getInnerJsonForTest()
			o(instanceAsRecord["1"]).equals("test string")
			o(instanceAsRecord["3"]![0]["2"]).equals("123")
			o(instanceAsRecord["5"]).equals("1735736415000")

			o(JSON.parse(outgoingJson.getJsonRepresentation())).deepEquals(JSON.parse(jsonInstance))
		})

		o("jsonify outgoing instance with networkDebugging", async function () {
			env.networkDebugging = true
			const outgoingJsonNetDebugged = await typeMapper.makeServerJson(encryptedParsedInstance)

			const instanceAsRecord = outgoingJsonNetDebugged.getInnerJsonForTest()
			o(instanceAsRecord["1:testValue"]).equals("test string")
			o(instanceAsRecord["3:testAssociation"]![0]["2:testNumber"]).equals("123")
			o(instanceAsRecord["5:testDate"]).equals("1735736415000")

			o(JSON.parse(outgoingJsonNetDebugged.getJsonRepresentation())).deepEquals(JSON.parse(jsonInstanceNetDebugged))
		})
	})
})
