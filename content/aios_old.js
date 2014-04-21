
// dem Sidebarheader eine ID zuweisen => dann per CSS ansprechbar (bei load oder DOMContentLoaded zu spaet)
//top.document.getElementById("sidebar-throbber").parentNode.setAttribute('id', 'sidebar-header');

window.addEventListener("load", aios_initSidebar, false);
window.addEventListener("resize", aios_checkThinSwitch, false);
window.addEventListener("mozfullscreenchange", aios_BrowserFullScreen, false);

// sonst werden neu definierte Shortcuts bei Browser-Neustart zurueckgesetzt
extLoad.add(30, function() {
    aiosKeyconfig.loadkeys(aiosKeyconfig.prefService.getCharPref("extensions.aios.keyconf.profile"));
});

var initialised = false;

var fx_mainWindow, fx_browser, fx_sidebar, fx_sidebarBox, fx_sidebarHeader, fx_sidebarSplitter, fx_sidebarMenu, fx_maximizedWindow;
var aios_toggleBox, aios_toggleBar, aios_toggleSwitchItem, aios_toggleToolbarItem, aios_toolbar;
var elem_switch, elem_tbb, elem_key, elem_close, elem_close2;

var aios_enterFullScreen = 0;
var aios_leaveFullScreen = 0;

// Sidebar nur zusammenklappen statt schliessen
var aios_collapseSidebar = AiOS_HELPER.prefBranchAiOS.getBoolPref('collapse');


function aios_getObjects() {
    try {
        fx_mainWindow = document.getElementById('main-window');
        fx_browser = document.getElementById('browser');
        fx_sidebar = document.getElementById('sidebar');
        fx_sidebarBox = document.getElementById('sidebar-box');
        fx_sidebarHeader = document.getElementById('sidebar-header');
        fx_sidebarSplitter = document.getElementById('sidebar-splitter');
        fx_sidebarMenu = document.getElementById('viewSidebarMenu');

        aios_toggleBox = document.getElementById('aios-toggle-toolbox');
        aios_toggleBar = document.getElementById('aios-toggle-toolbar');

        // broadcaster in aios.xul mit gespeichertem Wunsch-Toolbar-Zustand
        //  => gespeichert durch onViewToolbarCommand() in tbx.js (AiOS < 0.7.7)
        //  => gespeichert/gesetzt durch aios_toggleToolbar()
        aios_toggleSwitchItem = document.getElementById('aios-viewTogglebar');
        aios_toggleToolbarItem = document.getElementById('aios-viewToolbar');

        aios_toolbar = document.getElementById('aios-toolbar');

        elem_switch = document.getElementById('aios-toggle-button');
        elem_tbb = document.getElementById('sidebars-togglebutton');
        elem_key = document.getElementById('aiosKey_sidebar');
        elem_close = document.getElementById('sidebarclose-button');
        elem_close2 = document.getElementById('sbh-sidebarclose-button');
    }
    catch(e) { }
}


/*
    Initialisierung
        => Aufruf durch das onload-Event
*/
function aios_initSidebar() {
    aios_getObjects();

    // Toolbarbuttons in der Sidebarheader Toolbar ohne Button-Gedoens anzeigen
    /*for(var i = 0; i < document.getElementById('aios-sbhtoolbar').childNodes.length; i++) {
        aios_stripClass(document.getElementById('aios-sbhtoolbar').childNodes[i], 'toolbarbutton-1');
    }*/

    // MacOS X => Tastaturkuerzel ersetzen (Strg. wird durch Command ersetzt und Umschalt durch das Symbol dafuer)
    if(AiOS_HELPER.os == "Darwin") {
        aios_replaceKey('switch-tooltip-box', 'r2c2', 'command');
        aios_replaceKey('template-sidebar-tooltip-box', 'r2c2', 'command');
        aios_replaceKey('template-window-tooltip-box', 'r2c2', 'command');
        aios_replaceKey('paneltab-tooltip-box', 'r2c2', 'command');
        aios_replaceKey('paneltab-tooltip-reverse-box', 'r2c2', 'command');
        aios_replaceKey('sidebarheader-tooltip-box', 'r3c2', 'command');

        aios_replaceKey('switch-tooltip-box', 'r3c2', 'shift');
        aios_replaceKey('template-sidebar-tooltip-box', 'r3c2', 'shift');
        aios_replaceKey('template-window-tooltip-box', 'r3c2', 'shift');
        aios_replaceKey('paneltab-tooltip-box', 'r3c2', 'shift');
        aios_replaceKey('paneltab-tooltip-reverse-box', 'r3c2', 'shift');
        aios_replaceKey('sidebarheader-tooltip-box', 'r1c2', 'shift');
    }

    // Sidebar li. oder re.
    // Eigenschaftenzuweisung fuer CSS (LTR <=> RTL; Sidebar links <=> rechts)
    aios_setSidebarOrient();

    // beim ersten Start (bzw. nach loeschen der localstore.rdf) => ...
    if(!aios_getBoolean(fx_sidebarBox, 'aiosInit')) {
        // Icongroesse an die der Nav-Toolbar anpassen
        fx_sidebarBox.setAttribute('aiosInit', true);
        document.persist(fx_sidebarBox.id, 'aiosInit');

        if(aios_toolbar) aios_toolbar.setAttribute('iconsize', document.getElementById('nav-bar').getAttribute('iconsize'));

        // Sidebar-Breite nach Konfiguration festsetzen
        aios_setConfSidebarWidth();
    }


    // Sidebarheader-Symbolleiste aus der Navigations-Symbolleiste in den Sidebarheader verschieben
    // wenn die Symbolleiste gleich im Header waere, wuerden keine Icons angezeigt werden, wenn die Sidebar beim Start geschlossen ist
    //document.getElementById('aios-sbhtoolbox').appendChild(document.getElementById('aios-sbhtoolbar'));


    // legt commands (Ziele) fuer Manager und Fenster lt. Einstellungen fest
    window.setTimeout(function() {
        aios_setTargets();
    }, 50);

    // Autohide-Feature initialisieren
    aios_initAutohide();


    // Sidebar nur zusammenklappen statt schliessen
    var lp;
    if(aios_collapseSidebar) {

        // in jedem Fall das Hidden-Attribut zuruecksetzen
        document.getElementById('sidebar-box').setAttribute('hidden', false);

        // wenn die Sidebar beim Start nicht geoeffnet sein soll
        // neues bzw. weiteres Fenster
        if(window.opener) {

            fx_sidebarBox.setAttribute('collapsed', window.opener.document.getElementById('sidebar-box').getAttribute('collapsed'));

            /* CollapseByStyle-Methode
            if(window.opener.document.getElementById('sidebar-box').getAttribute('style') != "")
                fx_sidebarBox.setAttribute('style', 'display:none;');
            else
                fx_sidebarBox.removeAttribute('style');*/

            aios_toolbar.setAttribute('hidden', window.opener.document.getElementById('aios-toolbar').getAttribute('hidden'));
        }
        // Browserstart
        else {
            //alert(aios_getBoolean('main-window', 'aiosOpen'));
            if(!aios_getBoolean('main-window', 'aiosOpen')) {
                fx_sidebarBox.setAttribute('collapsed', true);
                // CollapseByStyle-Methode fx_sidebarBox.setAttribute('style', 'display:none;');
                fx_sidebarSplitter.setAttribute('hidden', true);
            }
        }

        // sonst ist nach Deaktivieren/Aktivieren die Sidebar sichtbar aber leer
        lp = document.getElementById('sidebar-box').getAttribute("aiosLastPanel");
        if(aios_getBoolean(document.getElementById('main-window'), 'aiosOpen') && lp != "") {
            toggleSidebar(lp, true);
            document.getElementById('sidebar-splitter').hidden = false;
            document.getElementById('sidebar-splitter').setAttribute('state', 'open');
        }
    }

    // wenn es keine zuletzt geoeffnete Sidebar gibt oder diese nicht mehr existiert, dann nimm die Bookmarks
    lp = fx_sidebarBox.getAttribute("aiosLastPanel");
    if(!lp || (lp && !document.getElementById(lp))) {
        fx_sidebarBox.setAttribute("aiosLastPanel", "viewBookmarksSidebar");
        document.persist(fx_sidebarBox.id, "aiosLastPanel");
    }

    // Sidebar, Toolbar u. Switch beim Start gem. Einstellungen
    try {
        var sidebarInit = AiOS_HELPER.prefBranchAiOS.getCharPref('gen.init');
        var toolbarInit = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.toolbar.init');
        var switchInit = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.switch.init');

        // Sidebar beim Start oeffnen
        if(sidebarInit == "open") toggleSidebar(fx_sidebarBox.getAttribute('aiosLastPanel'), true);

        // Sidebar beim Start schliessen
        if(sidebarInit == "close" && !aios_isSidebarHidden()) {
            toggleSidebar();
            if(aios_collapseSidebar) {
                document.getElementById('sidebar-box').setAttribute('collapsed', true);
                // CollapseByStyle-Methode document.getElementById('sidebar-box').setAttribute('style', 'display:none;');
            }
        }

        // bestimmte Sidebar beim Start oeffnen
        if(sidebarInit != "rem" && sidebarInit != "open" && sidebarInit != "close") {
            if(document.getElementById(sidebarInit)) toggleSidebar(sidebarInit, true);
        }

        if(toolbarInit != 2) aios_toolbar.setAttribute('hidden', !toolbarInit);
        if(switchInit != 2) aios_toggleBox.setAttribute('hidden', !switchInit);
    }
    catch(e) { }

    // bei Doppelklick die Standardgroesse der Sidebar einstellen
    var fx_sidebarheader = document.getElementsByTagName('sidebarheader')[0];
    fx_sidebarheader.addEventListener("dblclick", function(e) {
        aios_setSidebarWidth(e);
    }, false);

    // Sidebars-Menue ueberwachen - noetig fuer den Fall, dass ein erster Aufruf durch das View-Menue erfolgt
    //fx_sidebarMenu.addEventListener('popupshowing', aios_modSidebarMenu, false);

    // Sidebar-Ladezustand ueberwachen
    /*document.getElementById('sidebar').addProgressListener(aiosSBListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);*/

    // Drag&Drop-Funktion fuer den Sidebar-Umschalter deaktivieren?
    try {
        var switchDrag = AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.drag");
        var switchDelay = AiOS_HELPER.prefBranchAiOS.getIntPref("gen.switch.delay");

        if(!switchDrag) elem_switch.removeAttribute('ondragenter');
    }
    catch(e) { }

    // Changelog anzeigen?
    try {
        var changelog = AiOS_HELPER.prefBranchAiOS.getCharPref('changelog');
    }
    catch(e) { }

    // mit einer manuell gesetzten 0 laesst sich das abschalten
    if(parseFloat(changelog) != 0) {

        Components.utils.import("resource://gre/modules/AddonManager.jsm");

        AddonManager.getAddonByID("{097d3191-e6fa-4728-9826-b533d755359d}", function(addon) {
            var aiosVersion = addon.version;

            if(aiosVersion && (aiosVersion != changelog)) {

                var aiosUpdated = (changelog != "") ? true : false;

                try {
                    AiOS_HELPER.prefBranchAiOS.setCharPref('changelog', aiosVersion);
                    var changelog_new = AiOS_HELPER.prefBranchAiOS.getCharPref('changelog');
                }
                catch(e) { }

                // wenn das speichern der aktuellen Version geklappt hat
                if(changelog_new === aiosVersion && gBrowser) {
                    var hp = "http://www.exxile.de/aios_installed.htm?v=" + aiosVersion;
                    if(aiosUpdated) hp = "http://www.exxile.de/aios_updated.htm?v=" + aiosVersion;

                    window.setTimeout(function() {
                        gBrowser.loadTabs(new Array(hp), false);
                    }, 500);
                }
            }
        });
    }

    // vertikale Buttons?
    try {
        var vButtons = AiOS_HELPER.prefBranchAiOS.getBoolPref("vbuttons");

        fx_mainWindow.setAttribute('aiosVButtons', 'true');
        if(!vButtons) fx_mainWindow.setAttribute('aiosVButtons', 'false');
        document.persist(fx_mainWindow.id, 'aiosVButtons');
    }
    catch(e) { }

    // vertikale Bookmarkleiste?
    // Attribut der Bookmarks-Leiste entfernen. Wenn sie auf der AiOS-Toolbar platziert wird, kann man per CSS die Orientation bestimmen.
    if(document.getElementById('PlacesToolbarItems')) document.getElementById('PlacesToolbarItems').removeAttribute('orient');

    initialised = true;
}


/*
    stellt bei Doppelklick auf den Sidebarheader die Standardgroesse der Sidebar wieder her
        => Aufruf durch EventListener auf dem Header, gesetzt in aios_initSidebar()
*/
function aios_setSidebarWidth(event) {
    aios_getObjects();

    var mode = "def";
    if(event) {
        if(event.shiftKey) mode = "min";
        if(event.ctrlKey || event.metaKey) mode = "max";    // metaKey = Mac
    }

    try {
        var sWidthVal = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.width.' + mode + 'Val');
        var sWidthUnit = AiOS_HELPER.prefBranchAiOS.getCharPref('gen.width.' + mode + 'Unit');

        if(sWidthUnit == "%") {
            var browserWidth = aios_getBrowserWidth();
            var compWidth = browserWidth[3];

            sWidthVal = parseInt(Math.round((compWidth * sWidthVal) / 100));
        }

        // Sidebargoesse einstellen
        fx_sidebarBox.setAttribute('width', sWidthVal);
    }
    catch(e) { }
}


/*
stellt die Anzeige der Sidebar ein
        => Aufruf durch aios_initSidebar() und aios_savePrefs() in prefs.js
        => 1 = links, 2 = rechts
*/
function aios_setSidebarOrient() {
    aios_getObjects();

    try {
        // Sidebar-Ausrichtung
        var sidebarOrient = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.orient');
        fx_mainWindow.setAttribute('aiosOrient', 'left');
        if(sidebarOrient == 2) fx_mainWindow.setAttribute('aiosOrient', 'right');
        //document.persist(fx_mainWindow.id, 'aiosOrient');

        // Links-Rechts <=> Rechts-Links
        var cStyleWindow = document.defaultView.getComputedStyle(fx_mainWindow, '');
        fx_mainWindow.setAttribute('aiosMode', 'ltr');
        if(cStyleWindow.direction == "rtl") fx_mainWindow.setAttribute('aiosMode', 'rtl');
        //document.persist(fx_mainWindow.id, 'aiosMode');

        // Fix fuer MileWideBack
        if(document.getElementById('back-strip') && sidebarOrient == 2) {
            var mwb = document.getElementById('back-strip');
            var mwbParent = document.getElementById('back-strip').parentNode;
            mwbParent.removeChild(mwb);
            mwbParent.appendChild(mwb);
        }
    }
    catch(e) { }

    aios_setToolbarPos();
}


/*
    Sidebar-Status auf Veraenderungen ueberwachen
        => Aufruf durch observes-Elemente (hidden und collapsed) in 'sidebar-box'
*/
function aios_observeSidebar(mode) {
    aios_getObjects();

    // fuer den Fall, dass vor dem Oeffnen die Toolbar ausgeblendet wurde (z.B. durch Switch im Opera-Modus)
    var showToolbar = aios_getBoolean(aios_toggleToolbarItem, 'checked');
    if(showToolbar && !aios_isSidebarHidden()) aios_toggleToolbar(false);

    // fuer den Fall, dass vor dem Oeffnen der Switch ausgeblendet wurde (z.B. durch Startup-Verhalten)
    var showSwitch = aios_getBoolean(aios_toggleSwitchItem, 'checked');
    if(showSwitch && !aios_isSidebarHidden()) aios_toggleBox.setAttribute('hidden', false);

    // Grippy-Status (CSS achtet auf Attribut 'aiosOpen')
    fx_mainWindow.setAttribute('aiosOpen', !fx_sidebarBox.hidden && !fx_sidebarBox.collapsed);
    // CollapseByStyle-Methode fx_mainWindow.setAttribute('aiosOpen', !fx_sidebarBox.hidden && fx_sidebarBox.getAttribute('style') == "");
    document.persist(fx_mainWindow.id, 'aiosOpen');

    // Toggle-Button-Status (Button achtet auf Attribut 'checked')
    fx_sidebarBox.setAttribute('checked', !fx_sidebarBox.hidden && !fx_sidebarBox.collapsed);
    // CollapseByStyle-Methode fx_sidebarBox.setAttribute('checked', !fx_sidebarBox.hidden && fx_sidebarBox.getAttribute('style') == "");

    // fuer den Fall, dass vor dem Oeffnen der Grippy benutzt wurde...
    if(mode == "hidden") {
        fx_sidebarBox.removeAttribute('collapsed');
        // CollapseByStyle-Methode fx_sidebarBox.removeAttribute('style');
        fx_sidebarSplitter.removeAttribute('hidden');

        fx_sidebarSplitter.setAttribute('state', 'open');
    }
}


/*
    Letzte Sidebar merken und als persist speichern
        => Aufruf durch observes-Element in 'sidebar-box' und aios_modSidebarMenu()
*/
function aios_remLastSidebar() {
    aios_getObjects();

    var actSidebar = false;

    // letzte Sidebar merken und speichern
    var allSidebars = document.getElementsByAttribute('group', 'sidebar');
    for(var i = 0; i < allSidebars.length; i++) {

        // darf kein Element observen (Menueeintraege usw.), aber muss eine Sidebar-URL haben
        if(!allSidebars[i].getAttribute('observes') && allSidebars[i].getAttribute('sidebarurl')) {

            // muss eine ID haben und muss "checked" sein
            if(allSidebars[i].getAttribute('id') && aios_getBoolean(allSidebars[i], 'checked')) {

                // command in der "persist"-var "aiosLastPanel" speichern und zurueckgeben
                fx_sidebarBox.setAttribute("aiosLastPanel", allSidebars[i].id);
                document.persist(fx_sidebarBox.id, "aiosLastPanel");
                actSidebar = allSidebars[i].id;

            //fx_sidebarBox.setAttribute("sidebarcommand", allSidebars[i].id);
            //document.persist(fx_sidebarBox.id, "sidebarcommand");

            //fx_sidebarBox.setAttribute('src', fx_sidebar.getAttribute('src'));
            //fx_sidebar.setAttribute('src', fx_sidebarBox.getAttribute('src'));
            }
        }
    }

    return actSidebar;
}


/*
    toggelt die Sidebar im Opera-Verhalten
        => Aufruf durch aios_toggleSidebar() fuer Elemente im Opera-Verhalten
*/
function aios_toggleOperaMode(aForcePanel, aForceOpen) {
    aios_getObjects();

    var showToolbar = aios_getBoolean(aios_toggleToolbarItem, 'checked');

    // zu oeffnende Sidebar feststellen
    var openPanel = fx_sidebarBox.getAttribute('aiosLastPanel');                        // zuletzt geoeffnete Sidebar
    if(openPanel == "") openPanel = "viewBookmarksSidebar";                             // Lesezeichen wenn keine Sidebar geoeffnet war
    if(aForcePanel) openPanel = aForcePanel;                                            // bestimmte Sidebar gewuenscht (bei jedem oeffnen)

    // vertikaler Toolbar-Modus
    if(aios_toolbar.orient == "vertical") {

        // wenn die Toolbar sichtbar ist
        if(!aios_getBoolean(aios_toolbar, 'hidden')) {

            // wenn die Sidebar sichtbar ist
            if(!aios_isSidebarHidden() && !aForceOpen) {
                fx_sidebarBox.setAttribute("aiosShouldOpen", true);                         // Zustand der Sidebar merken (sichtbar)
                document.persist(fx_sidebarBox.id, 'aiosShouldOpen');
                toggleSidebar();                                                            // Sidebar ausblenden
            }
            else {
                fx_sidebarBox.setAttribute("aiosShouldOpen", false);                        // Zustand der Sidebar merken (unsichtbar)
                document.persist(fx_sidebarBox.id, 'aiosShouldOpen');
            }

            //aios_toolbar.setAttribute('hidden', true);
            //if(!aForceOpen) onViewToolbarCommand(true);                                   // Toolbar ausblenden
            if(!aForceOpen) aios_toggleToolbar(true);                                       // Toolbar ausblenden
        }
        // wenn die Toolbar nicht sichtbar ist
        else {
            if(showToolbar)                                                                 // Toolbar anzeigen?
                aios_toggleToolbar(false);                                              // Toolbar einblenden
            //onViewToolbarCommand(false);                                              // Toolbar einblenden
            //aios_toolbar.setAttribute('hidden', false);

            // wenn Sidebar angezeigt werden soll (Status vor dem letzten Schliessen) oder die Toolbar abgeschaltet wurde
            if(aios_getBoolean(fx_sidebarBox, 'aiosShouldOpen') || !showToolbar) toggleSidebar(openPanel);
        }
    }
    // horizontaler Toolbar-Modus
    else {
        // wenn die Sidebar sichtbar ist
        if(!aios_isSidebarHidden()) {
            fx_sidebarBox.setAttribute("aiosShouldOpen", true);                         // Zustand der Sidebar merken (sichtbar)
            document.persist(fx_sidebarBox.id, 'aiosShouldOpen');
            toggleSidebar();                                                            // Sidebar ausblenden
        }
        else {
            if(lastPanel == "") toggleSidebar(openPanel);

        //if(showToolbar) aios_toolbar.setAttribute('hidden', false);
        }
    }

}


/*
    klont das Firefox-Sidebar-Menue fuer die Sidebars-Buttons
        => Aufruf durch Menuebutton-Events 'onpopupshowing' aufgerufen
*/
function aios_getSidebarMenu(aPopup) {

    aios_getObjects();

    // Menue modifizieren (aktiven Menuepunkt deaktivieren, Ez Sidebar-Fix u.a.)
    aios_modSidebarMenu();

    /*var aios_sidebarMenu = fx_sidebarMenu.cloneNode(true);
    aios_sidebarMenu.setAttribute('onpopupshowing', 'aios_getSidebarMenu(this);');
    aPopup.parentNode.replaceChild(aios_sidebarMenu, aPopup);*/

    while(aPopup.hasChildNodes()) {
        aPopup.removeChild(aPopup.firstChild);
    }

    for(var i = 0; i < fx_sidebarMenu.childNodes.length; i++) {
        aPopup.appendChild(fx_sidebarMenu.childNodes[i].cloneNode(true));
    }
}


/*
    schliesst die Sidebar, wenn die Maus den Content-Bereich ueberfaehrt
        => Aufruf durch mouseover des 'appcontent' und des Sidebar-Switches (mit Uebergabe von mode)

        => aios_initSidebar() fuegt dem Object "sidebar-box" einen mouseover-Event hinzu,...
        => dieser mouseover-Event fuegt dem "appcontent" einen mouseover-Event hinzu,...
        => der diese Funktion aufruft
*/
var aios_autoTimeout;
function aios_autoShowHide(mode) {
    //try {
    var autobutton = aios_getBoolean('aios-enableAutohide', 'checked');

    var autoshow = AiOS_HELPER.prefBranchAiOS.getBoolPref('gen.switch.autoshow');
    var onlymax = AiOS_HELPER.prefBranchAiOS.getBoolPref('gen.switch.onlymax');
    var delay = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.switch.delay');
    var hidemethod = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.switch.hidemethod');

    //alert(mode);

    // Feature nicht aktiviert, Feature soll nur bei max. Fenster greifen, Fenster hat nicht den Focus
    if(!autoshow || !autobutton || (onlymax && !aios_isWinMax()) || !aiosFocus) return false;

    /*
     *  Ausloesung durch den Umschalter
     **/
    if(mode == "switch") {
        // wenn Sidebar sichtbar und nicht ausgeblendet werden soll => ignorieren
        if(!aios_isSidebarHidden() && hidemethod == 1) return false;

        // nach bestimmter Zeit ein-/ausblenden
        aios_autoTimeout = window.setTimeout(function() {
            aios_toggleSidebar('switch');
        }, delay);

        // timeout wieder loeschen, wenn die Maus zu kurz auf dem Umschalter war oder geklickt wurde
        elem_switch.addEventListener("mouseout", function(){
            window.clearTimeout(aios_autoTimeout);
        }, true);
        elem_switch.addEventListener("click", function(){
            window.clearTimeout(aios_autoTimeout);
        }, true);

        return true;
    }
    /*
     *  Ausloesung durch den Contentbereich
     **/
    else {

        // wenn Sidebar sichtbar und ausgeblendet werden soll
        // mode.originalTarget.parentNode.id != "" => behebt Kompatibilitaetsproblem mit TabSidebar (Sidebar wird bei Rollover des SidebarTabs ausgeblendet)

        // macht scheinbar Probleme, weil der Event auf appcontent nicht (immer) geloescht wird => TabSidebar wird nicht weiterentwickelt
        //if(!aios_isSidebarHidden() && hidemethod == 1 && mode.originalTarget.parentNode.id != "") {
        if(!aios_isSidebarHidden() && hidemethod == 1) {

            // Event auf "appcontent" wieder loeschen, weil sonst die Sidebar wieder eingeblendet wuerde
            // => mouseover der Sidebar (in aios_initSidebar()) fuegt dem "appcontent" dieses Feature wieder hinzu
            document.getElementById('appcontent').removeEventListener("mouseover", aios_autoShowHide, true);

            // nach bestimmter Zeit ausblenden
            aios_autoTimeout = window.setTimeout(function() {
                aios_toggleSidebar('switch');
            }, delay);

            // timeout wieder loeschen, wenn die Maus zurueck in die Sidebar kommt
            fx_sidebarBox.addEventListener("mouseover", function(){
                window.clearTimeout(aios_autoTimeout);
            }, true);
        }
    }
    //}
    //catch(e) { }

    return true;
}


/*
    aktiviert/deaktiviert die Sidebar/Toolbar/Switch je nach Element und Einstellungen
        => Aufruf durch Toggle-Button, Switch, Shortcut, Open/Close-Menuitems, Sidebar-Close-Button
            => mode 1: nur die Sidebar oeffnen/schliessen
            => mode 2: Sidebar und Toolbar oeffnen/schliessen
            => mode 3: Sidebar, Toolbar und Togglebar oeffnen/schliessen
            => mode 4: Opera-Verhalten
*/
function aios_toggleSidebar(aMode, aForceOpen) {
    aios_getObjects();
    //aForceOpen = false;           // erlaubt das automatische ein-/ausblenden waehrend Drag auf Sidebar Switch

    var prefstring = "key";
    if(aMode == elem_switch || aMode == "switch") prefstring = "switch";
    if(aMode == elem_tbb || aMode == "tbb") prefstring = "tbb";
    if(aMode == elem_close || aMode == elem_close2 || aMode == "close") prefstring = "close";

    try {
        var mode = AiOS_HELPER.prefBranchAiOS.getIntPref('cmode.' + prefstring);
        var toolBox_enabled = aios_getBoolean('aios-viewToolbar', 'checked');
        var toggleBox_enabled = aios_getBoolean(aios_toggleSwitchItem, 'checked');

        // direkte Uebergabe per JavaScript z.B. per "Custom Buttons"
        if(aMode === 1) mode = 1;
        if(aMode === 2) mode = 2;
        if(aMode === 3) mode = 3;
        if(aMode === 4) mode = 4;


        // bestimmtes Panel laden?
        var forcePanel;
        var openPanel = AiOS_HELPER.prefBranchAiOS.getCharPref("gen.open.init");
        if(openPanel != "rem" && (prefstring == "key" || prefstring == "switch" || prefstring == "tbb")) forcePanel = openPanel;
        else forcePanel = false;

        if(mode == 4) {
            aios_toggleOperaMode(forcePanel, aForceOpen);
        }
        else {
            // wenn Sidebar Collpasing aktiviert ist...
            // ein bestimmtes Panel grundsaetzlich geoeffnet werden soll...
            // es aber noch nicht geoeffnet ist...
            // die Sidebar aber noch geoeffnet ist...
            // dann soll das Panel zwar geladen, die Sidebar aber dennoch geschlossen werden => reiner Performance-Zweck
            if(aios_collapseSidebar && forcePanel && fx_sidebarBox.getAttribute('aiosLastPanel') != forcePanel && !aios_isSidebarHidden()) var closeNow = true;

            var tmpcmd = (forcePanel) ? forcePanel : fx_sidebarBox.getAttribute('aiosLastPanel');
            toggleSidebar(tmpcmd, aForceOpen);

            // Sidebar schliessen, wenn die obigen Bedingungen erfuellt sind
            if(closeNow) toggleSidebar(tmpcmd, aForceOpen);


            if((mode == 2 || mode == 3) && toolBox_enabled) {
                //aios_toolbar.setAttribute('hidden', aios_isSidebarHidden());
                //onViewToolbarCommand(aios_isSidebarHidden());
                aios_toggleToolbar(aios_isSidebarHidden());
            }

            if(mode == 3 && toggleBox_enabled)
                aios_toggleBox.setAttribute('hidden', aios_isSidebarHidden());
        }
    }
    catch(e) { }

    return true;
}


/*
    Sidebar-Toggle per collapsed
        => Aufruf durch den Grippy selbst bei onClick()
*/
function aios_useGrippy() {
    fx_sidebarBox.collapsed = !fx_sidebarBox.collapsed;

    // Fix fuer Win Vista & 7: aiosOpen wird durch fehlenden Aufruf von aios_observeSidebar nicht gesetzt
    // aios_observeSidebar wird eigentlich durch Observer der sidebar-box aufgerufen, k.A. warum hier nicht
    if(AiOS_HELPER.os == "WINNT" && AiOS_HELPER.osVersion.indexOf("5.1") == -1) aios_observeSidebar(true);

    /* CollapseByStyle-Methode
    if(fx_sidebarBox.getAttribute('style') != "") fx_sidebarBox.removeAttribute('style');
    else fx_sidebarBox.setAttribute('style', 'display:none;')*/
}


/*
    aktiviert/deaktiviert den schmalen Sidebar-Umschalter
        => Aufruf durch Event-Listener "onresize", observer (sizemode) in tbx.xul,
             aios_BrowserFullScreen() und aios_savePrefs() in prefs.js
*/
function aios_checkThinSwitch() {
    if(!initialised) return;

    aios_getObjects();

    var thin_switch, thinmax_switch, switch_width, switch_twidth, athin_switch;

    try {
        thin_switch = AiOS_HELPER.prefBranchAiOS.getBoolPref('gen.switch.thin');
        thinmax_switch = AiOS_HELPER.prefBranchAiOS.getBoolPref('gen.switch.thinmax');

        switch_width = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.switch.width');
        switch_twidth = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.switch.twidth');

        // soll er schmal sein?
        var thin = thin_switch;
        if(thin_switch && thinmax_switch && !aios_isWinMax()) thin = false;

        var width_val = (thin) ? switch_twidth : switch_width;
        var barStyle = "min-width: " + width_val + "px; max-width: " + width_val + "px;";

        if(width_val < 4) elem_switch.setAttribute('style', 'background-image: none;');
        else elem_switch.setAttribute('style', '');

        if(width_val < 2) barStyle += " border: none;";
        aios_toggleBar.setAttribute('style', barStyle);
    }
    catch(e) { }
}


/*
  Steuerung der Mausaktionen des Sidebar-Umschalters
    => Aufruf durch onClick() des Umschalters
*/
function aios_controlSwitch(ev, which) {

    // Linksklick => metaKey = Mac
    if(ev.button == 0 && (!ev.shiftKey && !ev.ctrlKey && !ev.metaKey)) {
        aios_toggleSidebar(which);
    }

    // Mittelklick / Ctrl+Linksklick => metaKey = Mac
    if(ev.button == 1 || (ev.button == 0 && ev.ctrlKey) || (ev.button == 0 && ev.metaKey)) {
        aios_toggleElement('aios-viewToolbar');
        aios_toggleToolbar('aios-viewToolbar');
    }

    // Rechtsklick / Shift+Linksklick
    if(ev.button == 2 || (ev.button == 0 && ev.shiftKey)) {
        if(aios_isSidebarHidden()) toggleSidebar(fx_sidebarBox.getAttribute('aiosLastPanel'), true);
        else toggleSidebar();
    }
}


/*
    Erweitert die FF-Funktion BrowserFullScreen() zur Steuerung der AIOS-Elemente
        => Aufruf durch aios_initSidebar()
*/
function aios_BrowserFullScreen() {
    aios_getObjects();

    try {
        var enable_restore = AiOS_HELPER.prefBranchAiOS.getBoolPref('fs.restore');
    }
    catch(e) {
        return false;
    }

    // Fullscreen an
    //  => Elemente ausblenden
    if(document.mozFullScreenElement) {

        // Fix für mehrmaliges feuern des mozfullscreenchange events
        aios_leaveFullScreen = 0;
        aios_enterFullScreen++;
        if(aios_enterFullScreen > 1) return;

        try {
            // Soll-Zustaende
            var close_switch = AiOS_HELPER.prefBranchAiOS.getBoolPref('fs.switch');
            var close_toolbar = AiOS_HELPER.prefBranchAiOS.getBoolPref('fs.toolbar');
            var close_sidebar = AiOS_HELPER.prefBranchAiOS.getBoolPref('fs.sidebar');

            // Ist-Zustaende
            var rem_switchHidden = aios_getBoolean(aios_toggleBox, 'hidden');
            var rem_toolbarHidden = aios_getBoolean(aios_toolbar, 'hidden');
            var rem_sidebarHidden = aios_isSidebarHidden();
        }
        catch(e) {
            return false;
        }

        // Ist-Zustaende speichern
        aios_toggleBox.setAttribute('fsSwitch', rem_switchHidden);
        aios_toggleBox.setAttribute('fsToolbar', rem_toolbarHidden);
        aios_toggleBox.setAttribute('fsToolbarMode', aios_toolbar.getAttribute("mode"));
        aios_toggleBox.setAttribute('fsToolbarIconsize', aios_toolbar.getAttribute("iconsize"));
        aios_toggleBox.setAttribute('fsSidebar', rem_sidebarHidden);

        // Soll-Zustaende herstellen (SidebarSwitch und Toolbar werden standardmaessig ausgeblendet)
        if(close_sidebar && !rem_sidebarHidden) toggleSidebar();

        aios_toggleBar.setAttribute("moz-collapsed", false);
        if(close_switch && !rem_switchHidden) aios_toggleBox.hidden = true;

        document.getElementById('aios-sbhtoolbar').setAttribute("moz-collapsed", false);

        aios_toolbar.setAttribute("moz-collapsed", false);
        //if(close_toolbar && !rem_toolbarHidden) onViewToolbarCommand(true);
        if(close_toolbar && !rem_toolbarHidden) aios_toggleToolbar(true);

        // Toolbar fuer Fullscreen einstellen (nur ohne die Erweiterung Autohide)
        if(typeof autoHIDE != "object") {
            aios_toolbar.setAttribute("mode", "icons");
            aios_toolbar.setAttribute("iconsize", "small");
        }
    }
    // Fullscreen aus
    //  => Elemente einblenden
    else {

        // Fix für mehrmaliges feuern des mozfullscreenchange events
        aios_enterFullScreen = 0;
        aios_leaveFullScreen++;
        if(aios_leaveFullScreen > 1) return;

        // Toolbareinstellungen wiederherstellen (nur ohne die Erweiterung Autohide)
        if(typeof autoHIDE != "object") {
            aios_toolbar.setAttribute("mode", aios_toggleBox.getAttribute('fsToolbarMode'));
            aios_toolbar.setAttribute("iconsize", aios_toggleBox.getAttribute('fsToolbarIconsize'));
        }

        if(enable_restore) {
            if(!aios_getBoolean(aios_toggleBox, 'fsSidebar')) toggleSidebar(fx_sidebarBox.getAttribute('aiosLastPanel'), true);
            else if(!aios_isSidebarHidden()) toggleSidebar();

            //onViewToolbarCommand(aios_getBoolean(aios_toggleBox, 'fsToolbar'));
            aios_toggleToolbar(aios_getBoolean(aios_toggleBox, 'fsToolbar'));
            aios_toggleBox.hidden = aios_getBoolean(aios_toggleBox, 'fsSwitch');
        }
    }

    // aktiviert/deaktiviert den schmalen Sidebar-Umschalter
    aios_checkThinSwitch();

    aios_adjustToolboxWidth(false);

    return true;
}