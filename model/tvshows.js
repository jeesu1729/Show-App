const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TvshowSchema = new Schema({
   showid : {
       type : String
   },
   name : {
    type : String
    },
   overview : {
       type : String
   },
   poster_path : {
       type : String
   },
    last_season : {
           type : Number
       },
    last_episode : {
           type : Number
       },
   network : {
       type : String
   }
})

module.exports = mongoose.model('Tvshow',TvshowSchema);