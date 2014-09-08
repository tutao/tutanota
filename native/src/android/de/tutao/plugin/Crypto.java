package de.tutao.plugin;

import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.RSAPrivateKeySpec;
import java.security.spec.RSAPublicKeySpec;

import javax.crypto.Cipher;

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
			callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, Base64.encodeToString(encryptedKey, Base64.DEFAULT)));
			return true;
		} else if (action.equals("rsaDecrypt")) {
			byte[] key = this.decryptAesKey(args.getJSONObject(0), Base64.decode(args.getString(1), Base64.DEFAULT));
			callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, Base64.encodeToString(key, Base64.DEFAULT)));
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
					callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, Crypto.this.keyPairToJson(keyPair)));
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
		json.put("modulus", Base64.encodeToString(key.getModulus().toByteArray(), Base64.DEFAULT));
		json.put("privateExponent", Base64.encodeToString(key.getPrivateExponent().toByteArray(), Base64.DEFAULT));
		json.put("primeP", Base64.encodeToString(key.getPrimeP().toByteArray(), Base64.DEFAULT));
		json.put("primeQ", Base64.encodeToString(key.getPrimeQ().toByteArray(), Base64.DEFAULT));
		json.put("primeExponentP", Base64.encodeToString(key.getPrimeExponentP().toByteArray(), Base64.DEFAULT));
		json.put("primeExponentQ", Base64.encodeToString(key.getPrimeExponentQ().toByteArray(), Base64.DEFAULT));
		json.put("crtCoefficient", Base64.encodeToString(key.getCrtCoefficient().toByteArray(), Base64.DEFAULT));
		return json;
	}
	
	private JSONObject publicKeyToJson(RSAPublicKey key) throws JSONException {
		JSONObject json = new JSONObject();
		json.put("version", 0);
		json.put("modulus", Base64.encodeToString(key.getModulus().toByteArray(), Base64.DEFAULT));
		return json;
	}
	
	private JSONObject keyPairToJson(KeyPair keyPair) throws JSONException {
		JSONObject json = new JSONObject();
		json.put("publicKey", publicKeyToJson((RSAPublicKey) keyPair.getPublic()));
		json.put("privateKey", privateKeyToJson((RSAPrivateCrtKey) keyPair.getPrivate()));
		return json;
	}
	
	private PublicKey jsonToPublicKey(JSONObject json) throws JSONException {
		BigInteger modulus = new BigInteger(Base64.decode(json.getString("modulus"), Base64.DEFAULT));
		
		try {
			KeyFactory keyFactory = KeyFactory.getInstance("RSA");
			return keyFactory.generatePublic(new RSAPublicKeySpec(modulus, BigInteger.valueOf(PUBLIC_EXPONENT)));
		} catch(Exception e) {
			throw new RuntimeException(e);
		}
	}
	
	private PrivateKey jsonToPrivateKey(JSONObject json) throws JSONException {
		BigInteger modulus = new BigInteger(Base64.decode(json.getString("modulus"), Base64.DEFAULT));
		BigInteger privateExponent = new BigInteger(Base64.decode(json.getString("privateExponent"), Base64.DEFAULT));
		
		try {
			KeyFactory keyFactory = KeyFactory.getInstance("RSA");
			return keyFactory.generatePrivate(new RSAPrivateKeySpec(modulus, privateExponent));
		} catch(Exception e) {
			throw new RuntimeException(e);
		}
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