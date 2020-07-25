const mongoose   = require("mongoose");

// SCHEMA SET UP
var campgroundSchema = new mongoose.Schema({
	name: String,
	price:String,
	image: String,
	description: String,
	imageId: String,
	location:String,
	lat: Number,
	lng: Number,
	createdAt: { type: Date, default: Date.now },
	author: 	{
			id:{
				type: mongoose.Schema.Types.ObjectID,
				ref:"User"
			},
			username:String
		},
	comments:[
		{
		type: mongoose.Schema.Types.ObjectID,
		ref:"Comment"
		}
	],
	reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    rating: {
        type: Number,
        default: 0
    }
});

const Comment = require('./comment');
campgroundSchema.pre('remove', async function() {
	await Comment.remove({
		_id: {
			$in: this.comments
		}
	});
});

var Campground = mongoose.model("Campground", campgroundSchema);

module.exports = Campground;