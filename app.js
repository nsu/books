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

////////////////////////////////////////
// MongoDB and Mongoose configuration //
////////////////////////////////////////
var mongo = require('mongodb');
var mongoose = require('mongoose');
connection_string = process.env.MONGOHQ_URL || '10.0.33.34/karp-books';
var db = mongoose.connect(connection_string);

var userSchema = new mongoose.Schema({
    facebookId: String
})
var User = mongoose.model('User', userSchema);

var bookSchema = new mongoose.Schema({
    industry_id:    String,
    ASIN:           String,
    amazon_link:    String,
    read:           Boolean,
    suggested:      Boolean
}, {strict: false})
var Book = mongoose.model('Book', bookSchema);


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
    clientID: "706544599428296",
    clientSecret: "38d9e6c58e694cf8684fe8d637e0e16a",
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

var router = express.Router();

router.route('/').get(function(req,res){
    res.sendFile("public/ember-app/index.html", { root: __dirname });
});

router.route('/books')

    .post(function(req, res){
        // POSTing is only allowed for creating new books
        Book.findOne({'industry_id': req.body.industry_id}, function(err, book){
            if (book){
                return res.status(409).end();
            }
            book = new Book(req.body)
            book.save(function(err, doc){
                if (err) {
                    res.send(err);
                }
                res.json(doc);
                req.opHelper.execute('ItemLookup', {
                    'SearchIndex': 'Books',
                    'ItemId': doc.industry_id,
                    'IdType': 'ISBN'
                }, function(err, results) { 
                    if (err) { return }
                    result = results.ItemLookupResponse.Items[0].Item[0]
                    doc.ASIN = result.ASIN[0];
                    doc.amazon_link = result.DetailPageURL[0];
                    doc.save(function(err, doc){console.log(doc.ASIN)})
                });
            });  
        });
    })
    .get(function(req, res){
        Book.find({}, function(err, books){
            if (err) {
                res.send(err);
            }

            res.json(books);
        });
    });

router.route('/books/:industry_id')

    .get(function(req, res) {
        var industry_id = req.params.industry_id;
        Book.findOne({'industry_id': industry_id}, function(err, book) {
            if (err)
                res.send(err);
            res.json(book);
        });
    })
    .put(function(req, res){
        //if (!req.user || !req.user.facebookId === "10152371097391581") { return res.status(403).end(); }
        var industry_id = req.params.industry_id;
        // strip off the _id field. Mongoose doesn't allow updates with that included
        delete req.body._id;
        Book.findOneAndUpdate({'industry_id': industry_id}, req.body, function(err, book){
            if (err) {
                console.log(err);
                res.send(err);
            }
            res.json(book);
        });
    });

router.route('/user/').get(function(req, res) {
    if (!req.user || !req.user.facebookId === "10152371097391581") { return res.status(403).end(); }
    res.json(req.user);
});

app.use ('/', router);

//app.get('/manage', ensureAuthenticated, function(req, res){
//    res.sendFile("public/ember-app/manage.html", { root: __dirname });
//});

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
  //if (req.isAuthenticated()) { return next(); }
  return next();
  res.redirect('/login')
}

module.exports = app;
