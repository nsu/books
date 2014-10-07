var util = require('util');
var OperationHelper = require('apac').OperationHelper;

var opHelper = new OperationHelper({
    awsId:     'AKIAJ3BXVJBC65TRDXMQ',
    awsSecret: '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',
    assocId:   'alexkarpinski-20'
});


// execute(operation, params, callback)
// operation: select from http://docs.aws.amazon.com/AWSECommerceService/latest/DG/SummaryofA2SOperations.html
// params: parameters for operation (optional)
// callback(err, parsed, raw): callback function handling results. err = potential errors raised from xml2js.parseString() or http.request(). parsed = xml2js parsed response. raw = raw xml response.

opHelper.execute('ItemLookup', {
  'SearchIndex': 'Books',
  'ItemId': '9780743273565',
  'IdType': 'EAN'
}, function(err, results) { // you can add a third parameter for the raw xml response, "results" here are currently parsed using xml2js
    console.log(JSON.stringify(results, null, 4));
    // console.log(results.ItemLookupResponse.Items[0].Item[0].ItemLinks[0].ItemLink.URL);
});
