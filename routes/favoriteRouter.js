const express = require('express');
const Favorite = require('../models/favorites');
const favoriteRouter = express.Router();
const authenticate = require('../authenticate.js');
const cors = require('./cors');

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find( {user:req.user._id} )
    .populate('user')
    .populate('campsites')
    .then(favorites => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    })
    .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    let alreadyFavorite = false;    
    Favorite.findOne( {user:req.user._id} )
    .then( favorite => {
        if( !favorite ) {//if there isn't a favorites document, add the favorites
            Favorite.create({user:req.user._id}, req.body.campsites)
            .then(favorite => {
                console.log('Favorites Created ', favorite);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
        } else {//there is a favorites document
            //only add campsites that aren't already favorited
            req.body.forEach(campsite => {//loop through the passed in array of campsites
                
                if( !favorite.campsites.includes(campsite._id) ) {//!favorite.campsites.includes(campsite._id)//find won't give a string
                    favorite.campsites.push(campsite._id);
                    console.log(`Campsite POST - ${campsite}`)
                } else {
                    alreadyFavorite = true;
                }
            });
            favorite.save()
            .then(favorite => {
                res.statusCode = 200;
                if(alreadyFavorite) {
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('That campsite is already a favorite!');

                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                }
            })
        }
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser,  (req, res, next) => {
    Favorite.findOneAndDelete()
    .then(favorite => {
        res.statusCode = 200;
        if( favorite ) {
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
        } else {
            res.setHeader('Content-Type', 'text/plain');
            res.end('You do not have any favorites to delete.');
        }
    })
    .catch(err => next(err));
});

favoriteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end(`GET operation not supported on /favorites/${req.params.campsiteId}`);
})
.post(cors.corsWithOptions, authenticate.verifyUser,  (req, res, next) => {  
    let alreadyFavorite = false;//a better options is chained promises      
    Favorite.findOne( {user:req.user._id} )
    .then( favorite => {
        if( !favorite ) {//if there isn't a favorites document, add the favorites req.params.campsiteId
            Favorite.create({user:req.user._id, campsites:[req.params.campsiteId]})
            .then(favorite => {
                console.log('Favorites Created ', favorite);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
        } else {//there is a favorites document
            if( favorite.campsites.includes(req.params.campsiteId) ) {
                alreadyFavorite = true;
            } else {
                favorite.campsites.push(req.params.campsiteId);
            }
            favorite.save()
            .then(favorite => {
                res.statusCode = 200;
                if(alreadyFavorite) {
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('That campsite is already a favorite!');

                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                }
            })
        }
    })
    .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(`PUT operation not supported on /campsites/${req.params.campsiteId}`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    let favoriteExists = false;//a better options is chained promises     
    //find the favorite associated with this user
    Favorite.findOne( {user:req.user._id} )
    .then(favorite => {
        if(favorite) {//the favorites document exists
            favoriteExists = true;            
            if(favorite.campsites.length > 0 ) {//are there campsites in the favorites?
                const campIndex = favorite.campsites.indexOf(req.params.campsiteId);
                if( campIndex !== -1 ) {
                    favorite.campsites.splice(campIndex, 1);                
                }
                
                favorite.save()
                .then( favorite => {
                    res.statusCode = 200;
                    if( favoriteExists ) {
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    } else {        
                        res.setHeader('Content-Type', 'text/plain');
                        res.end('There are no favorites to delete.');
                    }
                })
            }
        } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end('There are no favorites to delete.');
        }
    })
    .catch(err => next(err));
});

module.exports = favoriteRouter;