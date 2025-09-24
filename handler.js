const serverlessExpress = require("@vendia/serverless-express");
const app = require("./server"); // exports app instance

exports.handler = serverlessExpress({ app });
