import { TypeMapper } from "./TypeMapper"
import { CryptoMapper, SymmetricGroupKeyLoader } from "./CryptoMapper"
import { TypeRef } from "../meta"
import { ModelMapper } from "./ModelMapper"
import { assertNotNull, downcast, lazy, Nullable } from "@tutao/utils"
import {
	AesKey,
	SubKeyInfo,
	SubKeyInfoWithoutSessionKey,
	SubKeyInfoWithSessionKey,
	SymmetricCipherFacade,
	SymmetricCipherVersion,
	validateKdfNonceLength,
} from "@tutao/crypto"
import { assertWorkerOrNode } from "@tutao/app-env"
import { EntityAdapter } from "./EntityAdapter"
import { TypeModelResolver } from "./EntityFunctions"
import { ClientModelParsedInstance, ClientModelUntypedInstance, Entity, ServerModelUntypedInstance } from "../meta/EntityTypes"

assertWorkerOrNode()

function isSubKeyInfo(sessionKeyOrSubKeyInfo: Promise<Nullable<AesKey>> | Nullable<AesKey> | SubKeyInfo): sessionKeyOrSubKeyInfo is SubKeyInfo {
	return sessionKeyOrSubKeyInfo != null && (sessionKeyOrSubKeyInfo as SubKeyInfo)?.cipherVersion !== undefined
}
export class InstancePipeline {
	readonly typeMapper: TypeMapper
	readonly cryptoMapper: CryptoMapper
	readonly modelMapper: ModelMapper

	constructor(
		private readonly typeModelResolver: TypeModelResolver,
		symGroupKeyLoader: lazy<SymmetricGroupKeyLoader>,
		symmetricCipherFacade: SymmetricCipherFacade,
	) {
		this.typeMapper = new TypeMapper(typeModelResolver)
		this.modelMapper = new ModelMapper(typeModelResolver)
		this.cryptoMapper = new CryptoMapper(typeModelResolver, symmetricCipherFacade, symGroupKeyLoader, this.modelMapper)
	}

	async mapAndEncrypt<T extends Entity>(
		typeRef: TypeRef<T>,
		instance: T,
		sessionKey: Promise<Nullable<AesKey>> | Nullable<AesKey>,
	): Promise<ClientModelUntypedInstance> {
		const sk = await sessionKey
		let subKeyInfo: SubKeyInfo
		if (sk) {
			subKeyInfo = new SubKeyInfoWithSessionKey(SymmetricCipherVersion.AesCbcThenHmac, sk)
		} else {
			subKeyInfo = new SubKeyInfoWithoutSessionKey(SymmetricCipherVersion.AesCbcThenHmac)
		}

		return this.mapAndEncryptWithSubKeyInfo(typeRef, instance, subKeyInfo)
	}
	async mapAndEncryptWithSubKeyInfo<T extends Entity>(typeRef: TypeRef<T>, instance: T, subKeyInfo: SubKeyInfo): Promise<ClientModelUntypedInstance> {
		const typeModel = await this.typeModelResolver.resolveClientTypeReference(typeRef)
		const parsedInstance = await this.modelMapper.mapToClientModelParsedInstance(downcast(typeRef), instance)

		const encryptedParsedInstance = await this.cryptoMapper.encryptParsedInstance(typeModel, parsedInstance, subKeyInfo)
		return await this.typeMapper.applyDbTypes(typeModel, encryptedParsedInstance)
	}

	/**
	 * Decrypts an object literal as received from the server and maps it to an entity instance (e.g. Mail)
	 * @param typeRef
	 * @param instance The object literal as received from the DB
	 * @param sk The session key, must be provided for encrypted instances
	 * @returns The decrypted and mapped instance
	 */
	async decryptAndMap<T extends Entity>(typeRef: TypeRef<T>, instance: ServerModelUntypedInstance, sk: AesKey | null): Promise<T> {
		const serverTypeModel = await this.typeModelResolver.resolveServerTypeReference(typeRef)
		const encryptedParsedInstance = await this.typeMapper.applyJsTypes(serverTypeModel, instance)
		const entityAdapter = await EntityAdapter.from(serverTypeModel, encryptedParsedInstance, this.modelMapper)
		const parsedInstance = await this.cryptoMapper.decryptParsedInstance(
			serverTypeModel,
			encryptedParsedInstance,
			sk,
			validateKdfNonceLength(entityAdapter._kdfNonce),
			this.cryptoMapper.makeOwnerKeyProvider(entityAdapter._ownerGroup),
		)
		return await this.modelMapper.mapToInstance(typeRef, parsedInstance)
	}
}
