module.exports = function(app) {

// will all get aliased under /books router
var express = require('express');
Book = require('./models').Book;
router = express.Router()

router.route('/')

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
                    if (err || results.ItemLookupResponse.Items[0].Item == undefined) { return }
                    result = results.ItemLookupResponse.Items[0].Item[0];
                    doc.ASIN = result.ASIN[0];
                    doc.amazon_link = result.DetailPageURL[0];
                    doc.save(function(err, doc){console.log(doc.ASIN)})
                });
            });  
        });
    })
    .get(function(req, res){
        var page_num = req.query.page || 1;
        var items_per_page = 5;
        var skip = page_num * items_per_page;
        Book.find({}).sort('-_id').skip(skip).limit(items_per_page).exec(function(err, books){
            if (err) {
                res.send(err);
            }

            res.json(books);
        });
    });

router.route('/:industry_id')

    .get(function(req, res) {
        var industry_id = req.params.industry_id;
        Book.findOne({'industry_id': industry_id}, function(err, book) {
            if (err)
                res.send(err);
            res.json(book);
        });
    })
    .put(function(req, res){
        if (!req.user || !req.user.facebookId === "10152371097391581") { return res.status(403).end(); }
        var industry_id = req.params.industry_id;
        // strip off the _id field. Mongoose doesn't allow updates with that included
        delete req.body._id;
        Book.findOneAndUpdate({'industry_id': industry_id}, req.body, function(err, book){
            if (err) {
                res.send(err);
            }
            res.json(book);
        });
    });

    app.use('/books', router);

} // close module export
