import {
	ClientModelEncryptedParsedInstance,
	ClientModelUntypedInstance,
	ClientTypeModel,
	EncryptedParsedAssociation,
	EncryptedParsedValue,
	ServerModelEncryptedParsedInstance,
	ServerModelUntypedInstance,
	ServerTypeModel,
	UntypedAssociation,
	UntypedInstance,
	UntypedValue,
} from "../../common/EntityTypes"
import { AssociationType } from "../../common/EntityConstants"
import { ClientTypeReferenceResolver, ServerTypeReferenceResolver } from "../../common/EntityFunctions"
import { TypeRef, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { ProgrammingError } from "../../common/error/ProgrammingError"
import { convertDbToJsType, convertJsToDbType } from "./ModelMapper"
import { isWebClient } from "../../common/Env"

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
	constructor(
		private readonly clientTypeReferenceResolver: ClientTypeReferenceResolver,
		private readonly serverTypeReferenceResolver: ServerTypeReferenceResolver | ClientTypeReferenceResolver,
	) {
		if (isWebClient() && serverTypeReferenceResolver === clientTypeReferenceResolver) {
			throw new ProgrammingError("initializing server type reference resolver with client type reference resolver on webapp is not allowed!")
		}
	}

	async applyJsTypes(serverTypeModel: ServerTypeModel | ClientTypeModel, instance: ServerModelUntypedInstance): Promise<ServerModelEncryptedParsedInstance> {
		let parsedInstance: ServerModelEncryptedParsedInstance = {} as ServerModelEncryptedParsedInstance
		for (const [attrIdStr, modelValue] of Object.entries(serverTypeModel.values)) {
			let attrId: number = parseInt(attrIdStr) // used to access parsedInstance which has number keys
			let attrIdUntypedInstance: string = attrIdStr // used to access untypedInstance which has string keys (attrId:attrName in case of networkDebugging)
			if (env.networkDebugging) {
				// keys are in the format attributeId:attributeName when networkDebugging is enabled
				attrIdUntypedInstance += ":" + modelValue.name
			}

			// values at this stage are only strings, the other types are only possible for associations.
			let untypedValue = instance[attrIdUntypedInstance] as UntypedValue
			if (env.networkDebugging && untypedValue === undefined) {
				// websocket messages do NOT support network debugging, we therefore retry reading with attrId
				untypedValue = instance[attrId] as UntypedValue
			}

			if (modelValue.encrypted) {
				// will be decrypted and mapped at a later stage
				parsedInstance[attrId] = untypedValue
			} else {
				parsedInstance[attrId] = convertDbToJsType(modelValue.type, untypedValue)
			}
		}

		for (const [attrIdStr, modelAssociation] of Object.entries(serverTypeModel.associations)) {
			let attrId: number = parseInt(attrIdStr) // used to access parsedInstance which has number keys
			let attrIdUntypedInstance: string = attrIdStr // used to access untypedInstance which has string keys (attrId:attrName in case of networkDebugging)
			if (env.networkDebugging) {
				// keys are in the format attributeId:attributeName when networkDebugging is enabled
				attrIdUntypedInstance += ":" + modelAssociation.name
			}

			let associationValues = instance[attrIdUntypedInstance] as UntypedAssociation
			if (env.networkDebugging && associationValues === undefined) {
				// websocket messages do NOT support network debugging, we therefore retry reading with attrId
				associationValues = instance[attrId] as UntypedAssociation
			}

			if (modelAssociation.type === AssociationType.Aggregation) {
				const appName = modelAssociation.dependency ?? serverTypeModel.app
				const associationTypeModel = await this.serverTypeReferenceResolver(new TypeRef(appName, modelAssociation.refTypeId))

				const encryptedParsedAssociationValues: Array<ServerModelEncryptedParsedInstance> = []
				for (const value of associationValues) {
					encryptedParsedAssociationValues.push(await this.applyJsTypes(associationTypeModel, value as ServerModelUntypedInstance))
				}
				parsedInstance[attrId] = encryptedParsedAssociationValues
			} else {
				parsedInstance[attrId] = associationValues as Array<Id> | Array<IdTuple>
			}
		}

		return parsedInstance
	}

	async applyDbTypes(clientTypeModel: ClientTypeModel, instance: ClientModelEncryptedParsedInstance): Promise<ClientModelUntypedInstance> {
		let untypedInstance: ClientModelUntypedInstance = {} as ClientModelUntypedInstance
		for (const [attrIdStr, modelValue] of Object.entries(clientTypeModel.values)) {
			const attrId = parseInt(attrIdStr)

			let attrIdUntypedInstance: string = attrIdStr
			if (env.networkDebugging) {
				// keys are in the format attributeId:attributeName when networkDebugging is enabled
				attrIdUntypedInstance += ":" + modelValue.name
			}

			const value = instance[attrId] as EncryptedParsedValue
			if ((modelValue.encrypted && typeof value === "string") || value === null) {
				// encrypted values are either null or have been converted to a byte array, encrypted and b64-encoded at this point.
				untypedInstance[attrIdUntypedInstance] = value
			} else if (modelValue.encrypted) {
				throw new ProgrammingError(
					`received encrypted value that is not a string, should have been converted already. ${clientTypeModel.name}/${clientTypeModel.id}, ${modelValue.name}`,
				)
			} else {
				// unencrypted values don't have to be modified anymore before they're sent to the server
				const dbValue = convertJsToDbType(modelValue.type, value)
				if (dbValue instanceof Uint8Array) {
					untypedInstance[attrIdUntypedInstance] = uint8ArrayToBase64(dbValue)
				} else {
					untypedInstance[attrIdUntypedInstance] = dbValue
				}
			}
		}

		for (const [attrIdStr, modelAssociation] of Object.entries(clientTypeModel.associations)) {
			const attrId = parseInt(attrIdStr)

			let attrIdUntypedInstance: string = attrIdStr
			if (env.networkDebugging) {
				// keys are in the format attributeId:attributeName when networkDebugging is enabled
				attrIdUntypedInstance += ":" + modelAssociation.name
			}

			const values = instance[attrId] as EncryptedParsedAssociation
			if (modelAssociation.type === AssociationType.Aggregation) {
				const appName = modelAssociation.dependency ?? clientTypeModel.app
				const associationTypeModel = await this.clientTypeReferenceResolver(new TypeRef(appName, modelAssociation.refTypeId))

				const untypedAssociationValues: Array<UntypedInstance> = []
				for (const value of values) {
					untypedAssociationValues.push(await this.applyDbTypes(associationTypeModel, value as ClientModelEncryptedParsedInstance))
				}
				untypedInstance[attrIdUntypedInstance] = untypedAssociationValues
			} else {
				untypedInstance[attrIdUntypedInstance] = values as Array<Id> | Array<IdTuple>
			}
		}

		return untypedInstance
	}
}
