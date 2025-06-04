import express from 'express';
import { getProducts, getProductById, deleteProduct, updateProduct, createProduct } from '../controllers/products.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/fileUpload.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/add', protect, authorize('admin'), uploadMultiple, createProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.put('/:id', protect, authorize('admin'), uploadMultiple, updateProduct);

export const productsRouter = router;
