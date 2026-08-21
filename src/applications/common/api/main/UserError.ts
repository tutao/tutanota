import { lang, MaybeTranslation } from "../../../../ui/utils/LanguageViewModel"
import { MaybeLazy, resolveMaybeLazy } from "../../../../ui/base/MaybeLazy"
import { EnvProvider, TutanotaError } from "@tutao/app-env"

EnvProvider.assertMainOrNode()

export class UserError extends TutanotaError<string> {
	public readonly data: string
	constructor(message: MaybeLazy<MaybeTranslation>) {
		const translation = resolveMaybeLazy(message)
		super("UserError", lang.getTranslationText(translation))
		this.data = lang.getTestId(translation)
	}
}
