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

using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.Serialization;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using Microsoft.Phone.Controls;
using Microsoft.Phone.Shell;

#if WP8
using System.Threading.Tasks;
using Windows.ApplicationModel;
using Windows.Storage;
using Windows.System;

//Use alias in case Cordova File Plugin is enabled. Then the File class will be declared in both and error will occur.
using IOFile = System.IO.File;
#else
using Microsoft.Phone.Tasks;
#endif

namespace WPCordovaClassLib.Cordova.Commands
{
    [DataContract]
    public class BrowserOptions
    {
        [DataMember]
        public string url;

        [DataMember]
        public bool isGeolocationEnabled;
    }

    public class InAppBrowser : BaseCommand
    {

        private static WebBrowser browser;
        private static ApplicationBarIconButton backButton;
        private static ApplicationBarIconButton fwdButton;

        protected ApplicationBar AppBar;

        protected bool ShowLocation {get;set;}
        protected bool StartHidden  {get;set;}

        protected string NavigationCallbackId { get; set; }

        public void open(string options)
        {
            // reset defaults on ShowLocation + StartHidden features 
            ShowLocation = true;
            StartHidden = false;

            string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
            //BrowserOptions opts = JSON.JsonHelper.Deserialize<BrowserOptions>(options);
            string urlLoc = args[0];
            string target = args[1];
            string featString = args[2];
            this.NavigationCallbackId = args[3];

            if (!string.IsNullOrEmpty(featString))
            {
                string[] features = featString.Split(',');
                foreach (string str in features)
                {
                    try
                    {
                        string[] split = str.Split('=');
                        switch (split[0])
                        {
                            case "location":
                                ShowLocation = split[1].StartsWith("yes", StringComparison.OrdinalIgnoreCase);
                                break;
                            case "hidden":
                                StartHidden = split[1].StartsWith("yes", StringComparison.OrdinalIgnoreCase);
                                break;
                        }
                    }
                    catch (Exception)
                    {
                        // some sort of invalid param was passed, moving on ...
                    }
                }
            }
            /*
                _self - opens in the Cordova WebView if url is in the white-list, else it opens in the InAppBrowser 
                _blank - always open in the InAppBrowser 
                _system - always open in the system web browser 
            */
            switch (target)
            {
                case "_blank":
                    ShowInAppBrowser(urlLoc);
                    break;
                case "_self":
                    ShowCordovaBrowser(urlLoc);
                    break;
                case "_system":
                    ShowSystemBrowser(urlLoc);
                    break;
            }
        }

        public void show(string options)
        {
            string[] args = JSON.JsonHelper.Deserialize<string[]>(options);


            if (browser != null)
            {
                Deployment.Current.Dispatcher.BeginInvoke(() =>
                {
                    browser.Visibility = Visibility.Visible;
                    AppBar.IsVisible = true;
                });
            }
        }

        public void injectScriptCode(string options)
        {
            string[] args = JSON.JsonHelper.Deserialize<string[]>(options);

            bool bCallback = false;
            if (bool.TryParse(args[1], out bCallback)) { };

            string callbackId = args[2];

            if (browser != null)
            {
                Deployment.Current.Dispatcher.BeginInvoke(() =>
                {
                    var res = browser.InvokeScript("eval", new string[] { args[0] });

                    if (bCallback)
                    {
                        PluginResult result = new PluginResult(PluginResult.Status.OK, res.ToString());
                        result.KeepCallback = false;
                        this.DispatchCommandResult(result);
                    }

                });
            }
        }

        public void injectScriptFile(string options)
        {
            Debug.WriteLine("Error : Windows Phone cordova-plugin-inappbrowser does not currently support executeScript");
            string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
            // throw new NotImplementedException("Windows Phone does not currently support 'executeScript'");
        }

        public void injectStyleCode(string options)
        {
            Debug.WriteLine("Error : Windows Phone cordova-plugin-inappbrowser does not currently support insertCSS");
            return;

            //string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
            //bool bCallback = false;
            //if (bool.TryParse(args[1], out bCallback)) { };

            //string callbackId = args[2];

            //if (browser != null)
            //{
                //Deployment.Current.Dispatcher.BeginInvoke(() =>
                //{
                //    if (bCallback)
                //    {
                //        string cssInsertString = "try{(function(doc){var c = '<style>body{background-color:#ffff00;}</style>'; doc.head.innerHTML += c;})(document);}catch(ex){alert('oops : ' + ex.message);}";
                //        //cssInsertString = cssInsertString.Replace("_VALUE_", args[0]);
                //        Debug.WriteLine("cssInsertString = " + cssInsertString);
                //        var res = browser.InvokeScript("eval", new string[] { cssInsertString });
                //        if (bCallback)
                //        {
                //            PluginResult result = new PluginResult(PluginResult.Status.OK, res.ToString());
                //            result.KeepCallback = false;
                //            this.DispatchCommandResult(result);
                //        }
                //    }

                //});
            //}
        }

        public void injectStyleFile(string options)
        {
            Debug.WriteLine("Error : Windows Phone cordova-plugin-inappbrowser does not currently support insertCSS");
            return;

            //string[] args = JSON.JsonHelper.Deserialize<string[]>(options);
            //throw new NotImplementedException("Windows Phone does not currently support 'insertCSS'");
        }

        private void ShowCordovaBrowser(string url)
        {
            Uri loc = new Uri(url, UriKind.RelativeOrAbsolute);
            Deployment.Current.Dispatcher.BeginInvoke(() =>
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
                            WebBrowser br = cView.Browser;
                            br.Navigate2(loc);
                        }
                    }

                }
            });
        }

#if WP8
        private async void ShowSystemBrowser(string url)
        {
            var pathUri = new Uri(url, UriKind.Absolute);
            if (pathUri.Scheme == Uri.UriSchemeHttp || pathUri.Scheme == Uri.UriSchemeHttps)
            {
                await Launcher.LaunchUriAsync(pathUri);
                return;
            }

            var file = await GetFile(pathUri.AbsolutePath.Replace('/', Path.DirectorySeparatorChar));
            if (file != null)
            {
                await Launcher.LaunchFileAsync(file);
            }
            else
            {
                Debug.WriteLine("File not found.");
            }
        }

        private async Task<StorageFile> GetFile(string fileName)
        {
            //first try to get the file from the isolated storage
            var localFolder = ApplicationData.Current.LocalFolder;
            if (IOFile.Exists(Path.Combine(localFolder.Path, fileName)))
            {
                return await localFolder.GetFileAsync(fileName);
            }

            //if file is not found try to get it from the xap
            var filePath = Path.Combine(Package.Current.InstalledLocation.Path, fileName);
            if (IOFile.Exists(filePath))
            {
                return await StorageFile.GetFileFromPathAsync(filePath);
            }

            return null;
        }
#else
        private void ShowSystemBrowser(string url)
        {
            WebBrowserTask webBrowserTask = new WebBrowserTask();
            webBrowserTask.Uri = new Uri(url, UriKind.Absolute);
            webBrowserTask.Show();
        }
#endif

        private void ShowInAppBrowser(string url)
        {
            Uri loc = new Uri(url, UriKind.RelativeOrAbsolute);

            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                if (browser != null)
                {
                    //browser.IsGeolocationEnabled = opts.isGeolocationEnabled;
                    browser.Navigate2(loc);
                }
                else
                {
                    PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
                    if (frame != null)
                    {
                        PhoneApplicationPage page = frame.Content as PhoneApplicationPage;

                        string baseImageUrl = "Images/";

                        if (page != null)
                        {
                            Grid grid = page.FindName("LayoutRoot") as Grid;
                            if (grid != null)
                            {
                                browser = new WebBrowser();
                                browser.IsScriptEnabled = true;
                                browser.LoadCompleted += new System.Windows.Navigation.LoadCompletedEventHandler(browser_LoadCompleted);

                                browser.Navigating += new EventHandler<NavigatingEventArgs>(browser_Navigating);
                                browser.NavigationFailed += new System.Windows.Navigation.NavigationFailedEventHandler(browser_NavigationFailed);
                                browser.Navigated += new EventHandler<System.Windows.Navigation.NavigationEventArgs>(browser_Navigated);
                                browser.Navigate2(loc);

                                if (StartHidden)
                                {
                                    browser.Visibility = Visibility.Collapsed;
                                }

                                //browser.IsGeolocationEnabled = opts.isGeolocationEnabled;
                                grid.Children.Add(browser);
                            }

                            ApplicationBar bar = new ApplicationBar();
                            bar.BackgroundColor = Colors.Gray;
                            bar.IsMenuEnabled = false;

                            backButton = new ApplicationBarIconButton();
                            backButton.Text = "Back";

                            backButton.IconUri = new Uri(baseImageUrl + "appbar.back.rest.png", UriKind.Relative);
                            backButton.Click += new EventHandler(backButton_Click);
                            bar.Buttons.Add(backButton);


                            fwdButton = new ApplicationBarIconButton();
                            fwdButton.Text = "Forward";
                            fwdButton.IconUri = new Uri(baseImageUrl + "appbar.next.rest.png", UriKind.Relative);
                            fwdButton.Click += new EventHandler(fwdButton_Click);
                            bar.Buttons.Add(fwdButton);

                            ApplicationBarIconButton closeBtn = new ApplicationBarIconButton();
                            closeBtn.Text = "Close";
                            closeBtn.IconUri = new Uri(baseImageUrl + "appbar.close.rest.png", UriKind.Relative);
                            closeBtn.Click += new EventHandler(closeBtn_Click);
                            bar.Buttons.Add(closeBtn);

                            page.ApplicationBar = bar;
                            bar.IsVisible = !StartHidden;
                            AppBar = bar;

                            page.BackKeyPress += page_BackKeyPress;

                        }

                    }
                }
            });
        }

        void page_BackKeyPress(object sender, System.ComponentModel.CancelEventArgs e)
        {
#if WP8
            if (browser.CanGoBack)
            {
                browser.GoBack();
            }
            else
            {
                close();
            }
            e.Cancel = true;
#else
                    browser.InvokeScript("execScript", "history.back();");
#endif
        }

        void browser_LoadCompleted(object sender, System.Windows.Navigation.NavigationEventArgs e)
        {

        }

        void fwdButton_Click(object sender, EventArgs e)
        {
            if (browser != null)
            {
                try
                {
#if WP8
                    browser.GoForward();
#else
                    browser.InvokeScript("execScript", "history.forward();");
#endif
                }
                catch (Exception)
                {

                }
            }
        }

        void backButton_Click(object sender, EventArgs e)
        {
            if (browser != null)
            {
                try
                {
#if WP8
                    browser.GoBack();
#else
                    browser.InvokeScript("execScript", "history.back();");
#endif
                }
                catch (Exception)
                {

                }
            }
        }

        void closeBtn_Click(object sender, EventArgs e)
        {
            this.close();
        }


        public void close(string options = "")
        {
            if (browser != null)
            {
                Deployment.Current.Dispatcher.BeginInvoke(() =>
                {
                    PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
                    if (frame != null)
                    {
                        PhoneApplicationPage page = frame.Content as PhoneApplicationPage;
                        if (page != null)
                        {
                            Grid grid = page.FindName("LayoutRoot") as Grid;
                            if (grid != null)
                            {
                                grid.Children.Remove(browser);
                            }
                            page.ApplicationBar = null;
                            page.BackKeyPress -= page_BackKeyPress;
                        }
                    }
                   
                    browser = null;
                    string message = "{\"type\":\"exit\"}";
                    PluginResult result = new PluginResult(PluginResult.Status.OK, message);
                    result.KeepCallback = false;
                    this.DispatchCommandResult(result, NavigationCallbackId);
                });
            }
        }

        void browser_Navigated(object sender, System.Windows.Navigation.NavigationEventArgs e)
        {
#if WP8
            if (browser != null)
            {
                backButton.IsEnabled = browser.CanGoBack;
                fwdButton.IsEnabled = browser.CanGoForward;

            }
#endif
            string message = "{\"type\":\"loadstop\", \"url\":\"" + e.Uri.OriginalString + "\"}";
            PluginResult result = new PluginResult(PluginResult.Status.OK, message);
            result.KeepCallback = true;
            this.DispatchCommandResult(result, NavigationCallbackId);
        }

        void browser_NavigationFailed(object sender, System.Windows.Navigation.NavigationFailedEventArgs e)
        {
            string message = "{\"type\":\"error\",\"url\":\"" + e.Uri.OriginalString + "\"}";
            PluginResult result = new PluginResult(PluginResult.Status.ERROR, message);
            result.KeepCallback = true;
            this.DispatchCommandResult(result, NavigationCallbackId);
        }

        void browser_Navigating(object sender, NavigatingEventArgs e)
        {
            string message = "{\"type\":\"loadstart\",\"url\":\"" + e.Uri.OriginalString + "\"}";
            PluginResult result = new PluginResult(PluginResult.Status.OK, message);
            result.KeepCallback = true;
            this.DispatchCommandResult(result, NavigationCallbackId);
        }

    }

    internal static class WebBrowserExtensions
    {
        /// <summary>
        /// Improved method to initiate request to the provided URI. Supports 'data:text/html' urls. 
        /// </summary>
        /// <param name="browser">The browser instance</param>
        /// <param name="uri">The requested uri</param>
        internal static void Navigate2(this WebBrowser browser, Uri uri)
        {
            // IE10 does not support data uri so we use NavigateToString method instead
            if (uri.Scheme == "data")
            {
                // we should remove the scheme identifier and unescape the uri
                string uriString = Uri.UnescapeDataString(uri.AbsoluteUri);
                // format is 'data:text/html, ...'
                string html = new System.Text.RegularExpressions.Regex("^data:text/html,").Replace(uriString, "");
                browser.NavigateToString(html);
            }
            else 
            {
                browser.Navigate(uri);
            }
        }
    }
}
