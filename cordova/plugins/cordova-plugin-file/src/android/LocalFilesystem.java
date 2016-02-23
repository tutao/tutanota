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

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.nio.channels.FileChannel;
import org.apache.cordova.CordovaResourceApi;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.Build;
import android.os.Environment;
import android.util.Base64;
import android.net.Uri;
import android.content.Context;
import android.content.Intent;

public class LocalFilesystem extends Filesystem {
    private final Context context;

    public LocalFilesystem(String name, Context context, CordovaResourceApi resourceApi, File fsRoot) {
        super(Uri.fromFile(fsRoot).buildUpon().appendEncodedPath("").build(), name, resourceApi);
        this.context = context;
    }

    public String filesystemPathForFullPath(String fullPath) {
	    return new File(rootUri.getPath(), fullPath).toString();
	}

	@Override
	public String filesystemPathForURL(LocalFilesystemURL url) {
		return filesystemPathForFullPath(url.path);
	}

	private String fullPathForFilesystemPath(String absolutePath) {
		if (absolutePath != null && absolutePath.startsWith(rootUri.getPath())) {
			return absolutePath.substring(rootUri.getPath().length() - 1);
		}
		return null;
	}

    @Override
    public Uri toNativeUri(LocalFilesystemURL inputURL) {
        return nativeUriForFullPath(inputURL.path);
    }

    @Override
    public LocalFilesystemURL toLocalUri(Uri inputURL) {
        if (!"file".equals(inputURL.getScheme())) {
            return null;
        }
        File f = new File(inputURL.getPath());
        // Removes and duplicate /s (e.g. file:///a//b/c)
        Uri resolvedUri = Uri.fromFile(f);
        String rootUriNoTrailingSlash = rootUri.getEncodedPath();
        rootUriNoTrailingSlash = rootUriNoTrailingSlash.substring(0, rootUriNoTrailingSlash.length() - 1);
        if (!resolvedUri.getEncodedPath().startsWith(rootUriNoTrailingSlash)) {
            return null;
        }
        String subPath = resolvedUri.getEncodedPath().substring(rootUriNoTrailingSlash.length());
        // Strip leading slash
        if (!subPath.isEmpty()) {
            subPath = subPath.substring(1);
        }
        Uri.Builder b = new Uri.Builder()
            .scheme(LocalFilesystemURL.FILESYSTEM_PROTOCOL)
            .authority("localhost")
            .path(name);
        if (!subPath.isEmpty()) {
            b.appendEncodedPath(subPath);
        }
        if (f.isDirectory() || inputURL.getPath().endsWith("/")) {
            // Add trailing / for directories.
            b.appendEncodedPath("");
        }
        return LocalFilesystemURL.parse(b.build());
    }

	@Override
	public LocalFilesystemURL URLforFilesystemPath(String path) {
	    return localUrlforFullPath(fullPathForFilesystemPath(path));
	}

	@Override
	public JSONObject getFileForLocalURL(LocalFilesystemURL inputURL,
			String path, JSONObject options, boolean directory) throws FileExistsException, IOException, TypeMismatchException, EncodingException, JSONException {
        boolean create = false;
        boolean exclusive = false;

        if (options != null) {
            create = options.optBoolean("create");
            if (create) {
                exclusive = options.optBoolean("exclusive");
            }
        }

        // Check for a ":" character in the file to line up with BB and iOS
        if (path.contains(":")) {
            throw new EncodingException("This path has an invalid \":\" in it.");
        }

        LocalFilesystemURL requestedURL;

        // Check whether the supplied path is absolute or relative
        if (directory && !path.endsWith("/")) {
            path += "/";
        }
        if (path.startsWith("/")) {
        	requestedURL = localUrlforFullPath(normalizePath(path));
        } else {
        	requestedURL = localUrlforFullPath(normalizePath(inputURL.path + "/" + path));
        }

        File fp = new File(this.filesystemPathForURL(requestedURL));

        if (create) {
            if (exclusive && fp.exists()) {
                throw new FileExistsException("create/exclusive fails");
            }
            if (directory) {
                fp.mkdir();
            } else {
                fp.createNewFile();
            }
            if (!fp.exists()) {
                throw new FileExistsException("create fails");
            }
        }
        else {
            if (!fp.exists()) {
                throw new FileNotFoundException("path does not exist");
            }
            if (directory) {
                if (fp.isFile()) {
                    throw new TypeMismatchException("path doesn't exist or is file");
                }
            } else {
                if (fp.isDirectory()) {
                    throw new TypeMismatchException("path doesn't exist or is directory");
                }
            }
        }

        // Return the directory
        return makeEntryForURL(requestedURL);
	}

	@Override
	public boolean removeFileAtLocalURL(LocalFilesystemURL inputURL) throws InvalidModificationException {

        File fp = new File(filesystemPathForURL(inputURL));

        // You can't delete a directory that is not empty
        if (fp.isDirectory() && fp.list().length > 0) {
            throw new InvalidModificationException("You can't delete a directory that is not empty.");
        }

        return fp.delete();
	}

    @Override
    public boolean exists(LocalFilesystemURL inputURL) {
        File fp = new File(filesystemPathForURL(inputURL));
        return fp.exists();
    }

    @Override
    public long getFreeSpaceInBytes() {
        return DirectoryManager.getFreeSpaceInBytes(rootUri.getPath());
    }

    @Override
	public boolean recursiveRemoveFileAtLocalURL(LocalFilesystemURL inputURL) throws FileExistsException {
        File directory = new File(filesystemPathForURL(inputURL));
    	return removeDirRecursively(directory);
	}

	protected boolean removeDirRecursively(File directory) throws FileExistsException {
        if (directory.isDirectory()) {
            for (File file : directory.listFiles()) {
                removeDirRecursively(file);
            }
        }

        if (!directory.delete()) {
            throw new FileExistsException("could not delete: " + directory.getName());
        } else {
            return true;
        }
	}

    @Override
    public LocalFilesystemURL[] listChildren(LocalFilesystemURL inputURL) throws FileNotFoundException {
        File fp = new File(filesystemPathForURL(inputURL));

        if (!fp.exists()) {
            // The directory we are listing doesn't exist so we should fail.
            throw new FileNotFoundException();
        }

        File[] files = fp.listFiles();
        if (files == null) {
            // inputURL is a directory
            return null;
        }
        LocalFilesystemURL[] entries = new LocalFilesystemURL[files.length];
        for (int i = 0; i < files.length; i++) {
            entries[i] = URLforFilesystemPath(files[i].getPath());
        }

        return entries;
	}

	@Override
	public JSONObject getFileMetadataForLocalURL(LocalFilesystemURL inputURL) throws FileNotFoundException {
        File file = new File(filesystemPathForURL(inputURL));

        if (!file.exists()) {
            throw new FileNotFoundException("File at " + inputURL.uri + " does not exist.");
        }

        JSONObject metadata = new JSONObject();
        try {
            // Ensure that directories report a size of 0
        	metadata.put("size", file.isDirectory() ? 0 : file.length());
        	metadata.put("type", resourceApi.getMimeType(Uri.fromFile(file)));
        	metadata.put("name", file.getName());
        	metadata.put("fullPath", inputURL.path);
        	metadata.put("lastModifiedDate", file.lastModified());
        } catch (JSONException e) {
        	return null;
        }
        return metadata;
	}

    private void copyFile(Filesystem srcFs, LocalFilesystemURL srcURL, File destFile, boolean move) throws IOException, InvalidModificationException, NoModificationAllowedException {
        if (move) {
            String realSrcPath = srcFs.filesystemPathForURL(srcURL);
            if (realSrcPath != null) {
                File srcFile = new File(realSrcPath);
                if (srcFile.renameTo(destFile)) {
                    return;
                }
                // Trying to rename the file failed.  Possibly because we moved across file system on the device.
            }
        }

        CordovaResourceApi.OpenForReadResult offr = resourceApi.openForRead(srcFs.toNativeUri(srcURL));
        copyResource(offr, new FileOutputStream(destFile));

        if (move) {
            srcFs.removeFileAtLocalURL(srcURL);
        }
    }

    private void copyDirectory(Filesystem srcFs, LocalFilesystemURL srcURL, File dstDir, boolean move) throws IOException, NoModificationAllowedException, InvalidModificationException, FileExistsException {
        if (move) {
            String realSrcPath = srcFs.filesystemPathForURL(srcURL);
            if (realSrcPath != null) {
                File srcDir = new File(realSrcPath);
                // If the destination directory already exists and is empty then delete it.  This is according to spec.
                if (dstDir.exists()) {
                    if (dstDir.list().length > 0) {
                        throw new InvalidModificationException("directory is not empty");
                    }
                    dstDir.delete();
                }
                // Try to rename the directory
                if (srcDir.renameTo(dstDir)) {
                    return;
                }
                // Trying to rename the file failed.  Possibly because we moved across file system on the device.
            }
        }

        if (dstDir.exists()) {
            if (dstDir.list().length > 0) {
                throw new InvalidModificationException("directory is not empty");
            }
        } else {
            if (!dstDir.mkdir()) {
                // If we can't create the directory then fail
                throw new NoModificationAllowedException("Couldn't create the destination directory");
            }
        }

        LocalFilesystemURL[] children = srcFs.listChildren(srcURL);
        for (LocalFilesystemURL childLocalUrl : children) {
            File target = new File(dstDir, new File(childLocalUrl.path).getName());
            if (childLocalUrl.isDirectory) {
                copyDirectory(srcFs, childLocalUrl, target, false);
            } else {
                copyFile(srcFs, childLocalUrl, target, false);
            }
        }

        if (move) {
            srcFs.recursiveRemoveFileAtLocalURL(srcURL);
        }
    }

	@Override
	public JSONObject copyFileToURL(LocalFilesystemURL destURL, String newName,
			Filesystem srcFs, LocalFilesystemURL srcURL, boolean move) throws IOException, InvalidModificationException, JSONException, NoModificationAllowedException, FileExistsException {

		// Check to see if the destination directory exists
        String newParent = this.filesystemPathForURL(destURL);
        File destinationDir = new File(newParent);
        if (!destinationDir.exists()) {
            // The destination does not exist so we should fail.
            throw new FileNotFoundException("The source does not exist");
        }

        // Figure out where we should be copying to
        final LocalFilesystemURL destinationURL = makeDestinationURL(newName, srcURL, destURL, srcURL.isDirectory);

        Uri dstNativeUri = toNativeUri(destinationURL);
        Uri srcNativeUri = srcFs.toNativeUri(srcURL);
        // Check to see if source and destination are the same file
        if (dstNativeUri.equals(srcNativeUri)) {
            throw new InvalidModificationException("Can't copy onto itself");
        }

        if (move && !srcFs.canRemoveFileAtLocalURL(srcURL)) {
            throw new InvalidModificationException("Source URL is read-only (cannot move)");
        }

        File destFile = new File(dstNativeUri.getPath());
        if (destFile.exists()) {
            if (!srcURL.isDirectory && destFile.isDirectory()) {
                throw new InvalidModificationException("Can't copy/move a file to an existing directory");
            } else if (srcURL.isDirectory && destFile.isFile()) {
                throw new InvalidModificationException("Can't copy/move a directory to an existing file");
            }
        }

        if (srcURL.isDirectory) {
            // E.g. Copy /sdcard/myDir to /sdcard/myDir/backup
            if (dstNativeUri.toString().startsWith(srcNativeUri.toString() + '/')) {
                throw new InvalidModificationException("Can't copy directory into itself");
            }
            copyDirectory(srcFs, srcURL, destFile, move);
        } else {
            copyFile(srcFs, srcURL, destFile, move);
        }
        return makeEntryForURL(destinationURL);
	}

	@Override
	public long writeToFileAtURL(LocalFilesystemURL inputURL, String data,
			int offset, boolean isBinary) throws IOException, NoModificationAllowedException {

        boolean append = false;
        if (offset > 0) {
            this.truncateFileAtURL(inputURL, offset);
            append = true;
        }

        byte[] rawData;
        if (isBinary) {
            rawData = Base64.decode(data, Base64.DEFAULT);
        } else {
            rawData = data.getBytes();
        }
        ByteArrayInputStream in = new ByteArrayInputStream(rawData);
        try
        {
        	byte buff[] = new byte[rawData.length];
            String absolutePath = filesystemPathForURL(inputURL);
            FileOutputStream out = new FileOutputStream(absolutePath, append);
            try {
            	in.read(buff, 0, buff.length);
            	out.write(buff, 0, rawData.length);
            	out.flush();
            } finally {
            	// Always close the output
            	out.close();
            }
            if (isPublicDirectory(absolutePath)) {
                broadcastNewFile(Uri.fromFile(new File(absolutePath)));
            }
        }
        catch (NullPointerException e)
        {
            // This is a bug in the Android implementation of the Java Stack
            NoModificationAllowedException realException = new NoModificationAllowedException(inputURL.toString());
            throw realException;
        }

        return rawData.length;
	}

    private boolean isPublicDirectory(String absolutePath) {
        // TODO: should expose a way to scan app's private files (maybe via a flag).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            // Lollipop has a bug where SD cards are null.
            for (File f : context.getExternalMediaDirs()) {
                if(f != null && absolutePath.startsWith(f.getAbsolutePath())) {
                    return true;
                }
            }
        }

        String extPath = Environment.getExternalStorageDirectory().getAbsolutePath();
        return absolutePath.startsWith(extPath);
    }

     /**
     * Send broadcast of new file so files appear over MTP
     */
    private void broadcastNewFile(Uri nativeUri) {
        Intent intent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, nativeUri);
        context.sendBroadcast(intent);
    }

	@Override
	public long truncateFileAtURL(LocalFilesystemURL inputURL, long size) throws IOException {
        File file = new File(filesystemPathForURL(inputURL));

        if (!file.exists()) {
            throw new FileNotFoundException("File at " + inputURL.uri + " does not exist.");
        }

        RandomAccessFile raf = new RandomAccessFile(filesystemPathForURL(inputURL), "rw");
        try {
            if (raf.length() >= size) {
                FileChannel channel = raf.getChannel();
                channel.truncate(size);
                return size;
            }

            return raf.length();
        } finally {
            raf.close();
        }


	}

	@Override
	public boolean canRemoveFileAtLocalURL(LocalFilesystemURL inputURL) {
		String path = filesystemPathForURL(inputURL);
		File file = new File(path);
		return file.exists();
	}

    // This is a copy & paste from CordovaResource API that is required since CordovaResourceApi
    // has a bug pre-4.0.0.
    // TODO: Once cordova-android@4.0.0 is released, delete this copy and make the plugin depend on
    // 4.0.0 with an engine tag.
    private static void copyResource(CordovaResourceApi.OpenForReadResult input, OutputStream outputStream) throws IOException {
        try {
            InputStream inputStream = input.inputStream;
            if (inputStream instanceof FileInputStream && outputStream instanceof FileOutputStream) {
                FileChannel inChannel = ((FileInputStream)input.inputStream).getChannel();
                FileChannel outChannel = ((FileOutputStream)outputStream).getChannel();
                long offset = 0;
                long length = input.length;
                if (input.assetFd != null) {
                    offset = input.assetFd.getStartOffset();
                }
                // transferFrom()'s 2nd arg is a relative position. Need to set the absolute
                // position first.
                inChannel.position(offset);
                outChannel.transferFrom(inChannel, 0, length);
            } else {
                final int BUFFER_SIZE = 8192;
                byte[] buffer = new byte[BUFFER_SIZE];

                for (;;) {
                    int bytesRead = inputStream.read(buffer, 0, BUFFER_SIZE);

                    if (bytesRead <= 0) {
                        break;
                    }
                    outputStream.write(buffer, 0, bytesRead);
                }
            }
        } finally {
            input.inputStream.close();
            if (outputStream != null) {
                outputStream.close();
            }
        }
    }
}
