# Topcoat

CSS for clean and fast web apps

---

## Usage

* [Download Topcoat](https://github.com/topcoat/topcoat/archive/0.7.0.zip)

* Open index.html to view the usage guides.
* Copy your desired theme CSS from the `css/` folder into your project
* Copy the `img/` and `font/` folders into your project ( Feel free to only
  copy the images and font weights you intend to use )
* Link the CSS into your page

```css
<link rel="stylesheet" type="text/css" href="css/topcoat-mobile-light.min.css">
```

_*Alternatively incorporate the css into your build process if you are so
inclined._

---

## Contributing

Start by checking out our [Backlog](http://huboard.com/topcoat/topcoat/backlog). (Pls file issues against this repo.)

* [Fill out the CLA here](http://topcoat.io/dev/topcoat-cla.html)
* [fork](https://help.github.com/articles/fork-a-repo) the repo
* Create a branch

        git checkout -b my_branch

* Add your changes following the [coding guidelines](https://github.com/topcoat/topcoat/wiki/Coding-Guidelines)
* Commit your changes

        git commit -am "Added some awesome stuff"

* Push your branch

        git push origin my_branch

* make a [pull request](https://help.github.com/articles/using-pull-requests)

For the details see our [Engineering Practices](https://github.com/topcoat/topcoat/wiki/Engineering-Practices).

### Testing

For performance tests, see [dev/test/perf/telemetry/](https://github.com/topcoat/topcoat/tree/master/dev/test/perf/telemetry).

### Building

Topcoat uses [Grunt](http://gruntjs.com/) to build

* Open the terminal from the topcoat directory

        cd topcoat

* Install [npm](http://nodejs.org/download/)
_*comes packaged with node._
* Install its command line interface (CLI) globally

        npm install -g grunt-cli

* Install dependencies with npm

        npm install


_*Topcoat uses Grunt 0.4.0. You might want to [read](http://gruntjs.com/getting-started) more on their website if you haven't upgraded since a lot has changed._

* Type `grunt` in the command line to build the css.
* The results will be built into the release folder.
* Alternatively type `grunt watch` to have the build run automatically when you make changes to
source files.

---

## Release notes
See [Release Notes](https://github.com/topcoat/topcoat/releases/).

---

## License

[Apache license](https://raw.github.com/topcoat/topcoat/master/LICENSE)

