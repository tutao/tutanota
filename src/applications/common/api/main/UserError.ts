import { lang, MaybeTranslation } from "../../../../ui/utils/LanguageViewModel"
import { MaybeLazy, resolveMaybeLazy } from "../../../../ui/base/MaybeLazy"
import { EnvProvider, TutanotaError } from "@tutao/app-env"
import { TutanotaErrorWithData } from "@tutao/lang-api"

EnvProvider.assertMainOrNode()

export class UserError extends TutanotaError implements TutanotaErrorWithData<string> {
	public data: Readonly<string>
	constructor(message: MaybeLazy<MaybeTranslation>) {
		const translation = resolveMaybeLazy(message)
		super("UserError", lang.getTranslationText(translation))
		this.data = lang.getTestId(translation)
	}
}
