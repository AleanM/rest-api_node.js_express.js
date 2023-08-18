const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const configData = require('./config.json');


const app = express();
const port = process.env.PORT || configData.PORT;

app.use(cors());
app.use(bodyParser.json());

app.use('/auth', authRoutes);
app.use('/files', fileRoutes);
 

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });