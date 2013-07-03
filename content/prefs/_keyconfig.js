//mod by exxile
var target = aios_WIN;
if(target) {
    var gPrefService = target.aiosKeyconfig.prefService;
    var gProfile = target.aiosKeyconfig.profile;
    var gDocument = target.document;
    var gRemovedKeys = target.aiosKeyconfig.removedKeys;
}
// end mod by exxile

var gAtomService = Components.classes["@mozilla.org/atom-service;1"].getService(Components.interfaces.nsIAtomService);
var gUnicodeConverter = Components.classes['@mozilla.org/intl/scriptableunicodeconverter']
.createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
var gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
.getService(Components.interfaces.nsIClipboardHelper);
var gLocation, gKeys, gUsedKeys;

var gExtra2, keyTree, gEditbox, gEdit, gModified;

var gLocaleKeys;
var gPlatformKeys = new Object();
var gVKNames = [];
var gReverseNames;

function aios_initKeys() {
    //mod by exxile
    if(!target) return;

    if(!gPrefService.prefHasUserValue("extensions.aios.keyconf.version"))
        gPrefService.setIntPref("extensions.aios.keyconf.version","1");
    gUnicodeConverter.charset = "UTF-8";

    //mod by exxile
    //gExtra2 = document.documentElement.getButton("extra2");
    keyTree = document.getElementById("key-tree");
    gEditbox = document.getElementById("editbox");
    gEdit = document.getElementById("edit");
    gLocaleKeys = document.getElementById("localeKeys");

    var platformKeys = document.getElementById("platformKeys");
    gPlatformKeys.shift = platformKeys.getString("VK_SHIFT");
    gPlatformKeys.meta  = platformKeys.getString("VK_META");
    gPlatformKeys.alt   = platformKeys.getString("VK_ALT");
    gPlatformKeys.ctrl  = platformKeys.getString("VK_CONTROL");
    gPlatformKeys.sep   = platformKeys.getString("MODIFIER_SEPARATOR");
    switch (gPrefService.getIntPref("ui.key.accelKey")){
        case 17:  gPlatformKeys.accel = gPlatformKeys.ctrl; break;
        case 18:  gPlatformKeys.accel = gPlatformKeys.alt; break;
        case 224: gPlatformKeys.accel = gPlatformKeys.meta; break;
        default:  gPlatformKeys.accel = (window.navigator.platform.search("Mac") == 0 ? gPlatformKeys.meta : gPlatformKeys.ctrl);
    }

    for (var property in KeyEvent) {
        gVKNames[KeyEvent[property]] = property.replace("DOM_","");
    }
    gVKNames[8] = "VK_BACK";

    var isThunderbird;
    if(Components.interfaces.nsIXULAppInfo) {
        var XULAppInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
        isThunderbird = XULAppInfo.name == "Thunderbird";
    } else {
        isThunderbird = window.navigator.vendor == "Thunderbird";
    }

    gReverseNames = isThunderbird ^ gPrefService.getBoolPref("extensions.aios.keyconf.nicenames.reverse_order");

    if(gPrefService.getBoolPref("extensions.aios.keyconf.devmode")){ this.getFormattedKey = function(a,b,c) {return a+"+"+b+c;}; }

    //mod by exxile
    init(target);
}

function init(target) {
    if(!target) return;

    gDocument = target.document;
    gLocation = gDocument.location.href;

    gKeys = [];
    gRemovedKeys = target.aiosKeyconfig.removedKeys;

    //mod by exxile
    //document.title = gStrings.title + " - " + gLocation;

    var keys = gDocument.getElementsByTagName("key");

    //mod by exxile
    //for(var i = 0, l = keys.length; i < l; i++) gKeys.push(new Key(keys[i]));
    for(var i = 0, l = keys.length; i < l; i++) {
        var aiosKey = keys[i].id;
        if(aiosKey.indexOf('aiosKey') == 0) gKeys.push(new Key(keys[i]));
    }

    for(i = 0, l = gRemovedKeys.childNodes.length; i < l; i++) gKeys.push(new Key(gRemovedKeys.childNodes[i]));

    detectUsedKeys();

    var elem = keyTree.getElementsByAttribute("sortActive","true")[0];

    gKeys.sort(sorter[elem.id]);
    if(elem.getAttribute("sortDirection") == "descending") gKeys.reverse();

    keyTree.view = keyView;

    keyTree.view.selection.select(-1);
    //mod by exxile
    //gExtra2.label = gStrings.add;
    gEditbox.setAttribute("disabled","true");
    gEdit.value = "";
    gEdit.keys = ["!","",""];
}

function onOK() { //mod by exxile
    //if(gModified && gPrefService.getBoolPref("extensions.aios.keyconf.warnOnClose")) alert(gStrings.warn);
}

function getFormattedKey(modifiers,key,keycode) {
    var val = "";
    if(modifiers) val = modifiers
    .replace(/ $/,"")
    .replace(" ",",")
    .replace(",,",",")
    .replace(",",gPlatformKeys.sep)
    .replace("alt",gPlatformKeys.alt)
    .replace("shift",gPlatformKeys.shift)
    .replace("control",gPlatformKeys.ctrl)
    .replace("meta",gPlatformKeys.meta)
    .replace("accel",gPlatformKeys.accel)
        +gPlatformKeys.sep;
    if(key)
        val += key;
    if(keycode) try {
        val += gLocaleKeys.getString(keycode);
    } catch(e){val += gStrings.unrecognized.replace("$1",keycode);}

    return val;
}

function getNameForKey(aKey) {
    var val;

    if(aKey.hasAttribute("label")) return aKey.getAttribute("label");

    if(aKey.hasAttribute("command") || aKey.hasAttribute("observes")) {
        var command = aKey.getAttribute("command") || aKey.getAttribute("observes");
        var node = gDocument.getElementById(command);
        if(node && node.hasAttribute("label")) return node.getAttribute("label");
        val = getLabel("command", command);
        if(!val) val = getLabel("observes", command);
    }

    if(!val) val = getLabel("key", aKey.id);

    if(val) return val;

    var id = aKey.id.replace(/xxx_key.+?_/,"");
    try {id = gUnicodeConverter.ConvertToUnicode(id);} catch(err) { gUnicodeConverter.charset = "UTF-8"; }

    if(keyname[id]) {
        var key = gDocument.getElementById(keyname[id]);
        if(!key) key = gRemovedKeys.getElementsByAttribute("id",keyname[id])[0];
        if(key) return getNameForKey(key);
        return keyname[id];
    }

    return id;
}

function getLabel(attr, value) {
    var Users = gDocument.getElementsByAttribute(attr,value);
    var User;

    for(var i = 0, l = Users.length; i < l; i++)
        if(Users[i].hasAttribute("label") && (!User || User.localName == "menuitem")) User = Users[i];

    if(!User) return null;

    if(User.localName == "menuitem" && User.parentNode.parentNode.parentNode.localName == "menupopup") {
        if(gReverseNames) return User.parentNode.parentNode.getAttribute("label") + " > " + User.getAttribute("label");
        else return User.getAttribute("label") + " [" + User.parentNode.parentNode.getAttribute("label") + "]";
    } else return User.getAttribute("label");
}

function Recognize(event) {
    event.preventDefault();
    event.stopPropagation();

    var modifiers = [];
    if(event.altKey) modifiers.push("alt");
    if(event.ctrlKey) modifiers.push("control");
    if(event.metaKey) modifiers.push("meta");
    if(event.shiftKey) modifiers.push("shift");

    modifiers = modifiers.join(" ");

    var key = ""; var keycode = "";
    if(event.charCode) key = String.fromCharCode(event.charCode).toUpperCase();
    else { keycode = gVKNames[event.keyCode]; if(!keycode) return;}

    gEdit.value = getFormattedKey(modifiers,key,keycode);
    gEdit.keys = [modifiers,key,keycode];

    if(gPrefService.getBoolPref("extensions.aios.keyconf.warnOnDuplicate") && gEdit.value != gEdit.key.shortcut && gUsedKeys[gEdit.value])
        alert(gStrings.used.replace("$1",gUsedKeys[gEdit.value].join("\n")));

    gEdit.select();
}

function Apply() {
    var key = gKeys[keyTree.currentIndex];
    var node = key.node;

    if(key.shortcut == gEdit.value) return;

    key.shortcut = gEdit.value;
    key.pref.splice(0,3,gEdit.keys[0],gEdit.keys[1],gEdit.keys[2]);

    gModified = true;
    detectUsedKeys();

    var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
    str.data = key.pref.join("][");
    gPrefService.setComplexValue(gProfile+node.id, Components.interfaces.nsISupportsString, str);

    node.removeAttribute("modifiers"); node.removeAttribute("key"); node.removeAttribute("keycode");
    node.removeAttribute("charcode");
    node.removeAttribute("aiosKeyconfig");

    if(key.pref[0] == "!") gRemovedKeys.appendChild(node);

    if(key.pref[0] && key.pref[0] != "!") node.setAttribute("modifiers",key.pref[0]);
    if(key.pref[1]) node.setAttribute("key",key.pref[1]);
    if(key.pref[2]) node.setAttribute("keycode",key.pref[2]);

    keyTree.treeBoxObject.invalidate();
}

function Disable() {
    gEdit.value = "";
    gEdit.keys = ["!","",""];
    Apply();
}

function Reset() {
    var key = gKeys[keyTree.currentIndex];
    var node = key.node;

    try{ gPrefService.clearUserPref(gProfile+node.id); }catch(err){}

    key.pref = [];
    key.shortcut = gEdit.value = gStrings.onreset;
    gEdit.keys = ["!","",""];

    //mod by exxile
    //gExtra2.label = gStrings.add;
    node.setAttribute("aiosKeyconfig","resetted");

    gModified = true;
    detectUsedKeys();

    keyTree.treeBoxObject.invalidate();
}

function Key(aKey) {
    this.node = aKey;
    this.name = getNameForKey(aKey);
    this.shortcut = getFormattedKey(
    aKey.getAttribute("modifiers"),
    aKey.getAttribute("key").toUpperCase() || aKey.getAttribute("charcode").toUpperCase(),
    aKey.getAttribute("keycode")
);
    this.id = aKey.id;
    if(aKey.getAttribute("aiosKeyconfig") == "resetted") this.shortcut = gStrings.onreset;

    try {
        this.pref = gPrefService.getComplexValue(gProfile+aKey.id, Components.interfaces.nsISupportsString).data.split("][");
    } catch(err) { this.pref = []; }

    if(!aKey.hasAttribute("command") && !aKey.hasAttribute("oncommand")) this.hardcoded = true;
}

var sorter = {
    name: function(a,b) { return a.name.localeCompare(b.name); },
    id: function(a,b) { return a.id.localeCompare(b.id); },
    shortcut: function(a,b) {
        if(a.shortcut == b.shortcut) return 0;
        if(!a.shortcut) return 1;
        if(!b.shortcut) return -1;
        if(a.shortcut > b.shortcut) return 1;
        return -1;
    }
};

function detectUsedKeys() {
    gUsedKeys = [];

    for(var i = 0, l = gKeys.length; i < l; i++) {
        if(gUsedKeys[gKeys[i].shortcut])
            gUsedKeys[gKeys[i].shortcut].push(gKeys[i].name);
        else
            gUsedKeys[gKeys[i].shortcut]=[gKeys[i].name];
    }

    gUsedKeys[""] = gUsedKeys[gStrings.onreset] = {length: 0};
}

function openEditor() { //mod by exxile
    //openDialog('chrome://keyconfig/content/edit.xul', 'keyconfig-edit', 'resizable,modal');
}

function closeEditor(fields) {
    gModified = true;
    var key;

    if(fields.key) {
        key = fields.key;
        gPrefService.clearUserPref(gProfile+key.node.id);
    } else {
        key = {node: document.createElement("key"), shortcut: "", pref: ["!",,,";"]};
        gKeys.push(key);
        gRemovedKeys.appendChild(key.node);
        keyTree.treeBoxObject.rowCountChanged(keyTree.view.rowCount-1,1);
        keyTree.view.selection.select(keyTree.view.rowCount-1);
        keyTree.treeBoxObject.ensureRowIsVisible(keyTree.view.rowCount-1);
    }

    key.name = fields.name.value || "key"+Date.now();

    try { key.id = key.node.id = "xxx_key__" + gUnicodeConverter.ConvertFromUnicode(key.name); }
    catch(err){ gUnicodeConverter.charset = "UTF-8"; }

    fields.code.value = fields.code.value.replace("][","] [");
    key.node.setAttribute("oncommand",fields.code.value || " ");
    key.pref[3] = fields.code.value || " ";

    key.pref[4] = fields.global.checked ? "" : gLocation;

    var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
    str.data = key.pref.join("][");
    gPrefService.setComplexValue(gProfile+key.node.id, Components.interfaces.nsISupportsString, str);

    keyTree.treeBoxObject.invalidateRow(keyTree.currentIndex);
}

var keyView = {
    get rowCount() { return gKeys.length; },
    getCellText : function(row,col){ return gKeys[row][col.id || col];},
    setTree: function(treebox) { this.treebox=treebox; },
    isContainer: function() { return false; },
    isSeparator: function() { return false; },
    isSorted: function() { return false; },
    getLevel: function() { return 0; },
    getImageSrc: function() { return null; },
    getRowProperties: function() {},
    canDropBeforeAfter: function() { return false; },
    canDrop: function() { return false; },
    getParentIndex: function() { return -1; },

    getCellProperties: function(row,col,props) {
        var key = gKeys[row];
        if(key.hardcoded) props.AppendElement(gAtomService.getAtom("hardcoded"));
        if(key.pref[0] == "!") props.AppendElement(gAtomService.getAtom("disabled"));
        if(key.pref[3]) props.AppendElement(gAtomService.getAtom("custom"));
        if(key.pref.length) props.AppendElement(gAtomService.getAtom("user"));
        if((col.id || col) == "shortcut" && gUsedKeys[key.shortcut].length > 1)
            props.AppendElement(gAtomService.getAtom("duplicate"));
    },
    getColumnProperties: function(){},
    selectionChanged: function() {
        var key = gKeys[this.selection.currentIndex];

        if(!key) return;

        //mod by exxile
        //gExtra2.label = key.pref[3] ? gStrings.edit : gStrings.add;
        if(gEditbox.hasAttribute("disabled")) gEditbox.removeAttribute("disabled");
        gEdit.key = key;
        gEdit.value = key.shortcut;
    },
    cycleHeader: function cycleHeader(col, elem) {
        if(col.id) elem = col.element;

        var direction = elem.getAttribute("sortDirection") == "ascending" ? "descending" : "ascending";
        var columns = this.treebox.firstChild.childNodes;
        for(var i = 0, l = columns.length; i < l; i++) {
            columns[i].setAttribute("sortDirection","none");
            columns[i].setAttribute("sortActive",false);
        }

        elem.setAttribute("sortDirection",direction);
        elem.setAttribute("sortActive",true);

        var currentRow = gKeys[this.selection.currentIndex];

        gKeys.sort(sorter[col.id || col]);
        if(direction == "descending") gKeys.reverse();

        this.treebox.invalidate();
        if(currentRow) {
            i = -1;
            do { i++; } while(currentRow != gKeys[i]);
            this.selection.select(i);
            this.treebox.ensureRowIsVisible(i);
        }
    }
}

function switchWindow(event) {
    var mediator = Components.classes["@mozilla.org/rdf/datasource;1?name=window-mediator"].getService();
    mediator.QueryInterface(Components.interfaces.nsIWindowDataSource);

    var target = mediator.getWindowForResource(event.target.getAttribute('id'));

    if (target) init(target);
}

function copyID() {
    var key = gKeys[keyTree.currentIndex];
    if(key) gClipboardHelper.copyString(key.id);
}