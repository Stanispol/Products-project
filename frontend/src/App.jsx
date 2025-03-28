
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
    fetchProducts,
    addProduct,
    deleteProduct,
    updateProduct,
} from "./features/productsSlice";
import '../index_style.css';  


function App() {
  const dispatch = useDispatch();
  const { items: products, status, error } = useSelector((state) => state.products);

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    categories: "",
  });

  const [editProduct, setEditProduct] = useState(null);

  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleBackground = () => {
      setIsDarkMode((prevMode) => !prevMode);
  };
  useEffect(() => {
    document.body.className = isDarkMode ? 'bg-gray-900 text-black' : 'bg-mint-200 text-black';
  }, [isDarkMode]);
  
  

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const [updateCounter, setUpdateCounter] = useState(0);


  const handleAddProduct = () => {
    const newProductData = {
      ...newProduct,
      categories: newProduct.categories.split(",").map((cat) => cat.trim()),
    };
  
    dispatch(addProduct(newProductData));  
    setNewProduct({ name: "", price: "", description: "", categories: "" }); 
    location.reload(); 
  };
  
  

  // Удаление товара
  const handleDeleteProduct = (id) => {
    if (window.confirm("Вы уверены, что хотите удалить этот товар?")) {
      dispatch(deleteProduct(id));
      location.reload();
    }
  };

  // Редактирование товара
  const handleEditClick = (product) => {
    console.log("Редактируем товар:", product); 
    setEditProduct(product); 
  };
  
  const handleSaveEdit = () => {
    if (editProduct) {
      const updatedProduct = {
        ...editProduct,
        categories: Array.isArray(editProduct.categories)
          ? editProduct.categories 
          : editProduct.categories.split(',').map((cat) => cat.trim()), 
      };
  
      dispatch(updateProduct(updatedProduct));
      setEditProduct(null);
      location.reload(); 

    }
  };
  

  return (
    <div>
      <div
        className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-500 ${
          isDarkMode ? 'bg-gray-900 text-black' : 'bg-mint-200 text-black'
        }`}
      >
            <h1 className="text-2xl mb-4">
                {isDarkMode ? 'Тёмный режим' : 'Светлый режим'}
            </h1>
            <button
                className="bg-green-500 text-black px-2 py-1 text-sm rounded-md hover:bg-green-900"
                onClick={toggleBackground}
            >
                Переключить фон
            </button>
        </div>
      <h1>Редактирование товаров</h1>

      {/* Модальное окно для редактирования */}
      {editProduct && (
        <div id="modal-overlay" onClick={() => setEditProduct(null)}>
          <div id="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Редактирование товара</h3>
            <input
              type="text"
              value={editProduct.name}
              onChange={(e) =>
                setEditProduct({ ...editProduct, name: e.target.value })
              }
            />
            <input
              type="number"
              value={editProduct.price}
              onChange={(e) =>
                setEditProduct({ ...editProduct, price: Number(e.target.value) })
              }
            />
            <textarea
              value={editProduct.description}
              onChange={(e) =>
                setEditProduct({ ...editProduct, description: e.target.value })
              }
            />
            <input
              type="text"
              value={editProduct.categories}
              onChange={(e) =>
                setEditProduct({ ...editProduct, categories: e.target.value })
              }
            />
            <button onClick={handleSaveEdit}>Сохранить</button>
            <button onClick={() => setEditProduct(null)}>Отмена</button>
          </div>
        </div>
      )}

      {/* Форма добавления товара */}
      <div className="form-container">
        <h3>Добавить новый товар</h3>
        <input
          type="text"
          value={newProduct.name}
          onChange={(e) =>
            setNewProduct({ ...newProduct, name: e.target.value })
          }
          placeholder="Название"
        />
        <input
          type="number"
          value={newProduct.price}
          onChange={(e) =>
            setNewProduct({ ...newProduct, price: e.target.value })
          }
          placeholder="Цена"
        />
        <textarea
          value={newProduct.description}
          onChange={(e) =>
            setNewProduct({ ...newProduct, description: e.target.value })
          }
          placeholder="Описание"
        />
        <input
          type="text"
          value={newProduct.categories}
          onChange={(e) =>
            setNewProduct({ ...newProduct, categories: e.target.value })
          }
          placeholder="Категории (через запятую)"
        />
        <button onClick={handleAddProduct}>Добавить</button>
      </div>

      {/* Статусы загрузки */}
      {status === "loading" && <p>Загрузка товаров...</p>}
      {status === "failed" && <p>Ошибка: {error}</p>}

      {/* Список товаров */}
      <ul className="app-product-list">
      {products.map((product) => (
        <li key={product.id} className="app-product-card">
          {product.name} - {product.price} ₽
          <button onClick={() => handleDeleteProduct(product.id)}>
            Удалить
          </button>
          <button onClick={() => handleEditClick(product)}>
            Редактировать
          </button>
        </li>
      ))}
    </ul>
    </div>
  );
}

export default App;
