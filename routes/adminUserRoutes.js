// // const express = require("express");

// // const router = express.Router();

// // const {
// //     getUsers,
// // } = require("../controllers/adminUserController");

// // router.get(
// //     "/users",
// //     getUsers
// // );

// // module.exports = router;



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

const {
    getUsers,
} = require("../controllers/adminUserController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.get(
    "/users",
    adminAuthMiddleware,
    getUsers
);

module.exports = router;