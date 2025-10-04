import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { authRouter } from './routes/auth.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { cartRouter } from './routes/cart.routes.js';
import { wishlistRouter } from './routes/wishlist.routes.js';
import { checkoutRouter } from './routes/checkout.routes.js';
import { errorHandler } from './middleware/error.js';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";

const PORT = process.env.PORT || 5000;

// Initialize app
const app = express();

// Configure CORS
app.use(cors({
    origin: [ 
        'http://localhost:3000',
        'https://technest-frontend.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());

// Connect to Database
connectDB();

// Use routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/checkout', checkoutRouter);

// Serve static files from uploads directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error middleware
app.use(errorHandler);

// Swagger route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Redirect root to Swagger UI
app.get('/', (req, res) => res.redirect('/api-docs'));

// Example route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello World" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});