import { EncryptedParsedAssociation, EncryptedParsedInstance, ModelAssociation, ModelValue, ParsedInstance, TypeModel } from "../../common/EntityTypes"
import { Base64, TypeRef } from "@tutao/tutanota-utils"
import { AssociationType } from "../../common/EntityConstants"
import { resolveTypeReference } from "../../common/EntityFunctions"
import { decryptValue } from "./InstanceMapper"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { Nullable } from "@tutao/tutanota-utils/dist/Utils"
import { AesKey } from "@tutao/tutanota-crypto"

export class InstanceCryptoMapper {
	public async decryptParsedInstance(typeModel: TypeModel, encryptedInstance: EncryptedParsedInstance, sk: Nullable<AesKey>): Promise<ParsedInstance> {
		const decrypted: ParsedInstance = {
			_finalEncryptedValues: {},
			_defaultEncryptedValues: {},
		}
		for (const [valueIdStr, valueInfo] of Object.entries(typeModel.values)) {
			const valueId = parseInt(valueIdStr)
			const valueName = valueInfo.name
			const encryptedValue = encryptedInstance[valueId]

			try {
				if (!valueInfo.encrypted) {
					decrypted[valueId] = encryptedValue
				} else if (sk != null) {
					const encryptedValueInfo = valueInfo as ModelValue & { encrypted: true }
					const encryptedString = encryptedValue as Base64
					decrypted[valueId] = decryptValue(valueName, encryptedValueInfo, encryptedString, sk)
				} else {
					throw new CryptoError("session key is null, but value is encrypted. valueName: " + valueName + " valueType: " + valueInfo)
				}
			} catch (e) {
				if (decrypted._errors == null) {
					decrypted._errors = {}
				}

				decrypted._errors[valueId] = JSON.stringify(e)
				console.log("error when decrypting value on type:", `[${typeModel.app},${typeModel.name}]`, "valueName:", valueName, e)
			} finally {
				if (valueInfo.encrypted) {
					if (valueInfo.final) {
						// we have to store the encrypted value to be able to restore it when updating the instance.
						// this is not needed for data transfer types, but it does not hurt
						decrypted._finalEncryptedValues[valueId] = encryptedValue
					} else if (encryptedValue === "") {
						// the encrypted value is "" if the decrypted value is the default value
						// we store the default value to make sure that updates do not cause more storage use
						// check out encrypt() to see the other side of this.
						decrypted._defaultEncryptedValues[valueId] = decrypted[valueId]
					}
				}
			}
		}

		for (const associationId in Object.keys(typeModel.associations).map(Number)) {
			let associationType = typeModel.associations[associationId]
			const encryptedInstanceValue = encryptedInstance[associationId] as EncryptedParsedAssociation
			if (associationType.type === AssociationType.Aggregation) {
				decrypted[associationId] = await this.decryptAggregateAssociation(
					typeModel,
					associationType,
					encryptedInstanceValue as Array<EncryptedParsedInstance>,
					sk,
				)
			} else {
				decrypted[associationId] = encryptedInstanceValue
			}
		}
		return decrypted
	}

	private async decryptAggregateAssociation(
		typeModel: TypeModel,
		aggregationType: ModelAssociation,
		encryptedInstanceValues: Array<EncryptedParsedInstance>,
		sk: Nullable<AesKey>,
	): Promise<Array<ParsedInstance>> {
		const dependency = aggregationType.dependency
		const aggregateTypeModel = await resolveTypeReference(new TypeRef(dependency || typeModel.app, aggregationType.refTypeId))

		const decryptedAggregates: Array<ParsedInstance> = []
		for (const encryptedAggregate of encryptedInstanceValues) {
			const decryptedAggregate = await this.decryptParsedInstance(aggregateTypeModel, encryptedAggregate, sk)
			decryptedAggregates.push(decryptedAggregate)
		}
		return decryptedAggregates
	}
}
