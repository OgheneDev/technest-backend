import express from 'express';
import { getProducts, getProductById, deleteProduct, updateProduct, createProduct, createProductReview, getProductReviews } from '../controllers/products.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/fileUpload.js';
import { body } from 'express-validator';

const router = express.Router();

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Retrieve a list of all products
 *     description: Fetches a paginated list of products with optional category filtering. Supports pagination via query parameters `page` and `limit`.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: ['cases', 'screen protectors', 'magsafe', 'cables', 'chargers', 'powerbanks', 'headphones', 'speakers', 'smartwatches', 'tablets', 'laptops', 'accessories']
 *         description: Filter products by category
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalItems:
 *                       type: integer
 *                       example: 50
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *             example:
 *               success: true
 *               pagination:
 *                 currentPage: 1
 *                 totalPages: 5
 *                 totalItems: 50
 *                 itemsPerPage: 10
 *               data:
 *                 - _id: "507f1f77bcf86cd799439011"
 *                   name: "Sample Case"
 *                   images: ["/uploads/products/sample-case.jpg"]
 *                   description: "A durable phone case"
 *                   price: 19.99
 *                   rating: 4.5
 *                   stock: 100
 *                   category: "Cases"
 *                   createdAt: "2025-10-04T22:30:00.000Z"
 *                   updatedAt: "2025-10-04T22:30:00.000Z"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Server Error
 */
router.get('/', getProducts);

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     summary: Retrieve a single product by ID
 *     description: Fetches detailed information about a specific product identified by its ID.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to retrieve
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Successfully retrieved the product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *             example:
 *               success: true
 *               data:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 name: "Sample Case"
 *                 images: ["/uploads/products/sample-case.jpg"]
 *                 description: "A durable phone case"
 *                 price: 19.99
 *                 rating: 4.5
 *                 stock: 100
 *                 category: "Cases"
 *                 createdAt: "2025-10-04T22:30:00.000Z"
 *                 updatedAt: "2025-10-04T22:30:00.000Z"
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Product not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Server Error
 */
router.get('/:id', getProductById);

/**
 * @openapi
 * /api/products/add:
 *   post:
 *     summary: Create a new product
 *     description: Creates a new product with the provided details. Requires admin authentication and supports uploading multiple images. Validates input data before creation.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - description
 *               - stock
 *               - category
 *               - images
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the product (max 100 characters)
 *                 example: "Sample Case"
 *               price:
 *                 type: number
 *                 description: Price of the product
 *                 example: 19.99
 *               description:
 *                 type: string
 *                 description: Description of the product (max 500 characters)
 *                 example: "A durable phone case"
 *               stock:
 *                 type: number
 *                 description: Available stock quantity
 *                 example: 100
 *               category:
 *                 type: string
 *                 enum: ['cases', 'screen protectors', 'magsafe', 'cables', 'chargers', 'powerbanks', 'headphones', 'speakers', 'smartwatches', 'tablets', 'laptops', 'accessories']
 *                 description: Product category
 *                 example: "Cases"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Product images to upload
 *     responses:
 *       201:
 *         description: Product successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *             example:
 *               success: true
 *               data:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 name: "Sample Case"
 *                 images: ["/uploads/products/sample-case.jpg"]
 *                 description: "A durable phone case"
 *                 price: 19.99
 *                 rating: 0
 *                 stock: 100
 *                 category: "Cases"
 *                 createdAt: "2025-10-04T22:30:00.000Z"
 *                 updatedAt: "2025-10-04T22:30:00.000Z"
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                       param:
 *                         type: string
 *                       location:
 *                         type: string
 *             example:
 *               errors:
 *                 - msg: "Please add a product name"
 *                   param: "name"
 *                   location: "body"
 *       401:
 *         description: Unauthorized access, invalid or missing token
 *       403:
 *         description: Forbidden, user is not an admin
 */
router.post('/add', protect, authorize('admin'), uploadMultiple, createProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     description: Deletes a specific product identified by its ID. Requires admin authentication.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to delete
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Product successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   example: {}
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Product not found
 *       401:
 *         description: Unauthorized access, invalid or missing token
 *       403:
 *         description: Forbidden, user is not an admin
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Server Error
 */
router.delete('/:id', protect, authorize('admin'), deleteProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     summary: Update a product by ID
 *     description: Updates a specific product's details identified by its ID. Requires admin authentication and supports updating images. Validates input data before updating.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to update
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated name of the product (max 100 characters)
 *                 example: "Updated Sample Case"
 *               price:
 *                 type: number
 *                 description: Updated price of the product
 *                 example: 24.99
 *               description:
 *                 type: string
 *                 description: Updated description of the product (max 500 characters)
 *                 example: "An updated durable phone case"
 *               stock:
 *                 type: number
 *                 description: Updated stock quantity
 *                 example: 150
 *               category:
 *                 type: string
 *                 enum: ['cases', 'screen protectors', 'magsafe', 'cables', 'chargers', 'powerbanks', 'headphones', 'speakers', 'smartwatches', 'tablets', 'laptops', 'accessories']
 *                 description: Updated product category
 *                 example: "Cases"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Updated product images to upload
 *     responses:
 *       200:
 *         description: Product successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *             example:
 *               success: true
 *               data:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 name: "Updated Sample Case"
 *                 images: ["/uploads/products/updated-sample-case.jpg"]
 *                 description: "An updated durable phone case"
 *                 price: 24.99
 *                 rating: 4.5
 *                 stock: 150
 *                 category: "Cases"
 *                 createdAt: "2025-10-04T22:30:00.000Z"
 *                 updatedAt: "2025-10-04T23:00:00.000Z"
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                       param:
 *                         type: string
 *                       location:
 *                         type: string
 *             example:
 *               errors:
 *                 - msg: "Price cannot be negative"
 *                   param: "price"
 *                   location: "body"
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Product not found
 *       401:
 *         description: Unauthorized access, invalid or missing token
 *       403:
 *         description: Forbidden, user is not an admin
 */
router.put('/:id', protect, authorize('admin'), uploadMultiple, updateProduct);

/**
 * @openapi
 * /api/products/{id}/reviews:
 *   post:
 *     summary: Add a review for a product
 *     description: Allows authenticated users to post a review (rating and optional comment) for a specific product. Users can only review a product once.
 *     tags:
 *       - Reviews
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to review
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 description: Rating for the product (1 to 5)
 *                 example: 4
 *               comment:
 *                 type: string
 *                 description: Optional review comment (max 500 characters)
 *                 example: "Great product, very durable!"
 *     responses:
 *       201:
 *         description: Review successfully added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid request data or user already reviewed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: You have already reviewed this product
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized access, invalid or missing token
 */
router.post(
  '/:id/reviews',
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment cannot be more than 500 characters')
  ],
  createProductReview
);

/**
 * @openapi
 * /api/products/{id}/reviews:
 *   get:
 *     summary: Get all reviews for a product
 *     description: Retrieves all reviews for a specific product, including user details.
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Successfully retrieved reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *             example:
 *               success: true
 *               data:
 *                 - user:
 *                     _id: "507f1f77bcf86cd799439012"
 *                     name: "John Doe"
 *                     email: "john@example.com"
 *                   rating: 4
 *                   comment: "Great product, very durable!"
 *                   createdAt: "2025-10-11T19:13:00.000Z"
 *                 - user:
 *                     _id: "507f1f77bcf86cd799439013"
 *                     name: "Jane Doe"
 *                     email: "jane@example.com"
 *                   rating: 5
 *                   comment: "Absolutely fantastic!"
 *                   createdAt: "2025-10-11T20:00:00.000Z"
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Product not found
 *       500:
 *         description: Server error
 */
router.get('/:id/reviews', getProductReviews);

/**
 * @openapi
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               description: ID of the user who posted the review
 *             name:
 *               type: string
 *               description: Name of the user
 *             email:
 *               type: string
 *               description: Email of the user
 *         rating:
 *           type: number
 *           description: Rating given in the review (1 to 5)
 *         comment:
 *           type: string
 *           description: Optional review comment (max 500 characters)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date the review was created
 */

export const productsRouter = router;

/**
 * @openapi
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the product
 *         name:
 *           type: string
 *           description: Name of the product (max 100 characters)
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: List of image URLs for the product
 *         description:
 *           type: string
 *           description: Description of the product (max 500 characters)
 *         price:
 *           type: number
 *           description: Price of the product
 *         rating:
 *           type: number
 *           description: Average rating of the product (0 to 5)
 *         stock:
 *           type: number
 *           description: Available stock quantity
 *         category:
 *           type: string
 *           enum: ['cases', 'screen protectors', 'magsafe', 'cables', 'chargers', 'powerbanks', 'headphones', 'speakers', 'smartwatches', 'tablets', 'laptops', 'accessories']
 *           description: Product category
 *         createdAt:
 *           type: string
 *           format: date-time 
 *           description: Date the product was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date the product was last updated
 */
