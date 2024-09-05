import o from "@tutao/otest"
import {
	aes256RandomKey,
	bitArrayToUint8Array,
	generateEccKeyPair,
	hexToRsaPrivateKey,
	hexToRsaPublicKey,
	KeyPairType,
	pqKeyPairsToPublicKeys,
	rsaDecrypt,
	rsaEncrypt,
	RsaKeyPair,
} from "@tutao/tutanota-crypto"
import { PQFacade } from "../../../../../src/common/api/worker/facades/PQFacade.js"
import { WASMKyberFacade } from "../../../../../src/common/api/worker/facades/KyberFacade.js"
import { loadLibOQSWASM } from "../WASMTestUtils.js"
import { encodePQMessage } from "../../../../../src/common/api/worker/facades/PQMessage.js"

const privateKey = hexToRsaPrivateKey(
	"02008bb1bbcb2c6915c182b0c7cc93e1d8210181ffee4be4ae81f7a98fdba2d6e37cea72e2124ebb6b05d330ab1ddfbc6d85c9d1c90fc3b65bd9634c3b722fe77ab98f33cc28af975d51609e1c308324501d615cbb82836c33c2a240e00826ddf09460cee7a975c0607579d4f7b707e19287a1c754ba485e04aab664e44cae8fcab770b9bb5c95a271786aa79d6fa11dd21bdb3a08b679bd5f29fc95ab573a3dabcbd8e70aaec0cc2a817eefbc886d3eafea96abd0d5e364b83ccf74f4d18b3546b014fa24b90134179ed952209971211c623a2743da0c3236abd512499920a75651482b43b27c18d477e8735935425933d8f09a12fbf1950cf8a381ef5f2400fcf90200816022249104e1f94e289b6284b36d8f63ee1a31806852965be0d632fc25389ac02795e88eb254f4181bc2def00f7affa5627d6bf43e37e2a56c3cc20c4bbe058cf2d3e9fa759d1f78f3f5f797fd5195644e95fad1ecac235e51e72aa59476f374952b486e9db4b818157d362e3e638ee9edca329c4336df43fd3cd327f8542d1add9798af1d6a9e8cf8f54dd0b6a6f9ed9c3f5d803c220716757871e1442ef407ffe5df44c364bf57a60551b681173747b8df8e4138101f1d048cc1941a5d4c1fd3eda5bc96496eb1892477d811b845a7c9b3333e700989a1134e8f65edbf3a8332baa7195eb6aa33591b6ab41ec8215c6487979df5cf1b9736fd4fea73eee102000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e7a2e7a5cc651614fd17eb10765ef63462e5767745fc849e97095319d42f8cbb1485aba0f590b33208e666e949db0465e483a122467f771a986da6855abb148d0b5c1eefb08636d0aeb36b8ec161497cc9a64704f0976aceb33d09af5408ded1aec771b534f9a27fd9dc3303146ce98872915ed730ed9661eec46b8c0d6b6d37020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009a632cb2e0a17ee6e363e3e056e5170480a3790023e342cb221431be37d63e692ce572390a379cf470c8a9fa4251a0af84d746b79ff91f6dcf168417137150d93049098ef747a601825982cbbd1ac1c20b3f3ee97b25e1739c31b43e78fc1cd53134dc4e82ebf98c720c34852fbd2288370421b848575f4d054e1d1e66b47f4f02000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b09e8b48e56fd2859072135f4b129f62546228914b80fed239d1f756436f3a3c4faa98b2336bf0e6ded86771cc49beb1beab0b4b2a3bf8e20385e029e083b368d4579a9322a343da9ccadbe14edc527f5ef6754273fcd088e92c4a5d30934eeaccfcf05bbe17f66acc0055b92c72db229a50f3e2db40dda0b0c17e4b9cd3e3c30200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000088861ee6e7e1a7f8c1287a40ce56b3ae159b79caf7f166057fd35fd1984aead1d313eb982942d897088d4a52b606bd13b9632d7400112b0bcdcf596b9693e42ccb982acdb43a35c0abe63fd5af1a54312604fdbb365d5f2afefaad2b798d6869d6a3aa15fb8c75170f5b5fae4f72ef7089462c136c55673f12ebeab0119e97dd02000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d8538fe6ebe9514412692fc985f8fd62b237c51c160c3d49aeeafffa057f2feff8f29040a205895b61dfa3f6188851021dc9e50152f3ea69746f5eb491af4a6dde21db9fa2c6fa61198ea02d6b600ed4267c3871af686c8db12e4bcbaaaa552e157e66fda90d34fce11cfd0f5eea6fbb236818070fb3a13751ad408e4231f499",
)
const publicKey = hexToRsaPublicKey(
	"02008bb1bbcb2c6915c182b0c7cc93e1d8210181ffee4be4ae81f7a98fdba2d6e37cea72e2124ebb6b05d330ab1ddfbc6d85c9d1c90fc3b65bd9634c3b722fe77ab98f33cc28af975d51609e1c308324501d615cbb82836c33c2a240e00826ddf09460cee7a975c0607579d4f7b707e19287a1c754ba485e04aab664e44cae8fcab770b9bb5c95a271786aa79d6fa11dd21bdb3a08b679bd5f29fc95ab573a3dabcbd8e70aaec0cc2a817eefbc886d3eafea96abd0d5e364b83ccf74f4d18b3546b014fa24b90134179ed952209971211c623a2743da0c3236abd512499920a75651482b43b27c18d477e8735935425933d8f09a12fbf1950cf8a381ef5f2400fcf9",
)

export const RSA_TEST_KEYPAIR: RsaKeyPair = { keyPairType: KeyPairType.RSA, privateKey, publicKey }

o.spec("RsaPqPerformanceTest", function () {
	o.spec("perf", function () {
		const iterations = 1

		function formatNumber(x) {
			return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
		}

		o("pq", async function () {
			const kyberFacade = new WASMKyberFacade(await loadLibOQSWASM())
			const pqFacade: PQFacade = new PQFacade(kyberFacade)
			const bucketKey = bitArrayToUint8Array(aes256RandomKey())

			const senderIdentityKeyPair = generateEccKeyPair()
			const recipientKeys = await pqFacade.generateKeyPairs()

			let start = window.performance.now()
			let pubEncBucketKey
			for (let i = 0; i < iterations; i++) {
				const ephemeralKeyPair = generateEccKeyPair()
				pubEncBucketKey = await pqFacade.encapsulateAndEncode(senderIdentityKeyPair, ephemeralKeyPair, pqKeyPairsToPublicKeys(recipientKeys), bucketKey)
			}
			let end = window.performance.now()
			console.log(formatNumber((end - start) / iterations) + "ms per pq encryption")

			let decryptedBucketKey
			for (let i = 0; i < iterations; i++) {
				decryptedBucketKey = (await pqFacade.decapsulateEncoded(pubEncBucketKey, recipientKeys)).decryptedSymKeyBytes
			}
			end = window.performance.now()
			console.log(formatNumber((end - start) / iterations) + "ms per pq decryption")

			o(bucketKey).deepEquals(decryptedBucketKey)
		})

		o("rsa", async function () {
			const bucketKey = bitArrayToUint8Array(aes256RandomKey())

			const keyPair = RSA_TEST_KEYPAIR
			let seed = new Uint8Array(32)
			crypto.getRandomValues(seed)

			let start = window.performance.now()
			let pubEncBucketKey
			for (let i = 0; i < iterations; i++) {
				const ephemeralKeyPair = generateEccKeyPair()
				pubEncBucketKey = rsaEncrypt(keyPair.publicKey, bucketKey, seed)
			}
			let end = window.performance.now()
			console.log(formatNumber((end - start) / iterations) + "ms per rsa encryption")

			let decryptedBucketKey
			for (let i = 0; i < iterations; i++) {
				decryptedBucketKey = rsaDecrypt(keyPair.privateKey, pubEncBucketKey)
			}
			end = window.performance.now()
			console.log(formatNumber((end - start) / iterations) + "ms per rsa decryption")

			o(bucketKey).deepEquals(decryptedBucketKey)
		})
	})
})
