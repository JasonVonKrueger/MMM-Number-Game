const NodeHelper = require("node_helper");
const express = require("express");
const path = require("path");

module.exports = NodeHelper.create({
	start: function() {
        this.started = false;

        fs.readFile(path.resolve(__dirname + "/renumber.html"), function(err, data) {
            self.template = data.toString();
        });
	},

    createRoutes: function() {
        var self = this;

        this.expressApp.get("/renumber.html", function(req, res) {
            if (self.template === "") {
                res.send(503);
            } else {
                res.contentType("text/html");
                res.set('Content-Security-Policy', "frame-ancestors http://*:*")
                var transformedData = self.fillTemplates(self.template);
                res.send(transformedData);
            }
        });

        this.expressApp.get("/get", function(req, res) {
            var query = url.parse(req.url, true).query;

            self.answerGet(query, res);
        });

        this.expressApp.post("/post", function(req, res) {
            var query = url.parse(req.url, true).query;

            self.answerPost(query, req, res);
        });
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === 'RENUMBER_STARTED' && this.started == false) {     
            const self = this;

            this.started = true;
        };
      }
});