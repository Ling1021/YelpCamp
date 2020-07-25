const express  = require("express");
const router   = express.Router(),
	passport   = require('passport'),
	User       = require("../modules/user"),
	Campground = require("../modules/campground"),
	Review     = require("../modules/review"),
	flash      = require("connect-flash"),
	async      = require("async");

const   nodemailer   = require("nodemailer"),
		crypto       = require("crypto"),
		middleware   = require('../middleware/index'),
		Notification = require('../modules/notification');





//ROOT ROUTE
router.get("/", function(req, res){
			res.render('home');
});



//REGISTER FORM
router.get("/register", function(req, res){
	res.render("register",{page:"register"});
});


//REGISTER POST ROUTES
router.post("/register", function(req,res){
	var newUser = new User({username:req.body.username, firstName:req.body.firstName, lastName:req.body.lastName,avatar:req.body.avatar, email:req.body.email});
	if(req.body.adminCode === "code123"){
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, function(err,user){
		if(err){
			console.log(err);
			return res.render("register",{error: err.message});
		}
		passport.authenticate('local')(req, res, function(){
			req.flash("success","Welcome to YelpCamp, " + user.username);
			res.redirect("/campgrounds");	
		})
	})
});


//LOGIN FORM
router.get("/login", function(req,res){
	res.render("login", {page:"login"});
})

//LOGIN ROUTE
router.post("/login", passport.authenticate("local",
	{
	successRedirect:"/campgrounds",
	failureRedirect:"/login",
	failureFlash:true,
	successFlash:true
	}) , function(req, res){
});

//LOGOUT ROUTE
router.get("/logout", function(req, res){
	req.logout();
	req.flash("success","logged out successfully!")
	res.redirect('/campgrounds');
});

//SHOW USER PROFILE ROUTE
router.get("/users/:id", async function(req, res){
	try {
		let user = await User.findById(req.params.id).populate('followers').exec();
		let campground = await Campground.find().where("author.id").equals(user._id).exec();
		res.render("users/show",{user, campground});
	} catch(err){
			req.flash("error", err.message);
			res.redirect("back");
	}		
});


//FOLLOW USER
router.get('/follow/:id', middleware.isLoggedin, async function(req, res){
	try{
		let user = await User.findById(req.params.id);
		user.followers.push(req.user._id);
		user.save();
		req.flash("success", "Successfully followed " + user.username + "!");
		res.redirect('/users/' + req.params.id);
	} catch(err){
		req.flash("error", err.message);
		res.redirect("back");
	}
});

//VIEW ALL NOTIFICATION PAGE
router.get('/notifications', middleware.isLoggedin, async function(req, res){
	try{
		let user = await User.findById(req.user._id).populate({
			path: 'notifications',
		options: {sort: { "_id": -1 } } 
		}).exec();
		let allNotifications = user.notifications;
		res.render('notifications/index', {allNotifications});
	} catch(err){
		req.flash("error", err.message);
		res.redirect("back");
	}
});

//HANDLE NOTIFICATION (DROPDOWN)
router.get('/notifications/:id', middleware.isLoggedin, async function(req, res){
	try {
		let notification = await Notification.findById(req.params.id);
		notification.isRead = true;
		notification.save();
		res.redirect(`/campgrounds/${notification.campgroundId}`);
	} catch(err){
		req.flash("error", err.message);
		res.redirect("back");
	}
});


//PASSWORD RESET ROUTE
router.get("/forgot", function(req, res){
	res.render("forgot");
	
});


//POST USER PROFIEL
router.post("/forgot", function(req, res, next){
	async.waterfall([
		function(done){
			crypto.randomBytes(20, function(err, buf){
				var token = buf.toString('hex');
				done(err, token);
			});
			
		},
		function(token, done){
			User.findOne({email:req.body.email}, function(err, user){
				if(!user){
					req.flash("error","No account with that email address exists.");
					return res.redirect("/forgot");
				}
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 36000; //1 hour
				
				user.save(function(err){
					done (err, token, user);
				});
			});
		},
		function(token, user, done){
			var smtpTransport = nodemailer.createTransport({
				  service:"Gmail",
				auth: {
				  user: 'yangtzuling@gmail.com',
				  pass: process.env.GMAILPW
				}
			});
			var mailOptions = {
				to: user.email,
				from:"yangtzuling@gmail.com",
				subject:"Reset your password of YelpCamp",
				text:"You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" + 
				"Please click on the following link, or copy paste this into your browser to complete the process:\n\n" +
				"http://" + req.headers.host + "/reset/" + token + "\n\n" +
				"If you did not request this, please ignore this email and your passwowrd will remain unchanged.\n"
			};
		smtpTransport.sendMail(mailOptions, function(err) {
				req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
				done(err, 'done');
			    console.log('mail sent');
			  });
		}	
	], function(err){
		if(err) return next(err);
		res.redirect('/forgot');
	});
});

//UPDATE PASSWORD ROUTE
router.get("/reset/:token", function(req,res){
	User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires:{ $gt: Date.now()} }, function(err, user){
		if(!user){
			req.flash("error", "Password reset token is invalid or has expired.");
			return res.redirect("/forgot");
		}
		res.render("reset", {token:req.params.token});
		
	});
});


//POST UPDATE PASSWORD ROUTE
router.post("/reset/:token", function(req, res){
	async.waterfall([
		function(done){
			User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires:{$gt: Date.now()}}, function(err, user){
		if(!user){
			req.flash("error", "Password reset token is invalid or has expired.");
			return res.redirect("back");
		}
		if(req.body.password === req.body.confirm){
			user.setPassword(req.body.password, function(err){
				user.resetPasswordToken = undefined;
				user.resetPasswordExpires = undefined;
				
				user.save(function(err){
					req.logIn(user, function(err){
					done(err, user);
					})
				});
			});
		} else {
			req.flash("error", "Passwords do not match.");
			return res.redirect("back");
			}
		});
	},
	function(user, done){
		var smtpTransport = nodemailer.createTransport({ //misspell here, the err will be missing email for email path
			service:'Gmail',
			auth:{
				user: 'yangtzuling@gmail.com',
				pass: process.env.GMAILPW
			}
		});
		var mailOptions = {
				to: user.email,
				from:"yangtzuling@gmail.com",
				subject:"Your password of YelpCamp has been changed",
				text:'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
		};
		smtpTransport.sendMail(mailOptions, function(err){
			req.flash("success", "Success! Your password has been changed!");
			done(err);
		});
	}
	], function(err){
		res.redirect("/campgrounds")
	});
});



module.exports = router;
