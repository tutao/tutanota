import { lang, TranslationKey, MaybeTranslation } from "../../misc/LanguageViewModel"
import { MaybeLazy, resolveMaybeLazy } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../common/Env"
import { TutanotaError } from "@tutao/tutanota-error"
import { TranslationKeyType } from "../../misc/TranslationKey"

assertMainOrNode()

export class UserError extends TutanotaError {
	public readonly data: string
	constructor(message: MaybeLazy<MaybeTranslation>) {
		const translation = resolveMaybeLazy(message)
		super("UserError", lang.getTranslationText(translation))
		this.data = lang.getTestId(translation)
	}
}
