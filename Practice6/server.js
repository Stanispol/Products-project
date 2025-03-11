const WebSocket = require('ws'); // Подключаем WebSocket
const { ApolloServer, gql } = require('apollo-server-express'); // Добавляем GraphQL
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');

const PORT = 3000;

const app = express();

let products = [];  // Инициализируем переменную products глобально

// Функция загрузки продуктов
function loadProducts() {
    try {
        const data = fs.readFileSync('products.json', 'utf-8');
        products = JSON.parse(data);
        console.log('Products loaded:', products);
        return products;  // Возвращаем данные
    } catch (err) {
        console.error('Failed to load products.json:', err.message);
        products = [];
        return products;  // Возвращаем пустой массив в случае ошибки
    }
}

// Функция сохранения продуктов
function saveProducts() {
    fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf-8');
}

// Определение схемы GraphQL
const typeDefs = gql`
  type Product {
    id: ID!
    name: String!
    price: Float!
    description: String
    categories: [String]
  }

  type Query {
    products: [Product]
    product(id: ID!): Product
  }
`;

const resolvers = {
    Query: {
        products: () => loadProducts(),
        product: (_, { id }) => loadProducts().find(p => p.id == id),
    }
};

app.use(cors());
app.use(bodyParser.json());

// Создаём GraphQL-сервер
const server = new ApolloServer({ typeDefs, resolvers });

async function startServer() {
    // Инициализация сервера Apollo
    await server.start();
    server.applyMiddleware({ app });

    // Настройка Swagger
    const swaggerOptions = {
        swaggerDefinition: {
            openapi: '3.0.0',
            info: {
                title: 'Product Management API',
                version: '1.0.0',
                description: 'API для управления продуктами',
            },
            servers: [
                { url: 'http://localhost:3000' },
            ],
        },
        apis: ['openapi.yaml'],
    };
    
    const swaggerDocs = swaggerJsDoc(swaggerOptions);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

    // Запуск сервера Express
    app.listen(PORT, () => {
        console.log(`GraphQL API запущен на http://localhost:${PORT}/graphql`);
        console.log(`Swagger API Docs: http://localhost:${PORT}/api-docs`);
    });

    // Запуск WebSocket сервера
    const wss = new WebSocket.Server({ port: 8080 }); // WebSocket-сервер на порту 8080

    let chatHistory = [];  // Хранилище истории сообщений

    wss.on('connection', (ws) => {
        console.log('Новое подключение к WebSocket серверу');

        ws.send(JSON.stringify({ history: chatHistory }));

        ws.on('message', (message) => {
            console.log('📩 Сообщение получено:', message.toString());

            const parsedMessage = { text: message.toString() };
            chatHistory.push(parsedMessage); // Сохраняем сообщение в истории

            // Отправляем сообщение всем клиентам в формате JSON
            wss.clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ text: message.toString() })); // Отправляем JSON
                }
            });
        });

        ws.on('close', () => {
            console.log('Клиент отключился');
        });
    });

    console.log('WebSocket сервер запущен на ws://localhost:8080');
}

// Загружаем продукты при старте
loadProducts();

// Маршруты для работы с продуктами
app.get('/products', (req, res) => {
    res.json(products);
});

app.post('/products', (req, res) => {
    const { name, price, description, categories } = req.body;

    if (!name || !price || !description || !Array.isArray(categories)) {
        return res.status(400).json({ message: 'Invalid product data' });
    }

    const newProduct = {
        id: products.length ? products[products.length - 1].id + 1 : 1,
        name,
        price,
        description,
        categories
    };

    products.push(newProduct);
    saveProducts();

    res.status(201).json(newProduct);
});

app.get('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = products.find(p => p.id === productId);

    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

app.put('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = products.find(p => p.id === productId);

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    const { name, price, description, categories } = req.body;

    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    if (description !== undefined) product.description = description;
    if (categories !== undefined) product.categories = categories;

    saveProducts();
    res.json(product);
});

app.delete('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const initialLength = products.length;

    products = products.filter(p => p.id !== productId);

    if (products.length === initialLength) {
        return res.status(404).json({ message: 'Product not found' });
    }

    saveProducts();
    res.status(204).send();
});

// Запуск сервера
startServer();

