package de.tutao.langApi.types

class KtMath {
	companion object {
		fun pow(base: KtInt, p: KtInt): KtInt {
			return KtInt(Math.powExact(base.asKotlinInt(), p.asKotlinInt()))
		}
	}
}
