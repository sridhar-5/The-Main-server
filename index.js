const express = require("express");
const connectDatabase = require("./config/DBConnection");
const productModel = require("./Models/productModel");
const customerModel = require("./Models/customerModel");
const { find } = require("./Models/productModel");
const amqplib = require("amqplib");

connectDatabase();

//track changes in the data base
// Create a change stream. The 'change' event gets emitted when there's a
// change in the database. Print what the change stream emits.

const userList = [];

productModel.watch().on("change", async (data) => {
  console.log(data);
  const product = data.fullDocument;

  if (data.operationType === "insert") {
    const tags = assignTagsToProduct(product);

    await productModel.updateOne(
      { _id: product._id },
      { $set: { tags: tags } }
    );
  }

  const users = await getUsers();

  product.tags.forEach((tag) => {
    users.forEach((user) => {
      if (user.preference_tags.includes(tag) && !userList.includes(tag))
        userList.push(user);
    });
  });

  userList.forEach((user) => {
    addEntryInMessageQueue(user, product);
  });
});

async function getUsers() {
  return await customerModel.find();
}

async function addEntryInMessageQueue(
  userPhone,
  productName,
  ProductPrice,
  Description
) {
  const queue = "UserMessageQueue";
  const connection = await amqplib.connect("amqp://localhost");
  const channel = await connection.createChannel();
  await channel.assertQueue(queue);
  const message = JSON.stringify({
    userPhone,
    productName,
    ProductPrice,
    Description,
  });

  return channel.sendToQueue(queue, Buffer.from(message));
}
