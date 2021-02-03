// @flow

import {assertMainOrNodeBoot} from "../api/common/Env"

assertMainOrNodeBoot()

export function mod(n: number, m: number): number {
	return ((n % m) + m) % m;
}