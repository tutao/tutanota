package de.tutao.plugin;

import static de.tutao.plugin.Utils.bytesToBase64;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigInteger;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.RSAPrivateKeySpec;
import java.security.spec.RSAPublicKeySpec;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.apache.commons.io.IOUtils;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.net.Uri;
import android.util.Log;
import de.tutao.crypto.TutaoCipherInputStream;

public class Crypto extends CordovaPlugin {
	public static final String TEMP_DIR_ENCRYPTED = "temp/encrypted";
	public static final String TEMP_DIR_DECRYPTED = "temp/decrypted";
	private static final String PROVIDER = "BC";

	private final static int RSA_KEY_LENGTH_IN_BITS = 2048;
	private static final String RSA_ALGORITHM = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding";
	private final static int RSA_PUBLIC_EXPONENT = 65537;
	
	public static final String AES_MODE_PADDING = "AES/CBC/PKCS5Padding";
	public static final int AES_KEY_LENGTH = 128;
	public static final int AES_KEY_LENGTH_BYTES = AES_KEY_LENGTH / 8;
	
	private final static String TAG = "Crypto";
	private SecureRandom randomizer;
	
	
	static {
		// see: http://android-developers.blogspot.de/2013/08/some-securerandom-thoughts.html
		PRNGFixes.apply();
	}
	
	public Crypto() {
	}
	
	public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
		try {
			if (action.equals("seed")) {
				this.seed(callbackContext, de.tutao.plugin.Utils.base64ToBytes(args.getString(0)));
			} else if (action.equals("generateRsaKey")) {
				this.generateRsaKey(callbackContext);
			} else if (action.equals("rsaEncrypt")) {
				rsaEncrypt(callbackContext, args.getJSONObject(0), de.tutao.plugin.Utils.base64ToBytes(args.getString(1)));
			} else if (action.equals("rsaDecrypt")) {
				rsaDecrypt(callbackContext, args.getJSONObject(0), de.tutao.plugin.Utils.base64ToBytes(args.getString(1)));
			} else if (action.equals("random")) {
				this.random(callbackContext, args.getInt(0));
			} else if (action.equals("aesEncrypt")) {
				aesEncrypt(de.tutao.plugin.Utils.base64ToBytes(args.getString(0)), de.tutao.plugin.Utils.base64ToBytes(args.getString(1)), callbackContext);
			} else if (action.equals("aesEncryptFile")) {
				aesEncryptFile(de.tutao.plugin.Utils.base64ToBytes(args.getString(0)), args.getString(1), callbackContext);
			} else if (action.equals("aesDecrypt")) {
				aesDecrypt(de.tutao.plugin.Utils.base64ToBytes(args.getString(0)), de.tutao.plugin.Utils.base64ToBytes(args.getString(1)), callbackContext);
			} else if (action.equals("aesDecryptFile")) {
				aesDecryptFile(de.tutao.plugin.Utils.base64ToBytes(args.getString(0)), args.getString(1), callbackContext);
			} else {
				callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR));
				return false;
			}
			return true;
		} catch (Exception e) {
			Log.e(TAG, "error during " + action, e);
			callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, Utils.getStack(e)));
			return false;
		}
	}

	private void seed(CallbackContext callbackContext, byte[] seed) {
		this.randomizer = new SecureRandom(seed);
	}

	private void generateRsaKey(final CallbackContext callbackContext) {
		Utils.run(new Runnable() {
			public void run() {
				try {
					KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA", PROVIDER);
					generator.initialize(RSA_KEY_LENGTH_IN_BITS, randomizer);
					KeyPair keyPair = generator.generateKeyPair();
					callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, Crypto.this.keyPairToJson(keyPair)));
				} catch (Exception e) {
					Log.e(TAG, "Could not generate keys", e);
					callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, Utils.getStack(e)));
				}
			}
		});
	}
	
	private JSONObject privateKeyToJson(RSAPrivateCrtKey key) throws JSONException {
		JSONObject json = new JSONObject();
		json.put("version", 0);
		json.put("modulus", bytesToBase64(key.getModulus().toByteArray()));
		json.put("privateExponent", bytesToBase64(key.getPrivateExponent().toByteArray()));
		json.put("primeP", bytesToBase64(key.getPrimeP().toByteArray()));
		json.put("primeQ", bytesToBase64(key.getPrimeQ().toByteArray()));
		json.put("primeExponentP", bytesToBase64(key.getPrimeExponentP().toByteArray()));
		json.put("primeExponentQ", bytesToBase64(key.getPrimeExponentQ().toByteArray()));
		json.put("crtCoefficient", bytesToBase64(key.getCrtCoefficient().toByteArray()));
		return json;
	}
	
	private JSONObject publicKeyToJson(RSAPublicKey key) throws JSONException {
		JSONObject json = new JSONObject();
		json.put("version", 0);
		json.put("modulus", bytesToBase64(key.getModulus().toByteArray()));
		return json;
	}
	
	private JSONObject keyPairToJson(KeyPair keyPair) throws JSONException {
		JSONObject json = new JSONObject();
		json.put("publicKey", publicKeyToJson((RSAPublicKey) keyPair.getPublic()));
		json.put("privateKey", privateKeyToJson((RSAPrivateCrtKey) keyPair.getPrivate()));
		return json;
	}
	
	private PublicKey jsonToPublicKey(JSONObject json) throws JSONException {
		BigInteger modulus = new BigInteger(de.tutao.plugin.Utils.base64ToBytes(json.getString("modulus")));
		
		try {
			KeyFactory keyFactory = KeyFactory.getInstance("RSA");
			return keyFactory.generatePublic(new RSAPublicKeySpec(modulus, BigInteger.valueOf(RSA_PUBLIC_EXPONENT)));
		} catch(Exception e) {
			throw new RuntimeException(e);
		}
	}
	
	private PrivateKey jsonToPrivateKey(JSONObject json) throws JSONException, NoSuchAlgorithmException, InvalidKeySpecException {
		BigInteger modulus = new BigInteger(de.tutao.plugin.Utils.base64ToBytes(json.getString("modulus")));
		BigInteger privateExponent = new BigInteger(de.tutao.plugin.Utils.base64ToBytes(json.getString("privateExponent")));
		
		KeyFactory keyFactory = KeyFactory.getInstance("RSA");
		return keyFactory.generatePrivate(new RSAPrivateKeySpec(modulus, privateExponent));
	}
	
	private void random(final CallbackContext callbackContext, int nbrOfBytes) {
		byte[] bytes = new byte[nbrOfBytes];
		randomizer.nextBytes(bytes);
		callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, bytes));
	}
	
	/**
	 * Encrypts an aes key with RSA to a byte array.
	 * 
	 * @param publicKey
	 *            The key to use for the encryption.
	 * @param key
	 *            The key to encrypt
	 * @return The encrypted key
	 * @throws JSONException 
	 * @throws NoSuchPaddingException 
	 * @throws NoSuchProviderException 
	 * @throws NoSuchAlgorithmException 
	 * @throws InvalidKeyException 
	 * @throws BadPaddingException 
	 * @throws IllegalBlockSizeException 
	 */
	private void rsaEncrypt(CallbackContext callbackContext, JSONObject publicKeyJson, byte[] key) throws JSONException, NoSuchAlgorithmException, NoSuchProviderException, NoSuchPaddingException, InvalidKeyException, IllegalBlockSizeException, BadPaddingException {
		PublicKey publicKey = jsonToPublicKey(publicKeyJson);
		Cipher cipher = Cipher.getInstance(RSA_ALGORITHM, PROVIDER);
		cipher.init(Cipher.ENCRYPT_MODE, publicKey, this.randomizer);
		byte[] encrypted = cipher.doFinal(key);
		callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, bytesToBase64(encrypted)));
	}

	/**
	 * Decrypts a byte array with RSA to an AES key.
	 * 
	 * @param privateKey
	 *            The key to use for the decryption.
	 * @param encryptedKey
	 *            The data to decrypt
	 * @return The decrypted key
	 * @throws JSONException 
	 * @throws InvalidKeySpecException 
	 * @throws NoSuchAlgorithmException 
	 * @throws NoSuchPaddingException 
	 * @throws NoSuchProviderException 
	 * @throws InvalidKeyException 
	 * @throws BadPaddingException 
	 * @throws IllegalBlockSizeException 
	 */
	public void rsaDecrypt(CallbackContext callbackContext, JSONObject jsonPrivateKey, byte[] encryptedKey) throws NoSuchAlgorithmException, InvalidKeySpecException, JSONException, NoSuchProviderException, NoSuchPaddingException, InvalidKeyException, IllegalBlockSizeException, BadPaddingException {
		Cipher cipher;
		PrivateKey privateKey = jsonToPrivateKey(jsonPrivateKey);
		cipher = Cipher.getInstance(RSA_ALGORITHM, PROVIDER);
		cipher.init(Cipher.DECRYPT_MODE, privateKey, this.randomizer);
		byte[] decrypted = cipher.doFinal(encryptedKey);
		callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, bytesToBase64(decrypted)));
	}
	
	/**
	 * Converts the given byte array to a key.
	 * 
	 * @param bytes
	 *            The bytes representation of the key.
	 * @return The key.
	 */
	public static SecretKeySpec bytesToKey(byte[] key) {
		if (key.length != AES_KEY_LENGTH_BYTES) {
			throw new RuntimeException("invalid key length");
		}
		return new SecretKeySpec(key, "AES");
	}
	
	private void aesEncrypt(final byte[] key, final byte[] plainText, final CallbackContext callbackContext) {
		Utils.run(new Runnable() {
			public void run() {
				try {
					ByteArrayOutputStream out = new ByteArrayOutputStream();
					aesEncrypt(key, new ByteArrayInputStream(plainText), out);
					
					callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, bytesToBase64(out.toByteArray())));
				} catch (Exception e) {
					Log.e(TAG, "Could not aes encrypt data", e);
					callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, Utils.getStack(e)));
				}
			}
		});
	}
	
	private void aesEncryptFile(final byte[] key, final String fileUrl, final CallbackContext callbackContext) {
		Utils.run(new Runnable() {
			public void run() {
				try {
					File inputFile = Utils.uriToFile(webView.getContext(), fileUrl);
					Context context = webView.getContext();
					File encryptedDir = new File(Utils.getDir(context), TEMP_DIR_ENCRYPTED);
					encryptedDir.mkdirs();
					File outputFile = new File(encryptedDir, inputFile.getName());
					
					InputStream in = context.getContentResolver().openInputStream(Uri.parse(fileUrl));
					OutputStream out = new FileOutputStream(outputFile);
					aesEncrypt(key, in, out);
					
					callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, Utils.fileToUri(outputFile)));
				} catch (Exception e) {
					Log.e(TAG, "Could not aes encrypt data", e);
					callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, Utils.getStack(e)));
				}
			}

		});
	}
	
	private void aesEncrypt(final byte[] key, InputStream in, OutputStream out) throws NoSuchAlgorithmException, NoSuchPaddingException, InvalidKeyException, InvalidAlgorithmParameterException, IOException {
		InputStream encrypted = null;
		try {
			byte[] iv = new byte[AES_KEY_LENGTH / 8];
			randomizer.nextBytes(iv);
			Cipher cipher = Cipher.getInstance(AES_MODE_PADDING);
			IvParameterSpec params = new IvParameterSpec(iv);
			cipher.init(Cipher.ENCRYPT_MODE, bytesToKey(key), params);
			encrypted = new TutaoCipherInputStream(in, cipher);
			out.write(iv);
			IOUtils.copy(encrypted, out);
		} finally {
			IOUtils.closeQuietly(in);
			IOUtils.closeQuietly(encrypted);
			IOUtils.closeQuietly(out);
		}
	}
	
    private void aesDecrypt(final byte[] key, final byte[] cipherText, final CallbackContext callbackContext) {
		Utils.run(new Runnable() {
			public void run() {
				try {
					ByteArrayOutputStream out = new ByteArrayOutputStream();
					aesDecrypt(key, new ByteArrayInputStream(cipherText), out);
					
					callbackContext.sendPluginResult(new PluginResult(
							PluginResult.Status.OK, bytesToBase64(out.toByteArray())));
				} catch (Exception e) {
					Log.e(TAG, "Could not aes decrypt data", e);
					callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, Utils.getStack(e)));
				}
			}
		});
	}
    
    private void aesDecryptFile(final byte[] key, final String fileUrl, final CallbackContext callbackContext) {
		Utils.run(new Runnable() {
			public void run() {
				try {
					File inputFile = Utils.uriToFile(webView.getContext(), fileUrl);
					Context context = webView.getContext();
					File decryptedDir = new File(Utils.getDir(context), TEMP_DIR_DECRYPTED);
					decryptedDir.mkdirs();
					File outputFile = new File(decryptedDir, inputFile.getName());
					
					InputStream in = context.getContentResolver().openInputStream(Uri.parse(fileUrl));
					OutputStream out = new FileOutputStream(outputFile);
					aesDecrypt(key, in, out);
					
					callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, Utils.fileToUri(outputFile)));
				} catch (Exception e) {
					Log.e(TAG, "Could not aes decrypt data", e);
					callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, Utils.getStack(e)));
				}
			}
		});
	}
    
	private void aesDecrypt(final byte[] key, InputStream in, OutputStream out) throws IOException,
			NoSuchAlgorithmException, NoSuchPaddingException, InvalidKeyException, InvalidAlgorithmParameterException {
		InputStream decrypted = null;
		try {
			byte[] iv = new byte[AES_KEY_LENGTH_BYTES];
			IOUtils.read(in, iv);
			Cipher cipher = Cipher.getInstance(AES_MODE_PADDING);
			IvParameterSpec params = new IvParameterSpec(iv);
			cipher.init(Cipher.DECRYPT_MODE, bytesToKey(key), params);
			decrypted = new TutaoCipherInputStream(in, cipher);
			IOUtils.copy(decrypted, out);
		} finally {
			IOUtils.closeQuietly(in);
			IOUtils.closeQuietly(decrypted);
			IOUtils.closeQuietly(out);
		}
	}

}