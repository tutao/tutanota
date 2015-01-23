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
	var lang = null; // tutao.tutanota.util.LocalStore.load('language');
	if (!lang) {
		lang = tutao.tutanota.util.ClientDetector.getDefaultLanguage();
	}
	this._current = ko.observable(lang);
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
	if (lang != "en" && lang != "de") {
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
	var text = tutao.tutanota.ctrl.LanguageViewModel[this._current()][id];
	if (!text) {
		throw new Error("no translation found for id " + id);
	}
	if (params instanceof Object) {
		for (var param in params) {
			text = text.replace(param, params[param]);
		}
	}
	return text;
};

/**
 * Returns all translations in pretty-printed form.
 */
tutao.tutanota.ctrl.LanguageViewModel.prototype.allTranslationsAsJson = function() {
	return JSON.stringify({de: tutao.tutanota.ctrl.LanguageViewModel.de, en: tutao.tutanota.ctrl.LanguageViewModel.en}, null, 2)
};
