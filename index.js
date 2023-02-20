const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const os = require("os");

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.menwp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("online_shop");
    const productCollection = database.collection("products");
    const orderCollection = database.collection("orders");

    //GET products API

    app.get("/products", async (req, res) => {
      const cursor = productCollection.find({});

      const page = req.query.page;
      const size = parseInt(req.query.size);

      let products;
      const count = await cursor.count();

      if (page) {
        products = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        products = await cursor.toArray();
      }

      res.send({ count, products });
    });

    //use POST to get DATA by keys

    app.post("/products/byKeys", async (req, res) => {
      const keys = req.body;
      const query = {
        key: { $in: keys },
      };
      const products = await productCollection.find(query).toArray();
      res.json(products);
    });

    //Add Order API
    app.get("/orders", async (req, res) => {
      let query = {};
      const email = req.query.email;
      if (email) {
        query = { email: email };
      }
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });
    app.post("/orders", async (req, res) => {
      const order = req.body;
      order.createdAt = new Date();
      const result = await orderCollection.insertOne(order);
      res.json(result);
    });
  } finally {
    //    await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(
    "<h1 align='center'>CRUD Server is Running</h1> <img src ='https://www.atatus.com/glossary/content/images/size/w960/2021/07/CRUD.jpeg' alt='CRUD Server Running' width='100%'>"
  );
});

app.listen(port, () => {
  console.log("Server is running on port", port);
  console.log("Device:", os.hostname());
  console.log("OS  type: ", os.type(), "OS:", os.version());
});
