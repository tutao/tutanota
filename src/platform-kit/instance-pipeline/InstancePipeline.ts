import { TypeMapper } from "./TypeMapper"
import { CryptoMapper, SymmetricGroupKeyLoader } from "./CryptoMapper"
import { TypeRef } from "../meta"
import { ModelMapper } from "./ModelMapper"
import { downcast, lazy, Nullable } from "@tutao/utils"
import { AesKey, SessionKeyInfo, SubKeyInfo, SymmetricCipherFacade, validateKdfNonceLength } from "@tutao/crypto"
import { assertWorkerOrNode, isWebClient, ProgrammingError } from "@tutao/app-env"
import { EntityAdapter } from "./EntityAdapter"
import { ClientTypeReferenceResolver, ServerTypeReferenceResolver } from "./EntityFunctions"
import { ClientModelParsedInstance, ClientModelUntypedInstance, Entity, ServerModelUntypedInstance } from "../meta/EntityTypes"

assertWorkerOrNode()

export class InstancePipeline {
	readonly typeMapper: TypeMapper
	readonly cryptoMapper: CryptoMapper
	readonly modelMapper: ModelMapper

	constructor(
		private readonly clientTypeReferenceResolver: ClientTypeReferenceResolver,
		private readonly serverTypeReferenceResolver: ServerTypeReferenceResolver | ClientTypeReferenceResolver,
		symGroupKeyLoader: lazy<SymmetricGroupKeyLoader>,
		symmetricCipherFacade: SymmetricCipherFacade,
	) {
		if (isWebClient() && serverTypeReferenceResolver === clientTypeReferenceResolver) {
			throw new ProgrammingError("initializing server type reference resolver with client type reference resolver on webapp is not allowed!")
		}
		this.typeMapper = new TypeMapper(clientTypeReferenceResolver, serverTypeReferenceResolver)
		this.modelMapper = new ModelMapper(clientTypeReferenceResolver, serverTypeReferenceResolver)
		this.cryptoMapper = new CryptoMapper(
			clientTypeReferenceResolver,
			serverTypeReferenceResolver,
			symmetricCipherFacade,
			symGroupKeyLoader,
			this.modelMapper,
		)
	}

	async mapAndEncrypt<T extends Entity>(
		typeRef: TypeRef<T>,
		instance: T,
		sessionKeyInfo: Promise<Nullable<SessionKeyInfo>> | Nullable<SessionKeyInfo>,
	): Promise<ClientModelUntypedInstance>
	async mapAndEncrypt<T extends Entity>(typeRef: TypeRef<T>, instance: T, subKeyInfo: SubKeyInfo): Promise<ClientModelUntypedInstance>
	async mapAndEncrypt<T extends Entity>(
		typeRef: TypeRef<T>,
		instance: T,
		subKeyInfo: Promise<Nullable<SessionKeyInfo>> | SubKeyInfo,
	): Promise<ClientModelUntypedInstance> {
		const typeModel = await this.clientTypeReferenceResolver(typeRef)
		const parsedInstance: ClientModelParsedInstance = await this.modelMapper.mapToClientModelParsedInstance(downcast(typeRef), instance)
		const encryptedParsedInstance = await this.cryptoMapper.encryptParsedInstance(typeModel, parsedInstance, await subKeyInfo)
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
		const serverTypeModel = await this.serverTypeReferenceResolver(typeRef)
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
