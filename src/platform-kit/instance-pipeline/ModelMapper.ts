import { assertWorkerOrNode, InvalidModelError, isTest, ProgrammingError } from "@tutao/app-env"
import { assert, assertNotNull, base64ToBase64Url, DeepEquals, isNotNull, Nullable, promiseMap, uint8ArrayToBase64 } from "@tutao/utils"
import {
	AssociationReprType,
	AttributeId,
	AttributeName,
	Cardinality,
	ClientTypeModel,
	Entity,
	getAssociationReprType,
	getIdType,
	IdType,
	isSameTypeRef,
	ModelAssociation,
	ModelValue,
	Type,
	TypeRef,
} from "@tutao/meta"
import { TypeModelResolver } from "./EntityFunctions"
import { random } from "@tutao/crypto"
import { EntityUtils } from "./EntityUtils"
import { ParsedValue } from "./ParsedValue"
import { DecryptedParsedInstance, DecryptedParsedValue } from "./CryptoMapper"

assertWorkerOrNode()

/**
 * this mapper is responsible for "migrations" and checking model correctness, mostly field types and cardinalities.
 *
 * it maps between the plain Instance objects used in the clients business logic and the ParsedInstance representation
 * which conforms to the server's model and is closer to the Instance format that is used on the server.
 *
 * There are unsafe model transformations that can result in data loss if not executed carefully.
 * See the tutadb documentation on lossy migrations.
 * This class is also responsible for checking for those as much as possible.
 *
 */
export class ModelMapper {
	constructor(private readonly typeModelResolver: TypeModelResolver) {}

	async mapToInstances<T extends Entity>(parsedInstances: Array<DecryptedParsedInstance>): Promise<Array<T>> {
		return await promiseMap(parsedInstances, (parsedInstance) => this.mapToInstance(parsedInstance))
	}

	async mapToInstance<T extends Entity>(parsedInstance: DecryptedParsedInstance): Promise<T> {
		return (await this._mapToInstance(parsedInstance)).castAsEntity<T>()
	}

	async mapToDecryptedInstance<T extends Entity>(passedInstance: T): Promise<DecryptedParsedInstance> {
		const clientTypeModel = await this.typeModelResolver.resolveClientTypeReference(passedInstance._type)
		const instance = new OutgoingClientEntity(passedInstance, clientTypeModel)
		return this._mapToDecryptedInstance(instance)
	}

	private async _mapToDecryptedInstance(instance: OutgoingClientEntity): Promise<DecryptedParsedInstance> {
		const clientTypeModel = instance.typeModel
		const parsedInstance = DecryptedParsedInstance.outgoingToServer(clientTypeModel)

		for (const modelValue of Object.values(clientTypeModel.values)) {
			const valueId = modelValue.id
			let parsedValue: DecryptedParsedValue = instance.getValue(modelValue)

			if (clientTypeModel.type === Type.Aggregated && modelValue.name === "_id" && parsedValue.isNull()) {
				const randomAggregateId = base64ToBase64Url(uint8ArrayToBase64(random.generateRandomData(4)))
				parsedValue = ParsedValue.fromString(randomAggregateId)
			}

			parsedInstance.addAttribute(valueId, parsedValue)
		}

		for (const modelAssociation of Object.values(clientTypeModel.associations)) {
			const associationId = modelAssociation.id

			switch (getAssociationReprType(modelAssociation.type)) {
				case AssociationReprType.Aggregation: {
					const aggregateTypeRef = new TypeRef(modelAssociation.dependency ?? clientTypeModel.app, modelAssociation.refTypeId)
					const aggregateTypeModel = await this.typeModelResolver.resolveClientTypeReference(aggregateTypeRef)
					const aggregates = instance.getAggregationList(modelAssociation, aggregateTypeModel)
					const mappedAggregates = await promiseMap(aggregates, (agg) => this._mapToDecryptedInstance(agg))
					parsedInstance.addAttribute(associationId, ParsedValue.fromNestedItems(mappedAggregates))
					break
				}
				case AssociationReprType.SingleId: {
					const idList = instance.getIdList(modelAssociation)
					parsedInstance.addAttribute(associationId, ParsedValue.fromIdList(idList))
					break
				}
				case AssociationReprType.IdTuple: {
					const idTupleList = instance.getIdTupleList(modelAssociation)
					parsedInstance.addAttribute(associationId, ParsedValue.fromIdTupleList(idTupleList))
					break
				}
			}
		}

		return parsedInstance
	}

	private async _mapToInstance(parsedInstance: DecryptedParsedInstance): Promise<ClientEntity> {
		// in case of a new type, the server should not send it to clients until the oldest client can handle it.
		// if a type is not in the client's model anymore, it should have been removed from the business logic and
		// the server should have stopped sending it by now.
		const typeRef = parsedInstance.getTypeRef()
		const clientTypeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		const serverTypeModel = parsedInstance.ensureIncoming()

		const clientInstance = new ClientEntity(clientTypeModel)
		if (parsedInstance.hasError()) {
			// if we do this unconditionally, we get an explicit {_errors: undefined, ... } in cases where
			// decryption was successful.
			// that would mess with places that check for the presence of the field.
			clientInstance.setErrors(parsedInstance.getErrors())
		}

		for (const clientModelValue of Object.values(clientTypeModel.values)) {
			const valueId = clientModelValue.id
			const serverModelValue = serverTypeModel.values[valueId] ?? null

			const value = parsedInstance.getAttributeByIdOrNull(valueId) ?? ParsedValue.fromNull()
			const valueToKeep = this.assertCorrectValueCardinality(typeRef, serverModelValue, clientModelValue, value)
			clientInstance.setValue(clientModelValue.id, valueToKeep)
		}

		for (const associationModel of Object.values(clientTypeModel.associations)) {
			const association = parsedInstance.getAttributeById(associationModel.id)
			switch (getAssociationReprType(associationModel.type)) {
				case AssociationReprType.Aggregation: {
					const aggregates = await promiseMap(association.asNestedObjList(), async (agg) => await this._mapToInstance(agg))
					clientInstance.setAggregations(associationModel.id, aggregates)
					break
				}
				case AssociationReprType.IdTuple:
					clientInstance.setIdTupleList(associationModel.id, association.asIdTupleList())
					break
				case AssociationReprType.SingleId:
					clientInstance.setIdList(associationModel.id, association.asIdList())
					break
			}
		}

		return clientInstance
	}

	/**
	 * check that a field on an instance conforms to the cardinality requirements in its server or client type model and
	 *
	 * @return a value that can be assigned to a ParsedInstance or Instance (depending on the direction)
	 */
	assertCorrectValueCardinality(
		typeRef: TypeRef<unknown>,
		serverModelValue: Nullable<ModelValue>,
		clientModelValue: ModelValue,
		value: DecryptedParsedValue,
	): DecryptedParsedValue {
		let valueToKeep = value

		const isDeletedOnServerAndClientHaveOneCardinality = serverModelValue == null && clientModelValue.cardinality === Cardinality.One
		const valueIsNullButServerHaveCardinalityOne = isNotNull(serverModelValue) && valueToKeep.isNull() && serverModelValue.cardinality === Cardinality.One

		if (isDeletedOnServerAndClientHaveOneCardinality || valueIsNullButServerHaveCardinalityOne) {
			valueToKeep = EntityUtils.valueToDefault(clientModelValue.type)
		}

		const cardinality = clientModelValue.cardinality
		if (cardinality === Cardinality.One && valueToKeep.isNull()) {
			throw new InvalidModelError(`Expected non-null value for attribute with One cardinality. ${typeRef.toString()}/${clientModelValue.name}`)
		} else if (cardinality === Cardinality.Any) {
			throw new InvalidModelError("Current metamodel does not support ANY cardinality value")
		}

		const isIdTuple = clientModelValue.name === "_id" && isNotNull(value.getIdTupleOrNull())
		if (isIdTuple || valueToKeep.isString() || valueToKeep.isNull()) {
			// all value are nullable string or, IdTuple(in case of ListElement type's _id)
			return valueToKeep
		}

		throw new ProgrammingError(`Invalid value/cardinality combination`)
	}
}

export class ClientEntity {
	constructor(
		public readonly typeModel: ClientTypeModel,
		private readonly entityRecord: Record<AttributeName, unknown> = {},
	) {}

	// This is needed to make transpilation easier.
	castAsEntity<T extends Entity>(): T {
		this.entityRecord._type = new TypeRef(this.typeModel.app, this.typeModel.id)
		const entity = this.entityRecord as T

		if (this.typeModel.type !== Type.DataTransfer) {
			entity._original = structuredClone(entity)
		}

		return entity
	}

	setValue(valueId: AttributeId, parsedValue: DecryptedParsedValue) {
		const modelValue = assertNotNull(this.typeModel.values[valueId])
		const key = modelValue.name
		if (modelValue.name === "_id") {
			switch (getIdType(this.typeModel)) {
				case IdType.IdTuple: {
					this.entityRecord[key] = parsedValue.asIdTuple()
					break
				}
				case IdType.SingleId: {
					this.entityRecord[key] = parsedValue.asId()
					break
				}
			}
		} else {
			EntityUtils.setValue(modelValue, key, parsedValue, this.entityRecord)
		}
	}

	private setAssociation<T>(associationId: AttributeId, associationList: Array<T>) {
		const associationModel = this.typeModel.associations[associationId]
		switch (associationModel.cardinality) {
			case Cardinality.ZeroOrOne: {
				if (associationList.length > 1) {
					throw new InvalidModelError(`Cardinality ZeroOrOne can hold at max one item. Found: ${associationList.length}`)
				}
				this.entityRecord[associationModel.name] = associationList[0] ?? null
				break
			}
			case Cardinality.One:
				if (associationList.length !== 1) {
					throw new InvalidModelError(`Cardinality One should have exactly one item. Found: ${associationList.length}`)
				}
				this.entityRecord[associationModel.name] = associationList[0]
				break
			case Cardinality.Any:
				// TODO: https://github.com/tutao/tutanota/blob/dff7ab50e6b0a6b26c2bca2e9e434121158a1f55/src/platform-kit/instance-pipeline/ModelMapper.ts#L70
				// what was this condition doing?
				// was it just verifying that we have only one idTuple?
				this.entityRecord[associationModel.name] = associationList
		}
	}
	setAggregations(associationId: AttributeId, aggregates: Array<ClientEntity>) {
		this.setAssociation(
			associationId,
			aggregates.map((agg) => agg.castAsEntity()),
		)
	}

	setIdList(associationId: AttributeId, idList: Array<Id>) {
		this.setAssociation(associationId, idList)
	}

	setIdTupleList(associationId: AttributeId, idTupleList: Array<IdTuple>) {
		this.setAssociation(associationId, idTupleList)
	}

	setErrors(errors: Record<AttributeId, string>) {
		// fixme:
		this.entityRecord["_errors"] = errors
	}

	public setAssociationForTest<T>(associationId: AttributeId, associationList: Array<T>) {
		assert(isTest(), "This method is only meant for testing")
		return this.setAssociation(associationId, associationList)
	}
}

export class OutgoingClientEntity {
	private readonly entityRecord: Record<AttributeName, any>
	public constructor(
		instance: Entity,
		public readonly typeModel: ClientTypeModel,
	) {
		const typeRefInEntity = instance._type
		const typeModelTypeRef = new TypeRef(typeModel.app, typeModel.id)
		assert(isSameTypeRef(typeRefInEntity, typeModelTypeRef), "Wrong typeModel passed")
		this.entityRecord = instance as Record<AttributeName, any>
	}

	public getValue<NestedObj extends DeepEquals>(modelValue: ModelValue): ParsedValue<NestedObj> {
		const rawValue = this.entityRecord[modelValue.name]
		if (modelValue.name === "_id") {
			switch (getIdType(this.typeModel)) {
				case IdType.IdTuple:
					return ParsedValue.fromIdTuple<NestedObj>(rawValue as IdTuple)
				case IdType.SingleId:
					return ParsedValue.fromId(rawValue as Id)
			}
		} else {
			return EntityUtils.getValue(modelValue, rawValue)
		}
	}

	public getIdList(associationModel: ModelAssociation): Array<Id> {
		return this.getAssociation<Id>(associationModel)
	}
	public getIdTupleList(associationModel: ModelAssociation): Array<IdTuple> {
		return this.getAssociation<IdTuple>(associationModel)
	}
	public getAggregationList(associationModel: ModelAssociation, aggregateTypeModel: ClientTypeModel): Array<OutgoingClientEntity> {
		const aggregateTypeRef = new TypeRef<any>(aggregateTypeModel.app, aggregateTypeModel.id)
		assert(associationModel.refTypeId === aggregateTypeModel.id, "Wrong aggregateTypeModel?")
		if (isNotNull(associationModel.dependency)) {
			assert(associationModel.dependency === aggregateTypeModel.app, "Wrong aggregateTypeModel?")
		}

		return this.getAssociation<Record<AttributeName, unknown>>(associationModel).map((agg) => {
			agg._type = aggregateTypeRef
			const entityLike = Object.assign(agg, { _type: aggregateTypeRef })
			return new OutgoingClientEntity(entityLike, aggregateTypeModel)
		})
	}

	private getAssociation<T>(associationModel: ModelAssociation): Array<T> {
		const value = this.entityRecord[associationModel.name]
		switch (associationModel.cardinality) {
			case Cardinality.One:
				return [value as T]
			case Cardinality.ZeroOrOne:
				return isNotNull(value) ? [value as T] : []
			case Cardinality.Any:
				return value as Array<T>
		}
	}
}
