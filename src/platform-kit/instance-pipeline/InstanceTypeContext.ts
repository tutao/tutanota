import { KeyDerivationContext } from "@tutao/crypto"
import { AppName, TypeId } from "@tutao/meta"
import { canonicalTypeId } from "./CanonicalId"

export interface InstanceTypeId {
	app: AppName
	id: TypeId
	name: string
}

export function makeKeyDerivationContext(instanceTypeId: InstanceTypeId): KeyDerivationContext {
	return {
		context: `${instanceTypeId.app}/${canonicalTypeId(instanceTypeId)}`,
		__brand: "KeyDerivationContext" as const,
	}
}
