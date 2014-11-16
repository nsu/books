module.exports = function(app) {

// will all get aliased under /books router
var express = require('express');
User = require('./models').User;
router = express.Router();

router.route('/').get(function(req, res) {
    if (!req.user || !req.user.facebookId === "10152371097391581") { return res.status(403).end(); }
    res.json(req.user);
});

app.use('/user', router);

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

};
