// @flow
import type {LanguageViewModelType} from "../misc/LanguageViewModel"
import {lang, LanguageViewModel} from "../misc/LanguageViewModel"
import {downcast} from "../api/common/utils/Utils"
import {search} from "../search/PlainTextSearch"
import {LazyLoaded} from "../api/common/utils/LazyLoaded"

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
			]).spread((defaultTranslations, currentLanguageTranslations) => {
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

	fetchFAQ(langCode: string): Promise<Translation> {
		const faqPath = `https://tutanota.com/faq-entries/${langCode}.json`
		return fetch(faqPath)
			.then(translations => {
				return translations.json()
			}).catch(error => {
					console.log("Failed to fetch FAQ entries", error)
					return {keys: {}, code: langCode}
				}
			)
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

	search(query: string): Array<FaqEntry> {
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