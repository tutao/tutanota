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
 * they are mapped to their javascript type after decryption (see InstanceCryptoMapper).
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

				const untypedAssociationValues = []
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

			if (modelValue.encrypted && typeof value === "string") {
				untypedInstance[attrId] = value
			} else if (modelValue.encrypted) {
				// fixme: is it OK to have plaintext null in an encrypted field or is null always encrypted as well?
				throw new ProgrammingError("received encrypted value that is not a string, should have been converted already")
			} else {
				// fixme: maybe keeping it as a byte array makes sense after all
				const dbValue = convertJsToDbType(modelValue.type, value)
				if (dbValue == null || typeof dbValue === "string") {
					untypedInstance[attrId] = dbValue
				} else {
					untypedInstance[attrId] = uint8ArrayToBase64(dbValue)
				}
			}
		}

		for (const [attrIdStr, modelAssociation] of Object.entries(typeModel.associations)) {
			const attrId = parseInt(attrIdStr)
			const values = instance[attrId] as EncryptedParsedAssociation

			if (modelAssociation.type === AssociationType.Aggregation) {
				const appName = modelAssociation.dependency ?? typeModel.app
				const associationTypeModel = await this.typeRefResolver(new TypeRef(appName, modelAssociation.refTypeId))

				const untypedAssociationValues = []
				for (const value in values) {
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
