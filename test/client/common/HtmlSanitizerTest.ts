import o from "ospec"
import {htmlSanitizer, PREVENT_EXTERNAL_IMAGE_LOADING_ICON} from "../../../src/misc/HtmlSanitizer"

o.spec(
	"HtmlSanitizerTest",
	browser(function () {
		o("OWASP XSS attacks", function () {
			// see https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
			let tests = [
				{
					html:
						"<div>';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//\";\nalert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//--\n></SCRIPT>\">'><SCRIPT>alert(String.fromCharCode(88,83,83))</SCRIPT></div>",
					expected:
						"<div>';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//\";\nalert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//--\n&gt;\"&gt;'&gt;</div>",
				},
				{
					html: "<div>'';!--\"<XSS>=&{()}</div>",
					expected: "<div>'';!--\"=&amp;{()}</div>",
				},
				{
					html: "<SCRIPT SRC=http://ha.ckers.org/xss.js></SCRIPT>",
					expected: "",
				},
				{
					html: "<IMG SRC=\"javascript:alert('XSS');\">",
					expected: "<img>",
				},
				{
					html: "<IMG SRC=javascript:alert('XSS')>",
					expected: "<img>",
				},
			]
			tests.forEach(test => {
				// attacks should not be possible even if we load external content
				o(
					htmlSanitizer.sanitizeHTML(test.html, {
						blockExternalContent: false,
					}).text,
				).equals(test.expected)
			})
		})
		o("blockquotes", function () {
			//var sanitizer = DOMPurify.sanitize("");
			o(
				htmlSanitizer.sanitizeHTML('<blockquote class="tutanota_quote">test</blockquote>', {
					blockExternalContent: true,
				}).text,
			).equals('<blockquote class="tutanota_quote">test</blockquote>')
			o(
				htmlSanitizer.sanitizeHTML('<blockquote type="cite"cite="mid:AC55602DD"></blockquote>', {
					blockExternalContent: true,
				}).text,
			).equals('<blockquote type="cite"></blockquote>')
		})
		o("custom classes", function () {
			o(htmlSanitizer.sanitizeHTML('<div class="custom1 tutanota_quote custom2">test</div>').text).equals(
				'<div class="tutanota_quote">test</div>',
			)
		})
		o("leading text node", function () {
			o(htmlSanitizer.sanitizeHTML("hello<blockquote>test</blockquote>").text).equals(
				"hello<blockquote>test</blockquote>",
			)
		})
		o("html links", function () {
			let simpleHtmlLink = '<a href="https://tutanota.com">here</a>'
			let sanitizedLink = htmlSanitizer.sanitizeHTML(simpleHtmlLink).text
			o(sanitizedLink.includes('href="https://tutanota.com"')).equals(true)
			o(sanitizedLink.includes('target="_blank"')).equals(true)
			o(sanitizedLink.includes('rel="noopener noreferrer"')).equals(true)
			o(sanitizedLink.includes(">here</a>")).equals(true)
			let htmlLink =
				'<a href="https://www.coursera.org/maestro/auth/normal/change_email.php?payload=9722E7n3bcN/iM08q79eG2plUafuyc6Yj631JIMAuZgGAQL0UdTqbP7w2bH8b7fmpsljKMVVVpF81l0zD1HMVQ==|Iv5+NfeRQh0Gk7/Idr0jsIZfC69Mnixw0FNbTRNmuUTgIqLefDMOhKBqY8prtvyBB7jV8kZy9XtGDue7uuUMwNYv1ucDvn/RYt76LAVXIQrY9BhW1Y381ZyMbuhB14LERDe05DUJgQI6XkM9gxM3APT7RZs48ERUIb/MstkJtxw=">here</a>'
			sanitizedLink = htmlSanitizer.sanitizeHTML(htmlLink).text
			o(
				sanitizedLink.includes(
					'href="https://www.coursera.org/maestro/auth/normal/change_email.php?payload=9722E7n3bcN/iM08q79eG2plUafuyc6Yj631JIMAuZgGAQL0UdTqbP7w2bH8b7fmpsljKMVVVpF81l0zD1HMVQ==|Iv5+NfeRQh0Gk7/Idr0jsIZfC69Mnixw0FNbTRNmuUTgIqLefDMOhKBqY8prtvyBB7jV8kZy9XtGDue7uuUMwNYv1ucDvn/RYt76LAVXIQrY9BhW1Y381ZyMbuhB14LERDe05DUJgQI6XkM9gxM3APT7RZs48ERUIb/MstkJtxw="',
				),
			).equals(true)
			o(sanitizedLink.includes('target="_blank"')).equals(true)
			o(sanitizedLink.includes('rel="noopener noreferrer"')).equals(true)
			o(sanitizedLink.includes(">here</a>")).equals(true)
		})
		o("notification mail template link", function () {
			let simpleHtmlLink = '<a href=" {link} ">here</a>'
			let sanitizedLink = htmlSanitizer.sanitizeHTML(simpleHtmlLink, {
				blockExternalContent: true,
			}).text
			o(sanitizedLink.includes('href="{link}"')).equals(true)
			o(sanitizedLink.includes('target="_blank"')).equals(true)
			o(sanitizedLink.includes('rel="noopener noreferrer"')).equals(true)
			o(sanitizedLink.includes(">here</a>")).equals(true)
		})
		o("area element", function () {
			let element = '<area href="https://tutanota.com">here</area>'
			let sanitizedElement = htmlSanitizer.sanitizeHTML(element, {
				blockExternalContent: true,
			}).text
			o(sanitizedElement.includes('href="https://tutanota.com"')).equals(true)
			o(sanitizedElement.includes('target="_blank"')).equals(true)
			o(sanitizedElement.includes('rel="noopener noreferrer"')).equals(true)
		})
		o("sanitizing empty body", function () {
			let sanitized = htmlSanitizer.sanitizeHTML("", {
				blockExternalContent: true,
			}).text
			o(sanitized).equals("")
			sanitized = htmlSanitizer.sanitizeHTML(" ", {
				blockExternalContent: true,
			}).text
			o(sanitized).equals(" ")
			sanitized = htmlSanitizer.sanitizeHTML("yo", {
				blockExternalContent: true,
			}).text
			o(sanitized).equals("yo")
			sanitized = htmlSanitizer.sanitizeHTML("<br>", {
				blockExternalContent: true,
			}).text
			o(sanitized).equals("<br>")
			sanitized = htmlSanitizer.sanitizeHTML("<div></div>", {
				blockExternalContent: true,
			}).text
			o(sanitized).equals("<div></div>")
			sanitized = htmlSanitizer.sanitizeHTML("<html></html>", {
				blockExternalContent: true,
			}).text
			o(sanitized).equals("")
			sanitized = htmlSanitizer.sanitizeHTML("<html><body></body></html>", {
				blockExternalContent: true,
			}).text
			o(sanitized).equals("")
			sanitized = htmlSanitizer.sanitizeHTML("<html><body>yo</body></html>", {
				blockExternalContent: true,
			}).text
			o(sanitized).equals("yo")
		})
		o("detect background images", function () {
			o(PREVENT_EXTERNAL_IMAGE_LOADING_ICON).equals(
				"data:image/svg+xml;utf8,<svg version='1.1' viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'><rect width='512' height='512' fill='%23f8f8f8'/><path d='m220 212c0 12.029-9.7597 21.789-21.789 21.789-12.029 0-21.789-9.7597-21.789-21.789s9.7597-21.789 21.789-21.789c12.029 0 21.789 9.7597 21.789 21.789zm116.21 43.578v50.841h-159.79v-21.789l36.315-36.315 18.158 18.158 58.104-58.104zm10.895-79.893h-181.58c-1.9292 0-3.6315 1.7023-3.6315 3.6315v138c0 1.9292 1.7023 3.6315 3.6315 3.6315h181.58c1.9292 0 3.6315-1.7023 3.6315-3.6315v-138c0-1.9292-1.7023-3.6315-3.6315-3.6315zm18.158 3.6315v138c0 9.9867-8.1709 18.158-18.158 18.158h-181.58c-9.9867 0-18.158-8.1709-18.158-18.158v-138c0-9.9867 8.1709-18.158 18.158-18.158h181.58c9.9867 0 18.158 8.1709 18.158 18.158z' fill='%23b4b4b4' stroke-width='.11348'/></svg>",
			)
			let result = htmlSanitizer.sanitizeHTML(
				'<p style="background-image: url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)"></p>',
				{
					blockExternalContent: true,
				},
			)
			o(result.externalContent[0]).equals("https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image")
			o(result.text.includes("data:image/svg+xml;utf8,")).equals(true)
			result = htmlSanitizer.sanitizeHTML(
				'<p style="background: url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)"></p>',
				{
					blockExternalContent: true,
				},
			)
			o(result.externalContent[0]).equals("https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image")
			o(result.text.includes("data:image/svg+xml;utf8,")).equals(true)
			result = htmlSanitizer.sanitizeHTML(
				'<p style="background: url(&#39;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&#39;)"></p>',
				{
					blockExternalContent: true,
				},
			)
			o(result.externalContent[0]).equals("https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image")
			o(result.text.includes("data:image/svg+xml;utf8,")).equals(true)
			result = htmlSanitizer.sanitizeHTML(
				'<p style="background: url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)"></p>',
				{
					blockExternalContent: false,
				},
			)
			o(result.externalContent.length).equals(0)
			o(result.text.includes("data:image/svg+xml;utf8,")).equals(false)
		})
		o("detect background inline images", function () {
			const backgroundUrl = "data:image/svg+xml;utf8,inline"
			let result = htmlSanitizer.sanitizeHTML(`<p style="background-image: url(${backgroundUrl})"> </p>`, {
				blockExternalContent: true,
			})
			o(result.externalContent.length).equals(0)
			o(result.text.includes(backgroundUrl)).equals(true)
			result = htmlSanitizer.sanitizeHTML(`<p style="background-image: url('${backgroundUrl}')"> </p>`, {
				blockExternalContent: true,
			})
			o(result.externalContent.length).equals(0)
			o(result.text.includes(backgroundUrl)).equals(true)
			result = htmlSanitizer.sanitizeHTML(`<p style='background-image: url("${backgroundUrl}")'> </p>`, {
				blockExternalContent: true,
			})
			o(result.externalContent.length).equals(0)
			o(result.text.includes(backgroundUrl)).equals(true)
			result = htmlSanitizer.sanitizeHTML(`<p style="background-image: url(&quot;${backgroundUrl}&quot;)"> </p>`, {
				blockExternalContent: true,
			})
			o(result.externalContent.length).equals(0)
			o(result.text.includes(backgroundUrl)).equals(true)
			result = htmlSanitizer.sanitizeHTML(`<p style="background-image: url(&#39;${backgroundUrl}&#39;)"> </p>`, {
				blockExternalContent: true,
			})
			o(result.externalContent.length).equals(0)
			o(result.text.includes(backgroundUrl)).equals(true)
		})
		o("background attribute", function () {
			const plainHtml = '<table><tr><td background="https://tutanota.com/image.jpg"> ....</td></tr></table>'
			const cleanHtml = htmlSanitizer.sanitizeHTML(plainHtml, {
				blockExternalContent: true,
			})
			o(cleanHtml.externalContent.length).equals(1)
			o(cleanHtml.text.includes("image.jpg")).equals(false)
			o(
				htmlSanitizer
					.sanitizeHTML(plainHtml, {
						blockExternalContent: false,
					})
					.text.includes("background="),
			).equals(true)
		})
		o("srcset attribute", function () {
			const plainHtml =
				'<img srcset="https://tutanota.com/image1.jpg 1x, https://tutanota.com/image2.jpg 2x, https://tutanota.com/image3.jpg 3x" src="https://tutanota.com/image.jpg">'
			const cleanHtml = htmlSanitizer.sanitizeHTML(plainHtml, {
				blockExternalContent: true,
			})
			o(cleanHtml.externalContent.length).equals(2)
			o(cleanHtml.text.includes("srcSet")).equals(false)
			o(cleanHtml.text.includes("srcset")).equals(false) // srcSet attribute is removed when writing node

			o(cleanHtml.text.includes('src="data:image/svg+xml;utf8,')).equals(true)
		})
		o("detect images", function () {
			let result = htmlSanitizer.sanitizeHTML('<img src="https://emailprivacytester.com/cb/510828b5a8f43ab5">', {
				blockExternalContent: true,
			})
			o(result.externalContent[0]).equals("https://emailprivacytester.com/cb/510828b5a8f43ab5")
			o(result.text.includes('src="data:image/svg+xml;utf8,')).equals(true)
			o(result.text.includes('style="max-width: 100px;')).equals(true)
		})
		o("detect figure", function () {
			let inputElement = '<figure src="https://tutanota.com/images/favicon/favicon.ico" type="image">'
			let result = htmlSanitizer.sanitizeHTML(inputElement, {
				blockExternalContent: true,
			})
			o(result.externalContent[0]).equals("https://tutanota.com/images/favicon/favicon.ico")
			o(result.text.includes('src="https://tutanota.com')).equals(false)
		})
		o("detect video posters", function () {
			let result = htmlSanitizer.sanitizeHTML(
				'<video poster="https://emailprivacytester.com/cb/04e69deda1be1c37/video_poster" height="1" width="1"></video>',
				{
					blockExternalContent: true,
				},
			)
			o(result.externalContent[0]).equals("https://emailprivacytester.com/cb/04e69deda1be1c37/video_poster")
			o(result.text.includes('poster="data:image/svg+xml;utf8,')).equals(true)
		})
		o("detect style list images", function () {
			let result = htmlSanitizer.sanitizeHTML(
				'<ul style="list-style-image: url(http://www.heise.de/icons/ho/heise_online_logo_top.gif);"><li>Zeile 1</li></ul>',
				{
					blockExternalContent: true,
				},
			)
			o(result.externalContent[0]).equals("http://www.heise.de/icons/ho/heise_online_logo_top.gif")
			o(result.text.includes("list-style-image: url(&quot;data:image/svg+xml;utf8,")).equals(true)
		})
		o("detect style content urls", function () {
			let result = htmlSanitizer.sanitizeHTML(
				'<div style="content: url(http://www.heise.de/icons/ho/heise_online_logo_top.gif)"></div>',
				{
					blockExternalContent: true,
				},
			)
			o(result.externalContent[0]).equals("http://www.heise.de/icons/ho/heise_online_logo_top.gif")
			o(result.text.includes("content: url(&quot;data:image/svg+xml;utf8,")).equals(true)
			// do not modify non url content
			result = htmlSanitizer.sanitizeHTML('<div style="content: blabla"> </div >', {
				blockExternalContent: true,
			})
			o(result.externalContent.length).equals(0)
			o(result.text.includes("content: blabla")).equals(true)
		})
		o("detect style cursor images", function () {
			let result = htmlSanitizer.sanitizeHTML(
				'<div style="cursor:url(https://tutanota.com/images/favicon/favicon.ico),auto;" ></div>',
				{
					blockExternalContent: true,
				},
			)
			o(result.externalContent.length).equals(1)
			o(result.text).equals('<div style=""></div>')
			o(result.text.includes("cursor:")).equals(false)
			result = htmlSanitizer.sanitizeHTML(
				'<div style="cursor:url(https://tutanota.com/images/favicon/favicon2.ico),url(https://tutanota.com/images/favicon/favicon.ico),auto;"></div>',
				{
					blockExternalContent: false,
				},
			)
			o(result.externalContent.length).equals(0)
			o(result.text).equals(
				'<div style="cursor:url(https://tutanota.com/images/favicon/favicon2.ico),url(https://tutanota.com/images/favicon/favicon.ico),auto;"></div>',
			)
		})
		o("detect style filter files", function () {
			let result = htmlSanitizer.sanitizeHTML(
				'<div style="filter:url(https://tutanota.com/images/favicon/favicon.ico);" ></div>',
				{
					blockExternalContent: true,
				},
			)
			o(result.externalContent.length).equals(1)
			o(result.text.includes("filter:")).equals(false)
			result = htmlSanitizer.sanitizeHTML(
				'<div style="filter:url(https://tutanota.com/images/favicon/favicon.ico);" ></div>',
				{
					blockExternalContent: false,
				},
			)
			o(result.externalContent.length).equals(0)
			o(result.text).equals('<div style="filter:url(https://tutanota.com/images/favicon/favicon.ico);"></div>')
		})
		o("detect style element", function () {
			let result = htmlSanitizer.sanitizeHTML(
				"<div><style>@import url(https://fonts.googleapis.com/css?family=Diplomata+SC);</style></div>",
				{
					blockExternalContent: true,
				},
			)
			o(result.externalContent.length).equals(0)
			o(result.text).equals("<div></div>")
			result = htmlSanitizer.sanitizeHTML(
				"<div><style>@import url(https://fonts.googleapis.com/css?family=Diplomata+SC);</style></div>",
				{
					blockExternalContent: false,
				},
			)
			o(result.externalContent.length).equals(0)
			o(result.text).equals("<div></div>")
		})
		o("replace images and links", function () {
			let result = htmlSanitizer.sanitizeHTML(
				'<html><img src="https://localhost/1.png"><img src="https://localhost/2.png"><img src="https://localhost/3.png"><img src="https://localhost/4.png"><img src="https://localhost/5.png"><img src="https://localhost/6.png"><img src="https://localhost/7.png"><img src="https://localhost/8.png"><img src="https://localhost/9"><a href="http://localhost/index.html"></a> </html>',
				{
					blockExternalContent: true,
				},
			)
			o(result.externalContent.length).equals(9)
			// do not replace links
			o(
				result.text.includes(
					'<a target="_blank" rel="noopener noreferrer" href="http://localhost/index.html">',
				) ||
				result.text.includes(
					'<a href="http://localhost/index.html" rel="noopener noreferrer" target="_blank">',
				),
			).equals(true)
		})
		o("do not replace inline images", function () {
			const input = '<html><img src="cid:asbasdf-safd_d"><img src="data:image/svg+xml;utf8,sadfsdasdf"></html>'
			const result = htmlSanitizer.sanitizeHTML(input, {
				blockExternalContent: true,
			})
			o(result.externalContent.length).equals(0)
			o(result.inlineImageCids).deepEquals(["asbasdf-safd_d"])
			o(result.text).equals(
				`<img src="${PREVENT_EXTERNAL_IMAGE_LOADING_ICON}" cid="asbasdf-safd_d" class="tutanota-placeholder"><img src="data:image/svg+xml;utf8,sadfsdasdf">`,
			)
		})
		o("audio tag", function () {
			let result = htmlSanitizer.sanitizeHTML(
				'<audio controls autoplay loop muted preload src="https://www.w3schools.com/tags/horse.mp3" type="audio/mpeg"></audio>',
				{
					blockExternalContent: true,
				},
			)
			o(result.externalContent[0]).equals("https://www.w3schools.com/tags/horse.mp3")
			o(result.text.includes("data:image/svg+xml;utf8,")).equals(true)
		})
		o("embed tag", function () {
			let result = htmlSanitizer.sanitizeHTML(
				'<div><embed src="https://tutanota.com/images/favicon/favicon.ico"></div>',
				{
					blockExternalContent: true,
				},
			)
			o(result.externalContent.length).equals(0)
			o(result.text).equals("<div></div>")
			result = htmlSanitizer.sanitizeHTML(
				'<div><embed src="https://tutanota.com/images/favicon/favicon.ico"></div>',
				{
					blockExternalContent: false,
				},
			)
			o(result.externalContent.length).equals(0)
			o(result.text).equals("<div></div>")
		})
		o("disallow relative links", function () {
			o(htmlSanitizer.sanitizeHTML('<a href="relative">text</a>').text).equals(
				'<a href="javascript:void(0)">text</a>',
			)
			o(htmlSanitizer.sanitizeHTML('<a href="/relative">text</a>').text).equals(
				'<a href="javascript:void(0)">text</a>',
			)
		})
		o("allow relative links when asked", function () {
			o(
				htmlSanitizer.sanitizeHTML('<a href="relative">text</a>', {
					allowRelativeLinks: true,
				}).text,
			).equals('<a href="relative" rel="noopener noreferrer" target="_blank">text</a>')
			o(
				htmlSanitizer.sanitizeHTML('<a href="/relative">text</a>', {
					allowRelativeLinks: true,
				}).text,
			).equals('<a href="/relative" rel="noopener noreferrer" target="_blank">text</a>')
		})
		o("filter out position css", function () {
			o(htmlSanitizer.sanitizeHTML(`<div style="color: red; position: absolute;"></div>`).text).equals(
				`<div style="color: red;"></div>`,
			)
			o(
				htmlSanitizer.sanitizeHTML(`<div style="color: red; position: absolute;"></div>`, {
					blockExternalContent: false,
				}).text,
			).equals(`<div style="color: red;"></div>`)
		})
		o("use image loading placeholder", function () {
			const r1 = htmlSanitizer.sanitizeHTML(`<img src="cid:123456">`, {
				usePlaceholderForInlineImages: true,
			}).text
			o(r1).equals(`<img src="${PREVENT_EXTERNAL_IMAGE_LOADING_ICON}" cid="123456" class="tutanota-placeholder">`)
			const r2 = htmlSanitizer.sanitizeHTML(`<img src="cid:123456">`).text
			o(r2).equals(`<img src="${PREVENT_EXTERNAL_IMAGE_LOADING_ICON}" cid="123456" class="tutanota-placeholder">`)
		})
		o("don't use image loading placeholder", function () {
			const result = htmlSanitizer.sanitizeHTML(`<img src="cid:123456">`, {
				usePlaceholderForInlineImages: false,
			}).text
			o(result).equals(`<img src="cid:123456">`)
		})
		o("svg tag not removed", function () {
			const result = htmlSanitizer
				.sanitizeSVG(`<svg> <rect x="10" y="10" width="10" height="10"> </rect> </svg>`)
				.text.trim()
			const element = document.createElement("div")
			element.innerHTML = result
			o(element.children[0]?.nodeName).equals("svg")
			o(element.children[0]?.children[0]?.nodeName.toLowerCase()).equals("rect")
			o(element.children[0]?.children[0]?.getAttribute("x")).equals("10")
			o(element.children[0]?.children[0]?.getAttribute("y")).equals("10")
			o(element.children[0]?.children[0]?.getAttribute("width")).equals("10")
			o(element.children[0]?.children[0]?.getAttribute("height")).equals("10")
		})
		o("svg fragment should not be removed", function () {
			const result = htmlSanitizer
				.sanitizeSVG(`<rect x="10" y="10" width="10" height="10"> </rect>`)
				.text.trim()
			const element = document.createElement("svg")
			element.innerHTML = result
			o(element.children[0]?.nodeName.toLowerCase()).equals("rect")
			o(element.children[0]?.getAttribute("x")).equals("10")
			o(element.children[0]?.getAttribute("y")).equals("10")
			o(element.children[0]?.getAttribute("width")).equals("10")
			o(element.children[0]?.getAttribute("height")).equals("10")
		})
		o("svg fragment should be removed", function () {
			const result = htmlSanitizer
				.sanitizeHTML(`<rect x="10" y="10" width="10" height="10"> </rect>`)
				.text.trim()
			o(result).equals(``)
		})
	}),
)

function replaceHtmlEntities(src: string): string {
	return src.replace(/</g, "&lt;").replace(/>/g, "&gt;")
}