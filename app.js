const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs"); //tells our app to use ejs as view engine

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public")); // we have to tell express to serve up the public folder as static folder

const mongoose = require("mongoose"); // to store the data in our databse
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

// creating schema
const itemSchema = new mongoose.Schema({
  name: String,
});
// creating mongoose model (collection)
const Item = mongoose.model("Item", itemSchema);
// default items of our todolist
const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "hit + button to add items",
});

const item3 = new Item({
  name: "<-- hit this to delete an item",
});
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema], //this is an array of items which we created
});

const List = mongoose.model("List", listSchema);

// let items = ["Buy Food", "Cook Food"];
// let workItems = [];

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    //foundItems is an array of objects
    if (foundItems.length === 0) {
      //IF in our databse currently no items then only we will enter items into,else we will not enter default items
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      // whenever we 1st time enter our default items into our database, after entering we are redirect to our home route and then next time
      // it does't execute if statement
      res.redirect("/");
    } else {
      //   res.render() is used to render a page, in our case the page name is list
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

// To Create custom List
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // if there is no document of that same "name" then only we will insert it into our list
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        // after saving the document we are redirect to this specific route so that we can show them
        res.redirect("/" + customListName);
      } else {
        // i added this if part, ween we are keep deleting items from our custom route if the items become empty so that we can add again
        // our default items to our custom route  as we are doind same as our home route
        if(foundList.items.length === 0){
          defaultItems.forEach(function(item){
            foundList.items.push(item);
            foundList.save();
          })
        }
        // show an existing list
        res.render("list", {
          listTitle: customListName,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.deleteOne({ _id: checkedItemId }, function (err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName},{$pull:{items:{_id: checkedItemId}}},function (err,results){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      // here we are getting the document from the databse based on the "name" and we are pushing the new item to the array of that daocument
      // and then again we will save it to the databse ,and to render it in our page we will redirect to our specific route
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.listen(3000, function () {
  console.log("server started on port 3000.");
});
