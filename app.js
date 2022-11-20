//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true });
// creating the schema for our database
const itemschema = new mongoose.Schema({
  name: String
});
// now we are making a collection in our todolistDB
const Item = mongoose.model("Item", itemschema);

// creating our item to give
const item1 = new Item({
  name: "Welcome to your to do list!!"
});

const item2 = new Item({
  name: "Hit the + Button to add new item!"
});
const item3 = new Item({
  name: "<-- Hit this to delete an item!"
});
const defaultItem = [item1, item2, item3];

const listschema = {
  name: String,
  items: [itemschema]

}
const List = mongoose.model("List", listschema);
const day = date.getDate();
app.get("/", function (req, res) {

  Item.find({}, function (err, founditem) {
    if (founditem.lenght === 0) {
      Item.insertMany(defaultItem, function (err) {
        if (err) console.log(err);
        else console.log("Successfully Inserted in the DB!");
      });
      res.redirect("/");
    }
    else
      res.render("list", { listTitle: "Today!", newListItems: founditem });
  })


});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, function (err, foundlist) {
    if (!err) {
      if (!foundlist) {
        const list = new List({
          name: customListName,
          items: defaultItem
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else {
        res.render("list", { listTitle: foundlist.name, newListItems: foundlist.items });

      }
    }
  })
});

app.post("/", function (req, res) {

  const itemname = req.body.newItem;
  const listname = req.body.list;
  const nitem = new Item({
    name: itemname

  });
  if (listname === "Today!") {
    nitem.save();
    res.redirect("/");
  }
  else {
    List.findOne({ name: listname }, function (err, foundlist) {
      foundlist.items.push(nitem);
      foundlist.save();
      res.redirect("/" + listname);
    });
  }


});

app.post("/delete", function (req, res) {
  const checkedItemid = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today!") {
    Item.findByIdAndRemove(checkedItemid, function (err) {
      if (!err) {
        console.log("The Item has been successfully removed");
        res.redirect("/");
      }
    })
  }
  else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemid } } }, function (err, foundlist) {
      if (!err) {
        res.redirect("/" + listName);
      }

    })
  }

})



app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
