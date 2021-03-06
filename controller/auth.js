const User = require('../models/user')
const jwt = require('jsonwebtoken')//used to generate th e signed token 
const expressJwt = require('express-jwt')// used for authorization check
const config = require('config')

//error handler 
const { errorHandler } = require('../helpers/dbErrorHandler')

exports.signUp = (req, res) => {
    //console.log("req body:", req.body)
    const user = new User(req.body)
    user.save((err, user) => {
        if (err) {
            return res.status(400).json({ err: errorHandler(err) })
        }

        //we doing them undefined bcz we dont want to shoe them in the response message
        user.salt = undefined
        user.hashed_password = undefined

        res.json({ user })
    })
}

exports.signIn = (req, res) => {
    // find the user based on email
    const { email, password } = req.body
    User.findOne({ email }, (err, user) => {

        if (err || !user) {
            return res.status(400).json({
                error: "User with that email doesn't exist! Please SignIn"
            })
        }

        // if the  user is found make sure that the email and password match
        //create authenticate method in user method
        if (!user.authenticate(password)) {
            return res.status(401).json({
                error: " Email and password does not match"
            })
        }
        // generate a signed token with user id and secret
        const token = jwt.sign({ _id: user._id }, config.get('jwtSecret'))
        //persist the token as 't' in cookie with expiry date
        res.cookie('t', token, { expire: new Date() + 9999 })
        //return response with user and token to frontend client
        const { _id, name, email, role } = user
        return res.json({ token, user: { _id, name, email, role } })
    })
}

exports.signOut = (req, res) => {
    res.clearCookie("t")
    res.json({ message: "Signout success." })
}

exports.requireSignIn = expressJwt({
    secret: config.get('jwtSecret'),
    userProperty: "auth"
})

