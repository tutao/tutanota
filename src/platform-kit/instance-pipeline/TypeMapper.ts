import { TypeModelResolver } from "./EntityFunctions"
import {
	AssociationReprType,
	AttributeId,
	AttributeModel,
	AttributeName,
	ClientTypeModel,
	deepMapKeys,
	Entity,
	getAssociationRepresentationType,
	getIdType,
	IdType,
	isSameTypeRef,
	ServerTypeModel,
	TypeModel,
	TypeRef,
} from "@tutao/meta"
import { ParsedValue } from "./ParsedValue"
import { assert, assertNotNull, deepEqual, DeepEquals, isNotNull, Nullable, uint8ArrayToBase64 } from "@tutao/utils"
import { EncryptedParsedInstance, EncryptedParsedValue } from "./CryptoMapper"
import { assertNotNaN } from "../utils/Utils"
import { isTest } from "@tutao/app-env"

export class TypeMapper {
	constructor(private readonly typeModelResolver: TypeModelResolver) {}

	async parseServerJson(jsonInstance: IncomingServerJson): Promise<EncryptedParsedInstance> {
		const typeModel = jsonInstance.typeModel
		const clientParsedInstance = EncryptedParsedInstance.incomingFromServer(typeModel)

		for (const valueModel of Object.values(typeModel.values)) {
			const valueId = valueModel.id
			const encryptedParsedValue = jsonInstance.getValueById(valueId)
			clientParsedInstance.addAttributeById(valueId, encryptedParsedValue)
		}

		for (const associationModel of Object.values(typeModel.associations)) {
			const associationId = associationModel.id
			switch (getAssociationRepresentationType(associationModel.type)) {
				case AssociationReprType.Aggregation: {
					const aggregationTypeRef = new TypeRef(associationModel.dependency ?? typeModel.app, associationModel.refTypeId)
					const aggregatedTypeModel = await this.typeModelResolver.resolveServerTypeReference(aggregationTypeRef)
					const associationValue = jsonInstance.getAggregationList(associationId, aggregatedTypeModel)
					const mappedAggregates = associationValue.map(async (assoc) => await this.parseServerJson(assoc))
					clientParsedInstance.addAttributeById(associationId, ParsedValue.fromNestedItems(await Promise.all(mappedAggregates)))
					break
				}
				case AssociationReprType.IdTuple: {
					const idTupleList = jsonInstance.getIdTupleList(associationId)
					clientParsedInstance.addAttributeById(associationId, ParsedValue.fromIdTupleList(idTupleList))
					break
				}
				case AssociationReprType.SingleId: {
					const idList = jsonInstance.getIdList(associationId)
					clientParsedInstance.addAttributeById(associationId, ParsedValue.fromIdList(idList))
					break
				}
			}
		}

		return clientParsedInstance
	}

	async makeServerJson(encryptedInstance: EncryptedParsedInstance): Promise<OutgoingServerJson> {
		const typeModel = encryptedInstance.ensureOutgoing()
		const serverJson = OutgoingServerJson.newEmpty(encryptedInstance.ensureOutgoing())

		for (const modelValue of Object.values(typeModel.values)) {
			const attrId = modelValue.id
			serverJson.addValue(attrId, modelValue.name, encryptedInstance.getAttributeById(attrId))
		}

		for (const modelAssociation of Object.values(typeModel.associations)) {
			const attrId = modelAssociation.id
			const associationValue = encryptedInstance.getAttributeById(attrId)

			switch (getAssociationRepresentationType(modelAssociation.type)) {
				case AssociationReprType.Aggregation: {
					const mappedAggregations = associationValue.asNestedObjList().map((agg) => this.makeServerJson(agg))
					serverJson.addAggregationList(attrId, await Promise.all(mappedAggregations))
					break
				}
				case AssociationReprType.IdTuple:
					serverJson.addIdTupleList(attrId, associationValue.asIdTupleList())
					break
				case AssociationReprType.SingleId:
					serverJson.addIdList(attrId, associationValue.asIdList())
					break
			}
		}

		return serverJson
	}
}

export class IncomingServerJson implements DeepEquals {
	private readonly json: Record<AttributeId, any> = {}

	private constructor(
		json: Record<string, any>,
		public readonly typeModel: ServerTypeModel,
	) {
		this.json = deepMapKeys<AttributeId>(json, (key: string) => {
			const [attributeIdStr, _attributeName] = key.split(":")
			return assertNotNaN(parseInt(attributeIdStr))
		})
	}

	public static expectSingleInstance(data: any, typeModel: ServerTypeModel): IncomingServerJson {
		const parsedJson = JSON.parse(data, (k, v) => (k === "__proto__" ? undefined : v))
		assert(!Array.isArray(parsedJson), "Expected single instance. But response is an array")
		return new IncomingServerJson(parsedJson, typeModel)
	}

	public static expectSingleMailDetailsBlob(data: any, typeModel: ServerTypeModel): IncomingServerJson {
		assert(typeof data === "object" && !Array.isArray(data), "Expected single instance. But response is an array")
		return new IncomingServerJson(data, typeModel)
	}

	public static expectMultipleInstance(data: any, typeModel: ServerTypeModel): Array<IncomingServerJson> {
		const parsedJson = JSON.parse(data, (k, v) => (k === "__proto__" ? undefined : v))
		assert(Array.isArray(parsedJson), "Expected multiple instances. But response is not an array")

		return (parsedJson as Array<any>).map((item) => {
			assert(!Array.isArray(item), "Expected array of instances. Found nested array")
			return new IncomingServerJson(item as Record<string, any>, typeModel)
		})
	}
	public static expectMultipleDesktopAlarms(data: any, typeModel: ServerTypeModel): Array<IncomingServerJson> {
		assert(Array.isArray(data), "Expected multiple instances. But response is not an array")
		return (data as Array<any>).map((item) => {
			assert(!Array.isArray(item), "Expected array of instances. Found nested array")
			return new IncomingServerJson(item as Record<string, any>, typeModel)
		})
	}

	getValueById(attrId: AttributeId): EncryptedParsedValue {
		const rawValue = this.json[attrId]
		const valueModel = this.typeModel.values[attrId] ?? null

		if (isNotNull(valueModel) && valueModel.name === "_id") {
			switch (getIdType(this.typeModel)) {
				case IdType.SingleId:
					return ParsedValue.fromString(rawValue)
				case IdType.IdTuple:
					return ParsedValue.fromIdTuple(rawValue)
			}
		}
		if (rawValue == null) {
			return ParsedValue.fromNull()
		} else {
			return ParsedValue.fromString(rawValue)
		}
	}

	getValueByName(attributeName: AttributeName): EncryptedParsedValue {
		const attributeId = assertNotNull(AttributeModel.getAttributeId(this.typeModel, attributeName))
		return this.getValueById(attributeId)
	}

	private getAssociation<A>(attrId: AttributeId): Array<A> {
		const assoc = assertNotNull(this.typeModel.associations[attrId], `Attribute: ${attrId} is not an association of this type`)
		return assertNotNull(
			this.json[attrId],
			`Association ${assoc.name} does not exists in type: ${this.typeModel.app}/${this.typeModel.name}.. \n. ${JSON.stringify(this.json)}`,
		)
	}

	getAggregationList(attrId: AttributeId, aggregatedTypeModel: ServerTypeModel): Array<IncomingServerJson> {
		return this.getAssociation<Record<string, any>>(attrId).map((j) => new IncomingServerJson(j, aggregatedTypeModel))
	}

	getIdList(attrId: AttributeId): Array<Id> {
		return this.getAssociation<Id>(attrId)
	}

	getIdTupleList(attrId: AttributeId): Array<IdTuple> {
		return this.getAssociation<IdTuple>(attrId)
	}

	getTypeRef(): TypeRef<Entity> {
		return new TypeRef(this.typeModel.app, this.typeModel.id)
	}

	deepEquals(other: this): boolean {
		return isSameTypeRef(this.getTypeRef(), other.getTypeRef()) && deepEqual(this.json, other.json)
	}

	getInnerJson(): Record<AttributeId, any> {
		return this.json
	}
}

export class OutgoingServerJson implements DeepEquals {
	private constructor(
		private readonly typeModel: ClientTypeModel,
		private readonly json: Record<AttributeName, unknown>,
	) {}

	public static newEmpty(typeModel: ClientTypeModel): OutgoingServerJson {
		return new OutgoingServerJson(typeModel, {})
	}

	public getJsonRepresentation(): string {
		return JSON.stringify(this.json)
	}

	public static getJsonRepresentationOfMultiple(jsons: Array<OutgoingServerJson>): string {
		return "[" + jsons.map((json) => json.getJsonRepresentation()).join(",") + "]"
	}

	public static stringifyIdList(idList: Array<Id>): string {
		return JSON.stringify(idList)
	}

	public static stringifyIdTupleList(idTupleList: Array<IdTuple>): string {
		return JSON.stringify(idTupleList)
	}

	public static stringifyBytes(bytes: Uint8Array): string {
		return uint8ArrayToBase64(bytes)
	}

	public static stringifyNumber(num: number): string {
		return num.toString()
	}

	public static networkDebuggedKey(attrId: AttributeId, typeModel: TypeModel): string {
		if (env.networkDebugging) {
			return attrId.toString() + ":" + AttributeModel.getAttributeName(typeModel, attrId)
		}
		return attrId.toString()
	}

	addValue<EncryptedOrDecrypted extends DeepEquals>(attrId: AttributeId, attrName: string, value: ParsedValue<EncryptedOrDecrypted>) {
		const key = OutgoingServerJson.networkDebuggedKey(attrId, this.typeModel)
		if (attrName === "_id" && !value.isNull()) {
			switch (getIdType(this.typeModel)) {
				case IdType.SingleId:
					this.json[key] = value.asId()
					break
				case IdType.IdTuple:
					this.json[key] = value.asIdTuple()
			}
		} else {
			this.json[key] = value.getNullWhenNull()?.asString() ?? null
		}
	}

	addAggregationList(attrId: AttributeId, value: Array<OutgoingServerJson>) {
		const attributeKey = OutgoingServerJson.networkDebuggedKey(attrId, this.typeModel)
		this.json[attributeKey] = value.map((v) => v.json)
	}

	addIdTupleList(attrId: AttributeId, value: Array<IdTuple>) {
		const attributeKey = OutgoingServerJson.networkDebuggedKey(attrId, this.typeModel)
		this.json[attributeKey] = value
	}

	addIdList(attrId: AttributeId, value: Array<Id>) {
		const attributeKey = OutgoingServerJson.networkDebuggedKey(attrId, this.typeModel)
		this.json[attributeKey] = value
	}

	public static newFromRecord(json: Record<AttributeName, unknown>, clientModel: Nullable<ClientTypeModel> = null) {
		assert(isTest(), "Do not construct with raw record in non-test environment")
		return new OutgoingServerJson(clientModel as any, json)
	}

	getTypeRef(): TypeRef<unknown> {
		return new TypeRef<unknown>(this.typeModel.app, this.typeModel.id)
	}

	deepEquals(other: this): boolean {
		return isSameTypeRef(this.getTypeRef(), other.getTypeRef()) && deepEqual(this.json, other.json)
	}

	getInnerJson(): Record<string, any> {
		return this.json
	}
}
