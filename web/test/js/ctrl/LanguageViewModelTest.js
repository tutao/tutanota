"use strict";

describe("LanguageViewModelTest", function () {

    var assert = chai.assert;


    beforeEach(function () {
        this.vm = new tutao.tutanota.ctrl.LanguageViewModel();
    });

    afterEach(function () {
    });

    it(" test that switching the language and retrieving translations without params works", function () {
        this.vm.setCurrentLanguage("en");
        assert.equal("Save", this.vm.get("save_action"));
        this.vm.setCurrentLanguage("de");
        assert.equal("Speichern", this.vm.get("save_action"));
    });

    it(" that retrieving translations with params works", function () {
        this.vm.setCurrentLanguage("en");
        assert.equal("Your Tutanota password: \"abcde\" or just click: fghi", this.vm.get("externalMailPassword_msg", {'{1}': 'abcde', '{2}': 'fghi'}));
    });

    it(" that all translation names have a valid suffix", function () {
        var validSuffixes = ["label", "action", "msg", "title", "alt", "placeholder", "link"];
        for (var translation in tutao.tutanota.ctrl.LanguageViewModel["en"]) {
            assert.isTrue(translation.indexOf("_") != -1, "translation name \"" + translation + "\" does not have a suffix");
            assert.isTrue(tutao.util.ArrayUtils.contains(validSuffixes, translation.substring(translation.indexOf("_") + 1)), "translation name \"" + translation + "\" does not have a valid suffix");
        }
    });

    it(" that the languages share the same translations", function () {
        for (var language in tutao.tutanota.ctrl.LanguageViewModel) {
            if (tutao.tutanota.ctrl.LanguageViewModel.hasOwnProperty(language)) {
                for (var translation in tutao.tutanota.ctrl.LanguageViewModel[language]) {
                    for (var otherLanguage in tutao.tutanota.ctrl.LanguageViewModel) {
                        if (tutao.tutanota.ctrl.LanguageViewModel.hasOwnProperty(otherLanguage)) {
                            assert.isDefined(translation + " undefined in " + language + ": ", tutao.tutanota.ctrl.LanguageViewModel[language][translation]);
                            assert.isDefined(translation + " undefined in " + otherLanguage + ": ", tutao.tutanota.ctrl.LanguageViewModel[otherLanguage][translation]);
                        }
                    }
                }
            }
        }
    });

    it(" that translations all begin with either lowercase or uppercase letter", function () {
        for (var language in tutao.tutanota.ctrl.LanguageViewModel) {
            if (tutao.tutanota.ctrl.LanguageViewModel.hasOwnProperty(language)) {
                for (var translation in tutao.tutanota.ctrl.LanguageViewModel[language]) {
                    for (var otherLanguage in tutao.tutanota.ctrl.LanguageViewModel) {
                        if (tutao.tutanota.ctrl.LanguageViewModel.hasOwnProperty(otherLanguage)) {

                            if (translation=="externalNotificationMailBody2_msg"){ // skipp check
                                continue;
                            }

                            var textLang1 = tutao.tutanota.ctrl.LanguageViewModel[language][translation];
                            var textLang2 = tutao.tutanota.ctrl.LanguageViewModel[otherLanguage][translation];
                            if (typeof textLang1 == "string") {
                                assert.equal(textLang1.charAt(0) == textLang1.charAt(0).toUpperCase(), textLang2.charAt(0) == textLang2.charAt(0).toUpperCase(), "different case beginning of text: " + textLang1 + ", " + textLang2);
                            }
                        }
                    }
                }

            }
        }
    });


});