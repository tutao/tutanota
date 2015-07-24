"use strict";

describe("FormatterTest", function () {

    var assert = chai.assert;

    it(" formatFullDateTime", function () {
        tutao.locator.languageViewModel.setCurrentLanguage("de");
        assert.equal("7. Dez 2011 04:03", tutao.tutanota.util.Formatter.formatFullDateTime(new Date(2011, 11, 7, 4, 3, 2)));
        tutao.locator.languageViewModel.setCurrentLanguage("en");
        assert.equal("7. Dec 2011 04:03", tutao.tutanota.util.Formatter.formatFullDateTime(new Date(2011, 11, 7, 4, 3, 2)));
        assert.isTrue(tutao.tutanota.util.Formatter.formatFullDateTime(new Date()).length >= 17); // including year
    });

    it(" formatSmtpDateTime", function () {
        assert.equal("Tue, 12 Dec 2011 04:03:02 +0000", tutao.tutanota.util.Formatter.formatSmtpDateTime(new Date(Date.UTC(2011, 11, 12, 4, 3, 2))));
    });

    it(" formatDateTime", function () {
        tutao.locator.languageViewModel.setCurrentLanguage("de");
        assert.equal("Mi 7. Dez 2011 04:03", tutao.tutanota.util.Formatter.formatDateTime(new Date(2011, 11, 7, 4, 3, 2)));
        tutao.locator.languageViewModel.setCurrentLanguage("en");
        assert.equal("We 7. Dec 2011 04:03", tutao.tutanota.util.Formatter.formatDateTime(new Date(2011, 11, 7, 4, 3, 2)));
        assert.isTrue(tutao.tutanota.util.Formatter.formatDateTime(new Date()).length <= 16); // no year
    });

    it(" formatDateTimeFromYesterdayOn", function () {
        // the day before yesterday
        var today = new Date();
        today.setHours(5);
        today.setMinutes(30);

        var day = 1000 * 60 * 60 * 24;
        var yesterday = new Date(today.getTime() - day);
        var theDayBeforeYesterday = new Date(today.getTime() - day * 2);

        tutao.locator.languageViewModel.setCurrentLanguage("de");
        assert.equal(tutao.tutanota.util.Formatter.formatDateTime(theDayBeforeYesterday), tutao.tutanota.util.Formatter.formatDateTimeFromYesterdayOn(theDayBeforeYesterday));
        tutao.locator.languageViewModel.setCurrentLanguage("en");
        assert.equal(tutao.tutanota.util.Formatter.formatDateTime(theDayBeforeYesterday), tutao.tutanota.util.Formatter.formatDateTimeFromYesterdayOn(theDayBeforeYesterday));

        // yesterday
        tutao.locator.languageViewModel.setCurrentLanguage("de");
        assert.equal("gestern 05:30", tutao.tutanota.util.Formatter.formatDateTimeFromYesterdayOn(yesterday));
        tutao.locator.languageViewModel.setCurrentLanguage("en");
        assert.equal("yesterday 05:30", tutao.tutanota.util.Formatter.formatDateTimeFromYesterdayOn(yesterday));

        // today
        tutao.locator.languageViewModel.setCurrentLanguage("de");
        assert.equal("05:30", tutao.tutanota.util.Formatter.formatDateTimeFromYesterdayOn(today));
        tutao.locator.languageViewModel.setCurrentLanguage("en");
        assert.equal("05:30", tutao.tutanota.util.Formatter.formatDateTimeFromYesterdayOn(today));
    });

    it(" dateToDashString", function () {
        assert.equal("1973-02-12", tutao.tutanota.util.Formatter.dateToDashString(new Date(1973, 1, 12, 0, 0, 0)));
        assert.equal("1968-02-12", tutao.tutanota.util.Formatter.dateToDashString(new Date(1968, 1, 12, 0, 0, 0)));
    });

    it(" isMailAddress", function () {
        // test valid adresses
        assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("a@b.de"));
        assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("a@hello.c"));
        assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("a.b@hello.de"));
        // test uppercase
        assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("A@b.hello.de"));
        // test missing parts
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("@b.hello.de"));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("batello.de"));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("ba@tello"));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("@hello.de"));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("a@@hello.de"));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("a@h@hello.de"));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("aa@.de"));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("aa@"));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("aa@."));
        // test empty adresses
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress(""));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress(" "));
        // test space at any place
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress(" ab@cd.de"));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("a b@cb.de"));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("ab @cb.de"));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@ cd.de"));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@c b.de"));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@cd .de"));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@cd. de"));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@cd.d e"));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@cd.de "));
    });

    it(" isValidTutanotaLocalPart", function () {
        // test valid adresses
        assert.isTrue(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("abcd"));
        assert.isTrue(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("a.cd"));
        assert.isTrue(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("a_cd"));
        assert.isTrue(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("a-cd"));
        assert.isTrue(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("-_.a"));
        // test invalid characters
        assert.isFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("ab,c"));
        assert.isFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("ab@c"));
        assert.isFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("ab?c"));
        assert.isFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("ab c"));
        assert.isFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("a..c"));
        assert.isFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("a...c"));
        assert.isFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart(".abc"));
        assert.isFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("abc."));
        // test that only non-empty strings are required
        assert.isTrue(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("abc"));
        // test empty adresses
        assert.isFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart(""));
        assert.isFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart(" "));
    });

    it(" stringToNameAndMailAddress", function () {
        // test valid strings
        assert.deepEqual({name: "", mailAddress: "a@b.de"}, tutao.tutanota.util.Formatter.stringToNameAndMailAddress(" a@b.de "));
        assert.deepEqual({name: "", mailAddress: "a@b.de"}, tutao.tutanota.util.Formatter.stringToNameAndMailAddress(" <a@b.de > "));
        assert.deepEqual({name: "Aas Bos", mailAddress: "a@b.de"}, tutao.tutanota.util.Formatter.stringToNameAndMailAddress(" Aas Bos a@b.de"));
        assert.deepEqual({name: "Aas Bos", mailAddress: "a@b.de"}, tutao.tutanota.util.Formatter.stringToNameAndMailAddress(" Aas Bos  <a@b.de>"));
        assert.deepEqual({name: "Aas Bos", mailAddress: "a@b.de"}, tutao.tutanota.util.Formatter.stringToNameAndMailAddress(" Aas Bos<a@b.de>"));
        // test invalid strings
        assert.equal(null, tutao.tutanota.util.Formatter.stringToNameAndMailAddress(" Aas Bos  <a@de>"));
        assert.equal(null, tutao.tutanota.util.Formatter.stringToNameAndMailAddress(" Aas Bos "));
        assert.equal(null, tutao.tutanota.util.Formatter.stringToNameAndMailAddress(" Aas Bos  a@de"));
    });

    it(" formatFileSize", function () {
        assert.equal("0 B", tutao.tutanota.util.Formatter.formatFileSize(0));
        assert.equal("1 B", tutao.tutanota.util.Formatter.formatFileSize(1));
        assert.equal("999 B", tutao.tutanota.util.Formatter.formatFileSize(999));
        assert.equal("0.9 KB", tutao.tutanota.util.Formatter.formatFileSize(1000));
        assert.equal("1 KB", tutao.tutanota.util.Formatter.formatFileSize(1024));
        assert.equal("999 KB", tutao.tutanota.util.Formatter.formatFileSize(1024 * 999));
        assert.equal("0.9 MB", tutao.tutanota.util.Formatter.formatFileSize(1024 * 1024 - 1));
        assert.equal("1 MB", tutao.tutanota.util.Formatter.formatFileSize(1024 * 1024));
        assert.equal("1 GB", tutao.tutanota.util.Formatter.formatFileSize(1024 * 1024 * 1024));
        assert.equal("1 TB", tutao.tutanota.util.Formatter.formatFileSize(1024 * 1024 * 1024 * 1024));
    });

    it(" getCleanedPhoneNumber", function () {
        assert.equal("+4951153335321", tutao.tutanota.util.Formatter.getCleanedPhoneNumber("+4951153335321"));
        assert.equal("+4951153335321", tutao.tutanota.util.Formatter.getCleanedPhoneNumber(" +4951153335321 "));
        assert.equal("+4951153335321", tutao.tutanota.util.Formatter.getCleanedPhoneNumber("+49 511 5333 532-1"));
        assert.equal("+4951153335321", tutao.tutanota.util.Formatter.getCleanedPhoneNumber("+49 511/53335321"));
        assert.equal("+4951153335321", tutao.tutanota.util.Formatter.getCleanedPhoneNumber("+49511/533353/21"));
        assert.equal("+4951153335321", tutao.tutanota.util.Formatter.getCleanedPhoneNumber("+49511-533353-21"));
        assert.equal("+4951153335321", tutao.tutanota.util.Formatter.getCleanedPhoneNumber("(+49511)53335321"));
        assert.equal("+12053190944", tutao.tutanota.util.Formatter.getCleanedPhoneNumber("+1 205-319-0944"));
        assert.equal(null, tutao.tutanota.util.Formatter.getCleanedPhoneNumber("0049 51153335321"));
        assert.equal(null, tutao.tutanota.util.Formatter.getCleanedPhoneNumber("4951153335321"));
        assert.equal(null, tutao.tutanota.util.Formatter.getCleanedPhoneNumber("0004951153335321"));
        assert.equal(null, tutao.tutanota.util.Formatter.getCleanedPhoneNumber("++4951153335321"));
        assert.equal(null, tutao.tutanota.util.Formatter.getCleanedPhoneNumber("+495115_3335321"));
        assert.equal(null, tutao.tutanota.util.Formatter.getCleanedPhoneNumber("+495115+3335321"));
        assert.equal(null, tutao.tutanota.util.Formatter.getCleanedPhoneNumber("+495115a3335321"));
        assert.equal(null, tutao.tutanota.util.Formatter.getCleanedPhoneNumber("+495115/333/5321a"));
    });

    it(" isGermanMobilePhoneNumber", function () {
        assert.isTrue(tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber("+4915753335321"));
        assert.isTrue(tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber("+4915113335321"));
        assert.isTrue(tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber("+4917953335321"));
        assert.isFalse(tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber("+4919153335321"));
        assert.isFalse(tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber("+4815753335321"));
        assert.isFalse(tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber(null));
        assert.isFalse(tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber("+49179533")); // too short
        assert.isFalse(tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber("+49179533353214444")); // too long
    });

    it(" localCompare", function() {
        var data = ["ddddddd","kll, kll", "gt, gt", "peter", "bgt, ", "huu, ", "vert, vert", "ho", "ggg, ", "tt, tt", "abbbbb, abbbbb"];
        var sorted = data.sort(function(a, b){
            return a.localeCompare(b);
        });
        assert.equal("abbbbb, abbbbb", sorted[0]);
        assert.equal("bgt, ", sorted[1]);
        assert.equal("ddddddd", sorted[2]);
        assert.equal("ggg, ", sorted[3]);
        assert.equal("gt, gt", sorted[4]);
        assert.equal("ho", sorted[5]);
        assert.equal("huu, ", sorted[6]);
        assert.equal("kll, kll", sorted[7]);
        assert.equal("peter", sorted[8]);
        assert.equal("tt, tt", sorted[9]);
        assert.equal("vert, vert", sorted[10]);
    });

    it(" validHtmlLinks", function() {
        // html links
        assert.equal('<a href=\"http://hello.it\" target=\"_blank\">http://hello.it</a>', tutao.tutanota.util.Formatter.urlify("http://hello.it"));
        assert.equal('<a href=\"https://hello.it\" target=\"_blank\">https://hello.it</a>', tutao.tutanota.util.Formatter.urlify("https://hello.it"));
        assert.equal('<a href=\"http://www.tutanota.de\" target=\"_blank\">http://www.tutanota.de</a>', tutao.tutanota.util.Formatter.urlify("http://www.tutanota.de"));
        assert.equal('<a href=\"https://www.tutanota.de\" target=\"_blank\">https://www.tutanota.de</a>', tutao.tutanota.util.Formatter.urlify("https://www.tutanota.de"));
           // email adresses
        assert.equal('<a href=\"mailto:bed-free@tutanota.de\" target=\"_blank\">bed-free@tutanota.de</a>', tutao.tutanota.util.Formatter.urlify("bed-free@tutanota.de"));

        assert.equal('<a href=\"http://www.tutanota.de\" target=\"_blank\">http://www.tutanota.de</a>', tutao.tutanota.util.Formatter.urlify("www.tutanota.de"));
    });

    it(" invalidHtmlLinks", function() {
        // no html links
        assert.equal("hello.it is nice to meet you.", tutao.tutanota.util.Formatter.urlify("hello.it is nice to meet you."));

        assert.equal("tutanota.de", tutao.tutanota.util.Formatter.urlify("tutanota.de"));
        assert.equal("34.34.de", tutao.tutanota.util.Formatter.urlify("34.34.de"));

        // twitter
        assert.equal("@de_tutanota", tutao.tutanota.util.Formatter.urlify("@de_tutanota"));
        assert.equal("#de_tutanota", tutao.tutanota.util.Formatter.urlify("#de_tutanota"));

        // no phone numbers
        assert.equal("0511202801-0", tutao.tutanota.util.Formatter.urlify("0511202801-0"));
        assert.equal("+49511202801", tutao.tutanota.util.Formatter.urlify("+49511202801"));
        assert.equal("(555)555-5555", tutao.tutanota.util.Formatter.urlify("(555)555-5555"));
    });


});