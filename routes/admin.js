// Document list
exports.alldocs = function(req, res){
   gDocument.find(function (err, docums) {
      if (err) {// TODO handle err
       console.log('error:'+docums)
      }else{
        docums.forEach(function(record){
           console.log('r:'+record.title);
        });
        res.render('./documents/index', { doc:docums});
      }
   });
};


/*
  Document.find({ user_id: req.currentUser.id },
                [], { sort: ['title', 'descending'] },
                function(err, documents) {
    documents = documents.map(function(d) {
      return { title: d.title, id: d._id };
    });
    res.render('documents/index.jade', {
      locals: { documents: documents, currentUser: req.currentUser }
    });
  });
myposts.find({},function(err, records){
    records.forEach(function(record){
      res.write('Thing retrieved:' + record.title + '\n');
    });
    res.end('Hello World\n');
  });
        docums = docums.map(function(d) {
           console.log('map:'+d.title);
            return { title: d.title, id: d._id };
        });
for(v in docums ){
   console.log('var:'+docums[v].title);
}
*/       
