import { CryptoMapper, EncryptedParsedInstance, SymmetricGroupKeyLoader } from "./CryptoMapper"
import { ModelMapper } from "./ModelMapper"
import { lazy, Nullable } from "@tutao/utils"
import {
	AesKey,
	SubKeyInfo,
	SymmetricCipherFacade,
	validateKdfNonceLength,
	makeNullableSubKeyInfoWithSessionKeyCbcThenHmac
} from "@tutao/crypto"
import { assertWorkerOrNode } from "@tutao/app-env"
import { EntityAdapter } from "./EntityAdapter"
import { ClientOnlyTypeModelResolver, TypeModelResolver } from "./EntityFunctions"
import { Entity, TypeRef } from "@tutao/meta"
import { IncomingServerJson, OutgoingServerJson, TypeMapper } from "./TypeMapper"

assertWorkerOrNode()

export class InstancePipeline {
	readonly typeMapper: TypeMapper
	readonly cryptoMapper: CryptoMapper
	readonly modelMapper: ModelMapper

	public constructor(
		public readonly typeModelResolver: TypeModelResolver,
		symGroupKeyLoader: lazy<SymmetricGroupKeyLoader>,
		symmetricCipherFacade: SymmetricCipherFacade,
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
		return new InstancePipeline(typeModelResolver, symGroupKeyLoader, symmetricCipherFacade)
	}

	async mapAndEncrypt<T extends Entity>(
		_typeRef: TypeRef<T>,
		instance: T,
		sessionKey: Promise<Nullable<AesKey>> | Nullable<AesKey>,
	): Promise<OutgoingServerJson> {
		const encryptedInstance = await this.mapAndEncryptToParsedInstance(_typeRef, instance, sessionKey)
		return this.typeMapper.makeServerJson(encryptedInstance)
	}

	async mapAndEncryptToParsedInstance<T extends Entity>(
		_typeRef: TypeRef<T>,
		instance: T,
		sessionKey: Promise<Nullable<AesKey>> | Nullable<AesKey>,
	): Promise<EncryptedParsedInstance> {
		const sk = await sessionKey
		const subKeyInfo = makeNullableSubKeyInfoWithSessionKeyCbcThenHmac(sk)

		return this.mapAndEncryptWithSubKeyInfo(instance, subKeyInfo)
	}
	async mapAndEncryptWithSubKeyInfo<T extends Entity>(instance: T, subKeyInfo: Nullable<SubKeyInfo>): Promise<EncryptedParsedInstance> {
		const parsedInstance = await this.modelMapper.mapToDecryptedInstance(instance)
		return await this.cryptoMapper.encryptParsedInstance(parsedInstance, subKeyInfo)
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
