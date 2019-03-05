//@flow
import type {TranslationKey} from "../../misc/LanguageViewModel"

export type InfoMessage = {
	translationKey: TranslationKey,
	args: {[string]: any}
}
