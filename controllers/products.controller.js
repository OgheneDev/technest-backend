import Product from "../models/products.js";
import { validationResult } from "express-validator";
import { uploadBuffer } from "../utils/cloudinary.js";

// @desc Get all products
// @route GET /api/products
// @access Public

export const getProducts = async (req, res) => {
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
    const products = await Product.find(query).skip(startIndex).limit(limit);

    // Pagination result
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
    };

    res.status(200).json({
      success: true,
      pagination,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// @desc Create Product
// @route POST /api/products/add
// @access Private/Admin
export const createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // If files are present (memory buffers), upload them to Cloudinary
    if (req.files && req.files.length) {
      const uploads = await Promise.all(
        req.files.map((file) =>
          uploadBuffer(file.buffer, { folder: "technest/products" })
        )
      );
      req.body.images = uploads.map((u) => u.secure_url);
    }

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete product
// @route DELETE /api/products/:id
// @access Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    await product.deleteOne();
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Server Error",
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
        error: "Product not found",
      });
    }

    // Upload new images if provided
    if (req.files && req.files.length) {
      const uploads = await Promise.all(
        req.files.map((file) =>
          uploadBuffer(file.buffer, { folder: "technest/products" })
        )
      );
      req.body.images = uploads.map((u) => u.secure_url);
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single product
// @route GET /api/products/:id
// @access Public
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// @desc Add a review for a product
// @route POST /api/products/:id/reviews
// @access Private
export const createProductReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Check if user already reviewed the product
    const alreadyReviewed = product.reviews.some(
      (review) => review.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        error: "You have already reviewed this product",
      });
    }

    // Create new review
    const review = {
      user: req.user._id,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    await product.save();

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all reviews for a product
// @route GET /api/products/:id/reviews
// @access Public
export const getProductReviews = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "reviews.user",
      "firstName lastName avatar"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product.reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};
