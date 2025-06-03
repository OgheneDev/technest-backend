import Product from '../models/products.js'
import { validationResult } from 'express-validator'

// @desc Get all products
// @route GET /api/products
// @access Public

export const getProducts = async (req, res, next) => {
    try {
        //Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        // Build query
        let query = {};

        // Filter by category
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Execute query with pagination
        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .skip(startIndex)
            .limit(limit);

        // Pagination result
        const pagination = {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit
        };

        res.status(200).json({
            success: true,
            pagination,
            data: products
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
}

// @desc Create Product
// @route POST /api/products/add
// @access Private/Admin
export const createProduct = async (req, res, next) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const product = Product.create(req.body);

        res.status(201).json({
         success: true,
          data: product
        });
    } catch (error) {
        next(error);
    }
}

// @desc Delete product
// @route DELETE /api/products/:id
// @access Private/Admin
export const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        await product.deleteOne();  // Changed from remove() to deleteOne()
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error(error);  // Add error logging
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc Update product
// @route PUT /api/products/:id
// @access Private/Admin
export const updateProduct = async (req, res, next) => {
    try {
        let product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};