package de.tutao.langApi.types

class KtMath {
	companion object {
		fun pow(base: KtNumber, p: KtNumber): KtNumber {
			return KtNumber(Math.powExact(base.asKotlinInt(), p.asKotlinInt()))
		}
	}
}
