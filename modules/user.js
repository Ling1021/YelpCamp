var mongoose = require('mongoose');
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
	username: {type: String, unique: true, required: true},
	password: String,
	avatar: String,
	firstName: String,
	lastName: String,
	followers: [
		{
				type: mongoose.Schema.Types.ObjectId,
				ref:'User'
		}
	],
	notifications:[
		{
			type: mongoose.Schema.Types.ObjectId,
			ref:'Notification'
		}
	],
	email: {type: String, unique: true, required: true},
	isAdmin: {type: Boolean, default: false},
	resetPasswordToken: String,
	resetPasswordExpires: Date 
});

var options = {
 errorMessages: {
  IncorrectPasswordError: 'Password is incorrect',
  IncorrectUsernameError: 'Username is incorrect'
 }
};


UserSchema.plugin(passportLocalMongoose, options);

module.exports = mongoose.model('User', UserSchema);