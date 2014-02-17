
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
// var oauth2Client = new OAuth2Client(CLIENT_LIVE_ID, CLIENT_LIVE_SECRET, REDIRECT_LIVE_URL);
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
  if (req.session.tokens == null)
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
app.get('/confirm/:id', events.confirmEvent);
app.get('/schedule/:id', events.scheduleEvent);
app.get('/selectTime/:id', events.selectTime);

var myClient;

googleapis
  .discover('calendar', 'v3')
  .discover('oauth2', 'v2')
  .execute(function(err, client){
    if(!err) {
      app.set('cal', client.calendar);
      app.set('oauth', client.oauth2);
      app.set('oauth2Client', oauth2Client);
      app.set('client', client);
  	}
  });

// CAN WE CHANGE THIS TO POST? without getting a redirect_uri_mismatch
app.get('/oauth2callback', function(req, res) {
  var code = req.query.code;
  req.session.oauth2Client = oauth2Client;
  // console.log("ARE THE SAME ", req.session.oauth2Client == oauth2Client);
  req.session.oauth2Client.getToken(code, function(err, tokens) {
  	req.session.oauth2Client.credentials = tokens;
    req.session.tokens = tokens;
  	getData();
  });
  
  // DO SHIT LIKE THIS FOR EVERY GOOGLE API
  var getData = function() {
    var myClient = app.get('client');
    myClient.oauth2.userinfo.get().withAuthClient(oauth2Client).execute(function(err, results){
      req.session.current_user = results['email'];
      req.session.current_user_name = results['name'];
      if (!('oauth' in exports)) {
        exports.oauth2 = {};
      }
      var currUser;
      exports.oauth2[results['email']] = oauth2Client;
      for (var user in users["users"]) {
        if (users["users"][user].email == results['email']) {
          currUser = user;
          users["users"][user].name = results['name'];
        }
      }
      // console.log(results.email, " ", currUser)
      if (!currUser) {
        var newUser = {
           "name": results['name'],
           "email": results['email'],
           "calendarID": -1,
           "calendar": [],
           "eventsToSchedule": [],
           "eventsAwaitingConfirmation": [],
           "pendingEvents": [],
           "invites": [],
           "dayStart": "10:00",
           "dayEnd": "22:00"
        };
        var calendar = {'summary': 'ScheduleUs Calendar'};
        myClient.calendar.calendars.insert(calendar).
          withAuthClient(oauth2Client).execute(function(err, results) {
            // console.log("RESULTS.ID ", results.id)
            req.session.calendar_id = results.id;
            // console.log("req.session.calendar_id ", req.session.calendar_id);
            exports.calendar_id = req.session.calendar_id;
            newUser.calendarID = results.id
            users["users"].push(newUser);
            var currUser = users["users"].indexOf(newUser);

            req.session.current_user_id = currUser;
                
            var logged_in = true;
            if (req.session.tokens == null)
              logged_in = false;
            data = {
              "calendar_auth_url": calendar_auth_url,
              "logged_in": logged_in
            }
            /*  var currCalendar = {calendarId: newUser.email}
            myClient.calendar.events.list(currCalendar).withAuthClient(oauth2Client).execute(function(err, results) {
              console.log("Errors are ", err);
              console.log("Results are ", results);
              res.render('index', data);
            }); */
            res.render('index', data);
          });
      } else {
        data = {
          "calendar_auth_url": calendar_auth_url,
          "logged_in": true
        }
        res.render('index', data);
      }
    });
    
    myClient.calendar.calendarList.list().withAuthClient(oauth2Client).execute(function(err, results){
      // console.log(results);
    });
  };
});

var users = require("./users.json");


// app.get('/project', project.viewProject);
// app.get('/project/:name', project.viewProject);
// Example route
// app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
