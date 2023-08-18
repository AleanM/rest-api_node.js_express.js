const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const configData = require('./config.json');

const jwtSecretKey = configData.secretKey; 

const timelife_access_token = 600 // 10 min

const timelife_refresh_token = 604800 // 7 days

router.post('/signin', (req, res) => {
    const postData = req.body;
  
    const user = {
      "email": postData.email,
      "password": postData.password
       }
  
  
    db.query('SELECT * FROM users WHERE email = ?', [user.email], (error, results) => {
      if (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'An error occurred' });
      }
  
      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      const userDB = results[0];
      const passwordMatch = bcrypt.compareSync(user.password, userDB.password);
  
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid password' });
      }
  
     
      const authToken = jwt.sign(user, jwtSecretKey, { expiresIn: '10m' });
  
      
      const refreshToken = jwt.sign(user, jwtSecretKey, { expiresIn: '7d' });
  
      
      const accessExpiresAt = Math.floor(Date.now() / 1000) + (timelife_access_token); 
  
      const refreshExpiresAt = Math.floor(Date.now() / 1000) + (timelife_refresh_token); 
  
  
      db.query('UPDATE users SET refresh_token = ?, access_token = ?, access_token_expiresAt = ?, refresh_token_expiresAt = ? WHERE email = ?',
        [refreshToken, authToken, accessExpiresAt, refreshExpiresAt, user.email], (error) => {
          if (error) {
            console.error('Error updating tokens in database:', error);
            return res.status(500).json({ error: 'An error occurred' });
          }
  
          res.json({ authToken, refreshToken, accessExpiresAt });
        });
    });
  });

router.post('/signin/new_token', (req, res) => {
    const authToken = req.headers.authorization;
  

if (!authToken) {
  return res.status(400).json({ error: 'Authorization header is missing' });
}


const token = authToken.split(' ')[1];

db.query('SELECT * FROM users WHERE refresh_token = ?', [token], (error, results) => {
  if (error) {
    console.error('Error querying the database:', error);
    return res.status(500).json({ error: 'An error occurred' });
  }

  const fromDB = results[0];

  if (!fromDB) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (fromDB.refresh_token_expiresAt <= Math.floor(Date.now() / 1000)) {
    return res.status(401).json({ error: 'Refresh token has expired' });
  }

  const user = {
    email: fromDB.email,
  };

  const newAuthToken = jwt.sign(user, jwtSecretKey, { expiresIn: '10m' });
  const newRefreshToken = jwt.sign(user, jwtSecretKey, { expiresIn: '7d' });

  const accessExpiresAt = Math.floor(Date.now() / 1000) + timelife_access_token;
  const refreshExpiresAt = Math.floor(Date.now() / 1000) + timelife_refresh_token;

  db.query(
    'UPDATE users SET access_token = ?, access_token_expiresAt = ?, refresh_token = ?, refresh_token_expiresAt = ? WHERE refresh_token = ?',
    [newAuthToken, accessExpiresAt, newRefreshToken, refreshExpiresAt, token],
    (updateError) => {
      if (updateError) {
        console.error('Error updating access token in the database:', updateError);
        return res.status(500).json({ error: 'An error occurred' });
      }

      res.json({ authToken: newAuthToken });
    }
  );
});
  });

router.post('/signup', (req, res) => {
    const postData = req.body;
  
    const user = {
      "email": postData.email,
      "password": postData.password
       }
  
  
    db.query('SELECT * FROM users WHERE email = ?', [postData.email], (error, results) => {
      if (error) {
        console.error('Error querying database:', error);
        return res.status(500).json({ error: 'An error occurred' });
      }
  
      if (results.length > 0) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
  
    
      const hashedPassword = bcrypt.hashSync(postData.password, 10);
  
      const authToken = jwt.sign(user, jwtSecretKey, { expiresIn: '10m' });
      
      const refreshToken = jwt.sign(user, jwtSecretKey, { expiresIn: '7d' });
  
      const accessExpiresAt = Math.floor((Date.now() / 1000) + (timelife_access_token));
  
      const refreshExpiresAt = Math.floor(Date.now() / 1000) + (timelife_refresh_token); 
  
      db.query('INSERT INTO users (email, password, refresh_token, access_token, access_token_expiresAt, refresh_token_expiresAt) VALUES (?, ?, ?, ?, ?, ?)', [postData.email, hashedPassword, refreshToken, authToken, accessExpiresAt, refreshExpiresAt], (error) => {
        if (error) {
          console.error('Error inserting into database:', error);
          return res.status(500).json({ error: 'An error occurred' });
        }
  
        
  
        res.json({ authToken, refreshToken, accessExpiresAt });
      });
    });
  });
router.get('/info', (req, res) => {

    const authToken = req.headers.authorization;

  
    if (!authToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    
    const token = authToken.replace('Bearer ', '');
  
    try {
      
      const decodedToken = jwt.verify(token, jwtSecretKey);
  
      
      const { email } = decodedToken;
  
      res.json({ email });
    } catch (error) {
      console.error('Error verifying JWT:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  });
router.get('/logout', (req, res) => {
    const authToken = req.headers.authorization;
  
    
  
    if (!authToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    
    const token = authToken.replace('Bearer ', '');
  
    try {
      
      const decodedToken = jwt.verify(token, jwtSecretKey);
  
      
      const { email } = decodedToken;
  
     
      const authToken = jwt.sign({email}, jwtSecretKey, { expiresIn: '10m' });
    
      const refreshToken = jwt.sign({email}, jwtSecretKey, { expiresIn: '7d' });
  
      const accessExpiresAt = Math.floor(Date.now() / 1000) + (timelife_access_token); 
  
      const refreshExpiresAt = Math.floor(Date.now() / 1000) + (timelife_refresh_token); 
  
      
      db.query('UPDATE users SET access_token = ?, access_token_expiresAt = ?, refresh_token = ?, refresh_token_expiresAt = ? WHERE email = ?',
        [authToken, accessExpiresAt, refreshToken, refreshExpiresAt, email], (error) => {
          if (error) {
            console.error('Error updating access token in database:', error);
            return res.status(500).json({ error: 'An error occurred' });
          }
  
        res.json({ message: 'Logged out successfully' });
      });
    } catch (error) {
      console.error('Error verifying JWT:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  });

module.exports = router;