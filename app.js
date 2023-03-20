import express from "express";
import mongoose from "mongoose";
import _ from "lodash";
import * as dotenv from "dotenv";

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const mongoDBUrl = process.env.MONGO_API_KEY;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

async function main() {
  await mongoose.connect(mongoDBUrl);

  const itemSchema = mongoose.Schema({
    name: String,
  });
  const Item = mongoose.model("Item", itemSchema);

  const listSchema = mongoose.Schema({
    name: String,
    items: [itemSchema],
  });
  const List = mongoose.model("List", listSchema);

  const item1 = new Item({
    name: "欢迎使用待办列表！",
  });
  const item2 = new Item({
    name: "输入并点击➕号按钮增添待办",
  });
  const item3 = new Item({
    name: "👈 点击左侧复选框删除待办",
  });

  const defaultItems = [item1, item2, item3];
  const foundItems = await Item.find({});

  if (foundItems.length === 0) await Item.insertMany(defaultItems);

  app.get("/", async (req, res) => {
    const items = await Item.find({});
    res.render("list", { listTitle: "待办列表", newListItem: items });
  });

  app.get("/:cutomListName", async (req, res) => {
    const cutomListName = _.capitalize(req.params.cutomListName);
    const foundList = await List.findOne({ name: cutomListName });

    if (foundList) {
      res.render("list", {
        listTitle: foundList.name,
        newListItem: foundList.items,
      });
    } else {
      const list = new List({
        name: cutomListName,
        items: defaultItems,
      });

      await list.save();
      res.redirect(`/${cutomListName}`);
    }
  });

  app.post("/", async (req, res) => {
    const itemName = req.body.new;
    const listName = req.body.list;

    const newItem = new Item({
      name: itemName,
    });

    if (listName === "待办列表") {
      newItem.save();
      res.redirect("/");
    } else {
      const currentList = await List.findOne({ name: listName });
      currentList.items.push(newItem);
      currentList.save();
      res.redirect(`/${listName}`);
    }
  });

  app.post("/delete", async (req, res) => {
    const checkedItemID = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "待办列表") {
      await Item.findByIdAndRemove(checkedItemID);
      setTimeout(function () {
        res.redirect("/");
      }, 300);
    } else {
      await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemID } } }
      );
      res.redirect(`/${listName}`);
    }
  });
}

main().catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
