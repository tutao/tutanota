// @flow
import type {LanguageViewModelType} from "../misc/LanguageViewModel"
import {lang, LanguageViewModel} from "../misc/LanguageViewModel"
import {assert, downcast} from "@tutao/tutanota-utils"
import {search} from "../api/common/utils/PlainTextSearch"
import {LazyLoaded} from "@tutao/tutanota-utils"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {delay, promiseMap} from "@tutao/tutanota-utils"
import type {SanitizeResult} from "../misc/HtmlSanitizer"

export type FaqEntry = {
	id: string,
	title: string,
	text: string,
	tags: string
}

type Translation = {
	code: string,
	keys: {[string]: string}
}
const FAQ_PREFIX = "faq."
const MARKDOWN_SUFFIX = "_markdown"

/**
 * Loads FAQ entries from tutanota.com for different languages and allows searching
 *
 *
 */
// visibility only for testing
export class FaqModel {
	_list: Array<FaqEntry>;
	_currentLanguageCode: string;
	_faqLanguages: LanguageViewModelType;
	_lazyLoaded: LazyLoaded<void>;

	constructor() {
		this._lazyLoaded = new LazyLoaded(() => {
			return Promise.all([
				this.fetchFAQ("en"),
				this.fetchFAQ(lang.code)
			]).then(([defaultTranslations, currentLanguageTranslations]) => {
					if (defaultTranslations != null || currentLanguageTranslations != null) {
						const faqLanguageViewModel = new LanguageViewModel()
						faqLanguageViewModel.initWithTranslations(lang.code, lang.languageTag, defaultTranslations, currentLanguageTranslations)
						this._faqLanguages = faqLanguageViewModel
					}
				}
			)
		})
	}

	init(): Promise<void> {
		return this._lazyLoaded.getAsync()
	}

	async fetchFAQ(langCode: string): Promise<Translation> {
		const faqPath = `https://tutanota.com/faq-entries/${langCode}.json`

		const keys = await fetch(faqPath)
			.then(response => response.json())
			.then(language => language.keys)
			.catch(error => {
				console.log("Failed to fetch FAQ entries", error)
				return {}
			})

		const entries = await promiseMap(Object.entries(keys), async ([key, entry]) => {

			// If entry isn't a string it means we're getting malformed responses
			assert(typeof entry === "string", "invalid translation entry")
			const unsanitizedText = downcast(entry)

			// Declaring some types manually because there seem to be a bug where types are not checked
			const sanitized: SanitizeResult = htmlSanitizer.sanitize(unsanitizedText, {blockExternalContent: false})

			// Delay to spread sanitize() calls between event loops.
			// Otherwise we stop main thread for way too long and UI gets laggy.
			await delay(1)
			return [key, sanitized.text]
		})

		const translations = Object.fromEntries(entries)
		return {code: langCode, keys: translations}
	}

	getList(): Array<FaqEntry> {
		if (this._list == null && this._faqLanguages == null) {
			return []
		}
		if (this._list == null || this._currentLanguageCode !== lang.code) {
			this._currentLanguageCode = lang.code
			const faqNames = Object.keys(this._faqLanguages.fallback.keys)
			this._list = faqNames.filter(key => key.startsWith(FAQ_PREFIX) && key.endsWith(MARKDOWN_SUFFIX))
			                     .map((titleKey: string) => titleKey.substring(FAQ_PREFIX.length, titleKey.indexOf(MARKDOWN_SUFFIX)))
			                     .map((name: string) => this.createFAQ(name))
		}
		return this._list
	}

	search(query: string): $ReadOnlyArray<FaqEntry> {
		const cleanQuery = query.trim()
		if (cleanQuery === "") {
			return []
		} else {
			return search(cleanQuery, this.getList(), ['tags', 'title', 'text'], true)
		}
	}

	createFAQ(id: string): FaqEntry {
		return {
			id: id,
			title: this._faqLanguages.get(downcast(`faq.${id}_title`)),
			text: this._faqLanguages.get(downcast(`faq.${id}_markdown`)),
			tags: this.getTags(`faq.${id}_tags`),
		}
	}


	getTags(id: string): string {
		try {
			return this._faqLanguages.get(downcast(id))
		} catch (e) {
			return ""
		}
	}

}


export const faq: FaqModel = new FaqModel()