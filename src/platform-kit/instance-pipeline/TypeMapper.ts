import { assert, assertNotNull } from "@tutao/utils"
import { ProgrammingError } from "@tutao/app-env"
import { convertJsToServerJson, convertServerJsonToJsType } from "./ModelMapper"
import { TypeModelResolver } from "./EntityFunctions"
import {
	AssociationType,
	ClientModelEncryptedParsedInstance,
	ClientTypeModel,
	ParsedValue,
	ServerIncomingData,
	ServerModelEncryptedParsedInstance,
	ServerTypeModel,
	TypeModel,
	TypeRef,
	UntypedInstance,
} from "@tutao/meta"

/**
 * takes a raw parsed JSON value as received from the server and converts its attribute values from the
 * string representation to javascript types. Also implements the inverse operation.
 *
 * it's operating on encrypted objects, which means that encrypted attributes are passed through as-is.
 * they are mapped to their javascript type after decryption (see CryptoMapper).
 *
 * The objects are treated according to the server's model version.
 */
export class TypeMapper {
	constructor(private readonly typeModelResolver: TypeModelResolver) {}

	async applyJsTypes(serverTypeModel: ServerTypeModel, instance: UntypedInstance): Promise<ServerModelEncryptedParsedInstance> {
		const parsedInstance: ServerModelEncryptedParsedInstance = {} as ServerModelEncryptedParsedInstance

		for (const [attrIdStr, modelValue] of Object.entries(serverTypeModel.values)) {
			let attrId: number = parseInt(attrIdStr) // used to access parsedInstance which has number keys
			const untypedValue = instance[attrId]
			assert(
				untypedValue.arrayValue == null && untypedValue.nestedObj == null,
				"values at this stage are only strings, the other types are only possible for associations",
			)

			if (untypedValue.isNull()) {
				parsedInstance[attrId] = ParsedValue.fromNull()
			} else {
				const stringValue = assertNotNull(untypedValue.stringValue)
				if (modelValue.encrypted) {
					// will be decrypted and mapped at a later stage
					parsedInstance[attrId] = ParsedValue.fromString(stringValue)
				} else {
					parsedInstance[attrId] = convertServerJsonToJsType(modelValue.type, stringValue)
				}
			}
		}

		for (const [attrIdStr, modelAssociation] of Object.entries(serverTypeModel.associations)) {
			const attrId: number = parseInt(attrIdStr) // used to access parsedInstance which has number keys
			const incomingData = instance[attrId]
			const associationValues = assertNotNull(incomingData.arrayValue, "Always expected an array")
			assert(incomingData.stringValue == null && incomingData.nestedObj == null, "All associations are kept inside an array")

			if (modelAssociation.type === AssociationType.Aggregation) {
				const appName = modelAssociation.dependency ?? serverTypeModel.app
				const associationTypeModel = await this.typeModelResolver.resolveServerTypeReference(new TypeRef(appName, modelAssociation.refTypeId))

				const mappedAggregates = associationValues.map(async (aggregatedItem) => {
					return await this.applyJsTypes(associationTypeModel, aggregatedItem.asNestedObj())
				})
				parsedInstance[attrId] = ParsedValue.fromAggregatedItems(await Promise.all(mappedAggregates))
			} else if (modelAssociation.type === AssociationType.ListAssociation || modelAssociation.type === AssociationType.ElementAssociation) {
				const mappedIds = associationValues.map((idItem) => ParsedValue.fromId(idItem.asString()))
				parsedInstance[attrId] = ParsedValue.fromArray(mappedIds)
			} else if (
				modelAssociation.type === AssociationType.BlobElementAssociation ||
				modelAssociation.type === AssociationType.ListElementAssociationGenerated ||
				modelAssociation.type === AssociationType.ListElementAssociationCustom
			) {
				const mappedIds = associationValues.map((idItem) => {
					const [listId, elementId] = idItem.asArray().map((a) => a.asString())
					return ParsedValue.fromIdTuple([listId, elementId] satisfies IdTuple)
				})
				parsedInstance[attrId] = ParsedValue.fromArray(mappedIds)
			}
		}

		return parsedInstance
	}

	async applyDbTypes(clientTypeModel: ClientTypeModel, instance: ClientModelEncryptedParsedInstance): Promise<UntypedInstance> {
		const untypedInstance = {} as UntypedInstance

		for (const [attrIdStr, modelValue] of Object.entries(clientTypeModel.values)) {
			const debugAttrId = env.networkDebugging ? attrIdStr + ":" + modelValue.name : attrIdStr
			const attrId = parseInt(attrIdStr)
			const value = instance[attrId]

			if (modelValue.encrypted && value.stringValue == null && !value.isNull()) {
				throw new ProgrammingError(
					`received encrypted value that is not a string, should have been converted already. ${clientTypeModel.name}/${clientTypeModel.id}, ${modelValue.name}`,
				)
			}
			untypedInstance[debugAttrId] = convertJsToServerJson(modelValue.type, value)
		}

		for (const [attrIdStr, modelAssociation] of Object.entries(clientTypeModel.associations)) {
			const debugAttrId = env.networkDebugging ? attrIdStr + ":" + modelAssociation.name : attrIdStr
			const attrId = parseInt(attrIdStr)
			const associationValues = instance[attrId].getArray()

			if (modelAssociation.type === AssociationType.Aggregation) {
				const appName = modelAssociation.dependency ?? clientTypeModel.app
				const associationTypeModel = await this.typeModelResolver.resolveClientTypeReference(new TypeRef(appName, modelAssociation.refTypeId))

				const mappedAggregates = associationValues.map(async (aggregatedItem) => {
					return await this.applyDbTypes(associationTypeModel, aggregatedItem.getClientAggregate())
				})
				untypedInstance[debugAttrId] = ServerIncomingData.fromAggregatedItems(await Promise.all(mappedAggregates))
			} else if (modelAssociation.type === AssociationType.ListAssociation || modelAssociation.type === AssociationType.ElementAssociation) {
				const mappedIds = associationValues.map((id) => id.getString())
				untypedInstance[debugAttrId] = ServerIncomingData.fromIdList(mappedIds)
			} else if (
				modelAssociation.type === AssociationType.BlobElementAssociation ||
				modelAssociation.type === AssociationType.ListElementAssociationGenerated ||
				modelAssociation.type === AssociationType.ListElementAssociationCustom
			) {
				const mappedIds = associationValues.map((id) => id.getidTuple())
				untypedInstance[debugAttrId] = ServerIncomingData.fromIdTupleList(mappedIds)
			}
		}

		return untypedInstance
	}
}
export function typeModelToRestPath(typeModel: TypeModel): string {
	return `/rest/${typeModel.app}/${typeModel.name.toLowerCase()}`
}
