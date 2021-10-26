//@flow
import {TutanotaError} from "../common/error/TutanotaError"
import type {TranslationKeyType} from "../../misc/TranslationKey"
import {lang} from "../../misc/LanguageViewModel"
import type {lazy} from "@tutao/tutanota-utils"
import {assertMainOrNode} from "../common/Env"

assertMainOrNode()

/**
 * Thrown when the business feature is not booked for a customer but required to execute a certain function.
 */
export class BusinessFeatureRequiredError extends TutanotaError {
	constructor(message: TranslationKeyType | lazy<string>) {
		super("BusinessFeatureRequiredError", lang.getMaybeLazy(message))
	}
}