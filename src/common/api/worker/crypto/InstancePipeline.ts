import { TypeMapper } from "./TypeMapper"
import { CryptoMapper } from "./CryptoMapper"
import { ClientTypeReferenceResolver, ServerTypeReferenceResolver } from "../../common/EntityFunctions"
import { ClientModelParsedInstance, ClientModelUntypedInstance, Entity, ServerModelUntypedInstance } from "../../common/EntityTypes"
import { ModelMapper } from "./ModelMapper"
import { downcast, TypeRef } from "@tutao/tutanota-utils"
import { AesKey } from "@tutao/tutanota-crypto"
import { Nullable } from "@tutao/tutanota-utils"
import { isWebClient } from "../../common/Env"
import { ProgrammingError } from "../../common/error/ProgrammingError"

export class InstancePipeline {
	readonly typeMapper: TypeMapper
	readonly cryptoMapper: CryptoMapper
	readonly modelMapper: ModelMapper

	constructor(
		private readonly clientTypeReferenceResolver: ClientTypeReferenceResolver,
		private readonly serverTypeReferenceResolver: ServerTypeReferenceResolver | ClientTypeReferenceResolver,
	) {
		if (isWebClient() && serverTypeReferenceResolver === clientTypeReferenceResolver) {
			throw new ProgrammingError("initializing server type reference resolver with client type reference resolver on webapp is not allowed!")
		}
		this.typeMapper = new TypeMapper(clientTypeReferenceResolver, serverTypeReferenceResolver)
		this.cryptoMapper = new CryptoMapper(clientTypeReferenceResolver, serverTypeReferenceResolver)
		this.modelMapper = new ModelMapper(clientTypeReferenceResolver, serverTypeReferenceResolver)
	}

	async mapAndEncrypt<T extends Entity>(
		typeRef: TypeRef<T>,
		instance: T,
		sk: Promise<Nullable<AesKey>> | Nullable<AesKey>,
	): Promise<ClientModelUntypedInstance> {
		const typeModel = await this.clientTypeReferenceResolver(typeRef)
		const parsedInstance: ClientModelParsedInstance = await this.modelMapper.mapToClientModelParsedInstance(downcast(typeRef), instance)

		const sessionKey = sk instanceof Promise ? await sk : sk

		const encryptedParsedInstance = await this.cryptoMapper.encryptParsedInstance(typeModel, parsedInstance, sessionKey)
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
		const parsedInstance = await this.cryptoMapper.decryptParsedInstance(serverTypeModel, encryptedParsedInstance, sk)
		return await this.modelMapper.mapToInstance(typeRef, parsedInstance)
	}
}
