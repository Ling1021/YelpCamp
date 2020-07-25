var Campground = require("../modules/campground"),
	Review = require("../modules/review"),
	Comment = require("../modules/comment");
var middlewareObj = {};

middlewareObj.checkCommentOwnership = function(req, res, next){
			if(req.isAuthenticated()){
						Comment.findById(req.params.comment_id, function(err, foundComment){
								if(err || !foundComment){
									console.log(err);
									req.flash("error", "Comment not found");
									res.redirect("back");
								} else {
									if(foundComment.author.id.equals(req.user._id)){
										next();
									} else {
										res.redirect("back");
									}

								}
							})
						
					} else {
						req.flash("error","You must log in to do that.");
						res.redirect("back");
							}
					};


middlewareObj.isLoggedin = function(req, res, next){
							if(req.isAuthenticated()){
								return next();
							}
							req.flash("error","You need to be logged in to do that.");
							res.redirect("/login");
						};


middlewareObj.checkCampgroundOwnership = function(req, res, next){
	//is user logged in?
	if(req.isAuthenticated()){
		//does the user own the campground?
		Campground.findById(req.params.id, function(err, foundCamp){
			if(err || !foundCamp){
				req.flash("error","Campground not found");
				console.log(err);
				res.redirect("back");
			} else {
				//if yes, let the user edit the campground
				if(foundCamp.author.id.equals(req.user._id)){
					next();
				} else {
					//if not, redirect
					req.flash("error","You don't have permission to do that.");
					res.redirect("back")
				}
			}}
			);
	} else {
		//ohterwise, redirect
			req.flash("error", "You need to be logged in to do that.");
			res.redirect("back");
	}};

middlewareObj.checkReviewExistence = async function(req, res, next){
	try{
		if(req.isAuthenticated()){
		let foundCamp = await Campground.findById(req.params.id).populate("reviews").exec();
		let foundUserReview = await foundCamp.reviews.some(function(review){
return review.author.id.equals(req.user._id)});
		if(foundUserReview){
			req.flash("error","You already wrote a review");
			return res.redirect("/campgrounds/" + foundCamp._id);
			}
			next();
		}
	} catch(err){
		req.flash("error", "You have to login first.");
		res.redirect("back");
	}
}

middlewareObj.checkReviewOwnership = async function(req, res, next){
	try{
		if(req.isAuthenticated()){
			let review = await Review.findById(req.params.review_id);
			if(review.author.id.equals(req.user._id)){
			   next();
				};
		}
	} catch(err){
		if(err){
			req.flash("error", err.message);
			res.redirect("back");
		} else if(!req.isAuthenticated()){
			req.flash("error", "You have to login first.");
			res.redirect("back");
		}
		
	}
}



module.exports = middlewareObj;