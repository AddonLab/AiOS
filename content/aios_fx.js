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

      // commented by exxile
      // sidebar.setAttribute("src", "about:blank");
      // sidebar.docShell.createAboutBlankContentViewer(null);
      // end commented by exxile

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
//