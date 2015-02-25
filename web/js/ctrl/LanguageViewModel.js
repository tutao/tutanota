"use strict";

tutao.provide('tutao.tutanota.ctrl.LanguageViewModel');

/**
 * Provides all localizations of strings on our gui.
 *
 * The translations are defined on tutao.tutanota.ctrl.LanguageViewModel.* (e.g. tutao.tutanota.ctrl.LanguageViewModel.en).
 * See the sub-folder 'lang' for examples. The actual identifier is camel case and the type is appended by an underscore.
 * Types: label, action, msg, title, alt, placeholder
 *
 * @constructor
 */
tutao.tutanota.ctrl.LanguageViewModel = function() {
	tutao.util.FunctionUtils.bindPrototypeMethodsToThis(this);
	this._current = ko.observable(this._getDefaultLanguage());
};

/**
 * Provides the current language, one of "en" and "de"
 * @return {string} The current language.
 */
tutao.tutanota.ctrl.LanguageViewModel.prototype.getCurrentLanguage = function() {
	return this._current();
};

/**
 * Sets the current language.
 * @param {string} lang The language to set, one of "en" and "de".
 */
tutao.tutanota.ctrl.LanguageViewModel.prototype.setCurrentLanguage = function(lang) {
	if (!tutao.tutanota.ctrl.LanguageViewModel[lang]) {
		throw new Error("invalid language: " + lang);
	}
	// tutao.tutanota.util.LocalStore.store('language', lang);
	this._current(lang);
};

/**
 * Provides the text with the given id and the given params in the currently selected language.
 * @param {string} id One of the ids defined in tutao.tutanota.ctrl.LanguageViewModel.en or tutao.tutanota.ctrl.LanguageViewModel.de.
 * @param {Object<String,String>=} params An object whose property keys are the strings that shall be replaced by the corresponding property value in the text.
 * @return {string} The text.
 */
tutao.tutanota.ctrl.LanguageViewModel.prototype.get = function(id, params) {
	if (id == null) {
		return "";
	}
	if (id == "emptyString_msg") {
		return "\u2008";
	}
    if (id.indexOf("@") == 0) {
        // we regard texts marked with "@" as static text
        return id.substring(1);
    }
	var text = tutao.tutanota.ctrl.LanguageViewModel[this._current()]['keys'][id];
	if (!text) {
		// try fallback language
		text = tutao.tutanota.ctrl.LanguageViewModel[tutao.tutanota.ctrl.LanguageViewModel.en.id]['keys'][id];
		if (!text){
			throw new Error("no translation found for id " + id);
		}
	}
	if (params instanceof Object) {
		for (var param in params) {
			text = text.replace(param, params[param]);
		}
	}
	return text;
};

/**
 * Provides the list of all languages"
 * @return {Array.<Object.{string,string}>} The current languages containg id and textid.
 */
tutao.tutanota.ctrl.LanguageViewModel.prototype.getLanguages = function() {
	return [
		{ id: tutao.tutanota.ctrl.LanguageViewModel.sq.id, textId: 'languageAlbanian_label'},
		{ id: tutao.tutanota.ctrl.LanguageViewModel.hr.id, textId: 'languageCroatian_label'},
		{ id: tutao.tutanota.ctrl.LanguageViewModel.zh_hant.id, textId: 'languageChineseTraditional'},
		//{ id: tutao.tutanota.ctrl.LanguageViewModel.zh.id, textId: 'languageChineseSimplified_label'},
		{ id: tutao.tutanota.ctrl.LanguageViewModel.en.id, textId: 'languageEnglish_label'},
		{ id: tutao.tutanota.ctrl.LanguageViewModel.nl.id, textId: 'languageDutch_label'},
		{ id: tutao.tutanota.ctrl.LanguageViewModel.de.id, textId: 'languageGerman_label'},
		// { id: tutao.tutanota.util.ClientDetector.ar, textId: 'languageArabic_label' },
		{ id: tutao.tutanota.ctrl.LanguageViewModel.el.id, textId: 'languageGreek_label'},
		{ id: tutao.tutanota.ctrl.LanguageViewModel.fr.id, textId: 'languageFrench_label'},
		{ id: tutao.tutanota.ctrl.LanguageViewModel.it.id, textId: 'languageItalian_label'},
		{ id: tutao.tutanota.ctrl.LanguageViewModel.pl.id, textId: 'languagePolish_label' },
		{ id: tutao.tutanota.ctrl.LanguageViewModel.pt_pt.id, textId: 'languagePortugesePortugal_label'},
		{ id: tutao.tutanota.ctrl.LanguageViewModel.pt_br.id, textId: 'languagePortugeseBrazil_label' },
		{ id: tutao.tutanota.ctrl.LanguageViewModel.ro.id, textId: 'languageRomanian_label'},
		{ id: tutao.tutanota.ctrl.LanguageViewModel.ru.id, textId: 'languageRussian_label'},
		{ id: tutao.tutanota.ctrl.LanguageViewModel.es.id, textId: 'languageSpanish_label' },
		{ id: tutao.tutanota.ctrl.LanguageViewModel.tr.id, textId: 'languageTurkish_label'}
	]
};

/**
 * Returns all translations in pretty-printed form to generate textids for outlook.
 */
tutao.tutanota.ctrl.LanguageViewModel.prototype.allTranslationsAsJson = function() {
	return JSON.stringify({de: tutao.tutanota.ctrl.LanguageViewModel.de.keys, en: tutao.tutanota.ctrl.LanguageViewModel.en.keys}, null, 2)
};


/**
 * Gets the default language derived from the browser language.
 */
tutao.tutanota.ctrl.LanguageViewModel.prototype._getDefaultLanguage = function() {
	var lang = tutao.tutanota.util.ClientDetector.getDefaultLanguage();
	if (lang){
		lang = lang.toLowerCase().replace("-","_");
		var languages = this.getLanguages();
		for(var i=0; i<languages.length;i++){
			if (languages[i].id == lang ){
				return lang;
			}
		}

		for(i=0; i<languages.length;i++){
			if (tutao.util.StringUtils.startsWith(languages[i].id, lang.substr(0,2))){
				return languages[i].id;
			}
		}
	}
	return tutao.tutanota.ctrl.LanguageViewModel.en.id;
};
