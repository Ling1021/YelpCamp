const mongoose   = require("mongoose"),
      Campground = require("./modules/campground"),
	  Comment = require("./modules/comment");

const data = [{
	name:"Cloud's Rest",
	image:"https://images.unsplash.com/photo-1520824071669-892f70d8a23d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
	description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam commodo dui lacus, quis ultricies massa elementum sodales. Vestibulum luctus efficitur felis. Pellentesque eget lectus egestas, suscipit libero quis, ornare velit. Maecenas nec ligula eget nibh venenatis dignissim. Morbi lacinia sapien aliquet, viverra nisi vitae, rhoncus libero. Integer nec feugiat diam. Etiam vehicula enim erat, facilisis cursus sem malesuada et. Sed luctus purus a pretium luctus. Morbi malesuada mi sit amet finibus porttitor. Cras et augue nisi. Fusce suscipit dolor a luctus placerat. Donec dolor ligula, aliquet eget nunc a, pellentesque ornare elit. Sed ac lacus id nunc aliquam ultrices. Donec egestas auctor nisi, vitae tempus mauris posuere sed."
},
	{
	name:"Mt Rainier Campground",
	image:"https://images.unsplash.com/photo-1476041800959-2f6bb412c8ce?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
	description:"Sed lorem felis, hendrerit at mauris vel, congue convallis purus. Morbi finibus risus mi, eget gravida est venenatis non. Suspendisse vel sapien ligula. Suspendisse posuere, leo vel rutrum sodales, ante lacus fringilla arcu, eu volutpat purus enim nec erat. Integer pharetra ligula at neque lobortis accumsan. Ut iaculis laoreet dui, pretium dictum nisi sodales et. Aenean ac metus vel ante ornare euismod. Donec non nisl sed lectus scelerisque fringilla et nec lorem. Cras ac ante nec nibh maximus ornare et id nunc. Vivamus gravida augue ac mi facilisis hendrerit. Vivamus posuere in leo vitae pulvinar. Donec ac feugiat purus. Vivamus vehicula tellus non pellentesque molestie."
},
	{
	name:"Rest under the stars",
	image:"https://images.unsplash.com/photo-1542067519-6cd1e217df2d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
	description:"Donec pretium ut neque sed venenatis. Morbi vehicula, magna in eleifend feugiat, est est hendrerit massa, ac mollis neque dui a lorem. Donec eu nisl et felis sollicitudin gravida. Aenean posuere eu ipsum nec tincidunt. Fusce aliquam, enim sed hendrerit sollicitudin, ex felis scelerisque erat, ac pulvinar lectus velit ut felis. Proin sed elit non sem mollis auctor sit amet in risus. Nullam consectetur mi nec ex ornare porttitor. Vivamus sed purus diam. Curabitur vel lectus in leo facilisis porttitor ac vitae dolor. Nam risus nibh, pretium vitae laoreet vel, lacinia a sem. Curabitur sollicitudin nisi pretium tristique ullamcorper. Integer sit amet nibh suscipit, commodo dolor id, facilisis ipsum. Fusce ullamcorper felis in cursus bibendum. Nunc eu metus nec odio venenatis euismod. Etiam sollicitudin arcu nec efficitur placerat. Phasellus odio magna, fringilla in nunc in, tristique accumsan turpis. Nulla et justo justo. Nam non vulputate augue. Curabitur laoreet vel tellus quis facilisis. Suspendisse pretium vehicula interdum."
}
			 ]



function seedDB(){
	Campground.remove({}, function(err){
		if(err){
			console.log(err);
		} else {
			console.log("removed campground!");
			data.forEach(function(seed){
			Campground.create(seed, function(err, campground){
				if(err){
					console.log(err);
				} else {
					console.log("added a campground");
					//create comments
					Comment.create(
						{
						   text:"This place is great, but I wish there was internet",
							author:"Homer"
						}, function(err, comment){
						if(err){
							console.log(err);
						} else {
							campground.comments.push(comment);
							campground.save();
							console.log("created a comment");
						}
					}
				)}
			} )
		})
		}
		
	})
}


module.exports = seedDB;
