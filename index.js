import express, { json } from 'express';
import cors from 'cors';
import { MongoClient, ServerApiVersion } from "mongodb";

const mongoClient = new MongoClient("mongodb+srv://BiaChamsim:Bia310193@cluster0.9buio.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

let db;

mongoClient.connect().then(() => {
	db = mongoClient.db("banco_teste");
});

const app = express();

app.use(json());
app.use(cors());


const user = []
const message = []

app.get('/teste', (req, res) => {
    db.collection("users").findOne({
        email: "joao@email.com"
    }).then(user => {
        console.log(user); 
    });
})

app.post('/participantes', async (req, res) => {
    
   const user = await db.collection("users").insertOne({
        email: "joao@email.com",
        password: "minha_super_senha"
    });


     res.send(user);
    
    
    
    //const { name } = req.body;

})

app.listen(5000, () => {
    console.log('Servidor funfando')
});