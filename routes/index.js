var express = require('express');
var path = require("path");
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    var db = req.db;
    var collection = db.get('bookcollection');
    collection.insert({'foo':'bar'});
    collection.findOne({'_id': '543105508a15190000c87bfd'}).on('success', function(doc){
        console.log(doc);
    });
    res.sendFile("public/ember-app/index.html", { root: path.join(__dirname, '..') });
});

module.exports = router;
