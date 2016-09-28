/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
 */
package org.apache.cordova.file;

import android.app.Activity;
import android.content.Context;
import android.net.Uri;
import android.os.Environment;
import android.util.Base64;
import android.util.Log;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;

/**
 * This class provides file and directory services to JavaScript.
 */
public class FileUtils extends CordovaPlugin {
    private static final String LOG_TAG = "FileUtils";

    public static int NOT_FOUND_ERR = 1;
    public static int SECURITY_ERR = 2;
    public static int ABORT_ERR = 3;

    public static int NOT_READABLE_ERR = 4;
    public static int ENCODING_ERR = 5;
    public static int NO_MODIFICATION_ALLOWED_ERR = 6;
    public static int INVALID_STATE_ERR = 7;
    public static int SYNTAX_ERR = 8;
    public static int INVALID_MODIFICATION_ERR = 9;
    public static int QUOTA_EXCEEDED_ERR = 10;
    public static int TYPE_MISMATCH_ERR = 11;
    public static int PATH_EXISTS_ERR = 12;

    public static int UNKNOWN_ERR = 1000;
    
    private boolean configured = false;

    // This field exists only to support getEntry, below, which has been deprecated
    private static FileUtils filePlugin;

    private interface FileOp {
        void run(JSONArray args) throws Exception;
    }
    
    private ArrayList<Filesystem> filesystems;

    public void registerFilesystem(Filesystem fs) {
    	if (fs != null && filesystemForName(fs.name)== null) {
    		this.filesystems.add(fs);
    	}
    }
    
    private Filesystem filesystemForName(String name) {
    	for (Filesystem fs:filesystems) {
    		if (fs != null && fs.name != null && fs.name.equals(name)) {
    			return fs;
    		}
    	}
    	return null;
    }

    protected String[] getExtraFileSystemsPreference(Activity activity) {
        String fileSystemsStr = preferences.getString("androidextrafilesystems", "files,files-external,documents,sdcard,cache,cache-external,root");
        return fileSystemsStr.split(",");
    }

    protected void registerExtraFileSystems(String[] filesystems, HashMap<String, String> availableFileSystems) {
        HashSet<String> installedFileSystems = new HashSet<String>();

        /* Register filesystems in order */
        for (String fsName : filesystems) {
            if (!installedFileSystems.contains(fsName)) {
                String fsRoot = availableFileSystems.get(fsName);
                if (fsRoot != null) {
                    File newRoot = new File(fsRoot);
                    if (newRoot.mkdirs() || newRoot.isDirectory()) {
                        registerFilesystem(new LocalFilesystem(fsName, webView.getContext(), webView.getResourceApi(), newRoot));
                        installedFileSystems.add(fsName);
                    } else {
                       Log.d(LOG_TAG, "Unable to create root dir for filesystem \"" + fsName + "\", skipping");
                    }
                } else {
                    Log.d(LOG_TAG, "Unrecognized extra filesystem identifier: " + fsName);
                }
            }
        }
    }
    
    protected HashMap<String, String> getAvailableFileSystems(Activity activity) {
        Context context = activity.getApplicationContext();
        HashMap<String, String> availableFileSystems = new HashMap<String,String>();

        availableFileSystems.put("files", context.getFilesDir().getAbsolutePath());
        availableFileSystems.put("documents", new File(context.getFilesDir(), "Documents").getAbsolutePath());
        availableFileSystems.put("cache", context.getCacheDir().getAbsolutePath());
        availableFileSystems.put("root", "/");
        if (Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED)) {
          try {
            availableFileSystems.put("files-external", context.getExternalFilesDir(null).getAbsolutePath());
            availableFileSystems.put("sdcard", Environment.getExternalStorageDirectory().getAbsolutePath());
            availableFileSystems.put("cache-external", context.getExternalCacheDir().getAbsolutePath());
          }
          catch(NullPointerException e) {
              Log.d(LOG_TAG, "External storage unavailable, check to see if USB Mass Storage Mode is on");
          }
        }

        return availableFileSystems;
    }

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
    	super.initialize(cordova, webView);
    	this.filesystems = new ArrayList<Filesystem>();

    	String tempRoot = null;
    	String persistentRoot = null;

    	Activity activity = cordova.getActivity();
    	String packageName = activity.getPackageName();

        String location = preferences.getString("androidpersistentfilelocation", "internal");

    	tempRoot = activity.getCacheDir().getAbsolutePath();
    	if ("internal".equalsIgnoreCase(location)) {
    		persistentRoot = activity.getFilesDir().getAbsolutePath() + "/files/";
    		this.configured = true;
    	} else if ("compatibility".equalsIgnoreCase(location)) {
    		/*
    		 *  Fall-back to compatibility mode -- this is the logic implemented in
    		 *  earlier versions of this plugin, and should be maintained here so
    		 *  that apps which were originally deployed with older versions of the
    		 *  plugin can continue to provide access to files stored under those
    		 *  versions.
    		 */
    		if (Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED)) {
    			persistentRoot = Environment.getExternalStorageDirectory().getAbsolutePath();
    			tempRoot = Environment.getExternalStorageDirectory().getAbsolutePath() +
    					"/Android/data/" + packageName + "/cache/";
    		} else {
    			persistentRoot = "/data/data/" + packageName;
    		}
    		this.configured = true;
    	}

    	if (this.configured) {
			// Create the directories if they don't exist.
			File tmpRootFile = new File(tempRoot);
            File persistentRootFile = new File(persistentRoot);
            tmpRootFile.mkdirs();
            persistentRootFile.mkdirs();

    		// Register initial filesystems
    		// Note: The temporary and persistent filesystems need to be the first two
    		// registered, so that they will match window.TEMPORARY and window.PERSISTENT,
    		// per spec.
    		this.registerFilesystem(new LocalFilesystem("temporary", webView.getContext(), webView.getResourceApi(), tmpRootFile));
    		this.registerFilesystem(new LocalFilesystem("persistent", webView.getContext(), webView.getResourceApi(), persistentRootFile));
    		this.registerFilesystem(new ContentFilesystem(webView.getContext(), webView.getResourceApi()));
            this.registerFilesystem(new AssetFilesystem(webView.getContext().getAssets(), webView.getResourceApi()));

            registerExtraFileSystems(getExtraFileSystemsPreference(activity), getAvailableFileSystems(activity));

    		// Initialize static plugin reference for deprecated getEntry method
    		if (filePlugin == null) {
    			FileUtils.filePlugin = this;
    		}
    	} else {
    		Log.e(LOG_TAG, "File plugin configuration error: Please set AndroidPersistentFileLocation in config.xml to one of \"internal\" (for new applications) or \"compatibility\" (for compatibility with previous versions)");
    		activity.finish();
    	}
    }
    
    public static FileUtils getFilePlugin() {
		return filePlugin;
	}

	private Filesystem filesystemForURL(LocalFilesystemURL localURL) {
    	if (localURL == null) return null;
    	return filesystemForName(localURL.fsName);
    }
    
    @Override
    public Uri remapUri(Uri uri) {
        // Remap only cdvfile: URLs (not content:).
        if (!LocalFilesystemURL.FILESYSTEM_PROTOCOL.equals(uri.getScheme())) {
            return null;
        }
        try {
        	LocalFilesystemURL inputURL = LocalFilesystemURL.parse(uri);
        	Filesystem fs = this.filesystemForURL(inputURL);
        	if (fs == null) {
        		return null;
        	}
        	String path = fs.filesystemPathForURL(inputURL);
        	if (path != null) {
        		return Uri.parse("file://" + fs.filesystemPathForURL(inputURL));
        	}
        	return null;
        } catch (IllegalArgumentException e) {
        	return null;
        }
    }

    public boolean execute(String action, final String rawArgs, final CallbackContext callbackContext) {
        if (!configured) {
            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, "File plugin is not configured. Please see the README.md file for details on how to update config.xml"));
            return true;
        }
        if (action.equals("testSaveLocationExists")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) {
                    boolean b = DirectoryManager.testSaveLocationExists();
                    callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, b));
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("getFreeDiskSpace")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) {
                    long l = DirectoryManager.getFreeDiskSpace(false);
                    callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, l));
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("testFileExists")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws JSONException {
                    String fname=args.getString(0);
                    boolean b = DirectoryManager.testFileExists(fname);
                    callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, b));
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("testDirectoryExists")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws JSONException {
                    String fname=args.getString(0);
                    boolean b = DirectoryManager.testFileExists(fname);
                    callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, b));
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("readAsText")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws JSONException, MalformedURLException {
                    String encoding = args.getString(1);
                    int start = args.getInt(2);
                    int end = args.getInt(3);
                    String fname=args.getString(0);
                    readFileAs(fname, start, end, callbackContext, encoding, PluginResult.MESSAGE_TYPE_STRING);
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("readAsDataURL")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws JSONException, MalformedURLException  {
                    int start = args.getInt(1);
                    int end = args.getInt(2);
                    String fname=args.getString(0);
                    readFileAs(fname, start, end, callbackContext, null, -1);
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("readAsArrayBuffer")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws JSONException, MalformedURLException  {
                    int start = args.getInt(1);
                    int end = args.getInt(2);
                    String fname=args.getString(0);
                    readFileAs(fname, start, end, callbackContext, null, PluginResult.MESSAGE_TYPE_ARRAYBUFFER);
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("readAsBinaryString")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws JSONException, MalformedURLException  {
                    int start = args.getInt(1);
                    int end = args.getInt(2);
                    String fname=args.getString(0);
                    readFileAs(fname, start, end, callbackContext, null, PluginResult.MESSAGE_TYPE_BINARYSTRING);
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("write")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws JSONException, FileNotFoundException, IOException, NoModificationAllowedException {
                    String fname=args.getString(0);
                    String data=args.getString(1);
                    int offset=args.getInt(2);
                    Boolean isBinary=args.getBoolean(3);
                    long fileSize = write(fname, data, offset, isBinary);
                    callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, fileSize));
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("truncate")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws JSONException, FileNotFoundException, IOException, NoModificationAllowedException {
                    String fname=args.getString(0);
                    int offset=args.getInt(1);
                    long fileSize = truncateFile(fname, offset);
                    callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK, fileSize));
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("requestAllFileSystems")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws IOException, JSONException {
                    callbackContext.success(requestAllFileSystems());
                }
            }, rawArgs, callbackContext);
        } else if (action.equals("requestAllPaths")) {
            cordova.getThreadPool().execute(
                    new Runnable() {
                        public void run() {
                        	try {
					callbackContext.success(requestAllPaths());
				} catch (JSONException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
                        }
                    }
            );
        } else if (action.equals("requestFileSystem")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws IOException, JSONException {
                    int fstype=args.getInt(0);
                    long size = args.optLong(1);
                    if (size != 0 && size > (DirectoryManager.getFreeDiskSpace(true) * 1024)) {
                        callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, FileUtils.QUOTA_EXCEEDED_ERR));
                    } else {
                        JSONObject obj = requestFileSystem(fstype);
                        callbackContext.success(obj);
                    }
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("resolveLocalFileSystemURI")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws IOException, JSONException {
                    String fname=args.getString(0);
                    JSONObject obj = resolveLocalFileSystemURI(fname);
                    callbackContext.success(obj);
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("getFileMetadata")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws FileNotFoundException, JSONException, MalformedURLException {
                    String fname=args.getString(0);
                    JSONObject obj = getFileMetadata(fname);
                    callbackContext.success(obj);
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("getParent")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws JSONException, IOException {
                    String fname=args.getString(0);
                    JSONObject obj = getParent(fname);
                    callbackContext.success(obj);
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("getDirectory")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws FileExistsException, IOException, TypeMismatchException, EncodingException, JSONException {
                    String dirname=args.getString(0);
                    String path=args.getString(1);
                    JSONObject obj = getFile(dirname, path, args.optJSONObject(2), true);
                    callbackContext.success(obj);
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("getFile")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws FileExistsException, IOException, TypeMismatchException, EncodingException, JSONException {
                    String dirname=args.getString(0);
                    String path=args.getString(1);
                    JSONObject obj = getFile(dirname, path, args.optJSONObject(2), false);
                    callbackContext.success(obj);
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("remove")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws JSONException, NoModificationAllowedException, InvalidModificationException, MalformedURLException {
                    String fname=args.getString(0);
                    boolean success = remove(fname);
                    if (success) {
                        callbackContext.success();
                    } else {
                        callbackContext.error(FileUtils.NO_MODIFICATION_ALLOWED_ERR);
                    }
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("removeRecursively")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws JSONException, FileExistsException, MalformedURLException, NoModificationAllowedException {
                    String fname=args.getString(0);
                    boolean success = removeRecursively(fname);
                    if (success) {
                        callbackContext.success();
                    } else {
                        callbackContext.error(FileUtils.NO_MODIFICATION_ALLOWED_ERR);
                    }
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("moveTo")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws JSONException, NoModificationAllowedException, IOException, InvalidModificationException, EncodingException, FileExistsException {
                    String fname=args.getString(0);
                    String newParent=args.getString(1);
                    String newName=args.getString(2);
                    JSONObject entry = transferTo(fname, newParent, newName, true);
                    callbackContext.success(entry);
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("copyTo")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws JSONException, NoModificationAllowedException, IOException, InvalidModificationException, EncodingException, FileExistsException {
                    String fname=args.getString(0);
                    String newParent=args.getString(1);
                    String newName=args.getString(2);
                    JSONObject entry = transferTo(fname, newParent, newName, false);
                    callbackContext.success(entry);
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("readEntries")) {
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws FileNotFoundException, JSONException, MalformedURLException {
                    String fname=args.getString(0);
                    JSONArray entries = readEntries(fname);
                    callbackContext.success(entries);
                }
            }, rawArgs, callbackContext);
        }
        else if (action.equals("_getLocalFilesystemPath")) {
            // Internal method for testing: Get the on-disk location of a local filesystem url.
            // [Currently used for testing file-transfer]
            threadhelper( new FileOp( ){
                public void run(JSONArray args) throws FileNotFoundException, JSONException, MalformedURLException {
                    String localURLstr = args.getString(0);
                    String fname = filesystemPathForURL(localURLstr);
                    callbackContext.success(fname);
                }
            }, rawArgs, callbackContext);
        }
        else {
            return false;
        }
        return true;
    }

    public LocalFilesystemURL resolveNativeUri(Uri nativeUri) {
        LocalFilesystemURL localURL = null;

        // Try all installed filesystems. Return the best matching URL
        // (determined by the shortest resulting URL)
        for (Filesystem fs : filesystems) {
            LocalFilesystemURL url = fs.toLocalUri(nativeUri);
            if (url != null) {
                // A shorter fullPath implies that the filesystem is a better
                // match for the local path than the previous best.
                if (localURL == null || (url.uri.toString().length() < localURL.toString().length())) {
                    localURL = url;
                }
            }
        }
        return localURL;
    }

    /*
     * These two native-only methods can be used by other plugins to translate between
     * device file system paths and URLs. By design, there is no direct JavaScript
     * interface to these methods.
     */

    public String filesystemPathForURL(String localURLstr) throws MalformedURLException {
        try {
            LocalFilesystemURL inputURL = LocalFilesystemURL.parse(localURLstr);
            Filesystem fs = this.filesystemForURL(inputURL);
            if (fs == null) {
                throw new MalformedURLException("No installed handlers for this URL");
            }
            return fs.filesystemPathForURL(inputURL);
        } catch (IllegalArgumentException e) {
            throw new MalformedURLException("Unrecognized filesystem URL");
        }
    }

    public LocalFilesystemURL filesystemURLforLocalPath(String localPath) {
        LocalFilesystemURL localURL = null;
        int shortestFullPath = 0;

        // Try all installed filesystems. Return the best matching URL
        // (determined by the shortest resulting URL)
        for (Filesystem fs: filesystems) {
            LocalFilesystemURL url = fs.URLforFilesystemPath(localPath);
            if (url != null) {
                // A shorter fullPath implies that the filesystem is a better
                // match for the local path than the previous best.
                if (localURL == null || (url.path.length() < shortestFullPath)) {
                    localURL = url;
                    shortestFullPath = url.path.length();
                }
            }
        }
        return localURL;
    }


	/* helper to execute functions async and handle the result codes
     *
     */
    private void threadhelper(final FileOp f, final String rawArgs, final CallbackContext callbackContext){
        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    JSONArray args = new JSONArray(rawArgs);
                    f.run(args);
                } catch ( Exception e) {
                    if( e instanceof EncodingException){
                        callbackContext.error(FileUtils.ENCODING_ERR);
                    } else if(e instanceof FileNotFoundException) {
                        callbackContext.error(FileUtils.NOT_FOUND_ERR);
                    } else if(e instanceof FileExistsException) {
                        callbackContext.error(FileUtils.PATH_EXISTS_ERR);
                    } else if(e instanceof NoModificationAllowedException ) {
                        callbackContext.error(FileUtils.NO_MODIFICATION_ALLOWED_ERR);
                    } else if(e instanceof InvalidModificationException ) {
                        callbackContext.error(FileUtils.INVALID_MODIFICATION_ERR);
                    } else if(e instanceof MalformedURLException ) {
                        callbackContext.error(FileUtils.ENCODING_ERR);
                    } else if(e instanceof IOException ) {
                        callbackContext.error(FileUtils.INVALID_MODIFICATION_ERR);
                    } else if(e instanceof EncodingException ) {
                        callbackContext.error(FileUtils.ENCODING_ERR);
                    } else if(e instanceof TypeMismatchException ) {
                        callbackContext.error(FileUtils.TYPE_MISMATCH_ERR);
                    } else if(e instanceof JSONException ) {
                        callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                    } else {
                        e.printStackTrace();
                    	callbackContext.error(FileUtils.UNKNOWN_ERR);
                    }
                }
            }
        });
    }

    /**
     * Allows the user to look up the Entry for a file or directory referred to by a local URI.
     *
     * @param uriString of the file/directory to look up
     * @return a JSONObject representing a Entry from the filesystem
     * @throws MalformedURLException if the url is not valid
     * @throws FileNotFoundException if the file does not exist
     * @throws IOException if the user can't read the file
     * @throws JSONException
     */
    private JSONObject resolveLocalFileSystemURI(String uriString) throws IOException, JSONException {
    	if (uriString == null) {
    		throw new MalformedURLException("Unrecognized filesystem URL");
    	}
    	Uri uri = Uri.parse(uriString);

        LocalFilesystemURL inputURL = LocalFilesystemURL.parse(uri);
        if (inputURL == null) {
    		/* Check for file://, content:// urls */
    		inputURL = resolveNativeUri(uri);
    	}

        try {
        	Filesystem fs = this.filesystemForURL(inputURL);
        	if (fs == null) {
        		throw new MalformedURLException("No installed handlers for this URL");
        	}
            if (fs.exists(inputURL)) {
                return fs.getEntryForLocalURL(inputURL);
            }
        } catch (IllegalArgumentException e) {
        	throw new MalformedURLException("Unrecognized filesystem URL");
        }
        throw new FileNotFoundException();
    }   
    
    /**
     * Read the list of files from this directory.
     *
     * @return a JSONArray containing JSONObjects that represent Entry objects.
     * @throws FileNotFoundException if the directory is not found.
     * @throws JSONException
     * @throws MalformedURLException 
     */
    private JSONArray readEntries(String baseURLstr) throws FileNotFoundException, JSONException, MalformedURLException {
        try {
        	LocalFilesystemURL inputURL = LocalFilesystemURL.parse(baseURLstr);
        	Filesystem fs = this.filesystemForURL(inputURL);
        	if (fs == null) {
        		throw new MalformedURLException("No installed handlers for this URL");
        	}
        	return fs.readEntriesAtLocalURL(inputURL);
        
        } catch (IllegalArgumentException e) {
        	throw new MalformedURLException("Unrecognized filesystem URL");
        }
    }

    /**
     * A setup method that handles the move/copy of files/directories
     *
     * @param newName for the file directory to be called, if null use existing file name
     * @param move if false do a copy, if true do a move
     * @return a Entry object
     * @throws NoModificationAllowedException
     * @throws IOException
     * @throws InvalidModificationException
     * @throws EncodingException
     * @throws JSONException
     * @throws FileExistsException
     */
    private JSONObject transferTo(String srcURLstr, String destURLstr, String newName, boolean move) throws JSONException, NoModificationAllowedException, IOException, InvalidModificationException, EncodingException, FileExistsException {
        if (srcURLstr == null || destURLstr == null) {
            // either no source or no destination provided
        	throw new FileNotFoundException();
        }

        LocalFilesystemURL srcURL = LocalFilesystemURL.parse(srcURLstr);
        LocalFilesystemURL destURL = LocalFilesystemURL.parse(destURLstr);

        Filesystem srcFs = this.filesystemForURL(srcURL);
        Filesystem destFs = this.filesystemForURL(destURL);

        // Check for invalid file name
        if (newName != null && newName.contains(":")) {
            throw new EncodingException("Bad file name");
        }

        return destFs.copyFileToURL(destURL, newName, srcFs, srcURL, move);
    }

    /**
     * Deletes a directory and all of its contents, if any. In the event of an error
     * [e.g. trying to delete a directory that contains a file that cannot be removed],
     * some of the contents of the directory may be deleted.
     * It is an error to attempt to delete the root directory of a filesystem.
     *
     * @return a boolean representing success of failure
     * @throws FileExistsException
     * @throws NoModificationAllowedException 
     * @throws MalformedURLException 
     */
    private boolean removeRecursively(String baseURLstr) throws FileExistsException, NoModificationAllowedException, MalformedURLException {
        try {
        	LocalFilesystemURL inputURL = LocalFilesystemURL.parse(baseURLstr);
        	// You can't delete the root directory.
        	if ("".equals(inputURL.path) || "/".equals(inputURL.path)) {
        		throw new NoModificationAllowedException("You can't delete the root directory");
        	}

        	Filesystem fs = this.filesystemForURL(inputURL);
        	if (fs == null) {
        		throw new MalformedURLException("No installed handlers for this URL");
        	}
        	return fs.recursiveRemoveFileAtLocalURL(inputURL);
        
        } catch (IllegalArgumentException e) {
        	throw new MalformedURLException("Unrecognized filesystem URL");
        }
    }


    /**
     * Deletes a file or directory. It is an error to attempt to delete a directory that is not empty.
     * It is an error to attempt to delete the root directory of a filesystem.
     *
     * @return a boolean representing success of failure
     * @throws NoModificationAllowedException
     * @throws InvalidModificationException
     * @throws MalformedURLException 
     */
    private boolean remove(String baseURLstr) throws NoModificationAllowedException, InvalidModificationException, MalformedURLException {
        try {
        	LocalFilesystemURL inputURL = LocalFilesystemURL.parse(baseURLstr);
        	// You can't delete the root directory.
        	if ("".equals(inputURL.path) || "/".equals(inputURL.path)) {

        		throw new NoModificationAllowedException("You can't delete the root directory");
        	}

        	Filesystem fs = this.filesystemForURL(inputURL);
        	if (fs == null) {
        		throw new MalformedURLException("No installed handlers for this URL");
        	}
        	return fs.removeFileAtLocalURL(inputURL);
        
        } catch (IllegalArgumentException e) {
        	throw new MalformedURLException("Unrecognized filesystem URL");
        }
    }

    /**
     * Creates or looks up a file.
     *
     * @param baseURLstr base directory
     * @param path file/directory to lookup or create
     * @param options specify whether to create or not
     * @param directory if true look up directory, if false look up file
     * @return a Entry object
     * @throws FileExistsException
     * @throws IOException
     * @throws TypeMismatchException
     * @throws EncodingException
     * @throws JSONException
     */
    private JSONObject getFile(String baseURLstr, String path, JSONObject options, boolean directory) throws FileExistsException, IOException, TypeMismatchException, EncodingException, JSONException {
        try {
        	LocalFilesystemURL inputURL = LocalFilesystemURL.parse(baseURLstr);
        	Filesystem fs = this.filesystemForURL(inputURL);
        	if (fs == null) {
        		throw new MalformedURLException("No installed handlers for this URL");
        	}
        	return fs.getFileForLocalURL(inputURL, path, options, directory);
        
        } catch (IllegalArgumentException e) {
        	throw new MalformedURLException("Unrecognized filesystem URL");
        }

    }

    /**
     * Look up the parent DirectoryEntry containing this Entry.
     * If this Entry is the root of its filesystem, its parent is itself.
     */
    private JSONObject getParent(String baseURLstr) throws JSONException, IOException {
        try {
        	LocalFilesystemURL inputURL = LocalFilesystemURL.parse(baseURLstr);
        	Filesystem fs = this.filesystemForURL(inputURL);
        	if (fs == null) {
        		throw new MalformedURLException("No installed handlers for this URL");
        	}
        	return fs.getParentForLocalURL(inputURL);
        
        } catch (IllegalArgumentException e) {
        	throw new MalformedURLException("Unrecognized filesystem URL");
        }
    }

    /**
     * Returns a File that represents the current state of the file that this FileEntry represents.
     *
     * @return returns a JSONObject represent a W3C File object
     */
    private JSONObject getFileMetadata(String baseURLstr) throws FileNotFoundException, JSONException, MalformedURLException {
        try {
        	LocalFilesystemURL inputURL = LocalFilesystemURL.parse(baseURLstr);
        	Filesystem fs = this.filesystemForURL(inputURL);
        	if (fs == null) {
        		throw new MalformedURLException("No installed handlers for this URL");
        	}
        	return fs.getFileMetadataForLocalURL(inputURL);
        
        } catch (IllegalArgumentException e) {
        	throw new MalformedURLException("Unrecognized filesystem URL");
        }
    }

    /**
     * Requests a filesystem in which to store application data.
     *
     * @param type of file system requested
     * @return a JSONObject representing the file system
     * @throws IOException
     * @throws JSONException
     */
    private JSONObject requestFileSystem(int type) throws IOException, JSONException {
        JSONObject fs = new JSONObject();
        Filesystem rootFs = null;
        try {
        	rootFs = this.filesystems.get(type);
        } catch (ArrayIndexOutOfBoundsException e) {
        	// Pass null through
        }
        if (rootFs == null) {
            throw new IOException("No filesystem of type requested");        	
        }
        fs.put("name", rootFs.name);
        fs.put("root", rootFs.getRootEntry());
        return fs;
    }


    /**
     * Requests a filesystem in which to store application data.
     *
     * @return a JSONObject representing the file system
     */
    private JSONArray requestAllFileSystems() throws IOException, JSONException {
        JSONArray ret = new JSONArray();
        for (Filesystem fs : filesystems) {
            ret.put(fs.getRootEntry());
        }
        return ret;
    }

    private static String toDirUrl(File f) {
        return Uri.fromFile(f).toString() + '/';
    }
    
    private JSONObject requestAllPaths() throws JSONException {
        Context context = cordova.getActivity();
        JSONObject ret = new JSONObject();
        ret.put("applicationDirectory", "file:///android_asset/");
        ret.put("applicationStorageDirectory", toDirUrl(context.getFilesDir().getParentFile()));
        ret.put("dataDirectory", toDirUrl(context.getFilesDir()));
        ret.put("cacheDirectory", toDirUrl(context.getCacheDir()));
        if (Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED)) {
          try {
            ret.put("externalApplicationStorageDirectory", toDirUrl(context.getExternalFilesDir(null).getParentFile()));
            ret.put("externalDataDirectory", toDirUrl(context.getExternalFilesDir(null)));
            ret.put("externalCacheDirectory", toDirUrl(context.getExternalCacheDir()));
            ret.put("externalRootDirectory", toDirUrl(Environment.getExternalStorageDirectory()));
          }
          catch(NullPointerException e) {
            /* If external storage is unavailable, context.getExternal* returns null */
              Log.d(LOG_TAG, "Unable to access these paths, most liklely due to USB storage");
          }
        }
        return ret;
    }

   /**
     * Returns a JSON object representing the given File. Internal APIs should be modified
     * to use URLs instead of raw FS paths wherever possible, when interfacing with this plugin.
     *
     * @param file the File to convert
     * @return a JSON representation of the given File
     * @throws JSONException
     */
    public JSONObject getEntryForFile(File file) throws JSONException {
        JSONObject entry;

        for (Filesystem fs : filesystems) {
             entry = fs.makeEntryForFile(file);
             if (entry != null) {
                 return entry;
             }
        }
        return null;
    }

    /**
     * Returns a JSON object representing the given File. Deprecated, as this is only used by
     * FileTransfer, and because it is a static method that should really be an instance method,
     * since it depends on the actual filesystem roots in use. Internal APIs should be modified
     * to use URLs instead of raw FS paths wherever possible, when interfacing with this plugin.
     *
     * @param file the File to convert
     * @return a JSON representation of the given File
     * @throws JSONException
     */
    @Deprecated
    public static JSONObject getEntry(File file) throws JSONException {
 		if (getFilePlugin() != null) {
             return getFilePlugin().getEntryForFile(file);
		}
		return null;
    }

    /**
     * Read the contents of a file.
     * This is done in a background thread; the result is sent to the callback.
     *
     * @param start             Start position in the file.
     * @param end               End position to stop at (exclusive).
     * @param callbackContext   The context through which to send the result.
     * @param encoding          The encoding to return contents as.  Typical value is UTF-8. (see http://www.iana.org/assignments/character-sets)
     * @param resultType        The desired type of data to send to the callback.
     * @return                  Contents of file.
     */
    public void readFileAs(final String srcURLstr, final int start, final int end, final CallbackContext callbackContext, final String encoding, final int resultType) throws MalformedURLException {
        try {
        	LocalFilesystemURL inputURL = LocalFilesystemURL.parse(srcURLstr);
        	Filesystem fs = this.filesystemForURL(inputURL);
        	if (fs == null) {
        		throw new MalformedURLException("No installed handlers for this URL");
        	}
        
            fs.readFileAtURL(inputURL, start, end, new Filesystem.ReadFileCallback() {
                public void handleData(InputStream inputStream, String contentType) {
            		try {
                        ByteArrayOutputStream os = new ByteArrayOutputStream();
                        final int BUFFER_SIZE = 8192;
                        byte[] buffer = new byte[BUFFER_SIZE];
                        
                        for (;;) {
                            int bytesRead = inputStream.read(buffer, 0, BUFFER_SIZE);
                            
                            if (bytesRead <= 0) {
                                break;
                            }
                            os.write(buffer, 0, bytesRead);
                        }
                                
            			PluginResult result;
            			switch (resultType) {
            			case PluginResult.MESSAGE_TYPE_STRING:
                            result = new PluginResult(PluginResult.Status.OK, os.toString(encoding));
            				break;
            			case PluginResult.MESSAGE_TYPE_ARRAYBUFFER:
                            result = new PluginResult(PluginResult.Status.OK, os.toByteArray());
            				break;
            			case PluginResult.MESSAGE_TYPE_BINARYSTRING:
                            result = new PluginResult(PluginResult.Status.OK, os.toByteArray(), true);
            				break;
            			default: // Base64.
                        byte[] base64 = Base64.encode(os.toByteArray(), Base64.NO_WRAP);
            			String s = "data:" + contentType + ";base64," + new String(base64, "US-ASCII");
            			result = new PluginResult(PluginResult.Status.OK, s);
            			}

            			callbackContext.sendPluginResult(result);
            		} catch (IOException e) {
            			Log.d(LOG_TAG, e.getLocalizedMessage());
            			callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, NOT_READABLE_ERR));
                    }
            	}
            });


        } catch (IllegalArgumentException e) {
        	throw new MalformedURLException("Unrecognized filesystem URL");
        } catch (FileNotFoundException e) {
        	callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, NOT_FOUND_ERR));
        } catch (IOException e) {
        	Log.d(LOG_TAG, e.getLocalizedMessage());
        	callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.IO_EXCEPTION, NOT_READABLE_ERR));
        }
    }


    /**
     * Write contents of file.
     *
     * @param data				The contents of the file.
     * @param offset			The position to begin writing the file.
     * @param isBinary          True if the file contents are base64-encoded binary data
     */
    /**/
    public long write(String srcURLstr, String data, int offset, boolean isBinary) throws FileNotFoundException, IOException, NoModificationAllowedException {
        try {
        	LocalFilesystemURL inputURL = LocalFilesystemURL.parse(srcURLstr);
        	Filesystem fs = this.filesystemForURL(inputURL);
        	if (fs == null) {
        		throw new MalformedURLException("No installed handlers for this URL");
        	}
        
            long x = fs.writeToFileAtURL(inputURL, data, offset, isBinary); Log.d("TEST",srcURLstr + ": "+x); return x;
        } catch (IllegalArgumentException e) {
        	throw new MalformedURLException("Unrecognized filesystem URL");
        }
        
    }

    /**
     * Truncate the file to size
     */
    private long truncateFile(String srcURLstr, long size) throws FileNotFoundException, IOException, NoModificationAllowedException {
        try {
        	LocalFilesystemURL inputURL = LocalFilesystemURL.parse(srcURLstr);
        	Filesystem fs = this.filesystemForURL(inputURL);
        	if (fs == null) {
        		throw new MalformedURLException("No installed handlers for this URL");
        	}
        
            return fs.truncateFileAtURL(inputURL, size);
        } catch (IllegalArgumentException e) {
        	throw new MalformedURLException("Unrecognized filesystem URL");
        }
    }
}
