import o from "@tutao/otest"
import { htmlSanitizer, PREVENT_EXTERNAL_IMAGE_LOADING_ICON } from "../../../src/common/misc/HtmlSanitizer.js"
import { createDataFile } from "../../../src/common/api/common/DataFile.js"
import { stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"

o.spec(
	"HtmlSanitizerTest",
	browser(function () {
		o("OWASP XSS attacks", function () {
			// see https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
			let tests = [
				{
					html: "<div>';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//\";\nalert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//--\n></SCRIPT>\">'><SCRIPT>alert(String.fromCharCode(88,83,83))</SCRIPT></div>",
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
					expected: `<img style="max-width: 100%;">`,
				},
				{
					html: "<IMG SRC=javascript:alert('XSS')>",
					expected: `<img style="max-width: 100%;">`,
				},
			]
			for (const test of tests) {
				// attacks should not be possible even if we load external content
				o(
					htmlSanitizer.sanitizeHTML(test.html, {
						blockExternalContent: false,
					}).html,
				).equals(test.expected)
			}
		})
		o("blockquotes", function () {
			//var sanitizer = DOMPurify.sanitize("");
			o(
				htmlSanitizer.sanitizeHTML('<blockquote class="tutanota_quote">test</blockquote>', {
					blockExternalContent: true,
				}).html,
			).equals('<blockquote class="tutanota_quote">test</blockquote>')
			o(
				htmlSanitizer.sanitizeHTML('<blockquote type="cite"cite="mid:AC55602DD"></blockquote>', {
					blockExternalContent: true,
				}).html,
			).equals('<blockquote type="cite"></blockquote>')
		})
		o("custom classes", function () {
			o(htmlSanitizer.sanitizeHTML('<div class="custom1 tutanota_quote custom2">test</div>').html).equals('<div class="tutanota_quote">test</div>')
		})
		o("leading text node", function () {
			o(htmlSanitizer.sanitizeHTML("hello<blockquote>test</blockquote>").html).equals("hello<blockquote>test</blockquote>")
		})
		o("html links", function () {
			let simpleHtmlLink = '<a href="https://tutanota.com">here</a>'
			let sanitizedLink = htmlSanitizer.sanitizeHTML(simpleHtmlLink).html
			o(sanitizedLink.includes('href="https://tutanota.com"')).equals(true)
			o(sanitizedLink.includes('target="_blank"')).equals(true)
			o(sanitizedLink.includes('rel="noopener noreferrer"')).equals(true)
			o(sanitizedLink.includes(">here</a>")).equals(true)
			let htmlLink =
				'<a href="https://www.coursera.org/maestro/auth/normal/change_email.php?payload=9722E7n3bcN/iM08q79eG2plUafuyc6Yj631JIMAuZgGAQL0UdTqbP7w2bH8b7fmpsljKMVVVpF81l0zD1HMVQ==|Iv5+NfeRQh0Gk7/Idr0jsIZfC69Mnixw0FNbTRNmuUTgIqLefDMOhKBqY8prtvyBB7jV8kZy9XtGDue7uuUMwNYv1ucDvn/RYt76LAVXIQrY9BhW1Y381ZyMbuhB14LERDe05DUJgQI6XkM9gxM3APT7RZs48ERUIb/MstkJtxw=">here</a>'
			sanitizedLink = htmlSanitizer.sanitizeHTML(htmlLink).html
			o(
				sanitizedLink.includes(
					'href="https://www.coursera.org/maestro/auth/normal/change_email.php?payload=9722E7n3bcN/iM08q79eG2plUafuyc6Yj631JIMAuZgGAQL0UdTqbP7w2bH8b7fmpsljKMVVVpF81l0zD1HMVQ==|Iv5+NfeRQh0Gk7/Idr0jsIZfC69Mnixw0FNbTRNmuUTgIqLefDMOhKBqY8prtvyBB7jV8kZy9XtGDue7uuUMwNYv1ucDvn/RYt76LAVXIQrY9BhW1Y381ZyMbuhB14LERDe05DUJgQI6XkM9gxM3APT7RZs48ERUIb/MstkJtxw="',
				),
			).equals(true)
			o(sanitizedLink.includes('target="_blank"')).equals(true)
			o(sanitizedLink.includes('rel="noopener noreferrer"')).equals(true)
			o(sanitizedLink.includes(">here</a>")).equals(true)
		})
		o("tutatemplate links in html", function () {
			let tutatemplateLink = '<a href="tutatemplate:some-id/some-entry">#hashtag</a>'
			let sanitized = htmlSanitizer.sanitizeHTML(tutatemplateLink).html
			o(sanitized.includes('href="tutatemplate:some-id/some-entry"')).equals(true)
		})
		o("tutatemplate links in fragment", function () {
			const tutatemplateLink = '<a href="tutatemplate:some-id/some-entry">#hashtag</a>'
			const sanitized = htmlSanitizer.sanitizeFragment(tutatemplateLink).fragment
			const a = sanitized.querySelector("a")
			o(a != null && a.href.includes("tutatemplate:some-id/some-entry")).equals(true)
		})
		o("notification mail template link", function () {
			let simpleHtmlLink = '<a href=" {link} ">here</a>'
			let sanitizedLink = htmlSanitizer.sanitizeHTML(simpleHtmlLink, {
				blockExternalContent: true,
			}).html
			o(sanitizedLink.includes('href="{link}"')).equals(true)
			o(sanitizedLink.includes('target="_blank"')).equals(true)
			o(sanitizedLink.includes('rel="noopener noreferrer"')).equals(true)
			o(sanitizedLink.includes(">here</a>")).equals(true)
		})
		o("area element", function () {
			let element = '<area href="https://tutanota.com">here</area>'
			let sanitizedElement = htmlSanitizer.sanitizeHTML(element, {
				blockExternalContent: true,
			}).html
			o(sanitizedElement.includes('href="https://tutanota.com"')).equals(true)
			o(sanitizedElement.includes('target="_blank"')).equals(true)
			o(sanitizedElement.includes('rel="noopener noreferrer"')).equals(true)
		})
		o("sanitizing empty body", function () {
			let sanitized = htmlSanitizer.sanitizeHTML("", {
				blockExternalContent: true,
			}).html
			o(sanitized).equals("")
			sanitized = htmlSanitizer.sanitizeHTML(" ", {
				blockExternalContent: true,
			}).html
			o(sanitized).equals(" ")
			sanitized = htmlSanitizer.sanitizeHTML("yo", {
				blockExternalContent: true,
			}).html
			o(sanitized).equals("yo")
			sanitized = htmlSanitizer.sanitizeHTML("<br>", {
				blockExternalContent: true,
			}).html
			o(sanitized).equals("<br>")
			sanitized = htmlSanitizer.sanitizeHTML("<div></div>", {
				blockExternalContent: true,
			}).html
			o(sanitized).equals("<div></div>")
			sanitized = htmlSanitizer.sanitizeHTML("<html></html>", {
				blockExternalContent: true,
			}).html
			o(sanitized).equals("")
			sanitized = htmlSanitizer.sanitizeHTML("<html><body></body></html>", {
				blockExternalContent: true,
			}).html
			o(sanitized).equals("")
			sanitized = htmlSanitizer.sanitizeHTML("<html><body>yo</body></html>", {
				blockExternalContent: true,
			}).html
			o(sanitized).equals("yo")
		})
		o("external image replacement is correct", function () {
			o(PREVENT_EXTERNAL_IMAGE_LOADING_ICON).equals(
				"data:image/svg+xml;utf8,<svg version='1.1' viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'> <rect width='512' height='512' fill='%23f8f8f8'/> <path d='m220 212c0 12.029-9.7597 21.789-21.789 21.789-12.029 0-21.789-9.7597-21.789-21.789s9.7597-21.789 21.789-21.789c12.029 0 21.789 9.7597 21.789 21.789zm116.21 43.578v50.841h-159.79v-21.789l36.315-36.315 18.158 18.158 58.104-58.104zm10.895-79.893h-181.58c-1.9292 0-3.6315 1.7023-3.6315 3.6315v138c0 1.9292 1.7023 3.6315 3.6315 3.6315h181.58c1.9292 0 3.6315-1.7023 3.6315-3.6315v-138c0-1.9292-1.7023-3.6315-3.6315-3.6315zm18.158 3.6315v138c0 9.9867-8.1709 18.158-18.158 18.158h-181.58c-9.9867 0-18.158-8.1709-18.158-18.158v-138c0-9.9867 8.1709-18.158 18.158-18.158h181.58c9.9867 0 18.158 8.1709 18.158 18.158z' fill='%23b4b4b4' stroke-width='.11348'/></svg>",
			)
		})

		const REPLACEMENT_VALUE = `url("${PREVENT_EXTERNAL_IMAGE_LOADING_ICON}")`

		o.spec("external background images", function () {
			o("when external content is blocked background-image url is replaced", function () {
				const result = htmlSanitizer.sanitizeFragment(
					'<p style="background-image: url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)"></p>',
					{
						blockExternalContent: true,
					},
				)
				o(result.blockedExternalContent).equals(1)
				const p = result.fragment.querySelector("p")!
				o(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
			})
			o("content is blocked if there is any non-data url in background-image ", function () {
				const result = htmlSanitizer.sanitizeFragment(
					"<p style=\"background-image: url('data:image/svg+xml;utf8,inline,'), url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)\"></p>",
					{
						blockExternalContent: true,
					},
				)
				o(result.blockedExternalContent).equals(1)
				const p = result.fragment.querySelector("p")!
				o(p.style.backgroundImage).equals(`url("${PREVENT_EXTERNAL_IMAGE_LOADING_ICON}")`)
			})
			o("when external content is blocked background url in quotes is replaced", function () {
				const result = htmlSanitizer.sanitizeFragment(
					'<p style="background: url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)"></p>',
					{
						blockExternalContent: true,
					},
				)
				o(result.blockedExternalContent).equals(1)
				const p = result.fragment.querySelector("p")!
				o(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
			})
			o("when external content is blocked background url in html quotes is replaced", function () {
				const result = htmlSanitizer.sanitizeFragment(
					'<p style="background: url(&#39;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&#39;)"></p>',
					{
						blockExternalContent: true,
					},
				)
				o(result.blockedExternalContent).equals(1)
				const p = result.fragment.querySelector("p")!
				o(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
			})
			o("when external content is not blocked background url in html quotes is not replaced", function () {
				const result = htmlSanitizer.sanitizeFragment(
					'<p style="background: url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)"></p>',
					{
						blockExternalContent: false,
					},
				)
				o(result.blockedExternalContent).equals(0)
				const p = result.fragment.querySelector("p")!
				o(p.style.backgroundImage).equals(`url("https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image")`)
			})

			o("when external content is blocked background-image image-set is replaced", function () {
				const cssValue = `image-set(url('https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image') 1x, url('https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image') 2x)`
				if (!CSS.supports("background-image", cssValue)) {
					// Bail out if browser doesn't support it.
					// It is only relevant for older Chromium-based browsers, we should remove them once they are outdated
					// tracking issue: https://bugs.chromium.org/p/chromium/issues/detail?id=630597
					console.warn("HtmlSanitizerTest: Browser doesn't support image-set, skipping")
					return
				}
				const dirty = `<p style="background-image: ${cssValue};"></p>`
				const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: true })
				o(result.blockedExternalContent).equals(1)
				const p = result.fragment.querySelector("p")!
				o(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
			})

			o("when external content is blocked background-image url -webkit-image-set is replaced", function () {
				const cssValue = `-webkit-image-set(url('https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image') 1x, url('https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image') 2x)`
				if (!CSS.supports("background-image", cssValue)) {
					// Bail out if browser doesn't support it.
					// It is only relevant for older Chromium-based browsers, we should remove them once they are outdated
					// tracking issue: https://bugs.chromium.org/p/chromium/issues/detail?id=630597
					console.warn("HtmlSanitizerTest: Browser doesn't support -webkit-image-set, skipping")
					return
				}
				const dirty = `<p style="background-image: ${cssValue};"></p>`
				const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: true })
				o(result.blockedExternalContent).equals(1)
				const p = result.fragment.querySelector("p")!
				o(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
			})

			o("when external content is blocked background-image with multiple url is replaced", function () {
				const dirty = `
<p style="background: url('https://example.com/1.png'), url('https://exmaple.com/2.jpg');">
</p>`
				const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: true })
				o(result.blockedExternalContent).equals(1)
				const p = result.fragment.querySelector("p")!
				o(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
			})

			o("when external content is blocked background-image with gradient and url is replaced", function () {
				const dirty = `
<p style="background: linear-gradient(blueviolet, black), url('https://exmaple.com/1.jpg')">
</p>`
				const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: true })
				o(result.blockedExternalContent).equals(1)
				const p = result.fragment.querySelector("p")!
				o(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
			})

			o("when external content is blocked inline background is not replaced", function () {
				const backgroundUrl = "data:image/svg+xml;utf8,inline"
				const ditry = `
	<p style="background: url('${backgroundUrl}');">
	</p>`
				const result = htmlSanitizer.sanitizeFragment(ditry, { blockExternalContent: true })
				o(result.blockedExternalContent).equals(0)
				const p = result.fragment.querySelector("p")!
				o(p.style.backgroundImage).equals(`url("${backgroundUrl}")`)
			})

			o("when external content is blocked url border-image-source is removed", function () {
				const dirty = `<div style="border-image-source: url('https://exmaple.com/1.jpg')">hi</div>`
				const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: true })
				o(result.blockedExternalContent).equals(1)
				const div = result.fragment.querySelector("div")!
				o(div.style.borderImageSource).equals("")
			})

			o("when external content is blocked url mask-image is removed", function () {
				const dirty = `<div style="mask-image: url('https://exmaple.com/1.jpg')">hi</div>`
				const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: true })
				// at the moment of writing Chrome doesn't support this without prefix so we just make sure it's not there
				// o(result.externalContent).equals(1)
				const div = result.fragment.querySelector("div")!
				o(div.style.maskImage == undefined || div.style.maskImage === "").equals(true)(`makImage is not set`)
			})

			o("when external content is blocked url shape-outside is removed", function () {
				const dirty = `<div style="shape-outside: url('https://exmaple.com/1.jpg')">hi</div>`
				const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: true })
				o(result.blockedExternalContent).equals(1)
				const div = result.fragment.querySelector("div")!
				o(div.style.shapeOutside).equals("")
			})

			o("when external content is blocked mask-border-source is removed", function () {
				const dirty = `<div style="mask-border-source: url('https://exmaple.com/1.jpg')">hi</div>`
				const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: true })
				const div = result.fragment.querySelector("div")!
				// @ts-ignore not in all browsers
				o(div.style.maskBorderSource == undefined || div.style.maskBorderSource === "").equals(true)("mask-border-source")
			})
		})
		o("detect background inline images", function () {
			const backgroundUrl = "data:image/svg+xml;utf8,inline"
			let result = htmlSanitizer.sanitizeHTML(`<p style="background-image: url(${backgroundUrl})"> </p>`, {
				blockExternalContent: true,
			})
			o(result.blockedExternalContent).equals(0)
			o(result.html.includes(backgroundUrl)).equals(true)
			result = htmlSanitizer.sanitizeHTML(`<p style="background-image: url(${backgroundUrl}), url(${backgroundUrl})"> </p>`, {
				blockExternalContent: true,
			})
			o(result.blockedExternalContent).equals(0)
			o(result.html.includes(backgroundUrl)).equals(true)
			result = htmlSanitizer.sanitizeHTML(`<p style="background-image: url('${backgroundUrl}')"> </p>`, {
				blockExternalContent: true,
			})
			o(result.blockedExternalContent).equals(0)
			o(result.html.includes(backgroundUrl)).equals(true)
			result = htmlSanitizer.sanitizeHTML(`<p style='background-image: url("${backgroundUrl}")'> </p>`, {
				blockExternalContent: true,
			})
			o(result.blockedExternalContent).equals(0)
			o(result.html.includes(backgroundUrl)).equals(true)
			result = htmlSanitizer.sanitizeHTML(`<p style="background-image: url(&quot;${backgroundUrl}&quot;)"> </p>`, {
				blockExternalContent: true,
			})
			o(result.blockedExternalContent).equals(0)
			o(result.html.includes(backgroundUrl)).equals(true)
			result = htmlSanitizer.sanitizeHTML(`<p style="background-image: url(&#39;${backgroundUrl}&#39;)"> </p>`, {
				blockExternalContent: true,
			})
			o(result.blockedExternalContent).equals(0)
			o(result.html.includes(backgroundUrl)).equals(true)
		})
		o("background attribute", function () {
			const plainHtml = '<table><tr><td background="https://tutanota.com/image.jpg"> ....</td></tr></table>'
			const cleanHtml = htmlSanitizer.sanitizeHTML(plainHtml, {
				blockExternalContent: true,
			})
			o(cleanHtml.blockedExternalContent).equals(1)
			o(cleanHtml.html.split(" ").some((e) => e === 'background="https://tutanota.com/image.jpg"')).equals(false)
			o(cleanHtml.html.includes("draft-background")).equals(true)
			o(
				htmlSanitizer
					.sanitizeHTML(plainHtml, {
						blockExternalContent: false,
					})
					.html.includes("background="),
			).equals(true)
			o(
				htmlSanitizer
					.sanitizeHTML(plainHtml, {
						blockExternalContent: false,
					})
					.html.includes("draft-background="),
			).equals(false)
		})
		o("srcset attribute", function () {
			const plainHtml =
				'<img srcset="https://tutanota.com/image1.jpg 1x, https://tutanota.com/image2.jpg 2x, https://tutanota.com/image3.jpg 3x" src="https://tutanota.com/image.jpg">'
			const cleanHtml = htmlSanitizer.sanitizeHTML(plainHtml, {
				blockExternalContent: true,
			})
			o(cleanHtml.blockedExternalContent).equals(2)

			o(
				cleanHtml.html
					.split(" ")
					.some(
						(e) =>
							e === 'srcSet="https://tutanota.com/image1.jpg 1x, https://tutanota.com/image2.jpg 2x, https://tutanota.com/image3.jpg 3x"' ||
							e === 'srcset="https://tutanota.com/image1.jpg 1x, https://tutanota.com/image2.jpg 2x, https://tutanota.com/image3.jpg 3x"',
					),
			).equals(false)
			o(
				cleanHtml.html.includes(
					'draft-srcset="https://tutanota.com/image1.jpg 1x, https://tutanota.com/image2.jpg 2x, https://tutanota.com/image3.jpg 3x',
				),
			).equals(true)
			o(cleanHtml.html.includes('src="data:image/svg+xml;utf8,')).equals(true)
		})
		o("detect images and set maxWidth=100px for placeholder images", function () {
			let result = htmlSanitizer.sanitizeHTML('<img src="https://emailprivacytester.com/cb/510828b5a8f43ab5">', {
				blockExternalContent: true,
			})
			o(result.blockedExternalContent).equals(1)
			o(result.html.includes('src="data:image/svg+xml;utf8,')).equals(true)
			o(result.html.includes('style="max-width: 100px;')).equals(true)
		})
		o("detect figure", function () {
			let inputElement = '<figure src="https://tutanota.com/images/favicon/favicon.ico" type="image">'
			let result = htmlSanitizer.sanitizeHTML(inputElement, {
				blockExternalContent: true,
			})
			o(result.blockedExternalContent).equals(1)
			o(result.html.split(" ").some((e) => e === 'src="https://tutanota.com')).equals(false)
			o(result.html.includes('draft-src="https://tutanota.com')).equals(true)
		})
		o("detect video posters", function () {
			let result = htmlSanitizer.sanitizeHTML(
				'<video poster="https://emailprivacytester.com/cb/04e69deda1be1c37/video_poster" height="1" width="1"></video>',
				{
					blockExternalContent: true,
				},
			)
			o(result.blockedExternalContent).equals(1)
			o(result.html.includes('poster="data:image/svg+xml;utf8,')).equals(true)
		})
		o("detect style list images", function () {
			let result = htmlSanitizer.sanitizeHTML(
				'<ul style="list-style-image: url(http://www.heise.de/icons/ho/heise_online_logo_top.gif);"><li>Zeile 1</li></ul>',
				{
					blockExternalContent: true,
				},
			)
			o(result.blockedExternalContent).equals(1)
			o(result.html.includes("list-style-image: url(&quot;data:image/svg+xml;utf8,")).equals(true)
		})
		o("detect style content urls", function () {
			let result = htmlSanitizer.sanitizeHTML('<div style="content: url(http://www.heise.de/icons/ho/heise_online_logo_top.gif)"></div>', {
				blockExternalContent: true,
			})
			o(result.blockedExternalContent).equals(1)
			o(result.html.includes("content: url(&quot;data:image/svg+xml;utf8,")).equals(true)
			// do not modify non url content
			result = htmlSanitizer.sanitizeHTML('<div style="content: blabla"> </div >', {
				blockExternalContent: true,
			})
			o(result.blockedExternalContent).equals(0)
			o(result.html.includes("content: blabla")).equals(true)
		})
		o("detect style cursor images", function () {
			let result = htmlSanitizer.sanitizeHTML('<div style="cursor:url(https://tutanota.com/images/favicon/favicon.ico),auto;" ></div>', {
				blockExternalContent: true,
			})
			o(result.blockedExternalContent).equals(1)
			o(result.html).equals('<div style=""></div>')
			o(result.html.includes("cursor:")).equals(false)
			result = htmlSanitizer.sanitizeHTML(
				'<div style="cursor:url(https://tutanota.com/images/favicon/favicon2.ico),url(https://tutanota.com/images/favicon/favicon.ico),auto;"></div>',
				{
					blockExternalContent: false,
				},
			)
			o(result.blockedExternalContent).equals(0)
			o(result.html).equals(
				'<div style="cursor:url(https://tutanota.com/images/favicon/favicon2.ico),url(https://tutanota.com/images/favicon/favicon.ico),auto;"></div>',
			)
		})
		o("detect style filter files", function () {
			let result = htmlSanitizer.sanitizeHTML('<div style="filter:url(https://tutanota.com/images/favicon/favicon.ico);" ></div>', {
				blockExternalContent: true,
			})
			o(result.blockedExternalContent).equals(1)
			o(result.html.includes("filter:")).equals(false)
			result = htmlSanitizer.sanitizeHTML('<div style="filter:url(https://tutanota.com/images/favicon/favicon.ico);" ></div>', {
				blockExternalContent: false,
			})
			o(result.blockedExternalContent).equals(0)
			o(result.html).equals('<div style="filter:url(https://tutanota.com/images/favicon/favicon.ico);"></div>')
		})
		o("detect style element", function () {
			let result = htmlSanitizer.sanitizeHTML("<div><style>@import url(https://fonts.googleapis.com/css?family=Diplomata+SC);</style></div>", {
				blockExternalContent: true,
			})
			o(result.blockedExternalContent).equals(0)
			o(result.html).equals("<div></div>")
			result = htmlSanitizer.sanitizeHTML("<div><style>@import url(https://fonts.googleapis.com/css?family=Diplomata+SC);</style></div>", {
				blockExternalContent: false,
			})
			o(result.blockedExternalContent).equals(0)
			o(result.html).equals("<div></div>")
		})
		o("replace images and links", function () {
			let result = htmlSanitizer.sanitizeHTML(
				'<html><img src="https://localhost/1.png"><img src="https://localhost/2.png"><img src="https://localhost/3.png"><img src="https://localhost/4.png"><img src="https://localhost/5.png"><img src="https://localhost/6.png"><img src="https://localhost/7.png"><img src="https://localhost/8.png"><img src="https://localhost/9"><a href="http://localhost/index.html"></a> </html>',
				{
					blockExternalContent: true,
				},
			)
			o(result.blockedExternalContent).equals(9)
			// do not replace links
			o(
				result.html.includes('<a target="_blank" rel="noopener noreferrer" href="http://localhost/index.html">') ||
					result.html.includes('<a href="http://localhost/index.html" rel="noopener noreferrer" target="_blank">'),
			).equals(true)
		})
		o("do not replace inline images", function () {
			const input = '<html><img src="cid:asbasdf-safd_d"><img src="data:image/svg+xml;utf8,sadfsdasdf"></html>'
			const result = htmlSanitizer.sanitizeHTML(input, {
				blockExternalContent: true,
			})
			o(result.blockedExternalContent).equals(0)
			o(result.inlineImageCids).deepEquals(["asbasdf-safd_d"])
			o(result.html.includes(`cid="asbasdf-safd_d"`)).equals(true)
			o(result.html.includes(`data:image/svg+xml;utf8,sadfsdasdf`)).equals(true)
			o(result.html.match(/max-width: 100%;/g)!.length).equals(2)
		})
		o("audio tag", function () {
			let result = htmlSanitizer.sanitizeHTML(
				'<audio controls autoplay loop muted preload src="https://www.w3schools.com/tags/horse.mp3" type="audio/mpeg"></audio>',
				{
					blockExternalContent: true,
				},
			)
			o(result.blockedExternalContent).equals(1)
			o(result.html.includes("data:image/svg+xml;utf8,")).equals(true)
		})
		o("embed tag", function () {
			let result = htmlSanitizer.sanitizeHTML('<div><embed src="https://tutanota.com/images/favicon/favicon.ico"></div>', {
				blockExternalContent: true,
			})
			o(result.blockedExternalContent).equals(0)
			o(result.html).equals("<div></div>")
			result = htmlSanitizer.sanitizeHTML('<div><embed src="https://tutanota.com/images/favicon/favicon.ico"></div>', {
				blockExternalContent: false,
			})
			o(result.blockedExternalContent).equals(0)
			o(result.html).equals("<div></div>")
		})
		o("disallow relative links", function () {
			o(htmlSanitizer.sanitizeHTML('<a href="relative">text</a>').html).equals('<a href="javascript:void(0)">text</a>')
			o(htmlSanitizer.sanitizeHTML('<a href="/relative">text</a>').html).equals('<a href="javascript:void(0)">text</a>')
		})
		o("allow relative links when asked", function () {
			o(
				htmlSanitizer.sanitizeHTML('<a href="relative">text</a>', {
					allowRelativeLinks: true,
				}).html,
			).equals('<a href="relative" rel="noopener noreferrer" target="_blank">text</a>')
			o(
				htmlSanitizer.sanitizeHTML('<a href="/relative">text</a>', {
					allowRelativeLinks: true,
				}).html,
			).equals('<a href="/relative" rel="noopener noreferrer" target="_blank">text</a>')
		})
		o("filter out position css", function () {
			o(htmlSanitizer.sanitizeHTML(`<div style="color: red; position: absolute;"></div>`).html).equals(`<div style="color: red;"></div>`)
			o(
				htmlSanitizer.sanitizeHTML(`<div style="color: red; position: absolute;"></div>`, {
					blockExternalContent: false,
				}).html,
			).equals(`<div style="color: red;"></div>`)
		})
		o("use image loading placeholder", function () {
			const r1 = htmlSanitizer.sanitizeHTML(`<img src="cid:123456">`, {
				usePlaceholderForInlineImages: true,
			}).html
			o(r1.includes(`src="${PREVENT_EXTERNAL_IMAGE_LOADING_ICON}"`)).equals(true)
			o(r1.includes(`style="max-width: 100%;"`)).equals(true)
			o(r1.includes(`cid="123456"`)).equals(true)
			o(r1.includes(`class="tutanota-placeholder"`)).equals(true)

			const r2 = htmlSanitizer.sanitizeHTML(`<img src="cid:123456">`).html
			o(r2.includes(`src="${PREVENT_EXTERNAL_IMAGE_LOADING_ICON}"`)).equals(true)
			o(r2.includes(`style="max-width: 100%;"`)).equals(true)
			o(r2.includes(`cid="123456"`)).equals(true)
			o(r2.includes(`class="tutanota-placeholder"`)).equals(true)
		})
		o("don't use image loading placeholder", function () {
			const result = htmlSanitizer.sanitizeHTML(`<img src="cid:123456">`, {
				usePlaceholderForInlineImages: false,
			}).html
			o(result).equals(`<img src="cid:123456" style="max-width: 100%;">`)
		})
		o("add max-width to images", function () {
			const result = htmlSanitizer.sanitizeHTML(`<img src="cid:123456">`, {
				usePlaceholderForInlineImages: false,
			}).html
			o(result).equals(`<img src="cid:123456" style="max-width: 100%;">`)
		})
		o("add max-width to images that have a given width", function () {
			const result = htmlSanitizer.sanitizeHTML(`<img src="cid:123456" style="width: 150px;">`, {
				usePlaceholderForInlineImages: false,
			}).html
			o(result).equals(`<img style="width: 150px; max-width: 100%;" src="cid:123456">`)
		})
		o("replace max-width for inline images", function () {
			const result = htmlSanitizer.sanitizeHTML(`<img src="cid:123456" style="max-width: 60%;">`, {
				usePlaceholderForInlineImages: false,
			}).html
			o(result).equals(`<img style="max-width: 100%;" src="cid:123456">`)
		})
		o("replace max-width for external images", function () {
			const result = htmlSanitizer.sanitizeHTML(`<img src="https://tutanota.com/images/favicon/favicon.ico">`, {
				blockExternalContent: false,
			}).html
			o(result).equals(`<img src="https://tutanota.com/images/favicon/favicon.ico" style="max-width: 100%;">`)
		})
		o("svg tag not removed", function () {
			const result = htmlSanitizer.sanitizeSVG(`<svg> <rect x="10" y="10" width="10" height="10"> </rect> </svg>`).html.trim()
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
			const result = htmlSanitizer.sanitizeSVG(`<rect x="10" y="10" width="10" height="10"> </rect>`).html.trim()
			const element = document.createElement("svg")
			element.innerHTML = result
			o(element.children[0]?.nodeName.toLowerCase()).equals("rect")
			o(element.children[0]?.getAttribute("x")).equals("10")
			o(element.children[0]?.getAttribute("y")).equals("10")
			o(element.children[0]?.getAttribute("width")).equals("10")
			o(element.children[0]?.getAttribute("height")).equals("10")
		})
		o("svg fragment should be removed", function () {
			const result = htmlSanitizer.sanitizeHTML(`<rect x="10" y="10" width="10" height="10"> </rect>`).html.trim()
			o(result).equals(``)
		})

		o.spec("inline attachment sanitization", function () {
			o("svg with xss gets sanitized", function () {
				const svgDocumentWithXSS =
					'<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
					'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
					"\n" +
					'<svg version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg">\n' +
					'<polygon id="triangle" points="0,0 0,50 50,0" fill="#009900" stroke="#004400"/>\n' +
					'<script type="text/javascript">\n' +
					'alert(localStorage.getItem("tutanotaConfig"));\n' +
					"</script></svg>"
				const expectedSvgDocument =
					'<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
					'<svg xmlns="http://www.w3.org/2000/svg" version="1.1">\n' +
					'<polygon stroke="#004400" fill="#009900" points="0,0 0,50 50,0" id="triangle"/>\n' +
					"</svg>"
				const xssDataFile = createDataFile("xss.svg", "image/svg+xml", stringToUtf8Uint8Array(svgDocumentWithXSS), "some-cid")
				const sanitizedDataFile = htmlSanitizer.sanitizeInlineAttachment(xssDataFile)
				o(sanitizedDataFile.cid).equals("some-cid")
				o(sanitizedDataFile.mimeType).equals("image/svg+xml")
				o(sanitizedDataFile.name).equals("xss.svg")
				const parser = new DOMParser()
				const cleanSvgTree = parser.parseFromString(utf8Uint8ArrayToString(sanitizedDataFile.data), "image/svg+xml")
				const expectedSvgTree = parser.parseFromString(expectedSvgDocument, "image/svg+xml")
				const serializer = new XMLSerializer()
				const reserializedClean = serializer.serializeToString(cleanSvgTree)
				const reserializedExpected = serializer.serializeToString(expectedSvgTree)
				o(reserializedClean).equals(reserializedExpected)
			})

			o("svg without xss gets left alone", function () {
				const svgDocumentWithoutXSS =
					'<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
					'<svg version="1.1" xmlns="http://www.w3.org/2000/svg">\n' +
					'<polygon stroke="#004400" fill="#009900" points="0,0 0,50 50,0" id="script"/>\n' +
					"</svg>"
				const noxssDataFile = createDataFile("no-xss.svg", "image/svg+xml", stringToUtf8Uint8Array(svgDocumentWithoutXSS), "some-other-cid")
				const sanitizedDataFile = htmlSanitizer.sanitizeInlineAttachment(noxssDataFile)
				const parser = new DOMParser()
				const cleanSvgTree = parser.parseFromString(utf8Uint8ArrayToString(sanitizedDataFile.data), "image/svg+xml")
				o(cleanSvgTree.getElementsByTagName("script").length).equals(0)
				const polys = cleanSvgTree.getElementsByTagName("polygon")
				o(polys.length).equals(1)
				o(polys[0].id).equals("script")
				o(polys[0].getAttributeNames().sort()).deepEquals(["stroke", "fill", "points", "id"].sort())
				o(polys[0].getAttribute("stroke")).equals("#004400")
				o(polys[0].getAttribute("fill")).equals("#009900")
				o(polys[0].getAttribute("points")).equals("0,0 0,50 50,0")

				const svgs = cleanSvgTree.getElementsByTagName("svg")
				o(svgs.length).equals(1)
				o(svgs[0].getAttributeNames().sort()).deepEquals(["version", "xmlns"])
				o(svgs[0].getAttribute("version")).equals("1.1")
				o(svgs[0].getAttribute("xmlns")).equals("http://www.w3.org/2000/svg")
			})

			o("invalid svg gets replaced with empty text", function () {
				// svg with invalid encoding (non-utf8) will and should be indistinguishable from just plain invalid svg
				// so we don't test invalid encoding separately
				const invalidSvg = '<svg/><?xml version="1.0">'
				const utf16DataFile = createDataFile("no-xss.svg", "image/svg+xml", stringToUtf8Uint8Array(invalidSvg), "third-cid")
				const sanitizedDataFile = htmlSanitizer.sanitizeInlineAttachment(utf16DataFile)
				o(sanitizedDataFile.data.length).equals(0)
			})

			o("non-svg inline attachments get left alone", function () {
				const someData = Uint8Array.from([84, 0, 89, 0, 80, 47, 0, 47, 0, 87])
				const someDataFile = createDataFile("no-xss.svg", "image/png", someData, "third-cid")
				const sanitizedDataFile = htmlSanitizer.sanitizeInlineAttachment(someDataFile)
				o(sanitizedDataFile.data).deepEquals(someData)
			})
		})
	}),
)
