import { lang, MaybeTranslation } from "../../../ui/utils/LanguageViewModel"
import { MaybeLazy, resolveMaybeLazy } from "@tutao/utils"
import { assertMainOrNode, TutanotaError } from "@tutao/app-env"

assertMainOrNode()

export class UserError extends TutanotaError {
	public readonly data: string
	constructor(message: MaybeLazy<MaybeTranslation>) {
		const translation = resolveMaybeLazy(message)
		super("UserError", lang.getTranslationText(translation))
		this.data = lang.getTestId(translation)
	}
}
