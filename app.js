
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var handlebars = require('express3-handlebars')
var googleapis = require('googleapis');
var OAuth2Client = googleapis.OAuth2Client;
var gcal = require('google-calendar');

// var index = require('./routes/index');
var events = require('./routes/events');
var settings = require('./routes/settings');

var CLIENT_ID = "93833969413-qi1rveqpc52ut179c40dbdeba5a19k9q.apps.googleusercontent.com";
var CLIENT_SECRET = "_m1_ZRsGUeo-fb2AMdkltmv8";
var REDIRECT_URL = "http://localhost:3000/oauth2callback";
var CLIENT_LIVE_ID = "93833969413-j9ovm1ca49fg3g0u7bfqeb8vdu106njj.apps.googleusercontent.com";
var CLIENT_LIVE_SECRET = "1XOvmIp8M627Fc3cpaaMymS0";
var REDIRECT_LIVE_URL = "http://scheduleus.herokuapp.com/oauth2callback";
var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
var calendar_auth_url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/calendar'
});

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
//app.get('/', index.view);
app.get('/', function(req, res) {
	var logged_in = true;
	if (app.get('tokens') == null)
		logged_in = false;
	data = {
		"calendar_auth_url": calendar_auth_url,
		"logged_in": logged_in
	}
	res.render('index', data);
});

app.get('/view', events.viewEvents);
app.get('/create', events.createEvent);
app.get('/settings', settings.view);
app.get('/edit', events.editEvent);
app.get('/add', events.addEvent);
app.get('/readyToSchedule', events.scheduleList);
app.get('/invitations', events.invitations);

var myClient;

  var callback = function(clients) {
  	myClient = clients;
  	console.log(clients);
  }

googleapis
  .discover('calendar', 'v3')
  .discover('oauth2', 'v2')
  .execute(function(err, client){
    if(!err) {
      app.set('client', client);
      // callback(client);
  	}
  });

// CAN WE CHANGE THIS TO POST? without getting a redirect_uri_mismatch
app.get('/oauth2callback', function(req, res) {
  var code = req.query.code;
  oauth2Client.getToken(code, function(err, tokens) {
  	oauth2Client.credentials = tokens;
  	getData();
  	app.set('tokens', tokens);
  	  	
  	var logged_in = true;
	if (app.get('tokens') == null)
		logged_in = false;
	data = {
		"calendar_auth_url": calendar_auth_url,
		"logged_in": logged_in
	}
	res.render('index', data);
  });
});

var users = require("./users.json");

// DO SHIT LIKE THIS FOR EVERY GOOGLE API
var getData = function() {
	var myClient = app.get('client');
  myClient.oauth2.userinfo.get().withAuthClient(oauth2Client).execute(function(err, results){
       console.log(results);
       app.set('current_user', results['email']);
       var newUser = {
          "name": results['name'],
          "email": results['email'],
          "calendar": [
            
          ],
          "eventsToSchedule": [

          ],
          "eventsAwaitingConfirmation": [
            
          ],
          "pendingEvents": [

          ],
          "invites": [

          ],

          "dayStart": "10:00",
          "dayEnd": "22:00"
      };
      users["users"].push(newUser);
  });
  myClient.calendar.calendarList.list().withAuthClient(oauth2Client).execute(function(err, results){
    // console.log(results);
  });
};

// app.get('/project', project.viewProject);
// app.get('/project/:name', project.viewProject);
// Example route
// app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
