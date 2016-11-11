// READ!!! http://taoofcode.net/promise-anti-patterns/
// READ!!! http://raganwald.com/2014/07/09/javascript-constructor-problem.html
// READ!!! https://www.firebase.com/docs/web/guide/
// READ!!! https://www.firebase.com/blog/2016-01-21-keeping-our-promises.html
// READ!!! http://stackoverflow.com/questions/17015590/node-js-mysql-needing-persistent-connection
var Firebase = require("firebase");
var mysql = require("mysql");
var Q = require("q");
var moment = require('moment');
var options = {
  "host": process.env.MYSQL_HOST || "restokitch.com",
  "port": process.env.MYSQL_PORT || "3306",
  "user": process.env.MYSQL_USER || "restokit_foodbot",
  "password": process.env.MYSQL_PASSWORD || "foodbot@123",
  "database": process.env.MYSQL_DATABASE || "restokit_foodbot"
};

function Adapter() {
  if (this instanceof Adapter) {
    this.root = new Firebase(process.env.FIREBASE_URL || "https://glaring-heat-2025.firebaseio.com/");
    this.db = mysql.createPool(options);
  } else {
    return new Adapter();
  }
}


//get bot user on userid
Adapter.prototype.getBotUser = function(userId) {

  const query = "SELECT is_botactive " +
    "FROM bot_users " +
    "WHERE fb_id = " + this.db.escape(userId);

  var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, results) {
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(results);
        }
      });
    }
  });
  return deferred.promise;
}

//------------------------------------------------------------------------------
//insert a new record in bot_users table
Adapter.prototype.insertBotUser = function(userId) {

  const query = "INSERT INTO bot_users(fb_id,is_botactive)" +
    "VALUES(" + this.db.escape(userId) + ",'1')";

  var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, results) {
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(results);
        }
      });
    }
  });
  return deferred.promise;
}

//get user id from fb id.
Adapter.prototype.getUserId = function(userId) {

  const query = "Select id from bot_users where fb_id=" + this.db.escape(userId);

  var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, results) {
        console.log(query)
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(results);
        }
      });
    }
  });
  return deferred.promise;
}

//insert a new order in orders table
Adapter.prototype.insertNewOrder = function(userId, status) {
  var unix_time = moment().format('x');
  unix_time = unix_time / 1000;

  const query = "INSERT INTO orders(bot_user_id,status,created_date,last_modified_date)" +
    "VALUES(" + this.db.escape(userId) + "," + this.db.escape(status) + "," + this.db.escape(unix_time) + "," + this.db.escape(unix_time) + ")";

  var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, results) {
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(results);
        }
      });
    }
  });
  return deferred.promise;
}

// check for incomplete order from any user
Adapter.prototype.checkForIncompleteOrder = function(userId, status) {
  const query = 'Select orders.bot_user_id, orders.status, bot_users.fb_id FROM orders INNER JOIN bot_users ON orders.bot_user_id = bot_users.id WHERE bot_users.fb_id = ' + this.db.escape(userId) + ' AND orders.status =' + this.db.escape(status);
  var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, rows, fields) {

        // console.log("\n"+query+"\n")
        // console.log("========================results===================="  + JSON.stringify(rows[0])+ /*rows[0] +*/ '\n')
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(rows);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.fetchRestaurantsList = function() {
  const query = 'SELECT * FROM restaurants where isEnabled = 1';
  var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, result) {
        console.log("\n"+query+"\n")
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(result);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.fetchCategoriesForRestaurant = function(restaurantId) {
  const query = 'SELECT * FROM categories where restaurant_id = '+restaurantId;
  var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, result) {
        console.log("\n"+query+"\n")
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(result);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.fetchMenuItemsForCategories = function(categoryId) {
  const query = 'SELECT * FROM restokit_foodbot.menu_items WHERE category_id = '+categoryId;
  var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, rows, fields) {
        // console.log('Reading query')
        console.log("\n"+query+"\n")
        console.log("========================results===================="  + JSON.stringify(rows[0])+ /*rows[0] +*/ '\n')
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(rows);
        }
      });
    }
  });
  return deferred.promise;
}


Adapter.prototype.addItemsToCart = function(ItemId, OrderId) {
 var Quantity = 1;
  const query = 'INSERT INTO restokit_foodbot.cart (id, menu_item_id, quantity, order_id) VALUES (NULL,'+this.db.escape(ItemId)+', '+ this.db.escape(Quantity) +', '+this.db.escape(OrderId)+');';
  var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, rows, fields) {
        // console.log('Reading query')
        console.log("\n"+query+"\n")
        console.log("========================results===================="  + JSON.stringify(rows[0])+ /*rows[0] +*/ '\n')
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(rows);
        }
      });
    }
  });
  return deferred.promise;
}


Adapter.prototype.getOrderIdFromFbUserId = function(fbId) {
  var orderStatus = 0;
  const query = 'select orders.id from orders join bot_users ON orders.bot_user_id = bot_users.id where bot_users.fb_id = '+this.db.escape(fbId)+' and orders.status = '+orderStatus;
  var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, rows, fields) {
        // console.log('Reading query')
        console.log("\n"+query+"\n")
        console.log("========================results===================="  + JSON.stringify(rows[0])+ /*rows[0] +*/ '\n')
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(rows);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.getRestaurantIdFromMenuItemId  = function(MenuItemId){
  const query = 'SELECT distinct(categories.restaurant_id) FROM categories INNER JOIN menu_items ON categories.id = menu_items.category_id INNER JOIN cart ON menu_items.id = cart.menu_item_id WHERE cart.menu_item_id = '+MenuItemId
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, rows, fields) {
        // console.log('Reading query')
        console.log("\n"+query+"\n")
        console.log("========================results===================="  + JSON.stringify(rows[0])+ /*rows[0] +*/ '\n')
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(rows);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.getRestaurantIdFromCategoryId  = function(CategoryId){
  const query = 'SELECT categories.restaurant_id FROM categories WHERE categories.id = '+CategoryId;
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, rows, fields) {
        // console.log('Reading query')
        console.log("\n"+query+"\n")
        console.log("========================results===================="  + JSON.stringify(rows[0])+ /*rows[0] +*/ '\n')
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(rows);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.getMyCart  = function(OrderId){
  const query = 'SELECT cart.quantity, menu_items.id, menu_items.name, menu_items.image, menu_items.description, menu_items.price FROM cart JOIN menu_items on cart.menu_item_id = menu_items.id WHERE cart.order_id = '+OrderId;
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, rows, fields) {
        // console.log('Reading query')
        console.log("\n"+query+"\n")
        console.log("========================results===================="  + JSON.stringify(rows[0])+ /*rows[0] +*/ '\n')
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(rows);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.getCategoryIdFromMenuItemID  = function(MenuItemId){
  const query = 'SELECT menu_items.category_id FROM menu_items WHERE menu_items.id = '+MenuItemId;
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, rows, fields) {
        // console.log('Reading query')
        console.log("\n"+query+"\n")
        console.log("========================results===================="  + JSON.stringify(rows[0])+ /*rows[0] +*/ '\n')
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(rows);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.removeItemFromCart  = function(MenuItemId, OrderId){
  const query = 'DELETE FROM cart WHERE menu_item_id ='+MenuItemId + ' AND order_id = '+ OrderId;
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, rows, fields) {
        // console.log('Reading query')
        console.log("\n"+query+"\n")
        console.log("========================results===================="  + JSON.stringify(rows[0])+ /*rows[0] +*/ '\n')
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(rows);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.getCategoryIdFromFbUserId  = function(fbUserId){
  const query = 'select distinct(menu_items.category_id) from menu_items inner join cart ON cart.menu_item_id = menu_items.id inner join orders ON cart.order_id = orders.id inner join bot_users ON orders.bot_user_id = bot_users.id Where bot_users.fb_id = '+ fbUserId +' and orders.status = 0';
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, rows, fields) {
        // console.log('Reading query')
        console.log("\n"+query+"\n")
        console.log("========================results===================="  + JSON.stringify(rows[0])+ /*rows[0] +*/ '\n')
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(rows);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.emptyCart  = function(OrderId){
  const query = 'DELETE FROM cart WHERE order_id = '+ OrderId;
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, rows, fields) {
        // console.log('Reading query')
        console.log("\n"+query+"\n")
        console.log("========================results===================="  + JSON.stringify(rows[0])+ /*rows[0] +*/ '\n')
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(rows);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.getCheckoutDetails  = function(fbUserId){
  const query = 'SELECT cart.menu_item_id AS menu_item_id, menu_items.name AS name, cart.quantity AS quantity, menu_items.price AS price, (menu_items.price * quantity) AS amount, restaurants.id AS restaurant_id, restaurants.name AS restaurant_name, restaurants.image AS restaurant_image, restaurants.description AS restaurant_subtitle, bot_users.fb_id AS fb_id FROM orders INNER JOIN bot_users  ON bot_users.id = orders.bot_user_id INNER JOIN cart  ON cart.order_id = orders.id INNER JOIN menu_items ON cart.menu_item_id = menu_items.id INNER JOIN categories ON menu_items.category_id = categories.id INNER JOIN restaurants ON categories.restaurant_id = restaurants.id WHERE bot_users.fb_id = '+ fbUserId +' AND orders.status = 0'
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, rows, fields) {
        // console.log('Reading query')
        console.log("\n"+query+"\n")
        console.log("========================results===================="  + JSON.stringify(rows[0])+ /*rows[0] +*/ '\n')
        connection.release();
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(rows);
        }
      });
    }
  });
  return deferred.promise;
}





Adapter.prototype.fetchRestaurantDetails = function(restaurantId, res) {
  const query = 'SELECT * FROM restaurants where restaurants.id = '+restaurantId;
  var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, rows, fields) {
        // console.log('Reading query')
        console.log("\n"+query+"\n")
        // console.log("========================results===================="  + JSON.stringify(rows[0])+ /*rows[0] +*/ '\n')
        connection.release();
        if (err) {
			res.send({ status: 1, message: err });
          deferred.reject(err);
        } else {
			res.send(rows);
          deferred.resolve(rows);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.addRestaurant = function(name, image, description, res) {
	
  const query = 'INSERT INTO restaurants (name, image, description) VALUES ('+
				this.db.escape(name)+', '+ this.db.escape(image) +', '+this.db.escape(description)+');'
	console.log(query)
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, result) {
        connection.release();
        console.log(query);
        if (err) {
		res.send({ status: 'error', message: err });
          deferred.reject(err);
        } else {
		res.send({ status: 'success', insertId: result.insertId, restaurant: {name: name, image: image, description: description} });
          deferred.resolve(result);
        }
      });
    }
  })
  return deferred.promise;
}

Adapter.prototype.editRestaurant = function(id, name, image, description, res) {
	//UPDATE  restokit_foodbot.restaurants SET  image =  'vg' WHERE  restaurants.id =10;
  const query = 'UPDATE  restokit_foodbot.restaurants SET name = '+this.db.escape(name)+', image = '+ this.db.escape(image) +', description ='+this.db.escape(description)+' WHERE restaurants.id = ' + id;
	console.log(query)
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, result) {
        connection.release();
        console.log(query);
        if (err) {
		res.send({ status: 'error', message: err });
          deferred.reject(err);
        } else {
		res.send({ status: 'success', message: 'Restaurant Updated', restaurant: {name: name, image: image, description: description} });
          deferred.resolve(result);
        }
      });
    }
  })
  return deferred.promise;
}


Adapter.prototype.editRestaurantIsEnabled = function(id, isEnabled, res) {
  const query = 'UPDATE restaurants SET isEnabled = '+ isEnabled + ' WHERE restaurants.id = ' + id;
	console.log(query)
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, result) {
        connection.release();
        console.log(query);
        if (err) {
		res.send({ status: 'error', message: err });
          deferred.reject(err);
        } else {
		res.send({ status: 'success', message: 'Restaurant Updated', isEnabled: isEnabled });
          deferred.resolve(result);
        }
      });
    }
  })
  return deferred.promise;
}

Adapter.prototype.fetchMenuItemsForCategory = function(categoryId, res) {
  const query = 'SELECT * FROM restokit_foodbot.menu_items WHERE category_id = '+categoryId;
  var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, result) {
        // console.log('Reading query')
        console.log("\n"+query+"\n")
        console.log("========================results===================="  + JSON.stringify(result[0])+ '\n')
        connection.release();
        if (err) {
			res.send({status: 'error', message: err})
			deferred.reject(err);
        } else {
			res.send(result)
			deferred.resolve(result);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.fetchRestaurants = function(res) {
  const query = 'SELECT * FROM restaurants';
  var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, result) {
        // console.log('Reading query')
        console.log("\n"+query+"\n")
        // console.log("========================results===================="  + JSON.stringify(rows[0])+ /*rows[0] +*/ '\n')
        connection.release();
        if (err) {
			res.send({ status: 'error', message: err });
          deferred.reject(err);
        } else {
			res.send(result);
          deferred.resolve(result);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.fetchCategoriesforRestaurant = function(restaurantId, res) {
  const query = 'SELECT * FROM categories where restaurant_id = '+restaurantId;
  var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, result) {
        // console.log('Reading query')
        console.log("\n"+query+"\n")
        // console.log("========================results===================="  + JSON.stringify(rows[0])+ /*rows[0] +*/ '\n')
        connection.release();
        if (err) {
		res.send({ status: 'error', message: err });
          deferred.reject(err);
        } else {
		res.send(result);
          deferred.resolve(result);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.fetchCategoryDetails = function(categoryId, res) {
  const query = 'SELECT * FROM categories where id = '+categoryId ;
  var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, result) {
        console.log("\n"+query+"\n")
        connection.release();
        if (err) {
		res.send({ status: 'error', message: err });
          deferred.reject(err);
        } else {
		res.send(result);
          deferred.resolve(result);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.removeCategory = function(categoryId, res){
  const query = 'DELETE FROM categories WHERE id = '+categoryId;
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, result) {
        console.log("\n"+query+"\n")
        console.log("========================results===================="  + JSON.stringify(result) + '\n')
        connection.release();
        if (err) {
			res.send({ status: 'error', message: err });
            deferred.reject(err);
        } else {
			res.send({ status: 'success', message: 'Category deleted' });
            deferred.resolve(result);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.editCategory = function(id, name, restaurant_id, res) {
  const query = 'UPDATE categories SET name = '+this.db.escape(name) + ' , image = "http://s3.amazonaws.com/saveoneverything_assets/assets/images/icons/food_dining_icon.png", restaurant_id = '+this.db.escape(restaurant_id)+' WHERE id = '+id;
	console.log(query)
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, result) {
        connection.release();
        console.log(query);
        if (err) {
		res.send({ status: 'error', message: err });
          deferred.reject(err);
        } else {
		res.send({ status: 'success', message: 'Category Updated', category: {id: id, name: name, restaurant_id: restaurant_id} });
          deferred.resolve(result);
        }
      });
    }
  })
  return deferred.promise;
}

Adapter.prototype.addCategory = function( name, restaurant_id, res) {
	
  const query = 'INSERT INTO categories (name, image, restaurant_id) VALUES ('+
				this.db.escape(name)+', "http://s3.amazonaws.com/saveoneverything_assets/assets/images/icons/food_dining_icon.png" , '+ restaurant_id+');'
	console.log(query)
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, result) {
        connection.release();
        console.log(query);
        if (err) {
		res.send({ status: 'error', message: err });
          deferred.reject(err);
        } else {
		res.send({ status: 'success', insertId: result.insertId, category: {name: name} });
          deferred.resolve(result);
        }
      });
    }
  })
  return deferred.promise;
}

Adapter.prototype.addMenuItem = function( name, image, category_id, description, price, res) {
	
  const query = 'INSERT INTO menu_items (name, image, category_id, description, price) VALUES ('+
					this.db.escape(name) + ', ' + this.db.escape(image) + ', ' + category_id + ', ' + 
					this.db.escape(description) + ', ' + price + ');'
	console.log(query)
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, result) {
        connection.release();
        console.log(query);
        if (err) {
		res.send({ status: 'error', message: err });
          deferred.reject(err);
        } else {
		res.send({ status: 'success', insertId: result.insertId, menuItem: {name: name, image: image, category_id: category_id, description: description, price:price } });
          deferred.resolve(result);
        }
      });
    }
  })
  return deferred.promise;
}

Adapter.prototype.editMenuItem = function(id, name, image, description, price, res) {
  const query = 'UPDATE menu_items SET name = '+this.db.escape(name)+', image = ' + this.db.escape(image) + ', description =' + this.db.escape(description) + 
						', price = '+ price +' WHERE id = ' + id;
	console.log(query)
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, result) {
        connection.release();
        console.log(query);
        if (err) {
		res.send({ status: 'error', message: err });
          deferred.reject(err);
        } else {
		res.send({ status: 'success', message: 'Menu_items Updated', menu_items: {id: id, name: name, image: image, description: description, price: price } });
          deferred.resolve(result);
        }
      });
    }
  })
  return deferred.promise;
}

Adapter.prototype.fetchMenuItemDetails = function(menuItemId, res) {
  const query = 'SELECT * FROM menu_items where id = '+menuItemId ;
  var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, result) {
        console.log("\n"+query+"\n")
        connection.release();
        if (err) {
		res.send({ status: 'error', message: err });
          deferred.reject(err);
        } else {
		res.send(result);
          deferred.resolve(result);
        }
      });
    }
  });
  return deferred.promise;
}

Adapter.prototype.removeMenuItem = function(menuItemId, res){
  const query = 'DELETE FROM menu_items WHERE id = ' + menuItemId;
   var deferred = Q.defer();
  this.db.getConnection(function(err, connection) {
    if (err) {
      deferred.reject(err);
    } else {
      connection.query(query, [], function(err, result) {
        console.log("\n"+query+"\n")
        console.log("========================results===================="  + JSON.stringify(result) + '\n')
        connection.release();
        if (err) {
			res.send({ status: 'error', message: err });
            deferred.reject(err);
        } else {
			res.send({ status: 'success', message: 'Menu Item deleted' });
            deferred.resolve(result);
        }
      });
    }
  });
  return deferred.promise;
}



module.exports = Adapter;



//------------------------------------------------------------------------------
//update the status of user in bot_users table
// Adapter.prototype.updateUserStatus = function(userId,is_botactive){

//     const query = "UPDATE bot_users SET is_botactive =" +
//                    this.db.escape(is_botactive)+ " where user_id ="+this.db.escape(userId);

//     var deferred = Q.defer();
//     this.db.getConnection(function(err,connection){
//         if(err){
//             deferred.reject(err);
//         }else{
//             connection.query(query,[],function(err,results){
//                 connection.release();
//                 if(err){
//                     deferred.reject(err);
//                 }else{
//                     deferred.resolve(results);
//                 }
//             });
//         }
//     });
//     return deferred.promise;
// }


//------------------------------------------------------------------------------
// Adapter.prototype.getMessagesOfType = function(type){
//     var query = this.root.child("messages").child(type);
//     return query.once("value").then(function(snapshot){
//         return snapshot.val();
//     },function(err){
//         console.log("[Adapter.js getmessageOfType]",error);
//     });
// }
//------------------------------------------------------------------------------
// Adapter.prototype.getItemsForSubcategory = function(subcat) {
//     subcat = "%" + subcat + "%";
//     const query = "SELECT p.ID AS id, p.post_title AS title, " +
//                   "p.post_excerpt AS excerpt FROM bn_term_relationships r " +
//                   "INNER JOIN bn_posts p ON p.ID = r.object_id " +
//                   "INNER JOIN bn_terms t ON t.term_id = r.term_taxonomy_id " +
//                   "WHERE LOWER(t.name) LIKE @subcat AND post_status='publish' " +
//                   "ORDER BY RAND()" +
//                   "LIMIT 10 ";
//     var newQuery = query.replace("@subcat",this.db.escape(subcat));
//     var deferred = Q.defer();
//     this.db.getConnection(function(err,connection){
//         if(err){
//             deferred.reject(err);
//         }else{
//             connection.query(newQuery,[],function(err,results){
//                 connection.release();
//                 if(err){
//                     deferred.reject(err);
//                 }else{
//                     deferred.resolve(results);
//                 }
//             });
//         }
//     });
//     return deferred.promise;
// };
//------------------------------------------------------------------------------
// Adapter.prototype.getIconFor = function(id) {
//     const path = "http://www.babun.io/wp-content/uploads/";

//     const query = "SELECT meta_value as path " + 
//                   "FROM bn_postmeta " + 
//                   "WHERE post_id in " +
//                     "(SELECT meta_value FROM bn_postmeta WHERE post_id=@id AND meta_key='app_icon') " +  
//                   "AND meta_key='_wp_attached_file'";
//     var newQuery = query.replace("@id",id);
//     var deferred = Q.defer();
//     this.db.getConnection(function(err,connection){
//         if(err){
//             deferred.reject(err);
//         }else{
//             connection.query(newQuery,[],function(err,results){
//                 connection.release();
//                 if(err){
//                     deferred.reject(err);
//                 }else{
//                     if(!results || results.length == 0 ){
//                         //return "http://www.babun.io/wp-content/uploads/2016/03/BabunMetaPic-1.png"
//                      deferred.resolve("http://www.babun.io/wp-content/uploads/2016/03/BabunMetaPic-1.png");
//                     }else{
//                         deferred.resolve(path + results[0].path);
//                     }
//                 }
//             });
//         }
//     });
//     return deferred.promise;
// };
//------------------------------------------------------------------------------
// Adapter.prototype.getExcerptFor = function(id){
//     const query = "SELECT post_excerpt as excerpt " +
//                   "FROM bn_posts " +
//                   "WHERE ID = " + this.db.escape(id);
//     var deferred = Q.defer();
//     this.db.getConnection(function(err,connection){
//         if(err){
//             deferred.reject(err);
//         }else{
//             connection.query(query,[],function(err,results){
//                 connection.release();
//                 if(err){
//                     deferred.reject(err);
//                 }else{
//                     deferred.resolve(results);
//                 }
//             });
//         }
//     });
//     return deferred.promise;
// }

//------------------------------------------------------------------------------
//insert a new record in bn_cf7dbplugin_submits table
//moment().format();

// Adapter.prototype.insertToolTo = function(toolname,website,description,email){
//  var unix_time =moment().format('x');
//  unix_time=unix_time/1000;
//  //console.log("moment unix time",unix_time);
//     const query = "INSERT INTO bn_cf7dbplugin_submits(submit_time,form_name,field_name,field_value,field_order)" +
//                   "VALUES(" + this.db.escape(unix_time)+",'Submit a Tool','Whatisthename'," + this.db.escape(toolname) + ",'0')," +
//                "(" + this.db.escape(unix_time)+",'Submit a Tool','Whatisthewebsite'," + this.db.escape(website) + ",'1')," +
//                "(" + this.db.escape(unix_time)+",'Submit a Tool','Provideashort'," + this.db.escape(description) + ",'2')," +
//                "(" + this.db.escape(unix_time)+",'Submit a Tool','Whatisyouremail'," + this.db.escape(email) + ",'3')";

//     var deferred = Q.defer();
//     this.db.getConnection(function(err,connection){
//         if(err){
//             deferred.reject(err);
//         }else{
//             connection.query(query,[],function(err,results){
//                 connection.release();
//                 if(err){
//                     deferred.reject(err);
//                 }else{
//                     deferred.resolve(results);
//                 }
//             });
//         }
//     });
//     return deferred.promise;
// }
//------------------------------------------------------------------------------
//insert a new record in bn_cf7dbplugin_submits table

// Adapter.prototype.insertToolToDevelopment = function(devtoolname,devtoolemail,devtooladvance,devtoolplatform,devtooldeadline,devtoolbudget,devtooldesc){
//  var unix_time =moment().format('x');
//  unix_time=unix_time/1000;
//  //console.log("moment unix time",unix_time);
//     const query = "INSERT INTO bn_cf7dbplugin_submits(submit_time,form_name,field_name,field_value,field_order)" +
//                   "VALUES(" + this.db.escape(unix_time)+",'Development','Whatisthename'," + this.db.escape(devtoolname) + ",'0')," +
//                "(" + this.db.escape(unix_time)+",'Development','youremail'," + this.db.escape(devtoolemail) + ",'1')," +
//                "(" + this.db.escape(unix_time)+",'Development','whatisthewebsite'," + this.db.escape(devtooladvance) + ",'2')," +
//                "(" + this.db.escape(unix_time)+",'Development','platform'," + this.db.escape(devtoolplatform) + ",'3'),"+
//                "(" + this.db.escape(unix_time)+",'Development','platformotht','','4'),"+
//                "(" + this.db.escape(unix_time)+",'Development','timeframe'," + this.db.escape(devtooldeadline) + ",'5'),"+
//                "(" + this.db.escape(unix_time)+",'Development','budget'," + this.db.escape(devtoolbudget) + ",'6'),"+
//                "(" + this.db.escape(unix_time)+",'Development','describe'," + this.db.escape(devtooldesc) + ",'7'),"+
//                "(" + this.db.escape(unix_time)+",'Development','Submitted From','BabunBot','10000')";

//     var deferred = Q.defer();
//     this.db.getConnection(function(err,connection){
//         if(err){
//             deferred.reject(err);
//         }else{
//             connection.query(query,[],function(err,results){
//                 connection.release();
//                 if(err){
//                     deferred.reject(err);
//                 }else{
//                     deferred.resolve(results);
//                 }
//             });
//         }
//     });
//     return deferred.promise;
// }
//------------------------------------------------------------------------------
