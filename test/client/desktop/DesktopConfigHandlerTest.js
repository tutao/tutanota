// @flow
import o from "ospec/ospec.js"
import mockery from "mockery"
import {DesktopConfigHandler} from "../../../src/desktop/DesktopConfigHandler.js"

mockery.registerSubstitute('fs-extra', 'fs-extra-mock')

o.spec('loadConfigTest', function () {
	console.log("HELLOHELLOHELLO")
	o.only("mocktest", function () {
		const conf = new DesktopConfigHandler()
	})

	// o("noClash", function () {
	// 	o(DesktopUtils.nonClobberingFileName(['bye.txt'], "hello.ext")).equals('hello.ext')
	// })

})
