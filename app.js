var express = require('express');
var session = require('express-session')
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var express = require('express');
var exphbs  = require('express-handlebars');
var util = require('util');
var OperationHelper = require('apac').OperationHelper;


//////////////////////////////////////
// Amazon Product API Configuration //
//////////////////////////////////////
var opHelper = new OperationHelper({
    awsId:     'AKIAJ3BXVJBC65TRDXMQ',
    awsSecret: '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',
    assocId:   'alexkarpinski-20'
});

////////////////////////////////////////////
// Passport (Facebook auth) Configuration //
////////////////////////////////////////////
passport.serializeUser(function(user, done) {
      done(null, user);
});

passport.deserializeUser(function(user, done) {
      done(null, user);
});

passport.use(new FacebookStrategy({
    //clientID: "706544599428296",
    //clientSecret: "38d9e6c58e694cf8684fe8d637e0e16a",
    clientID: "707739085975514",
    clientSecret: "06ddac484f320ef9f73c3944f9583b31",
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ facebookId: profile.id }, function(err, user) {
      if (err) { 
          return done(err);
      } 
      if (!user){
        user = new User({ facebookId: profile.id })
        user.save(function(err, user){
            return done(null, user)
        });
      }
      return done(null, user);
    });
  }
));


//////////////////
// Express meat //
//////////////////
//
var app = express();

// view engine setup
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Holy mother of middleware
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());

// Include Amazon Product helper on each request
app.use(function(req,res,next){
    req.opHelper = opHelper;
    next();
});

// Books Endpoint
require('./books')(app);
require('./user')(app);

// Ember app (homepage)
app.get('/', function(req,res){
    res.sendFile("public/ember-app/index.html", { root: __dirname });
});

app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){
    // The request will be redirected to Facebook for authentication, so this
    // function will not be called.
});

app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
});

// Bullshit below

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

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


function ensureAuthenticated(req, res, next) {
  //if (req.isAuthenticated()) { return next(); }
  return next();
  res.redirect('/login')
}

module.exports = app;
