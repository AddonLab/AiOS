
window.addEventListener("DOMContentLoaded", aios_init, false);

var aios_managerWindow, aios_posElem, aios_Interval;
var aios_IntervalCount = 0;

var aios_inSidebar = (top.document.getElementById('sidebar-box')) ? true : false;


/* Fix fuer Clean-Button im Downloads-Panel */
if(aios_inSidebar) window.arguments = [];


function aios_init() {
    var enable_sidebar, enable_count, enable_layout, enable_layoutall;

    // Menueleiste unter Mac OS X ausblenden
    aios_hideMacMenubar();

    aios_managerWindow = document.getElementById("downloadManager");
    aios_posElem = document.getElementById("downloadView");

    // fuer CSS-Zwecke speichern
    AiOS_HELPER.rememberAppInfo( aios_managerWindow );

    try {
        enable_sidebar = AiOS_HELPER.prefBranchAiOS.getBoolPref("dm.sidebar");
        enable_count = AiOS_HELPER.prefBranchAiOS.getBoolPref("dm.count");
        enable_layout = AiOS_HELPER.prefBranchAiOS.getBoolPref("dm.layout");
        enable_layoutall = AiOS_HELPER.prefBranchAiOS.getBoolPref("dm.layoutall");
    }
    catch(e) {
        return false;
    }

    // Sidebar-Layout
    if((enable_layout && aios_inSidebar) || enable_layoutall) aios_sidebarLayout();

    // Elemente zaehlen und anzeigen
    if(enable_count) {
        // beim Aufbau der Downloadliste den Titel aktualisieren
        var orig_stepListBuilder = stepListBuilder;
        stepListBuilder = function(aNumItems) {
            orig_stepListBuilder(aNumItems);
            aios_countItems();
        };

        // bei neuen Downloads oder Statuswechseln den Titel aktualisieren
        // https://developer.mozilla.org/en/DOM/Mutation_events
        // https://developer.mozilla.org/en/DOM/DOM_Mutation_Observers
        var dm = Components.classes["@mozilla.org/download-manager;1"]
                 .getService(Components.interfaces.nsIDownloadManager);

        dm.addListener({
            onStateChange : function(state, dl) { aios_countItems(); },
            onDownloadStateChange : function(state, dl) { aios_countItems(); }
        });

        // beim Loeschen der Downloadliste den Titel aktualisieren
        var orig_clearDownloadList = clearDownloadList;
        clearDownloadList = function() {
            orig_clearDownloadList();
            aios_countItems();
        };
    }
    else {
        // Zahl im Titel entfernen
        // => noetig nur direkt nach der Deaktivierung der Option, weil im Broadcaster die Anzahl gespeichert ist
        if(top.document.getElementById('sidebar-title')) {
            var title = top.document.getElementById('sidebar-title').getAttribute("value");

            if(title.indexOf(" [") > 0) {
                var newTitle = title.substring(0, title.indexOf(" ["));
                top.document.getElementById('sidebar-title').setAttribute("value", newTitle);

                if(aios_inSidebar) AiOS_HELPER.mostRecentWindow.document.getElementById("viewDownloadsSidebar").setAttribute('sidebartitle', newTitle);
            }
        }
    }

    if(document.getElementById("searchbox")) {

        window.setTimeout(function() {
            document.getElementById("searchbox").focus();
        }, 50);

    }

    // Tastaturkuerzel entfernen, um nicht die des Hauptbrowsers zu blockieren
    if(aios_inSidebar) aios_removeAccesskeys();

    return true;
}


/*
    aktiviert das an die Sidebar angepasste Layout
        => Aufruf durch aios_init()
*/
function aios_sidebarLayout() {
    var cmdBar, i;

    // CSS fuer Sidebar-Optimierungen aktivieren
    aios_addCSS("downloads.css", aios_managerWindow);

    cmdBar = document.getElementById("search");

    // Toolbar nach oben versetzen
    aios_managerWindow.insertBefore(cmdBar, aios_posElem);


    // Buttons durch Toolbarbuttons ersetzen
    var tbChilds = cmdBar.childNodes;
    var tbutton, tobserver;
    for(i = 0; i < tbChilds.length; i++) {

        if(tbChilds[i].tagName == "button") {
            tbutton = document.createElement("toolbarbutton");

            for(var j = 0; j < tbChilds[i].attributes.length; j++) {
                tbutton.setAttribute(tbChilds[i].attributes[j].name, tbChilds[i].attributes[j].value);
            }

            tbChilds[i].parentNode.replaceChild(tbutton, tbChilds[i]);
        }
    }
}


/*
    zaehlt und zeigt die aktivierten und deaktivierten Extensions im Sidebartitel an
        => Aufruf durch aios_init()
*/
function aios_countItems() {
    if(!AiOS_HELPER.mostRecentWindow.document) return false;

    // Fix fuer MR Tech Local Install
    var li_count = false;

    if(typeof Local_Install == "object") {
        var li_gPrefBranch = AiOS_HELPER.prefService.getBranch("local_install.");
        li_count = li_gPrefBranch.getBoolPref("showManagerTotals");
        if(li_count) return false;
        else Local_Install.setWindowTitle = function(){};
    }

    // bisherigen Titel feststellen
    var newTitle;
    var origTitle = "";
    if(AiOS_HELPER.mostRecentWindow.document.getElementById("viewDownloadsSidebar")) origTitle = AiOS_HELPER.mostRecentWindow.document.getElementById("viewDownloadsSidebar").getAttribute('label');

    if(document.getElementById("viewGroup")) {
        if(document.getElementById("viewGroup").selectedItem) {
            var viewTitle = document.getElementById("viewGroup").selectedItem.getAttribute('label');
            origTitle = origTitle + " - " + viewTitle;
        }
    }

    // Elemente zaehlen
    //var exts = aios_filterItems(aios_boxElem.childNodes, function(c){ return c.nodeName == "richlistitem" });
    var exts = aios_filterItems();

    var str_count = "";

    var list_downloading = 0;
    var list_done = 0;
    var list_failed = 0;

    for(var i = 0; i < exts.length; i++) {
        var state = exts[i].getAttribute('state');

        // downloading => starting + downloading + paused + downloading
        if(state == "-1" || state == "0" || state == "4" || state == "5") list_downloading++;

        // done => done
        if(state == "1") list_done++;

        // failed => failed + canceled
        if(state == "2" || state == "3") list_failed++;
    }

    str_count = list_done;
    if(list_downloading > 0 || list_failed > 0) str_count = str_count + "/" + list_downloading;
    if(list_failed > 0) str_count = str_count + "/" + list_failed;

    newTitle = origTitle + " [" + str_count + "]";

    // Titel und Label setzen
    document.title = newTitle;

    if(top.document.getElementById('sidebar-title')) top.document.getElementById('sidebar-title').setAttribute("value", newTitle);

    // Sidebartitel im Broadcaster speichern, damit er beim Schliessen/oeffnen der Sidebar wiederhergestellt werden kann
    if(aios_inSidebar) AiOS_HELPER.mostRecentWindow.document.getElementById("viewDownloadsSidebar").setAttribute('sidebartitle', newTitle);

    return true;
}


/*
    Original-Code by Caio Chassot
        Slim_Extension_List_0.1
        http://v2studio.com/k/moz/

        => Aufruf durch aios_init()

function aios_filterItems(l,f) {
    var r = [];
    if (!f) f = function(v){return v};
    for (var i=0; i<l.length; i++) if (f(l[i])) r.push(l[i]);
    return r;
}*/
function aios_filterItems() {
    var r = [];
    var childs;

    childs = document.getElementById("downloadView").childNodes;

    for (var i = 0; i < childs.length; i++) {
        if (childs[i].nodeName == "richlistitem" && childs[i].getAttribute('hidden') != "true") {
            r.push(childs[i]);
        }
    }

    return r;
}


/*
    legt den Sidebartitel fest (nur bei Add-ons)
        => Aufruf durch aios_init() und onclick-Handler auf den Radio-Buttons
*/
function aios_setTitle(aObj) {
    if(typeof Local_Install == "object") return false;

    if(!AiOS_HELPER.mostRecentWindow.document) return false;

    var newTitle;
    var origTitle = AiOS_HELPER.mostRecentWindow.document.getElementById("viewDownloadsSidebar").getAttribute('label');

    var viewTitle;

    // Label des zukuenftigen Panels (ausgeloest nur durch Klick auf Radio-Button)
    if(typeof aObj == "object") viewTitle = aObj.getAttribute('label');
    // Label des selektierten Radio-Buttons
    else if(document.getElementById("viewGroup")) viewTitle = document.getElementById("viewGroup").selectedItem.getAttribute('label');

    newTitle = origTitle + " - " + viewTitle;

    // Titel und Label setzen
    //document.title = newTitle;

    if(!top.document.getElementById('sidebar-title')) return false;
    top.document.getElementById('sidebar-title').setAttribute("value", newTitle);

    // Sidebartitel im Broadcaster speichern, damit er beim Schliessen/oeffnen der Sidebar wiederhergestellt werden kann
    if(aios_inSidebar) AiOS_HELPER.mostRecentWindow.document.getElementById("viewDownloadsSidebar").setAttribute('sidebartitle', newTitle);

    return true;
}
