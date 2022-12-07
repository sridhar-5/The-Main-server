function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function assignTagsToProduct(productDetails) {
  //assigning random tags as of now
  const tags = ["fashion", "sports", "Health"];

  var productTags = [];
  var i = 0;
  while (i < 2) {
    var randomIndex = getRandomInt(3);
    if (!productTags.includes(tags[randomIndex])) {
      productTags.push(tags[randomIndex]);
      i++;
    }
  }
  return productTags;
}

module.exports = assignTagsToProduct;
