// @flow
import o from "ospec"
import {migrateCredentials} from "../../../src/misc/DeviceConfig"
import {assertNotNull} from "@tutao/tutanota-utils"

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
						encryptedPassword: "externalEncPassword",
					},
				]
			}
			const migratedCredentials = migrateCredentials(oldConfig)
			o(Array.from(migratedCredentials.keys())).deepEquals(["internalUserId", "externalUserId"])
			o(assertNotNull(migratedCredentials.get("internalUserId"))).deepEquals({
				credentialInfo: {
					login: "internal@example.com",
					userId: "internalUserId",
					type: "internal",
				},
				accessToken: "internalAccessToken",
				encryptedPassword: "internalEncPassword",
			})
			o(assertNotNull(migratedCredentials.get("externalUserId"))).deepEquals({
				credentialInfo: {
					login: "externalUserId",
					userId: "externalUserId",
					type: "external",
				},
				accessToken: "externalAccessToken",
				encryptedPassword: "externalEncPassword",
			})
		})
	})
})

