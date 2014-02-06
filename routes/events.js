exports.createEvent = function(req, res){
  res.render('createEvent');
};

exports.viewEvents = function(req, res){
  res.render('viewEvents');
};

exports.editEvent = function(req, res){
  res.render('editEvent');
};