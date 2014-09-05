package de.tutao.plugin;

import java.math.BigInteger;
import java.nio.ByteBuffer;
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
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.RSAPrivateKeySpec;
import java.security.spec.RSAPublicKeySpec;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.SecretKeySpec;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Base64;
import android.util.Log;

public class Crypto extends CordovaPlugin {
	private static final String PROVIDER = "BC";
	//TODO increase
	private final static int KEY_LENGTH_IN_BITS = 2048;
	private static final String RSA_ALGORITHM = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding";
	private final static int PUBLIC_EXPONENT = 65537;
	private final static String TAG = "Crypto";
	private SecureRandom randomizer;
	
	static {
		// see: http://android-developers.blogspot.de/2013/08/some-securerandom-thoughts.html
		PRNGFixes.apply();
	}
	
	public Crypto() {
		this.randomizer = new SecureRandom();
	}
	
	public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
		if (action.equals("generateRsaKey")) {
			this.generateRsaKey(callbackContext);
			return true;
		} else if (action.equals("rsaEncrypt")) {
			byte[] encryptedKey = this.encryptAesKey(args.getJSONObject(0), Base64.decode(args.getString(1), Base64.DEFAULT));
			callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, Base64.encode(encryptedKey, Base64.DEFAULT)));
			return true;
		} else if (action.equals("rsaDecrypt")) {
			byte[] key = this.decryptAesKey(args.getJSONObject(0), Base64.decode(args.getString(1), Base64.DEFAULT));
			callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, Base64.encode(key, Base64.DEFAULT)));
			return true;
		} else if (action.equals("random")) {
			this.random(callbackContext, args.getInt(0));
			return true;
		}
		callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR));
		return false;
	}

	private void generateRsaKey(final CallbackContext callbackContext) {
		// creating a new Thread because cordova.getThreadPool().execute is too slow (takes 3 times as long).
		new Thread(new Runnable() {
			public void run() {
				try {
					KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA", PROVIDER);
					generator.initialize(KEY_LENGTH_IN_BITS, randomizer);
					KeyPair keyPair = generator.generateKeyPair();
					// TODO switch to bytes
					callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, Crypto.this.privateKeyToJson((RSAPrivateCrtKey)keyPair.getPrivate())));
				} catch (Exception e) {
					Log.e(TAG, "Could not generate keys", e);
					throw new RuntimeException(e);
				}
			}
		}).start();
	}
	
	private JSONObject privateKeyToJson(RSAPrivateCrtKey key) throws JSONException {
		JSONObject json = new JSONObject();
		json.put("version", 0);
		json.put("modulus", key.getModulus().toString());
		json.put("privateExponent", key.getPrivateExponent().toString());
		json.put("primeP", key.getPrimeP().toString());
		json.put("primeQ", key.getPrimeQ().toString());
		json.put("primeExponentP", key.getPrimeExponentP().toString());
		json.put("primeExponentQ", key.getPrimeExponentQ().toString());
		json.put("crtCoefficient", key.getCrtCoefficient().toString());
		return json;
	}
	
	private JSONObject publicKeyToJson(RSAPrivateCrtKey key) throws JSONException {
		JSONObject json = new JSONObject();
		json.put("version", 0);
		json.put("modulus", key.getModulus().toString());
		return json;
	}
	
	private PublicKey jsonToPublicKey(JSONObject json) throws JSONException {
		BigInteger modulus = new BigInteger(json.getString("modulus"));
		
		try {
			KeyFactory keyFactory = KeyFactory.getInstance("RSA");
			return keyFactory.generatePublic(new RSAPublicKeySpec(modulus, BigInteger.valueOf(PUBLIC_EXPONENT)));
		} catch(Exception e) {
			throw new RuntimeException(e);
		}
	}
	
	private PrivateKey jsonToPrivateKey(JSONObject json) throws JSONException {
		BigInteger modulus = new BigInteger(json.getString("modulus"));
		BigInteger privateExponent = new BigInteger(json.getString("privateExponent"));
//		BigInteger primeP = new BigInteger(json.getString("primeP"));
//		BigInteger primeQ = new BigInteger(json.getString("primeQ"));
//		BigInteger primeExponentP = new BigInteger(json.getString("primeExponentP"));
//		BigInteger primeExponentQ = new BigInteger(json.getString("primeExponentQ"));
//		BigInteger crtCoefficient = new BigInteger(json.getString("crtCoefficient"));
		
		try {
			KeyFactory keyFactory = KeyFactory.getInstance("RSA");
			return keyFactory.generatePrivate(new RSAPrivateKeySpec(modulus, privateExponent));
		} catch(Exception e) {
			throw new RuntimeException(e);
		}
	}
	
	/**
	 * Format: (2 byte length of number + n bytes BigInteger)
	 * 
	 * @param key
	 * @return
	 */
	private byte[] privateKeyToBytes(RSAPrivateCrtKey key) {
		byte[] modulus = key.getModulus().toByteArray();
		byte[] privateExponent = key.getPrivateExponent().toByteArray();
		byte[] primeP = key.getPrimeP().toByteArray();
		byte[] primeQ = key.getPrimeQ().toByteArray();
		byte[] primeExponentP = key.getPrimeExponentP().toByteArray();
		byte[] primeExponentQ = key.getPrimeExponentQ().toByteArray();
		byte[] crtCoefficient = key.getCrtCoefficient().toByteArray();
		ByteBuffer b = ByteBuffer.allocate(2 + modulus.length + 2
				+ privateExponent.length + 2 + primeP.length + 2
				+ primeQ.length + 2 + primeExponentP.length + 2
				+ primeExponentQ.length + 2 + crtCoefficient.length);
		addParamToBuffer(modulus, b);
		addParamToBuffer(privateExponent, b);
		addParamToBuffer(primeP, b);
		addParamToBuffer(primeQ, b);
		addParamToBuffer(primeExponentP, b);
		addParamToBuffer(primeExponentQ, b);
		addParamToBuffer(crtCoefficient, b);
		return b.array();
	}
	
	private static void addParamToBuffer(byte[] modulus, ByteBuffer b) {
		b.putShort((short) modulus.length);
		b.put(modulus);
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
	 */
	private byte[] encryptAesKey(JSONObject publicKeyJson, byte[] key) throws JSONException {
		PublicKey publicKey = jsonToPublicKey(publicKeyJson);
		// TODO assert key.length == 128
		Cipher cipher;
		try {
			cipher = Cipher.getInstance(RSA_ALGORITHM, PROVIDER);
			cipher.init(Cipher.ENCRYPT_MODE, publicKey);
			byte[] encrypted = cipher.doFinal(key);
			return encrypted;
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

	/**
	 * Decrypts a byte array with RSA to an AES key.
	 * 
	 * @param privateKey
	 *            The key to use for the decryption.
	 * @param encryptedKey
	 *            The data to decrypt
	 * @return The decrypted key
	 */
	public byte[] decryptAesKey(JSONObject jsonPrivateKey, byte[] encryptedKey) {
		Cipher cipher;
		try {
			PrivateKey privateKey = jsonToPrivateKey(jsonPrivateKey);
			cipher = Cipher.getInstance(RSA_ALGORITHM, PROVIDER);
			// TODO
			// cipher.init(Cipher.DECRYPT_MODE, privateKey, RandomizerFacade.getSecureRandom());
			cipher.init(Cipher.DECRYPT_MODE, privateKey);
			byte[] decrypted = cipher.doFinal(encryptedKey);
			return decrypted;
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}
	
}