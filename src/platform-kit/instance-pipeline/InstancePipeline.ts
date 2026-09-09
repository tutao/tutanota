import { CryptoMapper, EncryptedParsedInstance, LoggedInUserProvider, SymmetricGroupKeyLoader } from "./CryptoMapper"
import { ModelMapper } from "./ModelMapper"
import { lazy, Nullable } from "@tutao/utils"
import {
	AesKey,
	makeNullableSubKeyInfoWithSessionKeyCbcThenHmac,
	SubKeyInfo,
	SubKeyInfoWithSessionKeyAead,
	SubKeyInfoWithSessionKeyCbcThenHmac,
	SymmetricCipherFacade,
	SymmetricEncryptionScheme,
	validateKdfNonceLength,
	VersionedKey,
} from "@tutao/crypto"
import { assertWorkerOrNode, ProgrammingError } from "@tutao/app-env"
import { EntityAdapter } from "./EntityAdapter"
import { ClientOnlyTypeModelResolver, TypeModelResolver } from "./EntityFunctions"
import { Entity, TypeRef } from "@tutao/meta"
import { IncomingServerJson, OutgoingServerJson, TypeMapper } from "./TypeMapper"
import { RootPath } from "./EncryptionContextPath"
import { CryptoError } from "@tutao/crypto/error"

assertWorkerOrNode()

export class InstancePipeline {
	readonly typeMapper: TypeMapper
	readonly cryptoMapper: CryptoMapper
	readonly modelMapper: ModelMapper

	public constructor(
		public readonly typeModelResolver: TypeModelResolver,
		symGroupKeyLoader: lazy<SymmetricGroupKeyLoader>,
		symmetricCipherFacade: SymmetricCipherFacade,
		private readonly loggedInUserProvider: Nullable<LoggedInUserProvider>,
	) {
		this.modelMapper = new ModelMapper(typeModelResolver)
		this.typeMapper = new TypeMapper(typeModelResolver)
		this.cryptoMapper = new CryptoMapper(symmetricCipherFacade, symGroupKeyLoader, this.modelMapper)
	}

	public static newNativeOnly(
		typeModelResolver: ClientOnlyTypeModelResolver,
		symGroupKeyLoader: lazy<SymmetricGroupKeyLoader>,
		symmetricCipherFacade: SymmetricCipherFacade,
	): InstancePipeline {
		return new InstancePipeline(typeModelResolver, symGroupKeyLoader, symmetricCipherFacade, null)
	}

	private getSubKeyInfo(sessionKey: Nullable<AesKey>): Nullable<SubKeyInfo> {
		if (sessionKey == null) return null
		if (this.loggedInUserProvider == null) throw new ProgrammingError("missing loggedInUserProvider")
		switch (this.loggedInUserProvider.getDefaultSymmetricEncryptionScheme()) {
			case SymmetricEncryptionScheme.AesCbc:
				return new SubKeyInfoWithSessionKeyCbcThenHmac(sessionKey)
			case SymmetricEncryptionScheme.Aead:
				return new SubKeyInfoWithSessionKeyAead(sessionKey)
			default:
				throw new CryptoError("missing or unknown symmetric encryption scheme")
		}
	}

	async mapAndEncrypt<T extends Entity>(_typeRef: TypeRef<T>, instance: T, sessionKey: Nullable<AesKey>): Promise<OutgoingServerJson> {
		const encryptedInstance = await this.mapAndEncryptToParsedInstance(_typeRef, instance, sessionKey)
		return this.typeMapper.makeServerJson(encryptedInstance)
	}

	async mapAndEncryptWithSessionKeyAndOwnerEncSessionKeys<T extends Entity>(
		_typeRef: TypeRef<T>,
		instance: T,
		sessionKey: Nullable<AesKey>,
		ownerKey: Nullable<VersionedKey>,
	): Promise<OutgoingServerJson> {
		let subKeyInfo = this.getSubKeyInfo(sessionKey)
		return await this.mapAndEncryptWithSubKeyInfo(_typeRef, instance, subKeyInfo, ownerKey)
	}

	async mapAndEncryptWithSubKeyInfo<T extends Entity>(
		_typeRef: TypeRef<T>,
		instance: T,
		subKeyInfo: Nullable<SubKeyInfo>,
		ownerKey: Nullable<VersionedKey>,
	): Promise<OutgoingServerJson> {
		const encryptedInstance = await this.mapAndEncryptToParsedInstanceWithSubKeyInfo(instance, subKeyInfo, ownerKey)
		return this.typeMapper.makeServerJson(encryptedInstance)
	}

	async mapAndEncryptToParsedInstance<T extends Entity>(_typeRef: TypeRef<T>, instance: T, sessionKey: Nullable<AesKey>): Promise<EncryptedParsedInstance> {
		const subKeyInfo = makeNullableSubKeyInfoWithSessionKeyCbcThenHmac(sessionKey)
		return this.mapAndEncryptToParsedInstanceWithSubKeyInfo(instance, subKeyInfo)
	}

	async mapAndEncryptToParsedInstanceWithSubKeyInfo<T extends Entity>(
		instance: T,
		subKeyInfo: Nullable<SubKeyInfo>,
		ownerKey: Nullable<VersionedKey> = null,
	): Promise<EncryptedParsedInstance> {
		const parsedInstance = await this.modelMapper.mapToDecryptedInstance(instance)
		return await this.cryptoMapper.encryptParsedInstance(parsedInstance, subKeyInfo, new RootPath(parsedInstance.typeModel.app), ownerKey)
	}

	/**
	 * Decrypts an object literal as received from the server and maps it to an entity instance (e.g. Mail)
	 * @param instance The object literal as received from the DB
	 * @param sk The session key, must be provided for encrypted instances
	 * @returns The decrypted and mapped instance
	 */
	async decryptAndMap<T extends Entity>(instance: IncomingServerJson, sk: AesKey | null): Promise<T> {
		return this.decryptAndMapEncryptedInstance(await this.typeMapper.parseServerJson(instance), sk)
	}

	async decryptAndMapEncryptedInstance<T extends Entity>(encryptedParsedInstance: EncryptedParsedInstance, sk: AesKey | null): Promise<T> {
		const entityAdapter = await EntityAdapter.fromEncryptedParsedInstance(encryptedParsedInstance, this.modelMapper, this.cryptoMapper)
		const decryptedInstance = await this.cryptoMapper.decryptParsedInstance(
			encryptedParsedInstance,
			sk,
			validateKdfNonceLength(entityAdapter._kdfNonce),
			this.cryptoMapper.makeOwnerKeyProvider(entityAdapter._ownerGroup),
		)
		return await this.modelMapper.mapToInstance<T>(decryptedInstance)
	}
}
