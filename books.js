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
                    if (err) { return }
                    if (results.ItemLookupResponse.Items[0].Item == undefined) {
                        req.opHelper.execute('ItemSearch', {
                            'SearchIndex': 'KindleStore',
                            'Title': doc.title,
                            'Author': doc.author
                        }, function(err, results) { 
                            if (err || results.ItemSearchResponse.Items[0].Item == undefined) { return }
                            result = results.ItemSearchResponse.Items[0].Item[0];
                            doc.ASIN = result.ASIN[0];
                            doc.amazon_link = result.DetailPageURL[0];
                            doc.save(function(err, doc){console.log(doc.ASIN)})
                        });
                    } else {
                        result = results.ItemLookupResponse.Items[0].Item[0];
                        doc.ASIN = result.ASIN[0];
                        doc.amazon_link = result.DetailPageURL[0];
                        doc.save(function(err, doc){console.log(doc.ASIN)})
                    }
                });
            });  
        });
    })
    .get(function(req, res){
        var page_num = req.query.page || 1;
        var items_per_page = 5;
        var skip = (page_num-1) * items_per_page;
        var query_params = {};
        if (req.query.hidden) {
            query_params.hidden = req.query.hidden;
        }
        Book.find(query_params).sort('-_id')
        .skip(skip).limit(items_per_page)
        .exec(function(err, books){
            if (err) {
                res.send(err);
            }
            return_doc = {
                items:          books,
                item_count:     books.length,
                page_num:       page_num
            }
            Book.count({hidden: false}, function(err, count){
                return_doc['total_count'] = count;
                res.json(return_doc);
            });
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
        var _id = req.body._id;
        // strip off the _id field. Mongoose doesn't allow updates with that included
        delete req.body._id;
        Book.findOneAndUpdate({'_id': _id}, req.body, function(err, book){
            if (err) {
                res.send(err);
            }
            res.json(book);
        });
    });

    app.use('/books', router);

} // close module export
