module.exports = function(app) {
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
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


console.log(process.env.AUTH_URL || "http://localhost:3000/auth/facebook/callback")
passport.use(new FacebookStrategy({
    clientID: "707739085975514",
    clientSecret: secrets.facebook,
    callbackURL: process.env.AUTH_URL || "http://localhost:3000/auth/facebook/callback"
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
