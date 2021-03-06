App = Ember.Application.create();
App.Router.map(function() {
    // WARNING: This is probably bullshit.
    // Find a way to combine 1 route with multiple paths
  this.route("list", {path: "/list/:readStatus"});
  this.route("list", {path: "/list/:readStatus/:page"});
});


App.LoadingRoute = Ember.Route.extend({
    renderTemplate: function() {
        this.render('working');
    }
});


App.ListRoute = Ember.Route.extend({
    model: function(params){
        // build ajax request.
        // hidden is whether or not to show deleted books
        // pagination specified by page
        // readStatus is whether to get all books, or only read books, or only unread books
        var readStatus = params.readStatus;
        get_params = {
            hidden: false,
            page: params.page,
        };
        if (readStatus === 'read' || readStatus === 'unread') {
            get_params.readStatus = readStatus;
        }

        return $.ajax({
            type: 'GET',
            url: '/books',
            data: get_params
        }).done(function(data){
            return data;
        });
    },
    setupController: function(controller, model) {
         controller.set('model', model.items);
         // +string shorthand for converting to int
         controller.set('page_num', +model.page_num);
         controller.set('total_count', +model.total_count);
         controller.set('item_count', +model.item_count);
         if (model.read_status === undefined) {
             controller.set('read_status', 'all');
         } else {
             controller.set('read_status', model.read_status);
         }

         
         $.getJSON('/user/').done(function(data){
             controller.set('anon', false);
         }).fail(function(){
             controller.set('anon', true);
         });
    }
});

App.ListController = Ember.ArrayController.extend({
    itemController: 'book',

    next_page_num: function(){
        p_num = this.get('page_num') + 1;
        if (p_num > this.get('total_page_nums')) {
            return null;
        }
        return p_num;
    }.property('page_num', 'total_page_nums'),
    prev_page_num: function(){
        p_num = this.get('page_num') - 1;
        if (p_num < 1) {
            return null;
        }
        return p_num;
    }.property('page_num', 'total_page_nums'),

    total_page_nums: function(){
        return Math.ceil(this.get('total_count') / 5); // 5 is the numer of items per page. SUBJECT TO CHANGE                 
    }.property('total_count'),
    
});


// When a book's read/unread button is clicked
// flip the read value and PUT to the app
App.BookController = Ember.ObjectController.extend({
    linkable: function(){
        if (this.get('amazon_link')){
            return false;
        } else {
            return true;
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
        },
        hide_item: function(book){
            self = this;
            book.hidden = true;
            $.ajax({
                type: 'PUT', 
                url: 'books/'+book.industry_id,
                data: book
            }).done(function(data){
                book_list = anon = self.controllerFor('list').get('model');
                book_list.removeObject(book);
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
                    return book.volumeInfo.industryIdentifiers !== undefined;
                }).map(function(book){
                    book = book.volumeInfo;
                    // Flattening out the model to serialize more easily
                    book.industry_id = book.industryIdentifiers[0].identifier;
                    if (book.authors) {
                        book.author = book.authors[0];
                    }
                    if (book.imageLinks) {
                        book.smallThumbnail = book.imageLinks.smallThumbnail;
                        book.thumbnail = book.imageLinks.thumbnail;
                    }
                    book.suggested = false;
                    book.read = false;
                    book.hidden = false;
                    return book;
                });
                data = data.slice(0,4);
                self.set('suggestions', data);
                self.set('selected_book', null);
            });
        } else {
            self.set('suggestions', null);
            self.set('selected_book', null);
        }
    },
    suggestion_debouncer: function(){
        Ember.run.debounce(this, this.suggestion_updater, 300);
    }.observes('searchQuery'),

    actions: {
        select_suggestion: function(book){
            self = this;
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
            if (book.suggested) {return; }

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
});
