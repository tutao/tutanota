import { HttpMethod, InterceptedResponse, RestClientMiddleware } from "../rest-client/types"
import { isNotNull } from "@tutao/utils"
import { ServerModelInfo } from "./EntityFunctions"
import { ApplicationTypesService_GET } from "@tutao/entities/base"

export const APPLICATION_TYPES_HASH_HEADER = "app-types-hash"

/**
 * handle new server model and update the applicationTypesJson file if applicable
 */
export class UpdateAppTypesHashMiddleware implements RestClientMiddleware {
	constructor(private readonly serverModelInfo: ServerModelInfo) {}

	async interceptResponse(sentResponse: InterceptedResponse, method: HttpMethod): Promise<void> {
		const path = sentResponse.url
		const applicationTypesHashResponseHeader = sentResponse.getHeader(APPLICATION_TYPES_HASH_HEADER)
		if (isNotNull(applicationTypesHashResponseHeader)) {
			this.serverModelInfo.setCurrentHash(applicationTypesHashResponseHeader)
		} else if (!(path === ApplicationTypesService_GET.serviceRestPath && method === HttpMethod.GET)) {
			console.log(`Empty value for app types hash header in response with path ${path} and method ${method}`)
		}
	}
}
