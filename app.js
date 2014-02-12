
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var handlebars = require('express3-handlebars')

var index = require('./routes/index');
var events = require('./routes/events');
var settings = require('./routes/settings');

// var project = require('./routes/project');
// Example route
// var user = require('./routes/user');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('Intro HCI secret key'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Add routes here
app.get('/', index.view);

// TODO: This needs to get moved to index.js - it needs to save the body data somehow
app.post('/', function(req, res) {
	var chunk = '';
	req.on('data', function(data) {
      console.log("Received body data:");
      chunk += data;
    });
    req.on('end', function() {
      console.log("OK " + chunk);
      res.send({'profile': 'wtf', 'people': 'wtf2'})
    });
});
app.get('/view', events.viewEvents);
app.get('/create', events.createEvent);
app.get('/settings', settings.view);
app.get('/edit', events.editEvent);
app.get('/add', events.addEvent);
// app.get('/project', project.viewProject);
// app.get('/project/:name', project.viewProject);
// Example route
// app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
