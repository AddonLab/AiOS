All-in-One Sidebar (AiOS) - a sidebar extension for Mozilla Firefox
===================================================================

ATTENTION!
----------
The development of this extension has been discontinued. The All-in-One Sidebar will stop working in November 2017 with the release of Firefox 57. Please read my statement [on the website](http://firefox.exxile.net/aios/end_of_development.php).

---------

This is the repository of the sidebar extension called All-in-One Sidebar which is hosted at [addons.mozilla.org/firefox/addon/all-in-one-sidebar/](https://addons.mozilla.org/firefox/addon/all-in-one-sidebar/)

More information available on the [project homepage](http://firefox.exxile.net/aios/index.php). There is also a [forum for comments, bug reports and more](http://firefox.exxile.net/forum/).

You are cordially invited to contribute to the project. :-)


Build the extension
-------------------

To build an installable `.xpi` extension for Firefox:

### All operation systems

1. clone this repository
2. zip the contents of the repository (excluding `.git`, `build.sh` and `README.md`) and rename the `.zip` extension to `.xpi`
3. open/install the resulting `.xpi` file with Firefox

### Mac OS X

1. clone this repository
2. execute `./build.sh` at the repository root
3. open/install the resulting `all_in_one_sidebar-dev-build-fx.xpi` file with Firefox

### Ubuntu Linux

I'm not an unix expert, but as far as I know the instructions for Mac OS X should also work on linux systems. Correct me if I'm wrong.

### Windows

You could build the extension via the Windows command prompt when you installed [Cygwin](http://cygwin.com). Otherwise just zip the contents of this repository as explained for all operation systems.


Links
-----

[Setting up an extension development environment](https://developer.mozilla.org/docs/Setting_up_extension_development_environment)


Issues
-------

Please use the [issues system of GitHub](https://github.com/AddonLab/AiOS/issues?state=open) when contributing and reporting bugs, enhancements or to-do's.


Author
------

This is a one-man show by Ingo Wennemaring, Hamburg/Germany

* [About me and the beginning of AiOS](https://addons.mozilla.org/firefox/addon/all-in-one-sidebar/developers)
* [Follow me on Twitter](https://twitter.com/addonlab)


License:
--------

&copy; 2005+ Ingo Wennemaring

GNU General Public License, Version 2.0

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
