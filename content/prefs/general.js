
/*
    Liste der zur Verfuegung stehenden Sidebars erstellen
        => Aufruf durch aios_initPane()
*/
function aios_genSidebarList() {

    if(!document.getElementById('sidebarInitPopup') || !document.getElementById('panelInitPopup')) return false;

    var strings = document.getElementById("aiosStrings");
    //if(!confirm(strings.getString('prefs.confirm'))) return false;

    var sidebarInit = document.getElementById('sidebarInitPopup');
    var panelInit = document.getElementById('panelInitPopup');
    var allSidebars = aios_WIN.document.getElementsByAttribute('group', 'sidebar');

    var cnt = 0;
    var initID = null;
    var sidebarPrefInit = "";
    var panelPrefInit = "";
    try {
        sidebarPrefInit = aios_gPrefBranch.getCharPref("gen.init");
        panelPrefInit = aios_gPrefBranch.getCharPref("gen.open.init");
    } catch(e) { }

    for(var i = 0; i < allSidebars.length; i++) {
        var xulElem = null;

        // muss eine ID haben, darf keinen observer haben (Menueeintraege usw.) und muss eine Sidebar-URL haben
        if(allSidebars[i].id && !allSidebars[i].getAttribute('observes') && allSidebars[i].getAttribute('sidebarurl')) {

            var separator = document.createElement("menuseparator");
            if(cnt == 0) {
                sidebarInit.appendChild(separator);
                panelInit.appendChild(separator.cloneNode(true));
            }

            if(allSidebars[i].id != "extensionsEMbSidebar" && allSidebars[i].id != "themesEMbSidebar") {
                xulElem = document.createElement("menuitem");
                xulElem.setAttribute('label', strings.getString('prefs.openpanel') + " " + allSidebars[i].getAttribute('label'));
                xulElem.setAttribute('value', allSidebars[i].id);

                if(allSidebars[i].getAttribute('tooltiptext'))
                    xulElem.setAttribute('tooltiptext', allSidebars[i].getAttribute('tooltiptext'));

                sidebarInit.appendChild(xulElem);
                panelInit.appendChild(xulElem.cloneNode(true));
            }

            cnt++;
        }
    }

    sidebarInit.parentNode.value = sidebarPrefInit;
    panelInit.parentNode.value = panelPrefInit;
    return true;
}


/*
    Werte der aktuellen Sidebarbreite einsetzen
        => Aufruf durch oncommand() der drei <toolbarbutton>
*/
function aios_setWidthVal(mode) {
    var browserWidth = aios_getBrowserWidth();
    var widthSidebar = browserWidth[0];
    var widthContent = browserWidth[1] + browserWidth[2];
    var compWidth = browserWidth[3];

    var percent = parseInt(Math.round((widthSidebar * 100) / compWidth));
    var theUnit = document.getElementById('obj-' + mode + 'WidthUnit').value;

    if(theUnit == "px") {
        document.getElementById('obj-' + mode + 'WidthVal').value = widthSidebar;
        document.getElementById(mode + 'WidthVal').value = widthSidebar;
    }
    else if(theUnit == "%") {
        document.getElementById('obj-' + mode + 'WidthVal').value = percent;
        document.getElementById(mode + 'WidthVal').value = percent;
    }
}


/*
    Breitenangaben bei Aenderung der Masseinheit umrechnen und ausgeben
        => Aufruf durch ValueChange-Listener, initiert in aios_initPrefs()
*/
function aios_changeWidthUnit(mode) {
    var elem = document.getElementById('obj-' + mode + 'WidthVal');
    var elemPref = document.getElementById(mode + 'WidthVal');
    var theUnit = document.getElementById('obj-' + mode + 'WidthUnit').value;

    var browserWidth = aios_getBrowserWidth();
    var compWidth = browserWidth[3];

    if(theUnit == "px") elem.value = parseInt((parseInt(elem.value) * compWidth) / 100);
    else elem.value = parseInt((parseInt(elem.value) * 100) / compWidth);

    // preference auch aendern, da sonst der neue Wert des Textfeldes nicht gespeichert wird
    elemPref.value = elem.value;

    // Kontrolle
    aios_checkWidthVal(mode);
}


/*
    Angaben zur Sidebarbreite pruefen
        => Aufruf durch onBlur() der drei Textfelder, aios_changeWidthUnit(), aios_setConfSidebarWidth()
*/
function aios_checkWidthVal(mode) {
    var elem = document.getElementById('obj-' + mode + 'WidthVal');
    var theUnit = document.getElementById('obj-' + mode + 'WidthUnit').value;

    elem.value = parseInt(elem.value);

    // Kontrolle
    if(mode == "max") {
        if(theUnit == "px" && elem.value < 100) elem.value = 100;
        else if(theUnit == "%" && elem.value < 10) elem.value = 10;
    }
}


/*
    stellt die Groesse der Sidebar ein
        => Aufruf durch aios_savePrefs() in prefs.js und aios_initSidebar() in aios.js
*/
function aios_setConfSidebarWidth() {
    var elem, theUnit, theValue;
    var widthStyle = "";
    var modes = new Array('min', 'def', 'max');

    var browserWidth = aios_getBrowserWidth();
    var compWidth = browserWidth[3];

    for(var i = 0; i < modes.length; i++) {

        // Aufruf aus dem Options-Dialog => die Eingabefelder als Werte verwenden
        if(document.getElementById('obj-minWidthVal')) {
            elem = document.getElementById('obj-' + modes[i] + 'WidthVal');
            theValue = elem.value;
            theUnit = document.getElementById('obj-' + modes[i] + 'WidthUnit').value;

            // Kontrolle
            aios_checkWidthVal(modes[i]);
        }
        // Aufruf durch aios_initSidebar() => die abgespeicherten Werte verwenden
        else {
            elem = aios_gPrefBranch.getIntPref("gen.width." + modes[i] + "Val");
            theValue = elem;
            theUnit = aios_gPrefBranch.getCharPref("gen.width." + modes[i] + "Unit");
        }

        // Prozente in Px umrechnen (Angaben in % funktionieren hier nicht??)
        if(theUnit == "%") theValue = parseInt((compWidth * theValue) / 100);

        switch(modes[i]) {
            case "min":
                widthStyle+= 'min-width: ' + theValue + 'px !important; ';
                break;
            case "def":
                widthStyle+= 'width: ' + theValue + 'px !important; ';
                break;
            case "max":
                widthStyle+= 'max-width: ' + theValue + 'px !important; ';
                break;
        }
    }

    aios_WIN.document.getElementById('sidebar').setAttribute('style', widthStyle);
    aios_WIN.document.persist('sidebar', 'style');
}