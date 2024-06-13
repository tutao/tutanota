import { LanguageCode } from "../../misc/LanguageViewModel.js"

const DICT_EN: string[] = ["respected sir", "see you again", "thank you", "hello"]
const DICT_DE: string[] = ["hallo", "guten tag", "widersehen"]

export function detectLanguage(content: string): LanguageCode | null {
	let contentLower = content.toLowerCase()

	// todo: which to loop first
	for (let i = 0; i < DICT_DE.length; i++) {
		let this_greet = DICT_DE[i]
		if (contentLower.indexOf(this_greet) != -1) {
			return "de"
		}
	}

	for (let i = 0; i < DICT_EN.length; i++) {
		let this_greet = DICT_EN[i]
		if (contentLower.indexOf(this_greet) != -1) {
			return "en"
		}
	}

	return null
}
