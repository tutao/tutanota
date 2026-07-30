import {
	AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_INSTANCE_KEY_DOMAIN,
	AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN,
	AssociatedData,
	DomainSeparator,
	SymmetricCipherVersion,
} from "@tutao/crypto"
import { ValuePath } from "./EncryptionContextPath"
import { ProgrammingError } from "@tutao/app-env"
import { stringToUtf8Uint8Array } from "@tutao/utils"
import { canonicalAttributeId } from "./CanonicalId"

export class ValueAssociatedData implements AssociatedData {
	constructor(private readonly valuePath: ValuePath) {}

	asBytes(cipherVersion: SymmetricCipherVersion) {
		let domainSpecifier: DomainSeparator
		if (cipherVersion === SymmetricCipherVersion.AeadWithInstanceKey) {
			domainSpecifier = AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_INSTANCE_KEY_DOMAIN
		} else if (cipherVersion === SymmetricCipherVersion.AeadWithSessionKey) {
			domainSpecifier = AEAD_ATTRIBUTE_ON_UNAUTHENTICATED_INSTANCE_SESSION_KEY_DOMAIN
		} else {
			throw new ProgrammingError(`unknown cipher version ${cipherVersion}`)
		}
		return stringToUtf8Uint8Array(domainSpecifier + canonicalAttributeId(this.valuePath))
	}
}
