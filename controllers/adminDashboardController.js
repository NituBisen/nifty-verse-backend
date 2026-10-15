
// const mongoose = require("mongoose");
// const NFT = require("../models/NFT");

// const getDashboardStats = async (req, res) => {
//   try {
//     const [
//       totalNFTs,
//       publishedNFTs,
//       draftNFTs,
//       listedNFTs,
//       creatorIds,
//     ] = await Promise.all([
//       NFT.countDocuments({}),
//       NFT.countDocuments({ status: "published" }),
//       NFT.countDocuments({ status: "draft" }),
//       NFT.countDocuments({ status: "published", isListed: true }),
//       NFT.distinct("createdBy", { createdBy: { $ne: null } }),
//     ]);

//     return res.status(200).json({
//       success: true,
//       stats: {
//         totalNFTs,
//         publishedNFTs,
//         draftNFTs,
//         listedNFTs,
//         totalCreators: creatorIds.length,
//       },
//     });
//   } catch (error) {
//     console.error("Admin dashboard stats error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to load dashboard statistics.",
//     });
//   }
// };

// const getRecentNFTs = async (req, res) => {
//   try {
//     const nfts = await NFT.find({})
//       .select("name image creator createdBy price status isListed createdAt")
//       .populate("createdBy", "username")
//       .sort({ createdAt: -1 })
//       .limit(4)
//       .lean();

//     const result = nfts.map((nft) => ({
//       ...nft,
//       id: String(nft._id),
//       creator:
//         nft.creator ||
//         nft.createdBy?.username ||
//         "Unknown Creator",
//       image: nft.image || "",
//       price: Number(nft.price || 0),
//     }));

//     return res.status(200).json({
//       success: true,
//       nfts: result,
//     });
//   } catch (error) {
//     console.error("Admin recent NFTs error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to load recent NFTs.",
//     });
//   }
// };

// module.exports = {
//   getDashboardStats,
//   getRecentNFTs,
// };




//new code


const NFT = require("../models/NFT");
const User = require("../models/User");
const Collection = require("../models/Collection");
const Activity = require("../models/Activity");

const getDashboardStats = async (req, res) => {
    try {
        const [totalNFTs, publishedNFTs, draftNFTs, listedNFTs, creatorIds, totalCollections, totalActivities] = await Promise.all([
            NFT.countDocuments({}),
            NFT.countDocuments({ status: "published" }),
            NFT.countDocuments({ status: "draft" }),
            NFT.countDocuments({ status: "published", isListed: true }),
            NFT.distinct("createdBy", { createdBy: { $ne: null } }),
            Collection.countDocuments({}),
            Activity.countDocuments({})
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                totalNFTs,
                publishedNFTs,
                draftNFTs,
                listedNFTs,
                totalCreators: creatorIds.length,
                totalCollections,
                totalActivities
            }
        });
    } catch (error) {
        console.error("Admin dashboard stats error:", error);
        return res.status(500).json({ success: false, message: "Unable to load dashboard statistics." });
    }
};

const getRecentNFTs = async (req, res) => {
    try {
        const limit = req.query.limit === "all" ? 0 : Math.min(Math.max(Number(req.query.limit) || 4, 1), 100);

        let query = NFT.find({})
            .select("name image creator createdBy owner price status isListed createdAt")
            .populate("createdBy", "username email")
            .populate("owner", "username email")
            .sort({ createdAt: -1 });

        if (limit > 0) {
            query = query.limit(limit);
        }

        const nfts = await query.lean();

        const result = nfts.map((nft) => ({
            ...nft,
            _id: String(nft._id),
            name: nft.name || "Untitled NFT",
            image: nft.image || "",
            creator: nft.creator || nft.createdBy?.username || "Unknown Creator",
            price: Number(nft.price || 0),
            status: nft.status || "published",
            isListed: Boolean(nft.isListed),
            ownerName: nft.owner?.username || "Unknown Owner"
        }));

        return res.status(200).json({
            success: true,
            count: result.length,
            nfts: result
        });
    } catch (error) {
        console.error("Admin recent NFTs error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load NFTs."
        });
    }
};

const getAdminCollections = async (req, res) => {
    try {
        const limit = req.query.limit === "all" ? 0 : Math.min(Math.max(Number(req.query.limit) || 4, 1), 100);
        let query = Collection.find({})
            .select("name description image category createdBy nfts status createdAt updatedAt")
            .populate("createdBy", "username email")
            .populate("nfts", "name image price status isListed")
            .sort({ createdAt: -1 });

        if (limit > 0) query = query.limit(limit);

        const collections = await query.lean();
        return res.status(200).json({ success: true, count: collections.length, collections });
    } catch (error) {
        console.error("Admin collections error:", error);
        return res.status(500).json({ success: false, message: "Unable to load collections." });
    }
};

const getAdminCreators = async (req, res) => {
    try {
        const limit = req.query.limit === "all" ? 0 : Math.min(Math.max(Number(req.query.limit) || 4, 1), 100);
        const creatorIds = await NFT.distinct("createdBy", { createdBy: { $ne: null } });

        let query = User.find({ _id: { $in: creatorIds } })
            .select("username email avatar profileImage image createdAt updatedAt")
            .sort({ createdAt: -1 });

        if (limit > 0) query = query.limit(limit);

        const creators = await query.lean();
        const creatorDetails = await Promise.all(creators.map(async (creator) => {
            const [totalNFTs, totalListings, totalCollections] = await Promise.all([
                NFT.countDocuments({ createdBy: creator._id }),
                NFT.countDocuments({ createdBy: creator._id, status: "published", isListed: true }),
                Collection.countDocuments({ createdBy: creator._id })
            ]);

            return { ...creator, totalNFTs, totalListings, totalCollections };
        }));

        return res.status(200).json({ success: true, count: creatorDetails.length, creators: creatorDetails });
    } catch (error) {
        console.error("Admin creators error:", error);
        return res.status(500).json({ success: false, message: "Unable to load creators." });
    }
};

const getAdminListings = async (req, res) => {
    try {
        const limit = req.query.limit === "all" ? 0 : Math.min(Math.max(Number(req.query.limit) || 4, 1), 100);
        let query = NFT.find({ status: "published", isListed: true })
            .select("name image creator createdBy owner price status isListed createdAt updatedAt")
            .populate("createdBy", "username email")
            .populate("owner", "username email")
            .sort({ createdAt: -1 });

        if (limit > 0) query = query.limit(limit);

        const listings = (await query.lean()).map((nft) => ({
            ...nft,
            creatorName: nft.creator || nft.createdBy?.username || "Unknown Creator",
            ownerName: nft.owner?.username || "Unknown Owner",
            price: Number(nft.price || 0)
        }));

        return res.status(200).json({ success: true, count: listings.length, listings });
    } catch (error) {
        console.error("Admin listings error:", error);
        return res.status(500).json({ success: false, message: "Unable to load listings." });
    }
};

const getAdminActivities = async (req, res) => {
    try {
        const limit = req.query.limit === "all" ? 0 : Math.min(Math.max(Number(req.query.limit) || 4, 1), 100);
        let query = Activity.find({})
            .populate("user", "username email")
            .populate("nftId", "name image")
            .sort({ createdAt: -1 });

        if (limit > 0) query = query.limit(limit);

        const activities = await query.lean();
        return res.status(200).json({ success: true, count: activities.length, activities });
    } catch (error) {
        console.error("Admin activities error:", error);
        return res.status(500).json({ success: false, message: "Unable to load activities." });
    }
};

module.exports = {
    getDashboardStats,
    getRecentNFTs,
    getAdminCollections,
    getAdminCreators,
    getAdminListings,
    getAdminActivities
};
