import { asKdfType } from "../../../common/TutanotaConstants.js"
import { createRecoverCode, RecoverCodeTypeRef, User } from "../../../entities/sys/TypeRefs.js"
import { assertNotNull, type Hex, uint8ArrayToHex } from "@tutao/tutanota-utils"
import { LoginFacade } from "../LoginFacade.js"
import { assertWorkerOrNode } from "../../../common/Env.js"
import {
	Aes256Key,
	aes256RandomKey,
	AesKey,
	bitArrayToUint8Array,
	createAuthVerifier,
	createAuthVerifierAsBase64Url,
	decryptKey,
	encryptKey,
} from "@tutao/tutanota-crypto"
import { EntityClient } from "../../../common/EntityClient.js"
import { UserFacade } from "../UserFacade.js"
import { KeyLoaderFacade } from "../KeyLoaderFacade.js"
import { VersionedKey } from "../../crypto/CryptoWrapper.js"

assertWorkerOrNode()

export type RecoverData = {
	userEncRecoverCode: Uint8Array
	userKeyVersion: number
	recoverCodeEncUserGroupKey: Uint8Array
	hexCode: Hex
	recoveryCodeVerifier: Uint8Array
}

/**
 * Facade to create, encrypt and show the recovery code.
 */
export class RecoverCodeFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly entityClient: EntityClient,
		private readonly loginFacade: LoginFacade,
		private readonly keyLoaderFacade: KeyLoaderFacade,
	) {}

	generateRecoveryCode(currentUserGroupKey: VersionedKey): RecoverData {
		const recoveryCode = aes256RandomKey()
		return this.encryptRecoveryCode(recoveryCode, currentUserGroupKey)
	}

	encryptRecoveryCode(recoveryCode: Aes256Key, currentUserGroupKey: VersionedKey): RecoverData {
		const userEncRecoverCode = encryptKey(currentUserGroupKey.object, recoveryCode)
		const recoverCodeEncUserGroupKey = encryptKey(recoveryCode, currentUserGroupKey.object)
		const recoveryCodeVerifier = createAuthVerifier(recoveryCode)
		return {
			userEncRecoverCode,
			userKeyVersion: currentUserGroupKey.version,
			recoverCodeEncUserGroupKey,
			hexCode: uint8ArrayToHex(bitArrayToUint8Array(recoveryCode)),
			recoveryCodeVerifier,
		}
	}

	async getRecoverCodeHex(passphrase: string): Promise<string> {
		const user = this.userFacade.getLoggedInUser()
		const passphraseKey = await this.getPassphraseKey(user, passphrase)
		const rawRecoverCode = await this.getRawRecoverCode(passphraseKey)
		return uint8ArrayToHex(bitArrayToUint8Array(rawRecoverCode))
	}

	async getRawRecoverCode(passphraseKey: AesKey): Promise<AesKey> {
		const user = this.userFacade.getLoggedInUser()
		const recoverCodeId = user.auth?.recoverCode
		if (recoverCodeId == null) {
			throw new Error("Auth is missing")
		}

		const extraHeaders = {
			authVerifier: createAuthVerifierAsBase64Url(passphraseKey),
		}

		const recoveryCodeEntity = await this.entityClient.load(RecoverCodeTypeRef, recoverCodeId, { extraHeaders })
		const userGroupKey = await this.keyLoaderFacade.loadSymUserGroupKey(Number(recoveryCodeEntity.userKeyVersion))
		return decryptKey(userGroupKey, recoveryCodeEntity.userEncRecoverCode)
	}

	private async getPassphraseKey(user: User, passphrase: string) {
		const passphraseKeyData = {
			kdfType: asKdfType(user.kdfVersion),
			passphrase,
			salt: assertNotNull(user.salt),
		}
		return await this.loginFacade.deriveUserPassphraseKey(passphraseKeyData)
	}

	async createRecoveryCode(passphrase: string): Promise<string> {
		const user = this.userFacade.getUser()

		if (user == null || user.auth == null) {
			throw new Error("Invalid state: no user or no user.auth")
		}

		const { userEncRecoverCode, userKeyVersion, recoverCodeEncUserGroupKey, hexCode, recoveryCodeVerifier } = this.generateRecoveryCode(
			this.userFacade.getCurrentUserGroupKey(),
		)
		const recoverPasswordEntity = createRecoverCode({
			userEncRecoverCode: userEncRecoverCode,
			userKeyVersion: String(userKeyVersion),
			recoverCodeEncUserGroupKey: recoverCodeEncUserGroupKey,
			_ownerGroup: this.userFacade.getUserGroupId(),
			verifier: recoveryCodeVerifier,
		})
		const passphraseKeyData = {
			kdfType: asKdfType(user.kdfVersion),
			passphrase,
			salt: assertNotNull(user.salt),
		}
		const pwKey = await this.loginFacade.deriveUserPassphraseKey(passphraseKeyData)
		const authVerifier = createAuthVerifierAsBase64Url(pwKey)
		await this.entityClient.setup(null, recoverPasswordEntity, {
			authVerifier,
		})
		return hexCode
	}
}
