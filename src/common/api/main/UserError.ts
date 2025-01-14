import { lang, TranslationKey, MaybeTranslation } from "../../misc/LanguageViewModel"
import { MaybeLazy, resolveMaybeLazy } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../common/Env"
import { TutanotaError } from "@tutao/tutanota-error"

assertMainOrNode()

export class UserError extends TutanotaError {
	constructor(message: MaybeLazy<MaybeTranslation>) {
		super("UserError", lang.getTranslationText(resolveMaybeLazy(message)))
	}
}
