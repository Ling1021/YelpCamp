const express = require("express");
const router = express.Router({mergeParams: true});
var Campground = require("../modules/campground"),
	Review = require("../modules/review"),
    middleware = require("../middleware");


router.get("/", async function(req, res) {
	try{
		let campground = await 
		Campground.findById(req.params.id).populate({
			path: "reviews",
			options: {sort: {createdAt: -1}}
		}).exec();
		res.render("reviews/index",{campground});
	} catch{
		if(err){
			req.flash("error", err.message);
			return res.redirect("back");
		} else if(!campground){
			req.flash("error", "Campground not found");
			return res.redirect("back");
		}
	}
});

//SHOW A REVIEW CREATION PAGE ROUTE
router.get("/new", middleware.isLoggedin, middleware.checkReviewExistence, async function(req, res){
	try {
		let campground = await Campground.findById(req.params.id);
		res.render("reviews/new", {campground});
	}catch(err){
		req.flash("error", err.message);
		res.redirect("back");
	}
});

//REVIEW CREATE
router.post("/", middleware.isLoggedin, middleware.checkReviewExistence, async function(req, res){
	try{
		let camp = await Campground.findById(req.params.id).populate('reviews').exec();
		let newReview = await Review.create(req.body.review);
		newReview.author.id = req.user.id;
		newReview.author.username = req.user.username;
		newReview.campground = camp;
		newReview.save();
		camp.reviews.push(newReview);
		camp.rating = calculateAverage(camp.reviews);
		camp.save();
		req.flash("success","Your review has been successfully added.")
		res.redirect("/campgrounds/" + camp._id + "/#rating");
	} catch(err) {
		req.flash("error", err.message);
		res.redirect("back");
	}
} )

//REVIEW EDIT ROUTE
router.get("/:review_id/edit", middleware.isLoggedin, middleware.checkReviewOwnership, async function(req, res){
	try{
		let review = await Review.findById(req.params.review_id);	
		res.render("reviews/edit", {campground_id:req.params.id, review});
	}catch(err){
		req.flash("error", err.message);
		return res.redirect("back");
	}
});

//REVIEW UPDATE ROUTE
router.put("/:review_id", middleware.checkReviewOwnership, async function(req, res){
	try{
		let review = await Review.findByIdAndUpdate(req.params.review_id, req.body.review);
		let campground = await Campground.findById(req.params.id).populate("reviews").exec();
		campground.rating = calculateAverage(campground.reviews);
		campground.save();
		req.flash("success", "Successfully changed the review.")
		res.redirect("/campgrounds/" + campground._id +"/reviews");
	}catch(err){
		req.flash("error", err.message);
		return res.redirect("back");
	}
})

//REVIEW DELETE ROUTE
router.delete("/:review_id/",  middleware.checkReviewOwnership, async function(req, res){
	try{
		await Review.findByIdAndRemove(req.params.review_id);
		let campground = await Campground.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec();
		campground.rating = calculateAverage(campground.reviews);
    	campground.save();
		req.flash("success", "Your review was deleted successfully.");
        res.redirect("/campgrounds/" + req.params.id);
	} catch(err) {
		req.flash("error", err.message);
		return res.redirect("back");
	}
})




function calculateAverage(reviews){
	if(reviews.length === 0){
		return 0;
	}
	let sum = 0;
	reviews.forEach(function(e){
		sum += e.rating;
	});
	return (sum/reviews.length);
}

module.exports = router;