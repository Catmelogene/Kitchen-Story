const express = require("express");
const bodyParser = require("body-parser");
const cors = require ("cors");
const app = express();
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 12;
const cookieParser = require("cookie-parser");
const session = require("express-session");

//Database connection
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "sAyYpm4R",
    database: "kitchenstory",
});

//Middleware
app.use(cors(//{
    //origin: ["https://localhost:3000"],
    //methods: ["GET", "POST"],
    //credentials: true
//}
));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}))
 
app.use(session({
    key: "userId",
    secret: "shopper",
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 60 * 60 *1,
    },
}))

app.get("/api/get", (req, res)=>{
    const sqlSelect = "SELECT * FROM products";
    db.query(sqlSelect, (err,result) => {
        res.send(result);
    });
});

//Post new product
app.post("/api/newProduct", (req, res) => {

    const productName = req.body.productName
    const productPrice = req.body.productPrice
    const productDescription = req.body.productDescription
    const productImage = req.body.productImage

    const sqlInsert="INSERT INTO products (productName, productPrice, productDescription, productImage) VALUES(?,?,?,?)"
    db.query( sqlInsert, [productName, productPrice, productDescription, productImage], (err, result) =>{
        console.log(err);
    });
});

//Delete product
app.delete("/api/delete/:productName", (req, res) => {
    const name = req.params.productName;
    const sqlDelete = "DELETE FROM products WHERE productName = ?";
    db.query(sqlDelete, name, (err, result) => {
        if(err) console.log(err);
    });
});

// Cart functionalities
app.post("/api/cart/add", (req, res) => {
    const { productId } = req.body;
    if (!req.session.cart) {
        req.session.cart = {};
    }
    if (!req.session.cart[productId]) {
        req.session.cart[productId] = 0;
    }
    req.session.cart[productId] += 1;
    res.send(req.session.cart);
});

app.post("/api/cart/remove", (req, res) => {
    const { productId } = req.body;
    if (req.session.cart && req.session.cart[productId]) {
        req.session.cart[productId] -= 1;
        if (req.session.cart[productId] <= 0) {
            delete req.session.cart[productId];
        }
    }
    res.send(req.session.cart);
});

app.post("/api/cart/update", (req, res) => {
    const { productId, quantity } = req.body;
    if (!req.session.cart) {
        req.session.cart = {};
    }
    req.session.cart[productId] = quantity;
    if (req.session.cart[productId] <= 0) {
        delete req.session.cart[productId];
    }
    res.send(req.session.cart);
});

app.post("/api/cart/checkout", (req, res) => {
    req.session.cart = {};
    res.send(req.session.cart);
});

app.get("/api/cart", (req, res) => {
    res.send(req.session.cart || {});
});

//Sign-Up
app.post("/register", (req, res) => {

    const email = req.body.email
    const contact = req.body.contact
    const password = req.body.password

    bcrypt.hash(password,saltRounds, (err, hash) => {
        db.query("INSERT INTO users (email, contact, password) VALUES(?,?,?)", [email, contact, hash], (err, result) =>{
            console.log();
        });
    });

    
});

//Sign-In
app.post('/login', (req, res) => {
    const email = req.body.email
    const password = req.body.password

    db.query( 
        "SELECT * FROM users WHERE email = ?", 
        email, 
        (err, result) => {
            if (err){
                res.send({err: err});
            }
            if (result.length>0){
                bcrypt.compare(password, result[0].password, (error, response) => {
                    if(response){
                        req.session.user = result;
                        console.log(req.session.user);
                        res.send(result);
                    }
                    else{
                        res.send({message: "wrong username or password. please try again."});
                    }
                })
            }else{
                res.send({message: "User not found"});
            }
            
        });
});

app.get("/login", (req, res) => {
    if (req.session.user) {
      res.send({ loggedIn: true, user: req.session.user });
    } else {
      res.send({ loggedIn: false });
    }
  });


app.listen(3001, () => {
    console.log("running on port 3001");
});