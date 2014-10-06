App = Ember.Application.create();

App.Router.map(function() {
  // put your routes here
});

App.IndexRoute = Ember.Route.extend({
  model: function() {
    return ['red', 'yellow', 'blue'];
  }
});

App.ApplicationController = Ember.ArrayController.extend({
    selected_book: null,
    searchQuery: '',
    suggestions: [],

    suggestion_updater: function(){
        var self = this;
        Ember.$.getJSON('https://www.googleapis.com/books/v1/volumes?maxResults=4&q=' + this.get('searchQuery')).then(function(data){
            data = data.items.map(function(book){
                book = book.volumeInfo
                book._id = parseInt(book.industryIdentifiers[0].identifier, 10)
                console.log(book);
            });
            self.set('suggestions', data);
            self.set('selected_book', null);
        });
    },
    suggestion_debouncer: function(){
        Ember.run.debounce(this, this.suggestion_updater, 300);
    }.observes('searchQuery'),

    book_detective: function(){
        self = this;
        book = this.get('selected_book');
        $.post('books', book).done(function(data){
            $.getJSON('books/'+self.get('selected_book')._id).success(function(data){
                console.log(data);
            });
        });
    }.observes("selected_book"),

    actions: {
        select_suggestion: function(book){
            book._id = parseInt(book.volumeInfo.industryIdentifiers[0].identifier, 10);
            this.set('selected_book', book);
        }
    }

});
