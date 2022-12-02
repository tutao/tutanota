import type {LanguageViewModelType} from "../misc/LanguageViewModel"
import {lang, LanguageViewModel} from "../misc/LanguageViewModel"
import {assert, delay, downcast, LazyLoaded, promiseMap} from "@tutao/tutanota-utils"
import {search} from "../api/common/utils/PlainTextSearch"
import type {SanitizedHTML} from "../misc/HtmlSanitizer"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {ProgrammingError} from "../api/common/error/ProgrammingError.js"

export type FaqEntry = {
	id: string
	title: string
	text: string
	tags: string
}
type Translation = {
	code: string
	keys: Record<string, string>
}
const FAQ_PREFIX = "faq."
const MARKDOWN_SUFFIX = "_markdown"

/**
 * Loads FAQ entries from tutanota.com for different languages and allows searching
 *
 * NOTE: it's only exported for testing!
 */
export class FaqModel {
	private list: Array<FaqEntry> | null = null
	private currentLanguageCode: string | null = null
	private faqLanguages: LanguageViewModelType | null = null
	private lazyLoaded: LazyLoaded<void>

	private get faqLang(): LanguageViewModel {
		if (this.faqLanguages == null) {
			throw new ProgrammingError("faq not initialized!")
		}
		return this.faqLanguages
	}

	constructor() {
		this.lazyLoaded = new LazyLoaded(() => {
			return Promise.all([this.fetchFAQ("en"), this.fetchFAQ(lang.code)]).then(([defaultTranslations, currentLanguageTranslations]) => {
				if (defaultTranslations != null || currentLanguageTranslations != null) {
					const faqLanguageViewModel = new LanguageViewModel()
					faqLanguageViewModel.initWithTranslations(lang.code, lang.languageTag, defaultTranslations, currentLanguageTranslations)
					this.faqLanguages = faqLanguageViewModel
				}
			})
		})
	}

	async init(): Promise<void> {
		await this.lazyLoaded.getAsync()
		this.getList()
	}

	/**
	 * will return all faq entries that contain the given query and mark the query occurrences
	 * with <mark> tags.
	 */
	search(query: string): ReadonlyArray<FaqEntry> {
		const cleanQuery = query.trim()

		if (cleanQuery === "") {
			return []
		} else {
			return search(cleanQuery, this.getList(), ["tags", "title", "text"], true)
		}
	}

	/**
	 * fetch the entries for the given lang code from the web site
	 */
	private async fetchFAQ(langCode: string): Promise<Translation> {
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
			const sanitized: SanitizedHTML = htmlSanitizer.sanitizeHTML(unsanitizedText, {
				blockExternalContent: false,
			})
			// Delay to spread sanitize() calls between event loops.
			// otherwise, we stop main thread for way too long and UI gets laggy.
			await delay(1)
			return [key, sanitized.html]
		})
		const translations = Object.fromEntries(entries)
		return {
			code: langCode,
			keys: translations,
		}
	}

	/**
	 * return the current faqEntry list if it fits the current language code
	 * otherwise, recreate the list for current lang and then return it
	 */
	private getList(): Array<FaqEntry> {
		if (this.list == null && this.faqLanguages == null) {
			return []
		}

		if (this.list == null || this.currentLanguageCode !== lang.code) {
			this.currentLanguageCode = lang.code
			const faqNames = Object.keys(this.faqLang.fallback.keys)
			this.list = faqNames
				.filter(key => key.startsWith(FAQ_PREFIX) && key.endsWith(MARKDOWN_SUFFIX))
				.map((titleKey: string) => titleKey.substring(FAQ_PREFIX.length, titleKey.indexOf(MARKDOWN_SUFFIX)))
				.map((name: string) => this.createFAQ(name))
		}

		return this.list
	}

	/**
	 * convert the raw translations for an id to a structured FaqEntry
	 */
	private createFAQ(id: string): FaqEntry {
		return {
			id: id,
			title: this.faqLang.get(downcast(`faq.${id}_title`)),
			text: this.faqLang.get(downcast(`faq.${id}_markdown`)),
			tags: this.getTags(`faq.${id}_tags`),
		}
	}

	private getTags(id: string): string {
		try {
			return this.faqLang.get(downcast(id))
		} catch (e) {
			return ""
		}
	}
}

export const faq: FaqModel = new FaqModel()