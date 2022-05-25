const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).send("forbidden access");
      }
      req.decoded = decoded;
    });
    next();
  }

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hx93b.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
      await client.connect();
      const tvCollection = client.db("Warehouse").collection("service");
  
      //create
      app.post("/tv", async (req, res) => {
        const newItem = req.body;
        const result = await tvCollection.insertOne(newItem);
        res.send(result);
      });
  
      // Read
      app.get("/tv", async (req, res) => {
        const query = {};
        const cursor = tvCollection.find(query);
        const tvs = await cursor.toArray();
        res.send(tvs);
      });
  
      app.get("/usertv", verifyJWT, async (req, res) => {
        const decodedEmail = req.decoded.email;
  
        const email = req.query.email;
        if (decodedEmail === email) {
          const query = { email: email };
          const cursor = tvCollection.find(query);
          const tvs = await cursor.toArray();
          res.send(tvs);
        }
        else{res.status(403).send({message:'forbidden access'})}
        
      });
  
      app.get("/tv/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const tv = await tvCollection.findOne(query);
        res.send(tv);
      });
      //update
      app.put("/tv/:id", async (req, res) => {
        const id = req.params.id;
        const newQuantity = req.body;
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updatedQuantity = {
          $set: {
            quantity: newQuantity.quantity,
          },
        };
        const result = await tvCollection.updateOne(
          filter,
          updatedQuantity,
          options
        );
        res.send(result);
      });
  
      //delete
      app.delete("/tv/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await tvCollection.deleteOne(query);
        res.send(result);
      });
  
      //jsonwebtoken
      app.post("/login", async (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "1d",
        });
        res.send({ token });
      });
    } finally {
    }
  }
  run().catch(console.dir);
  
//api
app.get('/', (req, res) => {
    res.send('Running Warehouse Server');
});

app.listen(port, () => {
    console.log('Listening to port', port);
})