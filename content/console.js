
// Window-Element ermitteln
var conWindow;
if(document.getElementById('JSConsoleWindow')) conWindow = document.getElementById('JSConsoleWindow');
if(document.getElementById('Console2Window')) conWindow = document.getElementById('Console2Window');


/*
    Initialisierung
        => Aufruf durch onload in console.xul
*/
function aios_init() {

    try {
        var enable_layout = aios_gPrefBranch.getBoolPref("co.layout");
        var enable_layoutall = aios_gPrefBranch.getBoolPref("co.layoutall");

        var aios_inSidebar = (top.document.getElementById('sidebar-box')) ? true : false;
    }
    catch(e) { }

    // Menueleiste unter Mac OS X ausblenden
    aios_hideMacMenubar();

    // fuer CSS-Zwecke speichern
    aios_appInfo(conWindow);

    // Layout-Optimierungen aktivieren?
    if((enable_layout && aios_inSidebar) || enable_layoutall) aios_sidebarLayout();

    // Tastaturkuerzel entfernen, um nicht die des Hauptbrowsers zu blockieren
    if(aios_inSidebar) aios_removeAccesskeys();
}


/*
    aktiviert das an die Sidebar angepasste Layout
        => Aufruf durch aios_init()
*/
function aios_sidebarLayout() {

    aios_addCSS("console.css", conWindow);

    // Fx-Error-Console
    if(conWindow.id == "JSConsoleWindow") {
        // Spacer erzeugen und einfuegen
        var new_spacer = document.createElement("spacer");
        new_spacer.setAttribute("flex", 1);
        var theToolbar = document.getElementById('ToolbarMode');
        theToolbar.insertBefore(new_spacer, theToolbar.childNodes[theToolbar.childNodes.length - 2]);

        // Toolbarbuttons mit Tooltip
        if(document.getElementById("ToolbarMode")) {
            var tbChilds = document.getElementById("ToolbarMode").childNodes;
            for(var i = 0; i < tbChilds.length; i++) {
                if(tbChilds[i].tagName == "toolbarbutton") tbChilds[i].setAttribute('tooltiptext', tbChilds[i].getAttribute('label'));
            }
        }

        // Label der Buttons unsichtbar machen => nur wenn es Icons gibt
        var cStyle = document.defaultView.getComputedStyle(document.getElementById('Console:modeAll'), '');
    }
    else if (conWindow.id == "Console2Window") {
        var cStyle = document.defaultView.getComputedStyle(document.getElementById('item_modeAll'), '');
    }

    if(cStyle && cStyle.listStyleImage && cStyle.listStyleImage != "none") {
        if(document.getElementById('ToolbarMode')) document.getElementById('ToolbarMode').setAttribute("hideLabel", true);
    }
}