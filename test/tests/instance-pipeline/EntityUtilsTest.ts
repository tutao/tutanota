import o, { assertThrows } from "@tutao/otest"
import { Cardinality, ValueTypeEnum } from "../../../src/platform-kit/meta"
import { ProgrammingError } from "../../../src/platform-kit/app-env"
import { EntityUtils } from "../../../src/platform-kit/instance-pipeline/EntityUtils"
import { createEncryptedValueType } from "./InstancePipelineTestUtils"
import { ParsedValue } from "../../../src/platform-kit/instance-pipeline/PipelineTypes"
import { stringToBase64, uint8ArrayToBase64 } from "../../../src/platform-kit/utils"
import { random } from "../../../src/platform-kit/crypto"

o.spec("EntityUtilsTest", () => {
	o.spec("default value mappings", function () {
		o("valueToDefault and isDefaultValue are compatible", async function () {
			o(EntityUtils.isDefaultValue(ValueTypeEnum.String, EntityUtils.valueToDefault(ValueTypeEnum.String))).equals(true)
			o(EntityUtils.isDefaultValue(ValueTypeEnum.Number, EntityUtils.valueToDefault(ValueTypeEnum.Number))).equals(true)
			o(EntityUtils.isDefaultValue(ValueTypeEnum.Bytes, EntityUtils.valueToDefault(ValueTypeEnum.Bytes))).equals(true)
			o(EntityUtils.isDefaultValue(ValueTypeEnum.Date, EntityUtils.valueToDefault(ValueTypeEnum.Date))).equals(true)
			o(EntityUtils.isDefaultValue(ValueTypeEnum.Boolean, EntityUtils.valueToDefault(ValueTypeEnum.Boolean))).equals(true)
			o(EntityUtils.isDefaultValue(ValueTypeEnum.CompressedString, EntityUtils.valueToDefault(ValueTypeEnum.CompressedString))).equals(true)

			await assertThrows(ProgrammingError, async () => EntityUtils.valueToDefault(ValueTypeEnum.GeneratedId))
			await assertThrows(ProgrammingError, async () => EntityUtils.valueToDefault(ValueTypeEnum.CustomId))
			await assertThrows(ProgrammingError, async () => EntityUtils.isDefaultValue(ValueTypeEnum.GeneratedId, ""))
			await assertThrows(ProgrammingError, async () => EntityUtils.isDefaultValue(ValueTypeEnum.CustomId, ""))
		})
	})

	o.spec("setting jsValue from stringValue", () => {
		o("convert value to JS Date", () => {
			const value = new Date().getTime().toString()
			const modelValueEncrypted = createEncryptedValueType(ValueTypeEnum.Date, Cardinality.One)
			const modelValueUnEncrypted = { ...modelValueEncrypted, encrypted: false }

			const result: Record<string, any> = {}
			EntityUtils.setValue(modelValueUnEncrypted, "unencrypted", ParsedValue.fromString(value), result)
			EntityUtils.setValue(modelValueEncrypted, "encrypted", ParsedValue.fromString(stringToBase64(value)), result)

			o(result["encrypted"]).deepEquals(new Date(parseInt(value)))
			o(result["unencrypted"]).deepEquals(new Date(parseInt(value)))
		})

		o("convert boolean string to JS boolean", () => {
			const modelValueEncrypted = createEncryptedValueType(ValueTypeEnum.Boolean, Cardinality.One)
			const modelValueUnEncrypted = { ...modelValueEncrypted, encrypted: false }

			const result: Record<string, any> = {}
			EntityUtils.setValue(modelValueUnEncrypted, "unencrypted", ParsedValue.fromString("1"), result)
			EntityUtils.setValue(modelValueEncrypted, "encrypted", ParsedValue.fromString(stringToBase64("55")), result)

			o(result["encrypted"]).deepEquals(true)
			o(result["unencrypted"]).deepEquals(true)
		})

		o("convert number string to JS numberString", () => {
			const modelValueEncrypted = createEncryptedValueType(ValueTypeEnum.Number, Cardinality.One)
			const modelValueUnEncrypted = { ...modelValueEncrypted, encrypted: false }

			const result: Record<string, any> = {}
			EntityUtils.setValue(modelValueUnEncrypted, "unencrypted", ParsedValue.fromString("100"), result)
			EntityUtils.setValue(modelValueEncrypted, "encrypted", ParsedValue.fromString(stringToBase64("100")), result)

			o(result["encrypted"]).deepEquals("100")
			o(result["unencrypted"]).deepEquals("100")
		})

		o("convert base64 bytes to JS Uint8Array", () => {
			const modelValueEncrypted = createEncryptedValueType(ValueTypeEnum.Bytes, Cardinality.One)
			const modelValueUnEncrypted = { ...modelValueEncrypted, encrypted: false }

			const result: Record<string, any> = {}
			const value = random.generateRandomData(15)
			EntityUtils.setValue(modelValueUnEncrypted, "unencrypted", ParsedValue.fromString(uint8ArrayToBase64(value)), result)
			EntityUtils.setValue(modelValueEncrypted, "encrypted", ParsedValue.fromString(uint8ArrayToBase64(value)), result)

			o(result["encrypted"]).deepEquals(value)
			o(result["unencrypted"]).deepEquals(value)
		})

		o("convert compressedString to JS string", () => {
			const modelValueEncrypted = createEncryptedValueType(ValueTypeEnum.CompressedString, Cardinality.One)
			const modelValueUnEncrypted = { ...modelValueEncrypted, encrypted: false }

			const result: Record<string, any> = {}
			EntityUtils.setValue(modelValueUnEncrypted, "unencrypted", ParsedValue.fromString(""), result)
			EntityUtils.setValue(modelValueEncrypted, "encrypted", ParsedValue.fromString(stringToBase64("QHRlc3Q=")), result)

			o(result["encrypted"]).deepEquals("test")
			o(result["unencrypted"]).deepEquals("")
		})
	})
	o.spec("getting stringValue from jsValue", function () {
		o("convert unencrypted Date to DB type", function () {
			let value = new Date()
			const modelValue = { ...createEncryptedValueType(ValueTypeEnum.Date, Cardinality.One), encrypted: false }
			o(EntityUtils.getValue(modelValue, value).asDate()).equals(value)
		})

		o("convert unencrypted Bytes to DB type", function () {
			let valueBytes = random.generateRandomData(15)
			const modelValue = { ...createEncryptedValueType(ValueTypeEnum.Bytes, Cardinality.One), encrypted: false }
			const dbBytes = EntityUtils.getValue(modelValue, valueBytes)
			o(dbBytes.asString()).deepEquals(uint8ArrayToBase64(valueBytes))
			o(dbBytes.asByteArray()).deepEquals(valueBytes)
		})

		o("convert unencrypted Boolean to DB type", function () {
			const modelValue = { ...createEncryptedValueType(ValueTypeEnum.Boolean, Cardinality.One), encrypted: false }

			const dbBooleanTrue = EntityUtils.getValue(modelValue, true)
			o(dbBooleanTrue.asString()).deepEquals("1")
			o(dbBooleanTrue.asBoolean()).deepEquals(true)

			const dbBooleanFalse = EntityUtils.getValue(modelValue, false)
			o(dbBooleanFalse.asString()).deepEquals("0")
			o(dbBooleanFalse.asBoolean()).deepEquals(false)
		})

		o("convert unencrypted Number to DB type", function () {
			const modelValue = { ...createEncryptedValueType(ValueTypeEnum.Boolean, Cardinality.One), encrypted: false }

			const dbNumber = EntityUtils.getValue(modelValue, "565")
			o(dbNumber.asString()).deepEquals("565")
		})
	})
})
