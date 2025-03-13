import React, { useState } from "react";
import Navbar from "./Navbar";
import { Plus, Tag, DollarSign, Star, Package, FileText, Upload, Loader, Check } from "lucide-react";
import "../styles/add-product.css";

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    rating: "",
    stock: "",
    image: null,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("description", formData.description);
      form.append("price", formData.price);
      form.append("category", formData.category);
      form.append("rating", formData.rating);
      form.append("stock", formData.stock);
      if (formData.image) {
        form.append("image", formData.image);
      }

      // Debug: log FormData keys
      for (let pair of form.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      const response = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.error || "Failed to add product");
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      resetForm();
    } catch (error) {
      console.error("Error details:", error);
      alert("Error adding product: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files?.length) {
      setFormData((prev) => ({ ...prev, image: files[0] }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      rating: "",
      stock: "",
      image: null,
    });
    setPreviewImage(null);
    const fileInput = document.getElementById("image-upload");
    if (fileInput) fileInput.value = "";
  };

  return (
    <>
      <Navbar />
      <div className="form-container">
        {showSuccess && (
          <div className="success-message">
            <Check size={24} className="success-icon" />
            <span>Product Added Successfully!</span>
          </div>
        )}

        <h2 className="page-title">
          <Plus className="inline-icon" size={28} />
          Add New Product
        </h2>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-card">
            <h3 className="section-title">Basic Information</h3>
            <div className="form-section">
              <div className="form-group">
                <label>
                  <Tag size={16} />
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <FileText size={16} />
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter product description"
                  rows="4"
                  required
                ></textarea>
              </div>
            </div>
          </div>

          <div className="form-card">
            <h3 className="section-title">Product Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <DollarSign size={16} />
                  Price (₹)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Enter price"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <Star size={16} />
                  Rating
                </label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                  placeholder="Enter rating (0-5)"
                  min="0"
                  max="5"
                  step="0.1"
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <Package size={16} />
                  Stock
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="Enter stock quantity"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  <FileText size={16} />
                  Category
                </label>
                <select name="category" value={formData.category} onChange={handleChange} required>
                  <option value="">Select Category</option>
                  <option value="Piece">Piece</option>
                  <option value="Yarn">Yarn</option>
                  <option value="Needles">Needles</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-card">
            <h3 className="section-title">Product Image</h3>
            <div className="image-upload-container">
              <div className="form-group image-upload">
                <label htmlFor="image-upload" className="upload-label">
                  <Upload size={24} />
                  <span>Click to upload or drag image here</span>
                </label>
                <input
                  type="file"
                  id="image-upload"
                  name="image"
                  onChange={handleChange}
                  accept="image/*"
                  required
                  className="file-input"
                />
              </div>
              {previewImage && (
                <div className="image-preview-container">
                  <h4>Image Preview</h4>
                  <div className="image-preview">
                    <img src={previewImage} alt="Product preview" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="button-group">
            <button type="button" className="btn-cancel" onClick={resetForm} disabled={isSubmitting}>
              Clear Form
            </button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader size={16} className="spinner" />
                  Adding Product...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddProduct;
