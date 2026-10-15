// // // // const express = require("express");

// // // // const router = express.Router();

// // // // const {
// // // //     getUsers,
// // // // } = require("../controllers/adminUserController");

// // // // router.get(
// // // //     "/users",
// // // //     getUsers
// // // // );

// // // // module.exports = router;



// // // const express = require("express");

// // // const router = express.Router();

// // // const {
// // //     getUsers,
// // // } = require("../controllers/adminUserController");

// // // router.get(
// // //     "/users",
// // //     getUsers
// // // );

// // // module.exports = router;




// // const express = require("express");

// // const {
// //     getUsers,
// // } = require("../controllers/adminUserController");

// // const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

// // const router = express.Router();

// // router.get(
// //     "/users",
// //     adminAuthMiddleware,
// //     getUsers
// // );

// // module.exports = router;




// //new code


// const express = require("express");
// const router = express.Router();

// const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

// const { getUsers } = require("../controllers/adminUserController");

// const {
//   getDashboardStats,
//   getRecentNFTs,
// } = require("../controllers/adminDashboardController");

// router.get("/users", adminAuthMiddleware, getUsers);

// router.get("/dashboard/stats", adminAuthMiddleware, getDashboardStats);

// router.get("/dashboard/recent-nfts", adminAuthMiddleware, getRecentNFTs);

// module.exports = router;




//new code



const express = require("express");
const router = express.Router();

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const { getUsers } = require("../controllers/adminUserController");

const {
    getDashboardStats,
    getRecentNFTs,
    getAdminCollections,
    getAdminCreators,
    getAdminListings,
    getAdminActivities
} = require("../controllers/adminDashboardController");


const { getCategories, 
    createCategory, 
    updateCategory,
    deleteCategory 
} = require("../controllers/adminCategoryController");


const { getAdminSettings, 
    updateAdminSettings, 
    changeAdminPassword 
} = require("../controllers/adminSettingsController");



router.get("/users", adminAuthMiddleware, getUsers);

router.get("/dashboard/stats", adminAuthMiddleware, getDashboardStats);
router.get("/dashboard/recent-nfts", adminAuthMiddleware, getRecentNFTs);

router.get("/dashboard/recent-collections", adminAuthMiddleware, getAdminCollections);
router.get("/dashboard/recent-creators", adminAuthMiddleware, getAdminCreators);
router.get("/dashboard/recent-listings", adminAuthMiddleware, getAdminListings);
router.get("/dashboard/recent-activities", adminAuthMiddleware, getAdminActivities);


router.get("/categories", adminAuthMiddleware, getCategories);
router.post("/categories", adminAuthMiddleware, createCategory);
router.patch("/categories/:id", adminAuthMiddleware, updateCategory);
router.delete("/categories/:id", adminAuthMiddleware, deleteCategory);


router.get("/settings", adminAuthMiddleware, getAdminSettings);
router.patch("/settings", adminAuthMiddleware, updateAdminSettings);
router.patch("/settings/password", adminAuthMiddleware, changeAdminPassword);



module.exports = router;
