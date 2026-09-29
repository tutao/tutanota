import o from "@tutao/otest"
import { objToError } from "../../../../src/plugin-kit/sdk/PluginApi"
import { CustomerConfigPluginError, GeneralPluginError, HostApiPermissionDenied } from "../../../../src/plugin-kit/sdk/PluginError"

o.spec("PluginApiTest", () => {
	o.spec("objToError", () => {
		o.test("maps GeneralPluginError by name", () => {
			const err = objToError({ name: "GeneralPluginError", message: "m1" })
			o.check(err instanceof GeneralPluginError).equals(true)
			o.check(err.message).equals("m1")
			o.check(err.name).equals("GeneralPluginError")
		})

		o.test("maps HostApiPermissionDenied by name", () => {
			const err = objToError({ name: "HostApiPermissionDenied", message: "m2" })
			o.check(err instanceof HostApiPermissionDenied).equals(true)
			o.check(err.message).equals("m2")
		})

		o.test("maps CustomerConfigPluginError by name", () => {
			const err = objToError({ name: "CustomerConfigPluginError", message: "m3" })
			o.check(err instanceof CustomerConfigPluginError).equals(true)
			o.check(err.message).equals("m3")
		})

		o.test("falls back to a plain Error for an unknown name, but still overwrites the name", () => {
			const err = objToError({ name: "TotallyUnknownError", message: "m4" })
			o.check(err instanceof GeneralPluginError).equals(false)
			o.check(err instanceof HostApiPermissionDenied).equals(false)
			o.check(err instanceof CustomerConfigPluginError).equals(false)
			o.check(err instanceof Error).equals(true)
			o.check(err.message).equals("m4")
			o.check(err.name).equals("TotallyUnknownError")
		})

		o.test("copies stack and data when present", () => {
			const err: any = objToError({ name: "GeneralPluginError", message: "m", stack: "custom-stack", data: { foo: "bar" } })
			o.check(err.stack).equals("custom-stack")
			o.check(err.data).deepEquals({ foo: "bar" })
		})

		o.test("falls back to the constructed error's own stack when none is provided", () => {
			const err = objToError({ name: "GeneralPluginError", message: "m" })
			o.check(typeof err.stack).equals("string")
			o.check((err.stack ?? "").length > 0).equals(true)
		})
	})
})
