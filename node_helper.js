const NodeHelper = require("node_helper");
//const express = require("express");
//const path = require("path");

module.exports = NodeHelper.create({
	start: function() {

	},

    createRoutes: function() {
        var self = this;
    },

    socketNotificationReceived: function(notification, payload) {
        var self = this;
        self.sendSocketNotification(notification, payload);
        console.log('socket notification received');
       // Log.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
        // if (notification === 'RENUMBER_STARTED' && this.started == false) {     
        //     const self = this;

        //     this.started = true;
        // };
    }
});