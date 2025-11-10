// package de.tutao.common.crypto.symmetric;
//
// import com.google.inject.Inject;
// import com.google.inject.Singleton;
// import de.tutao.common.crypto.HMacFacade;
// import de.tutao.common.util.ArrayUtils;
// import de.tutao.common.util.NotNullByDefault;
// import de.tutao.common.util.TutaDbException;
//
// import javax.crypto.BadPaddingException;
// import javax.crypto.Cipher;
// import javax.crypto.IllegalBlockSizeException;
// import javax.crypto.NoSuchPaddingException;
// import javax.crypto.spec.IvParameterSpec;
// import javax.crypto.spec.SecretKeySpec;
// import java.security.InvalidAlgorithmParameterException;
// import java.security.InvalidKeyException;
// import java.security.NoSuchAlgorithmException;
// import java.util.Arrays;
//
// import static de.tutao.common.crypto.symmetric.SymmetricCipherUtils.*;
//
// /**
//  * This facade contains all methods for encryption/ decryption for Authenticated Encryption with Associated Data (AEAD).
//  *
//  * We use AES-CBC then HMAC-SHA-256, where the tag is computed over: version byte, IV, ciphertext and associated data.
//  */
// @NotNullByDefault
// @Singleton
// public class AeadFacade {
// 	private final SymmetricKeyDeriver symmetricKeyDeriver;
//
// 	@Inject
// 	public AeadFacade(SymmetricKeyDeriver symmetricKeyDeriver) {
// 		this.symmetricKeyDeriver = symmetricKeyDeriver;
// 	}
//
// 	byte[] encrypt(SecretKeySpec key, byte[] plainText, byte[] iv, boolean padding, byte[] associatedData) throws InvalidKeyException,
// 			InvalidAlgorithmParameterException, IllegalBlockSizeException, BadPaddingException, NoSuchAlgorithmException, NoSuchPaddingException {
//
// 		Cipher cipher = Cipher.getInstance((padding) ? AES_ENCRYPTION_MODE_PADDING : AES_ENCRYPTION_MODE_NO_PADDING);
// 		IvParameterSpec params = new IvParameterSpec(iv);
//
// 		var subKeys = symmetricKeyDeriver.deriveSubKeys(key, SymmetricCipherVersion.Aead);
// 		assert subKeys.authenticationKey() != null;
//
// 		//C ←  AESCBC,E (EK , IV , M)
// 		cipher.init(Cipher.ENCRYPT_MODE, subKeys.encryptionKey(), params);
// 		byte[] aesCbcCiphertext = cipher.doFinal(plainText);
//
// 		//T ← HMAC(AK , VAEAD ||IV ||C||AD
// 		byte[] unauthenticatedData = ArrayUtils.merge(SymmetricCipherVersion.Aead.asBytes(), iv, aesCbcCiphertext);
//
// 		byte[] tag = HMacFacade.hmac256(subKeys.authenticationKey(), unauthenticatedData, associatedData);
//
// 		//CT ← VAEAD ||IV ||C||T
// 		return ArrayUtils.merge(unauthenticatedData, tag);
// 	}
//
// 	byte[] decrypt(SecretKeySpec key, byte[] cipherText, boolean padding, byte[] associatedData) {
// 		try {
// 			var subKeys = symmetricKeyDeriver.deriveSubKeys(key, SymmetricCipherVersion.Aead);
// 			assert subKeys.authenticationKey() != null;
//
// 			//T ′ ← HMAC(AK , VAEAD ||IV ||C||AD)
// 			byte[] cipherTextWithoutMac = Arrays.copyOfRange(cipherText, 0, cipherText.length - SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES);
// 			byte[] authenticationTag = Arrays.copyOfRange(cipherText, cipherText.length - SYMMETRIC_AUTHENTICATION_TAG_LENGTH_BYTES, cipherText.length);
// 			HMacFacade.verifyHmacSha256(authenticationTag, subKeys.authenticationKey(), cipherTextWithoutMac, associatedData);
//
// 			byte[] iv = Arrays.copyOfRange(cipherTextWithoutMac, SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES,
// 					SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES + IV_LENGTH_BYTES);
// 			byte[] aesCbcCiphertext = Arrays.copyOfRange(cipherTextWithoutMac, SYMMETRIC_CIPHER_VERSION_PREFIX_LENGTH_BYTES + IV_LENGTH_BYTES,
// 					cipherTextWithoutMac.length);
//
// 			Cipher cipher = Cipher.getInstance((padding) ? AES_ENCRYPTION_MODE_PADDING : AES_ENCRYPTION_MODE_NO_PADDING);
// 			IvParameterSpec params = new IvParameterSpec(iv);
// 			cipher.init(Cipher.DECRYPT_MODE, subKeys.encryptionKey(), params);
// 			return cipher.doFinal(aesCbcCiphertext);
// 		} catch (InvalidKeyException | IllegalBlockSizeException | BadPaddingException | NoSuchAlgorithmException | NoSuchPaddingException
// 				 | InvalidAlgorithmParameterException e) {
// 			throw new TutaDbException(e);
// 		}
// 	}
// }
