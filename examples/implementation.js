(function() {
  "use strict";
  var Adapter = require("./Adapter");
  var db = new Adapter();
  const fb = require("./fb");
  var AdapterMethods = require('./AdapterMethods.js');
  var constants = require("./payload");

  function Implementation() {
    this.fetchGroupsList = function(fbUserID) {
        var id = fbUserID
        return AdapterMethods.FetchGroupsList(fbUserID)
          .then(function(result) {
            var groups = result
            if (groups.length > 0) {
              var elements = [];
              return Promise.all(groups.map(function(result) {
                  var group = result
                  return AdapterMethods.GetGroupId(group.group_id)
                    .then(function(data) {

                      var button = {};
                      var element = {}
                      if (data.result.count == 0) {
                        button = { type: 'postback', payload: constants.G_CREATE_NEW_GROUP_ORDER + '-' + group.group_id, title: 'Create a Group Order' }
                        element = { title: data.result.name, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Small-city-symbol.svg/348px-Small-city-symbol.svg.png", subtitle: '', buttons: [button, { "type": "element_share" }] }
                      } else {
                        button = { type: 'postback', payload: constants.G_EDIT_GROUP_ORDER + '-' + group.group_id, title: 'Edit Group Order' }
                        element = { title: data.result.name, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Small-city-symbol.svg/348px-Small-city-symbol.svg.png", subtitle: '', buttons: [button, { "type": "element_share" }] }
                      }
                      elements.push(element)
                    })
                }))
                .then(function() {
                  var message = fb.carouselMessage(elements);
                  console.log(elements)
                  return fb.reply(message, id)
                    .then(() => null)
                    .catch((err) => {
                      console.error(
                        'Oops! An error occurred while forwarding the response to fbUserID',
                        id,
                        ':',
                        err.stack || err
                      );
                    });

                  console.log(message)
                })
                .then(function() {

                  // More Options After Displaying or clicking of menu items 
                  var createNewGroup = fb.createQuickReplies('Create New Group', constants.G_CREATE_NEW_GROUP , 'http://www.babun.io/wp-content/uploads/2016/03/BabunMetaPic-1.png');

                  var quickReplies = [createNewGroup];
                  console.log(quickReplies)
                  var message = fb.quickReplyMessage('More Options', quickReplies);
                  return fb.reply(message, fbUserID)
                    .then(() => null)
                    .catch((err) => {
                      console.error(
                        'Oops! An error occurred while forwarding the response to fbUserID',
                        fbUserID,
                        ':',
                        err.stack || err
                      );
                    })
                })
            } else {
              console.log('No result')
            }
          })
      },
      this.createNewGroupOrder = function(GroupId, fbUserID) {
        return AdapterMethods.CreateNewGroupOrder(GroupId)
          .then(function(result) {
            var GroupOrderId = result.insertId
            return AdapterMethods.FetchRestaurantsList()
              .then(function(result) {
                if (result.length > 0 && result.length < 11) {
                  var elements = []
                  for (var i = 0; i < result.length; i++) {
                    elements[i] = { title: result[i].name, image_url: result[i].image, subtitle: result[i].description, buttons: [{ type: 'postback', payload: constants.G_RESTAURANT_SELECTED + '-' + result[i].id + '-' + GroupOrderId, title: 'Select Restaurant' }] }
                  }
                  var message = fb.carouselMessage(elements);
                  console.log(JSON.stringify(message))
                  return fb.reply(message, fbUserID)
                    .then(() => null)
                    .catch((err) => {
                      console.error(
                        'Oops! An error occurred while forwarding the response to fbUserID',
                        fbUserID,
                        ':',
                        err.stack || err
                      );
                    });
                } else {
                  console.log('No Restaurants listed')
                }
              })
          })
      },
      this.fetchCategoriesforRestaurant = function(fbUserID, RestaurantId, GroupOrderId) {
        return AdapterMethods.FetchCategoriesForRestaurant(RestaurantId)
          .then(function(result) {
            console.log('\nResults ' + JSON.stringify(result[0]));
            var quickReplies = [];
            for (var i = 0; i < result.length; i++) {
              var tempQR = fb.createQuickReplies(result[i].name, constants.G_CATEGORY_SELECTED + '-' + result[i].id + '-' + GroupOrderId, result[i].image);
              quickReplies[i] = tempQR;
            }
            var message = fb.quickReplyMessage('Select a Category', quickReplies)
            return fb.reply(message, fbUserID)
              .then(() => null)
              .catch((err) => {
                console.error(
                  'Oops! An error occurred while forwarding the response to fbUserID',
                  fbUserID,
                  ':',
                  err.stack || err
                );
              });
          })
      },
      this.getMenuItemsForCategory = function(fbUserID, CategoryId, GroupOrderId) {
        return AdapterMethods.FetchMenuItemsForCategories(CategoryId)
          .then(function(result) {
            if (result.length != 0) {
              var elements = [];
              for (var i = 0; i < result.length; i++) {
                elements[i] = { title: result[i].name + ' - $' + result[i].price, image_url: result[i].image, subtitle: result[i].description, buttons: [{ type: 'postback', payload: constants.G_ADD_TO_CART + '-' + result[i].id + '-' + GroupOrderId, title: 'Add to Cart' }] }
              }
              var message = fb.carouselMessage(elements);
              return fb.reply(message, fbUserID)
                .then(() => null)
                .catch((err) => {
                  console.error(
                    'Oops! An error occurred while forwarding the response to fbUserID',
                    fbUserID,
                    ':',
                    err.stack || err
                  );
                });
            } else {
              console.log('No menu items selected');
            }
          })
      },
      this.addItemsToGroupCart = function(fbUserID, MenuItemId, GroupOrderId) {
        return AdapterMethods.AddItemsToGroupCart(MenuItemId, GroupOrderId)
          .then(function(result) {
            var CartId = result.insertId
            console.log(CartId)
          })
      }
  }
  module.exports = new Implementation();
})()




// function addItemsToCart(fbUserID, MenuItemId) {
//   // var fb_ID = sessions[fbUserID].fbid;
//   console.log(fbUserID)
//   console.log(MenuItemId)
//     // get orderId from Menu Id that is passed from Menu Item selected
//     // for adding items to cart
//     // then 
//     // add the item to cart
//     // if error is generated, send a message to fb user 
//   return GetOrderIdFromFbUserId(fbUserID)
//     .then(function(result) {
//       if (result.length != 0) {
//         console.log('result ' + result[0].id);
//         var OrderId = result[0].id;
//         return AddItemsToCart(MenuItemId, OrderId)
//           .then(function() {
//             console.log('\nItem added successfully\n')
//             var message = fb.textMessage('Item added successfully')
//             return fb.reply(message, fbUserID)
//           })
//       } else {
//         var message = fb.textMessage('You have not created any order')
//         fb.reply(message, fbUserID)
//           // add further code
//       }
//     })
//     .then(function() {
//       return GetRestaurantIdFromMenuItemId(MenuItemId)
//     })
// }
