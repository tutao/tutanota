//@flow
import {TutanotaError} from "../common/error/TutanotaError"
import type {TranslationKeyType} from "../../misc/TranslationKey"
import {assertMainOrNode} from "../common/Env"
import {lang} from "../../misc/LanguageViewModel"

assertMainOrNode()

export class UserError extends TutanotaError {
	constructor(message: TranslationKeyType | lazy<string>) {
		super("UserError", lang.getMaybeLazy(message))
	}
}