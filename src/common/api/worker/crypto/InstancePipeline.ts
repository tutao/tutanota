import { TypeMapper } from "./TypeMapper"
import { CryptoMapper } from "./CryptoMapper"
import { TypeReferenceResolver } from "../../common/EntityFunctions"
import { EncryptedParsedInstance, ParsedInstance, SomeEntity } from "../../common/EntityTypes"
import { ModelMapper } from "./ModelMapper"

export class InstancePipeline {
	private readonly typeMapper: TypeMapper
	private readonly cryptoMapper: CryptoMapper
	private readonly modelMapper: ModelMapper

	constructor(private readonly clientTypeModel: TypeReferenceResolver, private readonly serverTypeModel: TypeReferenceResolver) {
		this.typeMapper = new TypeMapper(serverTypeModel)
		this.cryptoMapper = new CryptoMapper(serverTypeModel)
		this.modelMapper = new ModelMapper(serverTypeModel, clientTypeModel)
	}

	async mapToServer<T extends SomeEntity>(instance: T | null): Promise<string | null> {
		const parsedInstance: ParsedInstance = await this.modelMapper.applyServerModel(instance)
		const encryptedParsedInstance: EncryptedParsedInstance = await this.cryptoMapper.encryptParsedInstance(parsedInstance)
		// ...
		return JSON.stringify(untypedInstance)
	}

	async mapFromServer<T extends SomeEntity>(): Promise<T | null> {}
}
