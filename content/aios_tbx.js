/*
    Breite der vertikalen Toolboxen freigeben bzw. festsetzen
        => Aufruf durch aios_toggleToolbar(), aios_setToolbarView(), aios_setToolbarPos(), aios_customizeToolbar() und aios_BrowserFullScreen()
        => Aufruf indirekt auch durch aios_initSidebar() => aios_setSidebarOrient() loest aios_setToolbarPos() aus
        => per JS statt CSS, weil es wegen Themes dynamisch sein muss
 */
function aios_adjustToolboxWidth(aMode) {
    aios_getObjects();

    var tboxen = new Array('aios-toolbox-left', 'aios-toolbox-right');
    var tbox;

    // erstmal alle Festlegungen loeschen
    for(tbox in tboxen) {
        aios_gElem(tboxen[tbox]).style.minWidth = "";
        aios_gElem(tboxen[tbox]).style.width = "";
        aios_gElem(tboxen[tbox]).style.maxWidth = "";
        aios_gElem(tboxen[tbox]).removeAttribute('width');
    }

    // wenn noch keine Festlegungen getroffen werden sollten, diese durch rekursiven Aufruf kurze Zeit spaeter initiieren
    // verzoegerter Aufruf sichert die einwandfreie Funktion
    if(!aMode) {

        window.setTimeout(function() {
            aios_adjustToolboxWidth(true);
        }, 100);

        return false;
    }

    // Breiten festlegen...
    var usedToolbox;
    var aiosOrient = fx_mainWindow.getAttribute('aiosOrient');
    var posMode = aios_toolbar.getAttribute('posMode');

    // Toolbox je nach Sidebar-Ausrichtung waehlen
    if((aiosOrient == "left" && posMode == "1") || (aiosOrient == "right" && posMode == "2")) {
        usedToolbox = 'aios-toolbox-left';
    }
    else if((aiosOrient == "left" && posMode == "2") || (aiosOrient == "right" && posMode == "1")) {
        usedToolbox = 'aios-toolbox-right';
    }

    // usedToolbox ist false wenn die Toolbar innerhalb der Sidebar positioniert ist...
    if(usedToolbox) {
        var cStyle = document.defaultView.getComputedStyle(aios_gElem(usedToolbox), null);
        var myWidth = parseInt(cStyle.width) + parseInt(cStyle.paddingLeft) + parseInt(cStyle.paddingRight);
    }

    for(tbox in tboxen) {
        // Breite fuer verwendete Toolbox feststzen
        if(tboxen[tbox] == usedToolbox) {
            aios_gElem(tboxen[tbox]).style.minWidth = myWidth + "px";
            aios_gElem(tboxen[tbox]).style.maxWidth = myWidth + "px";
        }
        // Breite fuer nicht verwendete Toolbox auf 0px festsetzen => ansonsten skaliert die Toolbox mit der Sidebar-Skalierung
        else {
            aios_gElem(tboxen[tbox]).style.minWidth = "0px";
            aios_gElem(tboxen[tbox]).style.maxWidth = "0px";
        }
    }

    return true;
}


/*
    Ansichtoptionen der Toolbars (AiOS-Toolbar, Sidebarheader-Toolbar) initialisieren
        => Aufruf durch onpopupshowing-Handler der Kontextmenues in aios.xul
 */
function aios_onToolbarPopupShowing(aWhich) {
    aios_getObjects();

    var mode;

    /*
    AiOS-Toolbar
     */
    if(aWhich.id == "aios-toolbar-contextmenu") {

        // Schaltflaechen-Modus
        mode = aios_toolbar.getAttribute('mode');

        switch(mode) {
            case "full":
                document.getElementById('aios-view-mitem1').setAttribute('checked', true);
                break;
            case "icons":
                document.getElementById('aios-view-mitem2').setAttribute('checked', true);
                break;
            case "full":
                document.getElementById('aios-view-mitem3').setAttribute('checked', true);
                document.getElementById('aios-view-mitem4').setAttribute('disabled', true);
                break;
        }

        // Icongroesse
        document.getElementById('aios-view-mitem4').setAttribute('checked', aios_toolbar.getAttribute('iconsize') == "small");

        // Flexible Schaltflaechen
        document.getElementById('aios-view-mitem5').setAttribute('checked', aios_toolbar.getAttribute('flexbuttons') == "true");

        /*/ keine Konfigurationsmoeglichkeiten in Mac OS X
        if(AiOS_HELPER.os == "Darwin") {
            if(document.getElementById('aios-customize-separator'))
                document.getElementById('aios-toolbar-contextmenu').removeChild(document.getElementById('aios-customize-separator'));

            if(document.getElementById('aios-customize-mitem'))
                document.getElementById('aios-toolbar-contextmenu').removeChild(document.getElementById('aios-customize-mitem'));
        }*/
    }
    /*
    Sidebarheader-Toolbar
     */
    else if(aWhich.id == "aios-sbhtoolbar-contextmenu") {

        // Schaltflaechen-Modus => wird fuer CSS-Definitionen benoetigt
        fx_sidebarHeader.setAttribute('mode', aios_gElem("aios-sbhtoolbar").getAttribute('mode'));

        // Icongroesse
        document.getElementById('aios-sbhview-mitem4').setAttribute('checked', aios_gElem("aios-sbhtoolbar").getAttribute('iconsize') == "small");
        fx_sidebarHeader.setAttribute('iconsize', aios_gElem("aios-sbhtoolbar").getAttribute('iconsize'));

        /*/ keine Konfigurationsmoeglichkeiten in Mac OS X
        if(AiOS_HELPER.os == "Darwin") {
            if(document.getElementById('aios-sbhcustomize-separator'))
                document.getElementById('aios-sbhtoolbar-contextmenu').removeChild(document.getElementById('aios-sbhcustomize-separator'));

            if(document.getElementById('aios-sbhcustomize-mitem'))
                document.getElementById('aios-sbhtoolbar-contextmenu').removeChild(document.getElementById('aios-sbhcustomize-mitem'));
        }*/
    }
}


/*
    positioniert die AiOS- und die Sidebarheader-Toolbar
        => Aufruf durch die Menueoptionen des Kontextmenues und aios_setSidebarOrient()
        => Aufruf indirekt auch durch aios_initSidebar() => aios_setSidebarOrient() loest aios_setToolbarPos() aus
            => posMode 1 = links neben der Sidebar (vertikal)
            => posMode 2 = rechts neben der Sidebar (vertikal)
            => posMode 3 = ueber dem Sidebarheader (horizontal)
            => posMode 4 = unter dem Sidebarheader (horizontal)
            => posMode 5 = unter der Sidebar (horizontal)
 */
function aios_setToolbarPos(posMode) {
    aios_getObjects();

    var tbox, orient, button_flex, separator;

    if(!posMode) posMode = parseInt(aios_toolbar.getAttribute('posMode'));

    try {
        var sidebarOrient = AiOS_HELPER.prefBranchAiOS.getIntPref('gen.orient');
    }
    catch(e) { }

    switch(posMode) {
        case 1:
            tbox = (sidebarOrient == 1) ? "aios-toolbox-left" : "aios-toolbox-right";
            orient = "vertical";
            break;

        case 2:
            tbox = (sidebarOrient == 1) ? "aios-toolbox-right" : "aios-toolbox-left";
            orient = "vertical";
            break;

        case 3:
            tbox = "aios-toolbox-sidebartop";
            orient = "horizontal";
            break;

        case 4:
            tbox = "aios-toolbox-sidebartop2";
            orient = "horizontal";
            break;

        case 5:
            tbox = "aios-toolbox-sidebarbottom";
            orient = "horizontal";
            break;
    }

    aios_toolbar.setAttribute('posMode', posMode);
    aios_toolbar.setAttribute('orient', orient);

    document.getElementById(tbox).appendChild(aios_toolbar);

    aios_adjustToolboxWidth(false);

    document.getElementById('aios-pos-mitem' + posMode).setAttribute('checked', true);
}


/*
    stellt die Ansichtsoptionen der Symbolleisten ein
        => Aufruf durch die Menueoptionen der Symbolleisten-Kontextmenues
            => viewMode 1 = Symbole und Text
            => viewMode 2 = Symbole
            => viewMode 3 = Text
            => viewMode 4 = kleine Symbole an/aus
            => viewMode 5 = flexible Buttons an/aus
 */
function aios_setToolbarView(aViewMode, aWhich) {
    aios_getObjects();

    var viewMode = aViewMode;


    // feststellen, welche Toolbar konfiguriert werden soll
    var elem = aWhich;
    while(elem.tagName != "menupopup") {
        elem = elem.parentNode;
    }

    var tbar, menuid;

    if(elem.id == "aios-toolbar-contextmenu") {
        tbar = aios_gElem("aios-toolbar");
        menuid = "view";
    }
    else {
        tbar = aios_gElem("aios-sbhtoolbar");
        menuid = "sbhview";
    }


    // Einstellungen vornehmen
    var set_property = "mode";
    var set_value = "full";

    // Modus: Symbole & Text, Symbole, Text
    if(viewMode <= 2) {
        if(viewMode == 2) set_value = "icons";
        document.getElementById('aios-'+menuid+'-mitem4').setAttribute('disabled', false);
    }
    else if(viewMode == 3) {
        set_value = "text";
        document.getElementById('aios-'+menuid+'-mitem4').setAttribute('disabled', true);
    }

    // Icongroesse
    if(viewMode == 4) {
        set_property = "iconsize";
        set_value = (aios_getBoolean('aios-'+menuid+'-mitem4', 'checked')) ? "small" : "large";
    }

    // Flexible Buttons
    if(viewMode == 5) {
        set_property = "flexbuttons";
        set_value = (aios_getBoolean('aios-'+menuid+'-mitem5', 'checked')) ? "true" : "false";
    }

    tbar.setAttribute(set_property, set_value);


    if(tbar == aios_gElem("aios-toolbar")) aios_adjustToolboxWidth(false);
    else fx_sidebarHeader.setAttribute(set_property, set_value);
}


/*
    Aktiviert/Deaktiviert die AiOS-Toolbar
        => Aufruf durch Menueoption (Ansicht > Symbolleisten)
        => Aufruf durch aios_observeSidebar(), aios_toggleOperaMode(), aios_toggleSidebar(), aios_controlSwitch(), aios_BrowserFullScreen
 */
function aios_toggleToolbar(aWhich) {
    aios_getObjects();

    var mode = (typeof aWhich == "boolean") ? aWhich : !aios_getBoolean(aWhich, 'checked');

    aios_toolbar.hidden = mode;

    // setting (collapsed) aus aelteren Versionen (<= 0.7.8) rueckgaengig machen (war auf persist gesetzt)
    // wenn die Toolbox 'collapsed' ist (Observer der Toolbar), ist die Sidebargroesse nicht veraenderbar, wenn die Toolbar deaktiviert ist
    /*if(aios_toolbar.getAttribute('collapsed')) {
        aios_toolbar.removeAttribute('collapsed');
        document.persist(aios_toolbar.id, 'collapsed');
    }*/

    aios_adjustToolboxWidth(false);
}


/*
    fuegt dem Menue Ansicht > Symbolleisten und dem Kontextmenue der Symbolleisten eine Option hinzu
        => Aufruf durch onpopupshowing-Handler der Menues in aios.xul
 */
function aios_addToolbarMitem(aWhich) {
    aios_getObjects();

    var popup = document.getElementById('viewToolbarsMenu').firstChild;
    if(aWhich.id == "toolbar-context-menu") popup = document.getElementById('toolbar-context-menu');

    // Menuitem erzeugen
    var menuItem = document.createElement("menuitem");
    // toolbarid = TotalToolbar-Fix => ohne wird der Eintrag mehrmals angezeigt, weil das Menue nicht korrekt entleert wird
    menuItem.setAttribute("toolbarId", 'aios-toolbar');
    menuItem.setAttribute("observes", "aios-viewToolbar");
    menuItem.setAttribute("label", aios_toolbar.getAttribute('toolbarname'));

    var mitems = popup.childNodes;
    for(var i = 0; i < mitems.length; i++) {
        // TotalToolbar => unnoetige/unerwuenschte Menuitems entfernen
        if(mitems[i].tagName == "menuitem") {
            if(mitems[i].getAttribute('toolbarId') == "aios-toolbar") mitems[i].parentNode.removeChild(mitems[i]);
            if(mitems[i].getAttribute('toolbarId') == "aios-sbhtoolbar") mitems[i].parentNode.removeChild(mitems[i]);
            if(mitems[i].getAttribute('label') == menuItem.getAttribute("label")) mitems[i].parentNode.removeChild(mitems[i]);
        }

        // ersten Separator ermitteln, um gleich den Menueeintrag direkt davor einzufuegen
        if(mitems[i].tagName == "menuseparator" && !aios_context_sep) {
            var aios_context_sep = mitems[i];
        }
    }

    // AiOS-Toolbar einfuegen
    //popup.insertBefore(menuItem.cloneNode(true), popup.firstChild);
    //popup.insertBefore(menuItem.cloneNode(true), popup.lastChild.previousSibling);
    popup.insertBefore(menuItem.cloneNode(true), aios_context_sep);
}