var OperationHelper = require('apac').OperationHelper;
var fs = require('fs');

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

opHelper.execute('ItemSearch', {
    'SearchIndex': 'KindleStore',
    'Title': "Mortality",
    'Author': 'Christopher Hitchens'
}, function(err, results) { 
    if (err || results.ItemSearchResponse.Items[0].Item == undefined) { return }
    result = results.ItemSearchResponse.Items[0].Item[0];
    ASIN = result.ASIN[0];
    amazon_link = result.DetailPageURL[0];
    console.log(amazon_link);
});
