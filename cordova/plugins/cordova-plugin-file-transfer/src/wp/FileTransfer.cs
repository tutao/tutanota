/*
	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

using Microsoft.Phone.Controls;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.IsolatedStorage;
using System.Linq;
using System.Net;
using System.Runtime.Serialization;
using System.Windows;
using System.Security;
using System.Diagnostics;
using System.Threading.Tasks;
using WPCordovaClassLib.Cordova.JSON;
using System.Reflection;

namespace WPCordovaClassLib.Cordova.Commands
{
    public class FileTransfer : BaseCommand
    {
        public class DownloadRequestState
        {
            // This class stores the State of the request.
            public HttpWebRequest request;
            public TransferOptions options;
            public bool isCancelled;

            public DownloadRequestState()
            {
                request = null;
                options = null;
                isCancelled = false;
            }
        }

        public class TransferOptions
        {
            /// File path to upload  OR File path to download to
            public string FilePath { get; set; }

            public string Url { get; set; }
            /// Flag to recognize if we should trust every host (only in debug environments)
            public bool TrustAllHosts { get; set; }
            public string Id { get; set; }
            public string Headers { get; set; }
            public string CallbackId { get; set; }
            public bool ChunkedMode { get; set; }
            /// Server address
            public string Server { get; set; }
            /// File key
            public string FileKey { get; set; }
            /// File name on the server
            public string FileName { get; set; }
            /// File Mime type
            public string MimeType { get; set; }
            /// Additional options
            public string Params { get; set; }
            public string Method { get; set; }

            public TransferOptions()
            {
                FileKey = "file";
                FileName = "image.jpg";
                MimeType = "image/jpeg";
            }
        }

        /// <summary>
        /// Boundary symbol
        /// </summary>
        private string Boundary = "----------------------------" + DateTime.Now.Ticks.ToString("x");

        // Error codes
        public const int FileNotFoundError = 1;
        public const int InvalidUrlError = 2;
        public const int ConnectionError = 3;
        public const int AbortError = 4; // not really an error, but whatevs

        private static Dictionary<string, DownloadRequestState> InProcDownloads = new Dictionary<string,DownloadRequestState>();

        // Private instance of the main WebBrowser instance
        // NOTE: Any access to this object needs to occur on the UI thread via the Dispatcher
        private WebBrowser browser;



        /// <summary>
        /// Uploading response info
        /// </summary>
        [DataContract]
        public class FileUploadResult
        {
            /// <summary>
            /// Amount of sent bytes
            /// </summary>
            [DataMember(Name = "bytesSent")]
            public long BytesSent { get; set; }

            /// <summary>
            /// Server response code
            /// </summary>
            [DataMember(Name = "responseCode")]
            public long ResponseCode { get; set; }

            /// <summary>
            /// Server response
            /// </summary>
            [DataMember(Name = "response", EmitDefaultValue = false)]
            public string Response { get; set; }

            /// <summary>
            /// Creates FileUploadResult object with response values
            /// </summary>
            /// <param name="bytesSent">Amount of sent bytes</param>
            /// <param name="responseCode">Server response code</param>
            /// <param name="response">Server response</param>
            public FileUploadResult(long bytesSent, long responseCode, string response)
            {
                this.BytesSent = bytesSent;
                this.ResponseCode = responseCode;
                this.Response = response;
            }
        }
        /// <summary>
        /// Represents transfer error codes for callback
        /// </summary>
        [DataContract]
        public class FileTransferError
        {
            /// <summary>
            /// Error code
            /// </summary>
            [DataMember(Name = "code", IsRequired = true)]
            public int Code { get; set; }

            /// <summary>
            /// The source URI
            /// </summary>
            [DataMember(Name = "source", IsRequired = true)]
            public string Source { get; set; }

            /// <summary>
            /// The target URI
            /// </summary>
            ///
            [DataMember(Name = "target", IsRequired = true)]
            public string Target { get; set; }

            [DataMember(Name = "body", IsRequired = true)]
            public string Body { get; set; }

            /// <summary>
            /// The http status code response from the remote URI
            /// </summary>
            [DataMember(Name = "http_status", IsRequired = true)]
            public int HttpStatus { get; set; }

            /// <summary>
            /// Creates FileTransferError object
            /// </summary>
            /// <param name="errorCode">Error code</param>
            public FileTransferError(int errorCode)
            {
                this.Code = errorCode;
                this.Source = null;
                this.Target = null;
                this.HttpStatus = 0;
                this.Body = "";
            }
            public FileTransferError(int errorCode, string source, string target, int status, string body = "")
            {
                this.Code = errorCode;
                this.Source = source;
                this.Target = target;
                this.HttpStatus = status;
                this.Body = body;
            }
        }

        /// <summary>
        /// Represents a singular progress event to be passed back to javascript
        /// </summary>
        [DataContract]
        public class FileTransferProgress
        {
            /// <summary>
            /// Is the length of the response known?
            /// </summary>
            [DataMember(Name = "lengthComputable", IsRequired = true)]
            public bool LengthComputable { get; set; }
            /// <summary>
            /// amount of bytes loaded
            /// </summary>
            [DataMember(Name = "loaded", IsRequired = true)]
            public long BytesLoaded { get; set; }
            /// <summary>
            /// Total bytes
            /// </summary>
            [DataMember(Name = "total", IsRequired = false)]
            public long BytesTotal { get; set; }

            public FileTransferProgress(long bTotal = 0, long bLoaded = 0)
            {
                LengthComputable = bTotal > 0;
                BytesLoaded = bLoaded;
                BytesTotal = bTotal;
            }
        }

        /// <summary>
        /// Represents a request header passed from Javascript to upload/download operations
        /// </summary>
        [DataContract]
        protected struct Header
        {
            [DataMember(Name = "name")]
            public string Name;

            [DataMember(Name = "value")]
            public string Value;
        }

        private static MethodInfo JsonDeserializeUsingJsonNet;

        public FileTransfer()
        {
            if (JsonDeserializeUsingJsonNet == null)
            {
                var method = typeof(JsonHelper).GetMethod("Deserialize", new Type[] { typeof(string), typeof(bool) });
                if (method != null) 
                {
                    JsonDeserializeUsingJsonNet = method.MakeGenericMethod(new Type[] { typeof(Header[]) });
                }
            }
        }

        /// Helper method to copy all relevant cookies from the WebBrowser control into a header on
        /// the HttpWebRequest
        /// </summary>
        /// <param name="browser">The source browser to copy the cookies from</param>
        /// <param name="webRequest">The destination HttpWebRequest to add the cookie header to</param>
        /// <returns>Nothing</returns>
        private async Task CopyCookiesFromWebBrowser(HttpWebRequest webRequest)
        {
            var tcs = new TaskCompletionSource<object>();

            // Accessing WebBrowser needs to happen on the UI thread
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                // Get the WebBrowser control
                if (this.browser == null)
                {
                    PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
                    if (frame != null)
                    {
                        PhoneApplicationPage page = frame.Content as PhoneApplicationPage;
                        if (page != null)
                        {
                            CordovaView cView = page.FindName("CordovaView") as CordovaView;
                            if (cView != null)
                            {
                                this.browser = cView.Browser;
                            }
                        }
                    }
                }

                try
                {
                    // Only copy the cookies if the scheme and host match (to avoid any issues with secure/insecure cookies)
                    // NOTE: since the returned CookieCollection appears to munge the original cookie's domain value in favor of the actual Source domain,
                    // we can't know for sure whether the cookies would be applicable to any other hosts, so best to play it safe and skip for now.
                    if (this.browser != null && this.browser.Source.IsAbsoluteUri == true &&
                        this.browser.Source.Scheme == webRequest.RequestUri.Scheme && this.browser.Source.Host == webRequest.RequestUri.Host)
                    {
                        string cookieHeader = "";
                        string requestPath = webRequest.RequestUri.PathAndQuery;
                        CookieCollection cookies = this.browser.GetCookies();

                        // Iterate over the cookies and add to the header
                        foreach (Cookie cookie in cookies)
                        {
                            // Check that the path is allowed, first
                            // NOTE: Path always seems to be empty for now, even if the cookie has a path set by the server.
                            if (cookie.Path.Length == 0 || requestPath.IndexOf(cookie.Path, StringComparison.InvariantCultureIgnoreCase) == 0)
                            {
                                cookieHeader += cookie.Name + "=" + cookie.Value + "; ";
                            }
                        }

                        // Finally, set the header if we found any cookies
                        if (cookieHeader.Length > 0)
                        {
                            webRequest.Headers["Cookie"] = cookieHeader;
                        }
                    }
                }
                catch (Exception)
                {
                    // Swallow the exception
                }

                // Complete the task
                tcs.SetResult(Type.Missing);
            });

            await tcs.Task;
        }

        /// <summary>
        /// Upload options
        /// </summary>
        //private TransferOptions uploadOptions;

        /// <summary>
        /// Bytes sent
        /// </summary>
        private long bytesSent;

        /// <summary>
        /// sends a file to a server
        /// </summary>
        /// <param name="options">Upload options</param>
        /// exec(win, fail, 'FileTransfer', 'upload', [filePath, server, fileKey, fileName, mimeType, params, trustAllHosts, chunkedMode, headers, this._id, httpMethod]);
        public void upload(string options)
        {
            options = options.Replace("{}", ""); // empty objects screw up the Deserializer
            string callbackId = "";

            TransferOptions uploadOptions = null;
            HttpWebRequest webRequest = null;

            try
            {
                try
                {
                    string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
                    uploadOptions = new TransferOptions();
                    uploadOptions.FilePath = args[0];
                    uploadOptions.Server = args[1];
                    uploadOptions.FileKey = args[2];
                    uploadOptions.FileName = args[3];
                    uploadOptions.MimeType = args[4];
                    uploadOptions.Params = args[5];

                    bool trustAll = false;
                    bool.TryParse(args[6],out trustAll);
                    uploadOptions.TrustAllHosts = trustAll;

                    bool doChunked = false;
                    bool.TryParse(args[7], out doChunked);
                    uploadOptions.ChunkedMode = doChunked;

                    //8 : Headers
                    //9 : id
                    //10: method

                    uploadOptions.Headers = args[8];
                    uploadOptions.Id = args[9];
                    uploadOptions.Method = args[10];

                    uploadOptions.CallbackId = callbackId = args[11];
                }
                catch (Exception)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                    return;
                }

                Uri serverUri;
                try
                {
                    serverUri = new Uri(uploadOptions.Server);
                }
                catch (Exception)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(InvalidUrlError, uploadOptions.Server, null, 0)));
                    return;
                }
                webRequest = (HttpWebRequest)WebRequest.Create(serverUri);
                webRequest.ContentType = "multipart/form-data; boundary=" + Boundary;
                webRequest.Method = uploadOptions.Method;

                DownloadRequestState reqState = new DownloadRequestState();
                InProcDownloads[uploadOptions.Id] = reqState;
                reqState.options = uploadOptions;
                reqState.request = webRequest;

                try
                {
                    // Associate cookies with the request
                    // This is an async call, so we need to await it in order to preserve proper control flow
                    Task cookieTask = CopyCookiesFromWebBrowser(webRequest);
                    cookieTask.Wait();
                }
                catch (AggregateException ae)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR,
                        new FileTransferError(FileTransfer.ConnectionError, uploadOptions.FilePath, uploadOptions.Server, 0, ae.InnerException.Message)));
                    return;
                }

                if (!string.IsNullOrEmpty(uploadOptions.Headers))
                {
                    Dictionary<string, string> headers = parseHeaders(uploadOptions.Headers);
                    if (headers != null)
                    {
                        foreach (string key in headers.Keys)
                        {
                            webRequest.Headers[key] = headers[key];
                        }
                    }
                }

                webRequest.BeginGetRequestStream(uploadCallback, reqState);
            }
            catch (Exception /*ex*/)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(ConnectionError)),callbackId);
            }
        }

        // example : "{\"Authorization\":\"Basic Y29yZG92YV91c2VyOmNvcmRvdmFfcGFzc3dvcmQ=\"}"
        protected Dictionary<string,string> parseHeaders(string jsonHeaders)
        {
            try
            {
                if (FileTransfer.JsonDeserializeUsingJsonNet != null)
                {
                    return ((Header[])FileTransfer.JsonDeserializeUsingJsonNet.Invoke(null, new object[] { jsonHeaders, true }))
                         .ToDictionary(header => header.Name, header => header.Value);
                }
                else
                {
                    return JsonHelper.Deserialize<Header[]>(jsonHeaders)
                        .ToDictionary(header => header.Name, header => header.Value);
                }
            }
            catch (Exception)
            {
                Debug.WriteLine("Failed to parseHeaders from string :: " + jsonHeaders);
            }
            return new Dictionary<string, string>();
        }

        public void download(string options)
        {
            TransferOptions downloadOptions = null;
            HttpWebRequest webRequest = null;
            string callbackId;

            try
            {
                // source, target, trustAllHosts, this._id, headers
                string[] optionStrings = JSON.JsonHelper.Deserialize<string[]>(options);

                downloadOptions = new TransferOptions();
                downloadOptions.Url = optionStrings[0];
                downloadOptions.FilePath = optionStrings[1];

                bool trustAll = false;
                bool.TryParse(optionStrings[2],out trustAll);
                downloadOptions.TrustAllHosts = trustAll;

                downloadOptions.Id = optionStrings[3];
                downloadOptions.Headers = optionStrings[4];
                downloadOptions.CallbackId = callbackId = optionStrings[5];
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.JSON_EXCEPTION));
                return;
            }

            try
            {
                // is the URL a local app file?
                if (downloadOptions.Url.StartsWith("x-wmapp0") || downloadOptions.Url.StartsWith("file:"))
                {
                    using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                    {
                        string cleanUrl = downloadOptions.Url.Replace("x-wmapp0:", "").Replace("file:", "").Replace("//","");

                        // pre-emptively create any directories in the FilePath that do not exist
                        string directoryName = getDirectoryName(downloadOptions.FilePath);
                        if (!string.IsNullOrEmpty(directoryName) && !isoFile.DirectoryExists(directoryName))
                        {
                            isoFile.CreateDirectory(directoryName);
                        }

                        // just copy from one area of iso-store to another ...
                        if (isoFile.FileExists(downloadOptions.Url))
                        {
                            isoFile.CopyFile(downloadOptions.Url, downloadOptions.FilePath);
                        }
                        else
                        {
                            // need to unpack resource from the dll
                            Uri uri = new Uri(cleanUrl, UriKind.Relative);
                            var resource = Application.GetResourceStream(uri);

                            if (resource != null)
                            {
                                // create the file destination
                                if (!isoFile.FileExists(downloadOptions.FilePath))
                                {
                                    var destFile = isoFile.CreateFile(downloadOptions.FilePath);
                                    destFile.Close();
                                }

                                using (FileStream fileStream = new IsolatedStorageFileStream(downloadOptions.FilePath, FileMode.Open, FileAccess.Write, isoFile))
                                {
                                    long totalBytes = resource.Stream.Length;
                                    int bytesRead = 0;
                                    using (BinaryReader reader = new BinaryReader(resource.Stream))
                                    {
                                        using (BinaryWriter writer = new BinaryWriter(fileStream))
                                        {
                                            int BUFFER_SIZE = 1024;
                                            byte[] buffer;

                                            while (true)
                                            {
                                                buffer = reader.ReadBytes(BUFFER_SIZE);
                                                // fire a progress event ?
                                                bytesRead += buffer.Length;
                                                if (buffer.Length > 0)
                                                {
                                                    writer.Write(buffer);
                                                    DispatchFileTransferProgress(bytesRead, totalBytes, callbackId);
                                                }
                                                else
                                                {
                                                    writer.Close();
                                                    reader.Close();
                                                    fileStream.Close();
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    File.FileEntry entry = File.FileEntry.GetEntry(downloadOptions.FilePath);
                    if (entry != null)
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.OK, entry), callbackId);
                    }
                    else
                    {
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, File.NOT_FOUND_ERR), callbackId);
                    }

                    return;
                }
                else
                {
                    // otherwise it is web-bound, we will actually download it
                    //Debug.WriteLine("Creating WebRequest for url : " + downloadOptions.Url);
                    webRequest = (HttpWebRequest)WebRequest.Create(downloadOptions.Url);
                }
            }
            catch (Exception /*ex*/)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR,
                                      new FileTransferError(InvalidUrlError, downloadOptions.Url, null, 0)));
                return;
            }

            if (downloadOptions != null && webRequest != null)
            {
                DownloadRequestState state = new DownloadRequestState();
                state.options = downloadOptions;
                state.request = webRequest;
                InProcDownloads[downloadOptions.Id] = state;

                try
                {
                    // Associate cookies with the request
                    // This is an async call, so we need to await it in order to preserve proper control flow
                    Task cookieTask = CopyCookiesFromWebBrowser(webRequest);
                    cookieTask.Wait();
                }
                catch (AggregateException ae) 
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR,
                        new FileTransferError(FileTransfer.ConnectionError, downloadOptions.Url, downloadOptions.FilePath, 0, ae.InnerException.Message)));
                    return;
                }

                if (!string.IsNullOrEmpty(downloadOptions.Headers))
                {
                    Dictionary<string, string> headers = parseHeaders(downloadOptions.Headers);
                    foreach (string key in headers.Keys)
                    {
                        webRequest.Headers[key] = headers[key];
                    }
                }

                try
                {
                    webRequest.BeginGetResponse(new AsyncCallback(downloadCallback), state);
                }
                catch (WebException)
                {
                    // eat it
                }
                // dispatch an event for progress ( 0 )
                lock (state)
                {
                    if (!state.isCancelled)
                    {
                        var plugRes = new PluginResult(PluginResult.Status.OK, new FileTransferProgress());
                        plugRes.KeepCallback = true;
                        plugRes.CallbackId = callbackId;
                        DispatchCommandResult(plugRes, callbackId);
                    }
                }
            }
        }

        public void abort(string options)
        {
            Debug.WriteLine("Abort :: " + options);
            string[] optionStrings = JSON.JsonHelper.Deserialize<string[]>(options);
            string id = optionStrings[0];
            string callbackId = optionStrings[1];

            if (id != null && InProcDownloads.ContainsKey(id))
            {
                DownloadRequestState state = InProcDownloads[id];
                if (!state.isCancelled)
                { // prevent multiple callbacks for the same abort
                    state.isCancelled = true;
                    if (!state.request.HaveResponse)
                    {
                        state.request.Abort();
                        InProcDownloads.Remove(id);
                        //callbackId = state.options.CallbackId;
                        //state = null;
                        DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR,
                                                               new FileTransferError(FileTransfer.AbortError)),
                                                               state.options.CallbackId);
                    }
                }
            }
            else
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.IO_EXCEPTION), callbackId); // TODO: is it an IO exception?
            }
        }

        private void DispatchFileTransferProgress(long bytesLoaded, long bytesTotal, string callbackId, bool keepCallback = true)
        {
            Debug.WriteLine("DispatchFileTransferProgress : " + callbackId);
            // send a progress change event
            FileTransferProgress progEvent = new FileTransferProgress(bytesTotal);
            progEvent.BytesLoaded = bytesLoaded;
            PluginResult plugRes = new PluginResult(PluginResult.Status.OK, progEvent);
            plugRes.KeepCallback = keepCallback;
            plugRes.CallbackId = callbackId;
            DispatchCommandResult(plugRes, callbackId);
        }

        /// <summary>
        ///
        /// </summary>
        /// <param name="asynchronousResult"></param>
        private void downloadCallback(IAsyncResult asynchronousResult)
        {
            DownloadRequestState reqState = (DownloadRequestState)asynchronousResult.AsyncState;
            HttpWebRequest request = reqState.request;

            string callbackId = reqState.options.CallbackId;
            try
            {
                HttpWebResponse response = (HttpWebResponse)request.EndGetResponse(asynchronousResult);

                // send a progress change event
                DispatchFileTransferProgress(0, response.ContentLength, callbackId);

                using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                {
                    // create any directories in the path that do not exist
                    string directoryName = getDirectoryName(reqState.options.FilePath);
                    if (!string.IsNullOrEmpty(directoryName) && !isoFile.DirectoryExists(directoryName))
                    {
                        isoFile.CreateDirectory(directoryName);
                    }

                    // create the file if not exists
                    if (!isoFile.FileExists(reqState.options.FilePath))
                    {
                        var file = isoFile.CreateFile(reqState.options.FilePath);
                        file.Close();
                    }

                    using (FileStream fileStream = new IsolatedStorageFileStream(reqState.options.FilePath, FileMode.Open, FileAccess.Write, isoFile))
                    {
                        long totalBytes = response.ContentLength;
                        int bytesRead = 0;
                        using (BinaryReader reader = new BinaryReader(response.GetResponseStream()))
                        {
                            using (BinaryWriter writer = new BinaryWriter(fileStream))
                            {
                                int BUFFER_SIZE = 1024;
                                byte[] buffer;

                                while (true)
                                {
                                    buffer = reader.ReadBytes(BUFFER_SIZE);
                                    // fire a progress event ?
                                    bytesRead += buffer.Length;
                                    if (buffer.Length > 0 && !reqState.isCancelled)
                                    {
                                        writer.Write(buffer);
                                        DispatchFileTransferProgress(bytesRead, totalBytes, callbackId);
                                    }
                                    else
                                    {
                                        writer.Close();
                                        reader.Close();
                                        fileStream.Close();
                                        break;
                                    }
                                    System.Threading.Thread.Sleep(1);
                                }
                            }
                        }
                    }
                    if (reqState.isCancelled)
                    {
                        isoFile.DeleteFile(reqState.options.FilePath);
                    }
                }

                if (reqState.isCancelled)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(AbortError)),
                  callbackId);
                }
                else
                {
                    File.FileEntry entry = new File.FileEntry(reqState.options.FilePath);
                    DispatchCommandResult(new PluginResult(PluginResult.Status.OK, entry), callbackId);
                }
            }
            catch (IsolatedStorageException)
            {
                // Trying to write the file somewhere within the IsoStorage.
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(FileNotFoundError)),
                                      callbackId);
            }
            catch (SecurityException)
            {
                // Trying to write the file somewhere not allowed.
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(FileNotFoundError)),
                                      callbackId);
            }
            catch (WebException webex)
            {
                // TODO: probably need better work here to properly respond with all http status codes back to JS
                // Right now am jumping through hoops just to detect 404.
                HttpWebResponse response = (HttpWebResponse)webex.Response;
                if ((webex.Status == WebExceptionStatus.ProtocolError && response.StatusCode == HttpStatusCode.NotFound)
                    || webex.Status == WebExceptionStatus.UnknownError)
                {
                    // Weird MSFT detection of 404... seriously... just give us the f(*&#$@ status code as a number ffs!!!
                    // "Numbers for HTTP status codes? Nah.... let's create our own set of enums/structs to abstract that stuff away."
                    // FACEPALM
                    // Or just cast it to an int, whiner ... -jm
                    int statusCode = (int)response.StatusCode;
                    string body = "";

                    using (Stream streamResponse = response.GetResponseStream())
                    {
                        using (StreamReader streamReader = new StreamReader(streamResponse))
                        {
                            body = streamReader.ReadToEnd();
                        }
                    }
                    FileTransferError ftError = new FileTransferError(ConnectionError, null, null, statusCode, body);
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ftError),
                                          callbackId);
                }
                else
                {
                    lock (reqState)
                    {
                        if (!reqState.isCancelled)
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR,
                                                                   new FileTransferError(ConnectionError)),
                                                  callbackId);
                        }
                        else
                        {
                            Debug.WriteLine("It happened");
                        }
                    }
                }
            }
            catch (Exception)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR,
                                                        new FileTransferError(FileNotFoundError)),
                                      callbackId);
            }

            //System.Threading.Thread.Sleep(1000);
            if (InProcDownloads.ContainsKey(reqState.options.Id))
            {
                InProcDownloads.Remove(reqState.options.Id);
            }
        }

        /// <summary>
        /// Read file from Isolated Storage and sends it to server
        /// </summary>
        /// <param name="asynchronousResult"></param>
        private void uploadCallback(IAsyncResult asynchronousResult)
        {
            DownloadRequestState reqState = (DownloadRequestState)asynchronousResult.AsyncState;
            HttpWebRequest webRequest = reqState.request;
            string callbackId = reqState.options.CallbackId;

            try
            {
                using (Stream requestStream = (webRequest.EndGetRequestStream(asynchronousResult)))
                {
                    string lineStart = "--";
                    string lineEnd = Environment.NewLine;
                    byte[] boundaryBytes = System.Text.Encoding.UTF8.GetBytes(lineStart + Boundary + lineEnd);
                    string formdataTemplate = "Content-Disposition: form-data; name=\"{0}\"" + lineEnd + lineEnd + "{1}" + lineEnd;

                    if (!string.IsNullOrEmpty(reqState.options.Params))
                    {
                        Dictionary<string, string> paramMap = parseHeaders(reqState.options.Params);
                        foreach (string key in paramMap.Keys)
                        {
                            requestStream.Write(boundaryBytes, 0, boundaryBytes.Length);
                            string formItem = string.Format(formdataTemplate, key, paramMap[key]);
                            byte[] formItemBytes = System.Text.Encoding.UTF8.GetBytes(formItem);
                            requestStream.Write(formItemBytes, 0, formItemBytes.Length);
                        }
                    }
                    using (IsolatedStorageFile isoFile = IsolatedStorageFile.GetUserStoreForApplication())
                    {
                        if (!isoFile.FileExists(reqState.options.FilePath))
                        {
                            DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(FileNotFoundError, reqState.options.Server, reqState.options.FilePath, 0)));
                            return;
                        }

                        byte[] endRequest = System.Text.Encoding.UTF8.GetBytes(lineEnd + lineStart + Boundary + lineStart + lineEnd);
                        long totalBytesToSend = 0;

                        using (FileStream fileStream = new IsolatedStorageFileStream(reqState.options.FilePath, FileMode.Open, isoFile))
                        {
                            string headerTemplate = "Content-Disposition: form-data; name=\"{0}\"; filename=\"{1}\"" + lineEnd + "Content-Type: {2}" + lineEnd + lineEnd;
                            string header = string.Format(headerTemplate, reqState.options.FileKey, reqState.options.FileName, reqState.options.MimeType);
                            byte[] headerBytes = System.Text.Encoding.UTF8.GetBytes(header);

                            byte[] buffer = new byte[4096];
                            int bytesRead = 0;
                            //sent bytes needs to be reseted before new upload
                            bytesSent = 0;
                            totalBytesToSend = fileStream.Length;

                            requestStream.Write(boundaryBytes, 0, boundaryBytes.Length);

                            requestStream.Write(headerBytes, 0, headerBytes.Length);

                            while ((bytesRead = fileStream.Read(buffer, 0, buffer.Length)) != 0)
                            {
                                if (!reqState.isCancelled)
                                {
                                    requestStream.Write(buffer, 0, bytesRead);
                                    bytesSent += bytesRead;
                                    DispatchFileTransferProgress(bytesSent, totalBytesToSend, callbackId);
                                    System.Threading.Thread.Sleep(1);
                                }
                                else
                                {
                                    throw new Exception("UploadCancelledException");
                                }
                            }
                        }

                        requestStream.Write(endRequest, 0, endRequest.Length);
                    }
                }
                // webRequest

                webRequest.BeginGetResponse(ReadCallback, reqState);
            }
            catch (Exception /*ex*/)
            {
                if (!reqState.isCancelled)
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, new FileTransferError(ConnectionError)), callbackId);
                }
            }
        }

        /// <summary>
        /// Reads response into FileUploadResult
        /// </summary>
        /// <param name="asynchronousResult"></param>
        private void ReadCallback(IAsyncResult asynchronousResult)
        {
            DownloadRequestState reqState = (DownloadRequestState)asynchronousResult.AsyncState;
            try
            {
                HttpWebRequest webRequest = reqState.request;
                string callbackId = reqState.options.CallbackId;

                if (InProcDownloads.ContainsKey(reqState.options.Id))
                {
                    InProcDownloads.Remove(reqState.options.Id);
                }

                using (HttpWebResponse response = (HttpWebResponse)webRequest.EndGetResponse(asynchronousResult))
                {
                    using (Stream streamResponse = response.GetResponseStream())
                    {
                        using (StreamReader streamReader = new StreamReader(streamResponse))
                        {
                            string responseString = streamReader.ReadToEnd();
                            Deployment.Current.Dispatcher.BeginInvoke(() =>
                            {
                                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, new FileUploadResult(bytesSent, (long)response.StatusCode, responseString)));
                            });
                        }
                    }
                }
            }
            catch (WebException webex)
            {
                // TODO: probably need better work here to properly respond with all http status codes back to JS
                // Right now am jumping through hoops just to detect 404.
                if ((webex.Status == WebExceptionStatus.ProtocolError && ((HttpWebResponse)webex.Response).StatusCode == HttpStatusCode.NotFound)
                    || webex.Status == WebExceptionStatus.UnknownError)
                {
                    int statusCode = (int)((HttpWebResponse)webex.Response).StatusCode;
                    FileTransferError ftError = new FileTransferError(ConnectionError, null, null, statusCode);
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ftError), reqState.options.CallbackId);
                }
                else
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR,
                                                           new FileTransferError(ConnectionError)),
                                          reqState.options.CallbackId);
                }
            }
            catch (Exception /*ex*/)
            {
                FileTransferError transferError = new FileTransferError(ConnectionError, reqState.options.Server, reqState.options.FilePath, 403);
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, transferError), reqState.options.CallbackId);
            }
        }

        // Gets the full path without the filename
        private string getDirectoryName(String filePath)
        {
            string directoryName;
            try
            {
                directoryName = filePath.Substring(0, filePath.LastIndexOf('/'));
            }
            catch
            {
                directoryName = "";
            }
            return directoryName;
        }
    }
}
