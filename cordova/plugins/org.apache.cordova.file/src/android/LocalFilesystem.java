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
import java.util.ArrayList;
import java.util.Arrays;

import org.apache.cordova.CordovaInterface;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Base64;
import android.net.Uri;

public class LocalFilesystem extends Filesystem {

	private String fsRoot;
	private CordovaInterface cordova;

	public LocalFilesystem(String name, CordovaInterface cordova, String fsRoot) {
		this.name = name;
		this.fsRoot = fsRoot;
		this.cordova = cordova;
	}

	public String filesystemPathForFullPath(String fullPath) {
	    String path = new File(this.fsRoot, fullPath).toString();
        int questionMark = path.indexOf("?");
        if (questionMark >= 0) {
          path = path.substring(0, questionMark);
        }
	    if (path.length() > 1 && path.endsWith("/")) {
	      path = path.substring(0, path.length()-1);
	    }
	    return path;
	}
	
	@Override
	public String filesystemPathForURL(LocalFilesystemURL url) {
		return filesystemPathForFullPath(url.fullPath);
	}

	private String fullPathForFilesystemPath(String absolutePath) {
		if (absolutePath != null && absolutePath.startsWith(this.fsRoot)) {
			return absolutePath.substring(this.fsRoot.length());
		}
		return null;
	}

	protected LocalFilesystemURL URLforFullPath(String fullPath) {
	    if (fullPath != null) {
	    	if (fullPath.startsWith("/")) {
	    		return new LocalFilesystemURL(LocalFilesystemURL.FILESYSTEM_PROTOCOL + "://localhost/"+this.name+fullPath);
	    	}
	        return new LocalFilesystemURL(LocalFilesystemURL.FILESYSTEM_PROTOCOL + "://localhost/"+this.name+"/"+fullPath);
	    }
	    return null;
		
	}
	
	@Override
	public LocalFilesystemURL URLforFilesystemPath(String path) {
	    return this.URLforFullPath(this.fullPathForFilesystemPath(path));
	}

	protected String normalizePath(String rawPath) {
	    // If this is an absolute path, trim the leading "/" and replace it later
	    boolean isAbsolutePath = rawPath.startsWith("/");
	    if (isAbsolutePath) {
	        rawPath = rawPath.substring(1);
	    }
	    ArrayList<String> components = new ArrayList<String>(Arrays.asList(rawPath.split("/+")));
	    for (int index = 0; index < components.size(); ++index) {
	        if (components.get(index).equals("..")) {
	            components.remove(index);
	            if (index > 0) {
	                components.remove(index-1);
	                --index;
	            }
	        }
	    }
	    StringBuilder normalizedPath = new StringBuilder();
	    for(String component: components) {
	    	normalizedPath.append("/");
	    	normalizedPath.append(component);
	    }
	    if (isAbsolutePath) {
	    	return normalizedPath.toString();
	    } else {
	    	return normalizedPath.toString().substring(1);
	    }


	}

	
	@Override
    public JSONObject makeEntryForFile(File file) throws JSONException {
    	String path = this.fullPathForFilesystemPath(file.getAbsolutePath());
    	if (path != null) {
    		return makeEntryForPath(path, this.name, file.isDirectory(), Uri.fromFile(file).toString());
    	}
    	return null;
    }

	@Override
	public JSONObject getEntryForLocalURL(LocalFilesystemURL inputURL) throws IOException {
      File fp = new File(filesystemPathForURL(inputURL));

      if (!fp.exists()) {
          throw new FileNotFoundException();
      }
      if (!fp.canRead()) {
          throw new IOException();
      }
      try {
          return LocalFilesystem.makeEntryForURL(inputURL, fp.isDirectory(),  Uri.fromFile(fp).toString());
      } catch (JSONException e) {
    	  throw new IOException();
      }
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
        if (path.startsWith("/")) {
        	requestedURL = URLforFilesystemPath(path);
        } else {
        	requestedURL = URLforFullPath(normalizePath(inputURL.fullPath + "/" + path));
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
        return makeEntryForPath(requestedURL.fullPath, requestedURL.filesystemName, directory, Uri.fromFile(fp).toString());
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
	public JSONArray readEntriesAtLocalURL(LocalFilesystemURL inputURL) throws FileNotFoundException {
        File fp = new File(filesystemPathForURL(inputURL));

        if (!fp.exists()) {
            // The directory we are listing doesn't exist so we should fail.
            throw new FileNotFoundException();
        }

        JSONArray entries = new JSONArray();

        if (fp.isDirectory()) {
            File[] files = fp.listFiles();
            for (int i = 0; i < files.length; i++) {
                if (files[i].canRead()) {
                    try {
						entries.put(makeEntryForPath(fullPathForFilesystemPath(files[i].getAbsolutePath()), inputURL.filesystemName, files[i].isDirectory(), Uri.fromFile(files[i]).toString()));
					} catch (JSONException e) {
					}
                }
            }
        }

        return entries;
	}

	@Override
	public JSONObject getFileMetadataForLocalURL(LocalFilesystemURL inputURL) throws FileNotFoundException {
        File file = new File(filesystemPathForURL(inputURL));

        if (!file.exists()) {
            throw new FileNotFoundException("File at " + inputURL.URL + " does not exist.");
        }

        JSONObject metadata = new JSONObject();
        try {
            // Ensure that directories report a size of 0
        	metadata.put("size", file.isDirectory() ? 0 : file.length());
        	metadata.put("type", FileHelper.getMimeType(file.getAbsolutePath(), cordova));
        	metadata.put("name", file.getName());
        	metadata.put("fullPath", inputURL.fullPath);
        	metadata.put("lastModifiedDate", file.lastModified());
        } catch (JSONException e) {
        	return null;
        }
        return metadata;
	}

    /**
     * Check to see if the user attempted to copy an entry into its parent without changing its name,
     * or attempted to copy a directory into a directory that it contains directly or indirectly.
     *
     * @param srcDir
     * @param destinationDir
     * @return
     */
    private boolean isCopyOnItself(String src, String dest) {

        // This weird test is to determine if we are copying or moving a directory into itself.
        // Copy /sdcard/myDir to /sdcard/myDir-backup is okay but
        // Copy /sdcard/myDir to /sdcard/myDir/backup should throw an INVALID_MODIFICATION_ERR
        if (dest.startsWith(src) && dest.indexOf(File.separator, src.length() - 1) != -1) {
            return true;
        }

        return false;
    }

    /**
     * Copy a file
     *
     * @param srcFile file to be copied
     * @param destFile destination to be copied to
     * @return a FileEntry object
     * @throws IOException
     * @throws InvalidModificationException
     * @throws JSONException
     */
    private JSONObject copyFile(File srcFile, File destFile) throws IOException, InvalidModificationException, JSONException {
        // Renaming a file to an existing directory should fail
        if (destFile.exists() && destFile.isDirectory()) {
            throw new InvalidModificationException("Can't rename a file to a directory");
        }

        copyAction(srcFile, destFile);

        return makeEntryForFile(destFile);
    }

    /**
     * Moved this code into it's own method so moveTo could use it when the move is across file systems
     */
    private void copyAction(File srcFile, File destFile)
            throws FileNotFoundException, IOException {
        FileInputStream istream = new FileInputStream(srcFile);
        FileOutputStream ostream = new FileOutputStream(destFile);
        FileChannel input = istream.getChannel();
        FileChannel output = ostream.getChannel();

        try {
            input.transferTo(0, input.size(), output);
        } finally {
            istream.close();
            ostream.close();
            input.close();
            output.close();
        }
    }

    /**
     * Copy a directory
     *
     * @param srcDir directory to be copied
     * @param destinationDir destination to be copied to
     * @return a DirectoryEntry object
     * @throws JSONException
     * @throws IOException
     * @throws NoModificationAllowedException
     * @throws InvalidModificationException
     */
    private JSONObject copyDirectory(File srcDir, File destinationDir) throws JSONException, IOException, NoModificationAllowedException, InvalidModificationException {
        // Renaming a file to an existing directory should fail
        if (destinationDir.exists() && destinationDir.isFile()) {
            throw new InvalidModificationException("Can't rename a file to a directory");
        }

        // Check to make sure we are not copying the directory into itself
        if (isCopyOnItself(srcDir.getAbsolutePath(), destinationDir.getAbsolutePath())) {
            throw new InvalidModificationException("Can't copy itself into itself");
        }

        // See if the destination directory exists. If not create it.
        if (!destinationDir.exists()) {
            if (!destinationDir.mkdir()) {
                // If we can't create the directory then fail
                throw new NoModificationAllowedException("Couldn't create the destination directory");
            }
        }
        

        for (File file : srcDir.listFiles()) {
            File destination = new File(destinationDir.getAbsoluteFile() + File.separator + file.getName());
            if (file.isDirectory()) {
                copyDirectory(file, destination);
            } else {
                copyFile(file, destination);
            }
        }

        return makeEntryForFile(destinationDir);
    }

    /**
     * Move a file
     *
     * @param srcFile file to be copied
     * @param destFile destination to be copied to
     * @return a FileEntry object
     * @throws IOException
     * @throws InvalidModificationException
     * @throws JSONException
     */
    private JSONObject moveFile(File srcFile, File destFile) throws IOException, JSONException, InvalidModificationException {
        // Renaming a file to an existing directory should fail
        if (destFile.exists() && destFile.isDirectory()) {
            throw new InvalidModificationException("Can't rename a file to a directory");
        }

        // Try to rename the file
        if (!srcFile.renameTo(destFile)) {
            // Trying to rename the file failed.  Possibly because we moved across file system on the device.
            // Now we have to do things the hard way
            // 1) Copy all the old file
            // 2) delete the src file
            copyAction(srcFile, destFile);
            if (destFile.exists()) {
                srcFile.delete();
            } else {
                throw new IOException("moved failed");
            }
        }

        return makeEntryForFile(destFile);
    }

    /**
     * Move a directory
     *
     * @param srcDir directory to be copied
     * @param destinationDir destination to be copied to
     * @return a DirectoryEntry object
     * @throws JSONException
     * @throws IOException
     * @throws InvalidModificationException
     * @throws NoModificationAllowedException
     * @throws FileExistsException
     */
    private JSONObject moveDirectory(File srcDir, File destinationDir) throws IOException, JSONException, InvalidModificationException, NoModificationAllowedException, FileExistsException {
        // Renaming a file to an existing directory should fail
        if (destinationDir.exists() && destinationDir.isFile()) {
            throw new InvalidModificationException("Can't rename a file to a directory");
        }

        // Check to make sure we are not copying the directory into itself
        if (isCopyOnItself(srcDir.getAbsolutePath(), destinationDir.getAbsolutePath())) {
            throw new InvalidModificationException("Can't move itself into itself");
        }

        // If the destination directory already exists and is empty then delete it.  This is according to spec.
        if (destinationDir.exists()) {
            if (destinationDir.list().length > 0) {
                throw new InvalidModificationException("directory is not empty");
            }
        }

        // Try to rename the directory
        if (!srcDir.renameTo(destinationDir)) {
            // Trying to rename the directory failed.  Possibly because we moved across file system on the device.
            // Now we have to do things the hard way
            // 1) Copy all the old files
            // 2) delete the src directory
            copyDirectory(srcDir, destinationDir);
            if (destinationDir.exists()) {
                removeDirRecursively(srcDir);
            } else {
                throw new IOException("moved failed");
            }
        }

        return makeEntryForFile(destinationDir);
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
        
	    if (LocalFilesystem.class.isInstance(srcFs)) {
	        /* Same FS, we can shortcut with NSFileManager operations */

            // Figure out where we should be copying to
            final LocalFilesystemURL destinationURL = makeDestinationURL(newName, srcURL, destURL);

	        String srcFilesystemPath = srcFs.filesystemPathForURL(srcURL);
            File sourceFile = new File(srcFilesystemPath);
            String destFilesystemPath = this.filesystemPathForURL(destinationURL);
            File destinationFile = new File(destFilesystemPath);

            if (!sourceFile.exists()) {
	            // The file/directory we are copying doesn't exist so we should fail.
	            throw new FileNotFoundException("The source does not exist");
	        }

	        // Check to see if source and destination are the same file
            if (sourceFile.getAbsolutePath().equals(destinationFile.getAbsolutePath())) {
	            throw new InvalidModificationException("Can't copy a file onto itself");
	        }

            if (sourceFile.isDirectory()) {
	            if (move) {
                    return moveDirectory(sourceFile, destinationFile);
	            } else {
                    return copyDirectory(sourceFile, destinationFile);
	            }
	        } else {
	            if (move) {
                    return moveFile(sourceFile, destinationFile);
	            } else {
                    return copyFile(sourceFile, destinationFile);
	            }
	        }
	    	
	    } else {
	        // Need to copy the hard way
            return super.copyFileToURL(destURL, newName, srcFs, srcURL, move);
    	}
	}

	@Override
    public void readFileAtURL(LocalFilesystemURL inputURL, long start, long end,
			ReadFileCallback readFileCallback) throws IOException {

		File file = new File(this.filesystemPathForURL(inputURL));
        String contentType = FileHelper.getMimeTypeForExtension(file.getAbsolutePath());
		
        if (end < 0) {
            end = file.length();
        }
        long numBytesToRead = end - start;

        InputStream rawInputStream = new FileInputStream(file);
		try {
			if (start > 0) {
                rawInputStream.skip(start);
			}
            LimitedInputStream inputStream = new LimitedInputStream(rawInputStream, numBytesToRead);
            readFileCallback.handleData(inputStream, contentType);
		} finally {
            rawInputStream.close();
		}
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
            FileOutputStream out = new FileOutputStream(this.filesystemPathForURL(inputURL), append);
            try {
            	in.read(buff, 0, buff.length);
            	out.write(buff, 0, rawData.length);
            	out.flush();
            } finally {
            	// Always close the output
            	out.close();
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

	@Override
	public long truncateFileAtURL(LocalFilesystemURL inputURL, long size) throws IOException {
        File file = new File(filesystemPathForURL(inputURL));

        if (!file.exists()) {
            throw new FileNotFoundException("File at " + inputURL.URL + " does not exist.");
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

	@Override
	OutputStream getOutputStreamForURL(LocalFilesystemURL inputURL) throws FileNotFoundException {
		String path = filesystemPathForURL(inputURL);
		File file = new File(path);
		FileOutputStream os = new FileOutputStream(file);
		return os;
	}

}
