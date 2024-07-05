import type { TranslationKeyType } from "../../misc/TranslationKey"
import { lang } from "../../misc/LanguageViewModel"
import type { lazy } from "@tutao/tutanota-utils"
import { assertMainOrNode } from "../common/Env"
import { TutanotaError } from "@tutao/tutanota-error"

assertMainOrNode()

export class UserError extends TutanotaError {
	constructor(message: TranslationKeyType | lazy<string>) {
		super("UserError", lang.getMaybeLazy(message))
	}
}
