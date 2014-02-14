'use strict';
var users = require("../users.json");

exports.view = function(req, res){
	var startTime = req.query.start;
	var endTime = req.query.end;

	for (var user in users["users"]) {
		// console.log(users["users"][user]);
		if (users["users"][user].email == req.session.current_user) {
			var currUser = user;
		}
	}
	
	if (startTime)
		users["users"][currUser].dayStart = startTime;
	if (endTime)
		users["users"][currUser].dayEnd = endTime;
  	res.render('preferences', { 'startTime': users["users"][currUser].dayStart, 'endTime': users["users"][currUser].dayEnd });
};
