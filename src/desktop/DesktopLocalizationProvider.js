// @flow
import {ipc} from './IPC.js'
import type {DeferredObject} from "../api/common/utils/Utils"
import {defer} from "../api/common/utils/Utils"

class DesktopLocalizationProvider {

	initialized: DeferredObject<void> = defer();
	translations: Object;
	fallback: Object;
	code: string;
	languageTag: string;
	staticTranslations: Object;
	formats: Object;

	init = (): Promise<void> => {
		return ipc.sendRequest('sendTranslations', [])
		          .then(this._setTranslations)
		          .then(() => this.initialized.resolve())
	}

	_setTranslations = (translations: any) => {
		this.translations = translations.translations
		this.fallback = translations.fallback
		this.code = translations.code
		this.languageTag = translations.languageTag
		this.staticTranslations = translations.staticTranslations
		this.formats = translations.format
	}

	/**
	 * keep in sync with LanguageViewModel.get
	 * @param id
	 * @param params
	 * @returns {*}
	 */
	get = (id: string, params: ?Object): string => {
		if (id == null) {
			return ""
		}
		if (id === "emptyString_msg") {
			return "\u2008"
		}
		var text = this.translations.keys[id]
		if (!text) {
			// try fallback language
			text = this.fallback.keys[id]
			if (!text) {
				// try static definitions
				text = this.staticTranslations[id]
				if (!text) {
					throw new Error("no translation found for id " + id)
				}
			}
		}
		if (params instanceof Object) {
			for (var param in params) {
				text = text.replace(param, params[param])
			}
		}
		return text
	}
}


export const lang = new DesktopLocalizationProvider()