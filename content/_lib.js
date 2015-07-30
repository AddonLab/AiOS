
/*
    modifiziert das Firefox-Sidebar-Menue
        => Aufruf durch aios_initSidebar() und aios_getSidebarMenu() (Menuebutton-Events 'onpopupshowing')
*/
function aios_modSidebarMenu() {
    aios_getObjects();

    var actSidebar = aios_remLastSidebar();
    var command, commandParent;

    // jeden einzelnen Menuepunkt uebernehmen oder ggfs. abaendern
    for(var i = 0; i < fx_sidebarMenu.childNodes.length; i++) {
        command = null;
        commandParent = null;
        var broadcaster = null;
        var item = fx_sidebarMenu.childNodes[i];

        // Icons ein- oder ausblenden
        try {
            var enable_icons = AiOS_HELPER.prefBranchAiOS.getBoolPref('menus.sidebar.icons');
            var theClass = (enable_icons) ? '' : 'aios-noIcons';

            if(theClass != '') aios_appendClass(item, theClass);
            else aios_stripClass(item, 'aios-noIcons');
        }
        catch(e) { }

        // nur, wenn es kein Separator o.ae. ist
        if(item.getAttribute('observes') && document.getElementById(item.getAttribute('observes'))) {
            broadcaster = document.getElementById(item.getAttribute('observes'));

            if(broadcaster.getAttribute('oncommand')) {
                commandParent = broadcaster;

                if(broadcaster.id == "viewDMSidebar") {
                    var dmLabel = broadcaster.getAttribute('label');
                    if(dmLabel.indexOf(" (DMT)") < 0) {
                        broadcaster.setAttribute('label', dmLabel + " (DMT)");
                        broadcaster.setAttribute('tooltiptext', dmLabel + " (Download Manager Tweak)");
                    }
                }
            }
            else if(broadcaster.getAttribute('command')) {
                commandParent = document.getElementById(broadcaster.getAttribute('command'));
            }

            if(commandParent) command = commandParent.getAttribute('oncommand');
        }
        else if(item.getAttribute('oncommand')) {
            command = item.getAttribute('oncommand');
            commandParent = item;
        }

        // Label als Tooltip verwenden, wenn kein Tooltiptext eingestellt wurde
        if(!item.getAttribute('tooltiptext') && item.getAttribute('label'))
            item.setAttribute('tooltiptext', item.getAttribute('label'));

        // den Menuepunkt der aktuellen Sidebar aktivieren/deaktivieren
        if(command && commandParent) {

            try {
                var enable_deac = AiOS_HELPER.prefBranchAiOS.getBoolPref('menus.sidebar.entrydeac');

                if(actSidebar && command.indexOf(actSidebar) != -1 && enable_deac) item.setAttribute('disabled', true);
                else item.setAttribute('disabled', false);
            }
            catch(e) { }

        }
    }

    // var mitemsep1 = document.getElementById('aios-sidebar-mitem-sep1');
    // if(mitemsep1.nextSibling.id == "aios-sidebar-mitem-sep0" || mitemsep1.nextSibling.getAttribute('observes') == "viewConsole2Sidebar" || mitemsep1.nextSibling.getAttribute('observes') == "viewDmtSidebar")
    //     mitemsep1.setAttribute('hidden', true);


    // Menueeintraege anzeigen/verbergen (Sidebar oeffnen/schliessen und Einstellungen) und verschieben
    //var showhideMenuseparator = document.getElementById('aios-sidebar-mitem-sep0');
    var paneltabMitem1 = document.getElementById('aios-sidebar-mitem-paneltab1');
    var paneltabMitem2 = document.getElementById('aios-sidebar-mitem-paneltab2');
    var sidebarshowMitem = document.getElementById('aios-sidebar-mitem-show');
    var sidebarhideMitem = document.getElementById('aios-sidebar-mitem-hide');
    var prefsMitem = document.getElementById('aios-sidebar-mitem-prefs');

    var entries = new Array();
    entries[0] = new Array( "showhide", "paneltab1", "paneltab2", "prefs" );

    // Eintraege/Icons ein- oder ausblenden
    try {
        var enable_showhide = AiOS_HELPER.prefBranchAiOS.getBoolPref('menus.sidebar.showhide');
        var enable_entries = AiOS_HELPER.prefBranchAiOS.getBoolPref('menus.sidebar.entries');

        var returnVals = aios_showHideEntries(entries, 'menus.sidebar.', 'aios-sidebar-mitem-');

        if(enable_showhide && enable_entries) {
            sidebarshowMitem.setAttribute('hidden', !aios_isSidebarHidden());
            sidebarhideMitem.setAttribute('hidden', aios_isSidebarHidden());
        }
        else {
            sidebarshowMitem.setAttribute('hidden', true);
            sidebarhideMitem.setAttribute('hidden', true);
        }
    }
    catch(e) { }


    // Menueeintraege ganz nach unten verschieben, wenn das Menue noch nicht bearbeitet wurde
    if(!aios_getBoolean(fx_sidebarMenu, 'aios-modified')) {

        //fx_sidebarMenu.appendChild(showhideMenuseparator);
        fx_sidebarMenu.appendChild(paneltabMitem1);
        fx_sidebarMenu.appendChild(paneltabMitem2);
        fx_sidebarMenu.appendChild(sidebarshowMitem);
        fx_sidebarMenu.appendChild(sidebarhideMitem);
        fx_sidebarMenu.appendChild(prefsMitem);
    }

    // Sidebarmenue als bearbeitet merken
    fx_sidebarMenu.setAttribute('aios-modified', true);
}


/*
    Eintraege/Icons ein- oder ausblenden
        => Aufruf durch aios_modSidebarMenu()
*/
function aios_showHideEntries(entries, prefPre_tmp, IDPre) {
    var prefPre = prefPre_tmp;
    var returnVals = new Array();

    try {
        var enable_entries = AiOS_HELPER.prefBranchAiOS.getBoolPref(prefPre + "entries");
        var enable_icons = AiOS_HELPER.prefBranchAiOS.getBoolPref(prefPre + "icons");

        var theClass = (enable_icons) ? '' : 'aios-noIcons';

        for(var i = 0; i < entries.length; i++) {

            for(var j = 0; j < entries[i].length; j++) {
                var pref = false;
                // Pref fuer jeden Eintrag einlesen
                if(enable_entries) pref = AiOS_HELPER.prefBranchAiOS.getBoolPref(prefPre + entries[i][j]);

                // Eintraege ein- oder ausblenden
                var theID = IDPre + entries[i][j];
                if(document.getElementById(theID)) {
                    // falls es mehrere davon gibt => z.B. wegen CompactMenu
                    var items = document.getElementsByAttribute('id', theID);
                    for(var xy = 0; xy < items.length; xy++) {
                        items[xy].hidden = !pref;
                    }
                }

                // aktivierte Eintraege je Gruppe zaehlen
                if(!returnVals[i]) returnVals[i] = 0;
                if(pref) returnVals[i]++;

                // Icons ein- oder ausblenden
                if(document.getElementById(IDPre + entries[i][j])) {
                    var elem = document.getElementById(IDPre + entries[i][j]);

                    if(theClass != '') aios_appendClass(elem, theClass);
                    else aios_stripClass(elem, 'aios-noIcons');
                }
            }

            // Separator ein- oder ausblenden
            var sep = IDPre + "sep" + i;
            if(document.getElementById(sep)) document.getElementById(sep).hidden = !(returnVals[i] > 0);
        }
    }
    catch(e) { }

    return returnVals;
}


/*
    Oeffnet die Tab-URL in der Sidebar oder die Sidebar-URL in einem neuen Tab
        => Aufruf durch <command id="aiosCmd_panelTab1">
                                        <command id="aiosCmd_panelTab2">
                                        <toolbarbutton id="paneltab-button">
             in aios.xul
*/
var aiosNewTab, aiosSidebarTitle;
function aios_panelTab(event) {
    try {
        var ptReverse = AiOS_HELPER.prefBranchAiOS.getBoolPref("paneltab.reverse");
        var enable_rightclick = AiOS_HELPER.prefBranchAiOS.getBoolPref("rightclick");
    }
    catch(e) { }

    if(!event || (!enable_rightclick && event.button == 2)) return false;

    var theSidebar;
    var mode = "sidebar";

    if(typeof event == "object") {
        if((event.shiftKey && event.button == 0)) mode = "window";
        // metaKey = Mac
        if((event.ctrlKey && event.button == 0) || (event.metaKey && event.button == 0) || event.button == 1) mode = "tab";

        // Button-Funktion umkehren?
        if(ptReverse) {
            mode = "tab";
            if((event.shiftKey && event.button == 0)) mode = "window";
            // metaKey = Mac
            if((event.ctrlKey && event.button == 0) || (event.metaKey && event.button == 0) || event.button == 1) mode = "sidebar";
        }

        // Rechtsklick?
        if(enable_rightclick && event.button == 2)  mode = "window";
    }

    if(typeof event == "string") mode = event;


    /*
        in SIDEBAR oeffnen
    */
    if(mode == "sidebar") {
        var tabHref = top.window.content.location.href;

        // interne FF-Quellen (chrome:/)
        if(tabHref.indexOf("chrome:/") >= 0) {
            theSidebar = aios_isSidebar(tabHref);

            // bei "richtigem" Sidebar-Panel den Sidebar-Toggle-Befehl anwenden
            if(theSidebar) {
                toggleSidebar(theSidebar, true);
            }
            // keine Sidebar (aber chrome://)
            else {
                // aktive Sidebar deaktivieren und persists loeschen
                if(document.getElementById(theSidebar)) {
                    document.getElementById(theSidebar).removeAttribute('checked');
                    document.getElementById("sidebar").removeAttribute("src");
                    document.getElementById("sidebar-box").removeAttribute("src");
                    document.getElementById("sidebar-box").removeAttribute("sidebarcommand");
                }

                // chrome-URI in Sidebar oeffnen
                top.document.getElementById('sidebar').contentDocument.location.href = tabHref;
                document.getElementById('sidebar-title').setAttribute('value', top.window.content.document.title);
            }
        }
        // about:
        else if(tabHref.indexOf("about:") >= 0) {
            aios_setMultiPanel(tabHref);
        }
        // normale Webseite
        else {
            aios_setMultiPanel('page');
        }
    }
    /*
        in TAB oder FENSTER oeffnen
    */
    else {
        var newSrc;

        if(fx_sidebarBox.hidden) return false;

        var sidebarDoc = top.document.getElementById('sidebar').contentDocument;
        var sidebarHref = sidebarDoc.location.href;
        aiosSidebarTitle = top.document.getElementById('sidebar-title').getAttribute('value');

        if(sidebarDoc.getElementById('web-panels-browser')) {
            var panelDoc = sidebarDoc.getElementById('web-panels-browser').contentDocument;
            var panelHref = panelDoc.location.href;
        }

        // Bookmark-Manager statt Panel?
        if(sidebarHref == "chrome://browser/content/bookmarks/bookmarksPanel.xul") {
            try {
                var enable_bmm = AiOS_HELPER.prefBranchAiOS.getBoolPref("paneltab.bm");
            }
            catch(e) { }
            newSrc = (enable_bmm) ? "chrome://browser/content/places/places.xul" : sidebarHref;
        }
        // statt MultiPanel-XUL die im Panel geoeffnete Webseite oeffnen
        else if(sidebarHref == "chrome://browser/content/web-panels.xul" && mode == "tab") newSrc = panelHref;
        // alle anderen
        else newSrc = sidebarHref;

        // in TAB oeffnen
        if(mode == "tab") {
            aiosNewTab = aios_addTab(newSrc);

            if(!enable_bmm) {

                window.setTimeout(function() {
                    aiosNewTab.setAttribute('label', aiosSidebarTitle);
                }, 400);

            }
        }
        // in FENSTER oeffnen
        else {
            // wird zur Abfrage in addons/downlaods_....xul und downloads.js benoetigt
            // sonst wuerden extra geoeffnete Fenster (Downloads, Add-ons) sofort wieder geschlossen
            AiOS_HELPER.mostRecentWindow.aiosIsWindow = true;
            window.setTimeout(function() {
                AiOS_HELPER.mostRecentWindow.aiosIsWindow = false;
            }, 500);

            var winID = "aiosPanelTabWindow_" + top.document.getElementById('sidebar-box').getAttribute('sidebarcommand');
            var winWidth = (screen.availWidth >= 900) ? 800 : screen.availWidth/2;
            var winHeight = (screen.availHeight >= 700) ? 600 : screen.availHeight/2;
            toOpenWindowByType(winID, newSrc, "width="+winWidth+",height="+winHeight+",chrome,titlebar,toolbar,resizable,centerscreen,dialog=no");
        }
    }

    return true;
}


/*

*/
function aios_isSidebar(aHref) {
    // wenn es ein "richtiges" Sidebar-Panel ist (vorhandener broadcaster)
    // => richtigen Sidebar-Toggle-Befehl anwenden
    //var isSidebar = null;
    var theSidebar = null;
    var allSidebars = AiOS_HELPER.mostRecentWindow.document.getElementsByAttribute('group', 'sidebar');

    for(var i = 0; i < allSidebars.length; i++) {

        // muss eine ID haben, darf keinen observer haben (Menueeintraege usw.) und muss eine Sidebar-URL haben
        if(allSidebars[i].id && !allSidebars[i].getAttribute('observes') && allSidebars[i].getAttribute('sidebarurl')) {

            // aktive Sidebar merken
            if(aios_getBoolean(allSidebars[i].id, 'checked')) theSidebar = allSidebars[i].id;

            if(aHref == allSidebars[i].getAttribute('sidebarurl')) {
                return allSidebars[i].id;
            //isSidebar = true;
            }
        }
    }

    return false;
}


/*
    Oeffnet div. Fenster u. Manager per Original-Anweisung
        Aufruf durch Toolbarbuttons und Menueeintraege
*/
function aios_contextEvent(event, which) {
    try {
        var enable_rightclick = AiOS_HELPER.prefBranchAiOS.getBoolPref("rightclick");
    }
    catch(e) { }

    //alert("Maus: " + event.button + "\nShift: " + event.shiftKey + "\nCtrl: " + event.ctrlKey + "\nAlt: " + event.altKey + "\nMeta: " + event.metaKey);

    if(event.button == 0 && (!event.shiftKey && !event.ctrlKey && !event.metaKey)) return false;      // nur Linksklick (metaKey = Mac)

    if(!enable_rightclick && event.button == 2) return false;                       // Rechtsklick nicht erlaubt

    if(!event || typeof which != "object") return false;                            // kein empfangenes Event

    var mWindow = document.getElementById('main-window');
    if(mWindow && mWindow.getAttribute('chromehidden').indexOf('extrachrome') >= 0) return false; // in einem JS-PopUp

    // Objekt ermitteln, welches das Attribut mit Befehl enthaelt (zuvor in aios_setTargets() gesetzt)
    var cmdObj;
    if(which.getAttribute('command')) cmdObj = document.getElementById(which.getAttribute('command'));
    if(!cmdObj && which.getAttribute('observes')) cmdObj = document.getElementById(which.getAttribute('observes'));

    // Modus ermitteln
    var mode = "sidebar";

    // Shift+Linksklick => neues Fenster
    if((event.shiftKey && event.button == 0) || (enable_rightclick && event.button == 2)) {
        if(aios_getBoolean(cmdObj, 'aios_inSidebar') || cmdObj.getAttribute('group') == "sidebar") mode = "window";
    }

    // Ctrl+Linksklick oder Mittelklick => neuer Tab (metaKey = Mac)
    if((event.ctrlKey && event.button == 0) || (event.metaKey && event.button == 0) || event.button == 1) mode = "tab";

    if(!cmdObj) return false;

    // Befehl ausfuehren
    switch(mode) {
        case "sidebar":
            toggleSidebar(cmdObj.getAttribute('aios_sbCmd'));
            break;

        case "window":      // wird zur Abfrage in addons/downloads_....xul und downloads.js benoetigt
            // sonst wuerden extra geoeffnete Fenster (Downloads, Add-ons) sofort wieder geschlossen
            AiOS_HELPER.mostRecentWindow.aiosIsWindow = true;
            window.setTimeout(function() {
                AiOS_HELPER.mostRecentWindow.aiosIsWindow = false;
            }, 500);

            var winID = "aiosContextEventWindow_" + cmdObj.getAttribute('aios_sbCmd');
            var winSRC = cmdObj.getAttribute('aios_sbUri');
            var winWidth = (screen.availWidth >= 900) ? 800 : screen.availWidth/2;
            var winHeight = (screen.availHeight >= 700) ? 600 : screen.availHeight/2;
            toOpenWindowByType(winID, winSRC, "width="+winWidth+",height="+winHeight+",chrome,titlebar,toolbar,resizable,centerscreen,dialog=no");

            break;

        case "tab":
            aios_addTab(cmdObj.getAttribute('aios_sbUri'));
            break;
    }

    return true;
}


/*
    legt commands fuer Fenster fest, die lt. Einstellungen in der Sidebar geoeffnet werden sollen
        => dynamisch per JS, damit keinerlei Veraenderungen vorgenommen werden, wenn es nicht in der Sidebar geoeffnet werden soll
                => bessere Kompatibilitaet mit anderen Erweiterungen
        => Aufruf durch aios_initSidebar()
*/
function aios_setTargets() {
    var objects, i;

    // weise den Menueelementen der Fehlerkonsole, des Seitenquelltextes und der Seiteninformationen die entsprechenden commands zu
    document.getElementById('javascriptConsole').removeAttribute('oncommand');
    document.getElementById('javascriptConsole').setAttribute('command', 'Tools:Console');

    if(document.getElementById('key_errorConsole')) {
        document.getElementById('key_errorConsole').removeAttribute('oncommand');
        document.getElementById('key_errorConsole').setAttribute('command', 'Tools:Console');
    }

    document.getElementById('context-viewinfo').removeAttribute('oncommand');
    document.getElementById('context-viewinfo').setAttribute('command', 'View:PageInfo');


    var targets = new Array();
    targets['bm'] = new Array('View:Bookmarks',     'viewBookmarksSidebar',     'bookmarks');
    targets['hi'] = new Array('View:History',       'viewHistorySidebar',       'history');
    targets['dm'] = new Array('Tools:Downloads',    'viewDownloadsSidebar',     'downloads');
    targets['ad'] = new Array('Tools:Addons',       'viewAddonsSidebar',        'addons');
    targets['mp'] = new Array('Tools:MultiPanel',   'viewWebPanelsSidebar',     'multipanel');
    targets['pi'] = new Array('View:PageInfo',      'viewPageInfoSidebar',      'pageinfo');
    targets['co'] = new Array('Tools:Console',      'viewConsoleSidebar',       'console');

    if(document.getElementById('viewConsole2Sidebar'))
        targets['co'] = new Array('Tools:Console', 'viewConsole2Sidebar', 'console');

    // informative Tooltips und Funktionsumkehrung (PanelTab) aktivieren?
    var prefInfotip = false;
    var ptReverse = false;
    try {
        prefInfotip = AiOS_HELPER.prefBranchAiOS.getBoolPref("infotips");
        ptReverse = AiOS_HELPER.prefBranchAiOS.getBoolPref("paneltab.reverse");

        if(prefInfotip) {
            if(elem_switch) elem_switch.removeAttribute('tooltiptext');

            //if(document.getElementById('paneltab-button')) document.getElementById('paneltab-button').removeAttribute('tooltiptext');
            // in Schleife, weil es mehrere Buttons mit der gleichen ID geben kann
            objects = document.getElementsByAttribute('id', 'paneltab-button');
            for(i = 0; i < objects.length; i++) {
                objects[i].removeAttribute('tooltiptext');
            }
        }

        if(document.getElementById('paneltab-button')) {
            if(ptReverse) document.getElementById('paneltab-button').setAttribute('tooltip', 'paneltab-tooltip-reverse');
            else document.getElementById('paneltab-button').setAttribute('tooltip', 'paneltab-tooltip');
        }
    }
    catch(e) { }

    for(var obj in targets) {
        // in Sidebar oeffnen?
        var prefSidebar;
        try {
            if(obj != "ad") prefSidebar = AiOS_HELPER.prefBranchAiOS.getBoolPref(obj + ".sidebar");
            else prefSidebar = AiOS_HELPER.prefBranchAiOS.getBoolPref("em.sidebar");

            var enable_rightclick = AiOS_HELPER.prefBranchAiOS.getBoolPref("rightclick");
        }
        catch(e) { }

        var ffObj = document.getElementById(targets[obj][0]);           // Original-Objekt
        var sbObj = document.getElementById(targets[obj][1]);           // Sidebar-Objekt
        var tpObj = document.getElementById(targets[obj][2] + "-tooltip");  // Tooltip
        var btObj = document.getElementById(targets[obj][2] + "-button");   // Button

        if(ffObj && sbObj) {

            var newObj, newCmd, newTp;

            if(prefSidebar) {
                newObj = sbObj;
                newTp = document.getElementById('template-sidebar-tooltip').childNodes[0].cloneNode(true);
            }
            else {
                newObj = ffObj;
                newTp = document.getElementById('template-window-tooltip').childNodes[0].cloneNode(true);
            }

            newCmd = newObj.getAttribute('oncommand');

            // verhindern dass zwei Befehle ausgefuehrt werden, wenn eine Taste mitgedrueckt wird
            newCmd = "if(aios_preventDblCmd(event)) " + newCmd + " return true;";

            // Befehl zuweisen
            ffObj.setAttribute('oncommand', newCmd);


            // Befehle merken
            //  => fuer Context-Funktionen - aios_contextEvent() - abfragbar
            //  => zuweisbar, wenn nicht mehr in Sidebar geoeffnet werden soll
            if(!aios_getBoolean(ffObj, 'modByAIOS')) {
                // fuer Klicks auf Toolbarbuttons und Menueeintraege
                ffObj.setAttribute('aios_sbUri', sbObj.getAttribute('sidebarurl'));
                ffObj.setAttribute('aios_sbCmd', targets[obj][1]);
                ffObj.setAttribute('aios_inSidebar', prefSidebar);

                // fuer Klicks auf Menueeintraege in den Sidebarmenues => siehe aios_preventDblCmd()
                sbObj.setAttribute('aios_sbUri', sbObj.getAttribute('sidebarurl'));
                sbObj.setAttribute('oncommand', "if(aios_preventDblCmd(event)) " + sbObj.getAttribute('oncommand'));
            }


            // Tooltiptext entfernen, um Info-Tooltips sichtbar zu machen (in Schleife, weil es mehrere Buttons mit der gleichen ID geben kann)
            //if(prefInfotip && btObj) btObj.removeAttribute('tooltiptext');
            if(prefInfotip && btObj) {
                objects = document.getElementsByAttribute('id', btObj.id);
                for(i = 0; i < objects.length; i++) {
                    objects[i].removeAttribute('tooltiptext');
                }
            }

            // "alte" Tooltip-Zeilen entfernen (sonst werden sie mit jedem Funktionsaufruf zusaetzlich eingefuegt)
            if(tpObj.childNodes.length > 1) tpObj.removeChild(tpObj.childNodes[1]);

            // Rechtsklick im Tooltip aktivieren
            if(enable_rightclick)
                newTp.setAttribute('r3c2', newTp.getAttribute('r3c2') + newTp.getAttribute('rightclick'));

            // Tooltip zuweisen
            tpObj.appendChild(newTp);

            // Kontext-Menue der Toolbarbuttons deaktivieren, wenn Rechtsklick erlaubt ist
            if(btObj && enable_rightclick) btObj.setAttribute('context', '');

            ffObj.setAttribute('modByAIOS', true);
        }
    }

    // Kontext-Menue des PanelTab buttons deaktivieren, wenn Rechtsklick erlaubt ist
    if(enable_rightclick && document.getElementById('paneltab-button')) {
        document.getElementById('paneltab-button').setAttribute('context', '');
        var pttt1 = document.getElementById('paneltab-tooltip').firstChild;
        var pttt2 = document.getElementById('paneltab-tooltip-reverse').firstChild;

        if(pttt1.getAttribute('r3c2').indexOf(pttt1.getAttribute('rightclick')) == -1) {
            pttt1.setAttribute('r3c2', pttt1.getAttribute('r3c2') + pttt1.getAttribute('rightclick'));
        }
        if(pttt2.getAttribute('r3c2').indexOf(pttt2.getAttribute('rightclick')) == -1) {
            pttt2.setAttribute('r3c2', pttt2.getAttribute('r3c2') + pttt2.getAttribute('rightclick'));
        }
    }


    // Oeffnen des Download-Fensters verhindern, wenn die Sidebar genutzt werden soll
    if(AiOS_HELPER.prefBranchAiOS.getBoolPref('dm.sidebar')) AiOS_HELPER.prefService.setBoolPref("browser.download.manager.showWhenStarting", false);


    // Download-Observer hinzufuegen, falls Downloads in der Sidebar geoeffnet werden sollen
    var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);

    observerService.addObserver(aios_DownloadObserver, "dl-start",  false);
    observerService.addObserver(aios_DownloadObserver, "dl-done",  false);

    // Observer beim Schliessen des Fensters wieder loeschen
    window.addEventListener("unload", function() {
        if(aios_DownloadObserver) {
            var aios_myOs = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
            aios_myOs.removeObserver(aios_DownloadObserver, "dl-start");
            aios_myOs.removeObserver(aios_DownloadObserver, "dl-done");
            aios_DownloadObserver = null;
        }

    }, false);



    return true;
}

/*
    Oeffnet die Sidebar,
        1. wenn ein Download gestartet wird ...
        2. der Manager geoeffnet werden soll und ...
        3. das Ziel die Sidebar sein soll
*/
var aios_DownloadObserver = {
    observe: function (aSubject, aTopic, aState) {

        var autoOpen = AiOS_HELPER.prefBranchAiOS.getBoolPref('dm.autoopen');
        var autoClose = AiOS_HELPER.prefBranchAiOS.getBoolPref('dm.autoclose');
        var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIWebNavigation).QueryInterface(Components.interfaces.nsIDocShellTreeItem).rootTreeItem.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIDOMWindow);

        switch (aTopic) {
            case "dl-start":
                var comElem = document.getElementById('Tools:Downloads');
                if(autoOpen && comElem.getAttribute('oncommand').indexOf('viewDownloadsSidebar') >= 0) {
                    // AiOS_HELPER.windowWatcher.activeWindow verhindert, dass die Sidebar in jedem Fenster geoeffnet wird
                    if(typeof AiOS_HELPER.windowWatcher.activeWindow.toggleSidebar == "function") AiOS_HELPER.windowWatcher.activeWindow.toggleSidebar("viewDownloadsSidebar", true);
                }
                break;

            case "dl-done":
                var sideSrc = document.getElementById('sidebar').getAttribute('src');
                if(autoOpen && autoClose && sideSrc.indexOf('downloads.xul') >= 0) {
                    if(typeof AiOS_HELPER.windowWatcher.activeWindow.toggleSidebar == "function") AiOS_HELPER.windowWatcher.activeWindow.toggleSidebar();
                }
                break;
        }
    }
};


/*
  verhindert, dass bei Klick + Shift oder Strg der normale Command-Befehl und die Doppelfunktion ausgefuehrt wird
    => Aufruf durch die
*/
function aios_preventDblCmd(ev) {
    // metaKey = Mac
    if(ev.shiftKey || ev.ctrlKey || ev.metaKey) {
        if(ev.explicitOriginalTarget.tagName == 'toolbarbutton' || ev.explicitOriginalTarget.tagName == 'menuitem') return false;
    }
    return true;
}


/*
    prueft, ob das Browserfenster maximiert ist oder sich im Vollbildmodus befindet
        => Aufruf durch aios_checkThinSwitch()
*/
function aios_isWinMax() {
    var windowMax = document.getElementById('main-window').getAttribute('sizemode') == "maximized";

    var maxWidth = window.outerWidth > screen.availWidth;
    var maxHeight = window.outerHeight > screen.availHeight;
    if((maxWidth && maxHeight) || window.fullScreen) windowMax = true;

    return windowMax;
}


/*
    prueft, ob die Sidebar gerade sichtbar/unsichtbar ist => abhaengig von der Sidebar-Methode
*/
function aios_isSidebarHidden() {
    aios_getObjects();

    try {
        var aios_collapseSidebar = AiOS_HELPER.prefBranchAiOS.getBoolPref('collapse');
    }
    catch(e) { }

    // CollapseByStyle-Methode if(aios_collapseSidebar) return (fx_sidebarBox.hidden || fx_sidebarBox.getAttribute('style') != "");
    if(aios_collapseSidebar) return (fx_sidebarBox.hidden || fx_sidebarBox.collapsed);
    else return fx_sidebarBox.hidden;
}


/*
    Autohide-Feature initialisieren
        => Aufruf durch aios_initSidebar() und aios_savePrefs()
*/
var aiosFocus = true;
function aios_initAutohide() {
    // Zustand des Autohide-Buttons einstellen
    document.getElementById('aios-enableAutohide').setAttribute('checked', AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.autoshow"));

    // Autohide-Feature-Funktion hinzufuegen
    fx_sidebarBox.addEventListener("mouseover", function() {
        if(document.getElementById('appcontent'))
            document.getElementById('appcontent').addEventListener("mouseover", aios_autoShowHide, true);
    }, true);

    window.addEventListener("focus", function(e) {
        aiosFocus = true;
    }, true);
    window.addEventListener("blur", function(e) {
        aiosFocus = false;
    }, true);
}


/*
    Autohide ein- bzw. ausschalten per Toolbarbutton
        => Aufruf durch broadcaster 'aios-enableAutohide'
*/
function aios_toggleAutohide(which) {
    try {
        AiOS_HELPER.prefBranchAiOS.setBoolPref("gen.switch.autoshow", aios_getBoolean(which, 'checked'));
    }
    catch(e) { }
}
