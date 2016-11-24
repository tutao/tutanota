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


    it(" formatDate", function () {
        tutao.locator.languageViewModel.setCurrentLanguage("de");
        assert.equal("6. Apr 2015", tutao.tutanota.util.Formatter.formatDate(new Date(2015, 3, 6, 0, 0, 0)));
        assert.equal("6. Apr 1963", tutao.tutanota.util.Formatter.formatDate(new Date(1963, 3, 6, 0, 0, 0)));
        tutao.locator.languageViewModel.setCurrentLanguage("en");
        assert.equal("6. Apr 2015", tutao.tutanota.util.Formatter.formatDate(new Date(2015, 3, 6, 0, 0, 0)));
        assert.equal("6. Apr 1963", tutao.tutanota.util.Formatter.formatDate(new Date(1963, 3, 6, 0, 0, 0)));
    });

    it(" formatDateWithWeekday", function () {
        tutao.locator.languageViewModel.setCurrentLanguage("de");
        assert.equal("Mo 6. Apr 2015", tutao.tutanota.util.Formatter.formatDateWithWeekday(new Date(2015, 3, 6, 0, 0, 0)));
        assert.equal("Sa 6. Apr 1963", tutao.tutanota.util.Formatter.formatDateWithWeekday(new Date(1963, 3, 6, 0, 0, 0)));
        tutao.locator.languageViewModel.setCurrentLanguage("en");
        assert.equal("Mo 6. Apr 2015", tutao.tutanota.util.Formatter.formatDateWithWeekday(new Date(2015, 3, 6, 0, 0, 0)));
        assert.equal("Sa 6. Apr 1963", tutao.tutanota.util.Formatter.formatDateWithWeekday(new Date(1963, 3, 6, 0, 0, 0)));
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

    it(" isStrictMailAddress", function () {
        // test valid adresses
        assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("a@b.de", true));
        assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("a@hello.c", true));
        assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("a.b@hello.de", true));
        // test uppercase
        assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("A@b.hello.de", true));
        // test missing parts
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("@b.hello.de", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("batello.de", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("ba@tello", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("@hello.de", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("a@@hello.de", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("a@h@hello.de", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("aa@.de", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("aa@", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("aa@.", true));
        // test empty adresses
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress(" ", true));
        // test space at any place
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress(" ab@cd.de", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("a b@cb.de", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("ab @cb.de", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@ cd.de", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@c b.de", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@cd .de", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@cd. de", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@cd.d e", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@cd.de ", true));

        // long local part
        assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress(new Array(64 + 1).join("a") + "@tutanota.de", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress(new Array(65 + 1).join("a") + "@tutanota.de", true));
        // long mail address
        assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("aaaaaaaaaa@" + new Array(240 + 1).join("a") + ".de", true));
        assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("aaaaaaaaaa@" + new Array(241 + 1).join("a") + ".de", true));

		assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("abcefghijklmnopqrstuvwxyzabcefghijklmnopqrstuvwxyzabcefghijklmno@cd.de", true));
		assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("abcefghijklmnopqrstuvwxyzabcefghijklmnopqrstuvwxyzabcefghijklmnop@cd.de", true));
    });

    it(" isMailAddress", function () {
		assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("abcefghijklmnopqrstuvwxyzabcefghijklmnopqrstuvwxyzabcefghijklmnopqrstuvwxyz@cd.de", false));
		assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("a@d.de", false));
		assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("*@d.de", false));
		assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("asfldawef+@d.de", false));
		assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("asfldawef=@d.de", false));
		assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("+@d.de", false));
		assert.isTrue(tutao.tutanota.util.Formatter.isMailAddress("=@d.de", false));

		assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("@d.de", false));
		assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress(" @d.de", false));
		assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("\t@d.de", false));
		assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("asdf asdf@d.de", false));
		assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("@@d.de", false));
		assert.isFalse(tutao.tutanota.util.Formatter.isMailAddress("a@b@d.de", false));
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
        assert.equal('<a href=\"http://hello.it\" target=\"_blank\" rel=\"noopener noreferrer\">http://hello.it</a>', tutao.tutanota.util.Formatter.urlify("http://hello.it"));
        assert.equal('<a href=\"https://hello.it\" target=\"_blank\" rel=\"noopener noreferrer\">https://hello.it</a>', tutao.tutanota.util.Formatter.urlify("https://hello.it"));
        assert.equal('<a href=\"http://www.tutanota.de\" target=\"_blank\" rel=\"noopener noreferrer\">http://www.tutanota.de</a>', tutao.tutanota.util.Formatter.urlify("http://www.tutanota.de"));
        assert.equal('<a href=\"https://www.tutanota.de\" target=\"_blank\" rel=\"noopener noreferrer\">https://www.tutanota.de</a>', tutao.tutanota.util.Formatter.urlify("https://www.tutanota.de"));
           // email adresses
        assert.equal('<a href=\"mailto:bed-free@tutanota.de\" target=\"_blank\" rel=\"noopener noreferrer\">bed-free@tutanota.de</a>', tutao.tutanota.util.Formatter.urlify("bed-free@tutanota.de"));

        assert.equal('<a href=\"http://www.tutanota.de\" target=\"_blank\" rel=\"noopener noreferrer\">www.tutanota.de</a>', tutao.tutanota.util.Formatter.urlify("www.tutanota.de"));
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

    it(" url encode html tags", function() {
        // no html links
        assert.equal("Hello",  tutao.tutanota.util.Formatter.urlEncodeHtmlTags("Hello"));
        assert.equal("&lt;div&gt;ab &amp;&quot;cd&#039;&lt;/div&gt;",  tutao.tutanota.util.Formatter.urlEncodeHtmlTags("<div>ab &\"cd'</div>"));
    });

    it(" fullNameToNameAndMailAddress", function() {
        assert.deepEqual({ firstName: "Peter", lastName: "Pan" }, tutao.tutanota.util.Formatter.fullNameToFirstAndLastName("Peter Pan"));
        assert.deepEqual({ firstName: "peter", lastName: "pan" }, tutao.tutanota.util.Formatter.fullNameToFirstAndLastName("peter pan"));
        assert.deepEqual({ firstName: "Peter", lastName: "Pater Pan" }, tutao.tutanota.util.Formatter.fullNameToFirstAndLastName("Peter Pater Pan"));
        assert.deepEqual({ firstName: "Peter", lastName: "" }, tutao.tutanota.util.Formatter.fullNameToFirstAndLastName(" Peter "));
    });

    it(" mailAddressToFirstAndLastName", function() {
        assert.deepEqual({ firstName: "Peter", lastName: "Pan" }, tutao.tutanota.util.Formatter.mailAddressToFirstAndLastName("Peter.Pan@x.de"));
        assert.deepEqual({ firstName: "Peter", lastName: "Pan" }, tutao.tutanota.util.Formatter.mailAddressToFirstAndLastName("peter.pan@x.de"));
        assert.deepEqual({ firstName: "Peter", lastName: "Pan" }, tutao.tutanota.util.Formatter.mailAddressToFirstAndLastName("peter_pan@x.de"));
        assert.deepEqual({ firstName: "Peter", lastName: "Pan" }, tutao.tutanota.util.Formatter.mailAddressToFirstAndLastName("peter-pan@x.de"));
        assert.deepEqual({ firstName: "Peter", lastName: "Pan" }, tutao.tutanota.util.Formatter.mailAddressToFirstAndLastName("peter_pan@x.de"));
        assert.deepEqual({ firstName: "Peter", lastName: "Pater Pan" }, tutao.tutanota.util.Formatter.mailAddressToFirstAndLastName("peter.pater.pan@x.de"));
        assert.deepEqual({ firstName: "Peter", lastName: "" }, tutao.tutanota.util.Formatter.mailAddressToFirstAndLastName("peter@x.de"));
    });

    it(" getDomainWithoutSubdomains", function() {
        assert.equal("tutanota.de",  tutao.tutanota.util.Formatter.getDomainWithoutSubdomains("test@tutanota.de"));
        assert.equal("tutanota.de",  tutao.tutanota.util.Formatter.getDomainWithoutSubdomains("test@test.tutanota.de"));
        assert.equal("tutanota.de",  tutao.tutanota.util.Formatter.getDomainWithoutSubdomains("test.test@test.tutanota.de"));
        assert.equal("tutanota.de",  tutao.tutanota.util.Formatter.getDomainWithoutSubdomains("test.test@test.toast.tutanota.de"));
        assert.equal("tutanota.de",  tutao.tutanota.util.Formatter.getDomainWithoutSubdomains("test.Test@tutaNota.de"));
    });


    it(" formatBytes", function() {
        assert.equal("0 GB",  tutao.tutanota.util.Formatter.formatStorageSize(0));
        assert.equal("0 GB",  tutao.tutanota.util.Formatter.formatStorageSize(999));
        var kByte = 1000;
        assert.equal("0 GB",  tutao.tutanota.util.Formatter.formatStorageSize(kByte));

        var mByte = kByte * kByte;
        assert.equal("0 GB",  tutao.tutanota.util.Formatter.formatStorageSize(mByte));
        assert.equal("0,001 GB",  tutao.tutanota.util.Formatter.formatStorageSize(mByte + 100));
        assert.equal("0,001 GB",  tutao.tutanota.util.Formatter.formatStorageSize(mByte + kByte));
        assert.equal("0,001 GB",  tutao.tutanota.util.Formatter.formatStorageSize(mByte + 100*kByte));
        assert.equal("0,002 GB",  tutao.tutanota.util.Formatter.formatStorageSize(mByte + 1000*kByte));
        assert.equal("0,999 GB",  tutao.tutanota.util.Formatter.formatStorageSize(mByte * kByte -1));


        var gByte = mByte * kByte;
        assert.equal("1 GB",  tutao.tutanota.util.Formatter.formatStorageSize(gByte));
        assert.equal("1 GB",  tutao.tutanota.util.Formatter.formatStorageSize(gByte + 100));
        assert.equal("1,001 GB",  tutao.tutanota.util.Formatter.formatStorageSize(gByte + mByte));
        assert.equal("1,01 GB",  tutao.tutanota.util.Formatter.formatStorageSize(gByte + 10*mByte));
        assert.equal("1,1 GB",  tutao.tutanota.util.Formatter.formatStorageSize(gByte + 100*mByte));
        assert.equal("20 GB",  tutao.tutanota.util.Formatter.formatStorageSize(gByte * 20));
        assert.equal("999,999 GB",  tutao.tutanota.util.Formatter.formatStorageSize(gByte * kByte -1));


        var tByte = gByte * kByte;
        assert.equal("1000 GB",  tutao.tutanota.util.Formatter.formatStorageSize(tByte));
        assert.equal("1000 GB",  tutao.tutanota.util.Formatter.formatStorageSize(tByte + 100));
        assert.equal("1001 GB",  tutao.tutanota.util.Formatter.formatStorageSize(tByte + gByte));
        assert.equal("1010 GB",  tutao.tutanota.util.Formatter.formatStorageSize(tByte + 10*gByte));
        assert.equal("1100 GB",  tutao.tutanota.util.Formatter.formatStorageSize(tByte + 100*gByte));
        assert.equal("20000 GB",  tutao.tutanota.util.Formatter.formatStorageSize(tByte * 20));
        assert.equal("999999,999 GB",  tutao.tutanota.util.Formatter.formatStorageSize(tByte * kByte -10));

    });


    it( " formatMimeType", function() {
        assert.equal("application/pdf",tutao.tutanota.util.Formatter.getCleanedMimeType("application/pdf") );
        assert.equal("application/pdf",tutao.tutanota.util.Formatter.getCleanedMimeType("\"application/pdf'") );
    });

});