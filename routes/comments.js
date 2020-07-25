var express = require("express");
var router = express.Router({mergeParams:true});
var Campground = require("../modules/campground"),
	Comment = require("../modules/comment");
var middleware = require("../middleware");


// COMMENTS NEW
router.get("/new", middleware.isLoggedin, function(req, res){
	Campground.findById(req.params.id, function(err, foundCamp){
		if(err || !foundCamp){
			req.flash("error", "Campground not found");
			console.log(err);
			res.redirect("back");
		} else {
		res.render("comments/new", {campground:foundCamp});
		}
	})
	
});

// COMMENTS CREATE
router.post("/", middleware.isLoggedin, function(req,res){
	//lookUp campground using ID
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			console.log(err);
		} else {
		//create new comment	
			Comment.create(req.body.comment, function(err, comment){
				if(err){
					console.log(err);
				} else{
					comment.author.id = req.user._id;
					comment.author.username=req.user.username;
					comment.save();
					//connect new comment to the campground
					campground.comments.push(comment);
					campground.save();
					//redirect to campground show page
					req.flash("success","Comment added successfully.")
					res.redirect("/campgrounds/" + campground._id);
				}
			})
		}
	})

});

//EDIT ROUTE
router.get("/:comment_id/edit", middleware.isLoggedin, function(req,res){
			Campground.findById(req.params.id, function(err, foundCamp){
							if(err || !foundCamp){
								console.log(err);
								req.flash("error","Campground not found.");
								res.redirect("back");
							} else {
								//lookUp campground using ID
								Comment.findById(req.params.comment_id, function(err, foundComment){
									if(err || !foundComment){
										req.flash("error", "Comment not found");
										console.log(err);
										res.redirect("back");
									} else {
									//edit new comment	
										res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});	
									}
								})
							}
})
});

//UPDATE ROUTE
router.put("/:comment_id", middleware.checkCommentOwnership, function(req,res){
	//lookUp campground using ID
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err,updatedComment){
		if(err){
			console.log(err);
			res.redirect("back");
		} else {
			res.redirect("/campgrounds/" + req.params.id);
				}
			} )
		});

//DELETE ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req,res){
			Comment.findByIdAndRemove(req.params.comment_id, function(err){
				if(err){
					res.redirect("back");
				} else {
					req.flash("success","Comment removed.")
					res.redirect("/campgrounds/" + req.params.id);
				}
			} )
		});






module.exports = router;

