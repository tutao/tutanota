import o, { assertThrows } from "@tutao/otest"
import {
	dummyResolver,
	TestAggregate,
	TestAggregateOnAggregate,
	TestAggregateOnAggregateRef,
	TestAggregateRef,
	TestEntity,
	TestTypeRef,
} from "./InstancePipelineTestUtils"
import {
	ClientTypeReferenceResolver,
	InstancePipeline,
	PatchGenerator,
	PatchOperationType,
	TypeModelResolver,
} from "../../../src/platform-kit/instance-pipeline"
import { aes256RandomKey, SubKeyInfoWithSessionKeyCbcThenHmac } from "../../../src/platform-kit/crypto"
import { assertNotNull, base64ToUint8Array, stringToBase64, stringToUtf8Uint8Array, uint8ArrayToBase64 } from "../../../src/platform-kit/utils"
import {
	AssociationTypeEnum,
	CardinalityEnum,
	Entity,
	EntityTypeEnum,
	GENERATED_MAX_ID,
	GENERATED_MIN_ID,
	TypeModel,
	TypeRef,
	ValueTypeEnum,
} from "../../../src/platform-kit/meta"
import { createTestEntityWithDummyResolver, withOverriddenEnv } from "../TestUtils"

import { object } from "testdouble"

import { createPatch, createPatchList } from "@tutao/entities/sys"
import { SYMMETRIC_CIPHER_FACADE } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/SymmetricCipherFacade"
import { ParsedValue } from "../../../src/platform-kit/instance-pipeline/ParsedValue"
import { OutgoingServerJson } from "../../../src/platform-kit/instance-pipeline/TypeMapper"
import { ProgrammingError } from "../../../src/platform-kit/app-env"

o.spec("computePatches", function () {
	const typeModelResolver: TypeModelResolver = object()
	o.before(() => {
		typeModelResolver.resolveClientTypeReference = dummyResolver as any
	})
	const dummyTypeReferenceResolver = dummyResolver as ClientTypeReferenceResolver
	const dummyInstancePipeline = new InstancePipeline(typeModelResolver, object(), SYMMETRIC_CIPHER_FACADE)
	const patchGenerator = new PatchGenerator(dummyInstancePipeline)

	o("computePatches returns empty list for equal objects", async function () {
		const testEntity = await createFilledTestEntity()

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		const objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentUntypedInstance)
		o(objectDiff).deepEquals([])
	})

	o("computePatches works on values in the root level", async function () {
		const testEntity = await createFilledTestEntity()
		const date = new Date()
		testEntity.testDate = date

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		const objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentUntypedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "5",
				value: `${date.valueOf()}`,
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches returns empty for final values", async function () {
		const testEntity = await createFilledTestEntity()
		testEntity.testFinalBoolean = false

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		const objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentUntypedInstance)
		o(objectDiff).deepEquals([])
	})

	o("computePatches works when setting values to null", async function () {
		const testEntity = await createFilledTestEntity()
		testEntity.testBoolean = null

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		const objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentUntypedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "7",
				value: null,
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works when modifying multiple values", async function () {
		const testEntity = await createFilledTestEntity()
		const date = new Date()
		testEntity.testDate = date
		testEntity.testBoolean = null

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		const objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentUntypedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "5",
				value: `${date.valueOf()}`,
				patchOperation: PatchOperationType.REPLACE,
			}),
			createPatch({
				attributePath: "7",
				value: null,
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on values on the aggregates", async function () {
		const testEntity = await createFilledTestEntity()
		testEntity.testAssociation[0].testNumber = "1234"

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		const objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentUntypedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3/aggId/2",
				value: "1234",
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on Any non-aggregation associations and additem operation", async function () {
		const testEntity = await createFilledTestEntity()
		testEntity.testListElementAssociation.push(["listId", "elementId"], ["list2Id", "element2Id"])

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentUntypedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "8",
				value: '[["listId","elementId"],["list2Id","element2Id"]]',
				patchOperation: PatchOperationType.ADD_ITEM,
			}),
		])
	})

	o("computePatches works on Any non-aggregation associations and removeitem operation", async function () {
		const testEntity = await createTestEntityWithOriginal({
			testListElementAssociation: [
				["listId", "elementId"],
				["listId2", "elementId2"],
				["listId3", "elementId3"],
			],
		})
		testEntity.testListElementAssociation.pop()
		testEntity.testListElementAssociation.pop()

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)

		const objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentUntypedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "8",
				value: '[["listId2","elementId2"],["listId3","elementId3"]]',
				patchOperation: PatchOperationType.REMOVE_ITEM,
			}),
		])
	})

	o("computePatches works on ZeroOrOne non-aggregation associations and replace operation", async function () {
		const testEntity = await createFilledTestEntity()
		testEntity.testElementAssociation = "elementId"

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const currentEncryptedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentEncryptedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "4",
				value: '["elementId"]',
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on ZeroOrOne non-aggregation list element associations and replace operation", async function () {
		const testEntity = await createFilledTestEntity()
		testEntity.testZeroOrOneListElementAssociation = ["listId", "elementId"]

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentUntypedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "17",
				value: '[["listId","elementId"]]',
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on ZeroOrOne non-aggregation associations and replace operation setting to null", async function () {
		const testEntity = await createFilledTestEntity()
		testEntity.testElementAssociation = null

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentUntypedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "4",
				value: "[]",
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on aggregations and additem operation", async function () {
		const testEntity = await createFilledTestEntity()
		testEntity.testAssociation.push(
			await createTestEntityWithDummyResolver(TestAggregateRef, {
				_id: "newAgId",
				testNumber: "1",
			}),
		)
		testEntity.testAssociation.push(
			await createTestEntityWithDummyResolver(TestAggregateRef, {
				_id: "newAgId2",
				testNumber: "2",
			}),
		)

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const subKeyInfo = new SubKeyInfoWithSessionKeyCbcThenHmac(sk)
		const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(currentParsedInstance, subKeyInfo)

		const changedAssociations = currentEncryptedParsedInstance
			.getAttributeByName("testAssociation")
			.asNestedObjList()
			.map(async (assoc) => dummyInstancePipeline.typeMapper.makeServerJson(assoc))
		const objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentEncryptedParsedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3",
				value: OutgoingServerJson.getJsonRepresentationOfMultiple((await Promise.all(changedAssociations)).slice(1)),
				patchOperation: PatchOperationType.ADD_ITEM,
			}),
		])
	})

	o("computePatches works on aggregations and replace operation when aggregates are identical but have different order", async function () {
		const testEntity = await createFilledTestEntity()
		testEntity.testAssociation.push(
			await createTestEntityWithDummyResolver(TestAggregateRef, {
				_id: "newAgId",
				testNumber: "1",
			}),
		)
		testEntity.testAssociation.push(
			await createTestEntityWithDummyResolver(TestAggregateRef, {
				_id: "newAgId2",
				testNumber: "2",
			}),
		)
		testEntity._original = structuredClone(testEntity)

		const elementToMove = testEntity.testAssociation[0]
		testEntity.testAssociation.splice(0, 1)
		testEntity.testAssociation.push(elementToMove)

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const subKeyInfo = new SubKeyInfoWithSessionKeyCbcThenHmac(sk)
		const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(currentParsedInstance, subKeyInfo)
		const encryptedAssociationArray = currentEncryptedParsedInstance.getAttributeByName("testAssociation").asNestedObjList()
		const serverJson = encryptedAssociationArray.map(async (agg) => dummyInstancePipeline.typeMapper.makeServerJson(agg))
		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentEncryptedParsedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3",
				value: OutgoingServerJson.getJsonRepresentationOfMultiple(await Promise.all(serverJson)),
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on aggregations and removeitem operation", async function () {
		const testEntity = await createFilledTestEntity()
		testEntity.testAssociation.pop()

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentUntypedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3",
				value: '["aggId"]',
				patchOperation: PatchOperationType.REMOVE_ITEM,
			}),
		])
	})

	o("computePatches works on values on aggregations on aggregations and replace operation", async function () {
		const testEntity = await createFilledTestEntity()
		const newValue = new Uint8Array(8)
		testEntity.testAssociation[0].testSecondLevelAssociation[0].testBytes = newValue

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentUntypedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3/aggId/9/aggOnAggId/10",
				value: uint8ArrayToBase64(newValue),
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on aggregations of cardinality zeroorone entity -> null", async function () {
		const testEntity = await createFilledTestEntity()
		testEntity.testAssociation[0].testZeroOrOneAggregation = null

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentUntypedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3/aggId/10",
				value: "[]",
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on aggregations of cardinality zeroorone null -> entity", async function () {
		const testEntity = await createFilledTestEntity()
		const testZeroOrOneAggregation = testEntity.testAssociation[0].testZeroOrOneAggregation
		testEntity.testAssociation[0].testZeroOrOneAggregation = null
		testEntity._original = structuredClone(testEntity)
		testEntity.testAssociation[0].testZeroOrOneAggregation = testZeroOrOneAggregation

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const subKeyInfo = new SubKeyInfoWithSessionKeyCbcThenHmac(sk)
		const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(currentParsedInstance, subKeyInfo)

		const testAggregateEncrypted = currentEncryptedParsedInstance.getAttributeByName("testAssociation").asNestedObjList()[0]
		const addedTestAggregateOnAggregateEncrypted = testAggregateEncrypted.getAttributeByName("testZeroOrOneAggregation").asNestedObjList()[0]
		const serverJson = await dummyInstancePipeline.typeMapper.makeServerJson(addedTestAggregateOnAggregateEncrypted)

		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentEncryptedParsedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3/aggId/10",
				value: OutgoingServerJson.getJsonRepresentationOfMultiple([serverJson]),
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on aggregations of cardinality zeroorone entity -> entity but the ids don't match", async function () {
		const testEntity = await createFilledTestEntity()
		assertNotNull(testEntity.testAssociation[0].testZeroOrOneAggregation)._id = "newAggOnAggId"

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const subKeyInfo = new SubKeyInfoWithSessionKeyCbcThenHmac(sk)
		const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(currentParsedInstance, subKeyInfo)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		const testAssociationEncrypted = currentEncryptedParsedInstance.getAttributeByName("testAssociation").asNestedObjList()[0]

		const addedTestAggregateOnAggregateEncrypted = testAssociationEncrypted.getAttributeByName("testZeroOrOneAggregation").asNestedObjList()[0]
		const serverJson = await dummyInstancePipeline.typeMapper.makeServerJson(addedTestAggregateOnAggregateEncrypted)
		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentUntypedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3/aggId/10",
				value: OutgoingServerJson.getJsonRepresentationOfMultiple([serverJson]),
				patchOperation: PatchOperationType.REPLACE,
			}),
		])
	})

	o("computePatches works on aggregates on aggregations and additem operation", async function () {
		const testEntity = await createFilledTestEntity()

		const testAggregateOnAggregateEntity = await createTestEntityWithDummyResolver(TestAggregateOnAggregateRef)
		testEntity.testAssociation[0].testSecondLevelAssociation.push(testAggregateOnAggregateEntity)

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const subKeyInfo = new SubKeyInfoWithSessionKeyCbcThenHmac(sk)
		const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(currentParsedInstance, subKeyInfo)

		const testAggregateEncrypted = currentEncryptedParsedInstance.getAttributeByName("testAssociation").asNestedObjList()[0]
		const addedTestAggregateOnAggregateEncrypted = testAggregateEncrypted.getAttributeByName("testSecondLevelAssociation").asNestedObjList()[1]
		const serverJson = await dummyInstancePipeline.typeMapper.makeServerJson(addedTestAggregateOnAggregateEncrypted)

		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentEncryptedParsedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3/aggId/9",
				value: OutgoingServerJson.getJsonRepresentationOfMultiple([serverJson]),
				patchOperation: PatchOperationType.ADD_ITEM,
			}),
		])
	})

	o("computePatches works on aggregates on aggregations and removei" + "tem operation", async function () {
		const testEntity = await createFilledTestEntity()

		testEntity.testAssociation[0].testSecondLevelAssociation.pop()

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const subKeyInfo = new SubKeyInfoWithSessionKeyCbcThenHmac(sk)
		const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(currentParsedInstance, subKeyInfo)
		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentEncryptedParsedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3/aggId/9",
				value: '["aggOnAggId"]',
				patchOperation: PatchOperationType.REMOVE_ITEM,
			}),
		])
	})

	o.spec("computePatchPayload", function () {
		o("wraps the computed patches in a PatchList", async function () {
			const testEntity = await createFilledTestEntity()
			const date = new Date()
			testEntity.testDate = date
			testEntity.testListElementAssociation.push(["listId", "elementId"])

			const sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
			const currentEncryptedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)

			const patchList = await patchGenerator.computePatchPayload(originalParsedInstance, currentParsedInstance, currentEncryptedInstance)

			o(patchList).deepEquals(
				createPatchList({
					patches: [
						createPatch({ attributePath: "5", value: `${date.valueOf()}`, patchOperation: PatchOperationType.REPLACE }),
						createPatch({ attributePath: "8", value: '[["listId","elementId"]]', patchOperation: PatchOperationType.ADD_ITEM }),
					],
				}),
			)
		})

		o("returns an empty PatchList when nothing changed", async function () {
			const testEntity = await createFilledTestEntity()

			const sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
			const currentEncryptedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)

			const patchList = await patchGenerator.computePatchPayload(originalParsedInstance, currentParsedInstance, currentEncryptedInstance)

			o(patchList).deepEquals(createPatchList({ patches: [] }))
		})
	})

	o.spec("computePatches combined and edge cases", function () {
		o("combines value, aggregate and id list changes in model order", async function () {
			const testEntity = await createFilledTestEntity()
			const date = new Date()
			testEntity.testDate = date
			testEntity.testAssociation[0].testNumber = "1234"
			testEntity.testListElementAssociation.push(["listId", "elementId"])

			const objectDiff = await computeFixturePatches(testEntity)

			o(objectDiff).deepEquals([
				createPatch({ attributePath: "5", value: `${date.valueOf()}`, patchOperation: PatchOperationType.REPLACE }),
				createPatch({ attributePath: "3/aggId/2", value: "1234", patchOperation: PatchOperationType.REPLACE }),
				createPatch({ attributePath: "8", value: '[["listId","elementId"]]', patchOperation: PatchOperationType.ADD_ITEM }),
			])
		})

		o("returns empty when a value is changed and set back", async function () {
			const testEntity = await createFilledTestEntity()
			const originalDate = new Date(testEntity.testDate.getTime())
			testEntity.testDate = new Date()
			testEntity.testDate = originalDate
			testEntity.testAssociation[0].testNumber = "1234"
			testEntity.testAssociation[0].testNumber = "123456"
			testEntity.testBoolean = null
			testEntity.testBoolean = false

			o(await computeFixturePatches(testEntity)).deepEquals([])
		})

		o("returns empty when an id list element is removed and added back", async function () {
			const testEntity = await createFilledTestEntity()
			const removed = assertNotNull(testEntity.testListElementAssociation.pop())
			testEntity.testListElementAssociation.push(removed)

			o(await computeFixturePatches(testEntity)).deepEquals([])
		})

		o("returns empty when a Date is mutated in place and restored", async function () {
			const testEntity = await createFilledTestEntity()
			const originalTime = testEntity.testDate.getTime()
			testEntity.testDate.setTime(originalTime + 1000)
			testEntity.testDate.setTime(originalTime)

			o(await computeFixturePatches(testEntity)).deepEquals([])
		})

		o("detects a Date mutated in place", async function () {
			const testEntity = await createFilledTestEntity()
			testEntity.testDate.setTime(testEntity.testDate.getTime() + 1000)

			o(await computeFixturePatches(testEntity)).deepEquals([
				createPatch({ attributePath: "5", value: `${testEntity.testDate.getTime()}`, patchOperation: PatchOperationType.REPLACE }),
			])
		})

		o("detects a Uint8Array mutated in place", async function () {
			const testEntity = await createFilledTestEntity()
			testEntity.testAssociation[0].testSecondLevelAssociation[0].testBytes = new Uint8Array([1, 2, 3])
			testEntity._original = structuredClone(testEntity)
			assertNotNull(testEntity.testAssociation[0].testSecondLevelAssociation[0].testBytes)[0] = 9

			o(await computeFixturePatches(testEntity)).deepEquals([
				createPatch({
					attributePath: "3/aggId/9/aggOnAggId/10",
					value: uint8ArrayToBase64(new Uint8Array([9, 2, 3])),
					patchOperation: PatchOperationType.REPLACE,
				}),
			])
		})

		o("emits REMOVE_ITEM and ADD_ITEM together when one aggregate is replaced and another is kept", async function () {
			const testEntity = await createFilledTestEntity()
			testEntity.testAssociation.push(await createTestEntityWithDummyResolver(TestAggregateRef, { _id: "keptAgId", testNumber: "1" }))
			testEntity._original = structuredClone(testEntity)

			testEntity.testAssociation.splice(0, 1)
			const added = await createTestEntityWithDummyResolver(TestAggregateRef, { _id: "addedAgId", testNumber: "2" })
			testEntity.testAssociation.push(added)

			const sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
			const encrypted = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(currentParsedInstance, new SubKeyInfoWithSessionKeyCbcThenHmac(sk))
			const addedEncrypted = encrypted.getAttributeByName("testAssociation").asNestedObjList()[1]
			const addedJson = await dummyInstancePipeline.typeMapper.makeServerJson(addedEncrypted)

			const objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, encrypted)

			o(objectDiff).deepEquals([
				createPatch({ attributePath: "3", value: '["aggId"]', patchOperation: PatchOperationType.REMOVE_ITEM }),
				createPatch({
					attributePath: "3",
					value: OutgoingServerJson.getJsonRepresentationOfMultiple([addedJson]),
					patchOperation: PatchOperationType.ADD_ITEM,
				}),
			])
		})

		o("replaces the whole aggregate list when the list becomes disjoint from the original", async function () {
			const testEntity = await createFilledTestEntity()
			testEntity.testAssociation.pop()
			const added = await createTestEntityWithDummyResolver(TestAggregateRef, { _id: "addedAgId", testNumber: "2" })
			testEntity.testAssociation.push(added)

			const sk = aes256RandomKey()
			const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
			const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
			const encrypted = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(currentParsedInstance, new SubKeyInfoWithSessionKeyCbcThenHmac(sk))
			const addedJson = await dummyInstancePipeline.typeMapper.makeServerJson(encrypted.getAttributeByName("testAssociation").asNestedObjList()[0])

			const objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, encrypted)

			o(objectDiff).deepEquals([
				createPatch({
					attributePath: "3",
					value: OutgoingServerJson.getJsonRepresentationOfMultiple([addedJson]),
					patchOperation: PatchOperationType.REPLACE,
				}),
			])
		})

		o("emits network debugging attribute names on root and nested paths", async function () {
			await withOverriddenEnv({ networkDebugging: true }, async () => {
				const testEntity = await createFilledTestEntity()
				const date = new Date()
				testEntity.testDate = date
				testEntity.testAssociation[0].testNumber = "1234"

				o(await computeFixturePatches(testEntity)).deepEquals([
					createPatch({ attributePath: "5:testDate", value: `${date.valueOf()}`, patchOperation: PatchOperationType.REPLACE }),
					createPatch({ attributePath: "3/aggId/2:testNumber", value: "1234", patchOperation: PatchOperationType.REPLACE }),
				])
			})
		})
	})

	o.spec("computePatches guards and uncommon model shapes", function () {
		o("throws when the instances have different type refs", async function () {
			const entity = createExtEntity()
			const originalParsedInstance = await extPipeline.modelMapper.mapToDecryptedInstance(assertNotNull(entity._original))
			const aggregateParsedInstance = await extPipeline.modelMapper.mapToDecryptedInstance(entity.extAggOne)
			const encrypted = await extPipeline.cryptoMapper.encryptParsedInstance(
				originalParsedInstance,
				new SubKeyInfoWithSessionKeyCbcThenHmac(aes256RandomKey()),
			)

			const error = await assertThrows(Error, () => extPatchGenerator.computePatches(originalParsedInstance, aggregateParsedInstance, encrypted))
			o(error.message.includes("different TypeRef")).equals(true)
		})

		o("throws a ProgrammingError when the modified instance has duplicate aggregate ids", async function () {
			const entity = createExtEntity()
			entity.extAggAny.push(createExtAggregate("agg1", "dup"))

			const error = await assertThrows(ProgrammingError, () => extDiff(entity))
			o(error.message.includes("Duplicate aggregate ids for association extAggAny")).equals(true)
		})

		o("throws when a common aggregate cannot be found in the modified instance", async function () {
			const entity = createExtEntity()
			const modified = createExtEntity({ extAggAny: [createExtAggregate("other", "1")] })
			const originalParsedInstance = await extPipeline.modelMapper.mapToDecryptedInstance(assertNotNull(entity._original))
			const modifiedParsedInstance = await extPipeline.modelMapper.mapToDecryptedInstance(modified)
			// encrypted instance still contains the original aggregate ids
			const encryptedOfOriginal = await extPipeline.cryptoMapper.encryptParsedInstance(
				originalParsedInstance,
				new SubKeyInfoWithSessionKeyCbcThenHmac(aes256RandomKey()),
			)

			await assertThrows(Error, () => extPatchGenerator.computePatches(originalParsedInstance, modifiedParsedInstance, encryptedOfOriginal))
		})

		o("emits ADD_ITEM and REMOVE_ITEM for a SingleId association with Any cardinality", async function () {
			const entity = createExtEntity()
			entity.extSingleIdAny = ["b", "c"]

			const { patches } = await extDiff(entity)

			o(patches).deepEquals([
				createPatch({ attributePath: "4", value: '["c"]', patchOperation: PatchOperationType.ADD_ITEM }),
				createPatch({ attributePath: "4", value: '["a"]', patchOperation: PatchOperationType.REMOVE_ITEM }),
			])
		})

		o("emits only ADD_ITEM for a SingleId association with Any cardinality when ids are only added", async function () {
			const entity = createExtEntity()
			entity.extSingleIdAny.push("c")

			const { patches } = await extDiff(entity)

			o(patches).deepEquals([createPatch({ attributePath: "4", value: '["c"]', patchOperation: PatchOperationType.ADD_ITEM })])
		})

		o("ignores changes to a final association", async function () {
			const entity = createExtEntity()
			entity.extFinalAssoc = "changed"

			const { patches } = await extDiff(entity)

			o(patches).deepEquals([])
		})

		o("replaces an aggregation with One cardinality when the aggregate id changes", async function () {
			const entity = createExtEntity()
			entity.extAggOne = createExtAggregate("aggOne2", "x")

			const { patches, encrypted } = await extDiff(entity)
			const json = await extPipeline.typeMapper.makeServerJson(encrypted.getAttributeByName("extAggOne").asNestedObjList()[0])

			o(patches).deepEquals([
				createPatch({
					attributePath: "5",
					value: OutgoingServerJson.getJsonRepresentationOfMultiple([json]),
					patchOperation: PatchOperationType.REPLACE,
				}),
			])
		})

		o("patches a value inside an aggregation with One cardinality", async function () {
			const entity = createExtEntity()
			entity.extAggOne.extAggValue = "changed"

			const { patches } = await extDiff(entity)

			o(patches).deepEquals([createPatch({ attributePath: "5/aggOne/9", value: "changed", patchOperation: PatchOperationType.REPLACE })])
		})

		o("ignores changes to a final value", async function () {
			const entity = createExtEntity()
			entity.extFinalValue = "changed"

			const { patches } = await extDiff(entity)

			o(patches).deepEquals([])
		})
	})

	// A second, independent model that contains the association shapes missing from the shared fixtures:
	// SingleId with Any cardinality, Aggregation with One cardinality and a final association.
	const ExtTypeRef = new TypeRef<ExtEntity>("tutanota", 142)
	const ExtAggregateRef = new TypeRef<ExtAggregate>("tutanota", 143)

	type ExtAggregate = Entity & { _id: Id; extAggValue: string }
	type ExtEntity = Entity & {
		_id: [null, Id]
		extValue: string
		extFinalValue: string
		extSingleIdAny: Id[]
		extAggOne: ExtAggregate
		extFinalAssoc: Id | null
		extAggAny: ExtAggregate[]
	}

	const extTypeModel: TypeModel = {
		app: "tutanota",
		encrypted: true,
		id: 142,
		name: "ExtType",
		rootId: "SoMeId",
		since: 41,
		type: EntityTypeEnum.Element,
		isPublic: true,
		dependsOnVersion: null,
		values: {
			"1": { id: 1, name: "_id", type: ValueTypeEnum.GeneratedId, cardinality: CardinalityEnum.One, final: false, encrypted: false },
			"2": { id: 2, name: "extValue", type: ValueTypeEnum.String, cardinality: CardinalityEnum.One, final: false, encrypted: false },
			"3": { id: 3, name: "extFinalValue", type: ValueTypeEnum.String, cardinality: CardinalityEnum.One, final: true, encrypted: false },
		},
		associations: {
			"4": {
				id: 4,
				name: "extSingleIdAny",
				type: AssociationTypeEnum.ElementAssociation,
				cardinality: CardinalityEnum.Any,
				refTypeId: 44,
				final: false,
				dependency: null,
			},
			"5": {
				id: 5,
				name: "extAggOne",
				type: AssociationTypeEnum.Aggregation,
				cardinality: CardinalityEnum.One,
				refTypeId: 143,
				final: false,
				dependency: "tutanota",
			},
			"6": {
				id: 6,
				name: "extFinalAssoc",
				type: AssociationTypeEnum.ElementAssociation,
				cardinality: CardinalityEnum.ZeroOrOne,
				refTypeId: 44,
				final: true,
				dependency: null,
			},
			"7": {
				id: 7,
				name: "extAggAny",
				type: AssociationTypeEnum.Aggregation,
				cardinality: CardinalityEnum.Any,
				refTypeId: 143,
				final: false,
				dependency: "tutanota",
			},
		},
		version: 0,
		versioned: false,
	}

	const extAggregateModel: TypeModel = {
		app: "tutanota",
		encrypted: true,
		id: 143,
		name: "ExtAggregate",
		rootId: "SoMeId",
		since: 41,
		type: EntityTypeEnum.Aggregated,
		isPublic: true,
		dependsOnVersion: null,
		values: {
			"8": { id: 8, name: "_id", type: ValueTypeEnum.CustomId, cardinality: CardinalityEnum.One, final: true, encrypted: false },
			"9": { id: 9, name: "extAggValue", type: ValueTypeEnum.String, cardinality: CardinalityEnum.One, final: false, encrypted: false },
		},
		associations: {},
		version: 0,
		versioned: false,
	}

	const extTypeModelResolver: TypeModelResolver = object()
	extTypeModelResolver.resolveClientTypeReference = ((typeRef: TypeRef<Entity>) =>
		Promise.resolve(typeRef.typeId === extAggregateModel.id ? extAggregateModel : extTypeModel)) as any
	const extPipeline = new InstancePipeline(extTypeModelResolver, object(), SYMMETRIC_CIPHER_FACADE)
	const extPatchGenerator = new PatchGenerator(extPipeline)

	function createExtAggregate(id: Id, value: string): ExtAggregate {
		return { _type: ExtAggregateRef, _id: id, _original: null, extAggValue: value } as ExtAggregate
	}

	function createExtEntity(overrides: Partial<ExtEntity> = {}): ExtEntity {
		const entity = {
			_type: ExtTypeRef,
			_original: null,
			_id: [null, GENERATED_MIN_ID],
			extValue: "value",
			extFinalValue: "final",
			extSingleIdAny: ["a", "b"],
			extAggOne: createExtAggregate("aggOne", "x"),
			extFinalAssoc: null,
			extAggAny: [createExtAggregate("agg1", "1"), createExtAggregate("agg2", "2")],
			...overrides,
		} as ExtEntity
		entity._original = structuredClone(entity)
		return entity
	}

	async function extDiff(entity: ExtEntity) {
		const originalParsedInstance = await extPipeline.modelMapper.mapToDecryptedInstance(assertNotNull(entity._original))
		const currentParsedInstance = await extPipeline.modelMapper.mapToDecryptedInstance(entity)
		const encrypted = await extPipeline.cryptoMapper.encryptParsedInstance(
			currentParsedInstance,
			new SubKeyInfoWithSessionKeyCbcThenHmac(aes256RandomKey()),
		)
		const patches = await extPatchGenerator.computePatches(originalParsedInstance, currentParsedInstance, encrypted)
		return { patches, encrypted }
	}

	async function computeFixturePatches(testEntity: TestEntity) {
		const sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const currentEncryptedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		return patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentEncryptedInstance)
	}

	async function createTestEntityWithOriginal(overrides: Partial<TestEntity>): Promise<TestEntity> {
		const instance: TestEntity = await createTestEntityWithDummyResolver(TestTypeRef, overrides)
		instance._original = structuredClone(instance)
		return instance
	}

	async function createFilledTestEntity(): Promise<TestEntity> {
		return await createTestEntityWithOriginal({
			_type: TestTypeRef,
			testAssociation: [
				{
					_type: TestAggregateRef,
					_id: "aggId",
					testNumber: "123456",
					testSecondLevelAssociation: [
						{
							_type: TestAggregateOnAggregateRef,
							_id: "aggOnAggId",
							testBytes: null,
						} as TestAggregateOnAggregate,
					],
					testZeroOrOneAggregation: {
						_type: TestAggregateOnAggregateRef,
						_id: "aggOnAggId",
						testBytes: null,
					} as TestAggregateOnAggregate,
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
			testFinalBoolean: true,
		})
	}
	o("areValuesDifferent works as expected", async function () {
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.String, ParsedValue.fromString("example"), ParsedValue.fromString("example"))).equals(false)
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.String, ParsedValue.fromString("example"), ParsedValue.fromString("different"))).equals(true)
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.Number, ParsedValue.fromString("123"), ParsedValue.fromString("123"))).equals(false)
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.Number, ParsedValue.fromString("123"), ParsedValue.fromString("456"))).equals(true)
		o(
			patchGenerator.areValuesDifferent(
				ValueTypeEnum.Bytes,
				ParsedValue.fromByteArray(base64ToUint8Array(stringToBase64("byte"))),
				ParsedValue.fromByteArray(base64ToUint8Array(stringToBase64("byte"))),
			),
		).equals(false)
		o(
			patchGenerator.areValuesDifferent(
				ValueTypeEnum.Bytes,
				ParsedValue.fromByteArray(base64ToUint8Array(stringToBase64("byte"))),
				ParsedValue.fromByteArray(base64ToUint8Array(stringToBase64("different"))),
			),
		).equals(true)
		o(
			patchGenerator.areValuesDifferent(
				ValueTypeEnum.Date,
				ParsedValue.fromString(new Date(2025, 6, 6).getTime().toString()),
				ParsedValue.fromString(new Date(2025, 6, 6).getTime().toString()),
			),
		).equals(false)
		o(
			patchGenerator.areValuesDifferent(
				ValueTypeEnum.Date,
				ParsedValue.fromString(new Date(2025, 6, 6).getTime().toString()),
				ParsedValue.fromString(new Date(2025, 6, 5).getTime().toString()),
			),
		).equals(true)
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.Boolean, ParsedValue.fromBoolean(true), ParsedValue.fromBoolean(true))).equals(false)
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.Boolean, ParsedValue.fromBoolean(true), ParsedValue.fromBoolean(false))).equals(true)
		o(
			patchGenerator.areValuesDifferent(ValueTypeEnum.GeneratedId, ParsedValue.fromString(GENERATED_MIN_ID), ParsedValue.fromString(GENERATED_MIN_ID)),
		).equals(false)
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.GeneratedId, ParsedValue.fromId(GENERATED_MIN_ID), ParsedValue.fromId(GENERATED_MAX_ID))).equals(true)
		const programmingError = await assertThrows(ProgrammingError, async () =>
			patchGenerator.areValuesDifferent(
				ValueTypeEnum.GeneratedId,
				ParsedValue.fromIdTuple([GENERATED_MIN_ID, GENERATED_MIN_ID]),
				ParsedValue.fromIdTuple([GENERATED_MIN_ID, GENERATED_MIN_ID]),
			),
		)
		o(programmingError.message).equals("Possibly patching IdTuple on _id ------------,------------")

		o(patchGenerator.areValuesDifferent(ValueTypeEnum.CustomId, ParsedValue.fromString("customId"), ParsedValue.fromString("customId"))).equals(false)
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.CustomId, ParsedValue.fromString("customId"), ParsedValue.fromString("differentCustomId"))).equals(
			true,
		)
		o(
			patchGenerator.areValuesDifferent(
				ValueTypeEnum.CompressedString,
				ParsedValue.fromByteArray(stringToUtf8Uint8Array("compress string")),
				ParsedValue.fromByteArray(stringToUtf8Uint8Array("compress string")),
			),
		).equals(false)
		o(
			patchGenerator.areValuesDifferent(
				ValueTypeEnum.CompressedString,
				ParsedValue.fromString("compress string"),
				ParsedValue.fromString("compress different string"),
			),
		).equals(true)
	})
})
