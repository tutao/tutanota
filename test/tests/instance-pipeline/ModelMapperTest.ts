import o, { assertThrows } from "@tutao/otest"
import { ClientEntity, DecryptedParsedInstance, ModelMapper, TypeModelResolver } from "../../../src/platform-kit/instance-pipeline"
import { Cardinality, ClientTypeModel, ModelAssociation, ServerTypeModel, TypeModel, ValueTypeEnum } from "../../../src/platform-kit/meta"
import {
	createEncryptedValueType,
	DummyTypeModelResolver,
	testAggregateModel,
	TestAggregateRef,
	TestEntity,
	testTypeModel,
	TestTypeRef,
} from "./InstancePipelineTestUtils"
import { InvalidModelError, ProgrammingError } from "../../../src/platform-kit/app-env"
import { removeOriginals } from "../TestUtils"
import { ParsedValue } from "../../../src/platform-kit/instance-pipeline/ParsedValue"
import { random } from "../../../src/platform-kit/crypto"

o.spec("ModelMapperTest", function () {
	let modelMapper: ModelMapper
	let decryptedParsedInstance: DecryptedParsedInstance
	let instance: TestEntity

	o.beforeEach(async () => {
		modelMapper = new ModelMapper(new DummyTypeModelResolver() as TypeModelResolver)

		instance = {
			_type: TestTypeRef,
			testAssociation: [
				{
					_id: null!,
					_type: TestAggregateRef,
					testNumber: "123456",
					testSecondLevelAssociation: [],
					testZeroOrOneAggregation: null,
				},
			],
			_kdfNonce: null,
			_ownerEncSessionKey: null,
			testValueZeroOrOne: null,
			testBoolean: false,
			testDate: new Date("2025-01-01T13:00:00.000Z"),
			testElementAssociation: "associatedElementId",
			testListElementAssociation: [["listId", "listElementId"]],
			testZeroOrOneListElementAssociation: null,
			testValue: "some encrypted string",
			testGeneratedId: "generatedId",
			_id: ["listId", "listElementId"],
			testFinalBoolean: false,
		}
		decryptedParsedInstance = DecryptedParsedInstance.incomingFromServer(testTypeModel as ServerTypeModel)
			.addAttributeById(1, ParsedValue.fromString("some encrypted string"))
			.addAttributeById(7, ParsedValue.fromString("1"))
			.addAttributeById(15, ParsedValue.fromString("1"))
			.addAttributeById(16, ParsedValue.fromByteArray(random.generateRandomData(10)))
			.addAttributeById(2, ParsedValue.fromNull())
			.addAttributeById(14, ParsedValue.fromNull())
			.addAttributeById(5, ParsedValue.fromString(new Date("2025-01-01T13:00:00.000Z").getTime().toString()))
			.addAttributeById(12, ParsedValue.fromId("generatedId"))
			.addAttributeById(13, ParsedValue.fromIdTuple(["listId", "elementId"]))
			.addAttributeById(4, ParsedValue.fromIdList(["associatedElementId"]))
			.addAttributeById(8, ParsedValue.fromIdTupleList([["listId", "listElementId"]]))
			.addAttributeById(17, ParsedValue.fromIdList([]))
			.addAttributeById(
				3,
				ParsedValue.fromNestedItems([
					DecryptedParsedInstance.incomingFromServer(testAggregateModel as ServerTypeModel)
						.addAttributeById(2, ParsedValue.fromString("123"))
						.addAttributeById(6, ParsedValue.fromId("some id"))
						.addAttributeById(9, ParsedValue.fromIdList([]))
						.addAttributeById(10, ParsedValue.fromIdList([])),
				]),
			)
	})

	o.spec("mapToInstance", function () {
		o("happy path", async function () {
			const mappedEntity = await modelMapper.mapToInstance(decryptedParsedInstance)
			removeOriginals(mappedEntity)

			const mappedInstance = mappedEntity as any
			o(mappedInstance._type).deepEquals(TestTypeRef)
			o(mappedInstance._id).deepEquals(["listId", "elementId"])
			o(mappedInstance.testValue).equals("some encrypted string")
			o(mappedInstance.testBoolean).equals(true)
			o(mappedInstance.testDate.toISOString()).equals("2025-01-01T13:00:00.000Z")
			o(mappedInstance.testAssociation[0]).deepEquals({
				_type: TestAggregateRef,
				testNumber: "123",
				_id: "some id",
				testSecondLevelAssociation: [],
				testZeroOrOneAggregation: null,
			})
			o(mappedInstance.testElementAssociation).equals("associatedElementId")
			o(mappedInstance.testGeneratedId).equals("generatedId")
			o(mappedInstance.testListElementAssociation).deepEquals([["listId", "listElementId"]])
			o(typeof mappedInstance._errors).equals("undefined")
		})

		o("if server cardinality is One, puts default value", async function () {
			decryptedParsedInstance.addAttributeById(1, ParsedValue.fromNull())

			const result = (await modelMapper.mapToInstance(decryptedParsedInstance)) as any
			o(result.testValue).deepEquals("")
		})

		o("wrong cardinality on value field throws", async function () {
			const serverModel = structuredClone(decryptedParsedInstance.typeModel)
			serverModel.values["1"].cardinality = Cardinality.ZeroOrOne
			;(decryptedParsedInstance as any).typeModel = serverModel

			decryptedParsedInstance.addAttributeById(1, ParsedValue.fromNull())
			const err = await assertThrows(InvalidModelError, async () => modelMapper.mapToInstance(decryptedParsedInstance))
			o(err.message).equals(`Expected non-null value for attribute with One cardinality. ${TestTypeRef.toString()}/testValue`)
		})

		o("wrong association cardinality throws xyz", async function () {
			decryptedParsedInstance.addAttributeById(4, ParsedValue.fromIdList(["some-id", "another-id-should-not-be-here-when-cardinality-is-zero-one"]))

			const err = await assertThrows(InvalidModelError, async () => modelMapper.mapToInstance(decryptedParsedInstance))
			o(err.message).equals("Cardinality ZeroOrOne can hold at max one item. Found: 2")
		})
	})

	o.spec("mapToClientModelParsedInstance", function () {
		o("happy path debug", async function () {
			const resultingParsedInstance = await modelMapper.mapToDecryptedInstance(instance)

			o(resultingParsedInstance.getAttributeById(1).asString()).equals("some encrypted string")
			o(resultingParsedInstance.getAttributeById(7).asBoolean()).equals(false)
			o(resultingParsedInstance.getAttributeById(5).asDate().toISOString()).equals("2025-01-01T13:00:00.000Z")
			const testAssociation = resultingParsedInstance.getAttributeById(3).asNestedObjList()[0]
			o(testAssociation.getAttributeById(2).asString()).equals("123456")
			// aggregate _id is randomly generated if not found
			o(testAssociation.getAttributeById(6).asString().length).deepEquals(6)
			o(resultingParsedInstance.getAttributeById(4).asIdList()).deepEquals(["associatedElementId"])
			o(resultingParsedInstance.hasError()).equals(false)
		})
	})

	o.spec("cardinality assertions", function () {
		o("assertCorrectAssociationClientCardinality", async function () {
			const f = (cardinality, value) => {
				const rec = {}

				const stubTypeModel = {
					associations: {
						"1": {
							name: "res",
							cardinality,
						} as ModelAssociation,
					},
				} as unknown as TypeModel
				const r = new ClientEntity(stubTypeModel as ClientTypeModel, rec)
				r.setAssociationForTest(1, value)
				return rec["res"]
			}

			o(f(Cardinality.One, ["v"])).deepEquals("v")
			o(f(Cardinality.ZeroOrOne, ["v"])).deepEquals("v")
			o(f(Cardinality.ZeroOrOne, [])).deepEquals(null)
			o(f(Cardinality.Any, ["v"])).deepEquals(["v"])
			o(f(Cardinality.Any, ["v", "v2"])).deepEquals(["v", "v2"])
			o(f(Cardinality.ZeroOrOne, [["listId", "listElementId"]])).deepEquals(["listId", "listElementId"])
			o(f(Cardinality.One, [["listId", "listElementId"]])).deepEquals(["listId", "listElementId"])
			o(f(Cardinality.Any, [["listId", "listElementId"]])).deepEquals([["listId", "listElementId"]])
			o(f(Cardinality.Any, [])).deepEquals([])

			await assertThrows(InvalidModelError, async () => f(Cardinality.One, ["v", "v1", "v2"]))
			await assertThrows(InvalidModelError, async () => f(Cardinality.ZeroOrOne, ["v", "v1", "v2"]))
			await assertThrows(InvalidModelError, async () => f(Cardinality.One, []))
			await assertThrows(InvalidModelError, async () => f(Cardinality.One, ["v", "v2"]))
			await assertThrows(InvalidModelError, async () => f(Cardinality.ZeroOrOne, ["v", "v2"]))
		})

		o("assertCorrectValueCardinality", async function () {
			const cardinalityOne = createEncryptedValueType(ValueTypeEnum.String, Cardinality.One)
			const cardinalityZeroOrOne = createEncryptedValueType(ValueTypeEnum.String, Cardinality.ZeroOrOne)
			const cardinalityAny = createEncryptedValueType(ValueTypeEnum.String, Cardinality.Any)

			o(modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityOne, cardinalityOne, ParsedValue.fromString("v"))).deepEquals(
				ParsedValue.fromString("v"),
			)
			o(modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityZeroOrOne, cardinalityZeroOrOne, ParsedValue.fromString("v"))).deepEquals(
				ParsedValue.fromString("v"),
			)
			o(modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityZeroOrOne, cardinalityZeroOrOne, ParsedValue.fromNull())).deepEquals(
				ParsedValue.fromNull(),
			)

			// if serverHave cardinalityOne, the value is null and client still has cardinality one, we put default value
			// this is the case when we change some value from ZeroOrOne -> One
			o(modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityOne, cardinalityOne, ParsedValue.fromNull())).deepEquals(
				ParsedValue.fromString(""),
			)

			const idTupleValue = { ...createEncryptedValueType(ValueTypeEnum.GeneratedId, Cardinality.One), name: "_id" }
			o(
				modelMapper.assertCorrectValueCardinality(TestTypeRef, idTupleValue, idTupleValue, ParsedValue.fromIdTuple(["listId", "listElementId"])),
			).deepEquals(ParsedValue.fromIdTuple(["listId", "listElementId"]))

			const cardinalityOneErr = await assertThrows(InvalidModelError, async () =>
				modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityZeroOrOne, cardinalityOne, ParsedValue.fromNull()),
			)
			const cardinalityAnyNullErr = await assertThrows(InvalidModelError, async () =>
				modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityAny, cardinalityAny, ParsedValue.fromNull()),
			)
			const cardinalityAnyValueErr = await assertThrows(InvalidModelError, async () =>
				modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityAny, cardinalityAny, ParsedValue.fromString("v")),
			)
			const nonStringValue = await assertThrows(ProgrammingError, async () =>
				modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityOne, cardinalityOne, ParsedValue.fromNestedItems([])),
			)

			o(cardinalityOneErr.message).equals(`Expected non-null value for attribute with One cardinality. ${TestTypeRef.toString()}/test`)
			o(cardinalityAnyNullErr.message).equals("Current metamodel does not support ANY cardinality value")
			o(cardinalityAnyValueErr.message).equals("Current metamodel does not support ANY cardinality value")
			o(nonStringValue.message).equals("Invalid value/cardinality combination")
		})
	})
})
