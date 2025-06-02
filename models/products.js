import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a product name'],
        trim: true,
        maxlength: [100, 'Product name cannot exceed 100 characters']
    },
    images: {
        type: [String],
        required: [true, 'Please add product images'],
        validate: {
            validator: function(v) {
                return v.length > 0;
            },
            message: 'At least one image is required'
        }
    },
    description: {
        type: String,
        required: [true, 'Please add a product description'],
        maxlength: [500, 'Product description cannot exceed 500 characters']
    },
    price: {
        type: Number,
        required: [true, 'Please add a product price'],
        min: [0, 'Price cannot be negative']
    },
    rating: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be less than 0'],
        max: [5, 'Rating cannot exceed 5']
    },
    stock: {
        type: Number,
        required: [true, 'Please add product stock'],
        min: [0, 'Stock cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Please add a product category'],
        enum: ['Cases', 'Screen Protectors', 'MagSafe', 'Cables', 'Chargers', 'Powerbanks', 'Headphones', 'Speakers', 'Smartwatches', 'Tablets', 'Laptops', 'Accessories'],
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Product = mongoose.model('Product', ProductSchema);

export default Product;