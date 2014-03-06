
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
var CLIENT_LIVE_ID2 = "93833969413-idt149ca9sjocseohqogtitb0farh6uu.apps.googleusercontent.com";
var CLIENT_LIVE_SECRET2 = "D-1uASu0vQptel2oJoSl2rrm";
var REDIRECT_LIVE_URL2 = "http://scheduleusv2.herokuapp.com/oauth2callback";
// var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
var oauth2Client = new OAuth2Client(CLIENT_LIVE_ID, CLIENT_LIVE_SECRET, REDIRECT_LIVE_URL);
// var oauth2Client = new OAuth2Client(CLIENT_LIVE_ID2, CLIENT_LIVE_SECRET2, REDIRECT_LIVE_URL2);
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
  // console.log(req.session.tokens);
  if (req.session.tokens == null)
		logged_in = false;
	data = {
		"calendar_auth_url": calendar_auth_url,
		"logged_in": logged_in
	}
  if (!logged_in) {
  	res.render('index', data);
  } else {
    events.viewEvents(req, res);
  }
});

// app.get('/view', events.viewEvents);
app.get('/view', function(req, res) {
  if (req.session.tokens == null) {
    data = {
      "calendar_auth_url": calendar_auth_url,
      "logged_in": false
    }
    res.render('index', data);
  } else {
  // res.render('viewEvents');
    // req.session.drawers = true;
    events.viewEvents(req, res);
  }
});

// app.get('/view/tabs', function(req, res) {
//   if (req.session.tokens == null) {
//     data = {
//       "calendar_auth_url": calendar_auth_url,
//       "logged_in": false
//     }
//     res.render('index', data);
//   } else {
//   // res.render('viewEvents');
//     req.session.drawers = false;
//     events.viewEvents(req, res);
//   }
// });

app.get('/create', function(req, res) {
  if (req.session.tokens == null) {
    data = {
      "calendar_auth_url": calendar_auth_url,
      "logged_in": false
    }
    res.render('index', data);
  } else {
    events.createEvent(req, res);
  }
});
app.get('/settings', function(req, res) {
  if (req.session.tokens == null) {
    data = {
      "calendar_auth_url": calendar_auth_url,
      "logged_in": false
    }
    res.render('index', data);
  } else {
    settings.view(req, res);
  }
});
app.get('/add', function(req, res) {
  if (req.session.tokens == null) {
    data = {
      "calendar_auth_url": calendar_auth_url,
      "logged_in": false
    }
    res.render('index', data);
  } else {
    events.addEvent(req, res);
  }
});
app.get('/edit/:id', events.editEvent);
app.get('/delete/:id', events.deleteEvent);
app.get('/save/:id', events.saveEvent);
// app.get('/add', events.addEvent);
app.get('/confirm/:id', events.confirmEvent);
app.get('/reject/:id', events.rejectEvent);
app.get('/schedule/:id', events.scheduleEvent);
app.get('/selectTime/:id/:start/:end/:day', events.selectTime);

var myClient;
var users = require("./users.json");

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
           "historicEvents": [],
           "dayStart": "10:00",
           "dayEnd": "22:00",
           "tokens": req.session.tokens
        };
        var calendar = {'summary': 'ScheduleUs Calendar'};
        myClient.calendar.calendars.insert(calendar).
          withAuthClient(oauth2Client).execute(function(err, results) {
            console.log("Errors are ", err);
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
         /*   today = new Date();
            var nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate()+7);
            var eventBody = {
              "end": {"date": nextWeek.yyyymmdd()},
              "start": {"date": today.yyyymmdd()},
              "attendees": [{"email": "yungodtre@gmail.com"}]
            }
            myClient.calendar.events.insert({'calendarId': results.id, 'sendNotifications': true}, eventBody).
    withAuthClient(oauth2Client).execute(function(err, results) {
      console.log(results);
      console.log("err is ", err);
    });*/
            /*  var currCalendar = {calendarId: newUser.email}
            myClient.calendar.events.list(currCalendar).withAuthClient(oauth2Client).execute(function(err, results) {
              console.log("Errors are ", err);
              console.log("Results are ", results);
              res.render('index', data);
            }); */
            if (!logged_in) {
              res.render('index', data);
            } else {
              events.viewEvents(req, res);
            }
            // console.log("currUser is " + currUser);
          });
      } else {
        data = {
          "calendar_auth_url": calendar_auth_url,
          "logged_in": true
        }
        req.session.current_user_id = currUser;
        users["users"][currUser].tokens = req.session.tokens;
        if (users["users"][currUser].calendarID == undefined || users["users"][currUser].calendarID == -1) {
          var calendar = {'summary': 'ScheduleUs Calendar'};
          myClient.calendar.calendars.insert(calendar).
            withAuthClient(oauth2Client).execute(function(err, results) {
            users["users"][currUser].calendarID = results.id;
            console.log("The new calendar is ", results.id);
            // req.session.calendar_id = results.id;
                
            // res.render('index', data);
            events.viewEvents(req, res);
          });
        } else {
          // res.render('index', data);
          events.viewEvents(req, res);
        }
        // console.log("currUser is " + currUser);
      }
    });
    
    myClient.calendar.calendarList.list().withAuthClient(oauth2Client).execute(function(err, results){
      // console.log(results);
    });
  };
});

// app.get('/project', project.viewProject);
// app.get('/project/:name', project.viewProject);
// Example route
// app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

Date.prototype.yyyymmdd = function() {                                         
    var yyyy = this.getFullYear().toString();                                    
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based         
    var dd  = this.getDate().toString();             
                            
    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
};  
