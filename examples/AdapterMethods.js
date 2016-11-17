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
     	// console.log(result)
       return result;
     }, function(error) {
       console.error('Error fetching id ' + GroupId)
     })
 }


 module.exports = new AdapterMethods();
