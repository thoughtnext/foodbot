var Adapter = require("./Adapter");
var db = new Adapter();
var AWS = require('aws-sdk');
var path = require('path')
var multer = require('multer')
var multerS3 = require('multer-s3')
var implement = require('./implementation')
AWS.config.loadFromPath('./config.json');
AWS.config.update({
  signatureVersion: 'v4'
});
var s3 = new AWS.S3()
var upload1 = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'foodiebot',
    metadata: function(req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function(req, file, cb) {
      cb(null, file.originalname.replace(path.extname(file.originalname), '') + '-' + Date.now() + path.extname(file.originalname))
    }
  })
})

var upload2 = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'foodiebot',
    metadata: function(req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function(req, file, cb) {
      cb(null, file.originalname.replace(path.extname(file.originalname), '') + '-' + Date.now() + path.extname(file.originalname))
    }
  })
})

module.exports = {
  configure: function(app) {
    app.get('/restaurants/', function(req, res) {
      db.fetchRestaurants(res);
    });
    app.get('/restaurants/:restaurantId/', function(req, res) {
      db.fetchRestaurantDetails(req.params.restaurantId, res);
    });
    app.post('/new/restaurant/', function(req, res) {
      console.log(req.body)
      // res.json(req.body);
      db.addRestaurant(req.body.name, req.body.image, req.body.description, res);
    });
    app.put('/edit/restaurants/:restaurantId/', function(req, res) {
      console.log(req.body)
      db.editRestaurant(req.params.restaurantId, req.body.name, req.body.image, req.body.description, res);
    });
    app.put('/edit/isenabled/restaurants/:restaurantId/', function(req, res) {
      console.log(req.body)
      db.editRestaurantIsEnabled(req.params.restaurantId, req.body.isEnabled, res);
    });
    app.get('/restaurants/:restaurantId/categories/', function(req, res) {
      db.FetchCategoriesforRestaurant(req.params.restaurantId, res)
    })
    app.get('/categories/:categoryId/', function(req, res) {
      db.fetchCategoryDetails(req.params.categoryId, res)
    })
    app.get('/categories/:categoryId/menuItems/', function(req, res) {
      db.fetchMenuItemsForCategory(req.params.categoryId, res)
    })
    app.get('/groups/check/:groupName', function(req, res) {
      db.checkIfGroupNameExists(req.params.groupName, res)
    })
    app.get('/groups/check/:groupName/:groupPassword', function(req, res) {
      db.checkIfGroupExists(req.params.groupName, req.params.groupPassword, res)
    })
    app.delete('/categories/:categoryId/', function(req, res) {
      db.removeCategory(req.params.categoryId, res)
    })
    app.put('/edit/categories/:categoryId/', function(req, res) {
      console.log(req.body)
      db.editCategory(req.params.categoryId, req.body.name, req.body.restaurant_id, res)
    })
    app.post('/new/restaurants/:restaurantId/category', function(req, res) {
      console.log(req.body)
      db.addCategory(req.body.name, req.params.restaurantId, res);
    });
    app.post('/new/categories/:categoryId/menuItem', function(req, res) {
      console.log(req.body)
      db.addMenuItem(req.body.name, req.body.image, req.params.categoryId, req.body.description, req.body.price, res);
    });
    app.post('/new/group', function(req, res) {
      console.log('req.body')
      console.log(req.body)
      var user_id = req.body.user_id
      var fb_id = req.body.fb_id
      var groupName = req.body.group_name
      var password = req.body.password
      // console.log(groupName)
      db.createNewGroup(req.body, res)
        .then(function(result) {
          db.assignNewGroupToUser(result, user_id)
            .then(function() {
              implement.sendSuccessForAddNewGroup(fb_id, groupName, password)
            })
        })
    });
    app.post('/join/group', function(req, res) {
      console.log(req.body)
      var user_id = req.body.user_id
      var fb_id = req.body.fb_id
      var groupName = req.body.group_name
      var groupPassword = req.body.password
      var group_id = req.body.group_id
      // db.createNewGroup(req.body)
      //   .then(function(result) {
        db.checkIfGroupIsAssignedToUser(group_id, user_id)
        .then(function(result){
          console.log(result)
          if(result.exists){
            res.send({status: true})
            implement.sendFailureForJoinGroup(fb_id, groupName)
          }
          else {
            db.assignNewGroupToUser(group_id, user_id)
            .then(function() {
              res.send({status: true})
              implement.sendSuccessForJoinGroup(fb_id, groupName)
            })
          }
        })
          // db.assignNewGroupToUser(group_id, user_id)
          //   .then(function() {
          //     res.send({status: true})
          //     implement.sendSuccessForJoinGroup(fb_id, groupName)
          //   })

        // })
    });

    app.post('/user/:userId/group/:groupId', function(req, res) {
      console.log(req.body)
        // db.createNewGroup(req.body)
        // db.addMenuItem(req.body.name, req.body.image, req.params.categoryId, req.body.description, req.body.price, res);
    });
    app.put('/edit/menuItems/:menuItemId/', function(req, res) {
      console.log(req.body)
      db.editMenuItem(req.params.menuItemId, req.body.name, req.body.image, req.body.description, req.body.price, res)
    })
    app.get('/menuItems/:menuItemId/', function(req, res) {
      db.fetchMenuItemDetails(req.params.menuItemId, res)
    })
    app.delete('/menuItems/:menuItemId/', function(req, res) {
      db.removeMenuItem(req.params.menuItemId, res)
    })

    app.post('/upload/restaurant/', upload1.single('file'), function(req, res, next) {
      res.send({ status: 'success', file: req.file })
      console.log('Upload Successful ', req.file);
    });

    app.post('/upload/menuItem/', upload2.single('file'), function(req, res, next) {
      res.send({ status: 'success', file: req.file })
      console.log('Upload Successful ', req.file);
    });

  }
};
