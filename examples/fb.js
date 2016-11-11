var request = require("request");
var Q = require("q");

//--------------------------------------------------------------------------------
function textMessage(message) {
  return {
    "text": message
  }
}
//--------------------------------------------------------------------------------


function imageMessage(url) {
  return {
    "attachment": {
      "type": "image",
      "payload": {
        "url": url
      }
    }
  }
}

//--------------------------------------------------------------------------------
function carouselMessage(elements) {
  return {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": elements
      }
    }
  }
}
//--------------------------------------------------------------------------------
function quickReplyMessage(title, quick_replies) {
  return {
    "text": title,
    "quick_replies": quick_replies
  }
}
//--------------------------------------------------------------------------------
function createElement(title, subtitle, image, buttons) {
  return {
    "title": title,
    "subtitle": subtitle,
    "image_url": (image || "http://www.babun.io/wp-content/uploads/2016/03/BabunMetaPic-1.png"),
    // "item_url": item_url || '',
    "buttons": buttons
  }
}
//--------------------------------------------------------------------------------
function createButton(title, payload) {
  return {
    "type": "postback",
    "title": title,
    "payload": payload
  }
}
//-----------------------------------------------------------------------
function createQuickReplies(title, payload, image) {
  return {
    "content_type": "text",
    "title": title,
    "payload": payload,
    "image_url": image
  }
}

// function createWebViewButton(title, url, webview_height_ratio){
//     return {
//     "type": "web_url",
//     "title": title,
//     "url" : url,
//     "webview_height_ratio": webview_height_ratio
//   }
// }


//--------------------------------------------------------------------------------
function reply(message, senderId) {
  var deferred = Q.defer();
  console.log("===sending message to: ", senderId);
  //const requestId = dashbot.logOutgoing(requestData);

  const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN || 'EAANUKloOsDgBAFN4JJgRPDq6lX1SMku2X6aD46EUMhlXDqihnQLNYMxxB8ZC8yr1IXeOVmbkUNtEwd47JGPL32nPj9g4w3Iaeh4ZAKpIGnSezakNZAdCbI763KpP6GjudzdCgu4mgNfujZCV9DYg6mJdzgnjwQk3DyWu7RppTG6hyLGZB5iCU';
  const requestData = {
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: FB_PAGE_TOKEN },
    method: 'POST',
    json: {
      recipient: { id: senderId },
      message: message
    }
  };
  //const requestId = dashbot.logOutgoing(requestData);
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: FB_PAGE_TOKEN
    },
    method: 'POST',
    json: {
      recipient: {
        id: senderId
      },
      message: message
    }
  }, function(err, response, body) {
    if (err) {
      console.log("===error while sending message to FB: ", err.message);
      deferred.reject(err);
    } else {
      if (response.statusCode == 200) {
        console.log("===sent message to FB");
        //dashbot.logOutgoingResponse(requestId, err, response);
        deferred.resolve(body);
      } else {
        console.log("===error sending message", body);
        deferred.reject(body);
      }
    }
  });
  return deferred.promise;
}


function notifyout(message, senderId) {
  const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN || 'EAANUKloOsDgBAN48BZBNlIqTZAYCbfzxuQdrmNEFVmdqrluPFZAGMr7GpEH0ItxtPA5zi9ImtOr8WCMJCoJEAYNxsuyZBbVc4vwfiDAiE9JoUN9dESFIpcZCyhDWEUL1ljzGDKNfvZBUNGda24zIE2hESwTSwmziuvik4SMnfTFAZDZD';
  const requestData = {
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: FB_PAGE_TOKEN },
    method: 'POST',
    json: {
      recipient: { id: senderId },
      message: message
    }
  };
  const requestId = dashbot.logOutgoing(requestData);
  request(requestData, function(error, response, body) {
    //dashbot.logOutgoingResponse(requestId, error, response);
  });

}
//--------------------------------------------------------------------------------
exports.textMessage = textMessage;
exports.carouselMessage = carouselMessage;
exports.imageMessage = imageMessage;
exports.createElement = createElement;
exports.createButton = createButton;
exports.reply = reply;
exports.notifyout = notifyout;
exports.createQuickReplies = createQuickReplies;
exports.quickReplyMessage = quickReplyMessage;
