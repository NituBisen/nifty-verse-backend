// const express = require("express");

// const router = express.Router();

// const {
//     getUsers,
// } = require("../controllers/adminUserController");

// router.get(
//     "/users",
//     getUsers
// );

// module.exports = router;



const express = require("express");

const router = express.Router();

const {
    getUsers,
} = require("../controllers/adminUserController");

router.get(
    "/users",
    getUsers
);

module.exports = router;