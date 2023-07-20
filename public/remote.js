
var Remote = {
    name: "MMM-Renumber",
    currentMenu: "main-menu",
    types: ["string", "number", "boolean", "array", "object", "null", "undefined"],
    values: ["", 0.0, true, [], {}, null, undefined],
    validPositions: [
        "",
        "top_bar", "top_left", "top_center", "top_right",
        "upper_third",
        "middle_center",
        "lower_third",
        "bottom_left", "bottom_center", "bottom_right", "bottom_bar",
        "fullscreen_above",
        "fullscreen_below"
    ],
    savedData: {},
    translations: {},
    currentConfig: {},
    addModule: "",
    changedModules: [],
    deletedModules: [],
    autoHideTimer: undefined,
    autoHideDelay: 1000, // ms

    /* socket()
     * Returns a socket object. If it doesn"t exist, it"s created.
     * It also registers the notification callback.
     */
    socket: function() {
        if (typeof this._socket === "undefined") {
            this._socket = this._socket = new MMSocket(this.name);
        }

        var self = this;
        this._socket.setNotificationCallback(function(notification, payload) {
            self.socketNotificationReceived(notification, payload);
        });

        return this._socket;
    },

    /* sendSocketNotification(notification, payload)
     * Send a socket notification to the node helper.
     *
     * argument notification string - The identifier of the notification.
     * argument payload mixed - The payload of the notification.
     */
    sendSocketNotification: function(notification, payload) {
        this.socket().sendNotification(notification, payload);
    },

    /* socketNotificationReceived(notification, payload)
     * This method is called when a socket notification arrives.
     *
     * argument notification string - The identifier of the notification.
     * argument payload mixed - The payload of the notification.
     */
    socketNotificationReceived: function(notification, payload) {
        if (notification === "REMOTE_ACTION_RESULT") {
            // console.log("Result received:", JSON.stringify(payload, undefined, 4));
            if ("action" in payload && payload.action === "INSTALL") {
                this.installCallback(payload);
                return;
            }
            if ("data" in payload) {
                if (payload.query.data === "config_update") {
                    this.saveConfigCallback(payload);
                } else if (payload.query.data === "saves") {
                	this.undoConfigMenuCallback(payload)
                } else if (payload.query.data === "mmUpdateAvailable") {
                    this.mmUpdateCallback(payload.result);
                } else if (payload.query.data === "brightness") {
                    var slider = document.getElementById("brightness-slider");
                    slider.value = payload.result;
                } else if (payload.query.data === "translations") {
                    this.translations = payload.data;
                    this.onTranslationsLoaded();
                } else {
                    this.loadListCallback(payload);
                }
                return;
            }
            if ("code" in payload && payload.code === "restart") {
            	var chlog = new showdown.Converter()
            	chlog.setFlavor('github')
                this.offerRestart(payload.chlog ? payload.info + "<br><div id='changelog'>" + chlog.makeHtml(payload.chlog) + "</div>": payload.info);
                return;
            }
            if ("success" in payload) {
                if (!("status" in payload)) { payload.status = (payload.success) ? "success" : "error"; }
                let message = (payload.status === "error") ? this.translate("RESPONSE_ERROR") +
                    ": <br><pre><code>" + JSON.stringify(payload, undefined, 3) + "</code></pre>" : payload.info;
                this.setStatus(payload.status, message);
                return;
            }
        }
        if (notification === "REFRESH") {
            setTimeout(function() { document.location.reload(); }, 2000);
            return;
        }
        if (notification === "RESTART") {
            setTimeout(function() {
                document.location.reload();
                console.log('Delayed REFRESH');
            }, 62000);
            return;
        }
        if (notification === "REMOTE_CLIENT_CUSTOM_MENU") {
            this.customMenu = payload;
            this.createDynamicMenu(this.customMenu);
            return;
        }
        if (notification === "REMOTE_CLIENT_MODULEAPI_MENU") {
            this.moduleApiMenu = payload;
            this.createDynamicMenu(this.moduleApiMenu);
            return;
        }
    },


    hide: function(element) {
        if (!this.hasClass(element, "hidden")) {
            element.className += " hidden";
        }
    },

    show: function(element) {
        if (this.hasClass(element, "hidden")) {
            element.className = element.className.replace(/ ?hidden/, "");
        }
    },


    closePopup: function() {
        $("#popup-container").hide();
        $("#popup-contents").empty();
    },

    showPopup: function() {
        $("#popup-container").show();
    },



    loadOtherElements: function() {
        var self = this;

        var slider = document.getElementById("brightness-slider");
        slider.addEventListener("change", function(event) {
            self.sendSocketNotification("REMOTE_ACTION", { action: "BRIGHTNESS", value: slider.value });
        }, false);

        var input = document.getElementById("add-module-search");
        var deleteButton = document.getElementById("delete-search-input");

        input.addEventListener("input", function(event) {
            self.filter(input.value);
            if (input.value === "") {
                deleteButton.style.display = "none";
            } else {
                deleteButton.style.display = "";
            }
        }, false);

        deleteButton.addEventListener("click", function(event) {
            input.value = "";
            self.filter(input.value);
            deleteButton.style.display = "none";
        }, false);

        console.log("loadOtherElements loaded");
    },

    showMenu: function(newMenu) {
        var self = this;
        if (this.currentMenu === "settings-menu") {
            // check for unsaved changes
            var changes = this.deletedModules.length + this.changedModules.length;
            if (changes > 0) {
                var wrapper = document.createElement("div");
                var text = document.createElement("span");
                text.innerHTML = this.translate("UNSAVED_CHANGES");
                wrapper.appendChild(text);

                var ok = self.createSymbolText("fa fa-check-circle", this.translate("OK"), function() {
                    self.setStatus("none");
                });
                wrapper.appendChild(ok);

                var discard = self.createSymbolText("fa fa-warning", this.translate("DISCARD"), function() {
                    self.deletedModules = [];
                    self.changedModules = [];
                    window.location.hash = newMenu;
                });
                wrapper.appendChild(discard);

                this.setStatus(false, false, wrapper);

                this.skipHashChange = true;
                window.location.hash = this.currentMenu;

                return;
            }
        }

        var belowFold = document.getElementById("below-fold");
        if (newMenu === "main-menu") {
            if (!this.hasClass(belowFold, "hide-border")) {
                belowFold.className += " hide-border";
            }
        } else {
            if (this.hasClass(belowFold, "hide-border")) {
                belowFold.className = belowFold.className.replace(" hide-border", "");
            }
        }
        if (newMenu === "add-module-menu") {
            this.loadModulesToAdd();
        }
        if (newMenu === "edit-menu") {
            this.loadVisibleModules();
            this.loadBrightness();
        }
        if (newMenu === "settings-menu") {
            this.loadConfigModules();
        }
        if (newMenu === "classes-menu") {
            this.loadClasses();
        }
        if (newMenu === "update-menu") {
            this.loadModulesToUpdate();
        }
        
        if (newMenu === "main-menu") {
        	this.loadList("config-modules", "config", function(parent,configData) {
                
        		let alertElem = document.getElementById("alert-button")
        		if(!configData.modules.find(m=>m.module==="alert") && alertElem !== undefined) alertElem.remove();
                
                let modConfig = configData.modules.find(m=>m.module==="MMM-Remote-Control").config
                let classElem = document.getElementById("classes-button")
                if((!modConfig || !modConfig.classes) && classElem !== undefined) classElem.remove();
                
        	})
        }
        
        var allMenus = document.getElementsByClassName("menu-element");

        for (let i = 0; i < allMenus.length; i++) {
            this.hide(allMenus[i]);
        }

        var currentMenu = document.getElementsByClassName(newMenu);

        for (let i = 0; i < currentMenu.length; i++) {
            this.show(currentMenu[i]);
        }

        this.setStatus("none");

        this.currentMenu = newMenu;
    },

    setStatus: function(status, message, customContent) {
        var self = this;

        if (this.autoHideTimer !== undefined) {
            clearTimeout(this.autoHideTimer);
        }

        // Simple status update
        if (status === "success" && !message && !customContent) {
            $("#success-popup").show();
            this.autoHideTimer = setTimeout(function() { $("#success-popup").hide(); }, this.autoHideDelay);
            return;
        }

        var parent = document.getElementById("result-contents");
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }

        if (status === "none") {
            this.hide(document.getElementById("result-overlay"));
            this.hide(document.getElementById("result"));
            return;
        }

        if (customContent) {
            parent.appendChild(customContent);
            this.show(document.getElementById("result-overlay"));
            this.show(document.getElementById("result"));
            return;
        }

        var symbol;
        var text;
        var close = true;
        if (status === "loading") {
            symbol = "fa-spinner fa-pulse";
            text = this.translate("LOADING");
            onClick = false;
        }
        if (status === "error") {
            symbol = "fa-exclamation-circle";
            text = this.translate("ERROR");
            onClick = false;
        }
        if (status === "success") {
            symbol = "fa-check-circle";
            text = this.translate("DONE");
            onClick = function() {
                self.setStatus("none");
            };
            this.autoHideTimer = setTimeout(function() {
                self.setStatus("none");
            }, this.autoHideDelay);
        }
        if (message) {
            text = (typeof message === "object") ? JSON.stringify(message, undefined, 3) : message;
        }
        parent.appendChild(this.createSymbolText("fa fa-fw " + symbol, text, onClick));

        this.show(document.getElementById("result-overlay"));
        this.show(document.getElementById("result"));
    },



    showModule: function(id, force) {
        if (force) {
            this.sendSocketNotification("REMOTE_ACTION", { action: "SHOW", force: true, module: id });
        } else {
            this.sendSocketNotification("REMOTE_ACTION", { action: "SHOW", module: id });
        }
    },

    hideModule: function(id) {
        this.sendSocketNotification("REMOTE_ACTION", { action: "HIDE", module: id });
    },

 

    get: function(route, params, callback, timeout) {
        var req = new XMLHttpRequest();
        var url = route + "?" + params;
        req.open("GET", url, true);

        if (timeout) {
            req.timeout = timeout; // time in milliseconds
        }

        //Send the proper header information along with the request
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        req.onreadystatechange = function() {
            if (req.readyState == 4 && req.status == 200) {
                if (callback) {
                    callback(req.responseText);
                }
            }
        };
        req.send(null);
    },

    loadList: function(listname, dataId, callback) {
        var self = this;

        var loadingIndicator = document.getElementById(listname + "-loading");
        var parent = document.getElementById(listname + "-results");

        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
        self.show(loadingIndicator);
        if (callback) { self.pendingCallback = callback; }
        self.sendSocketNotification("REMOTE_ACTION", { data: dataId, listname: listname });
    },

    loadListCallback: function(result) {
        var self = this;

        var loadingIndicator = document.getElementById(result.query.listname + "-loading");
        var emptyIndicator = document.getElementById(result.query.listname + "-empty");
        var parent = document.getElementById(result.query.listname + "-results");

        self.hide(loadingIndicator);
        self.savedData[result.query.data] = false;

        try {
            if (result.data.length === 0) {
                self.show(emptyIndicator);
            } else {
                self.hide(emptyIndicator);
            }
            self.savedData[result.query.data] = result.data;
            if (self.pendingCallback) {
                self.pendingCallback(parent, result.data);
                delete self.pendingCallback;
            }
        } catch (e) {
            self.show(emptyIndicator);
        }
    },


    createConfigElement: function(type) {
        var self = this;

        return {
            string: function(key, name, value, type, forcedType) {
                var label = self.createConfigLabel(key, name, type, forcedType);
                var input = self.createConfigInput(key, value);
                input.type = "text";
                label.appendChild(input);
                if (key === "<root>/header") {
                    input.placeholder = self.translate("NO_HEADER");
                }
                return label;
            },
            number: function(key, name, value, type, forcedType) {
                var label = self.createConfigLabel(key, name, type, forcedType);
                var input = self.createConfigInput(key, value);
                input.type = "number";
                if (value % 1 !== 0) {
                    input.step = 0.01;
                }
                label.appendChild(input);
                return label;
            },
            boolean: function(key, name, value, type, forcedType) {
                var label = self.createConfigLabel(key, name, type, forcedType);

                var input = self.createConfigInput(key, value, true);
                input.type = "checkbox";
                label.appendChild(input);
                console.log(value);
                if (value) {
                    input.checked = true;
                    console.log(input.checked);
                }

                self.createVisualCheckbox(key, label, input, "fa-check-square-o", false);
                self.createVisualCheckbox(key, label, input, "fa-square-o", true);
                return label;
            },
            undefined: function(key, name, value, type, forcedType) {
                var label = self.createConfigLabel(key, name, type, forcedType);
                var input = self.createConfigInput(key, value);
                input.type = "text";
                input.disabled = "disabled";
                input.className += " disabled undefined";
                input.placeholder = "undefined";
                label.appendChild(input);
                return label;
            },
            null: function(key, name, value, type, forcedType) {
                var label = self.createConfigLabel(key, name, type, forcedType);
                var input = self.createConfigInput(key, value);
                input.type = "text";
                input.disabled = "disabled";
                input.className += " disabled null";
                input.placeholder = "null";
                label.appendChild(input);
                return label;
            },
            position: function(key, name, value, type, forcedType) {
                var label = self.createConfigLabel(key, name, type, forcedType);
                var select = self.createConfigInput(key, value, false, "select");
                select.className = "config-input";
                select.id = key;
                for (var i = 0; i < self.validPositions.length; i++) {
                    var option = document.createElement("option");
                    option.value = self.validPositions[i];
                    if (self.validPositions[i]) {
                        option.innerHTML = self.formatPosition(self.validPositions[i]);
                    } else {
                        option.innerHTML = self.translate("NO_POSITION");
                    }
                    if (self.validPositions[i] === value) {
                        option.selected = "selected";
                    }
                    select.appendChild(option);
                }
                label.appendChild(select);
                return label;
            }
        } [type];
    },




    createObjectGUI: function(path, name, dataToEdit) {
        var self = this;

        var type = this.getTypeAsString(dataToEdit, path);
        var forcedType = this.hasForcedType(path);
        if (this.createConfigElement(type)) {
            // recursion stop
            return this.createConfigElement(type)(path, name, dataToEdit, type, forcedType);
        }

        // object and array
        var wrapper = document.createElement("div");
        wrapper.id = path;
        wrapper.className = "indent config-input " + type;
        if (type === "array") {
            // array
            var add = this.createSymbolText("fa fa-fw fa-plus", this.translate("ADD_ENTRY"));
            add.className += " bottom-spacing button";
            wrapper.appendChild(this.createConfigLabel(path, name, type, forcedType, "fa-list-ol"));
            wrapper.appendChild(add);
            for (var i = 0; i < dataToEdit.length; i++) {
                var newName = "#" + i;
                wrapper.appendChild(this.createObjectGUI(path + "/" + newName, newName, dataToEdit[i]));
            }
            add.addEventListener("click", function() {
                var lastIndex = dataToEdit.length - 1;
                var lastType = self.getTypeAsString(path + "/#" + lastIndex, dataToEdit[lastIndex]);
                dataToEdit.push(self.values[self.types.indexOf(lastType)]);
                var nextName = "#" + (lastIndex + 1);
                wrapper.appendChild(self.createObjectGUI(path + "/" + nextName, nextName, dataToEdit[dataToEdit.length - 1]));
            }, false);
            return wrapper;
        }

        // object
        if (path !== "<root>") {
            wrapper.appendChild(this.createConfigLabel(path, name, type, forcedType, "fa-list-ul"));

            var addElement = self.createConfigLabel(path + "/<add>", this.translate("ADD_ENTRY"), type, true, "fa-plus");
            addElement.className += " bottom-spacing";
            var inputWrapper = document.createElement("div");
            inputWrapper.className = "add-input-wrapper";
            var input = self.createConfigInput(path + "/<add>", "");
            input.type = "text";
            input.placeholder = this.translate("NEW_ENTRY_NAME");
            addElement.appendChild(inputWrapper);
            inputWrapper.appendChild(input);
            var addFunction = function() {
                var existingKey = Object.keys(dataToEdit)[0];
                var lastType = self.getTypeAsString(path + "/" + existingKey, dataToEdit[existingKey]);
                var key = input.value;
                if (key === "" || document.getElementById(path + "/" + key)) {
                    if (!self.hasClass(input, "input-error")) {
                        input.className += " input-error";
                    }
                    return;
                }
                input.className = input.className.replace(" input-error", "");
                dataToEdit[key] = self.values[self.types.indexOf(lastType)];
                var newElement = self.createObjectGUI(path + "/" + key, key, dataToEdit[key]);
                wrapper.insertBefore(newElement, addElement.nextSibling);
                input.value = "";
            };
            var symbol = document.createElement("span");
            symbol.className = "fa fa-fw fa-plus-square button";
            symbol.addEventListener("click", addFunction, false);
            inputWrapper.appendChild(symbol);
            input.onkeypress = function(e) {
                if (!e) e = window.event;
                var keyCode = e.keyCode || e.which;
                if (keyCode == "13") {
                    addFunction();
                }
            };
            wrapper.appendChild(addElement);
        }
        var keys = Object.keys(dataToEdit);
        if (path === "<root>") {
            keys = ["module", "disabled", "position", "header", "config"];
        }
        for (let i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (dataToEdit.hasOwnProperty(key)) {
                wrapper.appendChild(this.createObjectGUI(path + "/" + key, key, dataToEdit[key]));
            }
        }
        if (path === "<root>") {
            // additional css classes on root element
            wrapper.className = "flex-fill small";
        }
        return wrapper;
    },


    updateModule: function(module) {
        this.sendSocketNotification("REMOTE_ACTION", { action: "UPDATE", module: module });
    },

    mmUpdateCallback: function(result) {
        if (window.location.hash.substring(1) == "update-menu") {
            var element = document.getElementById("update-mm-status");
            var updateButton = document.getElementById("update-mm-button");
            if (result) {
                self.show(element);
                updateButton.className += " bright";
            } else {
                self.hide(element);
                updateButton.className = updateButton.className.replace(" bright", "");
            }
        }
    },

 
};

var buttons = {
    // navigation buttons
    "power-button": function() {
        window.location.hash = "power-menu";
    },
    "edit-button": function() {
        window.location.hash = "edit-menu";
    },
    "settings-button": function() {
        var self = Remote;

        var wrapper = document.createElement("div");
        var text = document.createElement("span");
        text.innerHTML = self.translate("EXPERIMENTAL");
        wrapper.appendChild(text);

        var panic = self.createSymbolText("fa fa-life-ring", self.translate("PANIC"), function() {
            self.setStatus("none");
        });
        wrapper.appendChild(panic);

        var danger = self.createSymbolText("fa fa-warning", self.translate("NO_RISK_NO_FUN"), function() {
            window.location.hash = "settings-menu";
        });
        wrapper.appendChild(danger);

        self.setStatus(false, false, wrapper);
    },
    "mirror-link-button": function() {
        window.open("/", "_blank");
    },
    "classes-button": function() {
    	window.location.hash = "classes-menu";
    },
    "back-button": function() {
        if (window.location.hash === "#add-module-menu") {
            window.location.hash = "settings-menu";
            return;
        }
        if ($(window.location.hash.replace("-menu", "-button")).data("parent")) {
            window.location.hash = $(window.location.hash.replace("-menu", "-button")).data("parent") + "-menu";
            return;
        }
        window.location.hash = "main-menu";
    },
    "update-button": function() {
        window.location.hash = "update-menu";
    },
    "alert-button": function() {
        window.location.hash = "alert-menu";
    },

    // settings menu buttons
    "brightness-reset": function() {
        var element = document.getElementById("brightness-slider");
        element.value = 100;
        Remote.sendSocketNotification("REMOTE_ACTION", { action: "BRIGHTNESS", value: 100 });
    },

    // edit menu buttons
    "show-all-button": function() {
        var parent = document.getElementById("visible-modules-results");
        var buttons = parent.children;
        for (var i = 0; i < buttons.length; i++) {
            if (Remote.hasClass(buttons[i], "external-locked")) {
                continue;
            }
            buttons[i].className = buttons[i].className.replace("toggled-off", "toggled-on");
            Remote.showModule(buttons[i].id);
        }
    },
    "hide-all-button": function() {
        var parent = document.getElementById("visible-modules-results");
        var buttons = parent.children;
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].className = buttons[i].className.replace("toggled-on", "toggled-off");
            Remote.hideModule(buttons[i].id);
        }
    },

    // power menu buttons
    "shut-down-button": function() {
        var self = Remote;

        var wrapper = document.createElement("div");
        var text = document.createElement("span");
        text.innerHTML = self.translate("CONFIRM_SHUTDOWN");
        wrapper.appendChild(text);

        var ok = self.createSymbolText("fa fa-power-off", self.translate("SHUTDOWN"), function() {
            Remote.sendSocketNotification("REMOTE_ACTION", { action: "SHUTDOWN" });
        });
        wrapper.appendChild(ok);

        var cancel = self.createSymbolText("fa fa-times", self.translate("CANCEL"), function() {
            self.setStatus("none");
        });
        wrapper.appendChild(cancel);

        self.setStatus(false, false, wrapper);
    },
    "restart-button": function() {
        var self = Remote;

        var wrapper = document.createElement("div");
        var text = document.createElement("span");
        text.innerHTML = self.translate("CONFIRM_RESTART");
        wrapper.appendChild(text);

        var ok = self.createSymbolText("fa fa-refresh", self.translate("RESTART"), function() {
            Remote.sendSocketNotification("REMOTE_ACTION", { action: "REBOOT" });
        });
        wrapper.appendChild(ok);

        var cancel = self.createSymbolText("fa fa-times", self.translate("CANCEL"), function() {
            self.setStatus("none");
        });
        wrapper.appendChild(cancel);

        self.setStatus(false, false, wrapper);
    },
    "restart-mm-button": function() {
        Remote.sendSocketNotification("REMOTE_ACTION", { action: "RESTART" });
        setTimeout(function() {
            document.location.reload();
            console.log("Delayed REFRESH");
        }, 60000);
    },
    "monitor-on-button": function() {
        Remote.sendSocketNotification("REMOTE_ACTION", { action: "MONITORON" });
    },
    "monitor-off-button": function() {
        Remote.sendSocketNotification("REMOTE_ACTION", { action: "MONITOROFF" });
    },
    "refresh-mm-button": function() {
        Remote.sendSocketNotification("REMOTE_ACTION", { action: "REFRESH" });
    },
    "fullscreen-button": function() {
        Remote.sendSocketNotification("REMOTE_ACTION", { action: "TOGGLEFULLSCREEN" });
    },
    "minimize-button": function() {
        Remote.sendSocketNotification("REMOTE_ACTION", { action: "MINIMIZE" });
    },
    "devtools-button": function() {
        Remote.sendSocketNotification("REMOTE_ACTION", { action: "DEVTOOLS" });
    },

    // config menu buttons
    "add-module": function() {
        window.location.hash = "add-module-menu";
    },
    "save-config": function() {
        Remote.saveConfig();
    },

    "undo-config": function() {
        Remote.undoConfigMenu();
    },
    // main menu
    "save-button": function() {
        Remote.sendSocketNotification("REMOTE_ACTION", { action: "SAVE" });
    },
    "close-popup": function() {
        Remote.closePopup();
    },
    "close-result": function() {
        Remote.setStatus("none");
    },

    // update Menu
    "update-mm-button": function() {
        Remote.updateModule(undefined);
    },

};

// Initialize socket connection
Remote.sendSocketNotification("REMOTE_CLIENT_CONNECTED");
Remote.sendSocketNotification("REMOTE_ACTION", { data: "translations" });
Remote.loadButtons(buttons);
Remote.loadOtherElements();

Remote.setStatus("none");

if (window.location.hash) {
    Remote.showMenu(window.location.hash.substring(1));
} else {
    Remote.showMenu("main-menu");
}

window.onhashchange = function() {
    if (Remote.skipHashChange) {
        Remote.skipHashChange = false;
        return;
    }
    if (window.location.hash) {
        Remote.showMenu(window.location.hash.substring(1));
    } else {
        Remote.showMenu("main-menu");
    }
};

// loading successful, remove error message
var loadError = document.getElementById("load-error");
loadError.parentNode.removeChild(loadError);