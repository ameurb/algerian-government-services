const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function testSQLiteDatabase() {
  const dbPath = path.join(__dirname, 'db', 'dev.db');
  console.log('🔍 Testing SQLite database at:', dbPath);
  
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err);
      return;
    }
    console.log('✅ Connected to SQLite database');
  });
  
  // Test categories table
  console.log('\n📊 Categories in database:');
  db.all('SELECT * FROM categories LIMIT 5', [], (err, rows) => {
    if (err) {
      console.error('❌ Error querying categories:', err);
    } else {
      console.log('✅ Categories found:', rows.length);
      rows.forEach(row => {
        console.log(`  ${row.categoryId}: ${row.categoryNameAr} / ${row.categoryNameEn} / ${row.categoryNameFr}`);
      });
    }
  });
  
  // Test Arabic services table
  console.log('\n📋 Arabic services:');
  db.all('SELECT title, categoryName, AccessOnlineServiceUrl FROM services_arabic LIMIT 3', [], (err, rows) => {
    if (err) {
      console.error('❌ Error querying Arabic services:', err);
    } else {
      console.log('✅ Arabic services found:', rows.length);
      rows.forEach(row => {
        console.log(`  - ${row.title} (${row.categoryName})`);
        if (row.AccessOnlineServiceUrl) {
          console.log(`    🌐 Official URL: ${row.AccessOnlineServiceUrl}`);
        }
      });
    }
  });
  
  // Test French services table  
  console.log('\n📋 French services:');
  db.all('SELECT title, categoryName, AccessOnlineServiceUrl FROM services_french LIMIT 3', [], (err, rows) => {
    if (err) {
      console.error('❌ Error querying French services:', err);
    } else {
      console.log('✅ French services found:', rows.length);
      rows.forEach(row => {
        console.log(`  - ${row.title} (${row.categoryName})`);
        if (row.AccessOnlineServiceUrl) {
          console.log(`    🌐 Official URL: ${row.AccessOnlineServiceUrl}`);
        }
      });
    }
  });
  
  // Test English services table
  console.log('\n📋 English services:');
  db.all('SELECT title, categoryName, AccessOnlineServiceUrl FROM services_english LIMIT 3', [], (err, rows) => {
    if (err) {
      console.error('❌ Error querying English services:', err);
    } else {
      console.log('✅ English services found:', rows.length);
      rows.forEach(row => {
        console.log(`  - ${row.title} (${row.categoryName})`);
        if (row.AccessOnlineServiceUrl) {
          console.log(`    🌐 Official URL: ${row.AccessOnlineServiceUrl}`);
        }
      });
    }
  });
  
  // Get total counts
  setTimeout(() => {
    db.get('SELECT COUNT(*) as count FROM categories', [], (err, row) => {
      if (!err) console.log(`\n📊 Total categories: ${row.count}`);
    });
    
    db.get('SELECT COUNT(*) as count FROM services_arabic', [], (err, row) => {
      if (!err) console.log(`📊 Total Arabic services: ${row.count}`);
    });
    
    db.get('SELECT COUNT(*) as count FROM services_french', [], (err, row) => {
      if (!err) console.log(`📊 Total French services: ${row.count}`);
    });
    
    db.get('SELECT COUNT(*) as count FROM services_english', [], (err, row) => {
      if (!err) console.log(`📊 Total English services: ${row.count}`);
      db.close();
    });
  }, 1000);
}

// Install sqlite3 if needed
try {
  require('sqlite3');
  testSQLiteDatabase();
} catch (error) {
  console.log('Installing sqlite3...');
  require('child_process').exec('npm install sqlite3', (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Failed to install sqlite3:', err);
    } else {
      console.log('✅ sqlite3 installed, testing database...');
      testSQLiteDatabase();
    }
  });
}