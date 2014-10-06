var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongo = require('mongodb');
var monk = require('monk');
connection_string = process.env.MONGOHQ_URL || '10.0.33.34/karp-books';
var db = monk(connection_string);


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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
        console.log(req.body);
        collection.insert(req.body, function(err, doc){
            res.json(doc);
        });
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


module.exports = app;
