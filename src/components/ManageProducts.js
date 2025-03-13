import React, { useState, useEffect, useRef } from "react";
import Navbar from "./Navbar";
import { Package, X, Edit2, Trash2, Plus, Star, DollarSign, Tag, Box, Loader, AlertCircle, ChevronRight } from "lucide-react";
import "../styles/manage-products.css";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    rating: "",
    stock: "",
    image: null,
  });
  const [loading, setLoading] = useState(true);
  const [isScrollable, setIsScrollable] = useState(false);
  const tableWrapperRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    
    // Check if table is scrollable
    const checkScrollable = () => {
      if (tableWrapperRef.current) {
        setIsScrollable(tableWrapperRef.current.scrollWidth > tableWrapperRef.current.clientWidth);
      }
    };
    
    // Initial check
    checkScrollable();
    
    // Listen for window resize
    window.addEventListener('resize', checkScrollable);
    
    return () => {
      window.removeEventListener('resize', checkScrollable);
    };
  }, []);

  // Update scroll check when products load
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        if (tableWrapperRef.current) {
          setIsScrollable(tableWrapperRef.current.scrollWidth > tableWrapperRef.current.clientWidth);
        }
      }, 100);
    }
  }, [loading, products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/products");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        throw new Error("Invalid data format received");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      alert(`Error fetching products: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("description", formData.description);
      form.append("price", formData.price);
      form.append("category", formData.category);
      form.append("rating", formData.rating);
      form.append("stock", formData.stock);

      // Append image only if a new file was selected
      if (formData.image instanceof File) {
        form.append("image", formData.image);
      }

      const response = await fetch(
        `http://localhost:5000/api/products/${editingProduct._id}`,
        {
          method: "PUT",
          body: form,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      alert("Product updated successfully!");
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Update error:", error);
      alert("Error updating product: " + error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files && files[0] ? files[0] : value,
    }));
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      rating: product.rating,
      stock: product.stock,
      image: product.image, // initially a string; will change to a File if updated
    });
    setIsEditModalOpen(true);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    // Re-enable body scrolling
    document.body.style.overflow = 'auto';
  };

  const openAddModal = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      rating: "",
      stock: "",
      image: null,
    });
    setIsAddModalOpen(true);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };
  
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    // Re-enable body scrolling
    document.body.style.overflow = 'auto';
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete product");
      }
      alert("Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      console.error("Delete error:", error);
      alert(`Error deleting product: ${error.message}`);
    }
  };

  // Helper function to determine stock class
  const getStockClass = (stock) => {
    if (stock <= 0) return "stock-cell out";
    if (stock <= 10) return "stock-cell low";
    return "stock-cell";
  };

  const renderEmptyState = () => (
    <div className="empty-state">
      <Package size={48} />
      <h3>No products available</h3>
      <p>Add your first product to get started with inventory management</p>
    </div>
  );

  const renderLoadingState = () => (
    <div className="loading-indicator">
      <Loader size={36} />
      <p>Loading products...</p>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="manage-container">
        <div className="header-section">
          <h2>
            <Package size={22} />
            Manage Products
          </h2>
          <button className="btn-add" onClick={openAddModal}>
            <Plus size={18} /> Add New Product
          </button>
        </div>

        <div className="products-card">
          {/* Table View for Desktop/Tablet */}
          <div className="products-table-wrapper" ref={tableWrapperRef}>
            {isScrollable && <div className="scroll-indicator">Scroll to see more <ChevronRight size={14} /></div>}
            <div className="products-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8">
                        {renderLoadingState()}
                      </td>
                    </tr>
                  ) : products.length > 0 ? (
                    products.map((product) => (
                      <tr key={product._id}>
                        <td>#{product.id}</td>
                        <td>
                          <div className="product-cell">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="product-image"
                            />
                            <span className="product-name">{product.name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="description-cell">
                            {product.description}
                          </div>
                        </td>
                        <td><span className="category-cell">{product.category}</span></td>
                        <td className="price-cell">₹{Number(product.price).toLocaleString()}</td>
                        <td className={getStockClass(product.stock)}>{product.stock}</td>
                        <td>
                          <span className="product-rating">
                            <Star size={14} fill="#F59F00" stroke="#F59F00" /> {product.rating}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => openEditModal(product)} className="btn-edit">
                              <Edit2 size={14} />
                              <span className="button-text">Edit</span>
                            </button>
                            <button onClick={() => deleteProduct(product._id)} className="btn-delete">
                              <Trash2 size={14} />
                              <span className="button-text">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8">{renderEmptyState()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card View for Mobile */}
          <div className="product-card-container">
            {loading ? (
              renderLoadingState()
            ) : products.length > 0 ? (
              products.map((product) => (
                <div className="product-card" key={product._id}>
                  <div className="product-card-header">
                    <img src={product.image} alt={product.name} className="product-image" />
                    <div>
                      <h3>{product.name}</h3>
                      <span className="product-rating">
                        <Star size={14} fill="#F59F00" stroke="#F59F00" /> {product.rating}
                      </span>
                    </div>
                  </div>
                  <div className="product-card-details">
                    <p>
                      <span>ID:</span>
                      <span>#{product.id}</span>
                    </p>
                    <p>
                      <span>Description:</span>
                      <span>{product.description.length > 80 
                        ? `${product.description.substring(0, 80)}...` 
                        : product.description}</span>
                    </p>
                    <p>
                      <span><Tag size={14} /> Category:</span>
                      <span>{product.category}</span>
                    </p>
                    <p>
                      <span><DollarSign size={14} /> Price:</span>
                      <span>₹{Number(product.price).toLocaleString()}</span>
                    </p>
                    <p>
                      <span><Box size={14} /> Stock:</span>
                      <span className={getStockClass(product.stock)}>{product.stock}</span>
                    </p>
                  </div>
                  <div className="product-card-actions">
                    <button onClick={() => openEditModal(product)} className="btn-edit">
                      <Edit2 size={14} />
                      <span className="button-text">Edit</span>
                    </button>
                    <button onClick={() => deleteProduct(product._id)} className="btn-delete">
                      <Trash2 size={14} />
                      <span className="button-text">Delete</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              renderEmptyState()
            )}
          </div>
        </div>

        {/* Edit Product Modal */}
        {isEditModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3><Edit2 size={18} /> Edit Product</h3>
                <button className="close-btn" onClick={closeEditModal}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label htmlFor="edit-name">Name</label>
                  <input 
                    id="edit-name"
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    className="form-control" 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-description">Description</label>
                  <textarea 
                    id="edit-description"
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    required 
                    className="form-control"
                  ></textarea>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-price">Price</label>
                    <input 
                      id="edit-price"
                      type="number" 
                      name="price" 
                      value={formData.price} 
                      onChange={handleChange} 
                      required 
                      className="form-control" 
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-category">Category</label>
                    <input 
                      id="edit-category"
                      type="text" 
                      name="category" 
                      value={formData.category} 
                      onChange={handleChange} 
                      required 
                      className="form-control" 
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-rating">Rating</label>
                    <input 
                      id="edit-rating"
                      type="number" 
                      name="rating" 
                      value={formData.rating} 
                      onChange={handleChange} 
                      required 
                      className="form-control" 
                      min="0" 
                      max="5" 
                      step="0.1"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-stock">Stock</label>
                    <input 
                      id="edit-stock"
                      type="number" 
                      name="stock" 
                      value={formData.stock} 
                      onChange={handleChange} 
                      required 
                      className="form-control" 
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-image">Update Image (optional)</label>
                  <input 
                    id="edit-image"
                    type="file" 
                    name="image" 
                    onChange={handleChange} 
                    accept="image/*" 
                    className="form-control file-input" 
                  />
                  {typeof formData.image === 'string' && (
                    <div className="current-image-preview">
                      <p>Current image:</p>
                      <img src={formData.image} alt="Current product" width="100" />
                    </div>
                  )}
                </div>
                <div className="button-group">
                  <button type="button" className="btn-cancel" onClick={closeEditModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    Update Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Product Modal */}
        {isAddModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3><Plus size={18} /> Add New Product</h3>
                <button className="close-btn" onClick={closeAddModal}>
                  <X size={20} />
                </button>
              </div>
              <form>
                <div className="form-group">
                  <label htmlFor="add-name">Name</label>
                  <input 
                    id="add-name"
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    className="form-control" 
                    placeholder="Product name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="add-description">Description</label>
                  <textarea 
                    id="add-description"
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    required 
                    className="form-control"
                    placeholder="Describe your product"
                  ></textarea>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="add-price">Price</label>
                    <input 
                      id="add-price"
                      type="number" 
                      name="price" 
                      value={formData.price} 
                      onChange={handleChange} 
                      required 
                      className="form-control" 
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-category">Category</label>
                    <input 
                      id="add-category"
                      type="text" 
                      name="category" 
                      value={formData.category} 
                      onChange={handleChange} 
                      required 
                      className="form-control" 
                      placeholder="Category"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="add-rating">Rating</label>
                    <input 
                      id="add-rating"
                      type="number" 
                      name="rating" 
                      value={formData.rating} 
                      onChange={handleChange} 
                      required 
                      className="form-control" 
                      min="0" 
                      max="5" 
                      step="0.1"
                      placeholder="0.0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="add-stock">Stock</label>
                    <input 
                      id="add-stock"
                      type="number" 
                      name="stock" 
                      value={formData.stock} 
                      onChange={handleChange} 
                      required 
                      className="form-control" 
                      min="0"
                      step="1"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="add-image">Product Image</label>
                  <input 
                    id="add-image"
                    type="file" 
                    name="image" 
                    onChange={handleChange} 
                    accept="image/*" 
                    className="form-control file-input" 
                  />
                </div>
                <div className="button-group">
                  <button type="button" className="btn-cancel" onClick={closeAddModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    Add Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ManageProducts;
