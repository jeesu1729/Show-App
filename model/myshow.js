const mongoose = require('mongoose');
const Tvshow = require('./tvshows');
const Schema = mongoose.Schema;

const MyshowScheme = new Schema({
    username : {
        type : String
    },
    shows : [
        {
            show_detail : {
                type : Schema.Types.ObjectId,
                ref : 'Tvshow'
            },
            showid : {
                type : Number,
            },
            info : {
                season : {
                    type : Number,
                },
                episode : {
                    type : Number,
                }
            }
        }
    ]

})

module.exports = mongoose.model('Myshow',MyshowScheme);