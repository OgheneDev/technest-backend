// swagger.js
import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Technest API",
      version: "1.0.0",
      description: "API documentation for Technest",
    },
    servers: [
      {
        url: "https://technest-ohai.onrender.com",
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to your route files
};

export const swaggerSpec = swaggerJSDoc(options);
