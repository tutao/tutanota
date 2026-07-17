import { assert, assertNotNull, deepEqual, DeepEquals, isNotNull, promiseMap } from "@tutao/utils"
import { ServerTypeModelResolver } from "./EntityFunctions"
import { InstanceDirection, ParsedValue } from "./ParsedValue"
import {
	AssociationReprType,
	AttributeId,
	AttributeName,
	ClientTypeModel,
	ElementId,
	getAssociationReprType,
	getIdType,
	idToElementId,
	IdType,
	isSameTypeRef,
	ListElementId,
	ModelAssociation,
	ModelValue,
	ServerTypeModel,
	TypeRef,
} from "@tutao/meta"
import { DecryptedParsedInstance } from "./CryptoMapper"
import { EntityUtils } from "./EntityUtils"

export class OfflineMapper {
	constructor(private typeModelResolver: ServerTypeModelResolver) {}

	toOfflineEntity(parsedInstance: DecryptedParsedInstance): OfflineEntity {
		const serverModel = parsedInstance.ensureIncoming()
		const offlineEntity = OfflineEntity.toPersist(serverModel)

		for (const valueModel of Object.values(serverModel.values)) {
			offlineEntity.addValue(valueModel, parsedInstance.getAttributeById(valueModel.id))
		}

		for (const associationModel of Object.values(serverModel.associations)) {
			switch (getAssociationReprType(associationModel.type)) {
				case AssociationReprType.Aggregation: {
					const mappedAggregates = parsedInstance
						.getAttributeById(associationModel.id)
						.asNestedObjList()
						.map((agg) => this.toOfflineEntity(agg))
					offlineEntity.setAggregations(associationModel.id, mappedAggregates)
					break
				}
				case AssociationReprType.IdTuple: {
					offlineEntity.setIdTupleList(associationModel.id, parsedInstance.getAttributeById(associationModel.id).asIdTupleList())
					break
				}
				case AssociationReprType.SingleId: {
					offlineEntity.setIdList(associationModel.id, parsedInstance.getAttributeById(associationModel.id).asIdList())
					break
				}
			}
		}

		return offlineEntity
	}

	public async toParsedEntity(storedEntity: OfflineEntity): Promise<DecryptedParsedInstance> {
		const serverModel = storedEntity.typeModel
		const parsedInstance = DecryptedParsedInstance.incomingFromServer(serverModel)

		for (const valueModel of Object.values(serverModel.values)) {
			parsedInstance.addAttributeById(valueModel.id, storedEntity.getValue(valueModel))
		}

		for (const associationModel of Object.values(serverModel.associations)) {
			switch (getAssociationReprType(associationModel.type)) {
				case AssociationReprType.Aggregation: {
					const aggregateTypeModel = await this.typeModelResolver.resolveServerTypeReference(
						new TypeRef(associationModel.dependency ?? serverModel.app, associationModel.refTypeId),
					)
					const mappedAggregates = await promiseMap(storedEntity.getAggregationList(associationModel, aggregateTypeModel), async (agg) => {
						return await this.toParsedEntity(agg)
					})
					parsedInstance.addAttributeById(associationModel.id, ParsedValue.fromNestedItems(mappedAggregates))
					break
				}
				case AssociationReprType.IdTuple: {
					parsedInstance.addAttributeById(associationModel.id, ParsedValue.fromIdTupleList(storedEntity.getIdTupleList(associationModel)))
					break
				}
				case AssociationReprType.SingleId: {
					parsedInstance.addAttributeById(associationModel.id, ParsedValue.fromIdList(storedEntity.getIdList(associationModel)))
					break
				}
			}
		}

		return parsedInstance
	}
}

export class OfflineEntity implements DeepEquals {
	private constructor(
		public readonly typeModel: ServerTypeModel,
		private readonly direction: InstanceDirection,
		private readonly entityRecord: Record<AttributeId, unknown>,
	) {}

	public static toPersist(typeModel: ServerTypeModel): OfflineEntity {
		return new OfflineEntity(typeModel, InstanceDirection.IncomingFromServer, {})
	}

	public static readingFromStorage(typeModel: ServerTypeModel, storedRecord: Record<AttributeId, unknown>): OfflineEntity {
		return new OfflineEntity(typeModel, InstanceDirection.OutgoingToServer, storedRecord)
	}

	public getValue<NestedObj extends DeepEquals>(modelValue: ModelValue): ParsedValue<NestedObj> {
		if (modelValue.name === "_id") {
			const id = assertNotNull(this.entityRecord[modelValue.id])
			switch (getIdType(this.typeModel)) {
				case IdType.IdTuple:
					return ParsedValue.fromIdTuple<NestedObj>(id as IdTuple)
				case IdType.SingleId:
					return ParsedValue.fromId(id as Id)
			}
		} else {
			return EntityUtils.getValue(modelValue, this.entityRecord[modelValue.id])
		}
	}

	public addValue(modelValue: ModelValue, value: ParsedValue<DecryptedParsedInstance>): void {
		const key = modelValue.id
		if (modelValue.name === "_id") {
			switch (getIdType(this.typeModel)) {
				case IdType.IdTuple: {
					this.entityRecord[key] = value.asIdTuple()
					break
				}
				case IdType.SingleId: {
					this.entityRecord[key] = value.asId()
					break
				}
			}
		} else {
			EntityUtils.setValue(modelValue, key, value, this.entityRecord)
		}
	}

	setAggregations(associationId: AttributeId, aggregates: Array<OfflineEntity>) {
		this.entityRecord[associationId] = aggregates.map((agg) => agg.entityRecord)
	}

	setIdList(associationId: AttributeId, idList: Array<Id>) {
		this.entityRecord[associationId] = idList
	}

	setIdTupleList(associationId: AttributeId, idTupleList: Array<IdTuple>) {
		this.entityRecord[associationId] = idTupleList
	}

	public getStorableRecord(): Record<AttributeId, unknown> {
		assert(this.direction === InstanceDirection.IncomingFromServer, "")
		return this.entityRecord
	}

	public getIdList(associationModel: ModelAssociation): Array<Id> {
		return this.entityRecord[associationModel.id] as Array<Id>
	}
	public getIdTupleList(associationModel: ModelAssociation): Array<IdTuple> {
		return this.entityRecord[associationModel.id] as Array<IdTuple>
	}
	public getAggregationList(associationModel: ModelAssociation, aggregateTypeModel: ClientTypeModel): Array<OfflineEntity> {
		assert(associationModel.refTypeId === aggregateTypeModel.id, "Wrong aggregateTypeModel?")
		if (isNotNull(associationModel.dependency)) {
			assert(associationModel.dependency === aggregateTypeModel.app, "Wrong aggregateTypeModel?")
		}

		return (this.entityRecord[associationModel.id] as Array<Record<AttributeName, unknown>>).map((agg) => {
			return OfflineEntity.readingFromStorage(aggregateTypeModel, agg)
		})
	}

	getTypeRef(): TypeRef<unknown> {
		return new TypeRef<unknown>(this.typeModel.app, this.typeModel.id)
	}

	deepEquals(other: this): boolean {
		return this.direction === other.direction && isSameTypeRef(this.getTypeRef(), other.getTypeRef()) && deepEqual(this.entityRecord, other.entityRecord)
	}
}
