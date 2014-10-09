App = Ember.Application.create();
App.Router.map(function() {
  this.route("manage");
});

App.ManageRoute = Ember.Route.extend({
    model: function(){
        return $.getJSON('/books/').success(function(data){
            return data;
        });
    },
    setupController: function(controller, model) {
        controller.set('model', model);
        $.getJSON('/user/').done(function(data){
            controller.set('anon', false);
        }).fail(function(){
            controller.set('anon', true);
        });
    }

});

App.ManageController = Ember.ArrayController.extend({
    itemController: 'book',
    anon: true
});


// When a book's read/unread button is clicked
// flip the read value and PUT to the app
App.BookController = Ember.ObjectController.extend({
    linkable: function(){
        if (this.get('amazon_link')){
            return false
        } else {
            return true
        }
    }.property('amazon_link'),
    actions: {
        toggle_read: function(book) {
            self = this;
            this.set('read', !book.read);
            $.ajax({
                type: 'PUT', 
                url: 'books/'+book.industry_id,
                data: book
            }).done(function(data){
                self.setProperties(data);
            }).fail(function(){
                self.set('read', !book.read);
            });
        }
   }
});

App.IndexController = Ember.ArrayController.extend({
    selected_book: null,
    searchQuery: '',
    suggestions: [],

    suggestion_updater: function(){
        var self = this;
        if (this.get('searchQuery')) {
            Ember.$.getJSON('https://www.googleapis.com/books/v1/volumes?maxResults=6&q=' + this.get('searchQuery')).then(function(data){
                data = data.items.filter(function(book){
                    return book.volumeInfo.industryIdentifiers !== undefined
                }).map(function(book){
                    var book = book.volumeInfo;
                    // Flattening out the model to serialize more easily
                    book.industry_id = book.industryIdentifiers[0].identifier;
                    if (book.authors) {
                        book.author = book.authors[0];
                    }
                    if (book.imageLinks) {
                        book.smallThumbnail = book.imageLinks.smallThumbnail;
                        book.thumbnail = book.imageLinks.thumbnail;
                    }
                    book.suggested = null;
                    book.read = null;
                    return book;
                });
                data = data.slice(0,4);
                self.set('suggestions', data);
                self.set('selected_book', null);
            });
        }
    },
    suggestion_debouncer: function(){
        Ember.run.debounce(this, this.suggestion_updater, 300);
    }.observes('searchQuery'),

    //book_detective: function(){
    //    self = this;
    //    book = this.get('selected_book');
    //    if (!book) { return}
    //    //$.post('books', book).done(function(data){
    //    //});
    //}.observes("selected_book"),

    actions: {
        select_suggestion: function(book){
            self = this
            $.getJSON('books/'+book.industry_id).success(function(data){
                if (data) {
                    self.set('selected_book', data);
                } else {
                    self.set('selected_book', book);
                }
            });
        },
        clear_selection: function(){
            this.set('selected_book', null);
        },
        suggest_book: function(){
            self = this;
            var book = this.get('selected_book');
            if (book.suggested) {return }

            book.suggested = true;
            $.post('books', book).done(function(data){
                self.set('selected_book', data);
            });
        }
    }

});

Ember.Handlebars.helper('truncate', function(length, text) {
    if (text && text.length > length) {
        return text.substr(0,length) + '. . .';
    }
    return text;
})
