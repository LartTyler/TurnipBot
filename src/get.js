"use strict";
exports.__esModule = true;
var express_1 = require("express");
if (!process.env.CLIENT_ID)
    throw new Error('Missing required environment variable CLIENT_ID');
var clientId = process.env.CLIENT_ID;
var botPermissions = process.env.BOT_PERMISSIONS || 2112;
var app = express_1["default"]();
app.set('port', process.env.PORT || 3000);
app.get('*', function (_, res) {
    res.redirect("https://discordapp.com/api/oauth2/authorize?client_id=" + clientId + "&scope=bot&permissions=" + botPermissions);
});
app.listen(function () {
    console.log('Application listening on http://localhost:' + app.get('port'));
});
