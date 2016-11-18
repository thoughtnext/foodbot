 var Adapter = require("./Adapter");
 var db = new Adapter();


 var AdapterMethods = function() {};

 AdapterMethods.prototype.FetchGroupsList = function(fbUserID) {
   return db.fetchGroupsList(fbUserID)
     .then(function(result) {
       return result;
     }, function(error) {
       console.error('Error fetching groups for this user : ' + fbUserID)
     })
 }

 AdapterMethods.prototype.CreateNewGroupOrder = function(GroupId) {
   return db.insertNewGroupOrder(GroupId)
     .then(function(result) {
       return result;
     }, function(error) {
       console.error('Error fetching group Id : ' + GroupId)
     })
 }

 AdapterMethods.prototype.FetchRestaurantsList = function() {
   return db.fetchRestaurantsList()
     .then(function(result) {
       // console.log(result)
       return result;
     }, function(error) {
       console.error('Error fetching restaurants')
     })
 }

 AdapterMethods.prototype.GetGroupId = function(GroupId) {
   return db.getGroupId(GroupId)
     .then(function(result) {
       return result;
     }, function(error) {
       console.error('Error fetching id ' + GroupId)
     })
 }

 AdapterMethods.prototype.FetchCategoriesForRestaurant = function(RestaurantId) {
   return db.fetchCategoriesForRestaurant(RestaurantId)
     .then(function(result) {
       console.log(result)
       return result;
     }, function(error) {
       console.log('\nError in fetching Categories for Restaurants: ' + error)
     })
 }

 AdapterMethods.prototype.FetchMenuItemsForCategories = function(CategoryId) {
   return db.fetchMenuItemsForCategories(CategoryId)
     .then(function(result) {
       return result;
     }, function(error) {
       console.log('\nError in fetching Menu Items for Categories: ' + error)
     })
 }
 
 AdapterMethods.prototype.AddItemsToGroupCart = function(MenuItemId, GroupOrderId) {
   return db.addItemsToGroupCart(MenuItemId, GroupOrderId)
     .then(function(result) {
       return result;
     }, function(error) {
       console.error('Error fetching group Id : ' + GroupId)
     })
 }

 module.exports = new AdapterMethods();
