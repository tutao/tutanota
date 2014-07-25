"use strict";

TestCase("LanguageViewModelTest", {

	setUp: function() {
		this.vm = new tutao.tutanota.ctrl.LanguageViewModel();
	},
	tearDown: function() {
	},
	"test test that switching the language and retrieving translations without params works": function() {
		this.vm.setCurrentLanguage("en");
		assertEquals("Save", this.vm.get("save_action"));
		this.vm.setCurrentLanguage("de");
		assertEquals("Speichern", this.vm.get("save_action"));
	},
	"test that retrieving translations with params works": function() {
		this.vm.setCurrentLanguage("en");
		assertEquals("The code was sent to abcde.", this.vm.get("codeInputInfo_msg", {'$': 'abcde'}));
	},
	"test that all translation names have a valid suffix": function() {
		var validSuffixes = ["label", "action", "msg", "title", "alt", "placeholder", "link"];
		for (var translation in tutao.tutanota.ctrl.LanguageViewModel["en"]) {
			assertTrue("translation name \"" + translation + "\" does not have a suffix", translation.indexOf("_") != -1);
			assertTrue("translation name \"" + translation + "\" does not have a valid suffix", tutao.util.ArrayUtils.contains(validSuffixes, translation.substring(translation.indexOf("_") + 1)));
		}
	},
	"test that the languages share the same translations": function() {
		for (var language in tutao.tutanota.ctrl.LanguageViewModel) {
            if (tutao.tutanota.ctrl.LanguageViewModel.hasOwnProperty(language)) {
                for (var translation in tutao.tutanota.ctrl.LanguageViewModel[language]) {
                    for (var otherLanguage in tutao.tutanota.ctrl.LanguageViewModel) {
                        if (tutao.tutanota.ctrl.LanguageViewModel.hasOwnProperty(otherLanguage)) {
                            assertNotUndefined(translation + " undefined in " + language + ": ", tutao.tutanota.ctrl.LanguageViewModel[language][translation]);
                            assertNotUndefined(translation + " undefined in " + otherLanguage + ": ", tutao.tutanota.ctrl.LanguageViewModel[otherLanguage][translation]);
                        }
                    }
                }
            }
		}
	},
	"test that translations all begin with either lowercase or uppercase letter": function() {
		for (var language in tutao.tutanota.ctrl.LanguageViewModel) {
            if (tutao.tutanota.ctrl.LanguageViewModel.hasOwnProperty(language)) {
                for (var translation in tutao.tutanota.ctrl.LanguageViewModel[language]) {
                    for (var otherLanguage in tutao.tutanota.ctrl.LanguageViewModel) {
                        if (tutao.tutanota.ctrl.LanguageViewModel.hasOwnProperty(otherLanguage)) {
                            var textLang1 = tutao.tutanota.ctrl.LanguageViewModel[language][translation];
                            var textLang2 = tutao.tutanota.ctrl.LanguageViewModel[otherLanguage][translation];
                            if (typeof textLang1 == "string") {
                                assertEquals("different case beginning of text: " + textLang1 + ", " + textLang2, textLang1.charAt(0) == textLang1.charAt(0).toUpperCase(), textLang2.charAt(0) == textLang2.charAt(0).toUpperCase());
                            }
                        }
                    }
                }

            }
		}
	},
});
