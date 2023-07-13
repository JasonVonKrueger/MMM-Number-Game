const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
	start: function() {
        this.started = false;
	},

    socketNotificationReceived: function(notification, payload) {
        if (notification === 'RENUMBER_STARTED' && this.started == false) {     
            const self = this;

            this.started = true;
        };
      }
});