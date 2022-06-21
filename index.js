import express, {json} from express;
import cors from cors;

const app = express();

app.use(json()); 
app.use(cors());


const user = []
const message = []

app.post('/participants', (req, res) => {
    const {name} = req.body;

})

app.listen(5000, () => {
    console.log('Servidor funfando')
});