import { AeadCipherVersion, KeyEncryption, SessionKeyDecryptor, VersionedKey } from "@tutao/crypto"
import { ServiceEncryptionParams } from "../../instance-pipeline/RestClientOptions"
import { Nullable } from "@tutao/utils"

export class ServiceEncryptionParamProvider {
	constructor(private readonly keyEncryption: KeyEncryption) {}

	public assembleServiceEncryptionParamsForCurrentGroupKey(
		currentOwnerKey: VersionedKey,
		aeadCipherVersion: AeadCipherVersion = AeadCipherVersion.WithInstanceKey,
	): ServiceEncryptionParams {
		const ownerKey = aeadCipherVersion === AeadCipherVersion.WithInstanceKey ? currentOwnerKey : null
		return this.assembleServiceEncryptionParams(ownerKey, currentOwnerKey, aeadCipherVersion)
	}

	public async assembleServiceEncryptionParamsForVersionedGroupKey(
		ownerKeyToDecryptSessionKey: VersionedKey,
		resolveCurrentOwnerKey: () => Promise<VersionedKey>,
		aeadCipherVersion: AeadCipherVersion = AeadCipherVersion.WithInstanceKey,
	): Promise<ServiceEncryptionParams> {
		const ownerKey = aeadCipherVersion === AeadCipherVersion.WithInstanceKey ? await resolveCurrentOwnerKey() : null
		return this.assembleServiceEncryptionParams(ownerKey, ownerKeyToDecryptSessionKey, aeadCipherVersion)
	}

	private assembleServiceEncryptionParams(
		ownerKey: Nullable<VersionedKey>,
		ownerKeyToDecryptSessionKey: VersionedKey,
		aeadCipherVersion: AeadCipherVersion,
	): ServiceEncryptionParams {
		const sessionKeyDecryptor = new SessionKeyDecryptor(ownerKeyToDecryptSessionKey, this.keyEncryption)
		return { ownerKey, sessionKeyDecryptor, aeadCipherVersion }
	}
}
