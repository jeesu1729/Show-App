




module.exports.isloggedin = (req,res,next) => {
    //console.log(req.path , req.originalUrl);
    if(!req.isAuthenticated()){
        req.flash('error','you must sign in');
        return res.redirect('/login');
    }
    next();
}