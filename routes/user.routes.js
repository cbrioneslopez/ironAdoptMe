const express = require('express');
const router = express.Router();
const User = require('./../models/User.model')
const Comment = require('./../models/Comment.model')
const maps = require("./../services/map-api")
const mapsApi = new maps()

const { isLoggedIn, checkRoles } = require('./../middleware/route-guard')

router.get("/list", isLoggedIn, (req, res) => {

    if (req.session.currentUser.role === "USER") {
        req.app.locals.isUser = true
        User
            .find({ role: "SHELTER" })
            .then(users => {
                res.render("users/list-user", { users })
            })
            .catch(err => console.log(err))

    } else if (req.session.currentUser.role === "SHELTER") {
        req.app.locals.isShelter = true
        User
            .find({ role: "SHELTER" })
            .then(users => {
                res.render('users/list-user', { users })
            })
            .catch(err => console.log(err))

    } else {
        req.app.locals.isAdmin = true
        User
            .find({ role: "SHELTER" })
            .then(users => {
                res.render('users/list-user', { users })
            })
            .catch(err => console.log(err))
    }

})

router.get('/:user_id/profile', (req, res) => {

    const { user_id } = req.params

    User
        .findById(user_id)
        .populate("pets")
        .then(foundUser => {
            res.render('users/profile-user', {
                foundUser,
                isShelter: foundUser.role === 'SHELTER',
                isOwner: req.session.currentUser._id === user_id,
            })
        })
        .catch(err => next(err))
})


router.get('/:user_id/edit', (req, res) => {

    const { user_id } = req.params

    User
        .findById(user_id)
        .then(user => {
            res.render('users/edit-user', {
                user,
                isAdmin: req.session.currentUser.role === 'ADMIN',
            })
        })
        .catch(err => console.log(err))
})


router.post('/:user_id/edit', (req, res) => {

    const { username, image, role, phone, address } = req.body
    const { user_id } = req.params

    User
        .findByIdAndUpdate(user_id, { username, image, role, phone, address })
        .then(() => res.redirect(`/user/profile/${user_id}`))
        .catch(err => console.log(err))
})


router.post('/:user_ide/delete', (req, res) => {

    const { user_id } = req.params

    User
        .findByIdAndDelete(user_id)
        .then(() => res.redirect("/user/list"))
        .catch(err => console.log(err))
})


router.get("/comment-list", (req, res) => {

    Comment
        .find()
        .then(comments => res.render("users/comment-user", { comments }))
        .catch(err => console.log(err))
})

router.get("/comment-create", checkRoles("SHELTER", "ADMIN"), (req, res, next) => res.render("users/user-create"))

router.post("/comment-create", checkRoles("SHELTER", "ADMIN"), (req, res, next) => {

    const { text, image } = req.body

    Comment
        .create({ text, image })
        .then(() => res.redirect("/user/comment-list"))
        .catch(err => console.log(err))
})

router.get("/filter", isLoggedIn, async (req, res, next) => {

    const { address } = req.query
    const query = {}

    if (address) {
        const geoCodedAddress = await mapsApi.geocodeAddress(address)
        const { lat, lng } = geoCodedAddress
        query.location = {
            $near: {
                $maxDistance: 20000,
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat]
                }
            }
        }
    }
    User
        .find(query)
        .then(users => res.render("users/list-user", { users }))
        .catch(err => next(err))


})


module.exports = router