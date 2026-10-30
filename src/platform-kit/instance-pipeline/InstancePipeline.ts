import {
	CryptoMapper,
	DecryptedParsedInstance,
	EncryptedParsedInstance,
	InstanceKeyProviderMakerInterface,
	LoggedInUserProvider,
	SymmetricGroupKeyLoader,
} from "./CryptoMapper"
import { ModelMapper } from "./ModelMapper"
import { lazy, Nullable } from "@tutao/utils"
import {
	AeadCipherVersion,
	AesKey,
	KeyEncryption,
	makeNullableSubKeyInfoWithSessionKeyCbcThenHmac,
	PartialSubKeyInfo,
	PartialSubKeyInfoAeadWithInstanceKey,
	PartialSubKeyInfoAeadWithSessionKey,
	PartialSubKeyInfoAesCbcThenHmac,
	Randomizer,
	SessionKeyDecryptor,
	SubKeyInfo,
	SymmetricCipherFacade,
	SymmetricEncryptionScheme,
	validateKdfNonceLength,
	VersionedKey,
} from "@tutao/crypto"
import { EnvProvider } from "@tutao/app-env"
import { EntityAdapter } from "./EntityAdapter"
import { ClientOnlyTypeModelResolver, TypeModelResolver } from "./EntityFunctions"
import { Entity, TypeRef } from "@tutao/meta"
import { IncomingServerJson, OutgoingServerJson, TypeMapper } from "./TypeMapper"
import { InstancePath, RootPath } from "./EncryptionContextPath"
import { InstanceTypeId } from "./InstanceTypeContext"
import { CryptoError } from "@tutao/crypto/error"
import { isNull, ProgrammingError } from "@tutao/lang-api"

EnvProvider.assertWorkerOrNode()

export class InstancePipeline {
	readonly typeMapper: TypeMapper
	readonly cryptoMapper: CryptoMapper
	readonly modelMapper: ModelMapper

	public constructor(
		public readonly typeModelResolver: TypeModelResolver,
		symGroupKeyLoader: lazy<SymmetricGroupKeyLoader>,
		symmetricCipherFacade: SymmetricCipherFacade,
		private readonly loggedInUserProvider: Nullable<LoggedInUserProvider>,
		private readonly instanceKeyProviderMaker: lazy<InstanceKeyProviderMakerInterface>,
		private readonly random: Randomizer,
		keyEncryption: KeyEncryption,
	) {
		this.modelMapper = new ModelMapper(typeModelResolver, this.random)
		this.typeMapper = new TypeMapper(typeModelResolver)
		this.cryptoMapper = new CryptoMapper(symmetricCipherFacade, symGroupKeyLoader, this.modelMapper, keyEncryption)
	}

	public enableNetworkDebugging(): void {
		this.typeMapper.enableNetworkDebugging()
	}

	public static newNativeOnly(
		typeModelResolver: ClientOnlyTypeModelResolver,
		symGroupKeyLoader: lazy<SymmetricGroupKeyLoader>,
		symmetricCipherFacade: SymmetricCipherFacade,
		instanceKeyProviderMaker: lazy<InstanceKeyProviderMakerInterface>,
		random: Randomizer,
		keyEncryption: KeyEncryption,
	): InstancePipeline {
		return new InstancePipeline(typeModelResolver, symGroupKeyLoader, symmetricCipherFacade, null, instanceKeyProviderMaker, random, keyEncryption)
	}

	private getSubKeyInfoForDataTransferType(
		aeadCipherVersion: AeadCipherVersion,
		sessionKeyDecryptor: Nullable<SessionKeyDecryptor>,
	): Nullable<PartialSubKeyInfo> {
		if (aeadCipherVersion === AeadCipherVersion.Unencrypted) {
			return null
		}
		if (isNull(this.loggedInUserProvider)) throw new ProgrammingError("missing loggedInUserProvider")
		switch (this.loggedInUserProvider.getDefaultSymmetricEncryptionScheme()) {
			case SymmetricEncryptionScheme.AesCbc: {
				if (isNull(sessionKeyDecryptor)) return null
				return new PartialSubKeyInfoAesCbcThenHmac(sessionKeyDecryptor)
			}
			case SymmetricEncryptionScheme.Aead:
				switch (aeadCipherVersion) {
					case AeadCipherVersion.WithInstanceKey:
						return new PartialSubKeyInfoAeadWithInstanceKey()
					case AeadCipherVersion.WithSessionKey: {
						if (isNull(sessionKeyDecryptor)) return null
						return new PartialSubKeyInfoAeadWithSessionKey(sessionKeyDecryptor)
					}
					default:
						throw new CryptoError("missing or unknown AEAD cipher version")
				}
			default:
				throw new CryptoError("missing or unknown symmetric encryption scheme")
		}
	}

	async mapAndEncrypt<T extends Entity>(_typeRef: TypeRef<T>, instance: T, sessionKey: Nullable<AesKey>): Promise<OutgoingServerJson> {
		const encryptedInstance = await this.mapAndEncryptToParsedInstance(_typeRef, instance, sessionKey)
		return this.typeMapper.makeServerJson(encryptedInstance)
	}

	async mapAndEncryptForDataTransferType<T extends Entity>(
		_typeRef: TypeRef<T>,
		instance: T,
		ownerKey: Nullable<VersionedKey>,
		aeadCipherVersion: AeadCipherVersion,
		sessionKeyDecryptor: Nullable<SessionKeyDecryptor>,
	): Promise<OutgoingServerJson> {
		const subKeyInfo = this.getSubKeyInfoForDataTransferType(aeadCipherVersion, sessionKeyDecryptor)
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

	async decryptAndMapEncryptedInstance<T extends Entity>(
		encryptedParsedInstance: EncryptedParsedInstance,
		sessionKey: AesKey | null,
		instanceTypeId: InstanceTypeId = encryptedParsedInstance.getInstanceTypeId(),
		instancePath: InstancePath = new RootPath(instanceTypeId.app),
	): Promise<T> {
		return (await this.decryptAndMapEncryptedInstanceParsed<T>(encryptedParsedInstance, sessionKey, instanceTypeId, instancePath)).instance
	}

	async decryptAndMapEncryptedInstanceParsed<T extends Entity>(
		encryptedParsedInstance: EncryptedParsedInstance,
		sessionKey: AesKey | null,
		instanceTypeId: InstanceTypeId = encryptedParsedInstance.getInstanceTypeId(),
		instancePath: InstancePath = new RootPath(instanceTypeId.app),
	): Promise<MappedDecryptedInstance<T>> {
		const entityAdapter = await EntityAdapter.fromEncryptedParsedInstance(encryptedParsedInstance, this.modelMapper, this.cryptoMapper)
		const decryptedInstance = await this.cryptoMapper.decryptParsedInstance(
			encryptedParsedInstance,
			sessionKey,
			validateKdfNonceLength(entityAdapter._kdfNonce),
			this.cryptoMapper.makeOwnerKeyProvider(entityAdapter._ownerGroup),
			await this.instanceKeyProviderMaker().makeInstanceKeyProvider(entityAdapter),
			instanceTypeId,
			instancePath,
		)
		return {
			instance: await this.modelMapper.mapToInstance<T>(decryptedInstance),
			decryptedParsedInstance: decryptedInstance,
		}
	}
}

interface MappedDecryptedInstance<T> {
	instance: T
	decryptedParsedInstance: DecryptedParsedInstance
}
