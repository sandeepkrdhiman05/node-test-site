
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , mview = require('./routes/view')
  , admin = require('./routes/admin')
  , new_doc = require('./routes/new_doc')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , mmongoose = require('mongoose')
  , mDocument
  , mImage
  , models = require('./model/models')
  , util = require('util').format;
//  , formidable = require('formidable')


var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
//  app.use(express.favicon());
  app.use(express.logger('dev'));
//  app.use(express.bodyParser());
    app.use(express.bodyParser({
      uploadDir: './temp',
      keepExtensions: true
    }));
    app.use(express.limit('5mb'));
  
  app.use(express.methodOverride());
  app.use(app.router);
//  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.static(__dirname+'/public'));
});                                            

app.configure('development', function(){
  app.use(express.errorHandler());
});

/* MongoDB */
if(process.env.VCAP_SERVICES){
    var env = JSON.parse(process.env.VCAP_SERVICES);
    var mongo = env['mongodb-1.8'][0]['credentials'];
}
else{
    var mongo = {
        "hostname":"localhost",
        "port":27017,
        "username":"",
        "password":"",
        "name":"",
        "db":"db"
    }
}

var generate_mongo_url = function(obj){
    obj.hostname = (obj.hostname || 'localhost');
    obj.port = (obj.port || 27017);
    obj.db = (obj.db || 'test');
    if(obj.username && obj.password){
        return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
    else{
        return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
}

mongourl = generate_mongo_url(mongo);
db=mmongoose.createConnection(mongourl);

app.Document = gDocument = require('./model/models.js').Document(db);
app.Image = gImage = require('./model/models.js').Image(db);


app.get('/', routes.index);

app.get('/users', user.list);
app.get('/view/:id', mview.one);

app.get('/images' , function(req, res) {
   gImage.find(function (err, docums) {
      if (err) {// TODO handle err
       console.log('error: images list empty or bad!');
      }else{
        docums.forEach(function(record){
           console.log('images_:'+record.imgtitle);
        });
        res.render('images/images.jade', { doc:docums });
      }
   });
});

app.get('/images/upload', function(req, res){
    res.writeHead(200, {'content-type': 'text/html','charset':'utf-8'});
    res.end(
      '<form action="/images/upload"  accept-charset="utf-8" enctype="multipart/form-data" method="post">'+
      '<input type="text" name="title" placeholder="description"><br>'+
      '<input type="file" name="upload" multiple="multiple"><br>'+
      '<input type="submit" value="Upload">'+
      '</form>'
    );
});

app.post('/images/upload', function(req, res){
    console.log('req.files.upload.path='+req.files.upload.path);
    console.log('req.files.upload.name='+req.files.upload.name);
    /* write in bd */

    var d = new gImage();

    var fileMeta = req.files['upload'];
/*
//    var re = new RegExp('\\s.jpg');//^([a-zA-Z\d_-]+)\.html$
    var rePattern =new RegExp(/\\upload\\\w.+$/); //new RegExp(/^\\(.+\\)*(.+)\.(.+)$/);
    var str=fileMeta.path;
    var arrMatches = str.match(rePattern);
    console.log('arrMatches='+arrMatches+' str='+str || '');
*/

// get the temporary location of the file
    var tmp_path = '.\\'+req.files.upload.path;
    var tmp_name = req.files.upload.name;
console.log('title='+tmp_name);
    // set where the file should actually exists - in this case it is in the "images" directory
   var target_path = '.\\public\\images\\upload\\' + tmp_name; //req.files.thumbnail.name;
console.log('tmp_path='+tmp_path+' target_path='+target_path);

    // move the file from the temporary location to the intended location
    fs.rename(tmp_path, target_path, function(err) {
        if (err) throw err;
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function() {
            if (err) throw err;

        });
    });

/*
//While retriving show that path in this method
fs.readFile(target_path, "binary", function(error, file) {
    if(error) {
      res.writeHead(500, {"Content-Type": "text/plain"});
      res.write(error + "\n");
      res.end();
    } else {

      res.writeHead(200, {"Content-Type": "image/png"});
      res.write(file, "binary");

    }
});
*/
    d.imgtitle = req.body.title;
    d.imgname = tmp_name;
    d.imgpath = target_path;
    d.imgsize = fileMeta.size;
    d.imgtype = fileMeta.type;
    console.log('d='+d);

  d.save(function (err){
    if (err) {
      console.log(err);
    }                  
    console.log('Save');
  });

  res.redirect('/images');

});

// read image
app.get('/images/:id', function(req, res, next) {
   console.log('id='+req.params.id);

   gImage.findById(req.params.id,function(err,docum){
   console.log('image='+docum);
   if (err){
     res.redirect('/images');
   } // return next(new NotFound('Document not found'));
   else{
       // res.render('images/show.jade', { d: docum } );
      res.writeHead(200, {'content-type': 'text/html',charset:'utf-8'});
// enctype="application/x-www-form-urlencoded | multipart/form-data | text/plain"
      res.end(
        '<form action="/images/edit" method="post">'+
        '<p>'+docum.id+'</p>'+
        'title='+docum.imgtitle+'</p>'+ 
        'filename='+docum.imgname+'</p>'+ 
        '<input type="text" name="title" placeholder="input new name"><br>'+
        '<input type="submit" value="Save">'+
        '</form>'
      )
     }; //else
   });
});


// Document list ---------------------------------------------------------------

app.get('/documents', admin.alldocs);

app.get('/documents/new',new_doc.newDocum);


// Create document 

app.post('/documents', function(req, res) {
  var d = new gDocument(req.body.d);
  console.log(d);

  d.save(function (err){
    if (err) {
      console.log(err);
    }                  
    console.log('Save');
  });
  res.redirect('/documents');
/*
  d.save(function(err) {

    switch (req.params.format) {
      case 'json':
        var data = d.toObject();
        // TODO: Backbone requires 'id', but can I alias it?
        data.id = data._id;
        res.send(data);
      break;

      default:
  //      req.flash('info', 'Document created');
        res.redirect('/documents');
    }
  });
*/
});


// Read document

app.get('/documents/:id', function(req, res, next) {
   console.log('id='+req.params.id);

   gDocument.findById(req.params.id,function(err,docum){
   console.log('docum='+docum);
   if (err){
     res.redirect('/documents');
   } // return next(new NotFound('Document not found'));
   else{
//----------
      gImage.find(function (err, imgs) {
         if (err) {// TODO handle err
          console.log('error: images list empty or bad!');
         }else{
//----------
           res.render('documents/show.jade', { d: docum , img: imgs} );
         }
       });
     }; //else
   });
});


// Update document
app.put('/documents/:id', function(req, res){ //, next) {
  gDocument.findById(req.body.d.id, function(err,doc) {
    if (err){
      //return next(new NotFound('Document not found'));
      res.redirect('/documents');
    }else{
      doc.title = req.body.d.title;
      doc.desc = req.body.d.desc;
      doc.cost = req.body.d.cost;
      doc.view_id = req.body.d.view_id;
      doc.image_id = req.body.d.image_id;
//-----find image----
      gImage.findById(doc.image_id,function(err,imgs){
        console.log('find image'+doc.image_id);
        if (err){
          res.redirect('/documents');
        } // return next(new NotFound('Document not found'));
        else{
           console.log('image find!');
           doc.image.title=imgs.imgtitle;
           doc.image.name=imgs.imgname;
           console.log('doc.image.name='+doc.image.name);
           doc.save();
           console.log('document saved yet.');//Охринеть! Это происходит позже след.блока!!
        }
      });
      console.log('document saved.');
      doc.save(function() {  //Охринеть! Это сохраняется раньше пред.блока!!
        /*
        switch (req.params.format) {
          case 'json':
            res.send(d.__doc);
          break;

          default:
            req.flash('info', 'Document updated');
            res.redirect('/documents');
        }*/
        res.redirect('/documents');
      });
    }// else 
  });
 // res.redirect('/documents');
});

/*
// Delete document
app.del('/documents/:id.:format?', loadUser, function(req, res, next) {
  Document.findById(req.params.id, function(d) {
    if (!d) return next(new NotFound('Document not found'));

    d.remove(function() {
      switch (req.params.format) {
        case 'json':
          res.send('true');
        break;

        default:
          req.flash('info', 'Document deleted');
          res.redirect('/documents');
      } 
    });
  });
});
*/
 
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

/*
// get the file extension
var a = req.files.thumbnail.name.split('.');
var ext = a.pop();
// let's create a unique file name
var random_name = req.session.username + '-' + +new Date() + Math.random();
// TIP: you might want to generate an md5 hash from `unique_name` (search my website)
var new_name = random_name +'.'+ ext;
var target_path = './public/images/' + new_name;
fs.rename(tmp_path, target_path, function(err) {
// yay!
});*/

//var ObjectId = require('mongoose').Types.ObjectId;
//var HexId= require('mongoose').Types.HexId;

//var objId = new ObjectId(  req.params.id );
// You should make string 'param' as ObjectId type. To avoid exception, 
// the 'param' must consist of more than 12 characters.

//var idd = new HexId(req.params.id);
//var ObjectId =require('mongoose').Types.ObjectId;
//var ObjectId =require('mongoose').Schema.Types.ObjectId;
//  gDocument.findById(new ObjId(req.params.id), function(d) {
//  gDocument.findById({id : new ObjectId(req.params.id)}, function(d) {   //'50a4d90dfc0341840e000002', function(d) {
//  gDocument.findOne({},{_id : new ObjectId(req.params.id)}, function(d) {
//var id = new require('mongoose').Types.ObjectId;
//   gDocument.find({_id : new id(req.params.id)},function (d,dd) {
//  gDocument.findOne({_id :new ObjId(req.params.id)}, function(d) {
/*
    switch (req.params.format) {
      case 'json':
        res.send(d.__doc);
      break;

      case 'html':
        res.send(markdown.toHTML(d.data));
      break;

      default:
        res.render('documents/show.jade', {
          locals: { d: d, currentUser: req.currentUser }
        });
    }*/
/*
models.defineModels(mmongoose, function() {
  app.mDocument = mmongoose.model('Document');
mongourl = generate_mongo_url(mongo);
db=mmongoose.createConnection(mongourl);
gDocument = db.model('Document');
});
*/  
/*
----------------------------------
  form(action='/signup',method='post')
    div(data-role='fieldcontain')
      fieldset(data-role='controlgroup')
        label(for='email') email
           input(id='email',type='text',value='',placeholder='@',name='email')
    div#passworddiv(data-role='fieldcontain')
      fieldset(data-role='controlgroup')
        label(for='password') password
           input(id='password',type='password',value='',placeholder='',name='password')
    div(id='hiddendiv',data-role='fieldcontain')
      fieldset(data-role='controlgroup')
        label(for='hidden_password') password
           input(id='hidden_password',type='text',value='',placeholder='',name='password2')
    div(data-role='fieldcontain')
      fieldset(data-type='vertical', data-role='controlgroup')                                           
       label(for='showpass') show password
       input(id='showpass',type='checkbox')
    div(data-role='fieldcontain')   
      input(type='submit',value='Sign Up',data-transition='fade', data-theme='c')
*/
/*
h2 Edit Document
form(method='post', action='/documents/' + d.id)
  input(name='document[id]', value=d.id, type='hidden')
  input(name='_method', value='PUT', type='hidden')
  !=partial('documents/fields', { locals: { d: d } })
*/