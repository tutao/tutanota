import o from "ospec/ospec.js"
import {Button} from "../../../../src/gui/base/Button"
import {client, DeviceType} from "../../../../src/misc/ClientDetector"

let device = client.device

o.spec("ButtonTest", function () {

	o.after(function () {
		client.device = device
	})
	o("default button width desktop", function () {
		client.device = DeviceType.DESKTOP
		var b = new Button("dummy")
		o(b.getWidth()).equals(44)
	})

	o("default button width mobile", function () {
		client.device = DeviceType.OTHER_MOBILE
		var b = new Button("dummy")
		o(b.getWidth()).equals(44)
	})
})
