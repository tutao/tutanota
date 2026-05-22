import { PermissionError } from "../api/common/error/PermissionError"
import { ContactSuggestion, MobileContactsFacade } from "../../native-bridge/common/generatedipc/types"
import { ContactSuggestionProvider } from "../misc/RecipientsSearchModel"

export class MobileContactSuggestionProvider implements ContactSuggestionProvider {
	private gotPermissionError: boolean = false

	constructor(private readonly mobileContactsFacade: MobileContactsFacade) {}

	async getContactSuggestions(query: string): Promise<readonly ContactSuggestion[]> {
		if (this.gotPermissionError) {
			return []
		}
		try {
			return await this.mobileContactsFacade.findSuggestions(query)
		} catch (e) {
			if (e instanceof PermissionError) {
				this.gotPermissionError = true
				return []
			} else {
				throw e
			}
		}
	}
}
