import o from "@tutao/otest"
import { urlify } from "../../../../src/applications/common/api/worker/Urlifier.js"

o.spec("UrlifierTest", function () {
	o.test(" validHtmlLinks", function () {
		// html links
		o.check(urlify("http://hello.it")).equals('<a href="http://hello.it" target="_blank" rel="noopener noreferrer">http://hello.it</a>')
		o.check(urlify("https://hello.it")).equals('<a href="https://hello.it" target="_blank" rel="noopener noreferrer">https://hello.it</a>')
		o.check(urlify("http://www.tutanota.de")).equals(
			'<a href="http://www.tutanota.de" target="_blank" rel="noopener noreferrer">http://www.tutanota.de</a>',
		)
		o.check(urlify("https://www.tutanota.de")).equals(
			'<a href="https://www.tutanota.de" target="_blank" rel="noopener noreferrer">https://www.tutanota.de</a>',
		)
		// email adresses
		o.check(urlify("bed-free@tutanota.de")).equals(
			'<a href="mailto:bed-free@tutanota.de" target="_blank" rel="noopener noreferrer">bed-free@tutanota.de</a>',
		)
	})
	o.test(" invalidHtmlLinks", function () {
		// twitter
		o.check(urlify("@de_tutanota")).equals("@de_tutanota")
		o.check(urlify("#de_tutanota")).equals("#de_tutanota")
		// no phone numbers
		o.check(urlify("0511202801-0")).equals("0511202801-0")
		o.check(urlify("+49511202801")).equals("+49511202801")
		o.check(urlify("(555)555-5555")).equals("(555)555-5555")
	})
	o.test(" htmlComments", function () {
		o.check(urlify(`<div><!--comment-->Actual markup</div>`)).equals(`<div><!--comment-->Actual markup</div>`)
		o.check(urlify(`<div><!---comment--->Actual markup</div>`)).equals(`<div><!---comment--->Actual markup</div>`)
		o.check(urlify(`<div><!------comment------>Actual markup</div>`)).equals(`<div><!------comment------>Actual markup</div>`)
	})

	o.test("has the workaround for doctype public", function () {
		const faultyHtml = `<!DOCTYPE html PUBLIC"-//W3C//DTD XHTML 1.0 Transitional//EN""https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd" >\\n<html lang="de" xml:lang="de" style="background-color: #F1F1F1"><div>Some text</div></html>`
		const expected = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\\n<html lang="de" xml:lang="de" style="background-color: #F1F1F1"><div>Some text</div></html>`
		o.check(urlify(faultyHtml)).equals(expected)

		const shortFaultyHtml = `<!DOCTYPE html PUBLIC><html lang="en" xml:lang="de"><div>http://hello.it</div></html>`
		const expectedShort = `<!DOCTYPE html><html lang="en" xml:lang="de"><div><a href="http://hello.it" target="_blank" rel="noopener noreferrer">http://hello.it</a></div></html>`
		o.check(urlify(shortFaultyHtml)).equals(expectedShort)
	})
})
