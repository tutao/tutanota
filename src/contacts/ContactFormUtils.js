//@flow
import {lang} from "../misc/LanguageViewModel"
import {createContactFormLanguage} from "../api/entities/tutanota/ContactFormLanguage"

export function getDefaultContactFormLanguage(languages: ContactFormLanguage[]): ContactFormLanguage {
	let language = languages.find(l => l.code == lang.code)
	if (!language) {
		language = languages.find(l => l.code == 'en')
	}
	if (!language) {
		language = languages[0]
	}
	if (!language) { // FIXME: only needed for existing contact forms remove after all existing contact forms have been saved.
		language = createContactFormLanguage()
		language.code = lang.code
	}
	return language
}