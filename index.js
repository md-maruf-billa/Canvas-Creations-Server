const express = require('express');
const cors = require('cors')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 7000;



// --------Middle ware hare---------
app.use(cors());
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.fp7vkua.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        //------------create database and collection------------------
        const craftCollection = client.db("canvas-creation").collection("allArtAndCraft");

        //------------GET DATA FORM DATABASE----------

        app.get("/", async (req, res) => {
            const allData = await craftCollection.find().toArray();
            res.send(allData)
        })

        // ----------get specific data from database-------
        app.get("/details/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await craftCollection.findOne(query);
            res.send(result);


        })
        //-------------GET DATA USING EMAIL----------
        app.get("/my-art-and-craftList/:email", async (req, res) => {
            const email = req.params;
            const query = { email: email.email };

            //-----------Get from Database-------
            const data = craftCollection.find(query);
            const result = await data.toArray()
            res.send(result)
        })

        // ------------POST REQUESTS HARE---------
        app.post("/add-craft-items", async (req, res) => {
            const data = req.body;
            const result = await craftCollection.insertOne(data);
            res.send(result)
        })


        //----------------UPDATE CRAFT ITEMS-----------

        app.put("/", async (req, res) => {
            const data = req.body;
            const query = { _id: new ObjectId(data._id) }
            const updateItem = {
                $set: {
                    name: data.name,
                    category: data.category,
                    description: data.description,
                    price: data.price,
                    ratings: data.ratings,
                    customizable: data.customizable,
                    processing: data.processing,
                    stock: data.stock,
                    photoURL: data.photoURL
                }
            }
            const result = await craftCollection.updateOne(query,updateItem);
            res.send(result);
        })

        //---------------DELETE A POST BY USER--------------


        app.delete("/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const query = { _id: new ObjectId(id) };
            const result = await craftCollection.deleteOne(query);
            res.send(result);
        })





    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




// -------------listening port----------

app.listen(port, () => {
    console.log(`The server is running ${port}`)
})