const express = require("express");
const connectDatabase = require("./config/DBConnection");
const productModel = require("./Models/productModel");
const customerModel = require("./Models/customerModel");
const { find } = require("./Models/productModel");

const assignTagsToProduct = require("./MachineLearningService/main");
var amqp = require("amqplib/callback_api");
connectDatabase();

//track changes in the data base
// Create a change stream. The 'change' event gets emitted when there's a
// change in the database. Print what the change stream emits.

const userList = [];

productModel.watch().on("change", (data) => {
  if (data.operationType === "insert") {
    const product = data.fullDocument;
    console.log(product);
    const save_id = product._id;
    const tags = assignTagsToProduct(product);

    productModel
      .updateOne({ _id: product._id }, { $set: { tags: tags } })
      .then(() => {
        customerModel
          .find()
          .then((users) => {
            productModel.findById({ _id: save_id }).then((result) => {
              result.tags.forEach((tag) => {
                users.forEach((user) => {
                  if (
                    user.preference_tags.includes(tag) &&
                    !userList.includes(tag)
                  )
                    userList.push(user);
                });
              });

              console.log(userList);
              userList.forEach((user) => {
                addEntryInMessageQueue(
                  user.phone,
                  product.productName,
                  product.price,
                  product.description
                );
              });
            });
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

// async function getUsers() {
//   return await customerModel.find();
// }

// add each notification in the message queue
async function addEntryInMessageQueue(
  userPhone,
  productName,
  ProductPrice,
  Description
) {
  amqp.connect("amqp://127.0.0.1:5672", function (error0, connection) {
    if (error0) {
      throw error0;
    }
    connection.createChannel(function (error1, channel) {
      if (error1) {
        throw error1;
      }
      var queue = "UserMessageQueue";
      const message = JSON.stringify({
        userPhone,
        productName,
        ProductPrice,
        Description,
      });

      channel.assertQueue(queue, {
        durable: false,
      });

      return channel.sendToQueue(queue, Buffer.from(message, "utf-8"));
    });
  });
}
