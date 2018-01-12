//@flow
import {lang} from "../misc/LanguageViewModel"

export function getDefaultContactFormLanguage(languages: ContactFormLanguage[]):ContactFormLanguage {
	let language = languages.find(l => l.code == lang.code)
	if (!language) {
		language = languages.find(l => l.code == 'en')
	}
	if (!language) {
		language = languages[0]
	}
	return language
}