// const express = require("express");
// const { signup, signin } = require("../controllers/authController");

// const router = express.Router();

// router.post("/signup", signup);
// router.post("/signin", signin);

// module.exports = router;




const express = require("express");

const router = express.Router();

const {
    signup,
    signin,
} = require("../controllers/authController");

router.post(
    "/signup",
    signup
);

router.post(
    "/signin",
    signin
);

module.exports = router;