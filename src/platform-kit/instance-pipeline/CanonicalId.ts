import { InstanceTypeId } from "./InstanceTypeContext"
import { ValuePath } from "./EncryptionContextPath"
import { AppNameEnum } from "@tutao/meta"

export function canonicalTypeId(instanceTypeId: InstanceTypeId): number {
	// Since MailDetailsDraft is a temporary location for data that will eventually be put in a MailDetailsBlob, we
	// make sure that they are treated the same when encrypting/decrypting, that is, that they use the same ID. So,
	// we replace the instance type id of MailDetailsDraft (1290) with that of MailDetailsBlob (1298).
	if (instanceTypeId.app === AppNameEnum.Tutanota && instanceTypeId.id === 1290) {
		return 1298
	}
	return instanceTypeId.id
}

export function canonicalAttributeId(valuePath: ValuePath): string {
	// replace attribute id of MailDetailsDraft.details (1297) with that of MailDetailsBlob.details (1305)
	const path = valuePath.getPath()
	if (valuePath.app === AppNameEnum.Tutanota) {
		return path.replace(/^1297\//, "1305/")
	}
	return path
}
