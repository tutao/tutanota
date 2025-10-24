import o from "@tutao/otest"
import { getCssValueUrls, HtmlSanitizer, parseSrcsetUrls } from "../../../src/common/misc/HtmlSanitizer.js"
import { createDataFile } from "../../../src/common/api/common/DataFile.js"
import { stringToUtf8Uint8Array, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"
import { textIncludes } from "../TestUtils"

o.spec("HtmlSanitizer", function () {
	o.spec(
		"sanitizer",
		browser(function () {
			const replacementImageUrl = "blob:123456"
			let htmlSanitizer: HtmlSanitizer
			o.beforeEach(() => {
				htmlSanitizer = new HtmlSanitizer(replacementImageUrl)
			})

			o.test("OWASP XSS attacks", function () {
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
					o.check(
						htmlSanitizer.sanitizeHTML(test.html, {
							blockExternalContent: false,
						}).html,
					).equals(test.expected)
				}
			})
			o.test("blockquotes", function () {
				//var sanitizer = DOMPurify.sanitize("");
				o.check(
					htmlSanitizer.sanitizeHTML('<blockquote class="tutanota_quote">test</blockquote>', {
						blockExternalContent: true,
					}).html,
				).equals('<blockquote class="tutanota_quote">test</blockquote>')
				o.check(
					htmlSanitizer.sanitizeHTML('<blockquote type="cite"cite="mid:AC55602DD"></blockquote>', {
						blockExternalContent: true,
					}).html,
				).equals('<blockquote type="cite"></blockquote>')
			})
			o.test("custom classes", function () {
				o.check(htmlSanitizer.sanitizeHTML('<div class="custom1 tutanota_quote custom2">test</div>').html).equals(
					'<div class="tutanota_quote">test</div>',
				)
			})
			o.test("leading text node", function () {
				o.check(htmlSanitizer.sanitizeHTML("hello<blockquote>test</blockquote>").html).equals("hello<blockquote>test</blockquote>")
			})
			o.test("given a simple html link it adds target and rel attributes and adds link to sanitized result", function () {
				const htmlLink = '<a href="https://tutanota.com">here</a>'
				const { html: sanitizedHtml, links } = htmlSanitizer.sanitizeHTML(htmlLink)
				o.check(sanitizedHtml.includes('href="https://tutanota.com"')).equals(true)
				o.check(sanitizedHtml.includes('target="_blank"')).equals(true)
				o.check(sanitizedHtml.includes('rel="noopener noreferrer"')).equals(true)
				o.check(sanitizedHtml.includes(">here</a>")).equals(true)
				o.check(links.map((element) => element.getAttribute("href"))).deepEquals(["https://tutanota.com"])
			})
			o.test("given a long html link it adds target and rel attributes and adds link to sanitized result", function () {
				const htmlLink =
					'<a href="https://www.coursera.org/maestro/auth/normal/change_email.php?payload=9722E7n3bcN/iM08q79eG2plUafuyc6Yj631JIMAuZgGAQL0UdTqbP7w2bH8b7fmpsljKMVVVpF81l0zD1HMVQ==|Iv5+NfeRQh0Gk7/Idr0jsIZfC69Mnixw0FNbTRNmuUTgIqLefDMOhKBqY8prtvyBB7jV8kZy9XtGDue7uuUMwNYv1ucDvn/RYt76LAVXIQrY9BhW1Y381ZyMbuhB14LERDe05DUJgQI6XkM9gxM3APT7RZs48ERUIb/MstkJtxw=">here</a>'
				const { html: sanitizedHtml, links } = htmlSanitizer.sanitizeHTML(htmlLink)

				o.check(
					sanitizedHtml.includes(
						'href="https://www.coursera.org/maestro/auth/normal/change_email.php?payload=9722E7n3bcN/iM08q79eG2plUafuyc6Yj631JIMAuZgGAQL0UdTqbP7w2bH8b7fmpsljKMVVVpF81l0zD1HMVQ==|Iv5+NfeRQh0Gk7/Idr0jsIZfC69Mnixw0FNbTRNmuUTgIqLefDMOhKBqY8prtvyBB7jV8kZy9XtGDue7uuUMwNYv1ucDvn/RYt76LAVXIQrY9BhW1Y381ZyMbuhB14LERDe05DUJgQI6XkM9gxM3APT7RZs48ERUIb/MstkJtxw="',
					),
				).equals(true)
				o.check(sanitizedHtml.includes('target="_blank"')).equals(true)
				o.check(sanitizedHtml.includes('rel="noopener noreferrer"')).equals(true)
				o.check(sanitizedHtml.includes(">here</a>")).equals(true)
				o.check(links.map((element) => element.getAttribute("href"))).deepEquals([
					"https://www.coursera.org/maestro/auth/normal/change_email.php?payload=9722E7n3bcN/iM08q79eG2plUafuyc6Yj631JIMAuZgGAQL0UdTqbP7w2bH8b7fmpsljKMVVVpF81l0zD1HMVQ==|Iv5+NfeRQh0Gk7/Idr0jsIZfC69Mnixw0FNbTRNmuUTgIqLefDMOhKBqY8prtvyBB7jV8kZy9XtGDue7uuUMwNYv1ucDvn/RYt76LAVXIQrY9BhW1Y381ZyMbuhB14LERDe05DUJgQI6XkM9gxM3APT7RZs48ERUIb/MstkJtxw=",
				])
			})
			o.test("given a placeholder html link it adds target and rel attributes and adds link to sanitized result", function () {
				const htmlLink = '<a href="{link}">here</a>'
				const { html: sanitizedHtml, links } = htmlSanitizer.sanitizeHTML(htmlLink)
				o.check(sanitizedHtml.includes('href="{link}"')).equals(true)
				o.check(sanitizedHtml.includes('target="_blank"')).equals(true)
				o.check(sanitizedHtml.includes('rel="noopener noreferrer"')).equals(true)
				o.check(sanitizedHtml.includes(">here</a>")).equals(true)
				o.check(links.map((element) => element.getAttribute("href"))).deepEquals(["{link}"])
			})
			o.test("tutatemplate links in html", function () {
				let tutatemplateLink = '<a href="tutatemplate:some-id/some-entry">#hashtag</a>'
				let sanitized = htmlSanitizer.sanitizeHTML(tutatemplateLink).html
				o.check(sanitized.includes('href="tutatemplate:some-id/some-entry"')).equals(true)
			})
			o.test("tutatemplate links in fragment", function () {
				const tutatemplateLink = '<a href="tutatemplate:some-id/some-entry">#hashtag</a>'
				const sanitized = htmlSanitizer.sanitizeFragment(tutatemplateLink).fragment
				const a = sanitized.querySelector("a")
				o.check(a != null && a.href.includes("tutatemplate:some-id/some-entry")).equals(true)
			})
			o.test("notification mail template link", function () {
				let simpleHtmlLink = '<a href=" {link} ">here</a>'
				let sanitizedLink = htmlSanitizer.sanitizeHTML(simpleHtmlLink, {
					blockExternalContent: true,
				}).html
				o.check(sanitizedLink.includes('href="{link}"')).equals(true)
				o.check(sanitizedLink.includes('target="_blank"')).equals(true)
				o.check(sanitizedLink.includes('rel="noopener noreferrer"')).equals(true)
				o.check(sanitizedLink.includes(">here</a>")).equals(true)
			})
			o.test("area element", function () {
				let element = '<area href="https://tutanota.com">here</area>'
				let sanitizedElement = htmlSanitizer.sanitizeHTML(element, {
					blockExternalContent: true,
				}).html
				o.check(sanitizedElement.includes('href="https://tutanota.com"')).equals(true)
				o.check(sanitizedElement.includes('target="_blank"')).equals(true)
				o.check(sanitizedElement.includes('rel="noopener noreferrer"')).equals(true)
			})
			o.test("sanitizing empty body", function () {
				let sanitized = htmlSanitizer.sanitizeHTML("", {
					blockExternalContent: true,
				}).html
				o.check(sanitized).equals("")
				sanitized = htmlSanitizer.sanitizeHTML(" ", {
					blockExternalContent: true,
				}).html
				o.check(sanitized).equals(" ")
				sanitized = htmlSanitizer.sanitizeHTML("yo", {
					blockExternalContent: true,
				}).html
				o.check(sanitized).equals("yo")
				sanitized = htmlSanitizer.sanitizeHTML("<br>", {
					blockExternalContent: true,
				}).html
				o.check(sanitized).equals("<br>")
				sanitized = htmlSanitizer.sanitizeHTML("<div></div>", {
					blockExternalContent: true,
				}).html
				o.check(sanitized).equals("<div></div>")
				sanitized = htmlSanitizer.sanitizeHTML("<html></html>", {
					blockExternalContent: true,
				}).html
				o.check(sanitized).equals("")
				sanitized = htmlSanitizer.sanitizeHTML("<html><body></body></html>", {
					blockExternalContent: true,
				}).html
				o.check(sanitized).equals("")
				sanitized = htmlSanitizer.sanitizeHTML("<html><body>yo</body></html>", {
					blockExternalContent: true,
				}).html
				o.check(sanitized).equals("yo")
			})

			const REPLACEMENT_VALUE = `url("${replacementImageUrl}")`

			o.spec("external css images", function () {
				o.test("when external content is blocked background-image url is replaced", function () {
					const result = htmlSanitizer.sanitizeFragment(
						'<p style="background-image: url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)"></p>',
						{
							blockExternalContent: true,
						},
					)
					o.check(result.blockedExternalContent).equals(1)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
				})
				o.test("content is blocked if there is any non-data url in background-image ", function () {
					const result = htmlSanitizer.sanitizeFragment(
						"<p style=\"background-image: url('data:image/svg+xml;utf8,inline,'), url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)\"></p>",
						{
							blockExternalContent: true,
						},
					)
					o.check(result.blockedExternalContent).equals(1)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(`url("${replacementImageUrl}")`)
				})
				o.test("when external content is blocked background url in quotes is replaced", function () {
					const result = htmlSanitizer.sanitizeFragment(
						'<p style="background: url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)"></p>',
						{
							blockExternalContent: true,
						},
					)
					o.check(result.blockedExternalContent).equals(1)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
				})
				o.test("when external content is blocked background url in html quotes is replaced", function () {
					const result = htmlSanitizer.sanitizeFragment(
						'<p style="background: url(&#39;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&#39;)"></p>',
						{
							blockExternalContent: true,
						},
					)
					o.check(result.blockedExternalContent).equals(1)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
				})
				o.test("when external content is not blocked background url in html quotes is not replaced", function () {
					const result = htmlSanitizer.sanitizeFragment(
						'<p style="background: url(&quot;https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image&quot;)"></p>',
						{
							blockExternalContent: false,
						},
					)
					o.check(result.blockedExternalContent).equals(0)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(`url("https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image")`)
				})

				o.test("when external content is not blocked background-image image-set is replaced", function () {
					const cssValue = `image-set(url('https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image') 1x, url('https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image') 2x)`
					if (!CSS.supports("background-image", cssValue)) {
						// Bail out if browser doesn't support it.
						// It is only relevant for older Chromium-based browsers, we should remove them once they are outdated
						// tracking issue: https://bugs.chromium.org/p/chromium/issues/detail?id=630597
						console.warn("HtmlSanitizerTest: Browser doesn't support image-set, skipping")
						return
					}
					const dirty = `<p style="background-image: ${cssValue};"></p>`
					const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: false })
					o.check(result.blockedExternalContent).equals(0)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
				})

				o.test("when external content is not blocked background-image url -webkit-image-set is replaced", function () {
					const cssValue = `-webkit-image-set(url('https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image') 1x, url('https://emailprivacytester.com/cb/1134f6cba766bf0b/background_image') 2x)`
					if (!CSS.supports("background-image", cssValue)) {
						// Bail out if browser doesn't support it.
						// It is only relevant for older Chromium-based browsers, we should remove them once they are outdated
						// tracking issue: https://bugs.chromium.org/p/chromium/issues/detail?id=630597
						console.warn("HtmlSanitizerTest: Browser doesn't support -webkit-image-set, skipping")
						return
					}
					const dirty = `<p style="background-image: ${cssValue};"></p>`
					const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: false })
					o.check(result.blockedExternalContent).equals(0)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
				})

				o.test("when external content is blocked background-image with multiple url is replaced", function () {
					const dirty = `
<p style="background: url('https://example.com/1.png'), url('https://exmaple.com/2.jpg');">
</p>`
					const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: true })
					o.check(result.blockedExternalContent).equals(1)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
				})

				o.test("when external content is blocked background-image with gradient and url is replaced", function () {
					const dirty = `
<p style="background: linear-gradient(blueviolet, black), url('https://exmaple.com/1.jpg')">
</p>`
					const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: true })
					o.check(result.blockedExternalContent).equals(1)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
				})

				o.test("when external content is blocked inline background is not replaced", function () {
					const backgroundUrl = "data:image/svg+xml;utf8,inline"
					const ditry = `
	<p style="background: url('${backgroundUrl}');">
	</p>`
					const result = htmlSanitizer.sanitizeFragment(ditry, { blockExternalContent: true })
					o.check(result.blockedExternalContent).equals(0)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(`url("${backgroundUrl}")`)
				})

				o.test("when external content is blocked url border-image-source is removed", function () {
					const dirty = `<div style="border-image-source: url('https://exmaple.com/1.jpg')">hi</div>`
					const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: true })
					o.check(result.blockedExternalContent).equals(1)
					const div = result.fragment.querySelector("div")!
					o.check(div.style.borderImageSource).equals("")
				})

				o.test("when external content is blocked url mask-image is removed", function () {
					const dirty = `<div style="mask-image: url('https://exmaple.com/1.jpg')">hi</div>`
					const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: true })
					// at the moment of writing Chrome doesn't support this without prefix so we just make sure it's not there
					// o.check(result.externalContent).equals(1)
					const div = result.fragment.querySelector("div")!
					o.check(div.style.maskImage == null || div.style.maskImage === "").equals(true)(`makImage is not set`)
				})

				o.test("when external content is blocked url shape-outside is removed", function () {
					const dirty = `<div style="shape-outside: url('https://exmaple.com/1.jpg')">hi</div>`
					const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: true })
					o.check(result.blockedExternalContent).equals(1)
					const div = result.fragment.querySelector("div")!
					o.check(div.style.shapeOutside).equals("")
				})

				o.test("when external content is blocked mask-border-source is removed", function () {
					const dirty = `<div style="mask-border-source: url('https://exmaple.com/1.jpg')">hi</div>`
					const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: true })
					const div = result.fragment.querySelector("div")!
					// @ts-ignore not in all browsers
					o.check(div.style.maskBorderSource == null || div.style.maskBorderSource === "").equals(true)("mask-border-source")
				})
			})
			o.spec("relative css images", function () {
				o.test("when background-image url is relative it is replaced", function () {
					const result = htmlSanitizer.sanitizeFragment('<p style="background-image: url(&quot;relative&quot;)"></p>', {
						blockExternalContent: false,
					})
					o.check(result.blockedExternalContent).equals(0)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
				})
				o.test("when background url is relative and in quotes it is replaced", function () {
					const result = htmlSanitizer.sanitizeFragment('<p style="background: url(&quot;relative&quot;)"></p>', {
						blockExternalContent: false,
					})
					o.check(result.blockedExternalContent).equals(0)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
				})
				o.test("when background url is relative and in html quotes it is replaced", function () {
					const result = htmlSanitizer.sanitizeFragment('<p style="background: url(&#39;relative&#39;)"></p>', {
						blockExternalContent: false,
					})
					o.check(result.blockedExternalContent).equals(0)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
				})

				o.test("when one of background urls is relative the whole background-image is replaced", function () {
					const dirty = `
<p style="background: url('https://example.com/1.png'), url('relative');">
</p>`
					const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: false })
					o.check(result.blockedExternalContent).equals(0)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
				})

				o.test("when there's a gradient and relative url the whole background-image is replaced", function () {
					const dirty = `
<p style="background: linear-gradient(blueviolet, black), url('relative')">
</p>`
					const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: false })
					o.check(result.blockedExternalContent).equals(0)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
				})

				o.test("when there's a relative url and a gradient the whole background-image is replaced", function () {
					const dirty = `
<p style="background: url('relative'), linear-gradient(blueviolet, black)">
</p>`
					const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: false })
					o.check(result.blockedExternalContent).equals(0)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
				})

				o.test("when there's a data: url background url and a relative url the whole background-image is replaced", function () {
					const backgroundUrl = "data:image/svg+xml;utf8,inline"
					const ditry = `
	<p style="background: url('${backgroundUrl}'), url('relative');">
	</p>`
					const result = htmlSanitizer.sanitizeFragment(ditry, { blockExternalContent: false })
					o.check(result.blockedExternalContent).equals(0)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
				})

				o.test("when there's border-image-source with relative URL it is removed", function () {
					const dirty = `<div style="border-image-source: url('relative')">hi</div>`
					const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: false })
					o.check(result.blockedExternalContent).equals(0)
					const div = result.fragment.querySelector("div")!
					o.check(div.style.borderImageSource).equals("")
				})

				o.test("when there's mask-image with relative URL it is removed", function () {
					const dirty = `<div style="mask-image: url('relative')">hi</div>`
					const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: false })
					// at the moment of writing Chrome doesn't support this without prefix so we just make sure it's not there
					o.check(result.blockedExternalContent).equals(0)
					const div = result.fragment.querySelector("div")!
					o.check(div.style.maskImage == null || div.style.maskImage === "").equals(true)(`maskImage is not set`)
				})

				o.test("when there's shape-outside with relative URL it is removed", function () {
					const dirty = `<div style="shape-outside: url('relative')">hi</div>`
					const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: false })
					o.check(result.blockedExternalContent).equals(0)
					const div = result.fragment.querySelector("div")!
					o.check(div.style.shapeOutside).equals("")
				})

				o.test("when there's mask-border-source with relative URL it is removed", function () {
					const dirty = `<div style="mask-border-source: url('relative')">hi</div>`
					const result = htmlSanitizer.sanitizeFragment(dirty, { blockExternalContent: false })
					const div = result.fragment.querySelector("div")!
					o.check(div.style.getPropertyValue("mask-border-source")).equals("")
				})

				o.test("when there's invalid relative URL in background-image it is replaced", function () {
					const invalidRelativeUrl = `<div style="background-image: url("blah")something")"></div>`
					const result = htmlSanitizer.sanitizeFragment(invalidRelativeUrl, { blockExternalContent: false })
					const div = result.fragment.querySelector("div")!
					o.check(div.style.getPropertyValue("background-image")).equals(REPLACEMENT_VALUE)
				})

				o.test("when image src is relative it is replaced", function () {
					const result = htmlSanitizer.sanitizeFragment('<img src="relative">', {
						blockExternalContent: false,
					})
					o.check(result.blockedExternalContent).equals(0)
					const img = result.fragment.querySelector("img")!
					o.check(img.src).equals(replacementImageUrl)
				})

				o.test("when video src is relative link it is replaced", function () {
					const result = htmlSanitizer.sanitizeFragment('<video src="relative">', {
						blockExternalContent: false,
					})
					o.check(result.blockedExternalContent).equals(0)
					const video = result.fragment.querySelector("video")!
					o.check(video.src).equals(replacementImageUrl)
				})

				o.test("when video poster is relative link it is replaced", function () {
					const result = htmlSanitizer.sanitizeFragment('<video poster="relative">', {
						blockExternalContent: false,
					})
					o.check(result.blockedExternalContent).equals(0)
					const video = result.fragment.querySelector("video")!
					o.check(video.poster).equals(replacementImageUrl)
				})

				o.test("when img src is {link} and relative links are not allowed it is replaced", function () {
					const result = htmlSanitizer.sanitizeFragment(`<img src="{link}"/>`, {
						blockExternalContent: false,
					})
					o.check(result.blockedExternalContent).equals(0)
					const img = result.fragment.querySelector("img")!
					o.check(img.src).equals(replacementImageUrl)
				})
			})

			o.spec("disallowed css values", function () {
				o.test("when background-image url is defined via var it is replaced", function () {
					const result = htmlSanitizer.sanitizeFragment(
						`<p style="--my-url: url(&quot;http://example.com&quot;); background-image: var(--my-url)"></p>`,
						{
							blockExternalContent: false,
						},
					)
					o.check(result.blockedExternalContent).equals(0)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
				})

				o.test("when background-image url is defined via src it is replaced", function () {
					const result = htmlSanitizer.sanitizeFragment(
						`<p style="--my-url: &quot;http://example.com&quot;; background-image: src(var(--my-url))"></p>`,
						{
							blockExternalContent: false,
						},
					)
					o.check(result.blockedExternalContent).equals(0)
					const p = result.fragment.querySelector("p")!
					o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
				})

				if (CSS.supports(`background-image`, `element(#my-background)`)) {
					o.test("when background-image url is defined via element it is replaced", function () {
						const result = htmlSanitizer.sanitizeFragment(`<p style="background-image: element(&quot;#someid&quot;)"></p>`, {
							blockExternalContent: false,
						})
						o.check(result.blockedExternalContent).equals(0)
						const p = result.fragment.querySelector("p")!
						o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
					})
				}

				if (CSS.supports(`background-image`, `-moz-element(#my-background)`)) {
					o.test("when background-image url is defined via -moz-element it is replaced", function () {
						const result = htmlSanitizer.sanitizeFragment(
							`
						<div id="someid">helo</div>
<p style="background-image: -moz-element(&quot;#someid&quot;)"></p>`,
							{
								blockExternalContent: false,
							},
						)
						o.check(result.blockedExternalContent).equals(0)
						const p = result.fragment.querySelector("p")!
						// FF seems to not implement some of CSSOM for it
						o.check(p.style.backgroundImage).notSatisfies(textIncludes("someId"))
					})
				}

				if (CSS.supports("background-image", `image("blah.jpg")`)) {
					o.test("when background-image url is defined via image it is replaced", function () {
						const result = htmlSanitizer.sanitizeFragment(`<p style="background-image: image(&quot;blah.jpg&quot;)"></p>`, {
							blockExternalContent: false,
						})
						o.check(result.blockedExternalContent).equals(0)
						const p = result.fragment.querySelector("p")!
						o.check(p.style.backgroundImage).equals(REPLACEMENT_VALUE)
					})
				}
			})

			o.test("detect background inline images", function () {
				const backgroundUrl = "data:image/svg+xml;utf8,inline"
				let result = htmlSanitizer.sanitizeHTML(`<p style="background-image: url(${backgroundUrl})"> </p>`, {
					blockExternalContent: true,
				})
				o.check(result.blockedExternalContent).equals(0)
				o.check(result.html.includes(backgroundUrl)).equals(true)
				result = htmlSanitizer.sanitizeHTML(`<p style="background-image: url(${backgroundUrl}), url(${backgroundUrl})"> </p>`, {
					blockExternalContent: true,
				})
				o.check(result.blockedExternalContent).equals(0)
				o.check(result.html.includes(backgroundUrl)).equals(true)
				result = htmlSanitizer.sanitizeHTML(`<p style="background-image: url('${backgroundUrl}')"> </p>`, {
					blockExternalContent: true,
				})
				o.check(result.blockedExternalContent).equals(0)
				o.check(result.html.includes(backgroundUrl)).equals(true)
				result = htmlSanitizer.sanitizeHTML(`<p style='background-image: url("${backgroundUrl}")'> </p>`, {
					blockExternalContent: true,
				})
				o.check(result.blockedExternalContent).equals(0)
				o.check(result.html.includes(backgroundUrl)).equals(true)
				result = htmlSanitizer.sanitizeHTML(`<p style="background-image: url(&quot;${backgroundUrl}&quot;)"> </p>`, {
					blockExternalContent: true,
				})
				o.check(result.blockedExternalContent).equals(0)
				o.check(result.html.includes(backgroundUrl)).equals(true)
				result = htmlSanitizer.sanitizeHTML(`<p style="background-image: url(&#39;${backgroundUrl}&#39;)"> </p>`, {
					blockExternalContent: true,
				})
				o.check(result.blockedExternalContent).equals(0)
				o.check(result.html.includes(backgroundUrl)).equals(true)
			})
			o.test("when external content is blocked background attribute is replaced", function () {
				const plainHtml = '<table><tr><td background="https://tutanota.com/image.jpg"> ....</td></tr></table>'
				const { html: cleanHtml, blockedExternalContent } = htmlSanitizer.sanitizeHTML(plainHtml, {
					blockExternalContent: true,
				})
				o.check(blockedExternalContent).equals(1)
				o.check(cleanHtml).satisfies(textIncludes(`background="${replacementImageUrl}"`))
				o.check(cleanHtml).satisfies(textIncludes('draft-background="https://tutanota.com/image.jpg"'))
			})
			o.test("when external content is not blocked background attribute is left as is", function () {
				const plainHtml = '<table><tr><td background="https://tutanota.com/image.jpg"> ....</td></tr></table>'
				const { html: cleanHtml, blockedExternalContent } = htmlSanitizer.sanitizeHTML(plainHtml, {
					blockExternalContent: false,
				})
				o.check(blockedExternalContent).equals(0)
				o.check(cleanHtml).satisfies(textIncludes('background="https://tutanota.com/image.jpg"'))
				o.check(cleanHtml).notSatisfies(textIncludes("draft-background"))
			})
			o.test("when external content is not blocked and background attribute is relative it is replaced", function () {
				const plainHtml = '<table><tr><td background="relative"> ....</td></tr></table>'
				const { html: cleanHtml, blockedExternalContent } = htmlSanitizer.sanitizeHTML(plainHtml, {
					blockExternalContent: false,
				})
				o.check(blockedExternalContent).equals(0)
				o.check(cleanHtml).satisfies(textIncludes(`background="${replacementImageUrl}"`))
				o.check(cleanHtml).notSatisfies(textIncludes("relative"))
				o.check(cleanHtml).notSatisfies(textIncludes("draft-background"))
			})
			o.test("srcset attribute", function () {
				const plainHtml =
					'<img srcset="https://tutanota.com/image1.jpg 1x, https://tutanota.com/image2.jpg 2x, https://tutanota.com/image3.jpg 3x" src="https://tutanota.com/image.jpg">'
				const cleanHtml = htmlSanitizer.sanitizeHTML(plainHtml, {
					blockExternalContent: true,
				})
				o.check(cleanHtml.blockedExternalContent).equals(2)

				o.check(
					cleanHtml.html
						.split(" ")
						.some(
							(e) =>
								e === 'srcSet="https://tutanota.com/image1.jpg 1x, https://tutanota.com/image2.jpg 2x, https://tutanota.com/image3.jpg 3x"' ||
								e === 'srcset="https://tutanota.com/image1.jpg 1x, https://tutanota.com/image2.jpg 2x, https://tutanota.com/image3.jpg 3x"',
						),
				).equals(false)
				o.check(cleanHtml.html).satisfies(
					textIncludes(`draft-srcset="https://tutanota.com/image1.jpg 1x, https://tutanota.com/image2.jpg 2x, https://tutanota.com/image3.jpg 3x`),
				)
				o.check(cleanHtml.html).satisfies(textIncludes(`src="${replacementImageUrl}"`))
			})
			o.test("detect images and set maxWidth=100px for placeholder images", function () {
				let result = htmlSanitizer.sanitizeHTML('<img src="https://emailprivacytester.com/cb/510828b5a8f43ab5">', {
					blockExternalContent: true,
				})
				o.check(result.blockedExternalContent).equals(1)
				o.check(result.html).satisfies(textIncludes(`src="${replacementImageUrl}"`))
				o.check(result.html.includes('style="max-width: 100px;')).equals(true)
			})
			o.test("detect figure", function () {
				let inputElement = '<figure src="https://tutanota.com/images/favicon/favicon.ico" type="image">'
				let result = htmlSanitizer.sanitizeHTML(inputElement, {
					blockExternalContent: true,
				})
				o.check(result.blockedExternalContent).equals(1)
				o.check(result.html.split(" ").some((e) => e === 'src="https://tutanota.com')).equals(false)
				o.check(result.html.includes('draft-src="https://tutanota.com')).equals(true)
			})
			o.test("detect video posters", function () {
				let result = htmlSanitizer.sanitizeHTML(
					'<video poster="https://emailprivacytester.com/cb/04e69deda1be1c37/video_poster" height="1" width="1"></video>',
					{
						blockExternalContent: true,
					},
				)
				o.check(result.blockedExternalContent).equals(1)
				o.check(result.html).satisfies(textIncludes(`poster="${replacementImageUrl}"`))
			})
			o.test("when blocking external content it removes list-style-image", function () {
				let result = htmlSanitizer.sanitizeHTML(
					'<ul style="list-style-image: url(http://www.heise.de/icons/ho/heise_online_logo_top.gif);"><li>Zeile 1</li></ul>',
					{
						blockExternalContent: true,
					},
				)
				o.check(result.blockedExternalContent).equals(1)
				o.check(result.html).notSatisfies(textIncludes("list-style-image"))
			})
			o.test("detect style content urls", function () {
				let result = htmlSanitizer.sanitizeHTML('<div style="content: url(http://www.heise.de/icons/ho/heise_online_logo_top.gif)"></div>', {
					blockExternalContent: true,
				})
				o.check(result.blockedExternalContent).equals(1)

				o.check(result.html).satisfies(textIncludes(`content: url(&quot;${replacementImageUrl}&quot;)`))
				// do not modify non url content
				result = htmlSanitizer.sanitizeHTML('<div style="content: blabla"> </div >', {
					blockExternalContent: true,
				})
				o.check(result.blockedExternalContent).equals(0)
				o.check(result.html.includes("content: blabla")).equals(true)
			})
			o.test("detect style cursor images", function () {
				let result = htmlSanitizer.sanitizeHTML('<div style="cursor:url(https://tutanota.com/images/favicon/favicon.ico),auto;" ></div>', {
					blockExternalContent: true,
				})
				o.check(result.blockedExternalContent).equals(1)
				o.check(result.html).equals('<div style=""></div>')
				o.check(result.html.includes("cursor:")).equals(false)
				result = htmlSanitizer.sanitizeHTML(
					'<div style="cursor:url(https://tutanota.com/images/favicon/favicon2.ico),url(https://tutanota.com/images/favicon/favicon.ico),auto;"></div>',
					{
						blockExternalContent: false,
					},
				)
				o.check(result.blockedExternalContent).equals(0)
				o.check(result.html).equals(
					'<div style="cursor:url(https://tutanota.com/images/favicon/favicon2.ico),url(https://tutanota.com/images/favicon/favicon.ico),auto;"></div>',
				)
			})
			o.test("detect style filter files", function () {
				let result = htmlSanitizer.sanitizeHTML('<div style="filter:url(https://tutanota.com/images/favicon/favicon.ico);" ></div>', {
					blockExternalContent: true,
				})
				o.check(result.blockedExternalContent).equals(1)
				o.check(result.html.includes("filter:")).equals(false)
				result = htmlSanitizer.sanitizeHTML('<div style="filter:url(https://tutanota.com/images/favicon/favicon.ico);" ></div>', {
					blockExternalContent: false,
				})
				o.check(result.blockedExternalContent).equals(0)
				o.check(result.html).equals('<div style="filter:url(https://tutanota.com/images/favicon/favicon.ico);"></div>')
			})
			o.test("detect style element", function () {
				let result = htmlSanitizer.sanitizeHTML("<div><style>@import url(https://fonts.googleapis.com/css?family=Diplomata+SC);</style></div>", {
					blockExternalContent: true,
				})
				o.check(result.blockedExternalContent).equals(0)
				o.check(result.html).equals("<div></div>")
				result = htmlSanitizer.sanitizeHTML("<div><style>@import url(https://fonts.googleapis.com/css?family=Diplomata+SC);</style></div>", {
					blockExternalContent: false,
				})
				o.check(result.blockedExternalContent).equals(0)
				o.check(result.html).equals("<div></div>")
			})
			o.test("replace images and links", function () {
				let result = htmlSanitizer.sanitizeHTML(
					'<html><img src="https://localhost/1.png"><img src="https://localhost/2.png"><img src="https://localhost/3.png"><img src="https://localhost/4.png"><img src="https://localhost/5.png"><img src="https://localhost/6.png"><img src="https://localhost/7.png"><img src="https://localhost/8.png"><img src="https://localhost/9"><a href="http://localhost/index.html"></a> </html>',
					{
						blockExternalContent: true,
					},
				)
				o.check(result.blockedExternalContent).equals(9)
				// do not replace links
				o.check(
					result.html.includes('<a target="_blank" rel="noopener noreferrer" href="http://localhost/index.html">') ||
						result.html.includes('<a href="http://localhost/index.html" rel="noopener noreferrer" target="_blank">'),
				).equals(true)
			})
			o.test("do not replace inline images", function () {
				const input = '<html><img src="cid:asbasdf-safd_d"><img src="data:image/svg+xml;utf8,sadfsdasdf"></html>'
				const result = htmlSanitizer.sanitizeHTML(input, {
					blockExternalContent: true,
				})
				o.check(result.blockedExternalContent).equals(0)
				o.check(result.inlineImageCids).deepEquals(["asbasdf-safd_d"])
				o.check(result.html.includes(`cid="asbasdf-safd_d"`)).equals(true)
				o.check(result.html.includes(`data:image/svg+xml;utf8,sadfsdasdf`)).equals(true)
				o.check(result.html.match(/max-width: 100%;/g)!.length).equals(2)
			})
			o.test("audio tag", function () {
				let result = htmlSanitizer.sanitizeHTML(
					'<audio controls autoplay loop muted preload src="https://www.w3schools.com/tags/horse.mp3" type="audio/mpeg"></audio>',
					{
						blockExternalContent: true,
					},
				)
				o.check(result.blockedExternalContent).equals(1)

				o.check(result.html).satisfies(textIncludes(`${replacementImageUrl}`))
			})
			o.test("embed tag", function () {
				let result = htmlSanitizer.sanitizeHTML('<div><embed src="https://tutanota.com/images/favicon/favicon.ico"></div>', {
					blockExternalContent: true,
				})
				o.check(result.blockedExternalContent).equals(1)
				o.check(result.html).equals("<div></div>")
				result = htmlSanitizer.sanitizeHTML('<div><embed src="https://tutanota.com/images/favicon/favicon.ico"></div>', {
					blockExternalContent: false,
				})
				o.check(result.blockedExternalContent).equals(0)
				o.check(result.html).equals("<div></div>")
			})
			o.test("disallow relative links", function () {
				o.check(htmlSanitizer.sanitizeHTML('<a href="relative">text</a>').html).equals('<a href="javascript:void(0)">text</a>')
				o.check(htmlSanitizer.sanitizeHTML('<a href="/relative">text</a>').html).equals('<a href="javascript:void(0)">text</a>')
			})
			o.test("allow relative links when asked", function () {
				o.check(
					htmlSanitizer.sanitizeHTML('<a href="relative">text</a>', {
						allowRelativeLinks: true,
					}).html,
				).equals('<a href="relative" rel="noopener noreferrer" target="_blank">text</a>')
				o.check(
					htmlSanitizer.sanitizeHTML('<a href="/relative">text</a>', {
						allowRelativeLinks: true,
					}).html,
				).equals('<a href="/relative" rel="noopener noreferrer" target="_blank">text</a>')
			})
			o.test("filter out position css", function () {
				o.check(htmlSanitizer.sanitizeHTML(`<div style="color: red; position: absolute;"></div>`).html).equals(`<div style="color: red;"></div>`)
				o.check(
					htmlSanitizer.sanitizeHTML(`<div style="color: red; position: absolute;"></div>`, {
						blockExternalContent: false,
					}).html,
				).equals(`<div style="color: red;"></div>`)
			})
			o.test("use image loading placeholder", function () {
				const r1 = htmlSanitizer.sanitizeHTML(`<img src="cid:123456">`, {
					usePlaceholderForInlineImages: true,
				}).html

				o.check(r1).satisfies(textIncludes(`src="${replacementImageUrl}"`))
				o.check(r1).satisfies(textIncludes(`style="max-width: 100%;"`))
				o.check(r1).satisfies(textIncludes(`cid="123456"`))
				o.check(r1).satisfies(textIncludes(`class="tutanota-placeholder"`))

				const r2 = htmlSanitizer.sanitizeHTML(`<img src="cid:123456">`).html
				o.check(r2).satisfies(textIncludes(`src="${replacementImageUrl}"`))
				o.check(r2).satisfies(textIncludes(`style="max-width: 100%;"`))
				o.check(r2).satisfies(textIncludes(`cid="123456"`))
				o.check(r2).satisfies(textIncludes(`class="tutanota-placeholder"`))
			})
			o.test("don't use image loading placeholder", function () {
				const result = htmlSanitizer.sanitizeHTML(`<img src="cid:123456">`, {
					usePlaceholderForInlineImages: false,
				}).html
				o.check(result).equals(`<img src="cid:123456" style="max-width: 100%;">`)
			})
			o.test("add max-width to images", function () {
				const result = htmlSanitizer.sanitizeHTML(`<img src="cid:123456">`, {
					usePlaceholderForInlineImages: false,
				}).html
				o.check(result).equals(`<img src="cid:123456" style="max-width: 100%;">`)
			})
			o.test("add max-width to images that have a given width", function () {
				const result = htmlSanitizer.sanitizeHTML(`<img src="cid:123456" style="width: 150px;">`, {
					usePlaceholderForInlineImages: false,
				}).html
				o.check(result).equals(`<img src="cid:123456" style="width: 150px; max-width: 100%;">`)
			})
			o.test("replace max-width for inline images", function () {
				const result = htmlSanitizer.sanitizeHTML(`<img src="cid:123456" style="max-width: 60%;">`, {
					usePlaceholderForInlineImages: false,
				}).html
				o.check(result).equals(`<img src="cid:123456" style="max-width: 100%;">`)
			})
			o.test("replace max-width for external images", function () {
				const result = htmlSanitizer.sanitizeHTML(`<img src="https://tutanota.com/images/favicon/favicon.ico">`, {
					blockExternalContent: false,
				}).html
				o.check(result).equals(`<img src="https://tutanota.com/images/favicon/favicon.ico" style="max-width: 100%;">`)
			})
			o.test("svg tag not removed", function () {
				const result = htmlSanitizer
					.sanitizeSVG(`<svg> <rect x="10" y="10" width="10" height="10">  <rect x="15" y="15" width="5" height="5"> </rect></rect> </svg>`)
					.html.trim()
				const element = document.createElement("div")
				element.innerHTML = result
				o.check(element.children[0]?.nodeName).equals("svg")
				o.check(element.children[0]?.children[0]?.nodeName.toLowerCase()).equals("rect")
				o.check(element.children[0]?.children[0]?.children[0]?.nodeName.toLowerCase()).equals("rect")
				o.check(element.children[0]?.children[0]?.getAttribute("x")).equals("10")
				o.check(element.children[0]?.children[0]?.getAttribute("y")).equals("10")
				o.check(element.children[0]?.children[0]?.getAttribute("width")).equals("10")
				o.check(element.children[0]?.children[0]?.getAttribute("height")).equals("10")
			})
			o.test("svg fragment should be removed in sanitizeSVG", function () {
				const result = htmlSanitizer.sanitizeSVG(`<rect x="10" y="10" width="10" height="10"> </rect>`).html.trim()
				o.check(result).equals(``)
			})
			o.test("svg fragment should be removed in sanitizeHTML", function () {
				const result = htmlSanitizer.sanitizeHTML(`<rect x="10" y="10" width="10" height="10"> </rect>`).html.trim()
				o.check(result).equals(``)
			})
			o.spec("inline attachment sanitization", function () {
				// note: this might fail in FF because it serializes svg tag differently
				o.test("svg with xss gets sanitized", function () {
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
						'<polygon id="triangle" points="0,0 0,50 50,0" fill="#009900" stroke="#004400"/>\n' +
						"</svg>"
					const xssDataFile = createDataFile("xss.svg", "image/svg+xml", stringToUtf8Uint8Array(svgDocumentWithXSS), "some-cid")
					const sanitizedDataFile = htmlSanitizer.sanitizeInlineAttachment(xssDataFile)
					o.check(sanitizedDataFile.cid).equals("some-cid")
					o.check(sanitizedDataFile.mimeType).equals("image/svg+xml")
					o.check(sanitizedDataFile.name).equals("xss.svg")
					const parser = new DOMParser()
					const cleanSvgTree = parser.parseFromString(utf8Uint8ArrayToString(sanitizedDataFile.data), "image/svg+xml")
					const expectedSvgTree = parser.parseFromString(expectedSvgDocument, "image/svg+xml")
					const serializer = new XMLSerializer()
					const reserializedClean = serializer.serializeToString(cleanSvgTree)
					const reserializedExpected = serializer.serializeToString(expectedSvgTree)
					o.check(reserializedClean).equals(reserializedExpected)
				})

				o.test("svg without xss gets left alone", function () {
					const svgDocumentWithoutXSS =
						'<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
						'<svg version="1.1" xmlns="http://www.w3.org/2000/svg">\n' +
						'<polygon stroke="#004400" fill="#009900" points="0,0 0,50 50,0" id="script"/>\n' +
						"</svg>"
					const noxssDataFile = createDataFile("no-xss.svg", "image/svg+xml", stringToUtf8Uint8Array(svgDocumentWithoutXSS), "some-other-cid")
					const sanitizedDataFile = htmlSanitizer.sanitizeInlineAttachment(noxssDataFile)
					const parser = new DOMParser()
					const cleanSvgTree = parser.parseFromString(utf8Uint8ArrayToString(sanitizedDataFile.data), "image/svg+xml")
					o.check(cleanSvgTree.getElementsByTagName("script").length).equals(0)
					const polys = cleanSvgTree.getElementsByTagName("polygon")
					o.check(polys.length).equals(1)
					o.check(polys[0].id).equals("script")
					o.check(polys[0].getAttributeNames().sort()).deepEquals(["stroke", "fill", "points", "id"].sort())
					o.check(polys[0].getAttribute("stroke")).equals("#004400")
					o.check(polys[0].getAttribute("fill")).equals("#009900")
					o.check(polys[0].getAttribute("points")).equals("0,0 0,50 50,0")

					const svgs = cleanSvgTree.getElementsByTagName("svg")
					o.check(svgs.length).equals(1)
					o.check(svgs[0].getAttributeNames().sort()).deepEquals(["version", "xmlns"])
					o.check(svgs[0].getAttribute("version")).equals("1.1")
					o.check(svgs[0].getAttribute("xmlns")).equals("http://www.w3.org/2000/svg")
				})

				o.test("invalid svg gets replaced with empty text", function () {
					// svg with invalid encoding (non-utf8) will and should be indistinguishable from just plain invalid svg
					// so we don't test invalid encoding separately
					const invalidSvg = '<svg/><?xml version="1.0">'
					const utf16DataFile = createDataFile("no-xss.svg", "image/svg+xml", stringToUtf8Uint8Array(invalidSvg), "third-cid")
					const sanitizedDataFile = htmlSanitizer.sanitizeInlineAttachment(utf16DataFile)
					o.check(sanitizedDataFile.data.length).equals(0)
				})

				o.test("non-svg inline attachments get left alone", function () {
					const someData = Uint8Array.from([84, 0, 89, 0, 80, 47, 0, 47, 0, 87])
					const someDataFile = createDataFile("no-xss.svg", "image/png", someData, "third-cid")
					const sanitizedDataFile = htmlSanitizer.sanitizeInlineAttachment(someDataFile)
					o.check(sanitizedDataFile.data).deepEquals(someData)
				})

				o.test("given an svg with an external href and external content is blocked it replaces the href", function () {
					const svg = '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><image href="https://example.com" /></svg>'
					const { fragment, blockedExternalContent } = htmlSanitizer.sanitizeFragment(svg, { blockExternalContent: true })
					o.check(blockedExternalContent).equals(1)
					const sanitizedImage = fragment.querySelector("image")!
					o.check(sanitizedImage.getAttribute("href")).equals(replacementImageUrl)
				})
				o.test("given an svg with an external href and external content is not blocked it leaves the href as is", function () {
					const svg = '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><image href="https://example.com" /></svg>'
					const { fragment, blockedExternalContent } = htmlSanitizer.sanitizeFragment(svg, { blockExternalContent: false })
					o.check(blockedExternalContent).equals(0)
					const sanitizedImage = fragment.querySelector("image")!
					o.check(sanitizedImage.getAttribute("href")).equals("https://example.com")
				})
				o.test("given an svg with a relative href it replaces the href", function () {
					const svg = '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><image href="relative" /></svg>'
					const { html: sanitizedHtml } = htmlSanitizer.sanitizeHTML(svg, { blockExternalContent: false })
					o.check(sanitizedHtml).notSatisfies(textIncludes('href="relative"'))
					o.check(sanitizedHtml).satisfies(textIncludes(`href="${replacementImageUrl}"`))
				})
			})
		}),
	)

	o.spec("getCssValueUrls", function () {
		o.test("when there's one double quoted URL it returns it", function () {
			o.check(getCssValueUrls(`url("blah")`)).deepEquals([`blah`])
		})

		o.test("when there's one double quoted URL with closing paren inside of it returns the whole URL", function () {
			o.check(getCssValueUrls(`url("blah)")`)).deepEquals([`blah)`])
		})

		o.test("when there are multiple URLs separated by space it returns them all", function () {
			o.check(getCssValueUrls(`url("blah1"), url("blah2"), url("blah3")`)).deepEquals([`blah1`, `blah2`, `blah3`])
		})

		o.test("when there are multiple URLs and one has a comma inside it returns them all", function () {
			o.check(getCssValueUrls(`url("blah1"), url("blah,2"), url("blah3")`)).deepEquals([`blah1`, `blah,2`, `blah3`])
		})

		o.test("when there's one URL and a linear-gradient it returns the url", function () {
			o.check(getCssValueUrls(`url("blah"), linear-gradient(to left, #333, #333 50%, #eee 75%, #333 75%)`)).deepEquals([`blah`])
			o.check(getCssValueUrls(`linear-gradient(to left, #333, #333 50%, #eee 75%, #333 75%), url("blah")`)).deepEquals([`blah`])
		})

		o.test("when there's one URL and a radial-gradient it returns the url", function () {
			o.check(getCssValueUrls(`url("blah"), radial-gradient(circle at 100%, #333, #333 50%, #eee 75%, #333 75%)`)).deepEquals([`blah`])
			o.check(getCssValueUrls(`radial-gradient(circle at 100%, #333, #333 50%, #eee 75%, #333 75%), url("blah")`)).deepEquals([`blah`])
		})
	})

	o.spec("parseSrcsetUrls", function () {
		o.test("given an empty string it returns an empty array", function () {
			o.check(parseSrcsetUrls("")).deepEquals([])
		})
		o.test("given a quantifier without a URL it returns the descriptor as a URL", function () {
			o.check(parseSrcsetUrls("2x")).deepEquals(["2x"])
			o.check(parseSrcsetUrls("example.com, 2x")).deepEquals(["example.com", "2x"])
			o.check(parseSrcsetUrls("2x, example.com")).deepEquals(["2x", "example.com"])
			o.check(parseSrcsetUrls("2x, 250w")).deepEquals(["2x", "250w"])
		})

		o.test("given one URL with no qualifiers it retuns that URL", function () {
			o.check(parseSrcsetUrls("example.jpg")).deepEquals(["example.jpg"])
		})
		o.test("given one URL with width descriptor it returns that URL", function () {
			o.check(parseSrcsetUrls("example.jpg 250w")).deepEquals(["example.jpg"])
		})
		o.test("given one URL with pixel density descriptor it returns that URL", function () {
			o.check(parseSrcsetUrls("example.jpg 2x")).deepEquals(["example.jpg"])
			o.check(parseSrcsetUrls("example.jpg 2.0x")).deepEquals(["example.jpg"])
			o.check(parseSrcsetUrls("example.jpg 2e10x")).deepEquals(["example.jpg"])
			o.check(parseSrcsetUrls("example.jpg 2e-10x")).deepEquals(["example.jpg"])
			o.check(parseSrcsetUrls("example.jpg 2e+10x")).deepEquals(["example.jpg"])
			o.check(parseSrcsetUrls("example.jpg 2E10x")).deepEquals(["example.jpg"])
			o.check(parseSrcsetUrls("example.jpg 2E-10x")).deepEquals(["example.jpg"])
			o.check(parseSrcsetUrls("example.jpg 2E+10x")).deepEquals(["example.jpg"])
		})

		o.test("given multiple URLs without descriptors it returns them all", function () {
			o.check(parseSrcsetUrls("example1.jpg, example2.jpg, example3.jpg")).deepEquals(["example1.jpg", "example2.jpg", "example3.jpg"])
		})
		o.test("given multiple URLs and one containing a comma it returns them all", function () {
			o.check(parseSrcsetUrls("example1.jpg, example,2.jpg, example3.jpg")).deepEquals(["example1.jpg", "example,2.jpg", "example3.jpg"])
			o.check(parseSrcsetUrls("example1.jpg 2x,example,2.jpg, example3.jpg")).deepEquals(["example1.jpg", "example,2.jpg", "example3.jpg"])
		})
		o.test("given multiple URLs with descriptors it returns them all", function () {
			o.check(parseSrcsetUrls("example1.jpg 250w, example2.jpg")).deepEquals(["example1.jpg", "example2.jpg"])
			o.check(parseSrcsetUrls("example1.jpg 2x, example2.jpg")).deepEquals(["example1.jpg", "example2.jpg"])
			o.check(parseSrcsetUrls("example1.jpg 3.0x,example2.jpg 100w,example3.jpg 2x")).deepEquals(["example1.jpg", "example2.jpg", "example3.jpg"])
		})

		o.test("given multiple image candidate strings it handles whitespace correctly ", function () {
			o.check(parseSrcsetUrls("example1.jpg, example2.jpg 100w,example3.jpg")).deepEquals(["example1.jpg", "example2.jpg", "example3.jpg"])
			o.check(parseSrcsetUrls(" example1.jpg , example2.jpg ")).deepEquals(["example1.jpg", "example2.jpg"])
			o.check(parseSrcsetUrls("example1.jpg,\u0009\u000A\u000C\u000D\u0020example2.jpg")).deepEquals(["example1.jpg", "example2.jpg"])
		})

		o.test("given values with a trailing comma it returns all URLs", function () {
			o.check(parseSrcsetUrls("example.jpg,")).deepEquals(["example.jpg"])
			o.check(parseSrcsetUrls("example.jpg 100w,")).deepEquals(["example.jpg"])
			o.check(parseSrcsetUrls("example1.jpg, example2.jpg,")).deepEquals(["example1.jpg", "example2.jpg"])
		})
	})
})
