import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Random;

import javax.crypto.Cipher;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import junit.framework.TestCase;

import org.apache.commons.io.IOUtils;

import de.tutao.crypto.TutaoCipherInputStream;
import de.tutao.plugin.Crypto;

/**
 * Currently not runnable in the android project.
 */
public class TutaoCipherStreamTest extends TestCase {

	public void testEdgeCase() throws InvalidKeyException, InvalidAlgorithmParameterException, NoSuchAlgorithmException, NoSuchPaddingException, IOException {

		byte[] iv = new byte[Crypto.AES_KEY_LENGTH_BYTES];
		byte[] keyData = new byte[Crypto.AES_KEY_LENGTH_BYTES];
		new Random().nextBytes(keyData);
		SecretKeySpec key = new SecretKeySpec(keyData, "AES");
		for (int i = 0; i < 10000; i++) {
			byte[] plainText = new byte[i];
			// encrypt
			Cipher cipher = Cipher.getInstance(Crypto.AES_MODE_PADDING);
			IvParameterSpec params = new IvParameterSpec(iv);
			cipher.init(Cipher.ENCRYPT_MODE, key, params);
			InputStream encrypted = new TutaoCipherInputStream(new ByteArrayInputStream(plainText), cipher);
			byte[] encBytes = IOUtils.toByteArray(encrypted);

			ByteArrayOutputStream o = new ByteArrayOutputStream();
			o.write(iv);
			o.write(encBytes);
			byte[] b = o.toByteArray();

			ByteArrayInputStream enc = new ByteArrayInputStream(b);

			// decrypt
			IOUtils.read(enc, iv);
			params = new IvParameterSpec(iv);
			cipher.init(Cipher.DECRYPT_MODE, key, params);
			InputStream decrypted = new TutaoCipherInputStream(enc, cipher);

			byte[] decryptedBytes = IOUtils.toByteArray(decrypted);
			if (!Arrays.equals(plainText, decryptedBytes)) {
				System.out.println("len: " + i + ", encLen: " + encBytes.length + "decLen: " + decryptedBytes.length);
			}
			assertTrue(Arrays.equals(plainText, decryptedBytes));
		}

	}
}
