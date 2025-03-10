import {
	EncryptedParsedAssociation,
	EncryptedParsedInstance,
	EncryptedParsedValue,
	TypeModel,
	UntypedAssociation,
	UntypedInstance,
	UntypedValue,
} from "../../common/EntityTypes"
import { AssociationType } from "../../common/EntityConstants"
import { TypeReferenceResolver } from "../../common/EntityFunctions"
import { TypeRef, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { ProgrammingError } from "../../common/error/ProgrammingError"
import { convertDbToJsType, convertJsToDbType } from "./ModelMapper"

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
	constructor(private readonly typeRefResolver: TypeReferenceResolver) {}

	async applyJsTypes(typeModel: TypeModel, instance: UntypedInstance): Promise<EncryptedParsedInstance> {
		let parsedInstance: EncryptedParsedInstance = {}
		for (const [attrIdStr, modelValue] of Object.entries(typeModel.values)) {
			const attrId = parseInt(attrIdStr)
			// values at this stage are only strings, the other types are only possible for associations.
			const untypedValue = instance[attrId.toString()] as UntypedValue

			if (modelValue.encrypted) {
				// will be decrypted and mapped at a later stage
				parsedInstance[attrId] = untypedValue
			} else {
				parsedInstance[attrId] = convertDbToJsType(modelValue.type, untypedValue)
			}
		}

		for (const [attrIdStr, modelAssociation] of Object.entries(typeModel.associations)) {
			const attrId = parseInt(attrIdStr)
			const values = instance[attrId.toString()] as UntypedAssociation

			if (modelAssociation.type === AssociationType.Aggregation) {
				const appName = modelAssociation.dependency ?? typeModel.app
				const associationTypeModel = await this.typeRefResolver(new TypeRef(appName, modelAssociation.refTypeId))

				const untypedAssociationValues: Array<EncryptedParsedInstance> = []
				for (const value of values) {
					untypedAssociationValues.push(await this.applyJsTypes(associationTypeModel, value as UntypedInstance))
				}
				parsedInstance[attrId] = untypedAssociationValues
			} else {
				parsedInstance[attrId] = values as Array<Id> | Array<IdTuple>
			}
		}

		return parsedInstance
	}

	async applyDbTypes(typeModel: TypeModel, instance: EncryptedParsedInstance): Promise<UntypedInstance> {
		let untypedInstance = {} as UntypedInstance
		for (const [attrIdStr, modelValue] of Object.entries(typeModel.values)) {
			const attrId = parseInt(attrIdStr)
			const value = instance[attrId] as EncryptedParsedValue

			if ((modelValue.encrypted && typeof value === "string") || value === null) {
				// encrypted values are either null or have been converted to a byte array, encrypted and b64-encoded at this point.
				untypedInstance[attrId] = value
			} else if (modelValue.encrypted) {
				throw new ProgrammingError(
					`received encrypted value that is not a string, should have been converted already. ${typeModel.name}/${typeModel.id}, ${modelValue.name}`,
				)
			} else {
				// unencrypted values don't have to be modified anymore before they're sent to the server
				const dbValue = convertJsToDbType(modelValue.type, value)
				if (dbValue instanceof Uint8Array) {
					untypedInstance[attrId] = uint8ArrayToBase64(dbValue)
				} else {
					untypedInstance[attrId] = dbValue
				}
			}
		}

		for (const [attrIdStr, modelAssociation] of Object.entries(typeModel.associations)) {
			const attrId = parseInt(attrIdStr)
			const values = instance[attrId] as EncryptedParsedAssociation

			if (modelAssociation.type === AssociationType.Aggregation) {
				const appName = modelAssociation.dependency ?? typeModel.app
				const associationTypeModel = await this.typeRefResolver(new TypeRef(appName, modelAssociation.refTypeId))

				const untypedAssociationValues: Array<UntypedInstance> = []
				for (const value of values) {
					untypedAssociationValues.push(await this.applyDbTypes(associationTypeModel, value))
				}
				untypedInstance[attrId] = untypedAssociationValues
			} else {
				untypedInstance[attrId] = values as Array<Id> | Array<IdTuple>
			}
		}

		return untypedInstance
	}
}
