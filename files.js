const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('./db'); 
const path = require('path');
const fs = require('fs');
const configData = require('./config.json');



const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

const uploadDir = path.join(__dirname, configData.upload_dir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });



router.post('/file/upload', upload.single('file'), (req, res) => {

    const { originalname, mimetype, size } = req.file;
  
    const newFile = {
      name: originalname,
      extension: path.extname(originalname),
      name_in_file:uniqueSuffix + path.extname(originalname),
      mime_type: mimetype,
      size: size,
      upload_date: new Date(),
    };
  
    db.query('INSERT INTO files SET ?', newFile, (error, result) => {
      if (error) {
        console.error('Error inserting file info into database:', error);
        fs.unlinkSync(req.file.path);
        return res.status(500).json({ error: 'An error occurred' });
      }
  
      res.json({ message: 'File uploaded successfully', file_id: result.insertId });
    });
  });
  
router.get('/file/list', (req, res) => {
    const { page = 1, list_size = 10 } = req.query;
  
    const limit = parseInt(list_size);
    const offset = (parseInt(page) - 1) * limit;
  
    db.query('SELECT * FROM files LIMIT ? OFFSET ?', [limit, offset], (error, results) => {
      if (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'An error occurred' });
      }
  
      res.json({ files: results });
    });
});

router.delete('/file/delete/:id', (req, res) => {
    const fileId = req.params.id;
  
    db.query('SELECT * FROM files WHERE id = ?', [fileId], (error, results) => {
      if (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'An error occurred' });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }
  
      const file = results[0];
      const filePath = path.join(__dirname, 'uploads', file.name_in_file);
  
      fs.unlinkSync(filePath);
  
      db.query('DELETE FROM files WHERE id = ?', [fileId], (error) => {
        if (error) {
          console.error('Error deleting file from database:', error);
          return res.status(500).json({ error: 'An error occurred' });
        }
  
        res.json({ message: 'File deleted successfully' });
      });
    });
});

router.get('/file/:id', (req, res) => {
    const fileId = req.params.id;
  
    db.query('SELECT * FROM files WHERE id = ?', [fileId], (error, results) => {
      if (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'An error occurred' });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }
  
      const file = results[0];
      res.json({ file });
    });
});

router.get('/file/download/:id', (req, res) => {
    const fileId = req.params.id;
  
    db.query('SELECT * FROM files WHERE id = ?', [fileId], (error, results) => {
      if (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'An error occurred' });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ error: 'File not found' });
      }
  
      const file = results[0];
      const filePath = path.join(__dirname, 'uploads', file.name_in_file);
  
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
      res.download(filePath,  (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).json({ error: 'An error occurred while downloading the file' });
        }
      });
    });
});

router.put('/file/update/:id', upload.single('file'), (req, res) => {
    const fileId = req.params.id;
    const { originalname, mimetype, size } = req.file;
  
    db.query('SELECT * FROM files WHERE id = ?', [fileId], (error, results) => {
      if (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'An error occurred' });
      }
  
      if (results.length === 0) {
        // Удалить загруженный файл в случае ошибки
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'File not found' });
      }
  
      const file = results[0];
  
      if(file.extension !== path.extname(originalname)){
          // Удаляем старый файл из локального хранилища
          const oldFilePath = path.join(__dirname, 'uploads', file.name_in_file);
          fs.unlinkSync(oldFilePath);
      }
      
      // Обновляем информацию о файле в базе данных
      const updatedFile = {
        name: originalname,
        extension: path.extname(originalname),
        name_in_file: file.name_in_file.replace(file.extension,path.extname(originalname)),
        mime_type: mimetype,
        size: size,
      };
  
      db.query('UPDATE files SET ? WHERE id = ?', [updatedFile, fileId], (error) => {
        if (error) {
          console.error('Error updating file in database:', error);
          return res.status(500).json({ error: 'An error occurred' });
        }
  
        res.json({ message: 'File updated successfully' });
      });
    });
});

module.exports = router;