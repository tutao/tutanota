import o, { assertThrows } from "@tutao/otest"
import { ClientEntity, DecryptedParsedInstance, ModelMapper, TypeModelResolver } from "../../../src/platform-kit/instance-pipeline"
import { Cardinality, ClientTypeModel, GENERATED_MIN_ID, ModelAssociation, TypeModel, ValueTypeEnum } from "../../../src/platform-kit/meta"
import {
	createEncryptedValueType,
	DummyTypeModelResolver,
	TestAggregate,
	testAggregateModel,
	TestAggregateRef,
	TestEntity,
	testTypeModel,
	TestTypeRef,
} from "./InstancePipelineTestUtils"
import { InvalidModelError, ProgrammingError } from "../../../src/platform-kit/app-env"
import { removeOriginals } from "../TestUtils"
import { ParsedValue } from "../../../src/platform-kit/instance-pipeline/PipelineTypes"

o.spec("ModelMapperTest", function () {
	const modelMapper: ModelMapper = new ModelMapper(new DummyTypeModelResolver() as TypeModelResolver)

	o.spec("mapToInstance", function () {
		o("happy path", async function () {
			const parsedInstance = DecryptedParsedInstance.outgoingToServer(testTypeModel as ClientTypeModel)
				.addAttribute(1, ParsedValue.fromString("some encrypted string"))
				.addAttribute(5, ParsedValue.fromString(new Date("2025-01-01T13:00:00.000Z").getTime().toString()))
				.addAttribute(12, ParsedValue.fromId("generatedId"))
				.addAttribute(13, ParsedValue.fromIdTupleList([["listId", "elementId"]]))
				.addAttribute(4, ParsedValue.fromIdList(["associatedElementId"]))
				.addAttribute(7, ParsedValue.fromBoolean(true))
				.addAttribute(8, ParsedValue.fromIdTupleList([["listId", "listElementId"]]))
				.addAttribute(
					3,
					ParsedValue.fromNestedItems([
						DecryptedParsedInstance.outgoingToServer(testAggregateModel as ClientTypeModel)
							.addAttribute(2, ParsedValue.fromString("123"))
							.addAttribute(6, ParsedValue.fromString("123456"))
							.addAttribute(9, ParsedValue.fromIdList([]))
							.addAttribute(10, ParsedValue.fromIdList([])),
					]),
				)
			const mappedInstance = (await modelMapper.mapToInstance(parsedInstance)) as any

			removeOriginals(mappedInstance)

			o(mappedInstance._type).deepEquals(TestTypeRef)
			o(mappedInstance._id).deepEquals(["listId", "elementId"])
			o(mappedInstance.testValue).equals("some encrypted string")
			o(mappedInstance.testBoolean).equals(true)
			o(mappedInstance.testDate.toISOString()).equals("2025-01-01T13:00:00.000Z")
			o(mappedInstance.testAssociation[0]).deepEquals({
				_type: TestAggregateRef,
				testNumber: "123",
				_id: "123456",
				testSecondLevelAssociation: [],
				testZeroOrOneAggregation: null,
			})
			o(mappedInstance.testElementAssociation).equals("associatedElementId")
			o(mappedInstance.testGeneratedId).equals("generatedId")
			o(mappedInstance.testListElementAssociation).deepEquals([["listId", "listElementId"]])
			o(typeof mappedInstance._errors).equals("undefined")
		})

		o("wrong cardinality on value field throws", async function () {
			const parsedInstance = DecryptedParsedInstance.outgoingToServer(testTypeModel as ClientTypeModel)
				.addAttribute(1, ParsedValue.fromNull())
				.addAttribute(5, ParsedValue.fromString(new Date("2025-01-01T13:00:00.000Z").getTime().toString()))
				.addAttribute(4, ParsedValue.fromIdList(["associatedListId"]))
				.addAttribute(7, ParsedValue.fromBoolean(true))
				.addAttribute(
					3,
					ParsedValue.fromNestedItems([
						DecryptedParsedInstance.outgoingToServer(testAggregateModel as ClientTypeModel)
							.addAttribute(2, ParsedValue.fromString("123"))
							.addAttribute(6, ParsedValue.fromString("123456")),
					]),
				)

			await assertThrows(ProgrammingError, async () => modelMapper.mapToInstance(parsedInstance))
		})

		o("wrong aggregation cardinality throws", async function () {
			const parsedInstance = DecryptedParsedInstance.outgoingToServer(testTypeModel as ClientTypeModel)
				.addAttribute(1, ParsedValue.fromString("some encrypted string"))
				.addAttribute(5, ParsedValue.fromString(new Date("2025-01-01T13:00:00.000Z").getTime().toString()))
				.addAttribute(3, ParsedValue.fromIdList([]))
				.addAttribute(7, ParsedValue.fromBoolean(true))

			await assertThrows(ProgrammingError, async () => modelMapper.mapToInstance(parsedInstance))
		})

		o("wrong reference cardinality throws", async function () {
			const parsedInstance = DecryptedParsedInstance.outgoingToServer(testTypeModel as ClientTypeModel)
				.addAttribute(1, ParsedValue.fromString("some encrypted string"))
				.addAttribute(5, ParsedValue.fromString(new Date("2025-01-01T13:00:00.000Z").getTime().toString()))
				.addAttribute(4, ParsedValue.fromIdList([]))
				.addAttribute(7, ParsedValue.fromBoolean(true))
				.addAttribute(
					3,
					ParsedValue.fromNestedItems([
						DecryptedParsedInstance.outgoingToServer(testAggregateModel as ClientTypeModel)
							.addAttribute(2, ParsedValue.fromString("123"))
							.addAttribute(6, ParsedValue.fromString("123456")),
					]),
				)
			await assertThrows(ProgrammingError, async () => modelMapper.mapToInstance(parsedInstance))
		})
	})

	o.spec("mapToClientModelParsedInstance", function () {
		o("happy path debug", async function () {
			const instance: TestEntity = {
				_type: TestTypeRef,
				testAssociation: [
					{
						_type: TestAggregateRef,
						testNumber: "123456",
					} as TestAggregate,
				],
				testBoolean: false,
				testDate: new Date("2025-01-01T13:00:00.000Z"),
				testElementAssociation: "associatedElementId",
				testListElementAssociation: [["listId", "listElementId"]],
				testZeroOrOneListElementAssociation: null,
				testValue: "some encrypted string",
				testGeneratedId: GENERATED_MIN_ID,
				_id: [GENERATED_MIN_ID, GENERATED_MIN_ID],
				testFinalBoolean: false,
			}
			const parsedInstance = await modelMapper.mapToDecryptedInstance(instance)

			o(parsedInstance.getAttributeById(1).asString()).equals("some encrypted string")
			o(parsedInstance.getAttributeById(7).asBoolean()).equals(false)
			o(parsedInstance.getAttributeById(5).asDate().toISOString()).equals("2025-01-01T13:00:00.000Z")
			const testAssociation = parsedInstance.getAttributeById(3).asNestedObjList()[0]
			o(testAssociation.getAttributeById(2).asString()).equals("123456")
			// aggregate _id is randomly generated if not found
			o(testAssociation.getAttributeById(6).asString().length).deepEquals(6)
			o(parsedInstance.getAttributeById(4).asIdList()).deepEquals(["associatedElementId"])
			o(parsedInstance.hasError()).equals(false)
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
			o(modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityZeroOrOne, cardinalityZeroOrOne, ParsedValue.fromNull())).equals(
				ParsedValue.fromNull(),
			)

			await assertThrows(InvalidModelError, async () =>
				modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityOne, cardinalityOne, ParsedValue.fromNull()),
			)
			await assertThrows(InvalidModelError, async () =>
				modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityAny, cardinalityAny, ParsedValue.fromNull()),
			)
			await assertThrows(InvalidModelError, async () =>
				modelMapper.assertCorrectValueCardinality(TestTypeRef, cardinalityAny, cardinalityAny, ParsedValue.fromString("v")),
			)
		})
	})
})
