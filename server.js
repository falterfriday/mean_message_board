var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var mongoose = require('mongoose');
// -------------------------------------------------------------
mongoose.connect('mongodb://localhost/message_board');
var Schema = mongoose.Schema;
app.use(bodyParser.urlencoded({ extended:true}));
app.use(express.static(path.join(__dirname, './static')));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

// -------------------post-model--------------------------------
var postSchema = new mongoose.Schema({
	name: { type: String, required: true, minlength: 4},
	post: { type: String, required: true, minlength: 2},
	_comments: [{ type: Schema.Types.ObjectId, ref: 'Comment'}]
}, {timestamps: true });
mongoose.model('Post', postSchema);
var Post = mongoose.model('Post');

//----------------post-validations--------------------------------
postSchema.path('name').required(true, 'Name not long enough');
postSchema.path('post').required(true, 'Post not long enough');

//-----------------comment-model--------------------------------
var commentSchema = new mongoose.Schema({
 _post: {type: Schema.Types.ObjectId, ref: 'Post'},
 name: { type: String, required: true, minlength: 2 },
 comment: { type: String, required: true, minlength: 2 }
}, {timestamps: true });
mongoose.model('Comment', commentSchema);
var Comment = mongoose.model('Comment');

//----------------comment-vailidations---------------------------
commentSchema.path('name').required(true, 'Name not long enough');
commentSchema.path('comment').required(true, 'Comment not long enough');

//-----------------load-index------------------------------------
app.get('/', function(req, res) {
	Post.find({}).populate('_comments').exec(function(err, posts) {
		if(err) {
			console.log('error getting posts');
		} else {
			// console.log(posts[0]._comments[2].name);
			res.render('index', {posts: posts});
		}
	});
});

//-----------submit-post-&-reload index-----------------------------
app.post('/post', function(req, res) {
	console.log('POST DATA', req.body);
	var post = new Post({ name: req.body.name, post: req.body.post});
	post.save(function(err) {
		if(err) {
			console.log('something went wrong');
			res.render('index');
		} else {
			res.redirect('/');
		}
	});
});

//-----------submit-comment-&-reload-index-----------------------------
app.post('/comment/:id', function(req, res) {
	console.log('COMMENT POST DATA', req.body);
	var post_id = req.params.id;
	Post.findOne({ _id: post_id }, function(err, post) {
		var comment = new Comment({name: req.body.name, comment: req.body.comment});
		console.log("heres the comment",comment);
		comment._post = post._id;
		Post.update({ _id: post._id}, {$push: { _comments : comment }}, function(err) {
			if(err){
				console.log('error updating post with comment');
			}
		});
		comment.save(function(err) {
			if(err) {
				console.log('error saving new comment');
			} else {
				console.log('comment successfully added');
				res.redirect('/');
			}
		});
	});
});

//-----------------------------------------------------
app.listen(8000, function(){
	console.log("listening on port 8000");
});
