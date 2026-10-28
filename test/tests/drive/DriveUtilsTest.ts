import o from "@tutao/otest"
import { ParsedShareUrl, parseShareUrl } from "../../../src/applications/drive-app/drive/view/DriveUtils"
import { base64ToBase64Url, base64ToUint8Array, base64UrlToBase64, stringToBase64 } from "../../../src/platform-kit/utils"

o.spec("DriveUtils", function () {
	o.spec("parseShareUrl", function () {
		o.test("a valid url without password returns KeyShareUrl params", function () {
			const shareId = "shareId"
			const authToken = base64ToBase64Url(stringToBase64("someAuthToken"))
			const shareKeyString = "someShareKey"
			const shareKey = base64ToUint8Array(shareKeyString)
			const hash = `#shareKey=${shareKeyString}`
			const params = { shareId, authToken }
			const result = parseShareUrl(params, hash)
			const expectedResult: ParsedShareUrl = { type: "key", url: { shareId, shareKey, authToken: base64UrlToBase64(authToken) } }
			o.check(result).deepEquals(expectedResult)
		})
		o.test("a valid url with password returns PasswordShareUrl params", function () {
			const shareId = "shareId"
			const authToken = base64ToBase64Url(stringToBase64("someAuthToken"))
			const shareKeyString = "someShareKey"
			const shareKey = base64ToUint8Array(shareKeyString)
			const saltUrl = base64ToBase64Url(stringToBase64("pfeffer"))
			const salt = base64ToUint8Array(base64UrlToBase64(saltUrl))
			const hash = `#shareKey=${shareKeyString}&salt=${saltUrl}`
			const params = { shareId, authToken }
			const result = parseShareUrl(params, hash)
			const expectedResult: ParsedShareUrl = { type: "password", url: { shareId, shareKey, salt, authToken: base64UrlToBase64(authToken) } }
			o.check(result).deepEquals(expectedResult)
		})
		o.test("an invalid url without shareKey returns null", function () {
			const shareId = "shareId"
			const authToken = base64ToBase64Url(stringToBase64("someAuthToken"))
			const saltUrl = base64ToBase64Url(stringToBase64("pfeffer"))
			const hash = `#shareKey=&salt=${base64ToBase64Url(stringToBase64(saltUrl))}` //hash does not have shareKey
			const params = { shareId, authToken }
			const result = parseShareUrl(params, hash)
			o.check(result).deepEquals(null)
		})
		o.test("an invalid authToken returns null", function () {
			const shareId = "shareId"
			const authToken = "someAuthToken" //not coverted to Base64Url
			const shareKeyString = "someShareKey"
			const saltUrl = base64ToBase64Url(stringToBase64("pfeffer"))
			const hash = `#shareKey=${shareKeyString}&salt=${saltUrl}`
			const params = { shareId, authToken }
			const result = parseShareUrl(params, hash)
			o.check(result).deepEquals(null)
		})
		o.test("if salt is an empty string, it returns null", function () {
			const shareId = "shareId"
			const authToken = base64ToBase64Url(stringToBase64("someAuthToken"))
			const shareKeyString = "someShareKey"
			const saltUrl = base64ToBase64Url(stringToBase64("")) // salt is an empty string
			const hash = `#shareKey=${shareKeyString}&salt=${saltUrl}`
			const params = { shareId, authToken }
			const result = parseShareUrl(params, hash)
			o.check(result).deepEquals(null)
		})
	})
})
