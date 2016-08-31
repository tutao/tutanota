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

    it(" htmllinks", function() {
        var simpleHtmlLink = '<a href="https://tutanota.com">here</a>';
        var sanitizedLink = tutao.locator.htmlSanitizer.sanitize(simpleHtmlLink, true).text;
        assert.include(sanitizedLink, 'href="https://tutanota.com"');
        assert.include(sanitizedLink, 'target="_blank"');
        assert.include(sanitizedLink, 'rel="noopener noreferrer"');
        assert.include(sanitizedLink, '>here</a>');

        var htmlLink = '<a href="https://www.coursera.org/maestro/auth/normal/change_email.php?payload=9722E7n3bcN/iM08q79eG2plUafuyc6Yj631JIMAuZgGAQL0UdTqbP7w2bH8b7fmpsljKMVVVpF81l0zD1HMVQ==|Iv5+NfeRQh0Gk7/Idr0jsIZfC69Mnixw0FNbTRNmuUTgIqLefDMOhKBqY8prtvyBB7jV8kZy9XtGDue7uuUMwNYv1ucDvn/RYt76LAVXIQrY9BhW1Y381ZyMbuhB14LERDe05DUJgQI6XkM9gxM3APT7RZs48ERUIb/MstkJtxw=">here</a>';
        sanitizedLink=tutao.locator.htmlSanitizer.sanitize(htmlLink, true).text;

        assert.include(sanitizedLink, 'href="https://www.coursera.org/maestro/auth/normal/change_email.php?payload=9722E7n3bcN/iM08q79eG2plUafuyc6Yj631JIMAuZgGAQL0UdTqbP7w2bH8b7fmpsljKMVVVpF81l0zD1HMVQ==|Iv5+NfeRQh0Gk7/Idr0jsIZfC69Mnixw0FNbTRNmuUTgIqLefDMOhKBqY8prtvyBB7jV8kZy9XtGDue7uuUMwNYv1ucDvn/RYt76LAVXIQrY9BhW1Y381ZyMbuhB14LERDe05DUJgQI6XkM9gxM3APT7RZs48ERUIb/MstkJtxw="');
        assert.include(sanitizedLink, 'target="_blank"');
        assert.include(sanitizedLink, 'rel="noopener noreferrer"');
        assert.include(sanitizedLink, '>here</a>');
    });

    it(" sanitizing empty body", function() {
        var sanitized = tutao.locator.htmlSanitizer.sanitize("", true).text;
        assert.equal("", sanitized);

        sanitized = tutao.locator.htmlSanitizer.sanitize(" ", true).text;
        assert.equal(" ", sanitized);

		var sanitized = tutao.locator.htmlSanitizer.sanitize("yo", true).text;
        assert.equal("yo", sanitized);

        sanitized = tutao.locator.htmlSanitizer.sanitize("<br>", true).text;
        assert.equal("<br>", sanitized);

        sanitized = tutao.locator.htmlSanitizer.sanitize("<div></div>", true).text;
        assert.equal("<div></div>", sanitized);

        sanitized = tutao.locator.htmlSanitizer.sanitize("<html></html>", true).text;
        assert.equal("", sanitized);

        sanitized = tutao.locator.htmlSanitizer.sanitize("<html><body></body></html>", true).text;
        assert.equal("", sanitized);

        sanitized = tutao.locator.htmlSanitizer.sanitize("<html><body>yo</body></html>", true).text;
        assert.equal("yo", sanitized);
    });

    it(" detect background images", function () {
        var result = tutao.locator.htmlSanitizer.sanitize('<p style="background-image: url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)"></p>', true);
        assert.equal("https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image", result.externalImages[0]);
        assert.include(result.text, tutao.entity.tutanota.TutanotaConstants.PREVENT_EXTERNAL_IMAGE_LOADING_ICON );

        result = tutao.locator.htmlSanitizer.sanitize('<p style="background: url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)"></p>', true);
        assert.equal("https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image", result.externalImages[0]);
        assert.include(result.text, tutao.entity.tutanota.TutanotaConstants.PREVENT_EXTERNAL_IMAGE_LOADING_ICON );
    });

    it(" detect images", function () {
        var result =  tutao.locator.htmlSanitizer.sanitize('<img src="https://emailprivacytester.com/cb/510828b5a8f43ab5">', true);
        assert.equal("https://emailprivacytester.com/cb/510828b5a8f43ab5", result.externalImages[0]);
        assert.equal('<img src="' +  tutao.entity.tutanota.TutanotaConstants.PREVENT_EXTERNAL_IMAGE_LOADING_ICON + '">', result.text);
    });

    it(" detect input images", function () {
        var result =  tutao.locator.htmlSanitizer.sanitize('<input src="https://emailprivacytester.com/cb/04e69deda1be1c37/image_submit" type="image">', true);
        assert.equal("https://emailprivacytester.com/cb/04e69deda1be1c37/image_submit", result.externalImages[0]);
        assert.equal('<input src="' +  tutao.entity.tutanota.TutanotaConstants.PREVENT_EXTERNAL_IMAGE_LOADING_ICON +  '" type="image">', result.text);
    });

    it(" detect video posters", function () {
        var result =  tutao.locator.htmlSanitizer.sanitize('<video poster="https://emailprivacytester.com/cb/04e69deda1be1c37/video_poster" height="1" width="1"></video>', true);
        assert.equal("https://emailprivacytester.com/cb/04e69deda1be1c37/video_poster", result.externalImages[0]);
        assert.equal('<video poster="' +  tutao.entity.tutanota.TutanotaConstants.PREVENT_EXTERNAL_IMAGE_LOADING_ICON + '" height="1" width="1"></video>', result.text);
    });

    it("detect list style images", function () {
        var result =  tutao.locator.htmlSanitizer.sanitize('<ul style="list-style-image: url(http://www.heise.de/icons/ho/heise_online_logo_top.gif);"><li>Zeile 1</li></ul>', true);
        assert.equal("http://www.heise.de/icons/ho/heise_online_logo_top.gif", result.externalImages[0]);
        assert.equal('<ul style="list-style-image: url(&quot;replacement_1&quot;)"><li>Zeile 1</li></ul>', result.text);
    });

    it(" replace images and links", function () {
        var result =  tutao.locator.htmlSanitizer.sanitize('<html><img src="https://localhost/1.png"><img src="https://localhost/2.png"><img src="https://localhost/3.png"><img src="https://localhost/4.png"><img src="https://localhost/5.png"><img src="https://localhost/6.png"><img src="https://localhost/7.png"><img src="https://localhost/8.png"><img src="https://localhost/9"><a href="http://localhost/index.html"></a> </html>', true);
        assert.equal(9, result.externalImages.length);
        var domHtml = $('<div>').append(result.text);
        // do not replace links
        assert.equal(domHtml.find("a").attr("href"), "http://localhost/index.html");
    });


});