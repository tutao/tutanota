import { assertMainOrNode } from "@tutao/app-env"
import { DeleteService, GetService, ParamTypeFromRef, PostService, PutService, ReturnTypeFromRef } from "@tutao/typerefs"
import { AesKey } from "@tutao/crypto"
import { SuspensionBehavior } from "@tutao/rest-client/types"

assertMainOrNode()

export interface IServiceExecutor {
	get<S extends GetService>(service: S, data: ParamTypeFromRef<S["get"]["data"]>, params?: ExtraServiceParams): Promise<ReturnTypeFromRef<S["get"]["return"]>>

	post<S extends PostService>(
		service: S,
		data: ParamTypeFromRef<S["post"]["data"]>,
		params?: ExtraServiceParams,
	): Promise<ReturnTypeFromRef<S["post"]["return"]>>

	put<S extends PutService>(service: S, data: ParamTypeFromRef<S["put"]["data"]>, params?: ExtraServiceParams): Promise<ReturnTypeFromRef<S["put"]["return"]>>

	delete<S extends DeleteService>(
		service: S,
		data: ParamTypeFromRef<S["delete"]["data"]>,
		params?: ExtraServiceParams,
	): Promise<ReturnTypeFromRef<S["delete"]["return"]>>
}

export interface ExtraServiceParams {
	queryParams?: Dict
	sessionKey?: AesKey
	extraHeaders?: Dict
	suspensionBehavior?: SuspensionBehavior
	/** override origin for the request */
	baseUrl?: string
}
