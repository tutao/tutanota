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
        private bool autohide = true;

        private static bool WasShown = false;

        public SplashScreen()
        {
            Image SplashScreen = new Image();
            BitmapImage splash_image = new BitmapImage();
            splash_image.SetSource(Application.GetResourceStream(new Uri(@"SplashScreenImage.jpg", UriKind.Relative)).Stream);
            SplashScreen.Source = splash_image;

            // Instansiate the popup and set the Child property of Popup to SplashScreen
            popup = new Popup() {IsOpen = false, Child = SplashScreen };
            // Orient the popup accordingly
            popup.HorizontalAlignment = HorizontalAlignment.Stretch;
            popup.VerticalAlignment = VerticalAlignment.Center;
            

            LoadConfigValues();
        }

        public override void OnInit()
        {
            // we only want to autoload the first time a page is loaded.
            if (!WasShown)
            {
                WasShown = true;
                show();
            }
        }

        void LoadConfigValues()
        {
            StreamResourceInfo streamInfo = Application.GetResourceStream(new Uri("config.xml", UriKind.Relative));

            if (streamInfo != null)
            {
                StreamReader sr = new StreamReader(streamInfo.Stream);
                //This will Read Keys Collection for the xml file
                XDocument document = XDocument.Parse(sr.ReadToEnd());

                var preferences = from results in document.Descendants()
                                  where (string)results.Attribute("name") == "AutoHideSplashScreen"
                                  select (string)results.Attribute("value") == "true";

                if (preferences.Count() > 0 &&  preferences.First() == false)
                {
                    autohide = false;
                }
            }
        }

        public void show(string options = null)
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                if (popup.IsOpen)
                {
                    return;
                }

                popup.Child.Opacity = 0;

                Storyboard story = new Storyboard();
                DoubleAnimation animation;
                animation = new DoubleAnimation();
                animation.From = 0.0;
                animation.To = 1.0;
                animation.Duration = new Duration(TimeSpan.FromSeconds(0.2));

                Storyboard.SetTarget(animation, popup.Child);
                Storyboard.SetTargetProperty(animation, new PropertyPath("Opacity"));
                story.Children.Add(animation);

                Debug.WriteLine("Fading the splash screen in");

                story.Begin();

                popup.IsOpen = true;

                if (autohide)
                {
                    DispatcherTimer timer = new DispatcherTimer();
                    timer.Tick += (object sender, EventArgs e) =>
                    {
                        hide();
                    };
                    timer.Interval = TimeSpan.FromSeconds(1.2);
                    timer.Start();
                }
            }); 
        }


        public void hide(string options = null)
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                if (!popup.IsOpen)
                {
                    return;
                }

                popup.Child.Opacity = 1.0;

                Storyboard story = new Storyboard();
                DoubleAnimation animation;
                animation = new DoubleAnimation();
                animation.From = 1.0;
                animation.To = 0.0;
                animation.Duration = new Duration(TimeSpan.FromSeconds(0.4));

                Storyboard.SetTarget(animation, popup.Child);
                Storyboard.SetTargetProperty(animation, new PropertyPath("Opacity"));
                story.Children.Add(animation);
                story.Completed += (object sender, EventArgs e) =>
                {
                    popup.IsOpen = false;
                };
                story.Begin();
            });
        }
    }
}
