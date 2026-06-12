import { ProgrammingError } from "@tutao/app-env"
import { convertJsToServerJson, convertServerJsonToJsType } from "./ModelMapper"
import { TypeModelResolver } from "./EntityFunctions"
import { AssociationType, ClientTypeModel, ParsedInstance, ParsedValue, ServerTypeModel, TypeModel, TypeRef, UntypedInstance } from "@tutao/meta"

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

	async applyJsTypes(serverTypeModel: ServerTypeModel, instance: UntypedInstance): Promise<ParsedInstance> {
		const parsedInstance: ParsedInstance = {}

		for (const [attrIdStr, modelValue] of Object.entries(serverTypeModel.values)) {
			let attrId: number = parseInt(attrIdStr) // used to access parsedInstance which has number keys
			const untypedValue = instance[attrId]

			if (untypedValue.isNull()) {
				parsedInstance[attrId] = ParsedValue.fromNull()
			} else {
				const stringValue = untypedValue.asString()
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
			const associationValues = instance[attrId].asArray()

			if (modelAssociation.type === AssociationType.Aggregation) {
				const appName = modelAssociation.dependency ?? serverTypeModel.app
				const associationTypeModel = await this.typeModelResolver.resolveServerTypeReference(new TypeRef(appName, modelAssociation.refTypeId))

				const mappedAggregates = associationValues
					.map((nestedObj) => nestedObj.asNestedObj())
					.map(async (aggregatedItem) => {
						return await this.applyJsTypes(associationTypeModel, aggregatedItem)
					})
				parsedInstance[attrId] = ParsedValue.fromAggregatedItems(await Promise.all(mappedAggregates))
			} else if (modelAssociation.type === AssociationType.ListAssociation || modelAssociation.type === AssociationType.ElementAssociation) {
				const mappedIds = associationValues.map((idItem) => idItem.asId())
				parsedInstance[attrId] = ParsedValue.fromIdList(mappedIds)
			} else if (
				modelAssociation.type === AssociationType.BlobElementAssociation ||
				modelAssociation.type === AssociationType.ListElementAssociationGenerated ||
				modelAssociation.type === AssociationType.ListElementAssociationCustom
			) {
				const mappedIds = associationValues.map((idTupleItem) => idTupleItem.asIdTuple())
				parsedInstance[attrId] = ParsedValue.fromIdTupleList(mappedIds)
			}
		}

		return parsedInstance
	}

	async applyDbTypes(clientTypeModel: ClientTypeModel, instance: ParsedInstance): Promise<UntypedInstance> {
		const untypedInstance = {} as UntypedInstance

		for (const [attrIdStr, modelValue] of Object.entries(clientTypeModel.values)) {
			const debugAttrId = env.networkDebugging ? attrIdStr + ":" + modelValue.name : attrIdStr
			const attrId = parseInt(attrIdStr)
			const value = instance[attrId]

			if (modelValue.encrypted && value.isString() && !value.isNull()) {
				throw new ProgrammingError(
					`received encrypted value that is not a string, should have been converted already. ${clientTypeModel.name}/${clientTypeModel.id}, ${modelValue.name}`,
				)
			}
			untypedInstance[debugAttrId] = convertJsToServerJson(modelValue.type, value)
		}

		for (const [attrIdStr, modelAssociation] of Object.entries(clientTypeModel.associations)) {
			const debugAttrId = env.networkDebugging ? attrIdStr + ":" + modelAssociation.name : attrIdStr
			const attrId = parseInt(attrIdStr)
			const associationValues = instance[attrId].asArray()

			if (modelAssociation.type === AssociationType.Aggregation) {
				const appName = modelAssociation.dependency ?? clientTypeModel.app
				const associationTypeModel = await this.typeModelResolver.resolveClientTypeReference(new TypeRef(appName, modelAssociation.refTypeId))

				const mappedAggregates = associationValues
					.map((assoc) => assoc.asNestedObj())
					.map(async (aggregatedItem) => {
						return await this.applyDbTypes(associationTypeModel, aggregatedItem)
					})
				untypedInstance[debugAttrId] = ParsedValue.fromAggregatedItems(await Promise.all(mappedAggregates))
			} else if (modelAssociation.type === AssociationType.ListAssociation || modelAssociation.type === AssociationType.ElementAssociation) {
				const mappedIds = associationValues.map((id) => id.asId())
				untypedInstance[debugAttrId] = ParsedValue.fromIdList(mappedIds)
			} else if (
				modelAssociation.type === AssociationType.BlobElementAssociation ||
				modelAssociation.type === AssociationType.ListElementAssociationGenerated ||
				modelAssociation.type === AssociationType.ListElementAssociationCustom
			) {
				const mappedIds = associationValues.map((id) => id.asIdTuple())
				untypedInstance[debugAttrId] = ParsedValue.fromIdTupleList(mappedIds)
			}
		}

		return untypedInstance
	}
}
export function typeModelToRestPath(typeModel: TypeModel): string {
	return `/rest/${typeModel.app}/${typeModel.name.toLowerCase()}`
}
