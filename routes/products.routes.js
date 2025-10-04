import express from 'express';
import { getProducts, getProductById, deleteProduct, updateProduct, createProduct } from '../controllers/products.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/fileUpload.js';

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Retrieve a list of all products
 * @access  Public
 */
router.get('/', getProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Retrieve a single product by ID
 * @access  Public
 */
router.get('/:id', getProductById);

/**
 * @route   POST /api/products/add
 * @desc    Create a new product (supports multiple images)
 * @access  Private (admin)
 */
router.post('/add', protect, authorize('admin'), uploadMultiple, createProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product by ID
 * @access  Private (admin)
 */
router.delete('/:id', protect, authorize('admin'), deleteProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product by ID (supports multiple images)
 * @access  Private (admin)
 */
router.put('/:id', protect, authorize('admin'), uploadMultiple, updateProduct);

export const productsRouter = router;
