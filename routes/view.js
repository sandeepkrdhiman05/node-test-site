
/*
 * GET users listing.
 */

exports.one = function(req, res){
   gDocument.find({view_id : req.params.id},function (err, docums) {
      if (err) {// TODO handle err
       console.log('error:'+docums)
      }else{
        console.log('req.params.id='+req.params.id);
        docums.forEach(function(record){
           console.log('view_id='+record.view_id);
        });
        res.render('view', { title: 'Сайт подарков',doc:docums});
      }
   });
/*
  switch(req.params.id){
    case '1':
      res.render('view1', { title: 'Сайт подарков' });
    case '2':
      res.render('view2', { title: 'Сайт подарков' });
    default:
      res.render('view', { title: 'Сайт подарков' });
  }
*/
};
