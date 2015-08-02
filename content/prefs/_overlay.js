
if(!window.extLoad) var extLoad = {
    loaders: [],
    add: function(index,func){
        this.loaders.push([index,func]);
    },
    init: function() {
        extLoad.loaders.sort(function(a,b){
            return a[0]-b[0];
        });
        for(var loader in extLoad.loaders) if(extLoad.loaders[loader][1]) extLoad.loaders[loader][1]();
        extLoad.loaders = null;
    }
};

window.addEventListener("load", extLoad.init, false);

var aiosKeyconfig = {
    prefService: Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch(null),
    removedKeys: document.createElement("keyset"),
    loadkeys: function(name){
        this.profile = "extensions.aios.keyconf." + name + ".";

        var nodes = document.getElementsByTagName("key");
        for(var i = 0; i < nodes.length; i++) if(!nodes[i].id)
            nodes[i].id = "xxx_key"+i+"_"+nodes[i].getAttribute("command")+nodes[i].getAttribute("oncommand");

        this.keys = this.prefService.getChildList(this.profile, {});

        for(i = 0; i < this.keys.length; i++) {
            var key;
            try{
                key = this.prefService.getCharPref(this.keys[i]).split("][");
            }catch(e){
                continue;
            }
            /* mod by eXXile
            if(key[3] && (!key[4] || key[4] == document.location)) {
                var nKey = document.getElementsByTagName("keyset")[0].appendChild(document.createElement("key"));
                nKey.id=this.keys[i].split(this.profile)[1];
                nKey.setAttribute("on//command",key[3]);
            }
            */
            var node = document.getElementById(this.keys[i].split(this.profile)[1]);
            if(!node) continue;

            node.removeAttribute("modifiers");
            node.removeAttribute("key");
            node.removeAttribute("keycode");
            if(key[0] == "!") {
                this.removedKeys.appendChild(node);
                continue;
            }

            if(key[0]) node.setAttribute("modifiers",key[0]);
            if(key[1]) node.setAttribute("key",key[1]);
            if(key[2]) node.setAttribute("keycode",key[2]);
        }
    }
};
