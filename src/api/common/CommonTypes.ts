import type {TranslationKey} from "../../misc/LanguageViewModel"
export type InfoMessage = {
    translationKey: TranslationKey
    args: Record<string, any>
}