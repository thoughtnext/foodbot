(function() {
  "use strict";
  var Adapter = require("./Adapter");
  var db = new Adapter();
  const fb = require("./fb");
  var AdapterMethods = require('./AdapterMethods.js');
  var constants = require("./payload");

  // var baseUrl = "https://3ecdcaa2.ngrok.io/"
  var baseUrl = "https://foodbotgroup.herokuapp.com/"

  function Implementation() {
    var fetchGroupsList = function(fbUserID) {
      var id = fbUserID
      return AdapterMethods.FetchGroupsList(fbUserID)
        .then(function(result) {
          var groups = result
          console.log(groups.length)
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
              })
              // .then(function() {
              //   return db.getUserId(fbUserID)
              // })
              .then(function() {
                var msg = 'You wanna do something else ?'
                return WhenNoGroupOptions(msg, fbUserID)
              })

          } else {
            console.log('No result')
            return db.getUserId(fbUserID)
              .then(function() {
                var msg = 'You do not have any groups. What do you wanna do now ?'
                return WhenNoGroupOptions(msg, fbUserID)
              })
          }
        })
    }

    var WhenNoGroupOptions = function(msg, fbUserID) {
      var qr = fb.createQuickReply('Create New Group', constants.G_CREATE_NEW_GROUP)
      var qr1 = fb.createQuickReply('Join a Group', constants.G_JOIN_GROUP)
        // var wvBtn = fb.createWebViewButton('https://aaea84ee.ngrok.io?fb_id=' + fbUserID + '&user_id=' + result[0].id, 'CREATE NEW GROUP', 'compact')
      var message = fb.quickReplyMessage(msg, [qr1, qr])
        // var message = fb.buttonMessage('You do not have any groups. Do you want to create a new one ?', [wvBtn])
      return fb.reply(message, fbUserID)
    }

    var CreateNewGroup = function(fbUserID) {
      db.getUserId(fbUserID)
        .then(function(result) {
          var wvBtn = fb.createWebViewButton(baseUrl + '?fb_id=' + fbUserID + '&user_id=' + result[0].id + '&action=create', 'Create New Group', 'compact')
          var message = fb.buttonMessage('Click on this button for creating new group', [wvBtn])
          return fb.reply(message, fbUserID)
        })
    }
    var JoinGroup = function(fbUserID) {
      db.getUserId(fbUserID)
        .then(function(result) {
          var wvBtn = fb.createWebViewButton(baseUrl + '?fb_id=' + fbUserID + '&user_id=' + result[0].id + '&action=join', 'Join Group', 'compact')
          var message = fb.buttonMessage('Click on this button for joining an existing group', [wvBtn])
          return fb.reply(message, fbUserID)
        })
    }

    var createNewGroupOrder = function(GroupId, fbUserID) {
      return AdapterMethods.CreateNewGroupOrder(GroupId)
        .then(function(result) {
          var GroupOrderId = result.insertId
          return fetchRestaurantsList(GroupOrderId, fbUserID)
        })
    }

    var fetchRestaurantsList = function(GroupOrderId, fbUserID) {
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
    }
    var fetchCategoriesforRestaurant = function(fbUserID, RestaurantId, GroupOrderId) {
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
    }
    var getMenuItemsForCategory = function(fbUserID, CategoryId, GroupOrderId) {
      console.log(fbUserID, CategoryId, GroupOrderId)
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
        .then(function() {
          moreOptionsForGroup(fbUserID, CategoryId, GroupOrderId)
        })
    }
    var addItemsToGroupCart = function(fbUserID, MenuItemId, GroupOrderId) {
      return AdapterMethods.AddItemsToGroupCart(MenuItemId, GroupOrderId)
        .then(function(result) {
          var CartId = result.insertId
          console.log(CartId)
          var message = fb.textMessage('Item added to the group cart successfully')
          return fb.reply(message, fbUserID)
        })
        .then(function() {
          return moreOptionsForGroup(fbUserID, MenuItemId, GroupOrderId)
        })
    }
    var sendSuccessForAddNewGroup = function(fbUserID, groupName, password) {
      var message = fb.textMessage('You have successfully created a new group ')
      return fb.reply(message, fbUserID)
        .then(function() {
          var message = fb.textMessage('Group name - ' + groupName + '\nPIN - ' + password)
          return fb.reply(message, fbUserID)
        })
        .then(function() {
          return fetchGroupsList(fbUserID)
        })
    }
    var sendSuccessForJoinGroup = function(fbUserID, groupName) {
      var message = fb.textMessage('You have successfully joined the group ' + groupName)
      return fb.reply(message, fbUserID)
        .then(function() {
          return fetchGroupsList(fbUserID)
        })
    }
    var sendFailureForJoinGroup = function(fbUserID, groupName) {
      var message = fb.textMessage('You are already a part of the group ' + groupName)
        // var message = fb.textMessage('You are already a part of the group '+groupName)
      return fb.reply(message, fbUserID)
        .then(function() {
          return fetchGroupsList(fbUserID)
        })
    }
    var takeUserInputForGroupName = function(fbUserID) {}

    var moreOptionsForGroup = function(fbUserID, CategoryId, GroupOrderId) {
      console.log(fbUserID, CategoryId, GroupOrderId)
      console.log('moreOptionsForGroup ' + CategoryId)
      var addMoreItems = fb.createQuickReplies('Add More Items', constants.G_ADD_MORE_ITEMS + '-' + CategoryId + '-' + GroupOrderId, 'http://2.bp.blogspot.com/-p7kHEStlgx0/Vo9rfkeyrwI/AAAAAAAAI5s/_kJ_rZ6CU4U/s1600/Bubble%2BPng%2B5.png');
      var checkout = fb.createQuickReplies('Checkout', constants.G_CHECKOUT, 'http://2.bp.blogspot.com/-p7kHEStlgx0/Vo9rfkeyrwI/AAAAAAAAI5s/_kJ_rZ6CU4U/s1600/Bubble%2BPng%2B5.png');
      var myCart = fb.createQuickReplies('Group Cart', constants.G_CART + '-' + GroupOrderId, 'http://2.bp.blogspot.com/-p7kHEStlgx0/Vo9rfkeyrwI/AAAAAAAAI5s/_kJ_rZ6CU4U/s1600/Bubble%2BPng%2B5.png');

      var quickReplies = [addMoreItems, checkout, myCart];
      var message = fb.quickReplyMessage('Other Options', quickReplies);
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
    }

    var showGroupCart = function(GroupOrderId, fbUserID) {
      var mId;
      db.getGroupCart(GroupOrderId)
        .then(function(result) {
          if (result.length != 0) {
            var elements = [];
            for (var i = 0; i < result.length; i++) {
              elements[i] = {
                title: result[i].name + ' - $' + result[i].price,
                image_url: result[i].image,
                subtitle: result[i].description,
                buttons: [{ type: 'postback', payload: 'G_REMOVE_ITEM-' + result[i].id + '-' + GroupOrderId, title: 'Remove from Cart' }]
              }
            }
            mId = result[0].id
            console.log(mId)
            console.log(elements)
            var message = fb.carouselMessage(elements);
            return fb.reply(message, fbUserID)
              .then(function() {
                console.log('hi')
                console.log(mId)
                return db.getCategoryIdFromMenuItemID(mId)
              })
              .then(function(result) {
                console.log('\nCategory id ' + result[0].category_id);
                var CategoryId = result[0].category_id;
                return moreOptionsForGroup(fbUserID, CategoryId, GroupOrderId)
              })
          } else {
            var message = fb.textMessage('Your group cart is empty')
            return fb.reply(message, fbUserID)
              .then(function() {
                return fetchRestaurantsList(GroupOrderId, fbUserID)
              })
          }
        })

    }

    var startOrdering = function(fbUserID) {
      var image1 = "http://s3.amazonaws.com/saveoneverything_assets/assets/images/icons/food_dining_icon.png";
      var image2 = "http://www.tastelikehome.co.za/wp-content/uploads/2015/10/cpg-foods-icon.png";
      var qr1 = fb.createQuickReplies("Only You", "individual", image1);
      var qr2 = fb.createQuickReplies("Groups", "group", image2);
      var qr = [qr1, qr2];
      var message = fb.quickReplyMessage("You want to order for ", qr);
      fb.reply(message, fbUserID)
    }

    var editGroupOrder = function(GroupId, fbUserID) {
      return db.getGroupOrderIdFromGroupId(GroupId)
        .then(function(result) {
          console.log(result[0].id)
          var GroupOrderId = result[0].id
          return showGroupCart(GroupOrderId, fbUserID)
        })
    }


    var removeItemFromGroupCart = function(MenuItemId, GroupOrderId, fbUserID) {
      return db.removeItemFromGroupCart(MenuItemId, GroupOrderId)
        .then(function() {
          console.log('\nItem removed successfully\n')
          var message = fb.textMessage('Item removed successfully')
          return fb.reply(message, fbUserID)
        })
        .then(function() {
          return db.getCategoryIdFromMenuItemID(MenuItemId)
        })
        .then(function(result) {
          console.log('\nCategory id ' + result[0].category_id);
          var CategoryId = result[0].category_id;
          return moreOptionsForGroup(fbUserID, CategoryId, GroupOrderId)
        })
    }

    return {
      sendSuccessForAddNewGroup: sendSuccessForAddNewGroup,
      addItemsToGroupCart: addItemsToGroupCart,
      fetchGroupsList: fetchGroupsList,
      createNewGroupOrder: createNewGroupOrder,
      fetchCategoriesforRestaurant: fetchCategoriesforRestaurant,
      getMenuItemsForCategory: getMenuItemsForCategory,
      takeUserInputForGroupName: takeUserInputForGroupName,
      JoinGroup: JoinGroup,
      CreateNewGroup: CreateNewGroup,
      sendSuccessForJoinGroup: sendSuccessForJoinGroup,
      sendFailureForJoinGroup: sendFailureForJoinGroup,
      showGroupCart: showGroupCart,
      moreOptionsForGroup: moreOptionsForGroup,
      editGroupOrder: editGroupOrder,
      startOrdering: startOrdering,
      removeItemFromGroupCart: removeItemFromGroupCart
    }
  }

  module.exports = new Implementation();
})()
