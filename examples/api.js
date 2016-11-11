var Adapter = require("./Adapter");
var db = new Adapter();
var multer  = require('multer');
var path = require('path')
var storage1 = multer.diskStorage({
  destination: './assets/uploadedImages/restaurants/',
  filename: function (req, file, cb) {
    cb(null, file.originalname.replace(path.extname(file.originalname), '') + '-' + Date.now() + path.extname(file.originalname))
  }
})

var upload1 = multer({ storage: storage1 })

var storage2 = multer.diskStorage({
  destination: './assets/uploadedImages/menu-items/',
  filename: function (req, file, cb) {
    cb(null, file.originalname.replace(path.extname(file.originalname), '') + '-' + Date.now() + path.extname(file.originalname))
  }
})

var upload2 = multer({ storage: storage2 })


module.exports = {
  configure: function(app) {
    app.get('/restaurants/', function(req, res) {
        db.fetchRestaurants(res);
    });
    app.get('/restaurants/:restaurantId/', function(req, res){
		db.fetchRestaurantDetails( req.params.restaurantId, res );
	});
	app.post('/new/restaurant/', function(req, res){
		console.log(req.body)
		db.addRestaurant( req.body.name, req.body.image, req.body.description, res );
	});
	app.put('/edit/restaurants/:restaurantId/', function(req, res){
		console.log(req.body)
		db.editRestaurant( req.params.restaurantId, req.body.name, req.body.image, req.body.description, res );
	});
	app.put('/edit/isenabled/restaurants/:restaurantId/', function(req, res){
		console.log(req.body)
		db.editRestaurantIsEnabled( req.params.restaurantId, req.body.isEnabled, res );
	});
	app.get('/restaurants/:restaurantId/categories/', function(req, res){
		db.fetchCategoriesforRestaurant(req.params.restaurantId, res)
	})
	app.get('/categories/:categoryId/', function(req, res){
		db.fetchCategoryDetails(req.params.categoryId, res)
	})
	app.get('/categories/:categoryId/menuItems/', function(req, res){
		db.fetchMenuItemsForCategory(req.params.categoryId, res)
	})
	app.delete('/categories/:categoryId/', function(req, res){
		db.removeCategory(req.params.categoryId, res)
	})
	app.put('/edit/categories/:categoryId/', function(req, res){
		console.log(req.body)
		db.editCategory(req.params.categoryId, req.body.name, req.body.restaurant_id, res)
	})
	app.post('/new/restaurants/:restaurantId/category', function(req, res){
		console.log(req.body)
		db.addCategory( req.body.name, req.params.restaurantId, res );
	});
	app.post('/new/categories/:categoryId/menuItem', function(req, res){
		console.log(req.body)
		db.addMenuItem( req.body.name, req.body.image, req.params.categoryId, req.body.description, req.body.price,  res );
	});
	app.put('/edit/menuItems/:menuItemId/', function(req, res){
		console.log(req.body)
		db.editMenuItem(req.params.menuItemId, req.body.name, req.body.image, req.body.description, req.body.price, res)
	})
	app.get('/menuItems/:menuItemId/', function(req, res){
		db.fetchMenuItemDetails(req.params.menuItemId, res)
	})
	app.delete('/menuItems/:menuItemId/', function(req, res){
		db.removeMenuItem(req.params.menuItemId, res)
	})
	
	app.post('/upload/restaurant/', upload1.single('file'), function(req, res, next){
		res.send({status: 'success', file : req.file})
		console.log('Upload Successful ', req.file);
	});
	app.post('/upload/menuItem/', upload2.single('file'), function(req, res, next){
		res.send({status: 'success', file : req.file})
		console.log('Upload Successful ', req.file);
	});

  }
};
