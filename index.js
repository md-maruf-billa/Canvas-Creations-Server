import express, { json } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken'
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import 'dotenv/config'
import cookieParser from 'cookie-parser';
// import { verifyUserPermission } from './customMiddleWare.js';



const app = express();
const port = process.env.PORT || 7000;



// --------Middle ware hare---------
app.use(cors({
    origin: [
        'http://localhost:5173'
    ],
    credentials: true,
}));
app.use(json())
app.use(cookieParser())


const verifyUserPermission = async (req, res, next) => {
    const cookie = req.cookies.access_token;
    if (!cookie) {
        return res.status(401).send({ message: "unauthorize" })
    }
    jwt.verify(cookie, process.env.COOKIE_SECRETE_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "unauthorize" })
        }
        req.user = decoded;
        next()
    })

}





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
        const allCategories = client.db("canvas-creation").collection("allCategories");


        app.get("/categories", async (req, res) => {
            const result = await allCategories.find().toArray();
            res.send(result);
        })

        //------------GET DATA FORM DATABASE----------

        app.get("/", async (req, res) => {
            const allData = await craftCollection.find().toArray();
            res.send(allData)
        })

        // ----------get specific data from database-------
        app.get("/details/:id", verifyUserPermission, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await craftCollection.findOne(query);
            res.send(result);


        })
        //-------------GET DATA USING EMAIL----------
        app.get("/my-art-and-craftList/:email", verifyUserPermission, async (req, res) => {
            const user = req.user;
            const email = req.params;

            //---------verify email---------
            if (user.email == email.email) {
                const query = { email: email.email };

                //-----------Get from Database-------
                const data = craftCollection.find(query);
                const result = await data.toArray()
                return res.send(result)
            }
            res.status(401).send({ message: "unauthorize" })


        })

        //----------GET DATA USING CATEGORIES NAME-------------
        app.get("/category/:categoryName", async (req, res) => {
            const category = req.params.categoryName;
            const query = { category: category }
            const result = await craftCollection.find(query).toArray();
            res.send(result)
        })

        // ------------POST REQUESTS HARE---------
        app.post("/add-craft-items", async (req, res) => {
            const data = req.body;
            const result = await craftCollection.insertOne(data);
            res.send(result)
        })

        //-----------GET USER REQUEST AND SEND A TOKEN-------------
        app.post("/verify", async (req, res) => {
            const userData = req.body;
            const token = jwt.sign(userData, process.env.COOKIE_SECRETE_KEY, { expiresIn: '1h' })


            res
                .cookie("access_token", token, {
                    httpOnly: true,
                    secure: false,
                })
                .status(200)
                .send({ message: "success" })
        })


        // ------------Log Out user-------------
        app.get("/logout", async(req,res)=>{
            
            console.log("hello")
            res
            .clearCookie("access_token",{maxAge:0})
            .send({message:"Logout successful"})
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
            const result = await craftCollection.updateOne(query, updateItem);
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