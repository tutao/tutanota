import o from "ospec"
import {migrateConfig, migrateConfigV2to3} from "../../../src/misc/DeviceConfig"
import {PersistentCredentials} from "../../../src/misc/credentials/CredentialsProvider"

o.spec("DeviceConfig", function () {
	o.spec("migrateConfig", function () {
		o("migrating from v2 to v3 preserves internal logins", function () {
			const oldConfig: any = {
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
				],
			}

			migrateConfigV2to3(oldConfig)

			const expectedCredentialsAfterMigration: Array<Omit<PersistentCredentials, "databaseKey">> = [
				{
					credentialInfo: {
						login: "internal@example.com",
						userId: "internalUserId",
						type: "internal"
					},
					accessToken: "internalAccessToken",
					encryptedPassword: "internalEncPassword"
				},
				{
					credentialInfo: {
						login: "externalUserId",
						userId: "externalUserId",
						type: "external",
					},
					accessToken: "externalAccessToken",
					encryptedPassword: "externalEncPassword",
				}
			]

			o(oldConfig._credentials).deepEquals(expectedCredentialsAfterMigration)
		})
	})
})