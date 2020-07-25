var express = require("express");
var router = express.Router();
var Campground = require("../modules/campground"),
	Comment = require("../modules/comment"),
	User = require('../modules/user'),
	Notification = require('../modules/notification'),
	Review = require("../modules/review");
var middleware = require("../middleware");
var NodeGeocoder = require("node-geocoder");
var multer = require("multer");
var cloudinary = require("cloudinary").v2;
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: imageFilter});

cloudinary.config({
	cloud_name:"dv3etmav0",
	api_key: process.env.CLOUDINARY_API_KEY, 
   api_secret: process.env.CLOUDINARY_API_SECRET
});

var options = {
	provider:"google",
	httpAdapter:"https",
	apiKey:process.env.GEOCODER_API_KEY,
	formatter:null
};




var geocoder = NodeGeocoder(options);

//INDEX ROUTE
// router.get("/", function(req, res){
// 	if(req.query.search){
// 		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
// 		Campground.find({name:regex},function(err, allCampgrounds){
// 		if(err){
// 			console.log(err);
// 		} else {
// 			req.flash("error", "No campgrounds match that query, please try again.");
// 			res.render("campgrounds/index",{campgrounds: allCampgrounds});
// 		}
// 	});
// 	} else {
// 	Campground.find({},function(err, allCampgrounds){
// 		if(err){
// 			console.log(err);
// 		} else {
// 			res.render("campgrounds/index",{campgrounds: allCampgrounds});
// 		}
// 	});
// 	}
// });

router.get("/", async function(req, res){
	try {
		if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		let campgrounds = await Campground.find({name:regex});
		res.render("campgrounds/index",{campgrounds});
		}
		let campgrounds = await Campground.find({});
		return res.render("campgrounds/index",{campgrounds});
	} catch (err){
		req.flash("error", "No campgrounds match that query, please try again.");
		res.redirect("back")
	}
});


//SHOW ADDING CAMPGORUND ROUTE
router.get("/new", middleware.isLoggedin, function(req, res){
	res.render("campgrounds/new");
});

// SHOW - SHOW MORE INFO ABOUT THE CAMPGORUND
router.get("/:id", async function(req,res){
	try {
		let foundCamp = await Campground.findById(req.params.id).populate('comments').populate({
			path:"reviews",
			options:{sort: {createdAt: -1} }
		}).exec();
		res.render("campgrounds/show", { campground: foundCamp } ) ;
	} catch(err){
		if(err){
			req.flash("error","Campground not found.");
			res.redirect("back");
		} else if(!foundCamp){
			req.flash("error","Campground not found.");
			res.redirect("back");
		}
		
	}
});

//EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
	Campground.findById(req.params.id, function(err, foundCamp){
		if(err || !foundCamp){
			console.log(err);
			req.flash("error","Campground not found.");
			res.redirect("back");
		} else {
		res.render("campgrounds/edit", {campground:foundCamp});
		}
	})
});

router.post("/", middleware.isLoggedin, upload.single('image'), function(req, res){
	cloudinary.uploader.upload(req.file.path, function(err, result) {
		if(err){
			req.flash("error", err.message);
			res.redirect("back");
		}
  // add cloudinary url for the image to the campground object under image property
  geocoder.geocode(req.body.campground.location, function (err, data) {
	  
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;
	  
	req.body.campground.image = result.secure_url;
    req.body.campground.imageId = result.public_id;
	req.body.campground.description = req.body.campground.des;
  // add author to campground
  req.body.campground.author = {
    id: req.user._id,
    username: req.user.username
  } 
    // Create a new campground and save to DB
    Campground.create(req.body.campground, async function(err, newlyCreated){
        try{
			let user = await User.findById(req.user._id).populate('followers').exec();
			let newNotification = {
				username:req.user.username,
				campgroundId: newlyCreated.id
			}
			for(const follower of user.followers) {
				let notification = await Notification.create(newNotification);
				follower.notifications.push(notification);
				follower.save();
			}
			req.flash("success","Successfully created a campground!");
            res.redirect(`/campgrounds/${newlyCreated.id}`);
		} catch(err){
            console.log(err.message);
			req.flash("error", err.message)
			return res.redirect("back");
        }
    });
  });
});
	});

//UPDATE OR EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), function(req, res){
		Campground.findById(req.params.id, async function(err, campground){
			if(err){
				req.flash("error", err.message);
				return res.redirect("back");
			} 
			if(req.file){
				try {
					await cloudinary.uploader.destroy(campground.imageId);
					var result = await cloudinary.uploader.upload(req.file.path);
				} catch(err) {
					req.flash("error", err.message);
					return res.redirect("back");

				}
				campground.imageId = result.public_id;
				campground.image = result.secure_url;
			}
			geocoder.geocode(req.body.campground.location, function (err, data) {
			if (err) {
			  req.flash('error', 'Invalid address');
			  return res.redirect('back');
			}

			req.body.campground.lat = data[0].latitude;
			req.body.campground.lng = data[0].longitude;
			req.body.campground.location = data[0].formattedAddress;

			campground.name = req.body.campground.name;
			campground.description = req.body.campground.des;
			campground.price = req.body.campground.price;
			campground.save();

			req.flash("success","Successfully Updated!");
			res.redirect("/campgrounds/" + campground._id);

		  });
	});
});


//DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
	Campground.findById(req.params.id, async function(err, campRemoved){
		try {
			await cloudinary.uploader.destroy(campRemoved.imageId);
			await Comment.deleteMany({_id: { $in: campRemoved.comments }});
			await Review.deleteMany({_id: { $in: campRemoved.reviews }});
			await campRemoved.remove();
			req.flash("success","Campground is removed.");
			res.redirect("/campgrounds");
		} catch (err){
			req.flash("eoore",err.message);
			res.redirect("/campgrounds");
		}	
	})
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};




//DELETE ROUTE THAT DELETE COMMENTS RELATED AS WELL
// router.delete("/:id", middleware.checkCampgroundOwnership, async(req, res) => {
//   try {
//     let foundCampground = await Campground.findById(req.params.id);
//     await foundCampground.remove();
//   } catch (error) {
//     console.log(error.message);
//     res.redirect("/campgrounds");
//   }
// });



module.exports = router;