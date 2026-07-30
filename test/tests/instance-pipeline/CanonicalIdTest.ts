import o from "@tutao/otest"
import { ValuePath } from "../../../src/platform-kit/instance-pipeline/EncryptionContextPath"
import { AppNameEnum } from "../../../src/platform-kit/meta"
import { canonicalAttributeId, canonicalTypeId } from "../../../src/platform-kit/instance-pipeline/CanonicalId"
import { InstanceTypeId } from "../../../src/platform-kit/instance-pipeline/InstanceTypeContext"

o.spec("CanonicalIdTest", () => {
	o.spec("canonicalTypeId", () => {
		o.test("replaces MailDetailsDraft type ID with MailDetailsBlob type ID", () => {
			const instanceTypeId: InstanceTypeId = {
				app: AppNameEnum.Tutanota,
				id: 1290,
				name: "",
			}
			o.check(canonicalTypeId(instanceTypeId)).equals(1298)
		})

		o.test("does not replace the ID in a different application", () => {
			const instanceTypeId: InstanceTypeId = {
				app: AppNameEnum.Sys,
				id: 1290,
				name: "",
			}
			o.check(canonicalTypeId(instanceTypeId)).equals(1290)
		})

		o.test("does not replace other IDs", () => {
			let instanceTypeId: InstanceTypeId = {
				app: AppNameEnum.Tutanota,
				id: 0,
				name: "",
			}

			for (let id = 0; id < 10000; id++) {
				if (id === 1290) continue
				instanceTypeId.id = id
				o.check(canonicalTypeId(instanceTypeId)).equals(id)
			}
		})
	})

	o.spec("canonicalAttributeId", () => {
		o.test("replaces MailDetailsDraft.details attribute ID with MailDetailsBlob.details attribute ID", () => {
			const valuePath = ValuePath.fromPatchPath(AppNameEnum.Tutanota, "1297/abcdef/1288")
			o.check(canonicalAttributeId(valuePath)).equals("1305/abcdef/1288")
		})

		o.test("does not replace the ID in a different application", () => {
			const valuePath = ValuePath.fromPatchPath(AppNameEnum.Sys, "1297/abcdef/1288")
			o.check(canonicalAttributeId(valuePath)).equals("1297/abcdef/1288")
		})
	})
})
