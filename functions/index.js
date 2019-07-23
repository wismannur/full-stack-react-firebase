const functions = require("firebase-functions");
const admin = require("firebase-admin");
const app = require("express")();

var serviceAccount = require("./keys/socialape-48929-firebase-adminsdk-t0jwg-bec3570dda.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialape-48929.firebaseio.com"
});

const config = {
  apiKey: "AIzaSyAieoBStVIvcHHIrrgjgZQaJxSf20ma7_c",
  authDomain: "socialape-48929.firebaseapp.com",
  databaseURL: "https://socialape-48929.firebaseio.com",
  projectId: "socialape-48929",
  storageBucket: "socialape-48929.appspot.com",
  messagingSenderId: "916726889693",
  appId: "1:916726889693:web:191e9723da4b302e"
};

const firebase = require("firebase");
firebase.initializeApp(config);

const db = admin.firestore();

// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello Wisman!");
// });

app.get("/screams", (req, res) => {
  db.collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let screams = [];
      data.forEach(doc => {
        // screams.push(doc.data());
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(screams);
    })
    .catch(err => console.error(err));
});

app.post("/scream", (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    // createdAt: admin.firestore.Timestamp.fromDate(new Date()),
    createdAt: new Date().toISOString()
  };

  db.collection("screams")
    .add(newScream)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
});

// SignUp Route
app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  // TODO: Validate Data
  var token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(IdToken => {
      token = IdToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.log(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email is already is use" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });

  // firebase
  //   .auth()
  //   .createUserWithEmailAndPassword(newUser.email, newUser.password)
  //   .then(data => {
  //     return res
  //       .status(201)
  //       .json({ message: `user ${data.user.uid} signed up successfully` });
  //   })
  //   .catch(err => {
  //     console.error(err);
  //     return res.status(500).json({ error: err.code });
  //   });
});

exports.api = functions.https.onRequest(app);
