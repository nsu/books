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


var mongo = require('mongodb');
var monk = require('monk');
connection_string = process.env.MONGOHQ_URL || '10.0.33.34/karp-books';
var db = monk(connection_string);
passport.serializeUser(function(user, done) {
      done(null, user);
});

passport.deserializeUser(function(user, done) {
      done(null, user);
});

passport.use(new FacebookStrategy({
    clientID: "706544599428296",
    clientSecret: "38d9e6c58e694cf8684fe8d637e0e16a",
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    collection = db.get('users');
    collection.findOne({ facebookId: profile.id }, function(err, user) {
      if (err) { 
          return done(err);
      } 
      if (!user){
        collection.insert({ facebookId: profile.id }, function(err, user){
            return done(null, user)
        });
      }
      return done(null, user);
    });
  }
));

var app = express();

// view engine setup
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());

// var routes = require('./routes/index');
// var users = require('./routes/users');
// app.use('/', routes);
// app.use('/users', users);

var router = express.Router();

app.use(function(req,res,next){
    req.db = db;
    next();
});

router.route('/').get(function(req,res){
    res.sendFile("public/ember-app/index.html", { root: __dirname });
});

router.route('/books')

    .post(function(req, res){
        var db = req.db;
        var collection = db.get('bookcollection');
        // POSTing is only allowed for creating new books
        collection.findOne({'industry_id': req.body.industry_id}, function(err, book){
            if (book){
                res.status(409).end();
            }
            collection.insert(req.body, function(err, doc){
                res.json(doc);
            });
        })
    })
    .get(function(req, res){
        var db = req.db;
        var collection = db.get('bookcollection');
        collection.find({}, function(err, books){
            if (err) {
                res.send(err);
            }

            res.json(books);
        });
    });

router.route('/books/:industry_id')

    .get(function(req, res) {
        var industry_id = req.params.industry_id;
        var db = req.db;
        var collection = db.get('bookcollection');
        collection.findOne({'industry_id': industry_id}, function(err, book) {
            if (err)
                res.send(err);
            res.json(book);
        });
    });


app.use ('/', router);

app.get('/manage', ensureAuthenticated, function(req, res){
    res.sendFile("public/ember-app/index.html", { root: __dirname });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
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
  if (req.isAuthenticated()) { return next(); }

  res.redirect('/login')
}

module.exports = app;
