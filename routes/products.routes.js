import express from 'express';
import { getProducts, deleteProduct, updateProduct, createProduct } from '../controllers/products.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getProducts);
router.post('/add', createProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);

export const productsRouter = router;
