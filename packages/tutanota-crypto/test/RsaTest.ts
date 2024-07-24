import o from "@tutao/otest"
import { concat, hexToUint8Array, stringToUtf8Uint8Array, uint8ArrayToHex } from "@tutao/tutanota-utils"
import type { RsaKeyPair } from "../lib/index.js"
import { KeyPairType, random } from "../lib/index.js"
import {
	_getPSBlock,
	_keyArrayToHex,
	_padAndUnpadLeadingZeros,
	encode,
	hexToRsaPrivateKey,
	hexToRsaPublicKey,
	i2osp,
	mgf1,
	oaepPad,
	oaepUnpad,
	rsaDecrypt,
	rsaEncrypt,
	rsaPrivateKeyToHex,
	rsaPublicKeyToHex,
} from "../lib/encryption/Rsa.js"
import { SecureRandom } from "../lib/random/SecureRandom.js"
import { CryptoError } from "../lib/error.js"
import { parseBigInt } from "../lib/internal/crypto-jsbn-2012-08-09_1.js"

const originalRandom = random.generateRandomData

const privateKey = hexToRsaPrivateKey(
	"02008bb1bbcb2c6915c182b0c7cc93e1d8210181ffee4be4ae81f7a98fdba2d6e37cea72e2124ebb6b05d330ab1ddfbc6d85c9d1c90fc3b65bd9634c3b722fe77ab98f33cc28af975d51609e1c308324501d615cbb82836c33c2a240e00826ddf09460cee7a975c0607579d4f7b707e19287a1c754ba485e04aab664e44cae8fcab770b9bb5c95a271786aa79d6fa11dd21bdb3a08b679bd5f29fc95ab573a3dabcbd8e70aaec0cc2a817eefbc886d3eafea96abd0d5e364b83ccf74f4d18b3546b014fa24b90134179ed952209971211c623a2743da0c3236abd512499920a75651482b43b27c18d477e8735935425933d8f09a12fbf1950cf8a381ef5f2400fcf90200816022249104e1f94e289b6284b36d8f63ee1a31806852965be0d632fc25389ac02795e88eb254f4181bc2def00f7affa5627d6bf43e37e2a56c3cc20c4bbe058cf2d3e9fa759d1f78f3f5f797fd5195644e95fad1ecac235e51e72aa59476f374952b486e9db4b818157d362e3e638ee9edca329c4336df43fd3cd327f8542d1add9798af1d6a9e8cf8f54dd0b6a6f9ed9c3f5d803c220716757871e1442ef407ffe5df44c364bf57a60551b681173747b8df8e4138101f1d048cc1941a5d4c1fd3eda5bc96496eb1892477d811b845a7c9b3333e700989a1134e8f65edbf3a8332baa7195eb6aa33591b6ab41ec8215c6487979df5cf1b9736fd4fea73eee102000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e7a2e7a5cc651614fd17eb10765ef63462e5767745fc849e97095319d42f8cbb1485aba0f590b33208e666e949db0465e483a122467f771a986da6855abb148d0b5c1eefb08636d0aeb36b8ec161497cc9a64704f0976aceb33d09af5408ded1aec771b534f9a27fd9dc3303146ce98872915ed730ed9661eec46b8c0d6b6d37020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009a632cb2e0a17ee6e363e3e056e5170480a3790023e342cb221431be37d63e692ce572390a379cf470c8a9fa4251a0af84d746b79ff91f6dcf168417137150d93049098ef747a601825982cbbd1ac1c20b3f3ee97b25e1739c31b43e78fc1cd53134dc4e82ebf98c720c34852fbd2288370421b848575f4d054e1d1e66b47f4f02000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b09e8b48e56fd2859072135f4b129f62546228914b80fed239d1f756436f3a3c4faa98b2336bf0e6ded86771cc49beb1beab0b4b2a3bf8e20385e029e083b368d4579a9322a343da9ccadbe14edc527f5ef6754273fcd088e92c4a5d30934eeaccfcf05bbe17f66acc0055b92c72db229a50f3e2db40dda0b0c17e4b9cd3e3c30200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000088861ee6e7e1a7f8c1287a40ce56b3ae159b79caf7f166057fd35fd1984aead1d313eb982942d897088d4a52b606bd13b9632d7400112b0bcdcf596b9693e42ccb982acdb43a35c0abe63fd5af1a54312604fdbb365d5f2afefaad2b798d6869d6a3aa15fb8c75170f5b5fae4f72ef7089462c136c55673f12ebeab0119e97dd02000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d8538fe6ebe9514412692fc985f8fd62b237c51c160c3d49aeeafffa057f2feff8f29040a205895b61dfa3f6188851021dc9e50152f3ea69746f5eb491af4a6dde21db9fa2c6fa61198ea02d6b600ed4267c3871af686c8db12e4bcbaaaa552e157e66fda90d34fce11cfd0f5eea6fbb236818070fb3a13751ad408e4231f499",
)
const publicKey = hexToRsaPublicKey(
	"02008bb1bbcb2c6915c182b0c7cc93e1d8210181ffee4be4ae81f7a98fdba2d6e37cea72e2124ebb6b05d330ab1ddfbc6d85c9d1c90fc3b65bd9634c3b722fe77ab98f33cc28af975d51609e1c308324501d615cbb82836c33c2a240e00826ddf09460cee7a975c0607579d4f7b707e19287a1c754ba485e04aab664e44cae8fcab770b9bb5c95a271786aa79d6fa11dd21bdb3a08b679bd5f29fc95ab573a3dabcbd8e70aaec0cc2a817eefbc886d3eafea96abd0d5e364b83ccf74f4d18b3546b014fa24b90134179ed952209971211c623a2743da0c3236abd512499920a75651482b43b27c18d477e8735935425933d8f09a12fbf1950cf8a381ef5f2400fcf9",
)

const RSA_TEST_KEYPAIR: RsaKeyPair = { keyPairType: KeyPairType.RSA, privateKey, publicKey }

o.spec("RsaTest", function () {
	o.afterEach(function () {
		random.generateRandomData = originalRandom
	})

	o("hex key conversion", function () {
		const keyPair = RSA_TEST_KEYPAIR

		let hexPrivateKey = rsaPrivateKeyToHex(keyPair.privateKey)
		let hexPublicKey = rsaPublicKeyToHex(keyPair.publicKey)
		o(rsaPrivateKeyToHex(hexToRsaPrivateKey(hexPrivateKey))).equals(hexPrivateKey)
		o(rsaPublicKeyToHex(hexToRsaPublicKey(hexPublicKey))).equals(hexPublicKey)
	})
	o("invalid hex key conversion", function () {
		const hexPublicKey = "hello"

		o(() => hexToRsaPublicKey(hexPublicKey)).throws(CryptoError)
	})
	o("that hex keys have an even number of characters", function () {
		let privateKey: any[] = []
		privateKey.push(
			parseBigInt(
				"780377be21c903ecb8bf042e24b7d2860fd0da2c8d79aded94d2fe3bd89892ee161317529a7a011bb985899277bff28ba6b9a2ac7d63caccb5fa37a24e6faa2d69ed0b7ba10279a84172d3e00561d1efe234108dd4a3335da88483c282bb178af0168245c50330fcd988018e14962efbe8bca87bbc620945453c3b559f666472bb23447c6dea5591e89ec34f73e90702dca8837ba709e5065c6aaa12628a388e941174f0cd573935e5a80ec498031a4859101735e31b45765b9d071eac4b79b7a0cc859c5e035af853fce48fd848613ba4b3c09eb6b71a09f9dfc7ac1aaa50685f60e84f75afc3c0a13123136798aa328fe17397df2687d9d82f39121bb1ed01",
				16,
			),
		)
		privateKey.push(
			parseBigInt(
				"122c5441925422280281ca5c426b2391f16b2ade7c3de4bc8940ba06cdf1acae28e193328af9d699202abc7e556bd78a96209e25888747fa5fc4181097d808e8ff95499bdaf1c9025586d1d6a679fd9459a890a9297ddd155da353606cf36fc93639f25826512965e07adbe16bf4a200bb697609e6a8e1c67f897362afd48d792cbcadeaab3e9dda29f9abc49f4b5541a04233c522ab756d7b395f513788f645c1772d5f394a53d32b67e46b38f8af4b3dddc35c42b1272383965537ca62595a12f1438687aa136bc07fbe591bd91502046bf56535a6ebf69a177be25ca060cb01b3ba3c5f9a63ef0c4b31b68086e13c9ad2014c8c1487a28d06c90c9a03a0c1",
				16,
			),
		)
		privateKey.push(
			parseBigInt(
				"c3bd68ca645f97614cfbe768dc3a8930d6878de4132b09703c6c8b9a1215b337956a52d7cac9b7e28257eb64012be69d93b1c865bbdb68913d61469bf22d22061ac74c4b0c8be6a0abf40e788d71b63347f455dbeacb3b00f4ce697c55c4fe761d4cc5f2c6c7a614a34b10b8bd9e04d0ae6d2165e7c7f61e36afe554f57cae05",
				16,
			),
		)
		privateKey.push(
			parseBigInt(
				"9cf5f0248ab2071ef7c8aec0069b1422925c4a1df6b4a72504adac480dbdf0fe782e0661e47c7375df0e1ad5fa1b318089e88b053d8033dcb09aa922e111244bfb90757ab74b364813e0014d9d1f7e7af68b5d85f1454a4eb8244d86bd7fc00f4aacf39df38e5b8b96099e54d3f07d0cf567a057cc9f952966dab1dbd1b1b7cd",
				16,
			),
		)
		privateKey.push(
			parseBigInt(
				"1ed42c37044c11f99f3865a01c5f93cfff59e63d2fcfad72e1f16ea35b89d36a43bc35440b8a6dcddd1d9fd36663d5b4a7d86e69a786cd176305792b829f1d26bcfcfac52f3ab19e48b6edb88afe87e5d7c561e87b387b18917619231e1722c4d3a48de0c8f214f4572bb17c8750e60d400bac20f2ba89c70471fbbabfd75d49",
				16,
			),
		)
		privateKey.push(
			parseBigInt(
				"d03af67b8404eaad8acc12096eba0ddc4f8f6044a026ca17b23d3571e1c93b0e5d21b215eca9ae03920784529b9bb7f06f04b26a214d1380944a9a584b7e12493b544a86a2e484feda5f335b643783f45d6046928ba30111adf97b6065c63566140b9ea6cd96ee9c2050625ce74f04974c7a4d9e2d39090a0409de2b61e6039",
				16,
			),
		)
		privateKey.push(
			parseBigInt(
				"59b796421c14e90568543a263f10ca4a7c0873d8a9615f969fc328900e07f7106b30b3410e94ee40069052bcc15ec419c0937a71ab855242b746129bedc947a48deffb51ed99ea3255b3bf59bc1a4d3cea9163ef5d076c5e355b07134725903e49e4cdc48c5bd096b16d54aa0d0087bd939213134ffacf9a084fb04399d03a7e",
				16,
			),
		)
		o(_keyArrayToHex(privateKey).length % 2).equals(0)
	})
	o("rsa key roundtrip", function () {
		let keyPair = RSA_TEST_KEYPAIR

		let hexPrivateKey = rsaPrivateKeyToHex(keyPair.privateKey)
		o(hexPrivateKey).equals(rsaPrivateKeyToHex(hexToRsaPrivateKey(hexPrivateKey)))
		let hexPublicKey = rsaPublicKeyToHex(keyPair.publicKey)
		o(hexPublicKey).equals(rsaPublicKeyToHex(hexToRsaPublicKey(hexPublicKey)))
		let plain = hexToUint8Array("88888888888888888888888888888888") // = 16 byte sym key

		let encrypted = rsaEncrypt(keyPair.publicKey, plain, random.generateRandomData(32))
		let plainAgain = rsaDecrypt(keyPair.privateKey, encrypted)
		o(Array.from(plainAgain)).deepEquals(Array.from(plain))
	})
	o("rsa encrypt longer result", function () {
		// This input makes JSBN produce leading zeroes in byte output and we need to take this into account
		const keyPair = {
			keyPairType: KeyPairType.RSA,
			publicKey: {
				keyPairType: KeyPairType.RSA,
				version: 0,
				keyLength: 2048,
				modulus:
					"ALQ63xzGe/+6bo2fowZAa1t9fpTfrQjJr5xxCfrUI30/pQTnbSosUfRfCrXMtVkgmSgm32AQ0Q0fuWTueKn4us89iL7VcKQ1/WRhetZCi03q+KlOBLp6QX80T41PzXb+xbjQ8AhNtTluVrjC2MoykzegHY/Ks3XAd62RGt0mfvDj7+tgLm2n2UXTL1WXYnVLIjINaOUPmspm8ve9ot1uSjQuLCq3pmy4bNz4WIxuJiegVWwCIbxCuueimjP3OfYp9afunnRZIxcHeASxYSnmlxT2RYOKHNbHdVlzhbVsp9FZs4a2DrJDUr9CRiuh4am/NPwXMkS7UQXazJ0RBDQmAqE=",
				publicExponent: 65537,
			},
			privateKey: {
				version: 0,
				keyLength: 2048,
				modulus:
					"ALQ63xzGe/+6bo2fowZAa1t9fpTfrQjJr5xxCfrUI30/pQTnbSosUfRfCrXMtVkgmSgm32AQ0Q0fuWTueKn4us89iL7VcKQ1/WRhetZCi03q+KlOBLp6QX80T41PzXb+xbjQ8AhNtTluVrjC2MoykzegHY/Ks3XAd62RGt0mfvDj7+tgLm2n2UXTL1WXYnVLIjINaOUPmspm8ve9ot1uSjQuLCq3pmy4bNz4WIxuJiegVWwCIbxCuueimjP3OfYp9afunnRZIxcHeASxYSnmlxT2RYOKHNbHdVlzhbVsp9FZs4a2DrJDUr9CRiuh4am/NPwXMkS7UQXazJ0RBDQmAqE=",
				privateExponent:
					"Nr4S+qiHDVvRLI8qc0Gp2jY59noiEqNABeKHx3ob9XUZaG3qyH6BvhoIJMQy6Qlvu7Ri8Mjq1nOmWjPczrPP+haUrHIkLpx/hLffGalIqrgOI06hPQrZTgvThfaRT+1+nO5JmhwQSYtsJ952/qNx99lYYU6OR9vX/g4u/LEuqXfvluYLS+low9RizepoYnv+k5u8WLwekHFi9eyO6BK1f5RizSFbA5+qqOWl9cyI8jLtAfskLF6+v1fkHg6ZbxqbtiddRGSMAK4Z+HEKrsuUKqsxtkL+tYSxe2QvZm2mhsiJTrXrq+dBOAzy6FbrAdGR2l5Mwfqb+SuO+Tb+HO5lgQ==",
				primeP: "AOcqBtOGECvIbtvcYApoS92KEXge28NhtNRa97356nY+j+ibn1gN4AyGJS8GufvOv7mFq9m+eQZpLHOgQ0xXlXU3UnJVLN2eYbwrNc6vVOii6xMEXXolImtYrD5YLkAmvsP8NNIJCU5ntakXuAm461xdpZOvgIDmlI+WIiLvobzJ",
				primeQ: "AMeX8XCw2W/zE2z8GB1r4GpKfBUjNAfO9nEiRUdq1mXEd5MlRvZDi+4hlCKPHHrRgo7SZsQtl1rbBdWiTZdhkdD2UbEt1hNZ6NtgWZssrs+SIDtnOBg0wHHWUUlwkoaTzYcL984qlz2hn468FDBBvO7eR/Z+S3sQ5wSPTkL7dnsZ",
				primeExponentP:
					"LBRugs1QrhilUxV91t42gUM/u4ke3O33vnquPTK3y954MKHkS7UxoRG/a20779Fn6+eacoYIq/lIObA4xQj6fgSTmyu0x3nZJzmSJBx483eFnfW6IX2NR6z8A1NrVl5NCDBCnj6M4L+T+2+Db48sikttNHFF7s6JS6wUTFcnn0k=",
				primeExponentQ:
					"AMHOm4YWY3yeJq27+FqRRp9PZj9MKJiwcYKXiXf4mOjGpml+V/KG0lhPyLzqA/iKeeDfEyTJNF/nrzmrWPZ2qpWiqN6HqIiv1Dk4zKmt8KzjsmKcLs7qYjfnqJTMN6tv17GbgGtz1dnll76MiHn3S1MTCgOizP5aAkjeMls+O+T5",
				crtCoefficient:
					"KtVWWNvEmo0ZjSBsQBq9YhghylphP/88BIO0X2C3gH+07+U9laZEO7HiEvD15bbYwf2LKr0xeWiK5vuPdMGcvKmo3tmb4HPP5exddJ+Kpo1XVvOGV1NxiOQlDkhQqSo2be/EeHuNreKM8275drvdCcOuEg8QOMsrae2PCMbqE0w=",
			},
		}
		const seed = new Uint8Array([
			85, 187, 219, 138, 52, 2, 113, 97, 241, 224, 161, 107, 39, 121, 234, 31, 17, 93, 14, 185, 255, 173, 233, 244, 123, 159, 247, 166, 12, 49, 232, 214,
		])
		const plain = hexToUint8Array("88888888888888888888888888888888") // = 16 byte sym key

		const encrypted = rsaEncrypt(keyPair.publicKey, plain, seed)
		let plainAgain = rsaDecrypt(keyPair.privateKey, encrypted)
		o(Array.from(plainAgain)).deepEquals(Array.from(plain))
	})
	o("rsa test shorter result", function () {
		// This combination produces encrypted data with length of 254 and we pad have to pad it to 256
		// We use fixed keypair and salt to reproduce this error each time
		const keyPair = {
			keyPairType: KeyPairType.RSA,
			publicKey: {
				keyPairType: KeyPairType.RSA,
				version: 0,
				keyLength: 2048,
				modulus:
					"AKhUZJKI9TvMx4CiO764vWiUVVzhm/SLQZlkDQ37WuJkiK3mEgy1wbHEsXtXeZZ+ctTheADpryegsOWl2R4PA+yQOzywh6Q5PlRSCQz2Wvy2IG+jnpPepw+va2vRPH+ePwYJoSgNYFu0Vw+/GP/W458doVzhTZYiqfFWhBJCfxBhzgFwuliyfR7wUvDjPzoKqoSVgcKjFQdmGGd9zADIITMCCHebXXfppUKhFtzdCFjQu2QHTIc+/U8w4bbXwqFrn9fo5OQu8jF3+V/WFdVEQFl6TyhoV0VoQB0T5zcsN3lGoUMCWWTe61cyibP7jRHw+2BbBU4CKCvrBHNxg/jfW6k=",
				publicExponent: 65537,
			},
			privateKey: {
				version: 0,
				keyLength: 2048,
				modulus:
					"AKhUZJKI9TvMx4CiO764vWiUVVzhm/SLQZlkDQ37WuJkiK3mEgy1wbHEsXtXeZZ+ctTheADpryegsOWl2R4PA+yQOzywh6Q5PlRSCQz2Wvy2IG+jnpPepw+va2vRPH+ePwYJoSgNYFu0Vw+/GP/W458doVzhTZYiqfFWhBJCfxBhzgFwuliyfR7wUvDjPzoKqoSVgcKjFQdmGGd9zADIITMCCHebXXfppUKhFtzdCFjQu2QHTIc+/U8w4bbXwqFrn9fo5OQu8jF3+V/WFdVEQFl6TyhoV0VoQB0T5zcsN3lGoUMCWWTe61cyibP7jRHw+2BbBU4CKCvrBHNxg/jfW6k=",
				privateExponent:
					"Vmx99n466qkJBRJGenV/SeJesYFkAPo+g/LKgRM8ZmAXjLFDMyNef1btiNYwpwPlEUdxxYY1V7M5H682+ifba+nhgBdijP6W8dPssasKrBUWMjtff6whOfxmusSCu0MUOJVZGKdFgc/lo0AKJdC+rUMZRganPx4tAqvYw0dA1beKnboCbxy3V8IA2jSHQoq96lJ2rWuTGp+mWsQLqyqNB/jAzTiFXqxGca1qRWAUvCR+a0aV6vS3BSKaveyuJTGUkW2KKU5pJw+7K4onXgWuvkhMKg3OLqVW1zF6dUOf0ur1AC9dO03lrVSvKdOHiEUQsru6zB0KaLNyJKuTy9KxwQ==",
				primeP: "AOucuvOtNk/tA3p5PaceGMfu1o2XgUeF3bloSLBU+y3Gf0Wsd1syKIvm5dCjIF9vwIDDi0Zd16gk3sPF9xfuUJiTI/nXPbVOjzaFREenp9eJKX2EhrUNVFfg3yScR3xNNwAxoZoDQsBFwtJ9OCWfurmjSf5xqX9fvjrxdFNbeaJj",
				primeQ: "ALblOQAt3YMaXCnvJUdZCdzTN5TappttbRiOpiWotcJ4B/1M9OEbYSLecO12ZuJlZvFYvzXeVidRz2ECty+8uXKcw7wCptdxY3Lpn6kcGqs/pVel3/0OqZgpo8Qi4aYvRAjw9tyD+aZq85OuCf9l8WkeuMpsLC2P7zsFWp1iy6GD",
				primeExponentP:
					"KBp2S9G4w+PwyqDmWJKr3yQNCu61x4nGkq9oZ/MfCcyWjzJq4m/oLN/xUBDkCrqHxqMCCskgUvNro2EHzN/4ge/RmM4FJ94mTD5kv9mOnQYwtLehAiIxr/+Lm7yqAkNWUEciXYeejgGRxqgfrW/BpaVgi9mm4xJV28yLY0DXtEc=",
				primeExponentQ:
					"AKhxOCwIEcia0GL2kzjAsiqkhL4dGfBvuVgymKZ6WNu/vGv3Iljn5HA+uXaZ42uCxGpmt8Oe/227FOldnOTkRU9fPY28S3iEP3kn3RncfltVhKvSYxYnGN7BCsiq73MkeN5bPqAdFCHGwooycZa8hrevybT0J0PXGhcbeTcWNECN",
				crtCoefficient:
					"ahQsS+g8tOsUglzDmPeEtzXZz4Nm/4V14UZkLB8UoQsGwxPYorcH4TBpvtcS2Pm7i9VePeDR1SaaORf5mumuEskURg/7OW28H4GusMAk+kOigxmGrIMqJMpk6hy0nsgenSCX+iJ49ph2rUtm2kJovI+e64Ytkvajzteufb27XN0=",
			},
		}
		const plain = hexToUint8Array("88888888888888888888888888888888") // = 16 byte sym key

		const salt = new Uint8Array([
			120, 151, 119, 228, 21, 98, 99, 49, 233, 69, 169, 58, 158, 95, 153, 22, 23, 127, 216, 77, 109, 199, 208, 245, 38, 133, 107, 86, 23, 149, 223, 40,
		])
		const encrypted = rsaEncrypt(keyPair.publicKey, plain, salt)
		o(encrypted.length).equals(256)
		const plainAgain = rsaDecrypt(keyPair.privateKey, encrypted)
		o(Array.from(plainAgain)).deepEquals(Array.from(plain))
	})
	o("test randomizer adapter", function () {
		let a: number[] = []
		a.length = 100
		let seed = new Uint8Array(a.length)
		crypto.getRandomValues(seed)

		random.generateRandomData = (number) => seed

		let secureRandom = new SecureRandom()
		secureRandom.nextBytes(a)
		o(a).deepEquals(Array.from(seed))

		random.generateRandomData = (number) => {
			throw new CryptoError("test randomizer adapter")
		}

		let error: Error | null = null
		try {
			secureRandom.nextBytes([0])
		} catch (e) {
			error = e as Error
		}
		o(error?.message).equals("test randomizer adapter")
		o(error instanceof CryptoError).equals(true)
	})
	o("test decrypt with invalid key", function () {
		let rsaPrivateHexKey =
			"02008e8bf43e2990a46042da8168aebec699d62e1e1fd068c5582fd1d5433cee8c8b918799e8ee1a22dd9d6e21dd959d7faed8034663225848c21b88c2733c73788875639425a87d54882285e598bf7e8c83861e8b77ab3cf62c53d35e143cee9bb8b3f36850aebd1548c1881dc7485bb51aa13c5a0391b88a8d7afce88ecd4a7e231ca7cfd063216d1d573ad769a6bb557c251ad34beb393a8fff4a886715315ba9eac0bc31541999b92fcb33d15efd2bd50bf77637d3fc5ba1c21082f67281957832ac832fbad6c383779341555993bd945659d7797b9c993396915e6decee9da2d5e060c27c3b5a9bc355ef4a38088af53e5f795ccc837f45d0583052547a736f02002a7622214a3c5dda96cf83f0ececc3381c06ccce69446c54a299fccef49d929c1893ae1326a9fe6cc9727f00048b4ff7833d26806d40a31bbf1bf3e063c779c61c41b765a854fd1338456e691bd1d48571343413479cf72fa920b34b9002fbbbff4ea86a3042fece17683686a055411357a824a01f8e3b277dd54c690d59fd4c8258009707d917ce43d4a337dc58bb55394c4f87b902e7f78fa0abe35e35444bda46bfbc38cf87c60fbe5c4beff49f8e6ddbf50d6caafeb92a6ccef75474879bdb82c9c9c5c35611207dbdb7601c87b254927f4d9fd25ba7694987b5ca70c8184058a91e86cb974a2b7694d6bb08a349b953e4c9a017d9eecada49eb2981dfe10100c7905e44c348447551bea10787da3aa869bbe45f10cff87688e2696474bd18405432f4846dcee886d2a967a61c1adb9a9bc08d75cee678053bf41262f0d9882c230bd5289518569714b961cec3072ed2900f52c9cdc802ee4e63781a3c4acaee4347bd9ab701399a0b96cdf22a75501f7f232069e7f00f5649be5ac3d73edd970100b6dbc3e909e1b69ab3f5dd6a55d7cc68d2b803d3da16941410ab7a5b963e5c50316a52380d4b571633d870ca746b4d6f36e0a9d90cf96a2ddb9c61d5bc9dbe74473f0be99f3642100c1b8ad9d592c6a28fa6570ccbb3f7bb86be8056f76473b978a55d458343dba3d0dcaf152d225f20ccd384706dda9dd2fb0f5f6976e603e901002fd80cc1af8fc3d9dc9f373bf6f5fada257f46610446d7ea9326b4ddc09f1511571e6040df929b6cb754a5e4cd18234e0dc93c20e2599eaca29301557728afdce50a1130898e2c344c63a56f4c928c472f027d76a43f2f74b2966654e3df8a8754d9fe3af964f1ca5cbceae3040adc0ab1105ad5092624872b66d79bdc1ed6410100295bc590e4ea4769f04030e747293b138e6d8e781140c01755b9e33fe9d88afa9c62a6dc04adc0b1c5e23388a71249fe589431f664c7d8eb2c5bcf890f53426b7c5dd72ced14d1965d96b12e19ef4bbc22ef858ae05c01314a05b673751b244d93eb1b1088e3053fa512f50abe1da314811f6a3a1faeadb9b58d419052132e59010032611a3359d91ce3567675726e48aca0601def22111f73a9fea5faeb9a95ec37754d2e52d7ae9444765c39c66264c02b38d096df1cebe6ea9951676663301e577fa5e3aec29a660e0fff36389671f47573d2259396874c33069ddb25dd5b03dcbf803272e68713c320ef7db05765f1088473c9788642e4b80a8eb40968fc0d7c"
		// use an invalid key. value is changed: ---------||
		let rsaPublicHexKey =
			"02008e8bf43e2990a46042da8168aebed699d62e1e1fd068c5582fd1d5433cee8c8b918799e8ee1a22dd9d6e21dd959d7faed8034663225848c21b88c2733c73788875639425a87d54882285e598bf7e8c83861e8b77ab3cf62c53d35e143cee9bb8b3f36850aebd1548c1881dc7485bb51aa13c5a0391b88a8d7afce88ecd4a7e231ca7cfd063216d1d573ad769a6bb557c251ad34beb393a8fff4a886715315ba9eac0bc31541999b92fcb33d15efd2bd50bf77637d3fc5ba1c21082f67281957832ac832fbad6c383779341555993bd945659d7797b9c993396915e6decee9da2d5e060c27c3b5a9bc355ef4a38088af53e5f795ccc837f45d0583052547a736f"
		let privateKey = hexToRsaPrivateKey(rsaPrivateHexKey)
		let publicKey = hexToRsaPublicKey(rsaPublicHexKey)
		let plain = hexToUint8Array("88888888888888888888888888888888") // = 16 byte sym key

		let encrypted = rsaEncrypt(publicKey, plain, random.generateRandomData(32))

		o.check(() => rsaDecrypt(privateKey, encrypted)).throws(CryptoError)
	})
	o("test decrypt invalid data", function () {
		let rsaPrivateHexKey =
			"02008e8bf43e2990a46042da8168aebec699d62e1e1fd068c5582fd1d5433cee8c8b918799e8ee1a22dd9d6e21dd959d7faed8034663225848c21b88c2733c73788875639425a87d54882285e598bf7e8c83861e8b77ab3cf62c53d35e143cee9bb8b3f36850aebd1548c1881dc7485bb51aa13c5a0391b88a8d7afce88ecd4a7e231ca7cfd063216d1d573ad769a6bb557c251ad34beb393a8fff4a886715315ba9eac0bc31541999b92fcb33d15efd2bd50bf77637d3fc5ba1c21082f67281957832ac832fbad6c383779341555993bd945659d7797b9c993396915e6decee9da2d5e060c27c3b5a9bc355ef4a38088af53e5f795ccc837f45d0583052547a736f02002a7622214a3c5dda96cf83f0ececc3381c06ccce69446c54a299fccef49d929c1893ae1326a9fe6cc9727f00048b4ff7833d26806d40a31bbf1bf3e063c779c61c41b765a854fd1338456e691bd1d48571343413479cf72fa920b34b9002fbbbff4ea86a3042fece17683686a055411357a824a01f8e3b277dd54c690d59fd4c8258009707d917ce43d4a337dc58bb55394c4f87b902e7f78fa0abe35e35444bda46bfbc38cf87c60fbe5c4beff49f8e6ddbf50d6caafeb92a6ccef75474879bdb82c9c9c5c35611207dbdb7601c87b254927f4d9fd25ba7694987b5ca70c8184058a91e86cb974a2b7694d6bb08a349b953e4c9a017d9eecada49eb2981dfe10100c7905e44c348447551bea10787da3aa869bbe45f10cff87688e2696474bd18405432f4846dcee886d2a967a61c1adb9a9bc08d75cee678053bf41262f0d9882c230bd5289518569714b961cec3072ed2900f52c9cdc802ee4e63781a3c4acaee4347bd9ab701399a0b96cdf22a75501f7f232069e7f00f5649be5ac3d73edd970100b6dbc3e909e1b69ab3f5dd6a55d7cc68d2b803d3da16941410ab7a5b963e5c50316a52380d4b571633d870ca746b4d6f36e0a9d90cf96a2ddb9c61d5bc9dbe74473f0be99f3642100c1b8ad9d592c6a28fa6570ccbb3f7bb86be8056f76473b978a55d458343dba3d0dcaf152d225f20ccd384706dda9dd2fb0f5f6976e603e901002fd80cc1af8fc3d9dc9f373bf6f5fada257f46610446d7ea9326b4ddc09f1511571e6040df929b6cb754a5e4cd18234e0dc93c20e2599eaca29301557728afdce50a1130898e2c344c63a56f4c928c472f027d76a43f2f74b2966654e3df8a8754d9fe3af964f1ca5cbceae3040adc0ab1105ad5092624872b66d79bdc1ed6410100295bc590e4ea4769f04030e747293b138e6d8e781140c01755b9e33fe9d88afa9c62a6dc04adc0b1c5e23388a71249fe589431f664c7d8eb2c5bcf890f53426b7c5dd72ced14d1965d96b12e19ef4bbc22ef858ae05c01314a05b673751b244d93eb1b1088e3053fa512f50abe1da314811f6a3a1faeadb9b58d419052132e59010032611a3359d91ce3567675726e48aca0601def22111f73a9fea5faeb9a95ec37754d2e52d7ae9444765c39c66264c02b38d096df1cebe6ea9951676663301e577fa5e3aec29a660e0fff36389671f47573d2259396874c33069ddb25dd5b03dcbf803272e68713c320ef7db05765f1088473c9788642e4b80a8eb40968fc0d7c"
		let rsaPublicHexKey =
			"02008e8bf43e2990a46042da8168aebec699d62e1e1fd068c5582fd1d5433cee8c8b918799e8ee1a22dd9d6e21dd959d7faed8034663225848c21b88c2733c73788875639425a87d54882285e598bf7e8c83861e8b77ab3cf62c53d35e143cee9bb8b3f36850aebd1548c1881dc7485bb51aa13c5a0391b88a8d7afce88ecd4a7e231ca7cfd063216d1d573ad769a6bb557c251ad34beb393a8fff4a886715315ba9eac0bc31541999b92fcb33d15efd2bd50bf77637d3fc5ba1c21082f67281957832ac832fbad6c383779341555993bd945659d7797b9c993396915e6decee9da2d5e060c27c3b5a9bc355ef4a38088af53e5f795ccc837f45d0583052547a736f"
		let privateKey = hexToRsaPrivateKey(rsaPrivateHexKey)
		let publicKey = hexToRsaPublicKey(rsaPublicHexKey)
		let plain = hexToUint8Array("88888888888888888888888888888888") // = 16 byte sym key

		let encrypted = rsaEncrypt(publicKey, plain, random.generateRandomData(32))

		o.check(() => rsaDecrypt(privateKey, concat(encrypted, stringToUtf8Uint8Array("hello")))).throws(CryptoError)
	})

	/********************************* OAEP *********************************/
	o("_getPSBlock ", function () {
		o(Array.from(_getPSBlock(new Uint8Array([10, 20, 30]), 80))).deepEquals([0, 0, 0, 0, 0, 1, 10, 20, 30])
	})
	o("oaep pad ", function () {
		let value = [1, 2, 3, 4]
		// random seed and resulting block taken from Java reference test debugging
		let seed = [
			105, 117, -108, -12, 80, 20, -84, -108, 113, 44, 74, 19, -126, -110, -84, 124, 58, 108, 86, 28, 5, -3, -65, -76, 80, -4, -66, 12, -14, -33, -84, 13,
		]
		let block = [
			95, -18, 112, -22, -48, -67, 43, 71, -43, 99, -112, 5, -36, 1, 120, -109, -119, -91, 113, 112, -42, -22, -31, 31, -17, 47, 32, -2, -112, -62, -53,
			51, 98, 99, -58, 62, 91, -24, 35, -37, 53, 66, -18, -68, -39, -38, 91, -124, -27, 68, -10, 39, 40, -45, 87, -64, -90, 58, -3, -39, 1, 89, -75, -88,
			121, -72, 40, -14, 88, 107, 7, -117, 70, 46, -7, -49, -117, 36, 98, 39, -128, 79, -63, -94, -81, -57, -71, -43, -13, 10, -69, -54, -99, 2, 21, -49,
			89, 84, 111, -121, 108, 23, -107, 55, -6, 62, -86, 74, 6, 9, 58, -71, 11, 96, -115, 120, -83, 30, -63, -125, 29, 67, -80, 15, 62, -111, -40, -6, 32,
			72, -5, -113, -66, -33, -91, -47, -42, -104, -61, 107, -53, 105, 78, 96, 100, 61, -94, -28, -38, -87, -44, -125, 29, 85, -108, 93, 121, -83, 63, 16,
			9, -10, 123, 86, -89, -42, 30, -51, -44, 30, -46, -84, 6, -87, -83, -117, -100, -10, 99, -53, -86, -38, -70, -116, 98, -57, -101, 60, 67, 27, -81,
			99, -44, 74, -74, -29, 85, 78, -17, -74, 76, 47, 97, 120, -40, 91, 91, -57, 35, -84, 28, -68, 80, 90, -91, 95, 24, -69, 96, -107, -31, -100, -33,
			54, -39, -118, -28, -23, -31, -80, -30, 94, -13, 26, 56, 41, -32, 50, 14, 63, -119, -105, 106, -99, 1, -35, -43, 82, 68, -4, -94, 46, 36, -33, 67,
		]

		// convert unsigned bytes from Java to numbers
		for (let i = 0; i < seed.length; i++) {
			if (seed[i] < 0) {
				seed[i] = 256 + seed[i]
			}
		}

		for (let i = 0; i < block.length; i++) {
			if (block[i] < 0) {
				block[i] = 256 + block[i]
			}
		}

		let padded = oaepPad(new Uint8Array(value), 2048, new Uint8Array(seed))
		o(Array.from(padded)).deepEquals(block)
	})
	o("oaep unpad ", function () {
		let value = [1, 2, 3, 4]
		// random seed and resulting block taken from Java reference test debugging
		let seed = [
			105, 117, -108, -12, 80, 20, -84, -108, 113, 44, 74, 19, -126, -110, -84, 124, 58, 108, 86, 28, 5, -3, -65, -76, 80, -4, -66, 12, -14, -33, -84, 13,
		]

		// convert unsigned bytes from Java to numbers
		for (let i = 0; i < seed.length; i++) {
			if (seed[i] < 0) {
				seed[i] = 256 + seed[i]
			}
		}

		let padded = oaepPad(new Uint8Array(value), 2048, new Uint8Array(seed))
		let unpadded = oaepUnpad(padded, 2048)
		o(Array.from(unpadded)).deepEquals(value)
	})
	o("oaep roundtrip", function () {
		let value = [136, 136, 136, 136, 136, 136, 136, 136, 136, 136, 136, 136, 136, 136, 136, 136]
		// random seed and resulting block taken from Java reference test debugging
		let seed = [
			162, 95, 112, 193, 175, 43, 224, 109, 31, 237, 128, 19, 223, 62, 165, 214, 25, 80, 79, 196, 236, 13, 67, 226, 44, 159, 220, 200, 189, 183, 227, 113,
		]
		let padded = oaepPad(new Uint8Array(value), 2048, new Uint8Array(seed))
		let unpadded = oaepUnpad(padded, 2048)
		o(Array.from(unpadded)).deepEquals(value)
	})

	/********************************* PSS *********************************/
	o("pss encode ", function () {
		// all values are from PssTest.java for verifying an identical implementation
		let message = hexToUint8Array("b25371601025fcc214c4a6ac877d8db9")
		let seed = hexToUint8Array("0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20")
		let padded = encode(message, 2048 - 1, seed)
		let expected = hexToUint8Array(
			"1133b67d48f8c52349f4aa9f72de0625cbc7b2eeffb23f0ad179683a491eb5f68465a61d0b271f9d26a1bb72553a37295f76624dba6dffd809a3a712e31de45c5b4d608e62f9dd58e3c44ec467b8ae570edd14030b79248d9f52271163c488d9ae57e660e473b904c96452508db14711d47d88b5d08be563727b22bc9860ca0c6b5bab789a4056d37f47f457db224de2516a41f7650784ae1033e579e840cf6138e577f9ba2b87fc31697db183178e38e5a2ff03d20f68c4bbc82f8f13fbd7a6a93fe9503701ee985dd53df4c36096b00d06d787001b4887f6134930b4782480de9a9097660193d69d34f1a94ca3df2c3dd3a479c562aea0f496ee6ddf2eefbc",
		)
		o(Array.from(padded)).deepEquals(Array.from(expected))
	})

	/********************************* RSA utils *********************************/
	o("i2osp ", function () {
		let i = parseInt("44332211", 16)
		let bytes = i2osp(i)
		o(Array.from(bytes)).deepEquals([68, 51, 34, 17])
	})
	o("_mgf1 ", function () {
		let bytes = new Uint8Array([1, 2, 3, 4])
		o(uint8ArrayToHex(mgf1(bytes, 32))).equals("e25f9f0a2c2664632d1be5e2f25b2794c371091b61eb762ad98861da3a2221ee")
		o(uint8ArrayToHex(mgf1(bytes, 63))).equals(
			"e25f9f0a2c2664632d1be5e2f25b2794c371091b61eb762ad98861da3a2221ee366dcb38806a930d052d8b7bac72a4e59bbe8a78792b4d975ed944dc0f64f6",
		)
		o(uint8ArrayToHex(mgf1(bytes, 64))).equals(
			"e25f9f0a2c2664632d1be5e2f25b2794c371091b61eb762ad98861da3a2221ee366dcb38806a930d052d8b7bac72a4e59bbe8a78792b4d975ed944dc0f64f6e5",
		)
		o(uint8ArrayToHex(mgf1(bytes, 65))).equals(
			"e25f9f0a2c2664632d1be5e2f25b2794c371091b61eb762ad98861da3a2221ee366dcb38806a930d052d8b7bac72a4e59bbe8a78792b4d975ed944dc0f64f6e5c3",
		)
	})
	o.spec("_padAndUnpadLeadingZeros", function () {
		o("remove one leading zero", function () {
			let padded = _padAndUnpadLeadingZeros(3, new Uint8Array([0, 2, 3, 4]))

			o(Array.from(padded)).deepEquals([2, 3, 4])
		})
		o("remove two leading zeros", function () {
			let padded = _padAndUnpadLeadingZeros(3, new Uint8Array([0, 0, 2, 3, 4]))

			o(Array.from(padded)).deepEquals([2, 3, 4])
		})
		o("add one leading zero", function () {
			let padded = _padAndUnpadLeadingZeros(4, new Uint8Array([2, 3, 4]))

			o(Array.from(padded)).deepEquals([0, 2, 3, 4])
		})
		o("add two leading zero", function () {
			let padded = _padAndUnpadLeadingZeros(5, new Uint8Array([2, 3, 4]))

			o(Array.from(padded)).deepEquals([0, 0, 2, 3, 4])
		})
		o("do nothing", function () {
			let padded = _padAndUnpadLeadingZeros(3, new Uint8Array([2, 3, 4]))

			o(Array.from(padded)).deepEquals([2, 3, 4])
		})
	})
})
