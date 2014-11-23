var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var express = require('express');
var exphbs  = require('express-handlebars');
var util = require('util');
var OperationHelper = require('apac').OperationHelper;
var fs = require('fs');
var _ = require('underscore');

if (fs.existsSync('./secrets.js')) {
    var secrets = require('./secrets');
} else {
    var secrets = {
        amazon: process.env.AMAZON_SECRET,
        facebook: process.env.FACEBOOK_SECRET,
        session: process.env.SESSION_SECRET
    };
}


//////////////////////////////////////
// Amazon Product API Configuration //
//////////////////////////////////////


var opHelper = new OperationHelper({
    awsId:     "AKIAIOXRAFHXGO6DECRQ",
    awsSecret: secrets.amazon,
    assocId:   "alexkarpinski-20"
});


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
app.use(session({ secret: secrets.session}));

// Include Amazon Product helper on each request
app.use(function(req,res,next){
    req.opHelper = opHelper;
    next();
});

// Check the Origin of the request against a whitelist
// Set the CORS header accordingly
app.use(function(req, res, next) {
    whitelist = [
        "http://localhost:4200",
        "http://books.alexkarpinski.com",
        "http://alexkarp-books.s3-website-us-east-1.amazonaws.com"
    ];
    if (_.contains(whitelist, req.headers.origin)) {
        res.header("Access-Control-Allow-Origin", req.headers.origin);
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
    next();
});

//Import and configure passport
require('./auth')(app);

// Books and users API Endpoints
require('./books')(app);
require('./user')(app);

// Ember app (homepage)
app.get('/', function(req,res){
    res.sendFile("public/ember-app/index.html", { root: __dirname });
});

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
