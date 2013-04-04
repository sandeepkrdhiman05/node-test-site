// var models = require('../model/models');

exports.newDocum =  function(req, res) {
  var doc = new gDocument();
  res.render('./documents/new.jade'
    , {  d: doc } 
  );
};
