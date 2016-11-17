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
                      button = { type: 'postback', payload: constants.CREATENEWGROUPORDER + '-' + group.group_id, title: 'Create a Group Order' }
                      element = { title: data.result.name, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Small-city-symbol.svg/348px-Small-city-symbol.svg.png", subtitle: '', buttons: [button, { "type": "element_share" }] }
                    } else {
                      button = { type: 'postback', payload: constants.EDITGROUPORDER + '-' + group.group_id, title: 'Edit Group Order' }
                      element = { title: data.result.name, image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Small-city-symbol.svg/348px-Small-city-symbol.svg.png", subtitle: '', buttons: [button, { "type": "element_share" }] }
                    }
                    elements.push(element)
                  })
              })).then(function() {
                var message = fb.carouselMessage(elements);
                console.log(elements)
                return fb.reply(message, id)
                  .then(() => null)
                  .catch((err) => {
                    console.error(
                      'Oops! An error occurred while forwarding the response to fbUserID',
                      fbUserID,
                      ':',
                      err.stack || err
                    );
                  });

                console.log(message)
              })
            } else {
              console.log('No result')
            }
          })
      },
      this.createNewGroupOrder = function(GroupId, fbUserID) {
        AdapterMethods.CreateNewGroupOrder(GroupId)
          .then(function() {
            return AdapterMethods.FetchRestaurantsList()
              .then(function(result) {
                if (result.length > 0 && result.length < 11) {
                  var elements = []
                  for (var i = 0; i < result.length; i++) {
                    elements[i] = { title: result[i].name, image_url: result[i].image, subtitle: result[i].description, buttons: [{ type: 'postback', payload: 'Restaurant_Selected-' + result[i].id, title: 'Select Restaurant' }] }
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
      }
  }
  module.exports = new Implementation();
})()
