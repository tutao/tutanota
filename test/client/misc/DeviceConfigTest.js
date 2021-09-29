// @flow
import o from "ospec"
import {migrateCredentials} from "../../../src/misc/DeviceConfig"
import {assertNotNull} from "../../../src/api/common/utils/Utils"

o.spec("DeviceConfig", function () {
	o.spec("migrateCredentials", function () {
		o("migrating from v2 to v3 preserves internal logins", function () {
			const oldConfig = {
				_version: 2,
				_credentials: [
					{
						mailAddress: "internal@example.com",
						userId: "internalUserId",
						accessToken: "internalAccessToken",
						encryptedPassword: "internalEncPassword",
					},
					{
						mailAddress: "externalUserId",
						userId: "externalUserId",
						accessToken: "externalAccessToken",
					},
				]
			}
			const migratedCredentials = migrateCredentials(oldConfig)
			o(Array.from(migratedCredentials.keys())).deepEquals(["internalUserId", "externalUserId"])
			o(JSON.parse(assertNotNull(migratedCredentials.get("internalUserId")))).deepEquals({
				login: "internal@example.com",
				userId: "internalUserId",
				accessToken: "internalAccessToken",
				type: "internal",
				encryptedPassword: "internalEncPassword",
			})
			o(JSON.parse(assertNotNull(migratedCredentials.get("externalUserId")))).deepEquals({
				login: "externalUserId",
				userId: "externalUserId",
				accessToken: "externalAccessToken",
				type: "external",
			})
		})
	})
})

