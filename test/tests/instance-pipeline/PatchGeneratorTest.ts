import o from "@tutao/otest"
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
import { aes256RandomKey, SubKeyInfoWithSessionKey, SymmetricCipherVersion } from "../../../src/platform-kit/crypto"
import { assertNotNull, base64ToUint8Array, stringToUtf8Uint8Array, uint8ArrayToBase64 } from "../../../src/platform-kit/utils"
import { GENERATED_MAX_ID, GENERATED_MIN_ID, ValueTypeEnum } from "../../../src/platform-kit/meta"
import { createTestEntityWithDummyResolver } from "../TestUtils"

import { object } from "testdouble"

import { createPatch } from "@tutao/entities/sys"
import { SYMMETRIC_CIPHER_FACADE } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/SymmetricCipherFacade"
import { ParsedValue } from "../../../src/platform-kit/instance-pipeline/ParsedValue"

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
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentUntypedInstance)
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
				attributePath: "14",
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
		const subKeyInfo = new SubKeyInfoWithSessionKey(SymmetricCipherVersion.AesCbcThenHmac, sk)
		const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(currentParsedInstance, subKeyInfo)

		const firstTestAssociationEncryptedInstance = currentEncryptedParsedInstance.getAttributeByName("testAssociation")[1]
		const secondTestAssociationEncryptedInstance = currentEncryptedParsedInstance.getAttributeByName("testAssociation")[2]
		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentEncryptedParsedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3",
				value: JSON.stringify([firstTestAssociationEncryptedInstance, secondTestAssociationEncryptedInstance]),
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
		const subKeyInfo = new SubKeyInfoWithSessionKey(SymmetricCipherVersion.AesCbcThenHmac, sk)
		const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(currentParsedInstance, subKeyInfo)
		const encryptedAssociationArray = currentEncryptedParsedInstance.getAttributeByName("testAssociation")

		const testAssociationFirstEncryptedInstance = encryptedAssociationArray[0]
		const testAssociationSecondEncryptedInstance = encryptedAssociationArray[1]
		const testAssociationOriginalEncryptedInstance = encryptedAssociationArray[2]
		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentEncryptedParsedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3",
				value: JSON.stringify([
					testAssociationFirstEncryptedInstance,
					testAssociationSecondEncryptedInstance,
					testAssociationOriginalEncryptedInstance,
				]),
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
		const subKeyInfo = new SubKeyInfoWithSessionKey(SymmetricCipherVersion.AesCbcThenHmac, sk)
		const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(currentParsedInstance, subKeyInfo)

		const testAggregateEncrypted = currentEncryptedParsedInstance.getAttributeByName("testAssociation").asNestedObjList()[0]
		const addedTestAggregateOnAggregateEncrypted = testAggregateEncrypted.getAttributeByName("testZeroOrOneAggregation")[0]

		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentEncryptedParsedInstance)

		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3/aggId/10",
				value: JSON.stringify([addedTestAggregateOnAggregateEncrypted]),
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
		const subKeyInfo = new SubKeyInfoWithSessionKey(SymmetricCipherVersion.AesCbcThenHmac, sk)
		const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(currentParsedInstance, subKeyInfo)
		const currentUntypedInstance = await dummyInstancePipeline.mapAndEncryptToParsedInstance(TestTypeRef, testEntity, sk)
		const testAssociationEncrypted = currentEncryptedParsedInstance.getAttributeByName("testAssociation").asNestedObjList()[0]

		const addedTestAggregateOnAggregateEncrypted = testAssociationEncrypted[0].getAttributeByName("testZeroOrOneAggregation")[0]
		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentUntypedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3/aggId/10",
				value: JSON.stringify([addedTestAggregateOnAggregateEncrypted]),
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
		const subKeyInfo = new SubKeyInfoWithSessionKey(SymmetricCipherVersion.AesCbcThenHmac, sk)
		const currentEncryptedParsedInstance = await dummyInstancePipeline.cryptoMapper.encryptParsedInstance(currentParsedInstance, subKeyInfo)

		const testAggregateEncrypted = currentEncryptedParsedInstance.getAttributeByName("testAssociation").asNestedObjList()[0]
		const addedTestAggregateOnAggregateEncrypted = testAggregateEncrypted.getAttributeByName("testSecondLevelAssociation").asNestedObjList()[1]

		let objectDiff = await patchGenerator.computePatches(originalParsedInstance, currentParsedInstance, currentEncryptedParsedInstance)
		o(objectDiff).deepEquals([
			createPatch({
				attributePath: "3/aggId/9",
				value: JSON.stringify([addedTestAggregateOnAggregateEncrypted]),
				patchOperation: PatchOperationType.ADD_ITEM,
			}),
		])
	})

	o("computePatches works on aggregates on aggregations and removeitem operation", async function () {
		const testEntity = await createFilledTestEntity()

		testEntity.testAssociation[0].testSecondLevelAssociation.pop()

		let sk = aes256RandomKey()
		const originalParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(assertNotNull(testEntity._original))
		const currentParsedInstance = await dummyInstancePipeline.modelMapper.mapToDecryptedInstance(testEntity)
		const subKeyInfo = new SubKeyInfoWithSessionKey(SymmetricCipherVersion.AesCbcThenHmac, sk)
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
	o("areValuesDifferent works as expected", function () {
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.String, ParsedValue.fromString("example"), ParsedValue.fromString("example"))).equals(false)
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.String, ParsedValue.fromString("example"), ParsedValue.fromString("different"))).equals(true)
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.Number, ParsedValue.fromString("123"), ParsedValue.fromString("123"))).equals(false)
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.Number, ParsedValue.fromString("123"), ParsedValue.fromString("456"))).equals(true)
		o(
			patchGenerator.areValuesDifferent(
				ValueTypeEnum.Bytes,
				ParsedValue.fromByteArray(base64ToUint8Array("byte")),
				ParsedValue.fromByteArray(base64ToUint8Array("byte")),
			),
		).equals(false)
		o(
			patchGenerator.areValuesDifferent(
				ValueTypeEnum.Bytes,
				ParsedValue.fromByteArray(base64ToUint8Array("byte")),
				ParsedValue.fromByteArray(base64ToUint8Array("different")),
			),
		).equals(true)
		o(
			patchGenerator.areValuesDifferent(
				ValueTypeEnum.Date,
				ParsedValue.fromString(new Date(2025, 6, 6).toString()),
				ParsedValue.fromString(new Date(2025, 6, 6).toString()),
			),
		).equals(false)
		o(
			patchGenerator.areValuesDifferent(
				ValueTypeEnum.Date,
				ParsedValue.fromString(new Date(2025, 6, 6).toString()),
				ParsedValue.fromString(new Date(2025, 6, 5).toString()),
			),
		).equals(true)
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.Boolean, ParsedValue.fromBoolean(true), ParsedValue.fromBoolean(true))).equals(false)
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.Boolean, ParsedValue.fromBoolean(true), ParsedValue.fromBoolean(false))).equals(true)
		o(
			patchGenerator.areValuesDifferent(ValueTypeEnum.GeneratedId, ParsedValue.fromString(GENERATED_MIN_ID), ParsedValue.fromString(GENERATED_MIN_ID)),
		).equals(false)
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.GeneratedId, ParsedValue.fromId(GENERATED_MIN_ID), ParsedValue.fromId(GENERATED_MIN_ID))).equals(true)
		o(
			patchGenerator.areValuesDifferent(
				ValueTypeEnum.GeneratedId,
				ParsedValue.fromIdTuple([GENERATED_MIN_ID, GENERATED_MIN_ID]),
				ParsedValue.fromIdTuple([GENERATED_MIN_ID, GENERATED_MIN_ID]),
			),
		).equals(false)
		o(
			patchGenerator.areValuesDifferent(
				ValueTypeEnum.GeneratedId,
				ParsedValue.fromIdTuple([GENERATED_MIN_ID, GENERATED_MIN_ID]),
				ParsedValue.fromIdTuple([GENERATED_MIN_ID, GENERATED_MAX_ID]),
			),
		).equals(true)
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.CustomId, ParsedValue.fromString("customId"), ParsedValue.fromString("customId"))).equals(false)
		o(patchGenerator.areValuesDifferent(ValueTypeEnum.CustomId, ParsedValue.fromString("customId"), ParsedValue.fromString("differentCustomId"))).equals(
			true,
		)
		// FIXME fromByteArray or String?
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
