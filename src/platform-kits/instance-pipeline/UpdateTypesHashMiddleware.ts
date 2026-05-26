import { HttpMethod, RestClientMiddleware } from "../rest-client/types"
import { isNotNull } from "@tutao/utils"
import { getServiceRestPath } from "../meta"
import { ServerModelInfo } from "./EntityFunctions"
import { ApplicationTypesService } from "../../entities/base/Services"

export const APPLICATION_TYPES_HASH_HEADER = "app-types-hash"

/**
 * handle new server model and update the applicationTypesJson file if applicable
 */
export class UpdateAppTypesHashMiddleware implements RestClientMiddleware {
	constructor(private readonly serverModelInfo: ServerModelInfo) {}

	async interceptResponse(sentRequest: XMLHttpRequest, method: HttpMethod): Promise<void> {
		const path = sentRequest.responseURL
		const applicationTypesHashResponseHeader = sentRequest.getResponseHeader(APPLICATION_TYPES_HASH_HEADER)
		if (isNotNull(applicationTypesHashResponseHeader)) {
			this.serverModelInfo.setCurrentHash(applicationTypesHashResponseHeader)
		} else if (!(path === getServiceRestPath(ApplicationTypesService) && method === HttpMethod.GET)) {
			console.log(`Empty value for app types hash header in response with path ${path} and method ${method}`)
		}
	}
}
