// const corsOptions = {
//   origin: process.env.FRONTEND_URL,
//   credentials: true,
// };

// module.exports = corsOptions;


// const corsOptions = {
//     origin: process.env.FRONTEND_URL,   
//     credentials: true,
// };

// module.exports = corsOptions;



//new code 




const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173", "https://nifty-verse.vercel.app"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

module.exports = corsOptions;

