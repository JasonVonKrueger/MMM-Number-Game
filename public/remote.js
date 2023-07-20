
var Remote = {
    name: "MMM-Renumber",

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
        console.log('got a socket notification');

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

function handlePlayClick(e) {
    document.querySelector('.landing').classList.add('hidden');
    document.querySelector('.numpad').classList.remove('hidden');
}

// Initialize socket connection
console.log('init remote');
Remote.sendSocketNotification("REMOTE_CLIENT_CONNECTED");
Remote.sendSocketNotification("REMOTE_ACTION", { data: "translations" });

document.querySelector('.play-button').addEventListener('click', handlePlayClick, false);
