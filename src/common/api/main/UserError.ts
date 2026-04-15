import { lang, TranslationKey, MaybeTranslation } from "../../misc/LanguageViewModel"
import { MaybeLazy, resolveMaybeLazy } from "@tutao/utils"
import { assertMainOrNode } from "@tutao/app-env"
import { TutanotaError } from "@tutao/app-env"

assertMainOrNode()

export class UserError extends TutanotaError {
	public readonly data: string
	constructor(message: MaybeLazy<MaybeTranslation>) {
		const translation = resolveMaybeLazy(message)
		super("UserError", lang.getTranslationText(translation))
		this.data = lang.getTestId(translation)
	}
}
