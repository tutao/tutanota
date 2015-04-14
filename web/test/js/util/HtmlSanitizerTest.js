"use strict";

describe("HtmlSanitizerTest", function () {

    var assert = chai.assert;

    it(" OWASP XSS attacks", function () {
        var sanitizer = tutao.locator.htmlSanitizer;
        // see https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
        //TODO extend (sync with HtmlSanitizerTest.java)
        var tests = [
            { html: "<div>';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//\";\nalert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//--\n></SCRIPT>\">'><SCRIPT>alert(String.fromCharCode(88,83,83))</SCRIPT></div>", expected: "<div>';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//\";\nalert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//--\n&gt;\"&gt;'&gt;</div>" },
            { html: "<div>'';!--\"<XSS>=&{()}</div>", expected: "<div>'';!--\"=&amp;{()}</div>" },
            { html: "<SCRIPT SRC=http://ha.ckers.org/xss.js></SCRIPT>", expected: "" },
            { html: "<IMG SRC=\"javascript:alert('XSS');\">", expected: '<img>' },
            { html: "<IMG SRC=javascript:alert('XSS')>", expected: '<img>' }
        ];
        for (var i = 0; i < tests.length; i++) {
            assert.equal(tests[i].expected, sanitizer.sanitize(tests[i].html).text);
        }
    });

    it(" blockquotes", function () {
        assert.equal('<blockquote class=\"tutanota_quote\">test</blockquote>', tutao.locator.htmlSanitizer.sanitize("<blockquote class=\"tutanota_quote\">test</blockquote>").text);
    });

    it(" leading text node", function () {
        assert.equal('hello<blockquote>test</blockquote>', tutao.locator.htmlSanitizer.sanitize("hello<blockquote>test</blockquote>").text);
    });

    it("detect background images", function () {
        assert.equal("url(https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image)", tutao.locator.htmlSanitizer.sanitize('<p style="background-image: url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)"></p>', true).externalImages[0]);
        assert.equal("url(https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image)", tutao.locator.htmlSanitizer.sanitize('<p style="background: url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)"></p>', true).externalImages[0]);
        assert.equal("https://emailprivacytester.com/cb/510828b5a8f43ab5/img", tutao.locator.htmlSanitizer.sanitize('<img src="https://emailprivacytester.com/cb/510828b5a8f43ab5/img"></img>', true).externalImages[0]);
    });

});