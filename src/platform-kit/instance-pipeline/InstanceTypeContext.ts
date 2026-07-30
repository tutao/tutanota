import { KeyDerivationContext } from "@tutao/crypto"
import { AppName, TypeId } from "@tutao/meta"
import { canonicalTypeId } from "./CanonicalId"

export interface InstanceTypeId {
	app: AppName
	id: TypeId
	name: string
}

export function makeKeyDerivationContext(instanceTypeId: InstanceTypeId): KeyDerivationContext {
	return `${instanceTypeId.app}/${canonicalTypeId(instanceTypeId)}` as KeyDerivationContext
}
