const mongoose = require('mongoose')
const dbconnect = require('../db')

//Call the db to connect the mongo db
dbconnect()

// Complaint Schema
const PicSchema = mongoose.Schema({
    imageData: Buffer,
    contentType: String,
    updated: { type: Date, default: Date.now }
});

const Picture = module.exports = mongoose.model('Picture', PicSchema);

module.exports.saveImageFile = function (Picture, callback) {
    Picture.save(callback);
}

module.exports.getPictureById = function(pid, callback){
    Picture.findById(pid, callback)
}  