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
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Ink;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using Microsoft.Phone.Info;
using System.Windows.Controls.Primitives;
using System.Diagnostics;
using System.Windows.Media.Imaging;
using System.Windows.Resources;
using System.IO;
using System.Xml.Linq;
using System.Linq;
using System.Windows.Threading;

namespace WPCordovaClassLib.Cordova.Commands
{
    /// <summary>
    /// Listens for changes to the state of the battery on the device.
    /// Currently only the "isPlugged" parameter available via native APIs.
    /// </summary>
    public class SplashScreen : BaseCommand
    {
        private Popup popup;

        // Time until we dismiss the splashscreen
        private int prefDelay = 3000;

        // Whether we hide it by default
        private bool prefAutoHide = true;

        // Path to image to use
        private string prefImagePath = "SplashScreenImage.jpg";

        // static because autodismiss is only ever applied once, at app launch
        // subsequent page loads should not cause the SplashScreen to be shown.
        private static bool WasShown = false;

        public SplashScreen()
        {
            LoadConfigPrefs();

            Image SplashScreen = new Image()
            {
                Height = Application.Current.Host.Content.ActualHeight,
                Width = Application.Current.Host.Content.ActualWidth,
                Stretch = Stretch.Fill
            };

            var imageResource = GetSplashScreenImageResource();
            if (imageResource != null)
            {
                BitmapImage splash_image = new BitmapImage();
                splash_image.SetSource(imageResource.Stream);
                SplashScreen.Source = splash_image;
            }

            // Instansiate the popup and set the Child property of Popup to SplashScreen
            popup = new Popup() { IsOpen = false,
                                  Child = SplashScreen,
                                  HorizontalAlignment = HorizontalAlignment.Stretch,
                                  VerticalAlignment = VerticalAlignment.Center

            };
        }

        public override void OnInit()
        {
            // we only want to autoload on the first page load.
            // but OnInit is called for every page load.
            if (!SplashScreen.WasShown)
            {
                SplashScreen.WasShown = true;
                show();
            }
        }

        private void LoadConfigPrefs()
        {
            StreamResourceInfo streamInfo = Application.GetResourceStream(new Uri("config.xml", UriKind.Relative));
            if (streamInfo != null)
            {
                using (StreamReader sr = new StreamReader(streamInfo.Stream))
                {
                    //This will Read Keys Collection for the xml file
                    XDocument configFile = XDocument.Parse(sr.ReadToEnd());

                    string configAutoHide = configFile.Descendants()
                                        .Where(x => x.Name.LocalName == "preference")
                                        .Where(x => (string)x.Attribute("name") == "AutoHideSplashScreen")
                                        .Select(x => (string)x.Attribute("value"))
                                        .FirstOrDefault();

                    bool bVal;
                    prefAutoHide = bool.TryParse(configAutoHide, out bVal) ? bVal : prefAutoHide;

                    string configDelay = configFile.Descendants()
                                      .Where(x => x.Name.LocalName == "preference")
                                      .Where(x => (string)x.Attribute("name") == "SplashScreenDelay")
                                      .Select(x => (string)x.Attribute("value"))
                                      .FirstOrDefault();
                    int nVal;
                    prefDelay = int.TryParse(configDelay, out nVal) ? nVal : prefDelay;

                    string configImage = configFile.Descendants()
                                        .Where(x => x.Name.LocalName == "preference")
                                        .Where(x => (string)x.Attribute("name") == "SplashScreen")
                                        .Select(x => (string)x.Attribute("value"))
                                        .FirstOrDefault();

                    if (!String.IsNullOrEmpty(configImage))
                    {
                        prefImagePath = configImage;
                    }
                }
            }
        }

        private StreamResourceInfo GetSplashScreenImageResource()
        {
            // Get the base filename for the splash screen images
            string imageName = System.IO.Path.GetFileNameWithoutExtension(prefImagePath);
            Uri imageUri = null;
            StreamResourceInfo imageResource = null;

            // First, try to get a resolution-specific splashscreen
            try
            {
                // Determine the device's resolution
                switch (ResolutionHelper.CurrentResolution)
                {
                    case Resolutions.HD:
                        imageUri = new Uri(imageName + ".screen-720p.jpg", UriKind.Relative);
                        break;

                    case Resolutions.WVGA:
                        imageUri = new Uri(imageName + ".screen-WVGA.jpg", UriKind.Relative);
                        break;

                    case Resolutions.WXGA:
                    default:
                        imageUri = new Uri(imageName + ".screen-WXGA.jpg", UriKind.Relative);
                        break;
                }

                imageResource = Application.GetResourceStream(imageUri);
            }
            catch (Exception)
            {
                // It's OK if we didn't get a resolution-specific image
            }

            // Fallback to the default image name without decoration
            if (imageResource == null)
            {
                imageUri = new Uri(prefImagePath, UriKind.Relative);
                imageResource = Application.GetResourceStream(imageUri);
            }

            if (imageUri != null) Debug.WriteLine("INFO :: SplashScreen: using image {0}", imageUri.OriginalString);

            return imageResource;
        }

        public void show(string options = null)
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                if (!popup.IsOpen)
                {
                    popup.Child.Opacity = 0;

                    Storyboard story = new Storyboard();
                    DoubleAnimation animation = new DoubleAnimation()
                                                    {
                                                        From = 0.0,
                                                        To = 1.0,
                                                        Duration = new Duration(TimeSpan.FromSeconds(0.2))
                                                    };

                    Storyboard.SetTarget(animation, popup.Child);
                    Storyboard.SetTargetProperty(animation, new PropertyPath("Opacity"));
                    story.Children.Add(animation);

                    story.Begin();

                    popup.IsOpen = true;

                    if (prefAutoHide)
                    {
                        StartAutoHideTimer();
                    }
                }
            });
        }

        public void hide(string options = null)
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                if (popup.IsOpen)
                {
                    popup.Child.Opacity = 1.0;

                    Storyboard story = new Storyboard();
                    DoubleAnimation animation = new DoubleAnimation()
                                                    {
                                                        From = 1.0,
                                                        To = 0.0,
                                                        Duration = new Duration(TimeSpan.FromSeconds(0.4))
                                                    };

                    Storyboard.SetTarget(animation, popup.Child);
                    Storyboard.SetTargetProperty(animation, new PropertyPath("Opacity"));
                    story.Children.Add(animation);
                    story.Completed += (object sender, EventArgs e) =>
                    {
                        popup.IsOpen = false;
                    };
                    story.Begin();
                }
            });
        }

        private void StartAutoHideTimer()
        {
            var timer = new DispatcherTimer() { Interval = TimeSpan.FromMilliseconds(prefDelay) };
            timer.Tick += (object sender, EventArgs e) =>
            {
                hide();
                timer.Stop();
            };
            timer.Start();
        }
    }
}
