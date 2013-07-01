"use strict";

TestCase("LanguageViewModelTest", {

	setUp: function() {
		this.vm = new tutao.tutanota.ctrl.LanguageViewModel();
	},
	tearDown: function() {
	},
	"test test that switching the language and retrieving translations without params works": function() {
		this.vm.setCurrentLanguage("en");
		assertEquals("save", this.vm.get("save_action"));
		this.vm.setCurrentLanguage("de");
		assertEquals("Speichern", this.vm.get("save_action"));
	},
	"test that retrieving translations with params works": function() {
		this.vm.setCurrentLanguage("en");
		assertEquals("for a@b.de", this.vm.get("forUser_label", {'$': 'a@b.de'}));
	},
	"test that all translation names have a valid suffix": function() {
		var validSuffixes = ["label", "action", "msg", "title", "alt", "placeholder"];
		for (var translation in tutao.tutanota.ctrl.LanguageViewModel["en"]) {
			assertTrue("translation name \"" + translation + "\" does not have a suffix", translation.indexOf("_") != -1);
			assertTrue("translation name \"" + translation + "\" does not have a valid suffix", tutao.util.ArrayUtils.contains(validSuffixes, translation.substring(translation.indexOf("_") + 1)));
		}
	},
	"test that the languages share the same translations": function() {
		for (var language in tutao.tutanota.ctrl.LanguageViewModel) {
			for (var translation in tutao.tutanota.ctrl.LanguageViewModel[language]) {
				for (var otherLanguage in tutao.tutanota.ctrl.LanguageViewModel) {
					assertNotUndefined(translation + " undefined in " + language + ": ", tutao.tutanota.ctrl.LanguageViewModel[language][translation]);
					assertNotUndefined(translation + " undefined in " + otherLanguage + ": ", tutao.tutanota.ctrl.LanguageViewModel[otherLanguage][translation]);
				}
			}
		}
	},
});
