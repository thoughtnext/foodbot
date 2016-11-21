(function() {
  "use strict";

  // Messenger API integration example
  // We assume you have:
  // * a Wit.ai bot setup (https://wit.ai/docs/quickstart)
  // * a Messenger Platform setup (https://developers.facebook.com/docs/messenger-platform/quickstart)
  // You need to `npm install` the following dependencies: body-parser, express, request.
  //
  // 1. npm install body-parser express request
  // 2. Download and install ngrok from https://ngrok.com/download
  // 3. ./ngrok http 8445
  // 4. WIT_TOKEN=your_access_token FB_APP_SECRET=your_app_secret FB_PAGE_TOKEN=your_page_token node examples/messenger.js
  // 5. Subscribe your page to the Webhooks using verify_token and `https://<your_ngrok_io>/webhook` as callback URL.
  // 6. Talk to your bot on Messenger!

  const bodyParser = require('body-parser');
  const crypto = require('crypto');
  const express = require('express');
  const fetch = require('node-fetch');
  const request = require('request');
  const fb = require("./fb");
  var Adapter = require("./Adapter");
  var db = new Adapter();
  var routes = require('./api.js');
  var implement = require('./implementation')
  var AdapterMethods = require('./AdapterMethods.js');
  var constants = require("./payload");

  // var postback = require('./postback')
  let Wit = null;
  let log = null;
  try {
    // if running from repo
    Wit = require('../').Wit;
    log = require('../').log;
  } catch (e) {
    Wit = require('node-wit').Wit;
    log = require('node-wit').log;
  }

  // Webserver parameter
  const PORT = process.env.PORT || 8445;

  // Wit.ai parameters
  const WIT_TOKEN = process.env.WIT_TOKEN || 'T2ABDZL6S5TGHW3C4NWVPYIUQE7QWBDD';

  // Messenger API parameters
  const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN || 'EAANUKloOsDgBAFN4JJgRPDq6lX1SMku2X6aD46EUMhlXDqihnQLNYMxxB8ZC8yr1IXeOVmbkUNtEwd47JGPL32nPj9g4w3Iaeh4ZAKpIGnSezakNZAdCbI763KpP6GjudzdCgu4mgNfujZCV9DYg6mJdzgnjwQk3DyWu7RppTG6hyLGZB5iCU';
  if (!FB_PAGE_TOKEN) {
    throw new Error('missing FB_PAGE_TOKEN');
  }
  const FB_APP_SECRET = process.env.FB_APP_SECRET || 'f233512da58d457b7333a121f33534b6';
  if (!FB_APP_SECRET) {
    throw new Error('missing FB_APP_SECRET');
  }

  let FB_VERIFY_TOKEN = null;
  crypto.randomBytes(8, (err, buff) => {
    if (err) throw err;
    //FB_VERIFY_TOKEN = buff.toString('hex');
    FB_VERIFY_TOKEN = "secret";
    console.log(`/webhook will accept the Verify Token "${FB_VERIFY_TOKEN}"`);
  });

  // ----------------------------------------------------------------------------
  // Messenger API specific code

  // See the Send API reference
  // https://developers.facebook.com/docs/messenger-platform/send-api-reference

  function runActions(sessionId) {
    console.log('runActions - sessionId ' + sessionId)
      // actions.welcome({ sessionId });

    var text = 'Hey there. Welcome to Our Food Bot. We are currently serving in Boston area only.'
    return Promise.all([actions.send({ sessionId }, { text }), actions.welcome({ sessionId })]);
  }


  // ----------------------------------------------------------------------------
  // Wit.ai bot specific code

  // This will contain all user sessions.
  // Each session has an entry:
  // sessionId -> {fbid: facebookUserId, context: sessionState}
  const sessions = {};

  const findOrCreateSession = (fbid) => {
    let sessionId;
    // Let's see if we already have a session for the user fbid
    Object.keys(sessions).forEach(k => {
      if (sessions[k].fbid === fbid) {
        // Yep, got it!
        sessionId = k;
      }
    });
    if (!sessionId) {
      // No session found for user fbid, let's create a new one
      sessionId = new Date().toISOString();
      sessions[sessionId] = { fbid: fbid, context: {} };
    }
    return sessionId;
  };

  // Our bot actions
  const actions = {
    send({ sessionId }, { text }) {
      // Our bot has something to say!
      // Let's retrieve the Facebook user whose session belongs to
      const fbUserID = sessions[sessionId].fbid;

      if (fbUserID) {
        // Yay, we found our fb user!
        // Let's forward our bot response to her.
        // We return a promise to let our bot know when we're done sending
        return fb.reply(fb.textMessage(text), fbUserID)
          .then(() => null)
          .catch((err) => {
            console.error(
              'Oops! An error occurred while forwarding the response to fbUserID: ',
              fbUserID,
              ':',
              err.stack || err
            );
          });
      } else {
        console.error('Oops! Couldn\'t find user for session:', sessionId);
        // Giving the wheel back to our bot
        return Promise.resolve();
      }
    },
    welcome({ sessionId }) {
      const fbUserID = sessions[sessionId].fbid;
      console.log("125 - sessionId - " + sessionId)
      console.log('126 - fbUserID - ' + fbUserID)
        // var fbUserID = sessionId
      if (fbUserID) {
        var image1 = "http://s3.amazonaws.com/saveoneverything_assets/assets/images/icons/food_dining_icon.png";
        var image2 = "http://www.tastelikehome.co.za/wp-content/uploads/2015/10/cpg-foods-icon.png";
        var qr1 = fb.createQuickReplies("Only You", "individual", image1);
        var qr2 = fb.createQuickReplies("Groups", "group", image2);
        var qr = [qr1, qr2];

        var message = fb.quickReplyMessage("You want to order for ", qr);
        return fb.reply(message, fbUserID)
          .then(() => null)
          .catch((err) => {
            console.error(
              'Oops! An error occurred while forwarding the response to fbUserID : ',
              fbUserID,
              ':',
              err.stack || err
            );
          });
      } else {
        console.error('Oops! Couldn\'t find user for session:', sessionId);
        // Giving the wheel back to our bot
        return Promise.resolve()
      }
    }


    // You should implement your custom actions here
    // See https://wit.ai/docs/quickstart
  };

  //==================== Postback Section ============================================================================
  function HandlePostback(payload, sessionId) {
    console.log('\n\n payload from HandlePostback ' + payload)

    if (payload.toString() == "individual") {
      console.log('payload==individual')
      var fbUserID = sessions[sessionId].fbid;

      IndividualOrder(fbUserID)
    }
    //
    else if (payload.toString() == "group") {
      console.log('payload==group')
      var fbUserID = sessions[sessionId].fbid;
      //  implement.fetchGroupsList(fbUserID)
    }
    //
    else if (payload.toString().indexOf(constants.G_CREATE_NEW_GROUP_ORDER) != -1) {
      var fbUserID = sessionId
      console.log(fbUserID)
      var index = payload.indexOf("-");
      var GroupId = payload.slice(index + 1, payload.length);
      console.log('GroupId ' + GroupId)
      implement.createNewGroupOrder(GroupId, fbUserID)
    }
    //
    else if (payload.toString().indexOf(constants.G_RESTAURANT_SELECTED) != -1) {
      var fbUserID = sessionId
      console.log(fbUserID)
      var str = payload.split("-");
      var RestaurantId = str[1];
      var GroupOrderId = str[2]
      console.log('RestaurantId ' + RestaurantId)
      console.log('GroupOrderId ' + GroupOrderId)
      implement.fetchCategoriesforRestaurant(fbUserID, RestaurantId, GroupOrderId)
    }
    //
    else if (payload.toString().indexOf(constants.G_CATEGORY_SELECTED) != -1) {
      var fbUserID = sessions[sessionId].fbid;
      console.log(fbUserID)
      var str = payload.split("-");
      var CategoryId = str[1]
      var GroupOrderId = str[2]
      console.log('CategoryId ' + CategoryId)
      console.log('GroupOrderId ' + GroupOrderId)
      implement.getMenuItemsForCategory(fbUserID, CategoryId, GroupOrderId)
    }
    //
    else if (payload.toString().indexOf(constants.G_ADD_TO_CART) != -1) {
      var fbUserID = sessionId;
      console.log(fbUserID)
      var str = payload.split("-");
      var MenuItemId = str[1]
      var GroupOrderId = str[2]
      implement.addItemsToGroupCart(fbUserID, MenuItemId, GroupOrderId)
    }
    //
    else if (payload.toString() == "new_order") {
      console.log("\n[messenger.js - 155] == new order\n");
      CreateNewOrder(sessionId);

    }

    //
    else if (payload.toString() == "old_order") {
      console.log("\n[messenger.js - 158] ==old order\n");
      var fbUserID = sessions[sessionId].fbid;
      showMyCart(fbUserID);
    }

    /**
     * Displaying Quick Replies.
     * @function 
     * Extract the restaurant id and call the function
     */
    else if (payload.toString().indexOf('Restaurant_Selected') != -1) {
      console.log('payload==restaurant selected')
      var index = payload.indexOf("-");
      var RestaurantId = payload.slice(index + 1, payload.length);
      getCategoriesForRestaurants(sessionId, RestaurantId);
    }

    /**
     * Display Menu items carousel.
     * @function 
     * Extract the Category id and call the function
     * After calling the function, call More Options function for displaying More Options
     */
    else if (payload.toString().indexOf('Category_Selected') != -1) {
      console.log('payload==category selected')
      var index = payload.indexOf('-');
      var CategoryId = payload.slice(index + 1, payload.length);
      getMenuItemsForCategory(sessionId, CategoryId)
        .then(function() {
          var fbUserID = sessions[sessionId].fbid;
          moreOptionsQuickReplies(fbUserID, CategoryId);
        })
    }
    // if Menu Item selected, 
    // Add item to cart 
    // After the item is added to the cart
    // call moreOptionsQuickReplies - More Options
    else if (payload.indexOf('Menu_Item_Selected') != -1) {
      console.log('payload==menu selected')
      var index = payload.indexOf("-")
      var MenuItemId = payload.slice(index + 1, payload.length)
      console.log('MenuItemId ' + MenuItemId);
      addItemsToCart(sessionId, MenuItemId)
        .then(function() {
          GetCategoryIdFromMenuItemID(MenuItemId).then(function(result) {
            var CategoryId = result[0].category_id;
            moreOptionsQuickReplies(sessionId, CategoryId);
          })
        })
    }
    // if user clicks on add more items Quick reply
    else if (payload.indexOf('Add_More_Items') != -1) {
      console.log('payload==add item selected')
      var index = payload.indexOf("-")
      var CategoryId = payload.slice(index + 1, payload.length);

      //get restaurant id from category id for displaying categories carousel
      GetRestaurantIdFromCategoryId(CategoryId)
        .then(function(result) {
          var RestaurantId = result[0].restaurant_id;
          var fbUserID = sessions[sessionId].fbid;
          getCategoriesForRestaurants(fbUserID, RestaurantId);
        })
    }
    //
    else if (payload.indexOf('Checkout') != -1) {
      // checkOut();
      console.log("payload == Checkout")
      var fbUserID = sessions[sessionId].fbid;
      // share(fbUserID)
      console.log(fbUserID)
      getCheckoutDetails(fbUserID)
    }
    // else if()
    else if (payload.indexOf('My_Cart') != -1) {
      console.log('payload==my cart selected')
      var fbUserID = sessions[sessionId].fbid;
      showMyCart(fbUserID);
    }
    //remove item selected
    //call function removeItemFromCart
    else if (payload.indexOf('Remove_item') != -1) {
      console.log('payload==remove item selected')
      var index = payload.indexOf("-");
      var MenuItemId = payload.slice(index + 1, payload.length);
      var fbUserID = sessionId;
      GetOrderIdFromFbUserId(fbUserID)
        .then(function(result) {
          var OrderId = result[0].id;
          removeItemFromCart(MenuItemId, OrderId, fbUserID);
        })
    }
    // if no action on payload
    else if (payload.indexOf('Continue_cart') != -1) {
      console.log('Continue_cart')
      var fbUserID = sessions[sessionId].fbid;
      showMyCart(fbUserID)
    }
    //
    else if (payload.indexOf('Empty_cart') != -1) {
      console.log('Empty_cart')
      var fbUserID = sessions[sessionId].fbid;
      GetOrderIdFromFbUserId(fbUserID)
        .then(function(result) {
          var OrderId = result[0].id;
          console.log('OrderId ' + OrderId)
          emptyCart(fbUserID, OrderId);
        })
        // showMyCart(fbUserID)
    }
    //
    else {
      console.log('Could not find payload');
    }
  }


  //==================== Postback Section ==============================END==============================================


  //=================================functions Implementation================================================================

  function IndividualOrder(fbUserID) {
    // var fbUserID = sessions[sessionId].fbid;

    if (fbUserID) {
      var image1 = "http://s3.amazonaws.com/saveoneverything_assets/assets/images/icons/food_dining_icon.png";
      var image2 = "http://www.tastelikehome.co.za/wp-content/uploads/2015/10/cpg-foods-icon.png";
      var qr1 = fb.createQuickReplies("Create new order", "new_order", image1);
      var qr2 = fb.createQuickReplies("Edit ongoing order", "old_order", image2);
      var qr = [qr1, qr2];

      var message = fb.quickReplyMessage("So, how do you want to proceed ?", qr);
      return fb.reply(message, fbUserID)
        .then(() => null)
        .catch((err) => {
          console.error(
            'Oops! An error occurred while forwarding the response to fbUserID : ',
            fbUserID,
            ':',
            err.stack || err
          );
        });
    } else {
      console.error('Oops! Couldn\'t find user for session:', sessionId);
      // Giving the wheel back to our bot
      //return Promise.resolve()
    }
  }


  function getCheckoutDetails(fbUserID) {
    return GetCheckoutDetails(fbUserID)
      .then(function(result) {
        var restaurant = result
        console.log(restaurant)
        var price_list = [];
        for (var i = 0; i < result.length; i++) {
          price_list[i] = {
            "label": result[i].name,
            "amount": result[i].amount
          }
        }
        console.log(price_list)
        var message = {
          "attachment": {
            "type": "template",
            "payload": {
              "template_type": "generic",
              "elements": [{
                "title": result[0].restaurant_name,
                "item_url": "https://foodiebot.herokuapp.com/",
                "image_url": result[0].restaurant_image,
                "subtitle": result[0].restaurant_subtitle,
                "buttons": [{
                  "type": "payment",
                  "title": "buy",
                  "payload": "DEVELOPER_DEFINED_PAYLOAD",
                  "payment_summary": {
                    "currency": "USD",
                    "payment_type": "FIXED_AMOUNT",
                    "is_test_payment": true,
                    "merchant_name": "Food Bot",
                    "requested_user_info": [
                      "shipping_address",
                      "contact_name",
                      "contact_phone",
                      "contact_email"
                    ],
                    "price_list": price_list
                  }
                }]
              }]
            }
          }
        }

        console.log(message)
        fb.reply(message, fbUserID)
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
      // console.log(fbUserID)
  }

  function checkControlOfChat(sessionId, text) {

    const fbUserID = sessions[sessionId].fbid;
    console.log("fbUserID sent to db " + fbUserID);
    return db.getBotUser(fbUserID).then(function(rows) {
      console.log("==rows length" + rows.length);
      if (rows.length > 0) {
        if (rows[0].is_botactive == 0) { console.log("===control lies with letsclap"); } else {
          console.log("===control lies with bot");
          //Nlp(fbUserID,text);
        }
      } else {
        console.log("===inserting a new row to the bot_users");
        var new_user = insertNewBotUser(fbUserID);
        //Nlp(fbUserID,text);

      }

    }, function(error) {
      console.log("[messenger.js]", error);
    });
  }

  function CreateNewOrder(sessionId) {
    const fbUserID = sessions[sessionId].fbid;
    //check if any order is incomplete for this user
    var status = 0;
    // fb.
    return CheckForIncompleteOrder(fbUserID, status).then(function(rows) {

      //if user has empty cart, then add a new order
      console.log('*********************************************************' + rows.length)
      if (rows.length == 0) {
        return AddNewOrder(fbUserID, status).then(function(err, data) {
          var isAdded = false;
          if (err) {
            console.log('\n!!!!----------error while adding new order-------------!!!!\n')
          } else {
            isAdded = true;
            console.log('\n New Order Added ! \n');

            if (isAdded == true) {
              return FetchRestaurantsList().then(function(result) {
                console.log('\n\nResults ======= > ' + result);
                if (result.length != 0) {
                  var elements = []
                  for (var i = 0; i < result.length; i++) {
                    elements[i] = { title: result[i].name, image_url: result[i].image, subtitle: result[i].description, buttons: [{ type: 'postback', payload: 'Restaurant_Selected-' + result[i].id, title: 'Select Restaurant' }] }
                  }
                  console.log(elements)
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
                } else if (result.length > 10) {
                  console.log('Restaurants can not be more than 10')
                } else {
                  console.log('No Restaurants listed')
                }
              })
            } else {

            }
          }
        })
      } else {
        //if cart is not empty then prompt user for emptying the cart or carrying on with the cart
        console.log('\n\nYou have a pending order in your cart\n');
        var image1 = "http://s3.amazonaws.com/saveoneverything_assets/assets/images/icons/food_dining_icon.png";
        var continueCart = fb.createQuickReplies('Continue with cart', 'Continue_cart', image1)
        var emptyCart = fb.createQuickReplies('Empty the cart', 'Empty_cart', image1)

        var qr = [continueCart, emptyCart]

        var message = fb.quickReplyMessage('You already have an ongoing order. Please select an option', qr)
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
      }
    })
  }

  function getCategoriesForRestaurants(fbUserID, RestaurantId) {
    return FetchCategoriesForRestaurant(fbUserID, RestaurantId).then(function(result) {
      console.log('\nResults ' + JSON.stringify(result[0]));
      var quickReplies = [];
      for (var i = 0; i < result.length; i++) {
        var tempQR = fb.createQuickReplies(result[i].name, 'Category_Selected-' + result[i].id, result[i].image);
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

  function getMenuItemsForCategory(fbUserID, CategoryId) {
    var fb_ID = sessions[fbUserID].fbid;
    return FetchMenuItemsForCategories(CategoryId).then(function(result) {
      if (result.length != 0) {
        var elements = [];
        for (var i = 0; i < result.length; i++) {
          elements[i] = { title: result[i].name + ' - $' + result[i].price, image_url: result[i].image, subtitle: result[i].description, buttons: [{ type: 'postback', payload: 'Menu_Item_Selected-' + result[i].id, title: 'Add to Cart' }] }
        }
        var message = fb.carouselMessage(elements);
        return fb.reply(message, fb_ID)
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
  }

  function moreOptionsQuickReplies(fbUserID, CategoryId) {
    console.log('moreOptionsQuickReplies ' + CategoryId)

    // More Options After Displaying or clicking of menu items 
    var addMoreItems = fb.createQuickReplies('Add More Items', 'Add_More_Items-' + CategoryId, 'http://www.babun.io/wp-content/uploads/2016/03/BabunMetaPic-1.png');
    var checkout = fb.createQuickReplies('Checkout', 'Checkout', 'http://www.babun.io/wp-content/uploads/2016/03/BabunMetaPic-1.png');
    var myCart = fb.createQuickReplies('My Cart', 'My_Cart', 'http://www.babun.io/wp-content/uploads/2016/03/BabunMetaPic-1.png');

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

  function addItemsToCart(fbUserID, MenuItemId) {
    // var fb_ID = sessions[fbUserID].fbid;
    console.log(fbUserID)
    console.log(MenuItemId)
      // get orderId from Menu Id that is passed from Menu Item selected
      // for adding items to cart
      // then 
      // add the item to cart
      // if error is generated, send a message to fb user 
    return GetOrderIdFromFbUserId(fbUserID)
      .then(function(result) {
        if (result.length != 0) {
          console.log('result ' + result[0].id);
          var OrderId = result[0].id;
          return AddItemsToCart(MenuItemId, OrderId)
            .then(function() {
              console.log('\nItem added successfully\n')
              var message = fb.textMessage('Item added successfully')
              return fb.reply(message, fbUserID)
            })
        } else {
          var message = fb.textMessage('You have not created any order')
          fb.reply(message, fbUserID)
            // add further code
        }
      })
      .then(function() {
        return GetRestaurantIdFromMenuItemId(MenuItemId)
      })
  }

  function showMyCart(fbUserID) {
    return GetOrderIdFromFbUserId(fbUserID)
      .then(function(result) {
        var OrderId = result[0].id
        return GetMyCart(OrderId)
      })

      .then(function(result) {
        if (result.length != 0) {
          var elements = [];
          for (var i = 0; i < result.length; i++) {
            elements[i] = {
              title: result[i].name + ' - $' + result[i].price,
              image_url: result[i].image,
              subtitle: result[i].description,
              buttons: [{ type: 'postback', payload: 'Remove_item-' + result[i].id, title: 'Remove from Cart' }]
            }
          }
          console.log(elements)
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
          console.log('Result is throwing error')
          var message = fb.textMessage('Your cart is empty');
          return fb.reply(message, fbUserID)
            .then(function() {
              return FetchRestaurantsList().then(function(result) {
                console.log('\n\nResults ======= > ' + result);
                if (result.length != 0) {
                  var elements = []
                  for (var i = 0; i < result.length; i++) {
                    elements[i] = { title: result[i].name, image_url: result[i].image, subtitle: result[i].description, buttons: [{ type: 'postback', payload: 'Restaurant_Selected-' + result[i].id, title: 'Select Restaurant' }] }
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
                  console.log('No Restaurants listed')
                }
              })
            })

          console.log("There is no item in cart ")
        }
      })
      .then(function() {
        return GetCategoryIdFromFbUserId(fbUserID);
      })
      .then(function(result) {
        var CategoryId = result[0].category_id;
        return moreOptionsQuickReplies(fbUserID, CategoryId);
      })
  }

  function removeItemFromCart(MenuItemId, OrderId, fbUserID) {
    return RemoveItemFromCart(MenuItemId, OrderId)
      .then(function() {
        console.log('\nItem removed successfully\n')
        var message = fb.textMessage('Item removed successfully')
        return fb.reply(message, fbUserID)
      })
      .then(function() {
        return GetCategoryIdFromMenuItemID(MenuItemId)
      })
      .then(function(result) {
        console.log('\nCategory id ' + result[0].category_id);
        var CategoryId = result[0].category_id;
        return moreOptionsQuickReplies(fbUserID, CategoryId)
      })
  }

  function emptyCart(fbUserID, OrderId) {
    return EmptyCart(OrderId)
      .then(function() {
        console.log('Cart is Empty')
        return FetchRestaurantsList().then(function(result) {
          console.log('\n\nResults ======= > ' + result);
          if (result.length != 0) {
            var elements = []
            for (var i = 0; i < result.length; i++) {
              elements[i] = { title: result[i].name, image_url:  result[i].image, subtitle: result[i].description, buttons: [{ type: 'postback', payload: 'Restaurant_Selected-' + result[i].id, title: 'Select Restaurant' }] }
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
            console.log('No Restaurants listed')
          }
        })
      })
  }


  //=================================functions Implementation====================END======================

  //===============================Adapter method calls ==========================================
  //

  function insertNewBotUser(fbUserID) {
    return db.insertBotUser(fbUserID)
      .then(function(result) {
        return result;

      }, function(error) {
        console.log("[webhook_post.js]", error);
      });
  }

  function CheckForIncompleteOrder(fbUserID, status) {
    return db.checkForIncompleteOrder(fbUserID, status)
      .then(function(result) {
        return result;
      }, function(error) {
        console.log('Error in checking for incomplete Order: ' + error)
      })
  }

  function FetchRestaurantsList() {
    return db.fetchRestaurantsList()
      .then(function(result) {

        return result;
      }, function(error) {
        console.log('Error in fetching Restaurants: ' + error)
      })
  }

  function AddNewOrder(fbUserID, status) {

    return db.getUserId(fbUserID).then(function(res) {
      if (res.length == 0) {
        return res;
      } else {
        var user_id = res[0].id;
        db.insertNewOrder(user_id, status).then(function(result) {
          return result;

        }, function(error) {
          console.log("[messenger.js]", error);
        });
      }
    }, function(error) {
      console.log("[messenger.js]", error);
    });
  }

  function FetchCategoriesForRestaurant(fbUserID, restaurantId) {
    return db.fetchCategoriesForRestaurant(restaurantId)
      .then(function(result) {
        // if ()
        return result;
      }, function(error) {
        console.log('\nError in fetching Categories for Restaurants: ' + error)
      })
  }

  function FetchMenuItemsForCategories(CategoryId) {
    return db.fetchMenuItemsForCategories(CategoryId)
      .then(function(result) {
        // if ()
        return result;
      }, function(error) {
        console.log('\nError in fetching Menu Items for Categories: ' + error)
      })
  }

  function AddItemsToCart(ItemId, OrderId) {

    return db.addItemsToCart(ItemId, OrderId)
      .then(function(result) {
        return result;
      }, function(error) {
        console.log('\nError in Adding Menu Items for Categories: ' + error)

      })
  }

  function GetOrderIdFromFbUserId(fbUserID) {
    console.log(fbUserID)
    return db.getOrderIdFromFbUserId(fbUserID)
      .then(function(result) {
        return result;
      }, function(error) {
        console.log('\n Error fetching Order Id from FB ID' + error)
      })
  }

  function GetRestaurantIdFromMenuItemId(MenuItemId) {
    return db.getRestaurantIdFromMenuItemId(MenuItemId)
      .then(function(result) {
        return result;
      }, function(error) {
        console.log('\n Error fetching Restaurant ID from Menu Item ID ' + error);
      })
  }

  function GetRestaurantIdFromCategoryId(CategoryId) {
    return db.getRestaurantIdFromCategoryId(CategoryId)
      .then(function(result) {
        return result;
      }, function(error) {
        console.log('\nError fetching restaurant id from CategoryId ', error)
      })
  }

  function GetMyCart(OrderId) {
    return db.getMyCart(OrderId)
      .then(function(result) {
        return result;
      }, function(error) {
        console.log('\nError fetching Cart ', error)
      })
  }

  function GetCategoryIdFromMenuItemID(MenuItemId) {
    return db.getCategoryIdFromMenuItemID(MenuItemId)
      .then(function(result) {
        console.log(result[0].category_id);
        return result;
      }, function(error) {
        console.log('\nError fetching restaurant id from CategoryId ', error)
      })
  }

  function RemoveItemFromCart(MenuItemId, OrderId) {
    return db.removeItemFromCart(MenuItemId, OrderId)
      .then(function(result) {
        return result;
      }, function(error) {
        console.log('\nError removing Item From Cart ', error)
      })
  }

  function GetCategoryIdFromFbUserId(fbUserID) {
    return db.getCategoryIdFromFbUserId(fbUserID)
      .then(function(result) {
        return result;
      }, function(error) {
        console.log('\nError fetching Category Id  from FB User ID ', error)
      })
  }

  function EmptyCart(OrderId) {
    return db.emptyCart(OrderId)
      .then(function(result) {
        return result;
      }, function(error) {
        console.log('\nError Emptying the cart ', error)
      })
  }

  function GetCheckoutDetails(fbUserID) {
    return db.getCheckoutDetails(fbUserID)
      .then(function(result) {
        return result;
      }, function(error) {
        console.log('\nError fetching RestaurantId from FB User ID ', error)
      })
  }
  //===============================Adapter method calls ==================END ========================


  // Setting up our bot
  const wit = new Wit({
    accessToken: WIT_TOKEN,
    actions,
    logger: new log.Logger(log.INFO)
  });

  // Starting our webserver and putting it all together
  const app = express();


  var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    if ('OPTIONS' === req.method) {
      res.sendStatus(200);
    } else {
      next();
    }
  };

  app.use(bodyParser.json());

  app.use(allowCrossDomain);
  routes.configure(app);
  app.use(({ method, url }, rsp, next) => {
    rsp.on('finish', () => {
      console.log(`${rsp.statusCode} ${method} ${url}`);
    });
    next();
  });



  // Webhook setup
  app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
      res.send(req.query['hub.challenge']);
    } else {
      res.sendStatus(400);
    }
  });



  // Message handler
  app.post('/webhook', (req, res) => {
    // Parse the Messenger payload
    // See the Webhook reference
    // https://developers.facebook.com/docs/messenger-platform/webhook-reference
    const data = req.body;
    //res.end();
    if (data.object === 'page') {
      data.entry.forEach(entry => {
        // console.log('entry: '+entry)
        entry.messaging.forEach(event => {
          console.log('\n[messenger.js - 450] event================ > ' + JSON.stringify(event))

          //var isPostback = Object.keys(event).indexOf("postback") != -1;
          //console.log("====event from fb "+JSON.stringify(event));
          var sender = event.sender.id
          console.log("------------460------------" + sender)
          if (event.postback) {
            console.log("\n[messenger.js - 457] ========= > a postback is called  ----> " + JSON.stringify(event.postback));
            HandlePostback(event.postback.payload, event.sender.id);

          } else if (event.message) {
            // console.log("[messenger.js - 371] ====event msg from fb " + JSON.stringify(event.message));
            // Yay! We got a new message!
            // We retrieve the Facebook user ID of the sender
            const sender = event.sender.id;
            console.log('\n==================sender_id = ' + sender)
              // if (sender = '367555883633598') {}
              // We retrieve the user's current session, or create one if it doesn't exist
              // This is needed for our bot to figure out the conversation history
              // else {
            const sessionId = findOrCreateSession(sender);
            console.log("sessions[sessionId].fbid - " + sessions[sessionId].fbid)
            console.log('[messenger.js] - 471 sessionId ' + JSON.stringify(sessionId))
              // We retrieve the message content
            const { text, attachments, quick_reply } = event.message;
            if (quick_reply) {
              //console.log("===quick reply called");
              var payload = quick_reply.payload;
              if (payload) {
                HandlePostback(payload, sessionId);
              }
            } else if (attachments) {
              // We received an attachment
              // Let's reply with an automatic message

              // console.log('\n[messenger.js - 393] ==== attachments ------>' + JSON.stringify(attachments))
              // var payload = attachments.
              // fb.reply(fb.textMessage('Sorry I can only process text messages for now.'),sender)
              //   .catch(console.error);
            } else if (text) {
              // We received a text message

              // Let's forward the message to the Wit.ai Bot Engine
              // This will run all actions until our bot has nothing left to do

              checkControlOfChat(sessionId, text);
              console.log('run Actions - sessionId - ' + sessionId)

              if (text.toString().toUpperCase() == 'HEY' || text.toString().toUpperCase() == 'HELLO' || text.toString().toUpperCase() == 'HI') {
                // var fbUserID = sessions[sessionId].fbid
                // console.log(fbUserID);
                runActions(sessionId);
              } else {
                console.log('Sorry, I could not understand what you want ! Please input again')
              }
              // wit.runActions(
              //     sessionId, // the user's current session
              //     text, // the user's message
              //     sessions[sessionId].context // the user's current session state
              //   ).then((context) => {
              //     // Our bot did everything it has to do.
              //     // Now it's waiting for further messages to proceed.
              //     console.log('Waiting for next user messages');

              //     // Based on the session state, you might want to reset the session.
              //     // This depends heavily on the business logic of your bot.
              //     // Example:
              //     // if (context['done']) {
              //     //   delete sessions[sessionId];
              //     // }

              //     // Updating the user's current session state
              //     sessions[sessionId].context = context;
              //   })
              //   .catch((err) => {
              //     console.error('Oops! Got an error from Wit: ', err.stack || err);
              //   })
            }
            // }
          } else {
            //console.log('received event', JSON.stringify(event));
          }
        });
      });
    }
    res.sendStatus(200);
  });

  /*
   * Verify that the callback came from Facebook. Using the App Secret from
   * the App Dashboard, we can verify the signature that is sent with each
   * callback in the x-hub-signature field, located in the header.
   *
   * https://developers.facebook.com/docs/graph-api/webhooks#setup
   *
   */
  function verifyRequestSignature(req, res, buf) {
    var signature = req.headers["x-hub-signature"];

    if (!signature) {
      // For testing, let's log an error. In production, you should throw an
      // error.
      console.error("Couldn't validate the signature.");
    } else {
      var elements = signature.split('=');
      var method = elements[0];
      var signatureHash = elements[1];

      var expectedHash = crypto.createHmac('sha1', FB_APP_SECRET)
        .update(buf)
        .digest('hex');

      if (signatureHash != expectedHash) {
        throw new Error("Couldn't validate the request signature.");
      }
    }
  }

  app.listen(PORT);
  console.log('Listening on :' + PORT + '...');


  //============== printing line number
  // Object.defineProperty(global, '__stack', {
  //   get: function() {
  //     var orig = Error.prepareStackTrace;
  //     Error.prepareStackTrace = function(_, stack) {
  //       return stack;
  //     };
  //     var err = new Error;
  //     Error.captureStackTrace(err, arguments.callee);
  //     var stack = err.stack;
  //     Error.prepareStackTrace = orig;
  //     return stack;
  //   }
  // });

  // Object.defineProperty(global, '__line', {
  //   get: function() {
  //     return __stack[1].getLineNumber();
  //   }
  // });

})();
