//@flow
import {TutanotaError} from "./TutanotaError"
import type {TranslationKeyType} from "../../../misc/TranslationKey"
import {assertMainOrNode} from "../../Env"
import {lang} from "../../../misc/LanguageViewModel"

assertMainOrNode()

export class BusinessFeatureRequiredError extends TutanotaError {
	constructor(message: TranslationKeyType | lazy<string>) {
		super("BusinessFeatureRequiredError", lang.getMaybeLazy(message))
	}
}