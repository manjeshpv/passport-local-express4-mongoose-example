var express = require('express')
	, fs = require('fs')
 	, path = require('path')
	, favicon = require('static-favicon')
	, logger = require('morgan')
	, cookieParser = require('cookie-parser')
	, bodyParser = require('body-parser')
	, methodOverride = require('method-override')
	, session = require('express-session')
	, helpers = require('view-helpers')
	, passport = require('passport')
	, LocalStrategy = require('passport-local').Strategy
	, mongoose = require('mongoose')
	, flash = require('connect-flash')
	, bcrypt = require('bcrypt-nodejs')
	
	, pkg = require('package.json')
	, mongoStore = require('connect-mongo')(session)

// if test env, load example file
var env = process.env.NODE_ENV || 'development'
  , config = require('./config/config')[env]

// Bootstrap db connection
// Connect to mongodb
var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1 } } }
  mongoose.connect(config.db, options)
}

connect()

// Error handler
mongoose.connection.on('error', function (err) {
  console.log(err)
})

// Reconnect when closed
mongoose.connection.on('disconnected', function () {
  connect()
})

// Bootstrap models
var models_path = __dirname + '/app/models'
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file)
})


require('./config/passport')(passport); // pass passport for configuration

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser('secretString'));
//express/mongo session storage
app.use(session({
  	secret: pkg.name,
  	store: new mongoStore({
          url: config.db,
          collection : 'sessions'
        })
  	
}))
app.use( function (req, res, next) {
    if ( req.method == 'POST' && req.url == '/login' ) {
    	console.log(req.body.rememberme);
	  if ( req.body.rememberme ) {
	    req.session.cookie.maxAge = 2592000000; // 30*24*60*60*1000 Rememeber 'me' for 30 days
	      } else {
	        req.session.cookie.expires = false;
	      }
	    }
	    next();
});
app.use(flash()); // use connect-flash for flash messages stored in session
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions


//routes ======================================================================
require('./app/controllers/index.js')(app, passport); // Basic routes load our routes and pass in our app and fully configured passport
//app.use('/', routes);
//app.use('/users', users);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
