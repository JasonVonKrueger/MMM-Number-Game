
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


 
};

function handlePlayClick(e) {
    document.querySelector('.landing').classList.add('hidden');
    document.querySelector('.numpad').classList.remove('hidden');

    Remote.sendSocketNotification("RENUMBER_CLIENT_CONNECTED");
}

function handleNumPadButton(e) {
    const number = this.innerHTML;
    console.log(number);

    Remote.sendSocketNotification('NUMPAD_BUTTON_CLICK', {
        number: number
    });
}

document.querySelector('.play-button').addEventListener('click', handlePlayClick, false);

document.querySelectorAll('.numpad-button').forEach(function(btn) {
    btn.addEventListener('touch', handleNumPadButton, false);
    btn.addEventListener('click', handleNumPadButton, false);
});
