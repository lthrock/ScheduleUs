'use strict';
var users = require("../users.json");

exports.view = function(req, res){
	var startTime = req.query.start;
	var endTime = req.query.end;

	// var userData = $.grep(users["users"], function (item) {
	//     return item.email == req.app.get("current_user");
	// });
	var currUser;
	for (var user in users["users"]) {
		// console.log(users["users"][user]);
		if (users["users"][user].email == req.app.get("current_user")) {
			currUser = user;
		}
	}
	// console.log(currUser);
	if (startTime)
		users["users"][user].dayStart = startTime;
	if (endTime)
		users["users"][user].dayEnd = endTime;
  	res.render('preferences', { 'startTime': users["users"][user].dayStart, 'endTime': users["users"][user].dayEnd });
};
