import express from 'express';

const app = express();
const port = 8080

app.use(express.json())

app.get('/api', (req, res) => {

})

app.get('/tshirt', (req, res) => {
    res.status(200).send({
        tshirt: '🎽',
        size: 'large'
    })
})

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
