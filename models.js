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
    industry_id:    {type: [String], index: true}, 
    ASIN:           String,
    amazon_link:    String,
    read:           Boolean,
    title:          String,
    author:         String,
    hidden:         {type: [Boolean], index: true},
}, {strict: false})
var Book = mongoose.model('Book', bookSchema);

module.exports = {Book: Book, User: User}

