/*
if(aios_collapseSidebar) BrowserStartup = function() {
  var uriToLoad = null;

  // window.arguments[0]: URI to load (string), or an nsISupportsArray of
  //                      nsISupportsStrings to load, or a xul:tab of
  //                      a tabbrowser, which will be replaced by this
  //                      window (for this case, all other arguments are
  //                      ignored).
  //                 [1]: character set (string)
  //                 [2]: referrer (nsIURI)
  //                 [3]: postData (nsIInputStream)
  //                 [4]: allowThirdPartyFixup (bool)
  if ("arguments" in window && window.arguments[0])
    uriToLoad = window.arguments[0];

  var isLoadingBlank = uriToLoad == "about:blank";
  var mustLoadSidebar = false;

  prepareForStartup();

  if (uriToLoad && !isLoadingBlank) {
    if (uriToLoad instanceof Ci.nsISupportsArray) {
      let count = uriToLoad.Count();
      let specs = [];
      for (let i = 0; i < count; i++) {
        let urisstring = uriToLoad.GetElementAt(i).QueryInterface(Ci.nsISupportsString);
        specs.push(urisstring.data);
      }

      // This function throws for certain malformed URIs, so use exception handling
      // so that we don't disrupt startup
      try {
        gBrowser.loadTabs(specs, false, true);
      } catch (e) {}
    }
    else if (uriToLoad instanceof XULElement) {
      // swap the given tab with the default about:blank tab and then close
      // the original tab in the other window.

      // Stop the about:blank load
      gBrowser.stop();
      // make sure it has a docshell
      gBrowser.docShell;

      gBrowser.swapBrowsersAndCloseOther(gBrowser.selectedTab, uriToLoad);
    }
    else if (window.arguments.length >= 3) {
      loadURI(uriToLoad, window.arguments[2], window.arguments[3] || null,
              window.arguments[4] || false);
      content.focus();
    }
    // Note: loadOneOrMoreURIs *must not* be called if window.arguments.length >= 3.
    // Such callers expect that window.arguments[0] is handled as a single URI.
    else
      loadOneOrMoreURIs(uriToLoad);
  }

  if (window.opener && !window.opener.closed) {
    let openerSidebarBox = window.opener.document.getElementById("sidebar-box");
    // If the opener had a sidebar, open the same sidebar in our window.
    // The opener can be the hidden window too, if we're coming from the state
    // where no windows are open, and the hidden window has no sidebar box.
    // mod by exxile if (openerSidebarBox && !openerSidebarBox.hidden) {
    // CollapseByStyle-Methode if (openerSidebarBox && !openerSidebarBox.hidden && openerSidebarBox.getAttribute('style') == "") {
    if (openerSidebarBox && !openerSidebarBox.hidden && !openerSidebarBox.collapsed) {
      let sidebarCmd = openerSidebarBox.getAttribute("sidebarcommand");
      let sidebarCmdElem = document.getElementById(sidebarCmd);

      // dynamically generated sidebars will fail this check.
      if (sidebarCmdElem) {
        let sidebarBox = document.getElementById("sidebar-box");
        let sidebarTitle = document.getElementById("sidebar-title");

        sidebarTitle.setAttribute(
          "value", window.opener.document.getElementById("sidebar-title").getAttribute("value"));
        sidebarBox.setAttribute("width", openerSidebarBox.boxObject.width);

        sidebarBox.setAttribute("sidebarcommand", sidebarCmd);
        // Note: we're setting 'src' on sidebarBox, which is a <vbox>, not on
        // the <browser id="sidebar">. This lets us delay the actual load until
        // delayedStartup().
        sidebarBox.setAttribute(
          "src", window.opener.document.getElementById("sidebar").getAttribute("src"));
        mustLoadSidebar = true;

        sidebarBox.hidden = false;
        document.getElementById("sidebar-splitter").hidden = false;
        sidebarCmdElem.setAttribute("checked", "true");
      }
    }
  }
  else {
    let box = document.getElementById("sidebar-box");
    if (box.hasAttribute("sidebarcommand")) {
      let commandID = box.getAttribute("sidebarcommand");
      if (commandID) {
        let command = document.getElementById(commandID);
        if (command) {
          mustLoadSidebar = true;
          box.hidden = false;
          document.getElementById("sidebar-splitter").hidden = false;
          command.setAttribute("checked", "true");
        }
        else {
          // Remove the |sidebarcommand| attribute, because the element it
          // refers to no longer exists, so we should assume this sidebar
          // panel has been uninstalled. (249883)
          box.removeAttribute("sidebarcommand");
        }
      }
    }
  }

  // Certain kinds of automigration rely on this notification to complete their
  // tasks BEFORE the browser window is shown.
  Services.obs.notifyObservers(null, "browser-window-before-show", "");

  // Set a sane starting width/height for all resolutions on new profiles.
  if (!document.documentElement.hasAttribute("width")) {
    let defaultWidth = 994;
    let defaultHeight;
    if (screen.availHeight <= 600) {
      document.documentElement.setAttribute("sizemode", "maximized");
      defaultWidth = 610;
      defaultHeight = 450;
    }
    else {
      // Create a narrower window for large or wide-aspect displays, to suggest
      // side-by-side page view.
      if (screen.availWidth >= 1600)
        defaultWidth = (screen.availWidth / 2) - 20;
      defaultHeight = screen.availHeight - 10;
//@line 1344 "e:\builds\moz2_slave\rel-m-beta-w32-bld\build\browser\base\content\browser.js"
    }
    document.documentElement.setAttribute("width", defaultWidth);
    document.documentElement.setAttribute("height", defaultHeight);
  }

  if (!gShowPageResizers)
    document.getElementById("status-bar").setAttribute("hideresizer", "true");

  if (!window.toolbar.visible) {
    // adjust browser UI for popups
    if (gURLBar) {
      gURLBar.setAttribute("readonly", "true");
      gURLBar.setAttribute("enablehistory", "false");
    }
    goSetCommandEnabled("cmd_newNavigatorTab", false);
  }

//@line 1362 "e:\builds\moz2_slave\rel-m-beta-w32-bld\build\browser\base\content\browser.js"
    //mod by exxile: updateAppButtonDisplay();
    if(AiOS_HELPER.os != "Darwin") updateAppButtonDisplay();
//@line 1364 "e:\builds\moz2_slave\rel-m-beta-w32-bld\build\browser\base\content\browser.js"

  CombinedStopReload.init();

  allTabs.readPref();

  // mod by exxile: init >= Fx 12, syncCommand <= Fx 11
  (typeof TabsOnTop.init == "function") ? TabsOnTop.init() : TabsOnTop.syncCommand();

  BookmarksMenuButton.init();

  TabsInTitlebar.init();

  gPrivateBrowsingUI.init();

  retrieveToolbarIconsizesFromTheme();

  gDelayedStartupTimeoutId = window.setTimeout(function() {
      delayedStartup(isLoadingBlank, mustLoadSidebar);
  }, 0);

  gStartupRan = true;
}
*/


/*
  from chrome://browser/content/browser.js
*/

/**
 * Opens or closes the sidebar identified by commandID.
 *
 * @param commandID a string identifying the sidebar to toggle; see the
 *                  note below. (Optional if a sidebar is already open.)
 * @param forceOpen boolean indicating whether the sidebar should be
 *                  opened regardless of its current state (optional).
 * @note
 * We expect to find a xul:broadcaster element with the specified ID.
 * The following attributes on that element may be used and/or modified:
 *  - id           (required) the string to match commandID. The convention
 *                 is to use this naming scheme: 'view<sidebar-name>Sidebar'.
 *  - sidebarurl   (required) specifies the URL to load in this sidebar.
 *  - sidebartitle or label (in that order) specify the title to
 *                 display on the sidebar.
 *  - checked      indicates whether the sidebar is currently displayed.
 *                 Note that toggleSidebar updates this attribute when
 *                 it changes the sidebar's visibility.
 *  - group        this attribute must be set to "sidebar".
 */
// modified by exxile
//    => original: function toggleSidebar(commandID, forceOpen) {
if(aios_collapseSidebar) toggleSidebar = function(commandID, forceOpen) {
// end modified by exxile

  var sidebarBox = document.getElementById("sidebar-box");
  if (!commandID)
    commandID = sidebarBox.getAttribute("sidebarcommand");

  // added by exxile
  //    => sonst gibt es Fehler bei der 2. Druckvorschau, wenn SidebarCollapsing aktiv ist und die Sidebar zugeklappt
  //    => commandID ist in diesem Fall nicht definiert
  if(!commandID) return;
  // end added by exxile

  var sidebarBroadcaster = document.getElementById(commandID);
  var sidebar = document.getElementById("sidebar"); // xul:browser
  var sidebarTitle = document.getElementById("sidebar-title");
  var sidebarSplitter = document.getElementById("sidebar-splitter");

  if (sidebarBroadcaster.getAttribute("checked") == "true") {
    if (!forceOpen) {
      // Replace the document currently displayed in the sidebar with about:blank
      // so that we can free memory by unloading the page. We need to explicitly
      // create a new content viewer because the old one doesn't get destroyed
      // until about:blank has loaded (which does not happen as long as the
      // element is hidden).
      sidebar.setAttribute("src", "about:blank");
      sidebar.docShell.createAboutBlankContentViewer(null);

      sidebarBroadcaster.removeAttribute("checked");
      sidebarBox.setAttribute("sidebarcommand", "");

      // commented by exxile
      // sidebarTitle.value = "";
      // sidebarBox.hidden = true;
      // end commented by exxile

      // added by exxile
      sidebarBox.removeAttribute('hidden');
      sidebarBox.collapsed = true;
      // CollapseByStyle-Methode sidebarBox.setAttribute('style', 'display:none;');
      // end added by exxile

      sidebarSplitter.hidden = true;
      gBrowser.selectedBrowser.focus();
    } else {
      fireSidebarFocusedEvent();
    }
    return;
  }

  // now we need to show the specified sidebar

  // ..but first update the 'checked' state of all sidebar broadcasters
  var broadcasters = document.getElementsByAttribute("group", "sidebar");
  for (let broadcaster of broadcasters) {
    // skip elements that observe sidebar broadcasters and random
    // other elements
    if (broadcaster.localName != "broadcaster")
      continue;

    if (broadcaster != sidebarBroadcaster)
      broadcaster.removeAttribute("checked");
    else
      sidebarBroadcaster.setAttribute("checked", "true");
  }

  // commented by exxile
  // sidebarBox.hidden = false;
  // end commented by exxile

  // added by exxile
  sidebarBox.removeAttribute('hidden');
  sidebarBox.removeAttribute('collapsed');
  // CollapseByStyle-Methode sidebarBox.removeAttribute('style');
  // end added by exxile

  sidebarSplitter.hidden = false;

  var url = sidebarBroadcaster.getAttribute("sidebarurl");
  var title = sidebarBroadcaster.getAttribute("sidebartitle");
  if (!title)
    title = sidebarBroadcaster.getAttribute("label");
  sidebar.setAttribute("src", url); // kick off async load
  sidebarBox.setAttribute("sidebarcommand", sidebarBroadcaster.id);
  sidebarTitle.value = title;

  // We set this attribute here in addition to setting it on the <browser>
  // element itself, because the code in gBrowserInit.onUnload persists this
  // attribute, not the "src" of the <browser id="sidebar">. The reason it
  // does that is that we want to delay sidebar load a bit when a browser
  // window opens. See delayedStartup().
  sidebarBox.setAttribute("src", url);

  if (sidebar.contentDocument.location.href != url)
    sidebar.addEventListener("load", sidebarOnLoad, true);
  else // older code handled this case, so we do it too
    fireSidebarFocusedEvent();

// modified by exxile
//    => original: }
};
// end modified by exxile