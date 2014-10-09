module.exports = function(app) {
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var secrets = require('./secrets')

app.use(passport.initialize());
app.use(passport.session());

////////////////////////////////////////////
// Passport (Facebook auth) Configuration //
////////////////////////////////////////////
passport.serializeUser(function(user, done) {
      done(null, user);
});

passport.deserializeUser(function(user, done) {
      done(null, user);
});

passport.use(new FacebookStrategy({
    //clientID: "706544599428296",
    //clientSecret: "38d9e6c58e694cf8684fe8d637e0e16a",
    clientID: "707739085975514",
    clientSecret: secrets.facebook,
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({ facebookId: profile.id }, function(err, user) {
      if (err) { 
          return done(err);
      } 
      if (!user){
        user = new User({ facebookId: profile.id })
        user.save(function(err, user){
            return done(null, user)
        });
      }
      return done(null, user);
    });
  }
));

app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){
    // The request will be redirected to Facebook for authentication, so this
    // function will not be called.
});

app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
});


}
