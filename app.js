require('dotenv').config();

const   express    = require("express"),
		app        = express(),
		bodyParser = require("body-parser"),
		mongoose   = require("mongoose"),
	    passport   = require('passport'),
		LocalStrategy = require('passport-local'),
		Campground = require("./modules/campground"),
		Comment    = require("./modules/comment"),
		seedDB     = require("./seeds"),
	 	methodOverride = require("method-override"),
		User       = require("./modules/user"),
	  	flash      = require("connect-flash"),
	  	notification = require("./modules/notification"),
	   session = require("express-session");
const mongoStore = require('connect-mongo')(session);


//REQUIRING ROUTES
const commentRoutes = require("./routes/comments"),
	campgroundRoutes = require("./routes/campgrounds"),
	authRoutes = require("./routes/index"),
	  reviewRoutes = require("./routes/review");
	
const url = process.env.DATABASEURL || "mongodb://localhost/yelp_camp"
mongoose.connect(url, { useNewUrlParser: true , useUnifiedTopology: true }).then(() => {
	console.log("Connected to DB!");
}).catch(err => {
	console.log("Error", err.message);
})

app.use(bodyParser.urlencoded({extended:true}));		  
app.set("view engine", 'ejs');
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
//seedDB();
app.use(flash());
app.locals.moment = require('moment');

//PASSPORT CONFIGURATION
app.use(session({
	secret:"lkejl;iJLIEJlleijfjksladldkfj",//used to encoded and uncoded the info
	resave:false,
	saveUninitialized:false,
	store: new mongoStore({
        url: url,
        touchAfter: 24 * 3600,// time period in seconds
    })
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());//encoded info from session
passport.deserializeUser(User.deserializeUser());//uncoded info from session

app.use(async function(req,res,next){
	res.locals.currentUser = req.user;
	if(req.user){
		try{
		let user = await User.findById(req.user._id).populate('notifications', null, {isRead: false }).exec();
		res.locals.notifications = user.notifications.reverse();
		}catch(err){
			console.log(err.message);
		}
	};
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

app.use("/", authRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

//SERVER
app.listen(process.env.PORT, function(){
	console.log("The YelCamp Server is listening!");
});
