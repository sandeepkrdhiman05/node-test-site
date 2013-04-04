 var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

 /**
    * Model: Document
    */
  Document = new Schema({
    'title'   : { type: String, index: true },
    'desc'    : String,
    'cost'    : Number,
    'image_id': String,
    'view_id' : String,
    'image'   : { title:String,name:String}
  });
  Image = new Schema({
    'imgtitle': String,
    'imgname' : String,
    'imgpath' : String,
    'imgsize' : Number,
    'imgtype' : String //'image/jpeg',
  });

exports.Document = function(db) {
  return db.model('Document',Document);
};
exports.Image = function(db) {
  return db.model('Image',Image);
};

